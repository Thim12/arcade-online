'use client'

// ─────────────────────────────────────────────────────────────────
// SmartVisionScanner – Standalone Client-Side Computer Vision
//
// Nutzt @tensorflow/tfjs + coco-ssd für Echtzeit-Objekterkennung.
// Wiederverwendbar auf /dashboard/fridge und als Overlay.
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  X,
  PackagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Trash2,
  Plus,
  ImagePlus,
  Upload,
} from 'lucide-react'

// ── Typen ─────────────────────────────────────────────────────────

interface DetectedItem {
  id: string
  name: string
  confidence: number
  bbox: [number, number, number, number]
  selected: boolean
}

interface SmartVisionScannerProps {
  onItemsConfirmed: (items: { name: string; confidence: number }[]) => Promise<void>
  className?: string
}

// Erlaubte Coco-SSD Klassen im Lebensmittel-Kontext
const FOOD_CLASSES = [
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot',
  'hot dog', 'pizza', 'donut', 'cake',
]

// Deutsche Labels für erkannte Klassen
const GERMAN_LABELS: Record<string, string> = {
  bottle: 'Flasche',
  'wine glass': 'Weinglas',
  cup: 'Tasse',
  fork: 'Gabel',
  knife: 'Messer',
  spoon: 'Löffel',
  bowl: 'Schüssel',
  banana: 'Banane',
  apple: 'Apfel',
  sandwich: 'Sandwich',
  orange: 'Orange',
  broccoli: 'Brokkoli',
  carrot: 'Karotte',
  'hot dog': 'Hot Dog',
  pizza: 'Pizza',
  donut: 'Donut',
  cake: 'Kuchen',
}

// ── Lazy TF.js Loader ─────────────────────────────────────────────

type CocoModel = { detect: (input: HTMLVideoElement | HTMLImageElement) => Promise<Array<{ class: string; score: number; bbox: [number, number, number, number] }>> }

let cachedModel: CocoModel | null = null
let isModelLoading = false

async function loadModel(): Promise<CocoModel> {
  if (cachedModel) return cachedModel
  if (isModelLoading) {
    await new Promise<void>((resolve) => setTimeout(resolve, 500))
    return loadModel()
  }
  isModelLoading = true
  try {
    const tf = await import('@tensorflow/tfjs')
    await tf.ready()
    const cocoSsd = await import('@tensorflow-models/coco-ssd')
    cachedModel = (await cocoSsd.load({ base: 'lite_mobilenet_v2' })) as CocoModel
    return cachedModel
  } finally {
    isModelLoading = false
  }
}

// ── Hauptkomponente ───────────────────────────────────────────────

export function SmartVisionScanner({ onItemsConfirmed, className = '' }: SmartVisionScannerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([])
  const [fps, setFps] = useState(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number>(0)
  const lastFrameTime = useRef(0)
  const scanningRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Cleanup ───────────────────────────────────────────────
  const stopScan = useCallback(() => {
    scanningRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }
    setIsScanning(false)
    setFps(0)
  }, [])

  useEffect(() => {
    return () => {
      scanningRef.current = false
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  // ── Bounding Box Rendering ────────────────────────────────────
  const renderPredictions = useCallback(
    (predictions: Array<{ class: string; score: number; bbox: [number, number, number, number] }>) => {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const newItems: DetectedItem[] = []

      predictions.forEach((pred) => {
        if (!FOOD_CLASSES.includes(pred.class) || pred.score < 0.4) return

        const [x, y, width, height] = pred.bbox

        // Premium Rounded Bounding Box
        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, width, height, 16)
        } else {
          ctx.rect(x, y, width, height)
        }
        ctx.strokeStyle = '#16A34A'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.fillStyle = 'rgba(22, 163, 74, 0.08)'
        ctx.fill()

        // Label-Badge
        const label = GERMAN_LABELS[pred.class] ?? pred.class
        const text = `${label} ${Math.round(pred.score * 100)}%`
        ctx.font = '600 13px Inter, system-ui, sans-serif'
        const textWidth = ctx.measureText(text).width

        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y - 30, textWidth + 16, 28, [10, 10, 0, 0])
        } else {
          ctx.rect(x, y - 30, textWidth + 16, 28)
        }
        ctx.fillStyle = '#16A34A'
        ctx.fill()

        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(text, x + 8, y - 10)

        newItems.push({
          id: `${pred.class}-${Math.round(x)}-${Math.round(y)}`,
          name: GERMAN_LABELS[pred.class] ?? pred.class,
          confidence: pred.score,
          bbox: pred.bbox,
          selected: true,
        })
      })

      // Merge: behalte vorherige Items, füge neue hinzu
      setDetectedItems((prev) => {
        const merged = [...prev]
        newItems.forEach((newItem) => {
          if (!merged.some((existing) => existing.name === newItem.name)) {
            merged.push(newItem)
          }
        })
        return merged
      })
    },
    [],
  )

  // ── Detection Loop ────────────────────────────────────────────
  const detectFrame = useCallback(async () => {
    const video = videoRef.current
    if (!scanningRef.current || !video || video.readyState < 2 || !cachedModel) {
      if (scanningRef.current) {
        frameRef.current = requestAnimationFrame(detectFrame)
      }
      return
    }

    try {
      const predictions = await cachedModel.detect(video)
      renderPredictions(predictions)
    } catch (e) {
      console.error('Detection error:', e)
    }

    const now = performance.now()
    const currentFps = Math.round(1000 / (now - (lastFrameTime.current || now) + 0.001))
    lastFrameTime.current = now
    setFps(currentFps)

    if (scanningRef.current) {
      frameRef.current = requestAnimationFrame(detectFrame)
    }
  }, [renderPredictions])

  // ── Kamera starten (direkt, kein Effect-Chain) ─────────────────────
  const startScan = useCallback(async () => {
    stopScan()
    setError(null)
    setErrorCode(null)
    setDetectedItems([])
    setUseFallback(false)
    setIsLoading(true)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Kamera nicht verfügbar (HTTPS erforderlich).')
      setErrorCode('NotSupportedError')
      setUseFallback(true)
      setIsLoading(false)
      return
    }

    const strategies: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true },
    ]

    let stream: MediaStream | null = null
    let lastErr: Error | null = null
    for (const c of strategies) {
      try { stream = await navigator.mediaDevices.getUserMedia(c); break }
      catch (e) { lastErr = e instanceof Error ? e : new Error(String(e)); if (lastErr.name === 'NotAllowedError' || lastErr.name === 'SecurityError') break }
    }

    if (!stream) {
      const code = lastErr?.name ?? 'UnknownError'
      const msgs: Record<string, string> = {
        NotAllowedError: 'Kamerazugriff wurde abgelehnt. Bitte erlaube den Zugriff in der Adressleiste.',
        NotFoundError: 'Keine Kamera gefunden.',
        NotReadableError: 'Kamera wird von einer anderen App genutzt.',
      }
      setError(msgs[code] ?? 'Kamera nicht verfügbar.')
      setErrorCode(code)
      setUseFallback(true)
      setIsLoading(false)
      return
    }

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

    try {
      await loadModel()
    } catch (err: unknown) {
      stream.getTracks().forEach((t) => t.stop())
      setError(err instanceof Error ? err.message : 'KI-Modell konnte nicht geladen werden.')
      setIsLoading(false)
      return
    }

    scanningRef.current = true
    setIsLoading(false)
    setIsScanning(true)
    frameRef.current = requestAnimationFrame(detectFrame)
  }, [stopScan, detectFrame])

  // ── Bild-Analyse Fallback ───────────────────────────────────────
  const analyzeImage = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    setDetectedItems([])
    try {
      const model = await loadModel()
      const img = new Image()
      const url = URL.createObjectURL(file)
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('Bild konnte nicht geladen werden.')); img.src = url })
      const predictions = await model.detect(img)
      URL.revokeObjectURL(url)
      const items: DetectedItem[] = []
      predictions.forEach((p) => {
        if (FOOD_CLASSES.includes(p.class) && p.score > 0.4 && !items.some((i) => i.name === (GERMAN_LABELS[p.class] ?? p.class))) {
          items.push({ id: `${p.class}-${Date.now()}`, name: GERMAN_LABELS[p.class] ?? p.class, confidence: p.score, bbox: p.bbox, selected: true })
        }
      })
      setDetectedItems(items)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Toggle Item Selection ─────────────────────────────────────
  const toggleItem = (id: string) => {
    setDetectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    )
  }

  const removeItem = (id: string) => {
    setDetectedItems((prev) => prev.filter((item) => item.id !== id))
  }

  // ── Confirm & Save ────────────────────────────────────────────
  const handleConfirm = async () => {
    const selected = detectedItems.filter((i) => i.selected)
    if (selected.length === 0) return

    setIsSaving(true)
    try {
      await onItemsConfirmed(selected.map((i) => ({ name: i.name, confidence: i.confidence })))
      setDetectedItems([])
      stopScan()
    } catch {
      setError('Speichern fehlgeschlagen.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedCount = detectedItems.filter((i) => i.selected).length

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={`w-full max-w-lg mx-auto ${className}`}>
      <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-zinc-200">
        {/* Video Area */}
        <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white bg-zinc-900/80 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 animate-spin text-green-500 mb-4" />
              <p className="text-sm font-semibold">Lade KI-Modell...</p>
              <p className="text-xs text-zinc-400 mt-1">coco-ssd (MobileNet v2)</p>
            </div>
          )}

          {/* iOS-CRITICAL: video MUST have autoPlay, playsInline, muted */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Hidden file input for native fallback */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzeImage(f) }} className="hidden" />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Idle State – Start-Button */}
          {!isScanning && !isLoading && !useFallback && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startScan}
                className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center"
              >
                <Camera className="w-9 h-9 text-green-600" />
              </motion.button>
              <p className="mt-4 text-white text-sm font-medium text-center px-8">
                Richte die Kamera auf deinen Kühlschrank
              </p>
              <button onClick={() => fileInputRef.current?.click()} className="mt-3 text-white/60 text-xs flex items-center gap-1.5 hover:text-white transition">
                <Upload size={12} /> Oder Foto hochladen
              </button>
            </div>
          )}

          {/* Fallback: File-Upload wenn Kamera komplett ausgefallen */}
          {useFallback && !isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 bg-zinc-900">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <ImagePlus className="w-9 h-9 text-green-500" />
              </div>
              <p className="text-white font-semibold text-center mb-1">Foto-Modus</p>
              <p className="text-zinc-400 text-xs text-center leading-relaxed mb-4 max-w-[220px]">Nimm ein Foto auf – die KI analysiert den Inhalt.</p>
              <button onClick={() => fileInputRef.current?.click()} className="py-2.5 px-6 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg flex items-center gap-2">
                <Camera size={16} /> Foto aufnehmen
              </button>
            </div>
          )}

          {/* FPS Badge */}
          {isScanning && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="bg-green-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                <ScanLine size={12} />
                Live
              </div>
              <div className="bg-black/50 backdrop-blur-md text-white/70 px-2.5 py-1.5 rounded-full text-xs font-medium">
                {fps} FPS
              </div>
            </div>
          )}

          {/* Stop Button */}
          {isScanning && (
            <button
              onClick={stopScan}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-5 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <p className="leading-relaxed flex-1 text-amber-800">{error}</p>
            </div>
            {errorCode === 'NotAllowedError' && (
              <p className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 leading-relaxed">
                💡 <strong>Tipp:</strong> Klicke auf das Kamera-Symbol in der Adressleiste und wähle &quot;Immer erlauben&quot;.
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => fileInputRef.current?.click()} className="flex-[1.5] py-2 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg transition flex items-center justify-center gap-1">
                <ImagePlus size={12} /> Foto aufnehmen / wählen
              </button>
              <button onClick={startScan} className="flex-1 py-2 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition">
                Erneut versuchen
              </button>
            </div>
          </motion.div>
        )}

        {/* Detected Items List */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <PackagePlus size={16} className="text-green-600" />
              Erkannte Lebensmittel
              {detectedItems.length > 0 && (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {detectedItems.length}
                </span>
              )}
            </h3>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {detectedItems.length === 0 && (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-zinc-400 text-center py-6"
                >
                  {isScanning ? 'Suche nach Lebensmitteln...' : 'Starte den Scanner, um Objekte zu erkennen.'}
                </motion.p>
              )}

              {detectedItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    item.selected
                      ? 'bg-green-50 border-green-200'
                      : 'bg-zinc-50 border-zinc-200 opacity-60'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        item.selected
                          ? 'bg-green-600 border-green-600'
                          : 'border-zinc-300 bg-white'
                      }`}
                    >
                      {item.selected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <span className="font-medium text-zinc-800 capitalize">{item.name}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-semibold">
                      {Math.round(item.confidence * 100)}%
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Confirm Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isSaving}
            className="w-full mt-4 bg-zinc-900 text-white rounded-2xl py-4 font-semibold shadow-xl
              disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800
              transition-all flex justify-center items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            {selectedCount > 0
              ? `${selectedCount} ${selectedCount === 1 ? 'Item' : 'Items'} zum Kühlschrank hinzufügen`
              : 'Warte auf Erkennung...'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
