'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface BatchItem {
  id: string
  name: string
  confidence: number
  bbox: [number, number, number, number] // [x, y, width, height]
  saved: boolean
}

interface ScanState {
  isScanning: boolean
  isLoading: boolean
  error: string | null
  errorCode: string | null
  items: BatchItem[]
  fps: number
  useFallback: boolean
}

// Erlaubte Coco-SSD Klassen, die im Bereich Essen/Kühlschrank Sinn machen
const FOOD_CLASSES = [
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 
  'hot dog', 'pizza', 'donut', 'cake'
]

// ─────────────────────────────────────────────────────────────────
// LAZY TF IMPORT
// ─────────────────────────────────────────────────────────────────
let cocoModel: any = null
let modelLoading = false

async function loadCocoModel() {
  if (cocoModel) return cocoModel
  if (modelLoading) {
    await new Promise((r) => setTimeout(r, 500))
    return loadCocoModel()
  }
  modelLoading = true
  try {
    const tf = await import('@tensorflow/tfjs')
    await tf.ready()
    const cocoSsd = await import('@tensorflow-models/coco-ssd')
    cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' })
    return cocoModel
  } finally {
    modelLoading = false
  }
}

export function useBatchScanner() {
  const [state, setState] = useState<ScanState>({
    isScanning: false,
    isLoading: false,
    error: null,
    errorCode: null,
    items: [],
    fps: 0,
    useFallback: false,
  })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const requestRef = useRef<number>()
  const lastFrameTime = useRef<number>(0)
  const scanningRef = useRef(false)

  // ── Stream Stop ─────────────────────────────────────────────────
  const stopScan = useCallback(() => {
    scanningRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = undefined
    }
    setState((prev) => ({ ...prev, isScanning: false, items: [], fps: 0 }))
  }, [])

  useEffect(() => {
    return () => {
      scanningRef.current = false
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  // ── Render Bounding Boxes ───────────────────────────────────────
  const renderPredictions = useCallback((predictions: any[]) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const newItems: BatchItem[] = []

    predictions.forEach((prediction: any) => {
      if (FOOD_CLASSES.includes(prediction.class) && prediction.score > 0.4) {
        const [x, y, width, height] = prediction.bbox

        // Premium Apple-Style Box
        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, width, height, 16)
        } else {
          ctx.rect(x, y, width, height)
        }
        ctx.strokeStyle = '#16A34A'
        ctx.lineWidth = 3
        ctx.stroke()
        
        // Inner Glow / Backdrop Simulation
        ctx.fillStyle = 'rgba(22, 163, 74, 0.1)'
        ctx.fill()

        // Label Background
        ctx.fillStyle = '#16A34A'
        const text = `${prediction.class} ${Math.round(prediction.score * 100)}%`
        const textWidth = ctx.measureText(text).width
        
        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y - 28, textWidth + 16, 28, [8, 8, 0, 0])
        } else {
          ctx.rect(x, y - 28, textWidth + 16, 28)
        }
        ctx.fill()

        // Text
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '600 14px Inter, sans-serif'
        ctx.fillText(text, x + 8, y - 8)

        newItems.push({
          id: `${prediction.class}-${Math.round(x)}-${Math.round(y)}`,
          name: prediction.class,
          confidence: prediction.score,
          bbox: prediction.bbox,
          saved: false,
        })
      }
    })

    // Update state with newly found items
    setState((prev) => {
      const merged = [...prev.items]
      newItems.forEach((newItem) => {
        const existing = merged.find(i => i.name === newItem.name)
        if (!existing) {
          merged.push(newItem)
        }
      })
      return { ...prev, items: merged }
    })
  }, [])

  // ── Detektionsschleife (Live Stream) ─────────────────────────────
  const detectFrame = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2 || !cocoModel || !scanningRef.current) {
      if (scanningRef.current) requestRef.current = requestAnimationFrame(detectFrame)
      return
    }

    try {
      const predictions = await cocoModel.detect(video)
      renderPredictions(predictions)
    } catch (e) {
      console.error(e)
    }

    const t1 = performance.now()
    const currentFps = Math.round(1000 / (t1 - (lastFrameTime.current || t1) + 0.001))
    lastFrameTime.current = t1

    setState((prev) => ({ ...prev, fps: currentFps }))

    if (scanningRef.current) {
      requestRef.current = requestAnimationFrame(detectFrame)
    }
  }, [renderPredictions])

  // ── Kamera starten (iOS + Desktop bulletproof, kein Effect-Chain) ─────
  const startScan = useCallback(async () => {
    stopScan()
    setState((prev) => ({
      ...prev,
      error: null,
      errorCode: null,
      items: [],
      useFallback: false,
      isScanning: true,
      isLoading: true,
    }))

    // 1. getUserMedia verfügbar?
    if (!navigator.mediaDevices?.getUserMedia) {
      setState((prev) => ({
        ...prev,
        isScanning: false,
        isLoading: false,
        error: 'Kamera nicht verfügbar (HTTPS erforderlich).',
        errorCode: 'NotSupportedError',
        useFallback: true,
      }))
      return
    }

    // 2. iOS-safe Constraints Chain
    // • facingMode „ideal“ (nicht exact!) → Desktop nimmt einfach die Webcam
    // • Kein Constraint → universeller Fallback
    const strategies: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
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
        if (lastError.name === 'NotAllowedError' || lastError.name === 'SecurityError') break
      }
    }

    if (!stream) {
      const code = lastError?.name ?? 'UnknownError'
      const msgs: Record<string, string> = {
        NotAllowedError: 'Kamerazugriff wurde abgelehnt. Bitte erlaube den Zugriff in der Adressleiste des Browsers.',
        NotFoundError: 'Keine Kamera gefunden. Bitte prüfe, ob eine Kamera angeschlossen ist.',
        NotReadableError: 'Kamera wird von einer anderen App genutzt. Bitte schließe andere Apps.',
      }
      setState((prev) => ({
        ...prev,
        isScanning: false,
        isLoading: false,
        error: msgs[code] ?? 'Kamera nicht verfügbar.',
        errorCode: code,
        useFallback: true,
      }))
      return
    }

    // 3. Stream an Video-Element binden (iOS-kritisch)
    streamRef.current = stream
    const video = videoRef.current
    if (video) {
      video.srcObject = stream
      video.setAttribute('playsinline', 'true')
      video.muted = true
      try { await video.play() } catch {
        await new Promise((r) => setTimeout(r, 200))
        try { await video.play() } catch { /* autoPlay übernimmt */ }
      }
    }

    // 4. KI-Modell laden
    try {
      await loadCocoModel()
    } catch (err: any) {
      stream.getTracks().forEach((t) => t.stop())
      setState((prev) => ({
        ...prev,
        isScanning: false,
        isLoading: false,
        error: err.message || 'KI-Modell konnte nicht geladen werden.',
        errorCode: 'ModelError',
      }))
      return
    }

    // 5. Detection starten
    scanningRef.current = true
    setState((prev) => ({ ...prev, isLoading: false }))
    requestRef.current = requestAnimationFrame(detectFrame)
  }, [stopScan, detectFrame])

  // ── Bild aus File-Input analysieren (Fallback) ──────────────────
  const analyzeImage = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null, items: [] }))

    try {
      await loadCocoModel()

      const img = new Image()
      const url = URL.createObjectURL(file)

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'))
        img.src = url
      })

      const predictions = await cocoModel.detect(img)
      URL.revokeObjectURL(url)

      const items: BatchItem[] = []
      predictions.forEach((pred: any) => {
        if (FOOD_CLASSES.includes(pred.class) && pred.score > 0.4) {
          if (!items.some((i) => i.name === pred.class)) {
            items.push({
              id: `${pred.class}-${Date.now()}`,
              name: pred.class,
              confidence: pred.score,
              bbox: pred.bbox,
              saved: false,
            })
          }
        }
      })

      setState((prev) => ({ ...prev, isLoading: false, items }))
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Analyse fehlgeschlagen.',
      }))
    }
  }, [])

  const saveBatchedItems = async () => {
    if (state.items.length === 0) return { success: false, error: 'Keine Items zum Speichern' }
    
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      const res = await fetch('/api/ernaehrung/inventory/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state.items })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen')
      
      // Cleanup
      setState(prev => ({ ...prev, items: [] }))
      return { success: true, count: data.count }
    } catch (e: any) {
      return { success: false, error: e.message }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  return {
    state,
    videoRef,
    canvasRef,
    startScan,
    stopScan,
    saveBatchedItems,
    analyzeImage,
  }
}
