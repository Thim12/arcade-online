'use client'
// ─────────────────────────────────────────────────────────────────
// app/dashboard/ki-trainer/KiTrainerClient.tsx
//
// KI-Trainer Wizard:
//   • Formular (Sport, Level, Dauer, Einheiten/Woche, Ziele)
//   • Rate-Limit-Badge (X von 3 Plänen diesen Monat)
//   • POST → /api/training/plan/generate
//   • Loading-Animation (Framer Motion)
//   • Erfolgs-State: firstWeekPreview
//   • Fehler-State: Rate-Limit + generische Fehler
//   • Aktiver Plan vorhanden → Info-Banner mit Link
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Zap,
  Clock,
  Calendar,
  Target,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Shield,
  Dumbbell,
} from 'lucide-react'
import type { KiTrainerPageData } from './page'
import type { SportLevel, UserGoal } from '@prisma/client'

// ── Konstanten ─────────────────────────────────────────────────────

const SPORT_COLORS: Record<string, { primary: string; light: string; glow: string }> = {
  fussball:   { primary: '#16A34A', light: '#DCFCE7', glow: 'rgba(22,163,74,0.20)'  },
  tennis:     { primary: '#C2621A', light: '#FEF3C7', glow: 'rgba(194,98,26,0.20)'  },
  basketball: { primary: '#EA580C', light: '#FFEDD5', glow: 'rgba(234,88,12,0.20)'  },
}
const DEFAULT_COLORS = { primary: '#16A34A', light: '#DCFCE7', glow: 'rgba(22,163,74,0.20)' }

const SPORT_LABELS: Record<string, string> = {
  fussball:   'Fußball',
  tennis:     'Tennis',
  basketball: 'Basketball',
}

const LEVEL_OPTIONS: { value: SportLevel; label: string; desc: string }[] = [
  { value: 'ANFAENGER',       label: 'Anfänger',        desc: 'Erste Schritte im Sport'      },
  { value: 'FORTGESCHRITTENE', label: 'Fortgeschritten', desc: 'Regelmäßiges Training'        },
  { value: 'WETTKAMPF',        label: 'Wettkampf',       desc: 'Aktiv im Vereinssport'        },
  { value: 'PROFI',            label: 'Profi',           desc: 'Höchstes Trainingsniveau'     },
]

const GOAL_OPTIONS: { value: UserGoal; label: string; icon: React.ReactNode }[] = [
  { value: 'FITNESS',             label: 'Fitness',            icon: <Zap size={14} />      },
  { value: 'WETTKAMPF',           label: 'Wettkampf',          icon: <Target size={14} />   },
  { value: 'FREIZEITSPORT',       label: 'Freizeit',           icon: <Calendar size={14} /> },
  { value: 'ABNEHMEN',            label: 'Abnehmen',           icon: <RefreshCw size={14} />},
  { value: 'MUSKELAUFBAU',        label: 'Muskelaufbau',       icon: <Dumbbell size={14} /> },
  { value: 'TECHNIK_VERBESSERN',  label: 'Technik verbessern', icon: <Brain size={14} />    },
]

// ── API-Response-Typen ─────────────────────────────────────────────

interface PreviewDay {
  dayName:       string
  isRestDay:     boolean
  focus:         string | null
  totalMinutes:  number
  exerciseCount: number
}

interface FirstWeekPreview {
  weekNumber:  number
  focus:       string
  weeklyGoal:  string
  days:        PreviewDay[]
}

interface GenerateSuccess {
  planId:          string
  planName:        string
  durationWeeks:   number
  sessionsPerWeek: number
  firstWeekPreview: FirstWeekPreview | null
}

type WizardState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'success'; result: GenerateSuccess }
  | { phase: 'error'; message: string; isRateLimit: boolean; resetDate?: string }

// ── Hilfsfunktionen ────────────────────────────────────────────────

function formatResetDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })
}

function dayLabel(minutes: number, isRestDay: boolean): string {
  if (isRestDay) return 'Ruhetag'
  if (minutes === 0) return '—'
  return `${minutes} Min`
}

// ── Unterkomponenten ───────────────────────────────────────────────

function RateLimitBadge({
  used, limit, colors,
}: { used: number; limit: number; colors: typeof DEFAULT_COLORS }) {
  const remaining = limit - used
  const full      = remaining === 0

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        background: full ? 'rgba(239,68,68,0.10)' : `${colors.primary}14`,
        border:     `1px solid ${full ? 'rgba(239,68,68,0.25)' : `${colors.primary}30`}`,
        color:      full ? '#EF4444' : colors.primary,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: full ? '#EF4444' : colors.primary }}
      />
      {used} von {limit} Plänen diesen Monat verwendet
    </div>
  )
}

function WeekPreviewCard({
  preview, colors,
}: { preview: FirstWeekPreview; colors: typeof DEFAULT_COLORS }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${colors.primary}25`, background: '#FAFAFA' }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: `${colors.primary}10`, borderBottom: `1px solid ${colors.primary}15` }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
            Woche 1 · Vorschau
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-800">{preview.focus}</p>
        </div>
        <div
          className="px-2.5 py-1 rounded-lg text-xs font-medium"
          style={{ background: `${colors.primary}18`, color: colors.primary }}
        >
          {preview.weeklyGoal}
        </div>
      </div>

      {/* Tage */}
      <div className="grid grid-cols-7 divide-x divide-gray-100">
        {preview.days.map((day) => (
          <div
            key={day.dayName}
            className="flex flex-col items-center py-3 px-1 gap-1"
            style={{ background: day.isRestDay ? 'transparent' : `${colors.primary}06` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {day.dayName.slice(0, 2)}
            </p>
            {day.isRestDay ? (
              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
              </div>
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: `${colors.primary}20` }}
              >
                <Dumbbell size={10} style={{ color: colors.primary }} />
              </div>
            )}
            <p className="text-[10px] text-center leading-tight text-gray-500">
              {dayLabel(day.totalMinutes, day.isRestDay)}
            </p>
            {!day.isRestDay && day.exerciseCount > 0 && (
              <p className="text-[9px] text-center" style={{ color: colors.primary }}>
                {day.exerciseCount} Übg.
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Haupt-Component ────────────────────────────────────────────────

interface Props {
  data: KiTrainerPageData
}

export function KiTrainerClient({ data }: Props) {
  const colors = SPORT_COLORS[data.primarySport ?? ''] ?? DEFAULT_COLORS
  const sportLabel = SPORT_LABELS[data.primarySport ?? ''] ?? 'Sport'

  // Wizard-Felder
  const [level,           setLevel]           = useState<SportLevel>(data.level)
  const [durationWeeks,   setDurationWeeks]   = useState<number>(8)
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3)
  const [goals,           setGoals]           = useState<UserGoal[]>(
    data.goals.length > 0 ? data.goals : ['FREIZEITSPORT'],
  )

  const [state, setState] = useState<WizardState>({ phase: 'idle' })

  const rateLimitReached = data.usedThisMonth >= data.monthlyLimit

  function toggleGoal(goal: UserGoal) {
    setGoals((prev) =>
      prev.includes(goal)
        ? prev.length > 1 ? prev.filter((g) => g !== goal) : prev  // mind. 1 Ziel
        : [...prev, goal],
    )
  }

  async function handleGenerate() {
    if (rateLimitReached) return

    setState({ phase: 'loading' })

    try {
      const res = await fetch('/api/training/plan/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sportSlug:       data.primarySport,
          level,
          durationWeeks,
          sessionsPerWeek,
          goals,
        }),
      })

      const json = (await res.json()) as {
        success?: boolean
        data?:    GenerateSuccess
        error?:   string
        code?:    string
        resetDate?: string
      }

      if (!res.ok || !json.success || !json.data) {
        const isRateLimit = json.code === 'RATE_LIMIT_EXCEEDED'
        setState({
          phase:       'error',
          message:     json.error ?? 'Unbekannter Fehler.',
          isRateLimit,
          resetDate:   json.resetDate,
        })
        return
      }

      setState({ phase: 'success', result: json.data })
    } catch {
      setState({
        phase:       'error',
        message:     'Netzwerkfehler. Bitte versuche es erneut.',
        isRateLimit: false,
      })
    }
  }

  return (
    <div className="flex-1 px-8 py-6 w-full">

      {/* ── Seitentitel ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${colors.primary}18` }}
          >
            <Brain size={18} style={{ color: colors.primary }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#0A0A0A' }}>KI-Trainer</h1>
          <RateLimitBadge used={data.usedThisMonth} limit={data.monthlyLimit} colors={colors} />
        </div>
        <p className="text-sm ml-12" style={{ color: '#71717A' }}>
          Personalisierter Trainingsplan für {sportLabel} · algorithmisch generiert
        </p>
      </motion.div>

      {/* ── 2-Spalten-Layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* ── LINKE SPALTE (Wizard + States) ──────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-5">

          {/* Aktiver Plan – Hinweis-Banner */}
          <AnimatePresence>
            {data.activePlan !== null && state.phase !== 'success' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                  style={{
                    background: `${colors.primary}0C`,
                    border:     `1px solid ${colors.primary}20`,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 size={15} style={{ color: colors.primary, flexShrink: 0 }} />
                    <p className="text-sm truncate" style={{ color: '#374151' }}>
                      Aktiver Plan:{' '}
                      <span className="font-semibold" style={{ color: '#111827' }}>{data.activePlan.title}</span>
                      <span style={{ color: '#9CA3AF' }}>
                        {' '}· {data.activePlan.durationWeeks} Wochen · {data.activePlan.sessionsPerWeek}×/Woche
                      </span>
                    </p>
                  </div>
                  <Link
                    href="/training"
                    className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-70"
                    style={{ color: colors.primary }}
                  >
                    Zum Plan <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wizard-Formular */}
          <AnimatePresence mode="wait">
            {state.phase !== 'success' && (
              <motion.div
                key="wizard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  border:     '1px solid rgba(0,0,0,0.07)',
                  boxShadow:  '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="px-5 py-4"
                  style={{ borderBottom: '1px solid #F3F4F6' }}
                >
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>Trainingsplan konfigurieren</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Sport: {sportLabel}</p>
                </div>

                <div className="p-5 flex flex-col gap-6">

                  {/* Level */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#6B7280' }}>
                      Trainingsniveau
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {LEVEL_OPTIONS.map((opt) => {
                        const active = level === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setLevel(opt.value)}
                            className="flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                            style={{
                              background: active ? `${colors.primary}12` : 'rgba(0,0,0,0.02)',
                              border:     `1px solid ${active ? `${colors.primary}35` : 'rgba(0,0,0,0.06)'}`,
                            }}
                          >
                            <span
                              className="text-xs font-semibold"
                              style={{ color: active ? colors.primary : '#374151' }}
                            >
                              {opt.label}
                            </span>
                            <span className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{opt.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Dauer + Einheiten */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                        <Calendar size={11} className="inline mr-1.5 -mt-0.5" />
                        Dauer (Wochen)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={2} max={16} step={2}
                          value={durationWeeks}
                          onChange={(e) => setDurationWeeks(Number(e.target.value))}
                          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            accentColor: colors.primary,
                            background:  `linear-gradient(to right, ${colors.primary} ${((durationWeeks - 2) / 14) * 100}%, #E5E7EB ${((durationWeeks - 2) / 14) * 100}%)`,
                          }}
                        />
                        <span
                          className="text-sm font-bold w-8 text-right"
                          style={{ color: colors.primary }}
                        >
                          {durationWeeks}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                        <Clock size={11} className="inline mr-1.5 -mt-0.5" />
                        Einheiten / Woche
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1} max={7} step={1}
                          value={sessionsPerWeek}
                          onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            accentColor: colors.primary,
                            background:  `linear-gradient(to right, ${colors.primary} ${((sessionsPerWeek - 1) / 6) * 100}%, #E5E7EB ${((sessionsPerWeek - 1) / 6) * 100}%)`,
                          }}
                        />
                        <span
                          className="text-sm font-bold w-4 text-right"
                          style={{ color: colors.primary }}
                        >
                          {sessionsPerWeek}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ziele */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#6B7280' }}>
                      <Target size={11} className="inline mr-1.5 -mt-0.5" />
                      Ziele (Mehrfachauswahl)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_OPTIONS.map((opt) => {
                        const active = goals.includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleGoal(opt.value)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                            style={{
                              background: active ? `${colors.primary}14` : 'rgba(0,0,0,0.03)',
                              border:     `1px solid ${active ? `${colors.primary}35` : 'rgba(0,0,0,0.08)'}`,
                              color:      active ? colors.primary : '#6B7280',
                            }}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                </div>

                {/* Footer: Zusammenfassung + Generieren-Button */}
                <div
                  className="px-5 py-4 flex items-center justify-between gap-4"
                  style={{ borderTop: '1px solid #F3F4F6', background: 'rgba(0,0,0,0.015)' }}
                >
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {durationWeeks} Wochen · {sessionsPerWeek}×/Woche · {sportLabel}
                  </p>

                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={rateLimitReached || state.phase === 'loading'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: rateLimitReached ? '#9CA3AF' : colors.primary,
                      color:      '#fff',
                      boxShadow:  rateLimitReached ? 'none' : `0 4px 14px ${colors.glow}`,
                    }}
                  >
                    {state.phase === 'loading' ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Brain size={14} />
                    )}
                    {state.phase === 'loading' ? 'Wird erstellt…' : 'Plan generieren'}
                    {state.phase !== 'loading' && <ChevronRight size={14} />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading-Animation */}
          <AnimatePresence>
            {state.phase === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-14 gap-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: colors.glow, filter: 'blur(12px)' }}
                  />
                  <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}25` }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Brain size={28} style={{ color: colors.primary }} />
                    </motion.div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: '#111827' }}>Plan wird generiert</p>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    Übungen werden zusammengestellt · Progressionen berechnet
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: colors.primary }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Erfolgs-State */}
          <AnimatePresence>
            {state.phase === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4"
              >
                <div
                  className="flex items-center justify-between px-5 py-4 rounded-2xl"
                  style={{
                    background: `${colors.primary}0C`,
                    border:     `1px solid ${colors.primary}25`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.primary}18` }}
                    >
                      <CheckCircle2 size={18} style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#111827' }}>{state.result.planName}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {state.result.durationWeeks} Wochen · {state.result.sessionsPerWeek}×/Woche · {sportLabel}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/training"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:opacity-85"
                    style={{ background: colors.primary, color: '#fff' }}
                  >
                    Zum Plan <ArrowRight size={12} />
                  </Link>
                </div>

                {state.result.firstWeekPreview !== null && (
                  <WeekPreviewCard preview={state.result.firstWeekPreview} colors={colors} />
                )}

                <button
                  type="button"
                  onClick={() => setState({ phase: 'idle' })}
                  className="self-start flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: colors.primary }}
                >
                  <RefreshCw size={12} />
                  Neuen Plan konfigurieren
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fehler-State */}
          <AnimatePresence>
            {state.phase === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl px-5 py-4"
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border:     '1px solid rgba(239,68,68,0.20)',
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#B91C1C' }}>
                      {state.isRateLimit ? 'Monatslimit erreicht' : 'Fehler beim Generieren'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#DC2626' }}>{state.message}</p>
                    {state.isRateLimit && state.resetDate !== undefined && (
                      <p className="text-xs mt-1" style={{ color: '#EF4444' }}>
                        Nächste Generierung ab:{' '}
                        <span className="font-semibold">{formatResetDate(state.resetDate)}</span>
                      </p>
                    )}
                  </div>
                </div>
                {!state.isRateLimit && (
                  <button
                    type="button"
                    onClick={() => setState({ phase: 'idle' })}
                    className="mt-3 text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ color: '#EF4444' }}
                  >
                    Erneut versuchen
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ── RECHTE SPALTE (Info-Panel, sticky) ──────────────── */}
        <div className="flex flex-col gap-4 xl:sticky xl:top-6">

          {/* Wie es funktioniert */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl p-5"
            style={{
              background: '#FFFFFF',
              border:     '1px solid #E4E4E7',
              boxShadow:  '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#A1A1AA' }}>
              Wie es funktioniert
            </p>
            <div className="flex flex-col gap-4">
              {[
                { icon: <Target size={14} />,   title: 'Konfigurieren',     desc: 'Level, Dauer und Ziele festlegen'  },
                { icon: <Brain  size={14} />,   title: 'KI generiert',      desc: 'Algorithmus erstellt deinen Plan'  },
                { icon: <Dumbbell size={14} />, title: 'Training starten',  desc: 'Wochenplan direkt im Dashboard'    },
              ].map(({ icon, title, desc }, i) => (
                <div key={title} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${colors.primary}14`, color: colors.primary }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#0A0A0A' }}>
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mr-1.5"
                        style={{ background: `${colors.primary}20`, color: colors.primary }}
                      >
                        {i + 1}
                      </span>
                      {title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Sport + Limit-Info */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="rounded-2xl p-5"
            style={{
              background: `${colors.primary}08`,
              border:     `1px solid ${colors.primary}20`,
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${colors.primary}18` }}
              >
                <Zap size={13} style={{ color: colors.primary }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: colors.primary }}>
                {sportLabel}-Spezialist
              </p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#52525B' }}>
              Der Algorithmus kennt sportspezifische Bewegungsmuster und erstellt einen Plan,
              der perfekt auf {sportLabel} abgestimmt ist.
            </p>

            {/* Monatslimit-Visualisierung */}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.primary}18` }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-medium" style={{ color: '#71717A' }}>Pläne diesen Monat</p>
                <p className="text-[10px] font-bold" style={{ color: colors.primary }}>
                  {data.usedThisMonth} / {data.monthlyLimit}
                </p>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 4, background: `${colors.primary}18` }}
              >
                <div
                  style={{
                    height:       '100%',
                    width:        `${Math.min((data.usedThisMonth / data.monthlyLimit) * 100, 100)}%`,
                    background:   colors.primary,
                    borderRadius: 9999,
                    transition:   'width 0.6s ease',
                  }}
                />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: '#A1A1AA' }}>
                {data.monthlyLimit - data.usedThisMonth} von {data.monthlyLimit} Plänen verfügbar
              </p>
            </div>
          </motion.div>

          {/* DSGVO-Disclaimer */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: '#F9FAFB', border: '1px solid #E4E4E7' }}
          >
            <Shield size={13} style={{ color: '#A1A1AA', flexShrink: 0, marginTop: 1 }} />
            <p className="text-[11px] leading-relaxed" style={{ color: '#71717A' }}>
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </motion.div>

        </div>

      </div>

    </div>
  )
}
