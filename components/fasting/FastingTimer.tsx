'use client'

// ─────────────────────────────────────────────────────────────────
// FastingTimer – Premium Intermittent Fasting Tracker
//
// Features:
//  • Circular SVG Timer mit Framer Motion
//  • Biologische Phasen-Anzeige (Fettverbrennung, Autophagie, etc.)
//  • 7-Tage Balkendiagramm
//  • 16:8 / 18:6 / 20:4 / 24h Presets
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Square,
  Clock,
  Flame,
  Sparkles,
  Zap,
  TrendingDown,
  Utensils,
  ArrowUpCircle,
  ChevronLeft,
  Timer,
  Trophy,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import {
  getCurrentFastingState,
  getAutophagyLevel,
  FASTING_PHASES,
  FASTING_PRESETS,
  type FastingPhase,
} from '@/lib/formulas'

// ── Typen ─────────────────────────────────────────────────────────

interface FastingLogData {
  id: string
  startTime: string
  endTime: string | null
  targetDurationHours: number
  fastingType: string
  status: string
}

interface FastingTimerProps {
  activeFast: FastingLogData | null
  recentFasts: FastingLogData[]
  onStartFast: (fastingType: string, targetHours: number) => Promise<void>
  onStopFast: (id: string) => Promise<void>
}

// ── Phase Icon Mapping ────────────────────────────────────────────

const PHASE_ICONS: Record<string, typeof Flame> = {
  Utensils: Utensils,
  TrendingDown: TrendingDown,
  Flame: Flame,
  Zap: Zap,
  Sparkles: Sparkles,
  ArrowUpCircle: ArrowUpCircle,
}

// ── Circular Timer Ring ───────────────────────────────────────────

interface TimerRingProps {
  progress: number
  size: number
  phase: FastingPhase
}

function TimerRing({ progress, size, phase }: TimerRingProps) {
  const center = size / 2
  const radius = center - 16
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - Math.min(progress / 100, 1))

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="drop-shadow-sm">
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#F4F4F5"
        strokeWidth={12}
      />
      {/* Progress */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={phase.color}
        strokeWidth={12}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        strokeDasharray={circumference}
      />
      {/* Glow */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={phase.color}
        strokeWidth={12}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
        strokeDasharray={circumference}
        opacity={0.25}
        filter="blur(8px)"
      />
    </svg>
  )
}

// ── 7-Tage Balkendiagramm ─────────────────────────────────────────

interface WeekChartProps {
  fasts: FastingLogData[]
}

function WeekChart({ fasts }: WeekChartProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })

  const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900">Letzte 7 Tage</h3>
      </div>

      <div className="flex items-end justify-between gap-2 h-28">
        {days.map((day, i) => {
          const dayStr = day.toISOString().split('T')[0]
          const dayFast = fasts.find((f) => {
            const fDate = new Date(f.startTime).toISOString().split('T')[0]
            return fDate === dayStr
          })

          const hours = dayFast?.endTime
            ? Math.min(
                24,
                (new Date(dayFast.endTime).getTime() - new Date(dayFast.startTime).getTime()) / 3600000,
              )
            : dayFast?.status === 'ACTIVE'
              ? Math.min(24, (Date.now() - new Date(dayFast.startTime).getTime()) / 3600000)
              : 0

          const heightPct = Math.min(100, (hours / 24) * 100)
          const isToday = i === 6
          const completed = dayFast?.status === 'COMPLETED'

          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <div className="w-full relative h-20 flex items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                  className={`w-full rounded-lg ${
                    completed
                      ? 'bg-green-500'
                      : hours > 0
                        ? 'bg-amber-400'
                        : 'bg-zinc-100'
                  }`}
                  style={{ minHeight: hours > 0 ? 4 : 0 }}
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">
                {hours > 0 ? `${Math.round(hours)}h` : '–'}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  isToday ? 'text-zinc-900' : 'text-zinc-400'
                }`}
              >
                {dayLabels[day.getDay() === 0 ? 6 : day.getDay() - 1]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legende */}
      <div className="flex justify-center gap-4 mt-3 text-[10px] text-zinc-400">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
          Abgeschlossen
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
          Aktiv / Abgebrochen
        </div>
      </div>
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────

export function FastingTimer({
  activeFast,
  recentFasts,
  onStartFast,
  onStopFast,
}: FastingTimerProps) {
  const [now, setNow] = useState(new Date())
  const [selectedPreset, setSelectedPreset] = useState<string>('F16_8')
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  // Live-Ticker
  useEffect(() => {
    if (!activeFast) return
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [activeFast])

  const fastingState = activeFast
    ? getCurrentFastingState(
        new Date(activeFast.startTime),
        activeFast.targetDurationHours,
        now,
      )
    : null

  const autophagyLevel = fastingState
    ? getAutophagyLevel(fastingState.elapsedHours + fastingState.elapsedMinutes / 60)
    : 0

  const handleStart = useCallback(async () => {
    setIsStarting(true)
    const preset = FASTING_PRESETS[selectedPreset]
    try {
      await onStartFast(selectedPreset, preset.fastHours)
    } finally {
      setIsStarting(false)
    }
  }, [selectedPreset, onStartFast])

  const handleStop = useCallback(async () => {
    if (!activeFast) return
    setIsStopping(true)
    try {
      await onStopFast(activeFast.id)
    } finally {
      setIsStopping(false)
    }
  }, [activeFast, onStopFast])

  const PhaseIcon = fastingState ? (PHASE_ICONS[fastingState.phase.icon] ?? Clock) : Clock

  // Berechne Streak
  const completedCount = recentFasts.filter((f) => f.status === 'COMPLETED').length

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Breadcrumb */}
      <div className="px-4 pt-4">
        <Link
          href="/dashboard/ernaehrung"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Ernährung
        </Link>
        <span className="text-zinc-300 mx-1.5">/</span>
        <span className="text-sm font-semibold text-zinc-900">Intervallfasten</span>
      </div>

      {/* Header */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shadow-sm">
            <Timer size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Intervallfasten</h1>
            <p className="text-sm text-zinc-500">Tracke deine Fastenperioden.</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-32 space-y-4">
        {/* ── AKTIVE FASTEN-SESSION ─────────────────────────────── */}
        {activeFast && fastingState ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm relative overflow-hidden"
          >
            {/* Subtle phase color glow */}
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
              style={{ background: fastingState.phase.color, opacity: 0.08 }}
            />

            {/* Timer Ring */}
            <div className="flex flex-col items-center relative z-10">
              <div className="relative">
                <TimerRing
                  progress={fastingState.progressPercent}
                  size={220}
                  phase={fastingState.phase}
                />
                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-zinc-900 tabular-nums">
                    {String(fastingState.elapsedHours).padStart(2, '0')}:
                    {String(fastingState.elapsedMinutes).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-zinc-400 mt-1">
                    von {activeFast.targetDurationHours}h
                  </span>
                </div>
              </div>

              {/* Verbleibende Zeit */}
              <div className="mt-4 text-center">
                {fastingState.isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-2 text-green-600 font-bold"
                  >
                    <Trophy size={18} />
                    Ziel erreicht!
                  </motion.div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Noch{' '}
                    <span className="font-bold text-zinc-900">
                      {fastingState.remainingHours}h {fastingState.remainingMinutes}min
                    </span>{' '}
                    verbleibend
                  </p>
                )}
              </div>
            </div>

            {/* Aktuelle Phase */}
            <motion.div
              layout
              className="mt-6 p-4 rounded-2xl border"
              style={{
                borderColor: `${fastingState.phase.color}30`,
                backgroundColor: `${fastingState.phase.color}08`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${fastingState.phase.color}15` }}
                >
                  <PhaseIcon size={20} style={{ color: fastingState.phase.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900 text-sm">{fastingState.phase.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{fastingState.phase.description}</p>
                </div>
              </div>

              {/* Autophagy Progress */}
              {autophagyLevel > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">Autophagie-Level</span>
                    <span className="font-bold text-purple-600">{autophagyLevel}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-purple-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${autophagyLevel}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Alle Phasen Übersicht */}
            <div className="mt-4 space-y-1.5">
              {FASTING_PHASES.slice(0, 5).map((phase) => {
                const elapsed = fastingState.elapsedHours + fastingState.elapsedMinutes / 60
                const isActive = elapsed >= phase.startHour && elapsed < phase.endHour
                const isPast = elapsed >= phase.endHour
                const Icon = PHASE_ICONS[phase.icon] ?? Clock

                return (
                  <div
                    key={phase.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-zinc-50 border border-zinc-200'
                        : isPast
                          ? 'opacity-50'
                          : 'opacity-30'
                    }`}
                  >
                    <Icon size={14} style={{ color: isPast || isActive ? phase.color : '#A1A1AA' }} />
                    <span className={`text-xs flex-1 ${isActive ? 'font-semibold text-zinc-900' : 'text-zinc-500'}`}>
                      {phase.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 tabular-nums">
                      {phase.startHour}–{phase.endHour}h
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Stop Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleStop}
              disabled={isStopping}
              className="w-full mt-6 py-3.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl text-red-600 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Square size={16} />
              {isStopping ? 'Wird beendet...' : 'Fasten beenden'}
            </motion.button>
          </motion.div>
        ) : (
          /* ── FASTEN STARTEN ──────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-zinc-900 mb-1">Neues Fasten starten</h2>
            <p className="text-sm text-zinc-500 mb-5">Wähle dein Fastenintervall.</p>

            {/* Preset-Auswahl */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {Object.entries(FASTING_PRESETS).map(([key, preset]) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPreset(key)}
                  className={`py-3 rounded-2xl border text-center transition-all ${
                    selectedPreset === key
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-lg font-bold block">{preset.label}</span>
                  <span className={`text-[10px] ${selectedPreset === key ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    {preset.fastHours}h fasten
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Start Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              disabled={isStarting}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isStarting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play size={18} />
              )}
              Fasten starten ({FASTING_PRESETS[selectedPreset]?.label})
            </motion.button>
          </motion.div>
        )}

        {/* ── STATISTIK-CARDS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-zinc-400 font-medium mb-1">Abgeschlossen</p>
            <p className="text-2xl font-black text-zinc-900">{completedCount}</p>
            <p className="text-[10px] text-zinc-400">letzte 7 Tage</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-zinc-400 font-medium mb-1">Längste Session</p>
            <p className="text-2xl font-black text-zinc-900">
              {recentFasts.length > 0
                ? `${Math.round(
                    Math.max(
                      ...recentFasts
                        .filter((f) => f.endTime)
                        .map(
                          (f) =>
                            (new Date(f.endTime!).getTime() - new Date(f.startTime).getTime()) /
                            3600000,
                        ),
                      0,
                    ),
                  )}h`
                : '–'}
            </p>
            <p className="text-[10px] text-zinc-400">diese Woche</p>
          </div>
        </div>

        {/* ── WOCHEN-CHART ────────────────────────────────────── */}
        <WeekChart fasts={recentFasts} />
      </div>
    </div>
  )
}
