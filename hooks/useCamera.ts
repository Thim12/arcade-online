'use client'

// ─────────────────────────────────────────────────────────────────
// useCamera – Cross-Platform Bulletproof WebRTC Camera Hook
//
// Garantiert Kamera-Zugriff auf:
//  • iOS Safari (playsInline + muted + autoPlay Pflicht)
//  • macOS Safari / Chrome / Firefox
//  • Windows Chrome / Edge / Firefox
//  • Android Chrome / Samsung Internet
//
// Features:
//  • Dynamic Constraints Chain (facingMode Fallback-Kette)
//  • React Strict Mode Safety (useRef für Init-Tracking)
//  • Perfekter Cleanup (alle Tracks stoppen)
//  • Native File-Input Fallback Signal wenn WebRTC komplett fehlschlägt
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error' | 'fallback'

export interface CameraState {
  status: CameraStatus
  stream: MediaStream | null
  error: string | null
  /** true = getUserMedia komplett gescheitert, File-Input-Fallback nutzen */
  useFallback: boolean
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    status: 'idle',
    stream: null,
    error: null,
    useFallback: false,
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Strict Mode Safety: Prevent double-init
  const initRef = useRef(false)

  // ── Stop / Cleanup ──────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    initRef.current = false
    setState({ status: 'idle', stream: null, error: null, useFallback: false })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      initRef.current = false
    }
  }, [])

  // ── Start Camera ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    // Strict Mode Guard
    if (initRef.current) return
    initRef.current = true

    // Clean previous
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    setState({ status: 'requesting', stream: null, error: null, useFallback: false })

    // 1. Check if getUserMedia exists (needs HTTPS or localhost)
    if (!navigator.mediaDevices?.getUserMedia) {
      initRef.current = false
      setState({
        status: 'fallback',
        stream: null,
        error: 'Kein Kamerazugriff möglich (HTTPS erforderlich).',
        useFallback: true,
      })
      return
    }

    // 2. Dynamic Constraints Chain – try each strategy in order
    //    Key iOS fix: facingMode must use { ideal: "environment" }, NOT exact match
    const strategies: MediaStreamConstraints[] = [
      // A) Mobile-optimiert: Rückkamera mit ideal (nicht exact!)
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      // B) Desktop-Webcam: Keine facingMode-Einschränkung
      {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      // C) Absolut minimal – funktioniert überall wo eine Kamera existiert
      { video: true },
    ]

    let stream: MediaStream | null = null
    let lastError: Error | null = null

    for (const constraints of strategies) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        break
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        // Bei NotAllowedError (User hat abgelehnt) sofort aufhören
        if (lastError.name === 'NotAllowedError') break
      }
    }

    // 3. Kein Stream erhalten → Fallback auf File Input
    if (!stream) {
      initRef.current = false
      const isPermissionDenied = lastError?.name === 'NotAllowedError'

      setState({
        status: 'fallback',
        stream: null,
        error: isPermissionDenied
          ? 'Kamerazugriff wurde abgelehnt.'
          : 'Keine Kamera gefunden.',
        useFallback: true,
      })
      return
    }

    // 4. Stream erfolgreich – an Video-Element binden
    streamRef.current = stream

    if (videoRef.current) {
      const video = videoRef.current
      video.srcObject = stream

      // iOS Safari FIX: setAttribute für playsInline explizit setzen
      video.setAttribute('playsinline', 'true')
      video.setAttribute('muted', 'true')
      video.setAttribute('autoplay', 'true')
      video.muted = true

      try {
        await video.play()
      } catch {
        // play() kann auf iOS Safari manchmal beim ersten Mal fehlschlagen
        // Ein Retry nach kurzem Timeout hilft
        await new Promise((r) => setTimeout(r, 300))
        try {
          await video.play()
        } catch {
          // Stiller Fehler – Video startet meist trotzdem über autoPlay
        }
      }
    }

    setState({ status: 'active', stream, error: null, useFallback: false })
  }, [])

  return {
    state,
    videoRef,
    startCamera,
    stopStream,
  }
}
