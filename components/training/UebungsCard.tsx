'use client'

// ─────────────────────────────────────────────────────────────────
// UebungsCard – Interaktive Übungskarte für das Training-Dashboard
//
// Features:
//   - Aufklappen / Zuklappen (Framer Motion)
//   - Satz-Tracking mit Eingabefeldern
//   - Pause-Timer mit SVG-Donut und Web Audio API Sound
//   - YouTube-Suchlink
//   - Abgehakt-Zustand mit Animation
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Timer,
  Volume2,
  VolumeX,
  ExternalLink,
  Dumbbell,
  AlertTriangle,
  ListChecks,
} from 'lucide-react'

// ── Typen ────────────────────────────────────────────────────────

export interface PlanExercise {
  name: string
  sets?: number
  reps?: number
  restSeconds?: number
  description: string
  instructions: string[]
  muscleGroups: string[]
  difficulty: 'LEICHT' | 'MITTEL' | 'SCHWER'
  equipment: string[]
  isSportDrill: boolean
  injuryModifications: string[]
}

interface UebungsCardProps {
  exercise: PlanExercise
  exerciseIndex: number
  isCompleted: boolean
  onToggleComplete: (index: number) => void
  sportColorPrimary?: string
}

// ── Farb-Mapping für Schwierigkeitsgrad ──────────────────────────

const DIFFICULTY_COLORS: Record<PlanExercise['difficulty'], string> = {
  LEICHT: 'text-emerald-600 bg-emerald-50',
  MITTEL: 'text-amber-600 bg-amber-50',
  SCHWER: 'text-red-600 bg-red-50',
}

const DIFFICULTY_LABELS: Record<PlanExercise['difficulty'], string> = {
  LEICHT: 'Leicht',
  MITTEL: 'Mittel',
  SCHWER: 'Schwer',
}

// ── Pause-Timer Komponente ───────────────────────────────────────

interface PauseTimerProps {
  totalSeconds: number
  onComplete: () => void
  soundEnabled: boolean
}

function PauseTimer({ totalSeconds, onComplete, soundEnabled }: PauseTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const hasCompleted = useRef(false)

  const playBeep = useCallback(() => {
    if (!soundEnabled) return
    try {
      if (audioCtxRef.current === null) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch {
      // AudioContext nicht verfügbar (z.B. SSR) – stillschweigend ignorieren
    }
  }, [soundEnabled])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current !== null) clearInterval(intervalRef.current)
          if (!hasCompleted.current) {
            hasCompleted.current = true
            playBeep()
            onComplete()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [onComplete, playBeep])

  const progress = remaining / totalSeconds
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="5"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="var(--sport-primary, #16A34A)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
      </svg>
      <span className="text-sm font-mono font-bold text-gray-700 -mt-12">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}

// ── Hauptkomponente ──────────────────────────────────────────────

export function UebungsCard({
  exercise,
  exerciseIndex,
  isCompleted,
  onToggleComplete,
}: UebungsCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [completedSets, setCompletedSets] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const totalSets = exercise.sets ?? 3
  const restSeconds = exercise.restSeconds ?? 60

  const handleSetComplete = useCallback(() => {
    setCompletedSets((prev) => {
      const next = prev + 1
      if (next < totalSets) {
        setTimerKey((k) => k + 1)
        setTimerActive(true)
      }
      return next
    })
  }, [totalSets])

  const handleTimerComplete = useCallback(() => {
    setTimerActive(false)
  }, [])

  const handleToggle = useCallback(() => {
    onToggleComplete(exerciseIndex)
  }, [onToggleComplete, exerciseIndex])

  const youtubeQuery = encodeURIComponent(`${exercise.name} Übung Technik Erklärung`)
  const youtubeUrl = `https://www.youtube.com/results?search_query=${youtubeQuery}`

  return (
    <motion.div
      layout
      className={[
        'rounded-2xl border bg-white shadow-sm transition-colors duration-300',
        isCompleted
          ? 'border-[var(--sport-primary,#16A34A)] bg-[var(--sport-primary,#16A34A)]/5'
          : 'border-gray-200',
      ].join(' ')}
    >
      {/* ── Header (immer sichtbar) ────────────────────────────── */}
      <button
        type="button"
        className="flex w-full items-center gap-3 p-4 text-left"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
      >
        {/* Abgehakt-Checkbox */}
        <button
          type="button"
          className="shrink-0 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation()
            handleToggle()
          }}
          aria-label={isCompleted ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
        >
          <motion.span
            key={isCompleted ? 'done' : 'open'}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-[var(--sport-primary,#16A34A)]" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300" />
            )}
          </motion.span>
        </button>

        {/* Name + Meta */}
        <div className="min-w-0 flex-1">
          <span
            className={[
              'block truncate font-semibold text-gray-900 transition-all duration-200',
              isCompleted ? 'line-through text-gray-400' : '',
            ].join(' ')}
          >
            {exercise.name}
          </span>
          <span className="text-xs text-gray-500">
            {exercise.sets !== undefined && exercise.reps !== undefined
              ? `${exercise.sets} × ${exercise.reps} Wdh.`
              : exercise.sets !== undefined
              ? `${exercise.sets} Sätze`
              : 'Zeitbasiert'}
            {exercise.equipment.length > 0 && exercise.equipment[0] !== 'Kein Equipment'
              ? ` · ${exercise.equipment[0]}`
              : ''}
          </span>
        </div>

        {/* Schwierigkeit-Badge */}
        <span
          className={[
            'hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:block',
            DIFFICULTY_COLORS[exercise.difficulty],
          ].join(' ')}
        >
          {DIFFICULTY_LABELS[exercise.difficulty]}
        </span>

        {/* Chevron */}
        <span className="shrink-0 text-gray-400">
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      {/* ── Aufgeklappter Inhalt ───────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-4 pb-5 pt-0">
              {/* Beschreibung */}
              <p className="text-sm text-gray-600">{exercise.description}</p>

              {/* Anleitung */}
              {exercise.instructions.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <ListChecks className="h-3.5 w-3.5" />
                    Anleitung
                  </div>
                  <ol className="space-y-1.5 text-sm text-gray-700">
                    {exercise.instructions.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Muskelgruppen + Equipment */}
              <div className="flex flex-wrap gap-1.5">
                {exercise.muscleGroups.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                  >
                    {m}
                  </span>
                ))}
                {exercise.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
                  >
                    <Dumbbell className="h-3 w-3" />
                    {eq}
                  </span>
                ))}
              </div>

              {/* Verletzungsmodifikationen */}
              {exercise.injuryModifications.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Modifikationen bei Beschwerden
                  </div>
                  <ul className="space-y-0.5 text-xs text-amber-800">
                    {exercise.injuryModifications.map((mod, i) => (
                      <li key={i}>· {mod}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Satz-Tracking ──────────────────────────────── */}
              {exercise.sets !== undefined && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Satz-Tracking
                    </span>
                    <span className="text-xs text-gray-500">
                      {completedSets} / {totalSets} abgeschlossen
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: totalSets }).map((_, setIdx) => {
                      const done = setIdx < completedSets
                      return (
                        <motion.button
                          key={setIdx}
                          type="button"
                          onClick={() => {
                            if (!done) handleSetComplete()
                          }}
                          whileTap={{ scale: 0.92 }}
                          className={[
                            'flex h-10 w-16 items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200',
                            done
                              ? 'border-[var(--sport-primary,#16A34A)] bg-[var(--sport-primary,#16A34A)] text-white'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-[var(--sport-primary,#16A34A)]',
                          ].join(' ')}
                          aria-label={`Satz ${setIdx + 1} ${done ? 'abgeschlossen' : 'als abgeschlossen markieren'}`}
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <span>Satz {setIdx + 1}</span>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Pause-Timer */}
                  <AnimatePresence>
                    {timerActive && (
                      <motion.div
                        key={`timer-${timerKey}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm"
                      >
                        <PauseTimer
                          key={timerKey}
                          totalSeconds={restSeconds}
                          onComplete={handleTimerComplete}
                          soundEnabled={soundEnabled}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">
                            Pause
                          </p>
                          <p className="text-xs text-gray-500">
                            {restSeconds} Sek. Erholung
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSoundEnabled((s) => !s)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                          aria-label={soundEnabled ? 'Sound deaktivieren' : 'Sound aktivieren'}
                        >
                          {soundEnabled ? (
                            <Volume2 className="h-4 w-4" />
                          ) : (
                            <VolumeX className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimerActive(false)
                          }}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
                        >
                          Überspringen
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Alle Sätze abgeschlossen → Abschlusshint */}
                  {completedSets >= totalSets && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--sport-primary,#16A34A)]/10 px-3 py-2 text-sm font-medium text-[var(--sport-primary,#16A34A)]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Alle Sätze abgeschlossen
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── Timer-Info + YouTube-Link ──────────────────── */}
              <div className="flex items-center justify-between">
                {restSeconds > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Timer className="h-3.5 w-3.5" />
                    {restSeconds} Sek. Pause zwischen Sätzen
                  </div>
                )}
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Video-Erklärung
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
