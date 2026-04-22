'use client'
// ─────────────────────────────────────────────────────────────────
// app/dashboard/ki-trainer/KiTrainerClient.tsx
//
// KI-Trainer Wizard (Redesign: Apple.com × Strava.com)
//   • Breadcrumb-Navigation (Zurueck / KI-Trainer)
//   • Hero mit Unsplash-Hintergrund + Sport-Gradient
//   • "Dein Trainingsplan"-Karte (aktuellen Plan zeigen)
//   • Wizard-Formular (Level, Dauer, Einheiten, Ziele)
//   • "Tipps & Empfehlungen" + "KI-Vorteile" + XP-Badge
//   • Rate-Limit-Badge
//   • POST /api/training/plan/generate
//   • Loading / Erfolg / Fehler-States
//   • Rechte Spalte: "Wie es funktioniert" + Sport-Info
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Zap,
  Clock,
  Calendar,
  Target,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Shield,
  Dumbbell,
  Sparkles,
  TrendingUp,
  Lightbulb,
  BarChart3,
  Eye,
  ListChecks,
} from 'lucide-react'
import type { KiTrainerPageData } from './page'
import type { SportLevel, UserGoal } from '@prisma/client'

// ── Konstanten ─────────────────────────────────────────────────────

const SPORT_COLORS: Record<string, { primary: string; light: string; glow: string }> = {
  fussball:   { primary: '#16A34A', light: '#DCFCE7', glow: 'rgba(22,163,74,0.20)' },
  tennis:     { primary: '#C2621A', light: '#FEF3C7', glow: 'rgba(194,98,26,0.20)' },
  basketball: { primary: '#EA580C', light: '#FFEDD5', glow: 'rgba(234,88,12,0.20)' },
}
const DEFAULT_COLORS = { primary: '#16A34A', light: '#DCFCE7', glow: 'rgba(22,163,74,0.20)' }

const SPORT_LABELS: Record<string, string> = {
  fussball:   'Fussball',
  tennis:     'Tennis',
  basketball: 'Basketball',
}

const SPORT_HERO_IMAGE: Record<string, string> = {
  fussball:   'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=60',
  tennis:     'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1600&q=60',
  basketball: 'https://images.unsplash.com/photo-1559692048-79a3f837883d?w=1600&q=60',
}

const LEVEL_OPTIONS: { value: SportLevel; label: string; desc: string }[] = [
  { value: 'ANFAENGER',       label: 'Anfaenger',        desc: 'Erste Schritte im Sport' },
  { value: 'FORTGESCHRITTENE', label: 'Fortgeschritten', desc: 'Regelmaessiges Training' },
  { value: 'WETTKAMPF',        label: 'Wettkampf',       desc: 'Aktiv im Vereinssport' },
  { value: 'PROFI',            label: 'Profi',           desc: 'Hoechstes Trainingsniveau' },
]

const GOAL_OPTIONS: { value: UserGoal; label: string; icon: React.ReactNode }[] = [
  { value: 'FITNESS',             label: 'Fitness',            icon: <Zap size={14} /> },
  { value: 'WETTKAMPF',           label: 'Wettkampf',          icon: <Target size={14} /> },
  { value: 'FREIZEITSPORT',       label: 'Freizeit',           icon: <Calendar size={14} /> },
  { value: 'ABNEHMEN',            label: 'Abnehmen',           icon: <RefreshCw size={14} /> },
  { value: 'MUSKELAUFBAU',        label: 'Muskelaufbau',       icon: <Dumbbell size={14} /> },
  { value: 'TECHNIK_VERBESSERN',  label: 'Technik verbessern', icon: <Brain size={14} /> },
]

const SPORT_TIPS: Record<string, { title: string; text: string; icon: React.ReactNode }[]> = {
  fussball: [
    { title: 'Regenerationslaeufe', text: 'Integriere leichte 20-Minuten-Laufe nach intensiven Einheiten fuer aktive Erholung.', icon: <TrendingUp size={16} /> },
    { title: 'Ballkontrolle', text: 'Uebe daily 10 Minuten Ballannahme und -mitnahme mit verschiedenen Hoehen und Geschwindigkeiten.', icon: <ListChecks size={16} /> },
    { title: 'Sprint-Intervalle', text: 'Gearde Sprints (6x30m) mit 90s Pause verbessern Explosivitaet und Antritt.', icon: <Zap size={16} /> },
  ],
  tennis: [
    { title: 'Beinarbeit', text: 'Split-Steps und Seitwaertsbewegungen trainieren – die Basis fuer schnelle Richtungswechsel.', icon: <ListChecks size={16} /> },
    { title: 'Schlagvorbereitung', text: 'Arme rueckfuehrung und Gewichtsverlagerung bewusst ueben, bevor Baelle ins Spiel kommen.', icon: <Eye size={16} /> },
    { title: 'Ausdauer-Intervalle', text: 'Kurze intensive Belastungen (30s) gefolgt von 60s Pause simulieren Match-Bedingungen.', icon: <TrendingUp size={16} /> },
  ],
  basketball: [
    { title: 'Sprungkoordination', text: 'Box-Jumps und Lateral-Jumps staerken die Explosivitaet fuer Rebounds und Antriebe.', icon: <Zap size={16} /> },
    { title: 'Dribbel-Drills', text: 'Cross-Over und Behind-the-Back in hoher Frequenz verbessern Ballhandling unter Druck.', icon: <ListChecks size={16} /> },
    { title: 'Freiwurf-Routine', text: 'Erstelle eine feste Pre-Shot-Routine und trainiere 50 Freiwuerfe vor jedem Training.', icon: <Target size={16} /> },
  ],
}

// ── API-Response-Typen ─────────────────────────────────────────────

interface PreviewDay {
  dayName: string
  isRestDay: boolean
  focus: string | null
  totalMinutes: number
  exerciseCount: number
}

interface FirstWeekPreview {
  weekNumber: number
  focus: string
  weeklyGoal: string
  days: PreviewDay[]
}

interface GenerateSuccess {
  planId: string
  planName: string
  durationWeeks: number
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
    day: '2-digit',
    month: 'long',
    year: 'numeric',
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
  const full = remaining === 0

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        background: full ? 'rgba(239,68,68,0.10)' : `${colors.primary}14`,
        border: `1px solid ${full ? 'rgba(239,68,68,0.25)' : `${colors.primary}30`}`,
        color: full ? '#EF4444' : colors.primary,
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: full ? '#EF4444' : colors.primary }}
      />
      {used} von {limit} Plaenen diesen Monat verwendet
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
      style={{
        border: `1px solid ${colors.primary}25`,
        background: '#FFFFFF',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: `${colors.primary}08`, borderBottom: `1px solid ${colors.primary}12` }}
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
                {day.exerciseCount} Uebg.
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
  const heroImage = SPORT_HERO_IMAGE[data.primarySport ?? ''] ?? SPORT_HERO_IMAGE['fussball'] ?? ''
  const tips = SPORT_TIPS[data.primarySport ?? ''] ?? SPORT_TIPS['fussball']

  const [level, setLevel] = useState<SportLevel>(data.level)
  const [durationWeeks, setDurationWeeks] = useState<number>(8)
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3)
  const [goals, setGoals] = useState<UserGoal[]>(
    data.goals.length > 0 ? data.goals : ['FREIZEITSPORT'],
  )

  const [state, setState] = useState<WizardState>({ phase: 'idle' })

  const rateLimitReached = data.usedThisMonth >= data.monthlyLimit

  function toggleGoal(goal: UserGoal) {
    setGoals((prev) =>
      prev.includes(goal)
        ? prev.length > 1 ? prev.filter((g) => g !== goal) : prev
        : [...prev, goal],
    )
  }

  async function handleGenerate() {
    if (rateLimitReached) return

    setState({ phase: 'loading' })

    try {
      const res = await fetch('/api/training/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sportSlug: data.primarySport,
          level,
          durationWeeks,
          sessionsPerWeek,
          goals,
        }),
      })

      const json = (await res.json()) as {
        success?: boolean
        data?: GenerateSuccess
        error?: string
        code?: string
        resetDate?: string
      }

      if (!res.ok || !json.success || !json.data) {
        const isRateLimit = json.code === 'RATE_LIMIT_EXCEEDED'
        setState({
          phase: 'error',
          message: json.error ?? 'Unbekannter Fehler.',
          isRateLimit,
          resetDate: json.resetDate,
        })
        return
      }

      setState({ phase: 'success', result: json.data })
    } catch {
      setState({
        phase: 'error',
        message: 'Netzwerkfehler. Bitte versuche es erneut.',
        isRateLimit: false,
      })
    }
  }

  return (
    <div className="flex-1 px-8 py-6 w-full">

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: '#71717A' }}
        >
          <ChevronLeft size={14} />
          Zurueck
        </Link>
        <span style={{ color: '#D4D4D8' }}> / </span>
        <span className="text-xs font-semibold" style={{ color: '#0A0A0A' }}>KI-Trainer</span>
      </motion.div>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl overflow-hidden mb-6 relative"
        style={{ minHeight: 120 }}
      >
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            style={{ opacity: 0.06 }}
            priority
            sizes="(max-width: 1280px) 100vw, 1200px"
          />
        </div>
        <div className="absolute inset-0 bg-white/80" />

        <div
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{
            top: -60,
            right: -40,
            width: 280,
            height: 280,
            background: colors.primary,
            opacity: 0.08,
          }}
        />

        <div className="relative z-10 px-8 pt-6 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}25` }}
            >
              <Brain size={22} style={{ color: colors.primary }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0A0A0A' }}>
                KI-Trainer
              </h1>
              <p className="text-sm" style={{ color: '#71717A' }}>
                Personalisierter Trainingsplan fuer {sportLabel} · algorithmisch generiert
              </p>
            </div>
            <RateLimitBadge used={data.usedThisMonth} limit={data.monthlyLimit} colors={colors} />
          </div>
        </div>
      </motion.div>

      {/* ── Dein Trainingsplan (wenn aktiv) ─────────────────────────── */}
      <AnimatePresence>
        {data.activePlan !== null && state.phase !== 'success' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 overflow-hidden"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: `1px solid ${colors.primary}25`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              <div className="relative">
                <div className="absolute inset-0">
                  <Image
                    src={heroImage}
                    alt=""
                    fill
                    className="object-cover"
                    style={{ opacity: 0.04 }}
                    sizes="800px"
                  />
                </div>
                <div className="absolute inset-0 bg-white/90" />

                <div className="relative z-10 px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${colors.primary}14`, border: `1px solid ${colors.primary}20` }}
                      >
                        <CheckCircle2 size={22} style={{ color: colors.primary }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>
                          DeinTrainingsplan
                        </p>
                        <p className="text-lg font-bold truncate" style={{ color: '#0A0A0A' }}>
                          {data.activePlan.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                          {data.activePlan.durationWeeks} Wochen · {data.activePlan.sessionsPerWeek}x pro Woche · {sportLabel}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/training"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-85"
                      style={{ background: colors.primary, color: '#fff', boxShadow: `0 4px 14px ${colors.glow}` }}
                    >
                      Zum Plan <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2-Spalten-Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* ── LINKE SPALTE ─────────────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-6">

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
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="px-6 py-5"
                  style={{ borderBottom: '1px solid #F4F4F5' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${colors.primary}12` }}
                    >
                      <Sparkles size={17} style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#0A0A0A' }}>Trainingsplan konfigurieren</p>
                      <p className="text-xs mt-0.5" style={{ color: '#A1A1AA' }}>
                        Sport: {sportLabel} · Passe deinen Plan individuell an
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-8">

                  {/* Level */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#71717A' }}>
                      Trainingsniveau
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {LEVEL_OPTIONS.map((opt) => {
                        const active = level === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setLevel(opt.value)}
                            className="group flex flex-col items-start px-4 py-3.5 rounded-2xl text-left transition-all duration-200"
                            style={{
                              background: active ? `${colors.primary}10` : '#FAFAFA',
                              border: `1.5px solid ${active ? colors.primary : 'rgba(0,0,0,0.06)'}`,
                              boxShadow: active ? `0 4px 16px ${colors.glow}` : 'none',
                            }}
                          >
                            <span
                              className="text-sm font-semibold"
                              style={{ color: active ? colors.primary : '#374151' }}
                            >
                              {opt.label}
                            </span>
                            <span className="text-[11px] mt-1 leading-snug" style={{ color: '#9CA3AF' }}>{opt.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Dauer + Einheiten */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#71717A' }}>
                        <Calendar size={12} className="inline mr-1.5 -mt-0.5" />
                        Dauer (Wochen)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={2} max={16} step={2}
                          value={durationWeeks}
                          onChange={(e) => setDurationWeeks(Number(e.target.value))}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                          style={{
                            accentColor: colors.primary,
                            background: `linear-gradient(to right, ${colors.primary} ${((durationWeeks - 2) / 14) * 100}%, #E5E7EB ${((durationWeeks - 2) / 14) * 100}%)`,
                          }}
                        />
                        <span
                          className="text-base font-bold w-8 text-right tabular-nums"
                          style={{ color: colors.primary }}
                        >
                          {durationWeeks}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#71717A' }}>
                        <Clock size={12} className="inline mr-1.5 -mt-0.5" />
                        Einheiten / Woche
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={1} max={7} step={1}
                          value={sessionsPerWeek}
                          onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                          style={{
                            accentColor: colors.primary,
                            background: `linear-gradient(to right, ${colors.primary} ${((sessionsPerWeek - 1) / 6) * 100}%, #E5E7EB ${((sessionsPerWeek - 1) / 6) * 100}%)`,
                          }}
                        />
                        <span
                          className="text-base font-bold w-4 text-right tabular-nums"
                          style={{ color: colors.primary }}
                        >
                          {sessionsPerWeek}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ziele */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#71717A' }}>
                      <Target size={12} className="inline mr-1.5 -mt-0.5" />
                      Ziele (Mehrfachauswahl)
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {GOAL_OPTIONS.map((opt) => {
                        const active = goals.includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleGoal(opt.value)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
                            style={{
                              background: active ? `${colors.primary}14` : '#FAFAFA',
                              border: `1.5px solid ${active ? colors.primary : 'rgba(0,0,0,0.08)'}`,
                              color: active ? colors.primary : '#6B7280',
                              boxShadow: active ? `0 2px 10px ${colors.glow}` : 'none',
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
                  className="px-6 py-4 flex items-center justify-between gap-4"
                  style={{ borderTop: '1px solid #F4F4F5', background: 'rgba(0,0,0,0.01)' }}
                >
                  <div className="flex items-center gap-3">
                    <p className="text-xs" style={{ color: '#A1A1AA' }}>
                      {durationWeeks} Wochen · {sessionsPerWeek}x pro Woche · {sportLabel}
                    </p>
                    <span style={{ color: '#E4E4E7' }}>|</span>
                    <div className="flex items-center gap-1">
                      <Sparkles size={12} style={{ color: colors.primary }} />
                      <span className="text-xs font-semibold" style={{ color: colors.primary }}>
                        +50 XP
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleGenerate()}
                    disabled={rateLimitReached || state.phase === 'loading'}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: rateLimitReached ? '#9CA3AF' : colors.primary,
                      color: '#fff',
                      boxShadow: rateLimitReached ? 'none' : `0 6px 20px ${colors.glow}`,
                    }}
                  >
                    {state.phase === 'loading' ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Brain size={14} />
                    )}
                    {state.phase === 'loading' ? 'Wird erstellt...' : 'Plan generieren'}
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
                className="rounded-2xl py-16 flex flex-col items-center justify-center gap-5"
                style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
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
                    style={{ background: `${colors.primary}12`, border: `1px solid ${colors.primary}20` }}
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
                  <p className="text-base font-bold" style={{ color: '#0A0A0A' }}>Plan wird generiert</p>
                  <p className="text-sm mt-1" style={{ color: '#A1A1AA' }}>
                    Uebungen werden zusammengestellt · Progressionen berechnet
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                      className="w-2 h-2 rounded-full"
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
                className="flex flex-col gap-5"
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${colors.primary}30`,
                    boxShadow: `0 8px 32px ${colors.glow}`,
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0">
                      <Image
                        src={heroImage}
                        alt=""
                        fill
                        className="object-cover"
                        style={{ opacity: 0.04 }}
                        sizes="800px"
                      />
                    </div>
                    <div className="absolute inset-0 bg-white/90" />

                    <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${colors.primary}15` }}
                        >
                          <CheckCircle2 size={24} style={{ color: colors.primary }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold truncate" style={{ color: '#0A0A0A' }}>{state.result.planName}</p>
                          <p className="text-sm mt-0.5" style={{ color: '#71717A' }}>
                            {state.result.durationWeeks} Wochen · {state.result.sessionsPerWeek}x pro Woche · {sportLabel}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/training"
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-85 flex-shrink-0"
                        style={{ background: colors.primary, color: '#fff', boxShadow: `0 4px 14px ${colors.glow}` }}
                      >
                        Zum Plan <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>

                {state.result.firstWeekPreview !== null && (
                  <WeekPreviewCard preview={state.result.firstWeekPreview} colors={colors} />
                )}

                <button
                  type="button"
                  onClick={() => setState({ phase: 'idle' })}
                  className="self-start flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: colors.primary }}
                >
                  <RefreshCw size={14} />
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
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(239,68,68,0.20)',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.08)',
                }}
              >
                <div className="px-6 py-5 flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.10)' }}
                  >
                    <AlertTriangle size={18} style={{ color: '#EF4444' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#B91C1C' }}>
                      {state.isRateLimit ? 'Monatslimit erreicht' : 'Fehler beim Generieren'}
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#DC2626' }}>{state.message}</p>
                    {state.isRateLimit && state.resetDate !== undefined && (
                      <p className="text-xs mt-2" style={{ color: '#EF4444' }}>
                        Naechste Generierung ab:{' '}
                        <span className="font-semibold">{formatResetDate(state.resetDate)}</span>
                      </p>
                    )}
                  </div>
                </div>
                {!state.isRateLimit && (
                  <div
                    className="px-6 pb-4"
                    style={{ borderTop: '1px solid rgba(239,68,68,0.10)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setState({ phase: 'idle' })}
                      className="flex items-center gap-1.5 text-sm font-semibold mt-3 transition-opacity hover:opacity-70"
                      style={{ color: '#EF4444' }}
                    >
                      <RefreshCw size={13} />
                      Erneut versuchen
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Tipps & Empfehlungen ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full" style={{ background: colors.primary }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
                Tipps & Empfehlungen
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 transition-shadow duration-200 hover:shadow-md"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${colors.primary}12` }}
                  >
                    <span style={{ color: colors.primary }}>{tip.icon}</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: '#0A0A0A' }}>{tip.title}</p>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#71717A' }}>{tip.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── KI-Vorteile ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full" style={{ background: colors.primary }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
                KI-Vorteile
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <Brain size={18} />, title: 'Personalisiert', desc: 'Dein Plan basiert auf deinem Niveau, deinen Zielen und deinem Sport.' },
                { icon: <BarChart3 size={18} />, title: 'Progressiv', desc: 'Jede Woche steigert die KI Intensitaet und Umfang systematisch.' },
                { icon: <Sparkles size={18} />, title: 'Sportspezifisch', desc: 'Bewegungsmuster und Drillls werden exakt auf deinen Sport abgestimmt.' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl p-4"
                  style={{
                    background: `${colors.primary}06`,
                    border: `1px solid ${colors.primary}12`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${colors.primary}12` }}
                  >
                    <span style={{ color: colors.primary }}>{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0A0A0A' }}>{item.title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#71717A' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ── RECHTE SPALTE (Info-Panel, sticky) ──────────────────── */}
        <div className="flex flex-col gap-5 xl:sticky xl:top-6">

          {/* Wie es funktioniert */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}
          >
            <div className="relative">
              <div className="absolute inset-0">
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  className="object-cover"
                  style={{ opacity: 0.04 }}
                  sizes="400px"
                />
              </div>
              <div className="absolute inset-0 bg-white/92" />

              <div className="relative z-10 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#A1A1AA' }}>
                  Wie es funktioniert
                </p>
                <div className="flex flex-col gap-5">
                  {[
                    { icon: <Target size={14} />, title: 'Konfigurieren', desc: 'Level, Dauer und Ziele festlegen' },
                    { icon: <Brain size={14} />, title: 'KI generiert', desc: 'Algorithmus erstellt deinen Plan' },
                    { icon: <Dumbbell size={14} />, title: 'Training starten', desc: 'Wochenplan direkt im Dashboard' },
                  ].map(({ icon, title, desc }, i) => (
                    <div key={title} className="flex items-start gap-3.5">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${colors.primary}14`, color: colors.primary }}
                        >
                          {icon}
                        </div>
                        {i < 2 && (
                          <div
                            className="w-px h-5 mt-1"
                            style={{ background: `${colors.primary}20` }}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold" style={{ color: '#0A0A0A' }}>{title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sport + Limit-Info */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="rounded-2xl p-6"
            style={{
              background: `${colors.primary}06`,
              border: `1px solid ${colors.primary}18`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${colors.primary}15`, border: `1px solid ${colors.primary}22` }}
              >
                <Zap size={16} style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: colors.primary }}>
                  {sportLabel}-Spezialist
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: `${colors.primary}AA` }}>
                  Algorithmus kennt {sportLabel}-Bewegungsmuster
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#52525B' }}>
              Der Algorithmus kennt sportspezifische Bewegungsmuster und erstellt einen Plan,
              der perfekt auf {sportLabel} abgestimmt ist.
            </p>

            <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${colors.primary}15` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: '#71717A' }}>Plaene diesen Monat</p>
                <p className="text-xs font-bold" style={{ color: colors.primary }}>
                  {data.usedThisMonth} / {data.monthlyLimit}
                </p>
              </div>
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: 6, background: `${colors.primary}15` }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((data.usedThisMonth / data.monthlyLimit) * 100, 100)}%`,
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.primary}CC)`,
                    borderRadius: 9999,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <p className="text-[11px] mt-2" style={{ color: '#A1A1AA' }}>
                {data.monthlyLimit - data.usedThisMonth} von {data.monthlyLimit} Plaenen verfuegbar
              </p>
            </div>
          </motion.div>

          {/* XP-Badge */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${colors.primary}14` }}
            >
              <Sparkles size={20} style={{ color: colors.primary }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#0A0A0A' }}>+50 XP</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#A1A1AA' }}>
                XP fuer die Generierung eines Trainingsplans
              </p>
            </div>
          </motion.div>

          {/* DSGVO-Disclaimer */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.30 }}
            className="flex items-start gap-2.5 px-5 py-3.5 rounded-xl"
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