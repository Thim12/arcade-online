'use client'

// ─────────────────────────────────────────────────────────────────
// ErnaehrungClient – Ernaehrungs-Dashboard
//
// Features:
//  • 3-Ring SVG Donut-Chart (Fett/Carbs/Protein)
//  • 8 SVG Wasserglaeser (animierter Fill von unten)
//  • 4 Mahlzeiten-Cards (Fruehstueck, Mittag, Abend, Snack)
//  • Bottom-Sheet (Radix Dialog) zum Hinzufuegen von Lebensmitteln
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
  Package, Sparkles, ServerCrash, Timer
} from 'lucide-react'
import Link from 'next/link'
import {
  FOOD_DATABASE,
  searchFoods,
  calculateMacros,
  FOOD_CATEGORY_LABELS,
} from '@/lib/food-database'
import type { FoodItem } from '@/lib/food-database'
import { ErnaehrungScannerOverlay } from './ErnaehrungScannerOverlay'
import { KuehlschrankScannerOverlay } from './KuehlschrankScannerOverlay'

// ─────────────────────────────────────────────────────────────────
// TYPEN
// ─────────────────────────────────────────────────────────────────

export type MealType = 'FRUEHSTUECK' | 'MITTAGESSEN' | 'ABENDESSEN' | 'SNACK'

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

// ── INIT ───────────────────────────────────────────────────────────────
// KONSTANTEN
// ─────────────────────────────────────────────────────────────────

const MEAL_CONFIG: Record<
  MealType,
  { label: string; sublabel: string; Icon: LucideIcon }
> = {
  FRUEHSTUECK: { label: 'Fruehstueck', sublabel: 'Morgens', Icon: Sunrise },
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
// SVG DONUT RING
// ─────────────────────────────────────────────────────────────────

interface MacroRingProps {
  percentage: number
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
      <circle
        cx={100}
        cy={100}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
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
      aria-label={filled ? `Glas ${index + 1} (voll) – entfernen` : `Glas ${index + 1} (leer) – hinzufuegen`}
    >
      <svg viewBox="0 0 24 34" width="28" height="38" className="overflow-visible">
        <defs>
          <clipPath id={glassId}>
            <path d="M3 3 L21 3 L18.5 31 L5.5 31 Z" />
          </clipPath>
        </defs>

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

        <path
          d="M3 3 L21 3 L18.5 31 L5.5 31 Z"
          fill="none"
          stroke={filled ? '#60A5FA' : '#d4d4d8'}
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="transition-colors duration-300"
        />

        <line
          x1={3}
          y1={3}
          x2={21}
          y2={3}
          stroke={filled ? '#93C5FD' : '#d4d4d8'}
          strokeWidth="1.5"
          strokeLinecap="round"
          className="transition-colors duration-300"
        />
      </svg>
      <span className={`text-[10px] font-medium transition-colors ${filled ? 'text-blue-500' : 'text-zinc-400'}`}>
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
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg border max-w-xs
              ${toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : toast.type === 'xp'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-green-50 border-green-200 text-green-700'
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
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900 truncate">{food.name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{FOOD_CATEGORY_LABELS[food.category]}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-zinc-900">{food.per100g.calories} kcal</p>
          <p className="text-xs text-zinc-400">pro 100 g</p>
        </div>
      </div>
      <div className="flex gap-3 mt-1.5 text-xs text-zinc-400">
        <span>P {food.per100g.proteinG}g</span>
        <span>K {food.per100g.carbsG}g</span>
        <span>F {food.per100g.fatG}g</span>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// BOTTOM SHEET – Lebensmittel hinzufuegen
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
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 rounded-t-2xl max-h-[92vh] flex flex-col outline-none shadow-2xl"
          onInteractOutside={onClose}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-zinc-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <Dialog.Title className="text-base font-semibold text-zinc-900">
              Lebensmittel hinzufuegen
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors">
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
            <Tabs.List className="flex gap-1 bg-zinc-100 rounded-xl p-1">
              {MEAL_TYPES.map((type) => {
                const cfg = MEAL_CONFIG[type]
                return (
                  <Tabs.Trigger
                    key={type}
                    value={type}
                    className="flex-1 flex flex-col items-center py-1.5 px-1 rounded-lg text-xs font-medium transition-all
                      data-[state=active]:bg-[#16A34A] data-[state=active]:text-white
                      data-[state=inactive]:text-zinc-500 data-[state=inactive]:hover:text-zinc-700"
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
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Lebensmittel suchen …"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/30 transition-all"
                />
              </div>
              <button
                onClick={() => { void handleBarcodeClick() }}
                className="relative flex items-center gap-1.5 px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
              >
                <Scan size={15} />
                <span className="text-[10px] text-amber-500 font-semibold">BETA</span>
              </button>
            </div>

            {barcodeStatus === 'unsupported' && (
              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                <Info size={12} /> Barcode-Scanner nicht unterstuetzt – bitte manuell eingeben.
              </p>
            )}
            {barcodeStatus === 'not-found' && (
              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                <Info size={12} /> Barcode nicht erkannt – bitte manuell suchen.
              </p>
            )}
          </div>

          {/* Kamera-Preview */}
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
                  <p className="text-center text-zinc-400 text-sm py-8">
                    Keine Treffer fuer &ldquo;{debouncedQuery}&rdquo;
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
                {/* Ausgewaehltes Lebensmittel */}
                <div className="flex items-start justify-between gap-3 bg-zinc-50 rounded-xl p-3 border border-zinc-200">
                  <div>
                    <p className="font-semibold text-zinc-900">{selectedFood.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{FOOD_CATEGORY_LABELS[selectedFood.category]}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Portionsgroesse */}
                <div>
                  <label className="text-xs text-zinc-500 font-medium mb-2 block">Portion (g)</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPortionGrams((p) => Math.max(5, p - 10))}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={portionGrams}
                      onChange={(e) => setPortionGrams(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center py-2 bg-white border border-zinc-200 rounded-xl text-zinc-900 text-sm font-bold focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/30 transition-all"
                      min={1}
                      max={2000}
                    />
                    <button
                      onClick={() => setPortionGrams((p) => Math.min(2000, p + 10))}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
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
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {g} g
                      </button>
                    ))}
                  </div>
                </div>

                {/* Berechnete Naehrwerte */}
                {macros && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'kcal', value: macros.calories, unit: '', color: 'text-zinc-900' },
                      { label: 'Protein', value: macros.proteinG, unit: 'g', color: 'text-blue-600' },
                      { label: 'Carbs', value: macros.carbsG, unit: 'g', color: 'text-orange-600' },
                      { label: 'Fett', value: macros.fatG, unit: 'g', color: 'text-yellow-600' },
                    ].map(({ label, value, unit, color }) => (
                      <div key={label} className="bg-zinc-50 rounded-xl p-2.5 text-center border border-zinc-100">
                        <p className={`text-base font-bold ${color}`}>
                          {value}{unit}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hinzufuegen-Button */}
                <button
                  onClick={() => { void handleAdd() }}
                  disabled={isAdding}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#16A34A] hover:bg-[#15803D] disabled:bg-zinc-300 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
                >
                  {isAdding ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Zur {MEAL_CONFIG[activeMealType].label} hinzufuegen
                </button>
              </motion.div>
            )}
          </div>

          {/* Attribution */}
          <div className="text-center py-2 text-[10px] text-zinc-400 shrink-0 border-t border-zinc-100">
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
      className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
            <cfg.Icon size={16} className="text-[#16A34A]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{cfg.label}</p>
            <p className="text-xs text-zinc-400">{cfg.sublabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-xs font-bold text-green-600 tabular-nums">
              {total} kcal
            </span>
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-medium transition-all"
          >
            <Plus size={12} />
            Hinzufuegen
          </button>
        </div>
      </div>

      {/* Eintraege */}
      <AnimatePresence initial={false}>
        {entries.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-4 text-center text-xs text-zinc-400"
          >
            Noch keine Eintraege
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
              className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-900 truncate">{entry.foodName}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {entry.portionGrams} g · P {entry.proteinG}g · K {entry.carbsG}g · F {entry.fatG}g
                </p>
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <span className="text-sm font-bold text-zinc-900 tabular-nums">{entry.calories}</span>
                <span className="text-xs text-zinc-400">kcal</span>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  aria-label="Eintrag loeschen"
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
  const [showKuehlschrank, setShowKuehlschrank] = useState(false)
  const [smartRecipes, setSmartRecipes] = useState<any[]>([])
  const [isGeneriertingRecipes, setIsGeneratingRecipes] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)
  const toastCounter = useRef(0)

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

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

  const isToday = selectedDate === todayDateStr()

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
        addToast('xp', '+Badge: Hydrations-Champion! 7 Tage in Folge 8 Glaeser.')
      }
    } catch {
      setLogData((prev) => prev ? { ...prev, waterLog: { glasses: currentGlasses } } : prev)
      addToast('error', 'Wasserzaehler konnte nicht gespeichert werden.')
    }
  }, [logData, selectedDate, addToast])

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
        addToast('success', `${food.name} zur ${MEAL_CONFIG[mealType].label} hinzugefuegt.`)
      }
      setSheetOpen(false)
    } catch {
      addToast('error', 'Eintrag konnte nicht gespeichert werden.')
    } finally {
      setIsAdding(false)
    }
  }, [selectedDate, addToast])

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
      addToast('error', 'Eintrag konnte nicht geloescht werden.')
    }
  }, [logData, addToast])

  const calorieTarget = logData?.calorieTarget ?? 2000
  const totals = logData?.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  const caloriePercent = Math.round((totals.calories / calorieTarget) * 100)
  const waterGlasses = logData?.waterLog.glasses ?? 0

  const macroTargets = {
    proteinG: Math.round((calorieTarget * 0.30) / 4),
    carbsG: Math.round((calorieTarget * 0.45) / 4),
    fatG: Math.round((calorieTarget * 0.25) / 9),
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="min-h-screen bg-zinc-50">

        {/* ── Breadcrumb ───────────────────────────────────────────── */}
        <div className="px-4 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <ChevronLeft size={14} />
            Zurück zum Dashboard
          </Link>
          <span className="text-zinc-300 mx-1.5">/</span>
          <span className="text-sm font-semibold text-zinc-900">Ernährung</span>
        </div>

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden mx-4 mt-4 rounded-2xl">
          {/* Multi-Sport Unsplash backgrounds */}
          <div className="absolute inset-0 grid grid-cols-2 gap-px" aria-hidden="true">
            <div className="relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=60"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1543352681-254057608e41?w=600&q=60"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>
          <div className="absolute inset-0 bg-white/90" />

          {/* Green accent blob */}
          <div
            className="absolute rounded-full blur-3xl pointer-events-none"
            style={{
              top: -30,
              right: -30,
              width: 200,
              height: 200,
              background: '#16A34A',
              opacity: 0.08,
            }}
          />

          <div className="relative px-5 pt-5 pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shadow-sm">
                <UtensilsIcon size={20} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">Ernährung</h1>
                <p className="text-sm text-zinc-500">Verfolge deine Makros, Mahlzeiten und Wasser.</p>
              </div>
            </div>

            {/* Datum-Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDate((d) => offsetDate(d, -1))}
                className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm font-medium text-zinc-900">{formatDate(selectedDate)}</span>
                {isToday && (
                  <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    Heute
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedDate((d) => offsetDate(d, 1))}
                disabled={isToday}
                className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-32">

          {isLoading ? (
            <div className="flex justify-center pt-16">
              <Loader2 size={28} className="animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {/* ── Tagesziel-Karte ──────────────────────────────────── */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tagesziel</span>
                  <span className="text-xs font-bold tabular-nums text-green-600">{caloriePercent}% erreicht</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-zinc-900 tabular-nums">{totals.calories}</span>
                  <span className="text-sm text-zinc-400">/ {calorieTarget} kcal</span>
                </div>
                <div className="mt-3 rounded-full overflow-hidden bg-zinc-100" style={{ height: 6 }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: caloriePercent > 100 ? '#EF4444' : '#16A34A',
                      transition: 'width 0.8s ease',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(caloriePercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* ── KALORIENZIEL + MAKROS ──────────────────────── */}
              <div className="grid grid-cols-5 gap-3">

                {/* Donut-Chart */}
                <div className="col-span-2 bg-white border border-zinc-200 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                  <div className="relative">
                    <svg viewBox="0 0 200 200" width="140" height="140">
                      {/* Fett (aussen, gelb) */}
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
                        fill="#18181b"
                        fontSize={20}
                        fontFamily="inherit"
                      >
                        {totals.calories}
                      </text>
                      <text
                        x={100}
                        y={113}
                        textAnchor="middle"
                        fill="#71717A"
                        fontSize={10}
                        fontFamily="inherit"
                      >
                        kcal
                      </text>
                    </svg>
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-xs text-zinc-500">
                      {caloriePercent}% von {calorieTarget} kcal
                    </span>
                  </div>
                </div>

                {/* Makro-Details + Legende */}
                <div className="col-span-3 bg-white border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Makros</p>
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
                          <span className="text-zinc-600">{label}</span>
                          <span className="text-zinc-900 font-medium tabular-nums">
                            {value}{unit} <span className="text-zinc-400">/ {target}{unit}</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
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

              {/* ── WASSERZAEHLER ──────────────────────────────── */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-blue-500" />
                    <span className="text-sm font-semibold text-zinc-900">Wasser</span>
                  </div>
                  <span className="text-sm font-bold text-blue-500 tabular-nums">
                    {waterGlasses} / 8 Glaeser
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
                <p className="text-xs text-zinc-400 text-center mt-2">
                  Ziel: 8 Glaeser · 2,0 Liter taeglich
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

              {/* ── AI SCANNER ─────────────────────────────────── */}
              <ErnaehrungScannerOverlay onAddFood={handleAddFood} />

              {/* ── KÜHLSCHRANK & SMART RECIPES (Phase 4) ───────── */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Package className="w-24 h-24 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 relative z-10">
                  <Sparkles className="text-green-400" />
                  Mein Kühlschrank
                </h3>
                <p className="text-sm text-zinc-400 mb-6 relative z-10">
                  Erfasse deine Lebensmittel mit Multi-Object Detection. Wir sagen dir, was du kochen sollst.
                </p>

                <div className="flex gap-3 relative z-10">
                  <button
                    onClick={() => setShowKuehlschrank(true)}
                    className="flex-1 bg-white hover:bg-zinc-100 text-zinc-900 rounded-2xl py-3 px-4 font-semibold text-sm transition shadow flex items-center justify-center gap-2"
                  >
                    <Package size={18} />
                    Inventar Scannen
                  </button>

                  <button
                    onClick={async () => {
                      setIsGeneratingRecipes(true)
                      setRecipeError(null)
                      try {
                        const res = await fetch('/api/ernaehrung/recipes/generate', {
                          method: 'POST',
                          headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({
                            sportSlug: 'fitness',
                            remainingCalories: calorieTarget - totals.calories
                          })
                        })
                        if (!res.ok) throw new Error('Fehler')
                        const data = await res.json()
                        setSmartRecipes(data.recipes || [])
                      } catch(e) {
                        setRecipeError('Konnte Rezepte nicht laden.')
                      } finally {
                        setIsGeneratingRecipes(false)
                      }
                    }}
                    className="flex-[0.5] border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl py-3 px-4 font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    {isGeneriertingRecipes ? <Loader2 className="w-5 h-5 animate-spin"/> : <UtensilsIcon size={18} />}
                    Rezepte
                  </button>
                </div>

                {/* Rezept-Ergebnisse */}
                {smartRecipes.length > 0 && (
                  <div className="mt-6 space-y-4 relative z-10">
                    <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-3">Vorschläge</h4>
                    {smartRecipes.map((r, i) => (
                      <div key={i} className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-4 border border-zinc-700">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20">
                            {r.category.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-zinc-400">🕒 {r.prepTimeMin} min</span>
                        </div>
                        <h5 className="font-semibold text-white mt-2">{r.title}</h5>
                        <p className="text-sm text-zinc-400 mt-1">{r.description}</p>
                        
                        <div className="flex gap-4 mt-3 text-xs text-zinc-300 font-medium">
                          <span>🔥 {r.calories} kcal</span>
                          <span>🥩 {r.proteinG}g P</span>
                          <span>🍚 {r.carbsG}g C</span>
                          <span>🥑 {r.fatG}g F</span>
                        </div>
                        
                        {(r.missingIngredients?.length > 0) && (
                          <div className="mt-3 text-xs text-red-400/80 bg-red-950/30 px-3 py-2 rounded-xl">
                            Fehlt: {r.missingIngredients.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── QUICK-LINKS ────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  { href: '/dashboard/ernaehrung/statistiken',  Icon: BarChart2,    label: 'Statistiken', desc: 'Trends sehen' },
                  { href: '/dashboard/ernaehrung/rezepte',       Icon: UtensilsIcon, label: 'Rezepte', desc: 'Ideen finden' },
                  { href: '/dashboard/ernaehrung/einstellungen', Icon: Settings,     label: 'Einstellungen', desc: 'Zielwert anpassen' },
                  { href: '/dashboard/ernaehrung/kuehlschrank',   Icon: Package,      label: 'K\u00fchlschrank', desc: 'Inventar verwalten' },
                  { href: '/dashboard/ernaehrung/fasten',        Icon: Timer,        label: 'Fasten', desc: 'Intervallfasten' },
                ] as const).map(({ href, Icon, label, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex flex-col rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E4E4E7',
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-green-50 border border-green-100 group-hover:scale-110 transition-transform duration-200">
                      <Icon size={17} className="text-green-600" />
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap text-zinc-900">
                      {label}
                    </span>
                    <span className="text-xs mt-0.5 text-zinc-400">
                      {desc}
                    </span>
                  </Link>
                ))}
              </div>

              {/* ── FASTING & FRIDGE MINI-WIDGETS ──────────────── */}
              <div className="grid grid-cols-2 gap-3">
                {/* Fasten Widget */}
                <Link
                  href="/dashboard/ernaehrung/fasten"
                  className="group bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/60 rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Timer size={16} className="text-purple-600" />
                    </div>
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Fasten</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">Intervallfasten</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">16:8, 18:6, 20:4 Tracker</p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-600 font-medium group-hover:gap-2 transition-all">
                    Starten <ChevronRight size={10} />
                  </div>
                </Link>

                {/* Kühlschrank Widget */}
                <Link
                  href="/dashboard/ernaehrung/kuehlschrank"
                  className="group bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/60 rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Package size={16} className="text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Fridge</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">Smart Kuehlschrank</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">KI Scanner & Inventar</p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-medium group-hover:gap-2 transition-all">
                    Oeffnen <ChevronRight size={10} />
                  </div>
                </Link>
              </div>

              {/* Attribution */}
              <p className="text-center text-[10px] text-zinc-400 mt-2">
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
          className="flex items-center gap-2 px-5 py-3.5 bg-[#16A34A] hover:bg-[#15803D] rounded-2xl text-white font-semibold shadow-lg shadow-green-600/30 transition-colors"
        >
          <Plus size={18} />
          Mahlzeit hinzufuegen
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
      {/* ── KÜHLSCHRANK SCANNER OVERLAY ───────────────────────── */}
      <AnimatePresence>
        {showKuehlschrank && (
          <KuehlschrankScannerOverlay onClose={() => setShowKuehlschrank(false)} />
        )}
      </AnimatePresence>
    </>
  )
}