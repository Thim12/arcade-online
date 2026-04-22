'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, CheckSquare, PackagePlus, Loader2, ShieldCheck, Sparkles, ImagePlus, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useBatchScanner } from '@/hooks/useBatchScanner'

const CONSENT_KEY = 'sportrise-camera-consent'

interface Props {
  onClose: () => void
}

export function KuehlschrankScannerOverlay({ onClose }: Props) {
  const scanner = useBatchScanner()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Website-Consent: Hat der User der Kamera-Nutzung zugestimmt?
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(CONSENT_KEY) : null
    setHasConsent(stored === 'granted')
  }, [])

  const grantConsent = async () => {
    localStorage.setItem(CONSENT_KEY, 'granted')
    setHasConsent(true)
    await scanner.startScan()
  }

  const denyConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'denied')
    onClose()
  }

  const start = async () => {
    await scanner.startScan()
  }

  // File-Input Fallback Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await scanner.analyzeImage(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white font-semibold flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-green-400" />
            <span>Smart Inventory</span>
          </div>
          <button
            onClick={() => {
              scanner.stopScan()
              onClose()
            }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Hidden file input for fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Custom Permission Dialog (erscheint VOR Browser-Nachfrage) */}
        <AnimatePresence>
          {hasConsent === false && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-8 text-center"
            >
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/30 mb-5"
              >
                <Camera className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Kamera aktivieren?</h2>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                SportRise möchte deine Kamera für die <span className="font-semibold text-zinc-800">Live-Objekt-Erkennung</span> nutzen. Die Bilder werden ausschließlich lokal auf deinem Gerät verarbeitet.
              </p>

              {/* Privacy-Hinweise */}
              <div className="mt-5 w-full space-y-2.5 text-left">
                <div className="flex items-start gap-2.5 p-3 bg-zinc-50 rounded-xl">
                  <ShieldCheck size={18} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">100% lokal &amp; privat</p>
                    <p className="text-[11px] text-zinc-500">Keine Bilder verlassen dein Gerät.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-zinc-50 rounded-xl">
                  <Sparkles size={18} className="text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">KI erkennt Lebensmittel</p>
                    <p className="text-[11px] text-zinc-500">TensorFlow COCO-SSD direkt im Browser.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={denyConsent}
                  className="flex-1 py-3 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition"
                >
                  Ablehnen
                </button>
                <button
                  onClick={grantConsent}
                  className="flex-[1.5] py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl transition shadow-lg shadow-green-500/30"
                >
                  Kamera aktivieren
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error + Fallback Display */}
        {scanner.state.error && hasConsent && (
          <div className="mx-4 mt-16 mb-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <p className="font-semibold text-amber-800 mb-1">Kamera nicht verfügbar</p>
            <p className="text-xs text-amber-700/80 leading-relaxed mb-3">
              {scanner.state.error}
            </p>
            {scanner.state.errorCode === 'NotAllowedError' && (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3 leading-relaxed">
                💡 <strong>Tipp:</strong> Klicke auf das Kamera-Symbol in der Adressleiste deines Browsers und wähle &quot;Immer erlauben&quot;.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-[1.5] py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <ImagePlus size={14} />
                Foto aufnehmen / wählen
              </button>
              <button
                onClick={start}
                className="flex-1 py-2.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}

        {/* Video Area */}
        <div className="relative w-full aspect-[3/4] bg-zinc-900 rounded-[2.5rem] overflow-hidden">
          {scanner.state.isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white bg-zinc-900">
              <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
              <p className="text-sm font-medium">Lade KI-Modell (coco-ssd)...</p>
              <p className="text-xs text-zinc-500 mt-1">MobileNet v2 · direkt im Browser</p>
            </div>
          )}

          {/* iOS-CRITICAL: video MUST have autoPlay, playsInline, muted as HTML attributes */}
          <video
            ref={scanner.videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <canvas
            ref={scanner.canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Idle State: Camera ready but not scanning */}
          {!scanner.state.isScanning && !scanner.state.isLoading && hasConsent && !scanner.state.error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-950/40">
              <button
                onClick={start}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
              >
                <Camera className="w-8 h-8 text-green-600" />
              </button>
              <p className="mt-4 text-white font-medium text-center text-sm">
                Starte den Scanner, um Objekte in deinem Kühlschrank zu erfassen.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-white/70 text-xs flex items-center gap-1.5 hover:text-white transition"
              >
                <Upload size={12} />
                Oder Foto hochladen
              </button>
            </div>
          )}

          {/* Fallback: Nur File-Upload wenn Kamera komplett ausgefallen */}
          {scanner.state.useFallback && hasConsent && !scanner.state.isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-zinc-900">
              <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-5">
                <ImagePlus className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-white font-semibold text-center mb-2">
                Foto-Modus
              </p>
              <p className="text-zinc-400 text-xs text-center leading-relaxed mb-5 max-w-[250px]">
                Nimm ein Foto deines Kühlschranks auf und unsere KI analysiert den Inhalt.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-8 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30 flex items-center gap-2 hover:from-green-600 hover:to-emerald-700 transition"
              >
                <Camera size={16} />
                Foto aufnehmen
              </button>
            </div>
          )}

          {scanner.state.isScanning && (
            <div className="absolute bottom-6 right-6 text-xs text-white/50 bg-black/40 px-2 py-1 rounded-full">
              {scanner.state.fps} FPS
            </div>
          )}
        </div>

        {/* Detection List */}
        <div className="p-6 bg-[#FAFAFA]">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center justify-between">
            <span>Erkannte Lebensmittel ({scanner.state.items.length})</span>
          </h3>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            <AnimatePresence>
              {scanner.state.items.length === 0 && (scanner.state.isScanning || scanner.state.isLoading) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-zinc-400 text-center py-4"
                >
                  {scanner.state.isLoading ? 'Analysiere...' : 'Suche nach Lebensmitteln...'}
                </motion.div>
              )}
              {scanner.state.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-zinc-100"
                >
                  <span className="font-medium text-zinc-800 capitalize">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                      {Math.round(item.confidence * 100)}%
                    </span>
                    <button className="text-green-500 hover:opacity-80">
                      <CheckSquare size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            onClick={async () => {
              const res = await scanner.saveBatchedItems()
              if (res && typeof res === 'object' && res.success) {
                alert(`Erfolgreich gespeichert! (${typeof res.count === 'number' ? res.count : 0} Items)`)
                scanner.stopScan()
                onClose()
                router.refresh()
              } else if (res && typeof res === 'object' && res.error) {
                alert(`Fehler: ${res.error}`)
              }
            }}
            disabled={scanner.state.items.length === 0 || scanner.state.isLoading}
            className="w-full mt-4 bg-zinc-900 text-white rounded-2xl py-4 font-semibold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition flex justify-center items-center gap-2"
          >
            {scanner.state.isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : null}
            {scanner.state.items.length > 0 
              ? `${scanner.state.items.length} Items speichern` 
              : 'Warte auf Objekte...'}
          </button>

          {/* Privacy Footer */}
          <p className="mt-3 text-[10px] text-zinc-400 text-center leading-relaxed">
            Alle Bilddaten werden in Echtzeit lokal verarbeitet. Es erfolgt keine Speicherung deiner Fotos auf unseren Servern.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
