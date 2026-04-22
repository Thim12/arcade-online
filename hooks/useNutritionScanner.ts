'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase-client'

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface ScannedProduct {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  category: string
  source: 'open_food_facts' | 'custom_db' | 'local_db'
  similarity?: number
  imageUrl?: string | null
}

export interface ScanState {
  mode: 'idle' | 'barcode' | 'visual'
  status: 'idle' | 'loading_model' | 'scanning' | 'processing' | 'found' | 'not_found' | 'error'
  product: ScannedProduct | null
  matches: ScannedProduct[]
  error: string | null
}

interface ScanResult {
  state: ScanState
  startBarcodeScan: () => Promise<void>
  startVisualScan: () => Promise<void>
  stopScan: () => void
  videoRef: React.RefObject<HTMLVideoElement | null>
  saveAsCustomProduct: (product: {
    name: string
    category: string
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
  }) => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
}

// ─────────────────────────────────────────────────────────────────
// DYNAMIC TF IMPORT (LAZY LOADING)
// ─────────────────────────────────────────────────────────────────

let tfModel: unknown | null = null
let modelLoading = false

async function loadMobileNetModel(): Promise<unknown> {
  if (tfModel) return tfModel
  if (modelLoading) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return loadMobileNetModel()
  }
  modelLoading = true
  try {
    const tf = await import('@tensorflow/tfjs')
    await tf.ready()
    const mobilenet = await import('@tensorflow-models/mobilenet')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tfModel = await (mobilenet as any).load({ version: 1, alpha: 1.0 })
    return tfModel
  } finally {
    modelLoading = false
  }
}

async function extractFeatureVector(videoElement: HTMLVideoElement): Promise<number[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (await loadMobileNetModel()) as any
  const logits = model.infer(videoElement, true) as { dataSync: () => Float32Array }
  const data = logits.dataSync()
  return Array.from(data)
}

// ─────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────

export function useNutritionScanner(): ScanResult {
  const [state, setState] = useState<ScanState>({
    mode: 'idle',
    status: 'idle',
    product: null,
    matches: [],
    error: null,
  })

  const [isAdmin, setIsAdmin] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Check admin role on mount ──────────────────────────────────
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/session')
        if (!res.ok) return
        const data = await res.json() as { user?: { role?: string } }
        setIsAdmin(data?.user?.role === 'ADMIN')
      } catch {
        setIsAdmin(false)
      }
    }
    void checkAdmin()
  }, [])

  // ── Cleanup on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopStream()
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Stream management ───────────────────────────────────────────

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // ── Barcode scan ────────────────────────────────────────────────

  const startBarcodeScan = useCallback(async () => {
    stopStream()
    setState((prev) => ({ ...prev, mode: 'barcode', status: 'scanning', product: null, matches: [], error: null }))

    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      if (!('BarcodeDetector' in window)) {
        setState((prev) => ({ ...prev, status: 'error', error: 'Barcode-Scanner wird von diesem Browser nicht unterstuetzt.' }))
        stopStream()
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })

      scanIntervalRef.current = setInterval(async () => {
        if (!streamRef.current || !videoRef.current) return
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            const barcode = barcodes[0].rawValue
            clearInterval(scanIntervalRef.current!)
            scanIntervalRef.current = null

            setState((prev) => ({ ...prev, status: 'processing' }))

            const res = await fetch(`/api/ernaehrung/scan/barcode?code=${encodeURIComponent(barcode)}`)
            if (!res.ok) {
              setState((prev) => ({ ...prev, status: 'not_found', error: 'Produkt nicht in der Datenbank gefunden.' }))
              return
            }
            const product = (await res.json()) as ScannedProduct
            product.source = 'open_food_facts'
            product.fiberG = product.fiberG ?? 0

            // Also try to find in local database as fallback
            setState((prev) => ({
              ...prev,
              status: 'found',
              product,
              matches: [product],
            }))
            stopStream()
          }
        } catch {
          // Continue scanning
        }
      }, 200)
    } catch {
      setState((prev) => ({ ...prev, status: 'error', error: 'Kamera konnte nicht gestartet werden.' }))
    }
  }, [])

  // ── Visual scan (MobileNet + Supabase vector search) ────────────

  const startVisualScan = useCallback(async () => {
    stopStream()
    setState((prev) => ({ ...prev, mode: 'visual', status: 'loading_model', product: null, matches: [], error: null }))

    try {
      await loadMobileNetModel()
    } catch {
      setState((prev) => ({ ...prev, status: 'error', error: 'KI-Modell konnte nicht geladen werden.' }))
      return
    }

    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setState((prev) => ({ ...prev, status: 'scanning' }))

      // Wait a moment for camera to stabilize, then capture frame
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (!videoRef.current || !streamRef.current) {
        setState((prev) => ({ ...prev, status: 'error', error: 'Kamera nicht verfuegbar.' }))
        stopStream()
        return
      }

      // Extract feature vector from video frame
      const currentVector = await extractFeatureVector(videoRef.current)
      stopStream() // Camera done

      setState((prev) => ({ ...prev, status: 'processing' }))

      // Search Supabase for similar products
      const res = await fetch('/api/ernaehrung/scan/similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding: currentVector }),
      })

      if (!res.ok) {
        setState((prev) => ({ ...prev, status: 'not_found', error: 'Aehnlichkeitssuche fehlgeschlagen.' }))
        return
      }

      interface SimilarityMatch {
        id: string
        name: string
        category: string
        calories: number
        protein: number
        carbs: number
        fat: number
        similarity: number
      }

      const data = (await res.json()) as { matches: SimilarityMatch[] }

      if (data.matches && data.matches.length > 0) {
        const bestMatch = data.matches[0]
        const product: ScannedProduct = {
          name: bestMatch.name,
          calories: bestMatch.calories,
          proteinG: bestMatch.protein,
          carbsG: bestMatch.carbs,
          fatG: bestMatch.fat,
          fiberG: 0,
          category: bestMatch.category,
          source: 'custom_db',
          similarity: bestMatch.similarity,
        }
        setState((prev) => ({
          ...prev,
          status: 'found',
          product,
          matches: data.matches.map((m) => ({
            name: m.name,
            calories: m.calories,
            proteinG: m.protein,
            carbsG: m.carbs,
            fatG: m.fat,
            fiberG: 0,
            category: m.category,
            source: 'custom_db' as const,
            similarity: m.similarity,
          })),
        }))
      } else {
        setState((prev) => ({ ...prev, status: 'not_found', error: 'Kein aehnliches Produkt gefunden. Du kannst es manuell hinzufuegen.' }))
      }
    } catch {
      setState((prev) => ({ ...prev, status: 'error', error: 'Fehler beim Scannen.' }))
      stopStream()
    }
  }, [])

  // ── Save custom product (admin training) ─────────────────────────

  const saveAsCustomProduct = useCallback(async (product: {
    name: string
    category: string
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
  }): Promise<{ success: boolean; error?: string }> => {
    // We need a current feature vector from video to save
    // For now, this requires the user to scan again from visual mode
    // and then the embedding will be captured for training
    try {
      const res = await fetch('/api/ernaehrung/scan/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (!res.ok) {
        return { success: false, error: data.error || 'Fehler beim Speichern' }
      }
      return { success: true }
    } catch {
      return { success: false, error: 'Netzwerkfehler' }
    }
  }, [])

  const stopScan = useCallback(() => {
    stopStream()
    setState((prev) => ({ ...prev, mode: 'idle', status: 'idle' }))
  }, [])

  return {
    state,
    startBarcodeScan,
    startVisualScan,
    stopScan,
    videoRef,
    saveAsCustomProduct,
    isAdmin,
  }
}