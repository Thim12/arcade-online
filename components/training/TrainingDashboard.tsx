'use client'

// ─────────────────────────────────────────────────────────────────
// TrainingDashboard.tsx – Haupt-Client-Component für /training
//
// Sections:
//   A) Kein Plan  – Hero + KI-CTA
//   B) Aktiver Plan:
//      - Sticky Header (Plantitel, Pause, Delete)
//      - Wochenstreifen (7 Karten)
//      - Stats-Leiste (Dauer / Übungen / kcal)
//      - Fortschritts-Donut (SVG)
//      - Warmup-Hinweis (Banner)
//      - Übungsliste (UebungsCard)
//      - Safety Warnings (collapsible)
//      - Abschluss-Button (sticky mobile)
//      - Abschluss-Modal (Stimmung → Ergebnis)
//      - KI-Attribution
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Moon,
  X,
  Trash2,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Dumbbell,
  Zap,
  Frown,
  Meh,
  Smile,
  Laugh,
  ThumbsDown,
  Trophy,
  Star,
  Flame,
  Loader2,
  Flame as FlameIcon,
} from 'lucide-react'
import { getBadgeIcon } from '@/lib/sport-icons'
import { UebungsCard } from './UebungsCard'
import type { PlanExercise } from './UebungsCard'

// ── Typen ──────────────────────────────────────────────────────────

export interface PlanDay {
  dayName: string
  isRestDay: boolean
  focus?: string
  warmupMinutes?: number
  cooldownMinutes?: number
  totalMinutes: number
  notes?: string
  exercises: PlanExercise[]
}

export interface WeekStripDay {
  dayName: string
  deIndex: number
  isToday: boolean
  isRestDay: boolean
  isCompleted: boolean
  isMissed: boolean
  isFuture: boolean
  totalMinutes: number
  focus?: string
}

export interface TrainingPageData {
  planId: string
  planTitle: string
  planDescription: string
  planLevel: string
  durationWeeks: number
  sessionsPerWeek: number
  sportSlug: string
  sportColorPrimary: string
  sportColorLight: string
  sportColorGlow: string
  planCreatedAt: string
  currentWeekNumber: number
  currentDayDeIndex: number
  todayDay: PlanDay | null
  isTodayCompleted: boolean
  isTodayRestDay: boolean
  weekStrip: WeekStripDay[]
  completedSessions: number
  totalSessions: number
  percentComplete: number
  estimatedCaloriesBurnPerSession: number
  progressionTips: string[]
  safetyWarnings: string[]
  attribution: string
}

type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

interface NewBadge {
  id: string
  name: string
  description: string
  iconName: string
  rarity: BadgeRarity
  xpReward: number
}

interface CompleteResult {
  session: { id: string; title: string; durationMin: number; xpEarned: number }
  xp: { earned: number; newTotal: number; newLevel: number; leveledUp: boolean }
  easterEggXpBonus: number
  motivationFeedback: string
  newBadges: NewBadge[]
}

// ── Konstanten ─────────────────────────────────────────────────────

const DE_DAY_SHORT: Record<string, string> = {
  Montag: 'Mo',
  Dienstag: 'Di',
  Mittwoch: 'Mi',
  Donnerstag: 'Do',
  Freitag: 'Fr',
  Samstag: 'Sa',
  Sonntag: 'So',
}

const SPORT_LEVEL_LABELS: Record<string, string> = {
  ANFAENGER: 'Anfänger',
  FORTGESCHRITTENE: 'Fortgeschrittene',
  WETTKAMPF: 'Wettkampf',
  PROFI: 'Profi',
}

const RARITY_STYLES: Record<
  BadgeRarity,
  { label: string; color: string; bg: string; border: string }
> = {
  COMMON: { label: 'Common', color: '#71717A', bg: '#F4F4F5', border: '#E4E4E7' },
  RARE: { label: 'Selten', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  EPIC: { label: 'Episch', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  LEGENDARY: { label: 'Legendär', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
}

const MOOD_CONFIG = [
  { Icon: ThumbsDown, label: 'Sehr schlecht', color: '#EF4444' },
  { Icon: Frown, label: 'Schlecht', color: '#F97316' },
  { Icon: Meh, label: 'Ok', color: '#EAB308' },
  { Icon: Smile, label: 'Gut', color: '#84CC16' },
  { Icon: Laugh, label: 'Super', color: '#22C55E' },
] as const

const UNSPLASH_HERO =
  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1600&q=80&fit=crop'

// ── CountUp Hook ───────────────────────────────────────────────────

function useCountUp(target: number, active: boolean): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) {
      setCount(0)
      return
    }
    let start: number | null = null
    let rafId: number
    const tick = (ts: number) => {
      if (start === null) start = ts
      const elapsed = ts - start
      const progress = Math.min(elapsed / 1000, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, active])
  return count
}

// ── ProgressDonut ──────────────────────────────────────────────────

function ProgressDonut({
  percent,
  color,
  completedSessions,
  totalSessions,
}: {
  percent: number
  color: string
  completedSessions: number
  totalSessions: number
}) {
  const size = 120
  const strokeWidth = 9
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(percent, 100) / 100)

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>
            {Math.round(percent)}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">
          {completedSessions}{' '}
          <span className="text-base font-normal text-gray-500">von {totalSessions}</span>
        </p>
        <p className="text-sm text-gray-500 mt-0.5">Sessions abgeschlossen</p>
      </div>
    </div>
  )
}

// ── AbschlussModal ─────────────────────────────────────────────────

interface AbschlussModalProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  weekNumber: number
  todayDay: PlanDay
  completedExerciseNames: string[]
  sportColorPrimary: string
  onSuccess: () => void
}

function AbschlussModal({
  isOpen,
  onClose,
  planId,
  weekNumber,
  todayDay,
  completedExerciseNames,
  sportColorPrimary,
  onSuccess,
}: AbschlussModalProps) {
  const [step, setStep] = useState<'mood' | 'result'>('mood')
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<CompleteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // CountUp for XP
  const xpCount = useCountUp(result?.xp.earned ?? 0, step === 'result' && result !== null)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('mood')
      setSelectedMood(null)
      setIsSubmitting(false)
      setResult(null)
      setError(null)
    }
  }, [isOpen])

  const handleSubmitMood = useCallback(async () => {
    if (selectedMood === null) return
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/training/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          weekNumber,
          dayName: todayDay.dayName,
          durationMin: todayDay.totalMinutes,
          mood: selectedMood,
          completedExerciseNames,
        }),
      })

      const json = (await res.json()) as {
        success?: boolean
        error?: string
        data?: CompleteResult
      }

      if (!res.ok || !json.success || !json.data) {
        setError(json.error ?? 'Fehler beim Speichern.')
        setIsSubmitting(false)
        return
      }

      setResult(json.data)
      setStep('result')
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedMood, planId, weekNumber, todayDay, completedExerciseNames])

  const handleClose = useCallback(() => {
    if (step === 'result') {
      onSuccess()
    }
    onClose()
  }, [step, onSuccess, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white pb-safe shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
            style={{ maxHeight: '90dvh', overflowY: 'auto' }}
          >
            <div className="p-6">
              {/* Close button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>

              {/* ── Step 1: Stimmung ──────────────────────────────── */}
              <AnimatePresence mode="wait">
                {step === 'mood' && (
                  <motion.div
                    key="mood"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Header */}
                    <div className="mb-6 text-center">
                      <div
                        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ background: `${sportColorPrimary}15` }}
                      >
                        <Dumbbell className="h-7 w-7" style={{ color: sportColorPrimary }} />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Wie war das Training?
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {todayDay.dayName} · {todayDay.totalMinutes} Min.
                      </p>
                    </div>

                    {/* Mood Buttons */}
                    <div className="mb-6 flex justify-between gap-2">
                      {MOOD_CONFIG.map(({ Icon, label, color }, i) => {
                        const mood = i + 1
                        const isSelected = selectedMood === mood
                        return (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => setSelectedMood(mood)}
                            className="flex flex-1 flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-150"
                            style={{
                              borderColor: isSelected ? color : '#E4E4E7',
                              background: isSelected ? `${color}12` : '#FAFAFA',
                            }}
                            aria-label={label}
                            aria-pressed={isSelected}
                          >
                            <Icon
                              className="h-6 w-6"
                              style={{
                                color: isSelected ? color : '#A1A1AA',
                                transition: 'color 0.15s',
                              }}
                            />
                            <span
                              className="text-center leading-tight"
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                color: isSelected ? color : '#71717A',
                              }}
                            >
                              {label}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Error */}
                    {error !== null && (
                      <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                        {error}
                      </p>
                    )}

                    {/* Weiter */}
                    <button
                      type="button"
                      onClick={handleSubmitMood}
                      disabled={selectedMood === null || isSubmitting}
                      className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                      style={{ background: sportColorPrimary }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Wird gespeichert…
                        </span>
                      ) : (
                        'Weiter'
                      )}
                    </button>
                  </motion.div>
                )}

                {/* ── Step 2: Ergebnis ──────────────────────────────── */}
                {step === 'result' && result !== null && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* XP Counter */}
                    <div className="mb-6 text-center">
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="mx-auto mb-1 flex h-20 w-20 items-center justify-center rounded-full"
                        style={{
                          background: `${sportColorPrimary}18`,
                          border: `3px solid ${sportColorPrimary}40`,
                        }}
                      >
                        <Zap className="h-8 w-8" style={{ color: sportColorPrimary }} />
                      </motion.div>

                      <p className="text-3xl font-black" style={{ color: sportColorPrimary }}>
                        +{xpCount} XP
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Gesamt: {result.xp.newTotal.toLocaleString('de-DE')} XP
                      </p>
                    </div>

                    {/* Level-Up */}
                    <AnimatePresence>
                      {result.xp.leveledUp && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                        >
                          <Trophy className="h-6 w-6 flex-shrink-0 text-amber-500" />
                          <div>
                            <p className="font-bold text-amber-900">
                              Level-Up! Du bist jetzt Level {result.xp.newLevel}
                            </p>
                            <p className="text-xs text-amber-700">
                              Weiter so – du wirst immer besser!
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Easter Egg Bonus */}
                    {result.easterEggXpBonus > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-4 flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3"
                      >
                        <Star className="h-5 w-5 flex-shrink-0 text-purple-500" />
                        <p className="text-sm font-medium text-purple-800">
                          Easter Egg! +{result.easterEggXpBonus} Bonus-XP
                        </p>
                      </motion.div>
                    )}

                    {/* Motivation Feedback */}
                    {result.motivationFeedback !== '' && (
                      <div
                        className="mb-4 rounded-2xl px-4 py-3"
                        style={{
                          background: `${sportColorPrimary}0D`,
                          border: `1px solid ${sportColorPrimary}30`,
                        }}
                      >
                        <p className="text-sm leading-relaxed text-gray-700">
                          {result.motivationFeedback}
                        </p>
                        <p
                          className="mt-1.5 text-xs"
                          style={{ color: sportColorPrimary, opacity: 0.7 }}
                        >
                          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
                        </p>
                      </div>
                    )}

                    {/* Neue Abzeichen */}
                    {result.newBadges.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Neue Abzeichen
                        </p>
                        <div className="flex flex-col gap-2">
                          {result.newBadges.map((badge, i) => {
                            const rStyle = RARITY_STYLES[badge.rarity]
                            const BadgeIcon = getBadgeIcon(badge.iconName)
                            return (
                              <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.08 }}
                                className="flex items-center gap-3 rounded-xl p-3"
                                style={{
                                  background: rStyle.bg,
                                  border: `1px solid ${rStyle.border}`,
                                }}
                              >
                                <div
                                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                                  style={{ background: `${rStyle.color}1A` }}
                                >
                                  <BadgeIcon
                                    className="h-5 w-5"
                                    style={{ color: rStyle.color }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {badge.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{badge.description}</p>
                                </div>
                                <span
                                  className="flex-shrink-0 text-xs font-semibold"
                                  style={{ color: rStyle.color }}
                                >
                                  +{badge.xpReward} XP
                                </span>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Fertig */}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full rounded-xl py-3.5 text-sm font-semibold text-white"
                      style={{ background: sportColorPrimary }}
                    >
                      Fertig
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── NoPlanHero ─────────────────────────────────────────────────────

function NoPlanHero() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const router = useRouter()

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/training/plan/generate', { method: 'POST' })
      const json = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !json.success) {
        setGenError(json.error ?? 'Fehler beim Erstellen des Plans.')
        return
      }
      router.refresh()
    } catch {
      setGenError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setIsGenerating(false)
    }
  }, [router])

  return (
    <div className="relative min-h-[70dvh] flex flex-col items-center justify-center overflow-hidden rounded-3xl">
      {/* Hintergrundbild */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${UNSPLASH_HERO})` }}
        role="presentation"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />

      {/* Inhalt */}
      <div className="relative z-10 flex max-w-lg flex-col items-center px-6 py-16 text-center">
        {/* KI-Attribution Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
        >
          <Zap className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-white/80">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-4 text-4xl font-black text-white leading-tight"
        >
          Dein persönlicher<br />Trainingsplan
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 text-base leading-relaxed text-white/70"
        >
          Unsere eigene KI analysiert dein Sport-Profil und erstellt einen
          maßgeschneiderten Plan mit progressiven Übungen, Erholungsphasen
          und Sicherheitshinweisen — kostenlos, werbefrei, DSGVO-konform.
        </motion.p>

        {/* Error */}
        {genError !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 w-full rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-3 text-sm text-red-200"
          >
            {genError}
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2.5 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg transition-opacity disabled:opacity-70"
          style={{
            background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
            boxShadow: '0 8px 32px rgba(22,163,74,0.5)',
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              KI erstellt deinen Plan…
            </>
          ) : (
            <>
              <Dumbbell className="h-5 w-5" />
              Trainingsplan erstellen
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}

// ── Hauptkomponente ────────────────────────────────────────────────

export function TrainingDashboard({ data }: { data: TrainingPageData | null }) {
  const router = useRouter()

  // ── State ────────────────────────────────────────────────────────
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [warningsOpen, setWarningsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isPauseLoading, setIsPauseLoading] = useState(false)

  // Reset exercise tracking when data changes (e.g. after refresh)
  useEffect(() => {
    setCompletedExercises(new Set())
  }, [data?.planId])

  const handleToggleExercise = useCallback((index: number) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const handlePause = useCallback(async () => {
    if (!data) return
    setIsPauseLoading(true)
    try {
      await fetch(`/api/training/plan/${data.planId}/pause`, { method: 'PATCH' })
      router.refresh()
    } finally {
      setIsPauseLoading(false)
    }
  }, [data, router])

  const handleDelete = useCallback(async () => {
    if (!data) return
    setIsDeleting(true)
    try {
      await fetch(`/api/training/plan/${data.planId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(false)
    }
  }, [data, router])

  const handleModalSuccess = useCallback(() => {
    setCompletedExercises(new Set())
    router.refresh()
  }, [router])

  // ── Kein Plan ────────────────────────────────────────────────────
  if (data === null) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <NoPlanHero />
        </div>
      </div>
    )
  }

  // ── Aktiver Plan ─────────────────────────────────────────────────
  const {
    planId,
    planTitle,
    planDescription,
    planLevel,
    durationWeeks,
    currentWeekNumber,
    sportColorPrimary,
    sportColorGlow,
    todayDay,
    isTodayCompleted,
    isTodayRestDay,
    weekStrip,
    completedSessions,
    totalSessions,
    percentComplete,
    estimatedCaloriesBurnPerSession,
    safetyWarnings,
    attribution,
  } = data

  const cssVars = {
    '--sport-primary': sportColorPrimary,
    '--sport-glow': sportColorGlow,
  } as React.CSSProperties

  const exercises = todayDay?.exercises ?? []
  const totalExercises = exercises.length
  const allExercisesDone =
    totalExercises > 0 && completedExercises.size >= totalExercises
  const showCompleteButton =
    !isTodayCompleted && !isTodayRestDay && todayDay !== null && allExercisesDone

  const completedExerciseNames = exercises
    .filter((_, i) => completedExercises.has(i))
    .map((ex) => ex.name)

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={cssVars} data-sport={data.sportSlug}>
      {/* ── Sticky Header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-4 py-3 sm:px-8"
        style={{
          background: 'rgba(250,250,250,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E4E4E7',
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {/* Plantitel + Meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate text-base font-bold text-gray-900">
                {planTitle}
              </h1>
              <span
                className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ background: sportColorPrimary }}
              >
                {SPORT_LEVEL_LABELS[planLevel] ?? planLevel}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Woche {currentWeekNumber} / {durationWeeks}
            </p>
          </div>

          {/* Pause-Button */}
          <button
            type="button"
            onClick={handlePause}
            disabled={isPauseLoading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            title="Plan pausieren"
            aria-label="Plan pausieren"
          >
            {isPauseLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Pausieren</span>
          </button>

          {/* Delete-Button */}
          {deleteConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Wirklich?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ja, löschen'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
              >
                Abbrechen
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Plan löschen"
              aria-label="Plan löschen"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Löschen</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Seiteninhalt ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 py-6 pb-32 sm:px-8 sm:pb-10">

        {/* ── Plan-Beschreibung ─────────────────────────────────── */}
        {planDescription !== '' && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 text-sm text-gray-600"
          >
            {planDescription}
          </motion.p>
        )}

        {/* ── Wochenstreifen ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04 }}
          className="mb-5 grid grid-cols-7 gap-1.5"
        >
          {weekStrip.map((day) => {
            const short = DE_DAY_SHORT[day.dayName] ?? day.dayName.slice(0, 2)

            let bgColor = '#F4F4F5'
            let borderColor = '#E4E4E7'
            let textColor = '#71717A'
            let showCheck = false
            let showMoon = false
            let showMissed = false

            if (day.isToday) {
              bgColor = `${sportColorPrimary}18`
              borderColor = sportColorPrimary
              textColor = sportColorPrimary
            }
            if (day.isCompleted) {
              bgColor = `${sportColorPrimary}10`
              borderColor = `${sportColorPrimary}60`
              textColor = sportColorPrimary
              showCheck = true
            }
            if (day.isRestDay) {
              showMoon = true
            }
            if (day.isMissed) {
              bgColor = '#FFF1F2'
              borderColor = '#FECDD3'
              textColor = '#F43F5E'
              showMissed = true
            }
            if (day.isFuture && !day.isToday) {
              textColor = '#A1A1AA'
            }

            return (
              <div
                key={day.deIndex}
                className="flex flex-col items-center gap-1 rounded-xl border px-1 py-2"
                style={{ background: bgColor, borderColor }}
                aria-current={day.isToday ? 'date' : undefined}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: textColor }}
                >
                  {short}
                </span>

                {/* Status-Icon */}
                <div className="flex h-5 w-5 items-center justify-center">
                  {showCheck && (
                    <CheckCircle2 className="h-4 w-4" style={{ color: sportColorPrimary }} />
                  )}
                  {showMoon && !showCheck && (
                    <Moon className="h-4 w-4 text-gray-400" />
                  )}
                  {showMissed && (
                    <X className="h-4 w-4 text-rose-400" />
                  )}
                  {!showCheck && !showMoon && !showMissed && day.isToday && (
                    <Play className="h-3.5 w-3.5" style={{ color: sportColorPrimary }} />
                  )}
                </div>

                {/* Minuten */}
                {!day.isRestDay && day.totalMinutes > 0 && (
                  <span className="text-center leading-none" style={{ fontSize: 9, color: textColor, opacity: 0.7 }}>
                    {day.totalMinutes}′
                  </span>
                )}
              </div>
            )
          })}
        </motion.div>

        {/* ── Stats-Leiste ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mb-5 grid grid-cols-3 gap-3"
        >
          {(
            [
              {
                Icon: Clock,
                label: 'Dauer',
                value: `${todayDay?.totalMinutes ?? 0} Min.`,
              },
              {
                Icon: Dumbbell,
                label: 'Übungen',
                value: String(totalExercises),
              },
              {
                Icon: FlameIcon,
                label: 'Kalorien',
                value: `~${estimatedCaloriesBurnPerSession} kcal`,
              },
            ] as const
          ).map(({ Icon, label, value }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-4"
            >
              <div
                className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${sportColorPrimary}12` }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color: sportColorPrimary }} />
              </div>
              <p className="text-base font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Fortschritts-Donut ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="mb-5 rounded-2xl border border-gray-100 bg-white p-5"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Planfortschritt
          </p>
          <ProgressDonut
            percent={percentComplete}
            color={sportColorPrimary}
            completedSessions={completedSessions}
            totalSessions={totalSessions}
          />
        </motion.div>

        {/* ── Warmup-Hinweis ────────────────────────────────────── */}
        {(todayDay?.warmupMinutes ?? 0) > 0 && !isTodayRestDay && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14 }}
            className="mb-5 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3"
          >
            <Flame className="h-5 w-5 flex-shrink-0 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800">
                Aufwärmen nicht vergessen!
              </p>
              <p className="text-xs text-orange-700">
                {todayDay!.warmupMinutes} Min. Aufwärmen vor dem Training empfohlen.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Heute erledigt / Ruhetag ──────────────────────────── */}
        {isTodayCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{
              background: `${sportColorPrimary}10`,
              border: `1px solid ${sportColorPrimary}40`,
            }}
          >
            <CheckCircle2
              className="h-6 w-6 flex-shrink-0"
              style={{ color: sportColorPrimary }}
            />
            <div>
              <p className="font-semibold" style={{ color: sportColorPrimary }}>
                Heute bereits abgeschlossen
              </p>
              <p className="text-xs text-gray-500">
                Hervorragende Arbeit! Bis morgen.
              </p>
            </div>
          </motion.div>
        )}

        {isTodayRestDay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4"
          >
            <Moon className="h-6 w-6 flex-shrink-0 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-700">Heute: Ruhetag</p>
              <p className="text-xs text-gray-500">
                Erholung ist Teil des Trainings. Genieß den Tag!
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Übungsliste ───────────────────────────────────────── */}
        {!isTodayRestDay && todayDay !== null && exercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="mb-5"
          >
            {/* Fokus-Header */}
            {todayDay.focus !== undefined && todayDay.focus !== '' && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {todayDay.focus}
              </p>
            )}

            <div className="flex flex-col gap-3">
              {exercises.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.18 + i * 0.04 }}
                >
                  <UebungsCard
                    exercise={ex}
                    exerciseIndex={i}
                    isCompleted={completedExercises.has(i)}
                    onToggleComplete={handleToggleExercise}
                    sportColorPrimary={sportColorPrimary}
                  />
                </motion.div>
              ))}
            </div>

            {/* Progress Hint */}
            {totalExercises > 0 && (
              <p className="mt-3 text-center text-xs text-gray-400">
                {completedExercises.size} von {totalExercises} Übungen abgehakt
              </p>
            )}
          </motion.div>
        )}

        {/* ── Cooldown-Hinweis ──────────────────────────────────── */}
        {(todayDay?.cooldownMinutes ?? 0) > 0 && !isTodayRestDay && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <Zap className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Cooldown
              </p>
              <p className="text-xs text-blue-700">
                {todayDay!.cooldownMinutes} Min. Abkühlen und Dehnen nach dem Training empfohlen.
              </p>
            </div>
          </div>
        )}

        {/* ── Safety Warnings (collapsible) ─────────────────────── */}
        {safetyWarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              onClick={() => setWarningsOpen((o) => !o)}
              aria-expanded={warningsOpen}
            >
              <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0 text-amber-500" />
              <span className="flex-1 text-sm font-semibold text-amber-800">
                Sicherheitshinweise ({safetyWarnings.length})
              </span>
              {warningsOpen ? (
                <ChevronUp className="h-4 w-4 text-amber-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-amber-500" />
              )}
            </button>

            <AnimatePresence>
              {warningsOpen && (
                <motion.ul
                  key="warnings"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-0">
                    <div className="flex flex-col gap-1.5">
                      {safetyWarnings.map((w, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-amber-800"
                          style={{ listStyle: 'none' }}
                        >
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                          {w}
                        </li>
                      ))}
                    </div>
                  </div>
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── KI-Attribution (Desktop) ──────────────────────────── */}
        <p className="mt-4 text-center text-xs text-gray-400">
          {attribution}
        </p>

        {/* ── Desktop-Abschluss-Button ──────────────────────────── */}
        {showCompleteButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 hidden sm:block"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${sportColorPrimary} 0%, ${sportColorPrimary}CC 100%)`,
                boxShadow: `0 8px 24px ${sportColorGlow}`,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Training abschließen
              </span>
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Mobile Sticky Bottom Button ───────────────────────────── */}
      <AnimatePresence>
        {showCompleteButton && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 sm:hidden"
            style={{
              background:
                'linear-gradient(to top, rgba(250,250,250,1) 60%, rgba(250,250,250,0))',
            }}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-2xl py-4 text-base font-bold text-white shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${sportColorPrimary} 0%, ${sportColorPrimary}CC 100%)`,
                boxShadow: `0 8px 24px ${sportColorGlow}`,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Training abschließen
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Abschluss-Modal ───────────────────────────────────────── */}
      {todayDay !== null && (
        <AbschlussModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          planId={planId}
          weekNumber={data.currentWeekNumber}
          todayDay={todayDay}
          completedExerciseNames={completedExerciseNames}
          sportColorPrimary={sportColorPrimary}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
