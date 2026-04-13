'use client'

// ─────────────────────────────────────────────────────────────────
// StatistikenClient – Ernährungsstatistiken der letzten 30 Tage
//
// Features:
//  • 2×2 Stats-Cards
//  • 14-Tage Balken-Diagramm (reines SVG)
//  • Makro-PieChart (reines SVG, 200px)
//  • Wasser-Heatmap (30 Tage, SVG-Kacheln)
//  • KI-Feedback-Bereich (NutritionAI, Rate-Limit 1×/Woche)
//  • Nährstoff-Tiefenanalyse (Accordion)
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Minus,
  Droplets, Utensils, Target, Award,
  BrainCircuit, RefreshCw, ChevronDown,
  Loader2,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

interface DayData {
  date:      string
  calories:  number
  proteinG:  number
  carbsG:    number
  fatG:      number
  glasses:   number
  mealCount: number
  hasData:   boolean
}

interface StatistikenClientProps {
  days:              DayData[]
  calorieTarget:     number
  avgCalories:       number
  proteinGoalPct:    number
  waterStreakDays:   number
  totalMeals:        number
  avgMacros:         { proteinG: number; carbsG: number; fatG: number }
  latestFeedback:    { text: string; date: string } | null
  canGenerateFeedback: boolean
}

interface Toast {
  id:      number
  type:    'success' | 'error'
  message: string
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function formatDE(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}

function formatFeedbackDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function waterMl(glasses: number): number {
  return glasses * 250
}

function waterColor(ml: number): string {
  if (ml === 0)        return '#F4F4F5'
  if (ml < 1000)       return '#DBEAFE'
  if (ml < 2000)       return '#93C5FD'
  return '#3B82F6'
}

// ─────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onClick={() => onDismiss(t.id)}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl border max-w-xs cursor-pointer
              ${t.type === 'error'
                ? 'bg-red-900/90 border-red-700 text-red-200'
                : 'bg-green-900/90 border-green-700 text-green-200'
              }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// 14-Tage Balken-Diagramm (reines SVG)
// ─────────────────────────────────────────────────────────────────

interface BarChartProps {
  days:          DayData[]
  calorieTarget: number
}

function BarChart({ days, calorieTarget }: BarChartProps) {
  const last14 = days.slice(-14)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null)

  const W = 340
  const H = 160
  const PADDING_L = 32
  const PADDING_R = 8
  const PADDING_T = 16
  const PADDING_B = 28
  const chartW = W - PADDING_L - PADDING_R
  const chartH = H - PADDING_T - PADDING_B

  const maxVal = Math.max(calorieTarget * 1.2, ...last14.map((d) => d.calories), 100)
  const barW = Math.floor(chartW / last14.length) - 3
  const targetY = PADDING_T + chartH * (1 - calorieTarget / maxVal)

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Y-Achse Labels */}
        {[0, 0.5, 1].map((frac) => {
          const val = Math.round(maxVal * frac)
          const y = PADDING_T + chartH * (1 - frac)
          return (
            <text key={frac} x={PADDING_L - 4} y={y + 4} textAnchor="end" fill="#6B7280" fontSize={9} fontFamily="inherit">
              {val > 0 ? `${(val / 1000).toFixed(1)}k` : '0'}
            </text>
          )
        })}

        {/* Horizontale Gitternetz-Linie */}
        <line
          x1={PADDING_L} y1={PADDING_T + chartH * 0.5}
          x2={W - PADDING_R} y2={PADDING_T + chartH * 0.5}
          stroke="#374151" strokeWidth={0.5} strokeDasharray="3,3"
        />

        {/* Ziel-Linie */}
        <line
          x1={PADDING_L} y1={targetY}
          x2={W - PADDING_R} y2={targetY}
          stroke="#16A34A" strokeWidth={1} strokeDasharray="4,3" opacity={0.7}
        />
        <text x={W - PADDING_R - 2} y={targetY - 3} textAnchor="end" fill="#16A34A" fontSize={8} fontFamily="inherit">
          Ziel
        </text>

        {/* Balken */}
        {last14.map((day, i) => {
          const barX = PADDING_L + i * (chartW / last14.length) + 1.5
          const barH = day.hasData
            ? Math.max(2, chartH * (day.calories / maxVal))
            : 0
          const barY = PADDING_T + chartH - barH
          const overTarget = day.calories > calorieTarget

          return (
            <g
              key={day.date}
              onMouseEnter={(e) => {
                const svgRect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                setTooltip({
                  x: barX + barW / 2,
                  y: barY - 8,
                  label: `${formatDE(day.date)}: ${day.calories} kcal · Ziel: ${calorieTarget} kcal`,
                })
              }}
              style={{ cursor: 'default' }}
            >
              {/* Haupt-Balken */}
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={barH}
                rx={2}
                fill={overTarget ? '#86EFAC' : '#16A34A'}
                opacity={day.hasData ? (overTarget ? 0.85 : 0.65) : 0}
              />
              {/* Über-Ziel-Akzent oben */}
              {overTarget && day.hasData && (
                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={Math.min(6, barH)}
                  rx={2}
                  fill="#EF4444"
                  opacity={0.65}
                />
              )}
              {/* X-Label */}
              <text
                x={barX + barW / 2}
                y={H - PADDING_B + 12}
                textAnchor="middle"
                fill="#6B7280"
                fontSize={7}
                fontFamily="inherit"
              >
                {formatDE(day.date).split(' ')[0]}
              </text>
            </g>
          )
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={Math.min(tooltip.x - 80, W - PADDING_R - 165)}
              y={tooltip.y - 22}
              width={165}
              height={20}
              rx={4}
              fill="#0A0A0A"
              opacity={0.92}
            />
            <text
              x={Math.min(tooltip.x - 80, W - PADDING_R - 165) + 6}
              y={tooltip.y - 7}
              fill="white"
              fontSize={8}
              fontFamily="inherit"
            >
              {tooltip.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Makro-PieChart (reines SVG, 200px)
// ─────────────────────────────────────────────────────────────────

interface PieChartProps {
  proteinG:    number
  carbsG:      number
  fatG:        number
  avgCalories: number
}

function MacroPieChart({ proteinG, carbsG, fatG, avgCalories }: PieChartProps) {
  const total = proteinG * 4 + carbsG * 4 + fatG * 9
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
        Noch keine Daten
      </div>
    )
  }

  const segments = [
    { label: 'Protein',       value: proteinG * 4, color: '#3B82F6', grams: proteinG },
    { label: 'Kohlenhydrate', value: carbsG * 4,   color: '#F97316', grams: carbsG },
    { label: 'Fett',          value: fatG * 9,     color: '#EAB308', grams: fatG },
  ]

  const R = 80
  const CX = 100
  const CY = 100
  let currentAngle = -Math.PI / 2

  const arcs = segments.map((seg) => {
    const fraction = seg.value / total
    const startAngle = currentAngle
    const endAngle = currentAngle + fraction * 2 * Math.PI
    currentAngle = endAngle

    const x1 = CX + R * Math.cos(startAngle)
    const y1 = CY + R * Math.sin(startAngle)
    const x2 = CX + R * Math.cos(endAngle)
    const y2 = CY + R * Math.sin(endAngle)
    const largeArc = fraction > 0.5 ? 1 : 0

    return {
      ...seg,
      fraction,
      path: `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`,
    }
  })

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" width={200} height={200}>
        {arcs.map((arc) => (
          <path key={arc.label} d={arc.path} fill={arc.color} opacity={0.85} />
        ))}
        {/* Center hole */}
        <circle cx={CX} cy={CY} r={46} fill="#0A0C10" />
        {/* Center text */}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="white" fontSize={18} fontWeight="bold" fontFamily="inherit">
          {avgCalories}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#9CA3AF" fontSize={9} fontFamily="inherit">
          kcal Ø
        </text>
      </svg>
      {/* Legende */}
      <div className="flex flex-col gap-1.5 w-full">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
              <span className="text-gray-300">{arc.label}</span>
            </div>
            <span className="text-white font-medium tabular-nums">
              {arc.grams}g · {Math.round(arc.fraction * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Wasser-Heatmap (30 Tage, SVG-Kacheln)
// ─────────────────────────────────────────────────────────────────

interface WaterHeatmapProps {
  days: DayData[]
}

function WaterHeatmap({ days }: WaterHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string } | null>(null)
  const TILE = 14
  const GAP = 3
  const totalW = days.length * (TILE + GAP) - GAP
  const totalH = TILE + 24  // Kacheln + Label unten

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${totalW} ${totalH}`} width={totalW} height={totalH} className="overflow-visible">
        {days.map((day, i) => {
          const ml = waterMl(day.glasses)
          const fill = waterColor(ml)
          const x = i * (TILE + GAP)

          return (
            <g
              key={day.date}
              onMouseEnter={() =>
                setTooltip({
                  x: x + TILE / 2,
                  y: TILE + 4,
                  label: `${formatDE(day.date)}: ${ml} ml`,
                })
              }
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'default' }}
            >
              <rect
                x={x}
                y={0}
                width={TILE}
                height={TILE}
                rx={2}
                fill={fill}
              />
              {/* Tagesziel-Marker (≥2000ml) */}
              {ml >= 2000 && (
                <circle cx={x + TILE - 3} cy={3} r={2.5} fill="#1D4ED8" />
              )}
              {/* Tages-Label (jede 5. Kachel) */}
              {i % 5 === 0 && (
                <text
                  x={x + TILE / 2}
                  y={TILE + 14}
                  textAnchor="middle"
                  fill="#6B7280"
                  fontSize={7}
                  fontFamily="inherit"
                >
                  {formatDE(day.date).split(' ')[0]}
                </text>
              )}
            </g>
          )
        })}
        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={Math.max(0, Math.min(tooltip.x - 55, totalW - 120))}
              y={TILE + 18}
              width={120}
              height={18}
              rx={4}
              fill="#0A0A0A"
              opacity={0.9}
            />
            <text
              x={Math.max(0, Math.min(tooltip.x - 55, totalW - 120)) + 6}
              y={TILE + 31}
              fill="white"
              fontSize={8}
              fontFamily="inherit"
            >
              {tooltip.label}
            </text>
          </g>
        )}
      </svg>
      {/* Farbskala-Legende */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {[
          { color: '#F4F4F5', label: '0 ml' },
          { color: '#DBEAFE', label: '< 1 L' },
          { color: '#93C5FD', label: '1–2 L' },
          { color: '#3B82F6', label: '≥ 2 L' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1 text-xs text-gray-400">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <div className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
          Tagesziel
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Nährstoff-Tiefenanalyse Accordion
// ─────────────────────────────────────────────────────────────────

interface NaehrstoffAccordionProps {
  avgMacros:     { proteinG: number; carbsG: number; fatG: number }
  calorieTarget: number
}

function NaehrstoffAccordion({ avgMacros, calorieTarget }: NaehrstoffAccordionProps) {
  const [openItem, setOpenItem] = useState<string | null>(null)

  const proteinTarget = Math.round((calorieTarget * 0.30) / 4)
  const carbsTarget   = Math.round((calorieTarget * 0.45) / 4)
  const fatTarget     = Math.round((calorieTarget * 0.25) / 9)
  const waterTargetMl = 2000

  const items = [
    {
      key: 'protein',
      label: 'Protein',
      avg: avgMacros.proteinG,
      target: proteinTarget,
      unit: 'g',
      color: '#3B82F6',
      tipp: avgMacros.proteinG >= proteinTarget
        ? 'Super – deine Protein-Versorgung ist im Zielbereich. Das unterstützt Muskelerhalt und -aufbau.'
        : 'Für optimale Regeneration: ergänze Mahlzeiten mit eiweißreichen Quellen wie Hüttenkäse, Hähnchenbrust oder Eiern.',
    },
    {
      key: 'carbs',
      label: 'Kohlenhydrate',
      avg: avgMacros.carbsG,
      target: carbsTarget,
      unit: 'g',
      color: '#F97316',
      tipp: avgMacros.carbsG >= carbsTarget
        ? 'Gute Kohlenhydrat-Basis – du hast ausreichend Energie für Training und Alltag.'
        : 'Vollkornprodukte, Kartoffeln und Haferflocken liefern dir langfristige Energie für Trainingseinheiten.',
    },
    {
      key: 'fat',
      label: 'Fette',
      avg: avgMacros.fatG,
      target: fatTarget,
      unit: 'g',
      color: '#EAB308',
      tipp: avgMacros.fatG >= fatTarget
        ? 'Gute Fettzufuhr – wichtige Vitamine werden so optimal aufgenommen.'
        : 'Gesunde Fette aus Nüssen, Lachs und Olivenöl unterstützen Hormonhaushalt und Entzündungsregulation.',
    },
    {
      key: 'water',
      label: 'Wasser',
      avg: 0,    // wird unten berechnet
      target: waterTargetMl,
      unit: 'ml',
      color: '#60A5FA',
      tipp: 'Ausreichend Wasser (2 Liter täglich) verbessert Konzentration, Regeneration und Verdauung.',
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const isOpen = openItem === item.key
        const pct = item.target > 0
          ? Math.min(Math.round((item.avg / item.target) * 100), 150)
          : 0
        const trend =
          pct >= 95  ? 'up' :
          pct >= 75  ? 'neutral' :
          'down'

        const TrendIcon =
          trend === 'up'      ? TrendingUp   :
          trend === 'neutral' ? Minus         :
          TrendingDown

        const trendColor =
          trend === 'up'      ? 'text-green-400'  :
          trend === 'neutral' ? 'text-yellow-400' :
          'text-red-400'

        return (
          <div key={item.key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenItem(isOpen ? null : item.key)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-white">{item.label}</span>
                <TrendIcon size={13} className={`shrink-0 ${trendColor}`} />
              </div>
              <div className="flex items-center gap-3">
                {item.avg > 0 && (
                  <span className="text-xs text-gray-300 tabular-nums">
                    Ø {item.avg}{item.unit} / {item.target}{item.unit}
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    {/* Balken */}
                    {item.avg > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Durchschnitt</span>
                          <span className="tabular-nums">{pct}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: '0%' }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>Ziel: {item.target}{item.unit}</span>
                        </div>
                      </div>
                    )}
                    {/* Tipp */}
                    <p className="text-sm text-gray-300 leading-relaxed">{item.tipp}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Komponente
// ─────────────────────────────────────────────────────────────────

export function StatistikenClient({
  days,
  calorieTarget,
  avgCalories,
  proteinGoalPct,
  waterStreakDays,
  totalMeals,
  avgMacros,
  latestFeedback,
  canGenerateFeedback,
}: StatistikenClientProps) {
  const [feedback, setFeedback] = useState(latestFeedback)
  const [canGenerate, setCanGenerate] = useState(canGenerateFeedback)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const handleGenerateFeedback = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ernaehrung/ki-feedback', { method: 'POST' })
      if (res.status === 429) {
        addToast('error', 'Feedback bereits diese Woche generiert. Bitte nächste Woche versuchen.')
        return
      }
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { feedback: string; generatedAt: string }
      setFeedback({ text: data.feedback, date: data.generatedAt })
      setCanGenerate(false)
      addToast('success', 'KI-Feedback erfolgreich generiert.')
    } catch {
      addToast('error', 'Feedback konnte nicht generiert werden.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Datumsbeschnitt für Header
  const startDate = days[0]?.date ?? ''
  const endDate   = days[days.length - 1]?.date ?? ''

  const statsCards = [
    {
      label:   'Durchschnittliche Kalorien',
      value:   avgCalories > 0 ? `${avgCalories} kcal` : '—',
      sub:     `Ziel: ${calorieTarget} kcal`,
      icon:    <Target size={16} className="text-[#16A34A]" />,
      mini: (
        // Mini-Liniendiagramm der letzten 7 Tage
        <svg viewBox="0 0 60 24" width={60} height={24} className="overflow-visible">
          {days.slice(-7).map((d, i, arr) => {
            if (i === 0) return null
            const prev = arr[i - 1]
            const maxC = Math.max(...arr.map((x) => x.calories), 100)
            const x1 = ((i - 1) / (arr.length - 1)) * 56 + 2
            const x2 = (i / (arr.length - 1)) * 56 + 2
            const y1 = 22 - (prev.calories / maxC) * 20
            const y2 = 22 - (d.calories / maxC) * 20
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#16A34A" strokeWidth={1.5} strokeLinecap="round" />
            )
          })}
        </svg>
      ),
    },
    {
      label:   'Protein-Ziel erreicht',
      value:   `${proteinGoalPct}%`,
      sub:     'der letzten 30 Tage',
      icon:    <Award size={16} className="text-blue-400" />,
      trend:   proteinGoalPct >= 70 ? 'up' : proteinGoalPct >= 40 ? 'neutral' : 'down',
      mini:    null,
    },
    {
      label:   'Wasser-Streak',
      value:   `${waterStreakDays} ${waterStreakDays === 1 ? 'Tag' : 'Tage'}`,
      sub:     '≥ 2 L pro Tag',
      icon:    <Droplets size={16} className="text-blue-400" />,
      mini:    null,
    },
    {
      label:   'Erfasste Mahlzeiten',
      value:   `${totalMeals}`,
      sub:     'letzte 30 Tage',
      icon:    <Utensils size={16} className="text-orange-400" />,
      mini:    null,
    },
  ]

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="min-h-screen bg-[#0A0C10]">

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80)',
              opacity: 0.08,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A2218] via-[#0A1810] to-[#0A0C10]" />
          <div className="relative px-4 pt-8 pb-6">
            <h1 className="text-3xl font-bold text-white">Meine Ernährungsstatistiken</h1>
            <p className="text-sm text-gray-400 mt-1.5">
              Letzten 30 Tage
              {startDate && endDate && (
                <span className="ml-2 text-gray-500">
                  · {formatDE(startDate)} – {formatDE(endDate)}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="px-4 pb-32 flex flex-col gap-5">

          {/* ── STATS-CARDS 2×2 ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {statsCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  {card.icon}
                  {card.mini}
                </div>
                <p className="text-xl font-bold text-white tabular-nums">{card.value}</p>
                <p className="text-xs text-gray-400 leading-tight">{card.label}</p>
                <p className="text-[10px] text-gray-600">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── 14-TAGE KALORIENCHART ────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-1">Kalorien letzte 14 Tage</h2>
            <p className="text-xs text-gray-500 mb-3">Grün = unter Ziel · Rot-Akzent = über Ziel</p>
            <BarChart days={days} calorieTarget={calorieTarget} />
          </div>

          {/* ── MAKRO-PIECHART + LEGENDE ─────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-4">Durchschnittliche Makro-Verteilung</h2>
            <MacroPieChart
              proteinG={avgMacros.proteinG}
              carbsG={avgMacros.carbsG}
              fatG={avgMacros.fatG}
              avgCalories={avgCalories}
            />
          </div>

          {/* ── WASSER-HEATMAP ───────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Droplets size={16} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Wasseraufnahme 30 Tage</h2>
            </div>
            <WaterHeatmap days={days} />
          </div>

          {/* ── KI-FEEDBACK ─────────────────────────────────── */}
          <div className="bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border border-[#86EFAC] rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-3">
              <BrainCircuit size={24} className="text-[#16A34A] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-semibold text-[#14532D]">Wöchentliches KI-Feedback</h2>
                <p className="text-xs text-[#16A34A] mt-0.5">
                  Erstellt von unserer eigenen NutritionAI · kein Bot · DSGVO-konform
                </p>
              </div>
            </div>

            {feedback !== null ? (
              <div>
                <p className="text-base text-[#374151] leading-relaxed">{feedback.text}</p>
                <p className="text-xs text-[#6B7280] mt-3">
                  Generiert am {formatFeedbackDate(feedback.date)}
                </p>
                {canGenerate && (
                  <button
                    onClick={() => { void handleGenerateFeedback() }}
                    disabled={isGenerating}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-colors"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Neues Feedback generieren
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-[#374151]">
                  Lass dir von unserer KI eine persönliche Einschätzung deiner Ernährungswoche geben.
                </p>
                <button
                  onClick={() => { void handleGenerateFeedback() }}
                  disabled={isGenerating || !canGenerate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] disabled:bg-gray-400 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-colors w-fit"
                >
                  {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  Feedback generieren
                </button>
                {!canGenerate && (
                  <p className="text-xs text-[#16A34A]">
                    Feedback kann 1× pro Woche generiert werden.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── NÄHRSTOFF-TIEFENANALYSE ─────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3">Nährstoff-Tiefenanalyse</h2>
            <NaehrstoffAccordion avgMacros={avgMacros} calorieTarget={calorieTarget} />
          </div>

          <p className="text-center text-[10px] text-gray-600">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </p>

        </div>
      </div>
    </>
  )
}
