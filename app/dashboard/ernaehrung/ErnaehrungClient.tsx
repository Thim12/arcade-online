'use client'

// ─────────────────────────────────────────────────────────────────
// ErnaehrungClient – Ernährungs-Dashboard
//
// Features:
//  • 3-Ring SVG Donut-Chart (Fett/Carbs/Protein)
//  • 8 SVG Wassergläser (animierter Fill von unten)
//  • 4 Mahlzeiten-Cards (Frühstück, Mittag, Abend, Snack)
//  • Bottom-Sheet (Radix Dialog) zum Hinzufügen von Lebensmitteln
//  • Lokale Suche (500ms Debounce, kein API-Call)
//  • Barcode-Scanner-Button (Beta, native BarcodeDetector API)
//  • Eigene Toast-Implementierung
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import type { LucideIcon } from 'lucide-react'
import {
  Sunrise, Sun, Sunset, Coffee,
  ChevronLeft, ChevronRight,
  Plus, Minus, X, Trash2,
  Search, Scan, Loader2,
  Zap, Droplets, Info,
  BarChart2, Settings, Utensils as UtensilsIcon,
} from 'lucide-react'
import Link from 'next/link'
import {
  FOOD_DATABASE,
  searchFoods,
  calculateMacros,
  FOOD_CATEGORY_LABELS,
} from '@/lib/food-database'
import type { FoodItem } from '@/lib/food-database'

// ─────────────────────────────────────────────────────────────────
// TYPEN
// ─────────────────────────────────────────────────────────────────

type MealType = 'FRUEHSTUECK' | 'MITTAGESSEN' | 'ABENDESSEN' | 'SNACK'

interface MealLogEntry {
  id: string
  mealType: MealType
  foodId: string
  foodName: string
  portionGrams: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  createdAt: string
}

interface DayTotals {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

interface LogData {
  mealLogs: MealLogEntry[]
  waterLog: { glasses: number }
  totals: DayTotals
  calorieTarget: number
}

interface Toast {
  id: number
  type: 'success' | 'error' | 'xp'
  message: string
}

// ─────────────────────────────────────────────────────────────────
// KONSTANTEN
// ─────────────────────────────────────────────────────────────────

const MEAL_CONFIG: Record<
  MealType,
  { label: string; sublabel: string; Icon: LucideIcon }
> = {
  FRUEHSTUECK: { label: 'Frühstück', sublabel: 'Morgens', Icon: Sunrise },
  MITTAGESSEN: { label: 'Mittagessen', sublabel: 'Mittags', Icon: Sun },
  ABENDESSEN: { label: 'Abendessen', sublabel: 'Abends', Icon: Sunset },
  SNACK: { label: 'Snack', sublabel: 'Zwischenmahlzeit', Icon: Coffee },
}

const MEAL_TYPES: MealType[] = ['FRUEHSTUECK', 'MITTAGESSEN', 'ABENDESSEN', 'SNACK']

// ─────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function todayDateStr(): string {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

// ─────────────────────────────────────────────────────────────────
// SVG DONUT RING (einzelner animierter Kreisring)
// ─────────────────────────────────────────────────────────────────

interface MacroRingProps {
  percentage: number   // 0–100+ (wird auf max 100 geclamped)
  radius: number
  strokeWidth: number
  color: string
  trackColor: string
}

function MacroRingArc({ percentage, radius, strokeWidth, color, trackColor }: MacroRingProps) {
  const circumference = 2 * Math.PI * radius
  const clampedFill = Math.min(Math.max(percentage / 100, 0), 1)
  const dashMotion = useMotionValue(0)
  const strokeDasharray = useTransform(
    dashMotion,
    (v: number) => `${v} ${circumference - v + 0.01}`,
  )

  useEffect(() => {
    const controls = animate(dashMotion, clampedFill * circumference, {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
    })
    return () => controls.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedFill, circumference])

  return (
    <>
      {/* Track (Hintergrundring) */}
      <circle
        cx={100}
        cy={100}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Filled arc */}
      <motion.circle
        cx={100}
        cy={100}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        transform="rotate(-90 100 100)"
        style={{ strokeDasharray }}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// SVG WASSERGLAS
// ─────────────────────────────────────────────────────────────────

interface WaterGlassProps {
  filled: boolean
  index: number
  onClick: () => void
}

function WaterGlass({ filled, index, onClick }: WaterGlassProps) {
  const glassId = `glass-clip-${index}`

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
      aria-label={filled ? `Glas ${index + 1} (voll) – entfernen` : `Glas ${index + 1} (leer) – hinzufügen`}
    >
      <svg viewBox="0 0 24 34" width="28" height="38" className="overflow-visible">
        <defs>
          <clipPath id={glassId}>
            <path d="M3 3 L21 3 L18.5 31 L5.5 31 Z" />
          </clipPath>
        </defs>

        {/* Water fill – animiert von unten */}
        <motion.rect
          x={0}
          width={24}
          fill="#3B82F6"
          opacity={0.75}
          initial={{ y: 34, height: 0 }}
          animate={filled ? { y: 4, height: 30 } : { y: 34, height: 0 }}
          transition={{ duration: 0.45, delay: filled ? index * 0.06 : 0, ease: [0.4, 0, 0.2, 1] }}
          clipPath={`url(#${glassId})`}
        />

        {/* Glas-Umriss (über dem Wasser gerendert) */}
        <path
          d="M3 3 L21 3 L18.5 31 L5.5 31 Z"
          fill="none"
          stroke={filled ? '#60A5FA' : 'rgb(75,85,99)'}
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="transition-colors duration-300"
        />

        {/* Deckel-Linie */}
        <line
          x1={3}
          y1={3}
          x2={21}
          y2={3}
          stroke={filled ? '#93C5FD' : 'rgb(75,85,99)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          className="transition-colors duration-300"
        />
      </svg>
      <span className={`text-[10px] font-medium transition-colors ${filled ? 'text-blue-400' : 'text-gray-600'}`}>
        {index + 1}
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// TOAST SYSTEM
// ─────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl border max-w-xs
              ${toast.type === 'error'
                ? 'bg-red-900/90 border-red-700 text-red-200'
                : toast.type === 'xp'
                  ? 'bg-yellow-900/90 border-yellow-600 text-yellow-200'
                  : 'bg-green-900/90 border-green-700 text-green-200'
              }`}
            onClick={() => onDismiss(toast.id)}
          >
            {toast.type === 'xp' && <Zap size={14} />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// LEBENSMITTEL-SUCHERGEBNIS
// ─────────────────────────────────────────────────────────────────

interface FoodResultItemProps {
  food: FoodItem
  isSelected: boolean
  onSelect: () => void
}

function FoodResultItem({ food, isSelected, onSelect }: FoodResultItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
        isSelected
          ? 'bg-green-900/40 border-green-700/60'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{food.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{FOOD_CATEGORY_LABELS[food.category]}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-white">{food.per100g.calories} kcal</p>
          <p className="text-xs text-gray-400">pro 100 g</p>
        </div>
      </div>
      <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
        <span>P {food.per100g.proteinG}g</span>
        <span>K {food.per100g.carbsG}g</span>
        <span>F {food.per100g.fatG}g</span>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// BOTTOM SHEET – Lebensmittel hinzufügen
// ─────────────────────────────────────────────────────────────────

interface FoodSheetProps {
  open: boolean
  onClose: () => void
  activeMealType: MealType
  onMealTypeChange: (t: MealType) => void
  onAddFood: (food: FoodItem, portionGrams: number, mealType: MealType) => Promise<void>
  isAdding: boolean
}

function FoodSheet({
  open,
  onClose,
  activeMealType,
  onMealTypeChange,
  onAddFood,
  isAdding,
}: FoodSheetProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [portionGrams, setPortionGrams] = useState(100)
  const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'scanning' | 'unsupported' | 'not-found'>('idle')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 500)
    return () => clearTimeout(t)
  }, [query])

  const results = useMemo(() => searchFoods(debouncedQuery), [debouncedQuery])

  const handleSelect = (food: FoodItem) => {
    setSelectedFood(food)
    setPortionGrams(food.defaultPortionGrams)
  }

  const macros = selectedFood ? calculateMacros(selectedFood, portionGrams) : null

  const handleAdd = async () => {
    if (!selectedFood) return
    await onAddFood(selectedFood, portionGrams, activeMealType)
    // Reset
    setQuery('')
    setDebouncedQuery('')
    setSelectedFood(null)
    setPortionGrams(100)
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setBarcodeStatus('idle')
  }, [])

  useEffect(() => {
    if (!open) {
      stopCamera()
      setQuery('')
      setDebouncedQuery('')
      setSelectedFood(null)
      setPortionGrams(100)
      setBarcodeStatus('idle')
    }
  }, [open, stopCamera])

  const handleBarcodeClick = async () => {
    if (barcodeStatus === 'scanning') {
      stopCamera()
      return
    }
    if (!('BarcodeDetector' in window)) {
      setBarcodeStatus('unsupported')
      return
    }
    setBarcodeStatus('scanning')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as unknown as { BarcodeDetector: new (opts: unknown) => { detect: (src: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
      const scanLoop = async () => {
        if (!streamRef.current || !videoRef.current) return
        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0) {
            stopCamera()
            setBarcodeStatus('not-found')
            setQuery(barcodes[0].rawValue)
          } else {
            requestAnimationFrame(() => { void scanLoop() })
          }
        } catch {
          requestAnimationFrame(() => { void scanLoop() })
        }
      }
      void scanLoop()
    } catch {
      stopCamera()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1117] border-t border-white/10 rounded-t-2xl max-h-[92vh] flex flex-col outline-none"
          onInteractOutside={onClose}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <Dialog.Title className="text-base font-semibold text-white">
              Lebensmittel hinzufügen
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Mahlzeiten-Tabs */}
          <Tabs.Root
            value={activeMealType}
            onValueChange={(v) => onMealTypeChange(v as MealType)}
            className="px-4 shrink-0"
          >
            <Tabs.List className="flex gap-1 bg-white/5 rounded-xl p-1">
              {MEAL_TYPES.map((type) => {
                const cfg = MEAL_CONFIG[type]
                return (
                  <Tabs.Trigger
                    key={type}
                    value={type}
                    className="flex-1 flex flex-col items-center py-1.5 px-1 rounded-lg text-xs font-medium transition-all
                      data-[state=active]:bg-[#16A34A] data-[state=active]:text-white
                      data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200"
                  >
                    <cfg.Icon size={13} />
                    <span className="mt-0.5 leading-tight">{cfg.label.split(' ')[0]}</span>
                  </Tabs.Trigger>
                )
              })}
            </Tabs.List>
          </Tabs.Root>

          {/* Suchzeile */}
          <div className="px-4 mt-3 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Lebensmittel suchen …"
                  className="w-full pl-9 pr-3 py-2.5 bg-white/8 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-600/60 focus:bg-white/10 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>
              <button
                onClick={() => { void handleBarcodeClick() }}
                className="relative flex items-center gap-1.5 px-3 py-2.5 bg-white/8 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/12 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <Scan size={15} />
                <span className="text-[10px] text-yellow-400 font-semibold">BETA</span>
              </button>
            </div>

            {barcodeStatus === 'unsupported' && (
              <p className="mt-1.5 text-xs text-yellow-400 flex items-center gap-1">
                <Info size={12} /> Barcode-Scanner nicht unterstützt – bitte manuell eingeben.
              </p>
            )}
            {barcodeStatus === 'not-found' && (
              <p className="mt-1.5 text-xs text-yellow-400 flex items-center gap-1">
                <Info size={12} /> Barcode nicht erkannt – bitte manuell suchen.
              </p>
            )}
          </div>

          {/* Kamera-Preview (bei Scanner) */}
          <AnimatePresence>
            {barcodeStatus === 'scanning' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 140, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mx-4 mt-2 overflow-hidden rounded-xl bg-black relative shrink-0"
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-12 border-2 border-green-400 rounded-lg opacity-70" />
                </div>
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suchergebnisse ODER Portions-Konfigurator */}
          <div className="flex-1 overflow-y-auto px-4 mt-3 pb-4">
            {selectedFood === null ? (
              <div className="flex flex-col gap-1.5">
                {results.length === 0 && debouncedQuery !== '' ? (
                  <p className="text-center text-gray-500 text-sm py-8">
                    Keine Treffer für „{debouncedQuery}"
                  </p>
                ) : (
                  results.map((food) => (
                    <FoodResultItem
                      key={food.id}
                      food={food}
                      isSelected={false}
                      onSelect={() => handleSelect(food)}
                    />
                  ))
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
              >
                {/* Ausgewähltes Lebensmittel */}
                <div className="flex items-start justify-between gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                  <div>
                    <p className="font-semibold text-white">{selectedFood.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{FOOD_CATEGORY_LABELS[selectedFood.category]}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Portionsgröße */}
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-2 block">Portion (g)</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPortionGrams((p) => Math.max(5, p - 10))}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 border border-white/10 text-white hover:bg-white/15 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={portionGrams}
                      onChange={(e) => setPortionGrams(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center py-2 bg-white/8 border border-white/10 rounded-xl text-white text-sm font-bold focus:outline-none focus:border-green-600/60 transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                      min={1}
                      max={2000}
                    />
                    <button
                      onClick={() => setPortionGrams((p) => Math.min(2000, p + 10))}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/8 border border-white/10 text-white hover:bg-white/15 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Schnellauswahl-Buttons */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedFood.portionOptions.map((g) => (
                      <button
                        key={g}
                        onClick={() => setPortionGrams(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                          portionGrams === g
                            ? 'bg-green-700 border-green-600 text-white'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {g} g
                      </button>
                    ))}
                  </div>
                </div>

                {/* Berechnete Nährwerte */}
                {macros && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'kcal', value: macros.calories, unit: '', color: 'text-white' },
                      { label: 'Protein', value: macros.proteinG, unit: 'g', color: 'text-blue-400' },
                      { label: 'Carbs', value: macros.carbsG, unit: 'g', color: 'text-orange-400' },
                      { label: 'Fett', value: macros.fatG, unit: 'g', color: 'text-yellow-400' },
                    ].map(({ label, value, unit, color }) => (
                      <div key={label} className="bg-white/5 rounded-xl p-2.5 text-center border border-white/8">
                        <p className={`text-base font-bold ${color}`}>
                          {value}{unit}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hinzufügen-Button */}
                <button
                  onClick={() => { void handleAdd() }}
                  disabled={isAdding}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#16A34A] hover:bg-[#15803D] disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
                >
                  {isAdding ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Zur {MEAL_CONFIG[activeMealType].label} hinzufügen
                </button>
              </motion.div>
            )}
          </div>

          {/* Attribution */}
          <div className="text-center py-2 text-[10px] text-gray-600 shrink-0 border-t border-white/5">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─────────────────────────────────────────────────────────────────
// MAHLZEITEN-CARD
// ─────────────────────────────────────────────────────────────────

interface MealCardProps {
  type: MealType
  entries: MealLogEntry[]
  onDelete: (id: string) => void
  onAdd: () => void
}

function MealCard({ type, entries, onDelete, onAdd }: MealCardProps) {
  const cfg = MEAL_CONFIG[type]
  const total = entries.reduce((s, e) => s + e.calories, 0)

  return (
    <motion.div
      layout
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            <cfg.Icon size={16} className="text-[#16A34A]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{cfg.label}</p>
            <p className="text-xs text-gray-400">{cfg.sublabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-xs font-bold text-green-400 tabular-nums">
              {total} kcal
            </span>
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#16A34A]/20 hover:bg-[#16A34A]/35 border border-[#16A34A]/30 text-green-400 text-xs font-medium transition-all"
          >
            <Plus size={12} />
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Einträge */}
      <AnimatePresence initial={false}>
        {entries.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-4 text-center text-xs text-gray-600"
          >
            Noch keine Einträge
          </motion.div>
        ) : (
          entries.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{entry.foodName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {entry.portionGrams} g · P {entry.proteinG}g · K {entry.carbsG}g · F {entry.fatG}g
                </p>
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <span className="text-sm font-bold text-white tabular-nums">{entry.calories}</span>
                <span className="text-xs text-gray-500">kcal</span>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  aria-label="Eintrag löschen"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
// HAUPT-KOMPONENTE
// ─────────────────────────────────────────────────────────────────

interface ErnaehrungClientProps {
  initialDate: string
}

export function ErnaehrungClient({ initialDate }: ErnaehrungClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [logData, setLogData] = useState<LogData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [activeMealType, setActiveMealType] = useState<MealType>('FRUEHSTUECK')
  const [isAdding, setIsAdding] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  // ── Toast ────────────────────────────────────────────────────
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ── Log laden ────────────────────────────────────────────────
  const fetchLog = useCallback(async (date: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/ernaehrung/log?date=${date}`)
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = (await res.json()) as LogData
      setLogData(data)
    } catch {
      addToast('error', 'Log konnte nicht geladen werden.')
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    void fetchLog(selectedDate)
  }, [selectedDate, fetchLog])

  // ── Datum-Navigation ─────────────────────────────────────────
  const isToday = selectedDate === todayDateStr()

  // ── Wasser-Update ────────────────────────────────────────────
  const handleWaterClick = useCallback(async (glassIndex: number) => {
    if (!logData) return
    const currentGlasses = logData.waterLog.glasses
    const newGlasses = glassIndex < currentGlasses ? glassIndex : glassIndex + 1
    const clamped = Math.min(8, Math.max(0, newGlasses))

    setLogData((prev) => prev ? { ...prev, waterLog: { glasses: clamped } } : prev)

    try {
      const res = await fetch('/api/ernaehrung/wasser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, glasses: clamped }),
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { earnedHydrationBadge?: boolean }
      if (data.earnedHydrationBadge) {
        addToast('xp', '+Badge: Hydrations-Champion! 7 Tage in Folge 8 Gläser.')
      }
    } catch {
      // Revert
      setLogData((prev) => prev ? { ...prev, waterLog: { glasses: currentGlasses } } : prev)
      addToast('error', 'Wasserzähler konnte nicht gespeichert werden.')
    }
  }, [logData, selectedDate, addToast])

  // ── Mahlzeit hinzufügen ──────────────────────────────────────
  const handleAddFood = useCallback(async (food: FoodItem, portionGrams: number, mealType: MealType) => {
    setIsAdding(true)
    const macros = calculateMacros(food, portionGrams)
    try {
      const res = await fetch('/api/ernaehrung/meal-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          mealType,
          foodId: food.id,
          foodName: food.name,
          portionGrams,
          ...macros,
        }),
      })
      if (!res.ok) throw new Error()
      const json = (await res.json()) as {
        data: {
          log: MealLogEntry
          xpAwarded: number
          newBadges: Array<{ name: string; xpReward: number }>
        }
      }
      const entry = json.data.log

      setLogData((prev) => {
        if (!prev) return prev
        const newLogs = [...prev.mealLogs, entry]
        const newTotals = newLogs.reduce(
          (acc, l) => ({
            calories: acc.calories + l.calories,
            proteinG: Math.round((acc.proteinG + l.proteinG) * 10) / 10,
            carbsG: Math.round((acc.carbsG + l.carbsG) * 10) / 10,
            fatG: Math.round((acc.fatG + l.fatG) * 10) / 10,
            fiberG: Math.round((acc.fiberG + l.fiberG) * 10) / 10,
          }),
          { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
        )
        return { ...prev, mealLogs: newLogs, totals: newTotals }
      })

      if (json.data.xpAwarded > 0) {
        addToast('xp', `+${json.data.xpAwarded} XP – Tagesziel zu 90–110 % erreicht!`)
      } else {
        addToast('success', `${food.name} zur ${MEAL_CONFIG[mealType].label} hinzugefügt.`)
      }
      setSheetOpen(false)
    } catch {
      addToast('error', 'Eintrag konnte nicht gespeichert werden.')
    } finally {
      setIsAdding(false)
    }
  }, [selectedDate, addToast])

  // ── Mahlzeit löschen ─────────────────────────────────────────
  const handleDeleteEntry = useCallback(async (id: string) => {
    if (!logData) return
    const entry = logData.mealLogs.find((l) => l.id === id)
    if (!entry) return

    setLogData((prev) => {
      if (!prev) return prev
      const newLogs = prev.mealLogs.filter((l) => l.id !== id)
      const newTotals = newLogs.reduce(
        (acc, l) => ({
          calories: acc.calories + l.calories,
          proteinG: Math.round((acc.proteinG + l.proteinG) * 10) / 10,
          carbsG: Math.round((acc.carbsG + l.carbsG) * 10) / 10,
          fatG: Math.round((acc.fatG + l.fatG) * 10) / 10,
          fiberG: Math.round((acc.fiberG + l.fiberG) * 10) / 10,
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      )
      return { ...prev, mealLogs: newLogs, totals: newTotals }
    })

    try {
      const res = await fetch(`/api/ernaehrung/meal-log/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      // Revert
      setLogData((prev) => {
        if (!prev) return prev
        const restored = [...prev.mealLogs, entry]
        const newTotals = restored.reduce(
          (acc, l) => ({
            calories: acc.calories + l.calories,
            proteinG: Math.round((acc.proteinG + l.proteinG) * 10) / 10,
            carbsG: Math.round((acc.carbsG + l.carbsG) * 10) / 10,
            fatG: Math.round((acc.fatG + l.fatG) * 10) / 10,
            fiberG: Math.round((acc.fiberG + l.fiberG) * 10) / 10,
          }),
          { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
        )
        return { ...prev, mealLogs: restored, totals: newTotals }
      })
      addToast('error', 'Eintrag konnte nicht gelöscht werden.')
    }
  }, [logData, addToast])

  // ── Abgeleitete Werte ────────────────────────────────────────
  const calorieTarget = logData?.calorieTarget ?? 2000
  const totals = logData?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  const caloriePercent = Math.round((totals.calories / calorieTarget) * 100)
  const waterGlasses = logData?.waterLog.glasses ?? 0

  // Makro-Ziele (Standard-Split: P 30%, C 45%, F 25%)
  const macroTargets = {
    proteinG: Math.round((calorieTarget * 0.30) / 4),
    carbsG: Math.round((calorieTarget * 0.45) / 4),
    fatG: Math.round((calorieTarget * 0.25) / 9),
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="min-h-screen bg-[#0A0C10]">

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          {/* Background image with overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80)',
              opacity: 0.08,
            }}
          />
          {/* CSS gradient fallback + overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A2218] via-[#0A1810] to-[#0A0C10]" />

          <div className="relative px-4 pt-8 pb-6">
            <h1 className="text-2xl font-bold text-white">Ernährung</h1>
            <p className="text-sm text-gray-400 mt-1">Verfolge deine Makros und Mahlzeiten.</p>

            {/* Datum-Navigation */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setSelectedDate((d) => offsetDate(d, -1))}
                className="p-2 rounded-xl bg-white/8 border border-white/10 text-gray-300 hover:bg-white/15 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm font-medium text-white">{formatDate(selectedDate)}</span>
                {isToday && (
                  <span className="ml-2 text-xs font-medium text-green-400 bg-green-400/15 px-2 py-0.5 rounded-full">
                    Heute
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedDate((d) => offsetDate(d, 1))}
                disabled={isToday}
                className="p-2 rounded-xl bg-white/8 border border-white/10 text-gray-300 hover:bg-white/15 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-32">

          {isLoading ? (
            <div className="flex justify-center pt-16">
              <Loader2 size={28} className="animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {/* ── KALORIENZIEL + MAKROS ──────────────────────── */}
              <div className="grid grid-cols-5 gap-3">

                {/* Donut-Chart */}
                <div className="col-span-2 bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center">
                  <div className="relative">
                    <svg viewBox="0 0 200 200" width="140" height="140">
                      {/* Fett (außen, gelb) */}
                      <MacroRingArc
                        percentage={(totals.fatG / macroTargets.fatG) * 100}
                        radius={82}
                        strokeWidth={13}
                        color="#EAB308"
                        trackColor="rgba(234,179,8,0.12)"
                      />
                      {/* Carbs (mitte, orange) */}
                      <MacroRingArc
                        percentage={(totals.carbsG / macroTargets.carbsG) * 100}
                        radius={65}
                        strokeWidth={13}
                        color="#F97316"
                        trackColor="rgba(249,115,22,0.12)"
                      />
                      {/* Protein (innen, blau) */}
                      <MacroRingArc
                        percentage={(totals.proteinG / macroTargets.proteinG) * 100}
                        radius={48}
                        strokeWidth={13}
                        color="#3B82F6"
                        trackColor="rgba(59,130,246,0.12)"
                      />
                      {/* Mittig: kcal */}
                      <text
                        x={100}
                        y={95}
                        textAnchor="middle"
                        className="font-bold"
                        fill="white"
                        fontSize={20}
                        fontFamily="inherit"
                      >
                        {totals.calories}
                      </text>
                      <text
                        x={100}
                        y={113}
                        textAnchor="middle"
                        fill="#9CA3AF"
                        fontSize={10}
                        fontFamily="inherit"
                      >
                        kcal
                      </text>
                    </svg>
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-xs text-gray-400">
                      {caloriePercent}% von {calorieTarget} kcal
                    </span>
                  </div>
                </div>

                {/* Makro-Details + Legende */}
                <div className="col-span-3 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Makros</p>
                  {[
                    { label: 'Protein', value: totals.proteinG, target: macroTargets.proteinG, color: '#3B82F6', unit: 'g' },
                    { label: 'Carbs', value: totals.carbsG, target: macroTargets.carbsG, color: '#F97316', unit: 'g' },
                    { label: 'Fett', value: totals.fatG, target: macroTargets.fatG, color: '#EAB308', unit: 'g' },
                    { label: 'Ballaststoffe', value: totals.fiberG, target: 30, color: '#6B7280', unit: 'g' },
                  ].map(({ label, value, target, color, unit }) => {
                    const pct = Math.min((value / target) * 100, 100)
                    return (
                      <div key={label} className="mb-2 last:mb-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{label}</span>
                          <span className="text-white font-medium tabular-nums">
                            {value}{unit} <span className="text-gray-500">/ {target}{unit}</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── WASSERZÄHLER ──────────────────────────────── */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-blue-400" />
                    <span className="text-sm font-semibold text-white">Wasser</span>
                  </div>
                  <span className="text-sm font-bold text-blue-400 tabular-nums">
                    {waterGlasses} / 8 Gläser
                  </span>
                </div>
                <div className="flex justify-between px-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <WaterGlass
                      key={i}
                      index={i}
                      filled={i < waterGlasses}
                      onClick={() => { void handleWaterClick(i) }}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Ziel: 8 Gläser · 2,0 Liter täglich
                </p>
              </div>

              {/* ── MAHLZEITEN-CARDS ───────────────────────────── */}
              {MEAL_TYPES.map((type) => {
                const entries = (logData?.mealLogs ?? []).filter((l) => l.mealType === type)
                return (
                  <MealCard
                    key={type}
                    type={type}
                    entries={entries}
                    onDelete={(id) => { void handleDeleteEntry(id) }}
                    onAdd={() => {
                      setActiveMealType(type)
                      setSheetOpen(true)
                    }}
                  />
                )
              })}

              {/* ── QUICK-LINKS ────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  { href: '/ernaehrung/statistiken',  Icon: BarChart2,    label: 'Statistiken' },
                  { href: '/ernaehrung/rezepte',       Icon: UtensilsIcon, label: 'Rezepte'     },
                  { href: '/ernaehrung/einstellungen', Icon: Settings,     label: 'Einstellungen' },
                ] as const).map(({ href, Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-1.5 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <Icon size={17} />
                    <span className="text-[11px] font-medium leading-tight text-center">{label}</span>
                  </Link>
                ))}
              </div>

              {/* Attribution */}
              <p className="text-center text-[10px] text-gray-600 mt-2">
                Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
              </p>

            </div>
          )}
        </div>
      </div>

      {/* ── FAB ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-4 z-30">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-[#16A34A] hover:bg-[#15803D] rounded-2xl text-white font-semibold shadow-lg shadow-green-900/40 transition-colors"
        >
          <Plus size={18} />
          Mahlzeit hinzufügen
        </motion.button>
      </div>

      {/* ── BOTTOM SHEET ─────────────────────────────────────────── */}
      <FoodSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        activeMealType={activeMealType}
        onMealTypeChange={setActiveMealType}
        onAddFood={handleAddFood}
        isAdding={isAdding}
      />
    </>
  )
}
