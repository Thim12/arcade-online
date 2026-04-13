'use client'

// ─────────────────────────────────────────────────────────────────
// app/training/erstellen/ErstellenClient.tsx
//
// 5-Schritt-Wizard zur Trainingsplan-Erstellung.
// Kein externer KI-Bot – vollständig eigene TypeScript-KI.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Activity,
  Dumbbell,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lock,
  Flame,
} from 'lucide-react'
import type { ErstellenPageProps, UserSportForWizard } from './page'
import type { SportSlug } from '@/lib/sport-profiles'
import type { SportLevel, UserGoal } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

interface WizardFormData {
  sportSlug: SportSlug
  goals: UserGoal[]
  level: SportLevel
  durationWeeks: 4 | 6 | 8 | 12
  sessionsPerWeek: number
  minutesPerSession: 20 | 30 | 45 | 60 | 90
  equipment: string[]
  injuredAreas: string[]
  injuryNotes: string
}

interface PreviewDay {
  dayName: string
  isRestDay: boolean
  focus: string | null
  totalMinutes: number
  exerciseCount: number
}

interface GenerateResult {
  planId: string
  planName: string
  durationWeeks: number
  sessionsPerWeek: number
  firstWeekPreview: {
    weekNumber: number
    focus: string
    weeklyGoal: string
    days: PreviewDay[]
  } | null
}

type Step = 1 | 2 | 3 | 4 | 5

// ─────────────────────────────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────────────────────────────

const GOAL_META: Record<UserGoal, { label: string; icon: React.ReactNode; description: string }> = {
  FITNESS:             { label: 'Fitness verbessern',   icon: <Activity size={20} />,     description: 'Kondition, Ausdauer & allgemeine Fitness' },
  WETTKAMPF:           { label: 'Wettkampf',            icon: <Zap size={20} />,           description: 'Vorbereitung auf Turniere & Matches' },
  FREIZEITSPORT:       { label: 'Freizeitsport',        icon: <CheckCircle size={20} />,   description: 'Spaß & regelmäßige Bewegung' },
  ABNEHMEN:            { label: 'Abnehmen',             icon: <TrendingDown size={20} />,  description: 'Kalorien verbrennen & Gewicht reduzieren' },
  MUSKELAUFBAU:        { label: 'Muskelaufbau',         icon: <Dumbbell size={20} />,      description: 'Kraft & Muskelmasse aufbauen' },
  TECHNIK_VERBESSERN:  { label: 'Technik verbessern',   icon: <Target size={20} />,        description: 'Bewegungsmuster & sportspezifische Technik' },
}

const SPORT_SPECIFIC_GOALS: Record<SportSlug, Array<{ goal: UserGoal; label: string }>> = {
  fussball:   [
    { goal: 'FITNESS',            label: 'Schnelligkeit & Sprintpower' },
    { goal: 'WETTKAMPF',          label: 'Torjäger werden' },
    { goal: 'TECHNIK_VERBESSERN', label: 'Passspiel & Dribbling' },
  ],
  tennis:     [
    { goal: 'TECHNIK_VERBESSERN', label: 'Aufschlag verbessern' },
    { goal: 'WETTKAMPF',          label: 'Turniervorbereitung' },
    { goal: 'FITNESS',            label: 'Court-Kondition' },
  ],
  basketball: [
    { goal: 'TECHNIK_VERBESSERN', label: 'Dreier & Ball-Handling' },
    { goal: 'FITNESS',            label: 'Explosivität & Sprungkraft' },
    { goal: 'WETTKAMPF',          label: 'Ligaspieler werden' },
  ],
}

interface IntensityCard {
  level: SportLevel
  label: string
  subtitle: string
  defaultSessions: number
  svgGradientId: string
}

const INTENSITY_CARDS: IntensityCard[] = [
  { level: 'ANFAENGER',        label: 'Sanft',    subtitle: 'Schonend einsteigen',          defaultSessions: 2, svgGradientId: 'sanft' },
  { level: 'FORTGESCHRITTENE', label: 'Moderat',  subtitle: 'Gleichmäßig aufbauen',         defaultSessions: 3, svgGradientId: 'moderat' },
  { level: 'WETTKAMPF',        label: 'Intensiv', subtitle: 'Spürbare Herausforderung',     defaultSessions: 4, svgGradientId: 'intensiv' },
  { level: 'PROFI',            label: 'Profi',    subtitle: 'Maximale Leistung abrufen',    defaultSessions: 5, svgGradientId: 'profi' },
]

const DURATION_OPTIONS: Array<{ weeks: 4 | 6 | 8 | 12; label: string; recommended?: boolean }> = [
  { weeks: 4,  label: '4 Wochen' },
  { weeks: 6,  label: '6 Wochen' },
  { weeks: 8,  label: '8 Wochen', recommended: true },
  { weeks: 12, label: '12 Wochen' },
]

const MINUTES_OPTIONS: Array<20 | 30 | 45 | 60 | 90> = [20, 30, 45, 60, 90]

const INJURY_AREAS = [
  'Schulter',
  'Ellenbogen',
  'Handgelenk',
  'Rücken (oben)',
  'Rücken (unten)',
  'Hüfte',
  'Knie',
  'Sprunggelenk',
  'Oberschenkel',
  'Wade',
]

const EQUIPMENT_OPTIONS = [
  { id: 'KEIN_EQUIPMENT',  label: 'Kein Equipment' },
  { id: 'MATTE',           label: 'Trainingsmatte' },
  { id: 'THERABAND',       label: 'Theraband' },
  { id: 'HANTELN',         label: 'Kurzhanteln' },
  { id: 'SPRINGSEIL',      label: 'Springseil' },
  { id: 'HUETCHEN',        label: 'Hütchen' },
]

// Rotierender KI-Ladetext pro Sportart
const AI_LOADING_TEXTS: Record<SportSlug, string[]> = {
  fussball:   [
    'Analysiere deine Spielerposition...',
    'Berechne Periodisierungsplan...',
    'Wähle optimale Drills aus...',
    'Passe Intensität an...',
    'Erstelle Wochenstruktur...',
  ],
  tennis:     [
    'Analysiere deine Schlagtechnik...',
    'Berechne Court-Kondition...',
    'Wähle Übungen für deinen Level...',
    'Optimiere Aufschlag-Training...',
    'Erstelle Wochenstruktur...',
  ],
  basketball: [
    'Analysiere deine Position...',
    'Berechne Ball-Handling-Drills...',
    'Wähle Explosivitäts-Übungen...',
    'Optimiere Wurftechnik...',
    'Erstelle Wochenstruktur...',
  ],
}

// ─────────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────────────────────────

function getSportImage(slug: SportSlug): string {
  const ids: Record<SportSlug, string> = {
    fussball:   'photo-1529900748604-07564a03e7a6',
    tennis:     'photo-1554068865-24cecd4e34b8',
    basketball: 'photo-1546519638-68e109498ffc',
  }
  return `https://images.unsplash.com/${ids[slug]}?auto=format&fit=crop&w=1600&q=80`
}

function getSportGradient(slug: SportSlug): string {
  const gradients: Record<SportSlug, string> = {
    fussball:   'from-green-950 via-green-900 to-gray-950',
    tennis:     'from-orange-950 via-orange-900 to-gray-950',
    basketball: 'from-orange-950 via-red-900 to-gray-950',
  }
  return gradients[slug]
}

// ─────────────────────────────────────────────────────────────────
// Animations-Varianten
// ─────────────────────────────────────────────────────────────────

const stepVariants = {
  enter:  { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, x: -40, transition: { duration: 0.25 } },
}

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
}

// ─────────────────────────────────────────────────────────────────
// Schritt-Komponenten
// ─────────────────────────────────────────────────────────────────

// ─── Schritt 1: Sport + Ziel ──────────────────────────────────────

function Step1SportZiel({
  formData,
  setFormData,
  userSports,
}: {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
  userSports: UserSportForWizard[]
}) {
  const toggleGoal = (goal: UserGoal) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  const sportGoals = SPORT_SPECIFIC_GOALS[formData.sportSlug] ?? []

  return (
    <div className="space-y-8">
      {/* Sport-Auswahl (nur wenn mehrere Sportarten) */}
      {userSports.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Sportart
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {userSports.map((sport, i) => {
              const isSelected = formData.sportSlug === sport.slug
              return (
                <motion.button
                  key={sport.slug}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, sportSlug: sport.slug }))
                  }
                  className={[
                    'relative p-4 rounded-xl border text-left transition-all duration-200',
                    isSelected
                      ? 'border-[var(--sport-primary)] bg-[var(--sport-primary)]/10 shadow-[0_0_20px_var(--sport-glow)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20',
                  ].join(' ')}
                  data-sport={sport.slug}
                >
                  <div className="font-semibold text-white">{sport.name}</div>
                  {isSelected && (
                    <div
                      className="absolute top-2 right-2 w-2 h-2 rounded-full"
                      style={{ background: 'var(--sport-primary)' }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* Ziele */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Was sind deine Ziele? <span className="text-white/40">(mehrere möglich)</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(GOAL_META) as UserGoal[]).map((goal, i) => {
            const meta = GOAL_META[goal]
            const isSelected = formData.goals.includes(goal)
            return (
              <motion.button
                key={goal}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => toggleGoal(goal)}
                className={[
                  'relative flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[var(--sport-primary)] bg-[var(--sport-primary)]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                ].join(' ')}
              >
                <span
                  className="mt-0.5 shrink-0"
                  style={{ color: isSelected ? 'var(--sport-primary)' : 'rgba(255,255,255,0.5)' }}
                >
                  {meta.icon}
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{meta.label}</div>
                  <div className="text-xs text-white/50 mt-0.5">{meta.description}</div>
                </div>
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ background: 'var(--sport-primary)' }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Sport-spezifische Zusatzziele */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          {formData.sportSlug === 'fussball' ? 'Fußball-Schwerpunkte' :
           formData.sportSlug === 'tennis' ? 'Tennis-Schwerpunkte' : 'Basketball-Schwerpunkte'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {sportGoals.map(({ goal, label }) => {
            const isSelected = formData.goals.includes(goal)
            return (
              <button
                key={`${goal}-${label}`}
                onClick={() => toggleGoal(goal)}
                className={[
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200',
                  isSelected
                    ? 'border-[var(--sport-primary)] bg-[var(--sport-primary)]/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Schritt 2: Intensität + Dauer ───────────────────────────────

function Step2Intensitaet({
  formData,
  setFormData,
}: {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
}) {
  return (
    <div className="space-y-8">
      {/* Intensität */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Trainingsintensität
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {INTENSITY_CARDS.map((card, i) => {
            const isSelected = formData.level === card.level
            return (
              <motion.button
                key={card.level}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    level: card.level,
                    sessionsPerWeek: card.defaultSessions,
                  }))
                }}
                className={[
                  'relative overflow-hidden p-5 rounded-xl border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[var(--sport-primary)] shadow-[0_0_20px_var(--sport-glow)]'
                    : 'border-white/10 hover:border-white/20',
                ].join(' ')}
              >
                {/* SVG-Hintergrund-Illustration */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-10"
                  viewBox="0 0 200 100"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {card.svgGradientId === 'sanft' && (
                    <path d="M0,80 Q50,40 100,60 T200,50 L200,100 L0,100Z"
                      fill="var(--sport-primary)" />
                  )}
                  {card.svgGradientId === 'moderat' && (
                    <path d="M0,70 Q30,20 70,50 Q110,80 150,30 Q170,10 200,40 L200,100 L0,100Z"
                      fill="var(--sport-primary)" />
                  )}
                  {card.svgGradientId === 'intensiv' && (
                    <>
                      <path d="M0,60 L40,20 L80,55 L120,15 L160,50 L200,20 L200,100 L0,100Z"
                        fill="var(--sport-primary)" />
                    </>
                  )}
                  {card.svgGradientId === 'profi' && (
                    <>
                      <path d="M0,50 L25,10 L50,40 L75,5 L100,35 L125,0 L150,30 L175,5 L200,20 L200,100 L0,100Z"
                        fill="var(--sport-primary)" />
                    </>
                  )}
                </svg>

                <div className="relative z-10">
                  <div className="text-lg font-bold text-white">{card.label}</div>
                  <div className="text-sm text-white/60 mt-1">{card.subtitle}</div>
                  <div className="text-xs text-white/40 mt-2">
                    {card.defaultSessions}×/Woche empfohlen
                  </div>
                </div>

                {isSelected && (
                  <div
                    className="absolute top-3 right-3 w-3 h-3 rounded-full"
                    style={{ background: 'var(--sport-primary)' }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Dauer */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Plandauer
        </h3>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map(({ weeks, label, recommended }) => {
            const isSelected = formData.durationWeeks === weeks
            return (
              <button
                key={weeks}
                onClick={() => setFormData((prev) => ({ ...prev, durationWeeks: weeks }))}
                className={[
                  'relative px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200',
                  isSelected
                    ? 'border-[var(--sport-primary)] bg-[var(--sport-primary)]/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20',
                ].join(' ')}
              >
                {label}
                {recommended === true && (
                  <span
                    className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'var(--sport-primary)',
                      color: '#fff',
                      fontSize: '10px',
                    }}
                  >
                    Empfohlen
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Einheiten/Woche Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Einheiten pro Woche
          </h3>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: 'var(--sport-primary)' }}
          >
            {formData.sessionsPerWeek}×
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={6}
          step={1}
          value={formData.sessionsPerWeek}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, sessionsPerWeek: Number(e.target.value) }))
          }
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--sport-primary) 0%, var(--sport-primary) ${((formData.sessionsPerWeek - 2) / 4) * 100}%, rgba(255,255,255,0.1) ${((formData.sessionsPerWeek - 2) / 4) * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>2×</span><span>3×</span><span>4×</span><span>5×</span><span>6×</span>
        </div>
      </div>

      {/* Minuten/Einheit */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Minuten pro Einheit
        </h3>
        <div className="flex gap-2">
          {MINUTES_OPTIONS.map((min) => {
            const isSelected = formData.minutesPerSession === min
            return (
              <button
                key={min}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, minutesPerSession: min }))
                }
                className={[
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200',
                  isSelected
                    ? 'border-[var(--sport-primary)] bg-[var(--sport-primary)]/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20',
                ].join(' ')}
              >
                {min}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Schritt 3: Equipment ─────────────────────────────────────────

function Step3Equipment({
  formData,
  setFormData,
  gymAccessEnabled,
  birthYear,
}: {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
  gymAccessEnabled: boolean
  birthYear: number | null
}) {
  const isUnder14 = birthYear !== null && (new Date().getFullYear() - birthYear) < 14

  const toggleEquipment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(id)
        ? prev.equipment.filter((e) => e !== id)
        : [...prev.equipment, id],
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-1">
          Verfügbares Equipment
        </h3>
        <p className="text-sm text-white/40 mb-4">
          Wähle aus, was dir zu Hause oder im Training zur Verfügung steht.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_OPTIONS.map((eq, i) => {
            const isSelected = formData.equipment.includes(eq.id)
            return (
              <motion.button
                key={eq.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => toggleEquipment(eq.id)}
                className={[
                  'flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[var(--sport-primary)] bg-[var(--sport-primary)]/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center',
                    isSelected ? 'border-[var(--sport-primary)]' : 'border-white/20',
                  ].join(' ')}
                  style={isSelected ? { background: 'var(--sport-primary)' } : {}}
                >
                  {isSelected && (
                    <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{eq.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Fitnessstudio-Option */}
      {gymAccessEnabled && !isUnder14 ? (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => toggleEquipment('FITNESSSTUDIO')}
          className={[
            'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
            formData.equipment.includes('FITNESSSTUDIO')
              ? 'border-[var(--sport-primary)] bg-[var(--sport-primary)]/10'
              : 'border-white/10 bg-white/5 hover:border-white/20',
          ].join(' ')}
        >
          <Dumbbell size={24} style={{ color: 'var(--sport-primary)' }} />
          <div className="text-left">
            <div className="text-sm font-semibold text-white">Fitnessstudio</div>
            <div className="text-xs text-white/50">Geräte, Freihanteln, Kabelzug</div>
          </div>
          {formData.equipment.includes('FITNESSSTUDIO') && (
            <div
              className="ml-auto w-3 h-3 rounded-full"
              style={{ background: 'var(--sport-primary)' }}
            />
          )}
        </motion.button>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/3 opacity-50">
          <Lock size={20} className="text-white/30" />
          <div>
            <div className="text-sm font-semibold text-white/50">Fitnessstudio</div>
            <div className="text-xs text-white/30">
              {isUnder14
                ? 'Für Unter-14-Jährige nicht verfügbar'
                : 'Kein Gym-Zugang in deinem Profil'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Schritt 4: Verletzungen ──────────────────────────────────────

function Step4Verletzungen({
  formData,
  setFormData,
}: {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
}) {
  const toggleArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      injuredAreas: prev.injuredAreas.includes(area)
        ? prev.injuredAreas.filter((a) => a !== area)
        : [...prev.injuredAreas, area],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5"
      >
        <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-200/80 leading-relaxed">
          SportRise ersetzt keine ärztliche Beratung. Bei anhaltenden Schmerzen oder
          Verletzungen wende dich an einen Arzt oder Physiotherapeuten, bevor du mit
          dem Training beginnst.
        </p>
      </motion.div>

      {/* Körperbereiche */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Aktuelle Beschwerden
          <span className="ml-2 text-white/30 normal-case font-normal">(optional)</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {INJURY_AREAS.map((area, i) => {
            const isSelected = formData.injuredAreas.includes(area)
            return (
              <motion.button
                key={area}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => toggleArea(area)}
                className={[
                  'flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all duration-200',
                  isSelected
                    ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20',
                ].join(' ')}
              >
                {isSelected && <AlertTriangle size={14} className="text-yellow-400 shrink-0" />}
                <span className="font-medium">{area}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Freitext */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Weitere Hinweise
          </h3>
          <span className="text-xs text-white/30">
            {formData.injuryNotes.length}/300
          </span>
        </div>
        <textarea
          value={formData.injuryNotes}
          onChange={(e) => {
            if (e.target.value.length <= 300) {
              setFormData((prev) => ({ ...prev, injuryNotes: e.target.value }))
            }
          }}
          placeholder="z.B. Knie-OP vor 3 Monaten, leichte Rückenbeschwerden..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[var(--sport-primary)] resize-none"
        />
      </div>
    </div>
  )
}

// ─── Schritt 5: KI generiert ──────────────────────────────────────

function Step5Generierung({
  formData,
  userSports,
  onGenerate,
  result,
  isGenerating,
  error,
}: {
  formData: WizardFormData
  userSports: UserSportForWizard[]
  onGenerate: () => void
  result: GenerateResult | null
  isGenerating: boolean
  error: string | null
}) {
  const [textIndex, setTextIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const texts = AI_LOADING_TEXTS[formData.sportSlug] ?? AI_LOADING_TEXTS['fussball']

  // Text-Rotation während Generierung
  useEffect(() => {
    if (!isGenerating) return
    intervalRef.current = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length)
    }, 1500)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [isGenerating, texts.length])

  // Progress-Animation
  useEffect(() => {
    if (!isGenerating) return
    setProgress(0)
    const start = Date.now()
    const dur = 6000
    const frame = () => {
      const elapsed = Date.now() - start
      const p = Math.min((elapsed / dur) * 100, 95)
      setProgress(p)
      if (p < 95) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [isGenerating])

  // Bei Ergebnis: Progress auf 100
  useEffect(() => {
    if (result !== null) setProgress(100)
  }, [result])

  const sportName = userSports.find((s) => s.slug === formData.sportSlug)?.name ?? 'Sport'

  return (
    <div className="relative min-h-[400px]">
      <AnimatePresence mode="wait">
        {/* Laden */}
        {isGenerating && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-8"
          >
            {/* Konzentrische Ringe */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {[60, 80, 100].map((size, i) => (
                <motion.div
                  key={size}
                  className="absolute rounded-full border"
                  style={{
                    width: size,
                    height: size,
                    borderColor: 'var(--sport-primary)',
                    opacity: 0.2 + i * 0.25,
                  }}
                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }}
                />
              ))}
              <Flame size={28} style={{ color: 'var(--sport-primary)' }} />
            </div>

            {/* Progress-Linie */}
            <div className="w-full max-w-xs">
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--sport-primary)', width: `${progress}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Rotierender Text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={textIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-white/60 text-center"
              >
                {texts[textIndex]}
              </motion.p>
            </AnimatePresence>

            <p className="text-xs text-white/30 text-center">
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </motion.div>
        )}

        {/* Fehler */}
        {!isGenerating && error !== null && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-12 gap-6 text-center"
          >
            <AlertTriangle size={40} className="text-red-400" />
            <p className="text-red-300 text-sm max-w-sm">{error}</p>
            <button
              onClick={onGenerate}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'var(--sport-primary)' }}
            >
              Erneut versuchen
            </button>
          </motion.div>
        )}

        {/* Ergebnis */}
        {!isGenerating && result !== null && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Plan-Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-2xl border border-[var(--sport-primary)]/30 bg-[var(--sport-primary)]/5"
            >
              <div className="flex items-start gap-3">
                <CheckCircle size={22} style={{ color: 'var(--sport-primary)' }} className="shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white leading-snug">{result.planName}</h3>
                  <p className="text-sm text-white/50 mt-1">
                    {result.durationWeeks} Wochen · {result.sessionsPerWeek}× pro Woche · {sportName}
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/30 mt-3">
                Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
              </p>
            </motion.div>

            {/* Erste Woche Preview */}
            {result.firstWeekPreview !== null && (
              <div>
                <motion.h4
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3"
                >
                  Woche 1 – {result.firstWeekPreview.focus}
                </motion.h4>
                <div className="grid grid-cols-7 gap-1.5">
                  {result.firstWeekPreview.days.map((day, i) => (
                    <motion.div
                      key={day.dayName}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                      className={[
                        'flex flex-col items-center p-2 rounded-xl border text-center',
                        day.isRestDay
                          ? 'border-white/5 bg-white/3'
                          : 'border-[var(--sport-primary)]/30 bg-[var(--sport-primary)]/5',
                      ].join(' ')}
                    >
                      <span className="text-xs text-white/40 font-medium">
                        {day.dayName.slice(0, 2)}
                      </span>
                      {day.isRestDay ? (
                        <span className="text-xs text-white/20 mt-1">Ruhe</span>
                      ) : (
                        <>
                          <span
                            className="text-xs font-bold mt-1"
                            style={{ color: 'var(--sport-primary)' }}
                          >
                            {day.totalMinutes}m
                          </span>
                          <span className="text-xs text-white/30 mt-0.5">
                            {day.exerciseCount} Üb.
                          </span>
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xs text-white/40 mt-3 italic"
                >
                  {result.firstWeekPreview.weeklyGoal}
                </motion.p>
              </div>
            )}
          </motion.div>
        )}

        {/* Start-Button (vor Generierung) */}
        {!isGenerating && result === null && error === null && (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-12 gap-6 text-center"
          >
            {/* KI-Ringe (statisch) */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {[55, 75, 95].map((size, i) => (
                <div
                  key={size}
                  className="absolute rounded-full border"
                  style={{
                    width: size,
                    height: size,
                    borderColor: 'var(--sport-primary)',
                    opacity: 0.15 + i * 0.2,
                  }}
                />
              ))}
              <Flame size={24} style={{ color: 'var(--sport-primary)' }} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Alles bereit?</h3>
              <p className="text-sm text-white/50 mt-2 max-w-xs">
                Unsere KI erstellt deinen persönlichen {formData.durationWeeks}-Wochen-Plan für {sportName}.
              </p>
            </div>

            <p className="text-xs text-white/30">
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Fortschrittsbalken
// ─────────────────────────────────────────────────────────────────

function WizardProgress({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Sport & Ziel' },
    { n: 2, label: 'Intensität' },
    { n: 3, label: 'Equipment' },
    { n: 4, label: 'Gesundheit' },
    { n: 5, label: 'Generierung' },
  ]

  return (
    <div className="flex items-center gap-1">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-1 flex-1">
          <div className="flex flex-col items-center">
            <div
              className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                step > n
                  ? 'text-white'
                  : step === n
                  ? 'text-white'
                  : 'bg-white/10 text-white/30',
              ].join(' ')}
              style={
                step >= n
                  ? { background: 'var(--sport-primary)' }
                  : {}
              }
            >
              {step > n ? (
                <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M2 6l3 3 5-5" />
                </svg>
              ) : (
                n
              )}
            </div>
            <span
              className={[
                'text-xs mt-1 whitespace-nowrap hidden sm:block',
                step === n ? 'text-white/70' : 'text-white/25',
              ].join(' ')}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px bg-white/10 relative -mt-4 sm:-mt-5">
              {step > n && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 origin-left"
                  style={{ background: 'var(--sport-primary)' }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Component
// ─────────────────────────────────────────────────────────────────

export function ErstellenClient({
  userSports,
  gymAccessEnabled,
  birthYear,
  primarySportSlug,
  usedThisMonth,
}: ErstellenPageProps) {
  const router = useRouter()

  // Initiale Sport-Auswahl: primarySport oder erste Sport
  const initialSport: SportSlug =
    (primarySportSlug !== null &&
      userSports.some((s) => s.slug === primarySportSlug))
      ? (primarySportSlug as SportSlug)
      : (userSports[0]?.slug ?? 'fussball')

  const initialSportData = userSports.find((s) => s.slug === initialSport)

  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)

  const [formData, setFormData] = useState<WizardFormData>({
    sportSlug:         initialSport,
    goals:             initialSportData?.goals ?? [],
    level:             initialSportData?.level ?? 'ANFAENGER',
    durationWeeks:     8,
    sessionsPerWeek:   3,
    minutesPerSession: 45,
    equipment:         initialSportData?.equipment ?? [],
    injuredAreas:      [],
    injuryNotes:       '',
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const activeSport = userSports.find((s) => s.slug === formData.sportSlug)

  // Sport CSS-Variablen updaten wenn sich sportSlug ändert
  useEffect(() => {
    if (activeSport === undefined) return
    const root = document.documentElement
    root.style.setProperty('--sport-primary', activeSport.colorPrimary)
    root.style.setProperty('--sport-glow', activeSport.colorGlow)
  }, [activeSport])

  // ── Navigations-Logik ─────────────────────────────────────────
  const canProceed = (): boolean => {
    if (step === 1) return formData.goals.length > 0
    if (step === 5) return !isGenerating && generateResult !== null
    return true
  }

  const goNext = () => {
    if (!canProceed()) return
    if (step === 4) {
      setDirection(1)
      setStep(5)
      // Automatisch Generierung starten
      setTimeout(() => handleGenerate(), 200)
      return
    }
    if (step === 5 && generateResult !== null) {
      router.push('/training')
      return
    }
    setDirection(1)
    setStep((prev) => Math.min(prev + 1, 5) as Step)
  }

  const goBack = () => {
    if (step === 1) {
      router.push('/training')
      return
    }
    if (step === 5 && (isGenerating || generateResult !== null)) return
    setDirection(-1)
    setStep((prev) => Math.max(prev - 1, 1) as Step)
  }

  // ── Plan generieren ───────────────────────────────────────────
  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerateError(null)
    setGenerateResult(null)

    try {
      const response = await fetch('/api/training/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sportSlug:         formData.sportSlug,
          level:             formData.level,
          durationWeeks:     formData.durationWeeks,
          sessionsPerWeek:   formData.sessionsPerWeek,
          goals:             formData.goals,
          minutesPerSession: formData.minutesPerSession,
          equipment:         formData.equipment,
          injuredAreas:      formData.injuredAreas,
          injuryNotes:       formData.injuryNotes,
        }),
      })

      const json = (await response.json()) as {
        success?: boolean
        data?: GenerateResult
        error?: string
        code?: string
      }

      if (!response.ok || json.success !== true || json.data === undefined) {
        setGenerateError(json.error ?? 'Unbekannter Fehler beim Generieren.')
        return
      }

      setGenerateResult(json.data)
    } catch {
      setGenerateError('Netzwerkfehler. Bitte überprüfe deine Verbindung.')
    } finally {
      setIsGenerating(false)
    }
  }

  const STEP_TITLES: Record<Step, string> = {
    1: 'Sport & Ziel',
    2: 'Intensität & Dauer',
    3: 'Equipment',
    4: 'Gesundheit & Verletzungen',
    5: 'KI erstellt deinen Plan',
  }

  const isAtLimit = usedThisMonth >= 3

  return (
    <div
      className="min-h-screen bg-[#0a0a0f] text-white"
      data-sport={formData.sportSlug}
    >
      {/* Hintergrund-Sport-Bild (Schritt 5) */}
      {step === 5 && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getSportImage(formData.sportSlug)}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.08 }}
            loading="lazy"
          />
          <div
            className={[
              'absolute inset-0 bg-gradient-to-b',
              getSportGradient(formData.sportSlug),
            ].join(' ')}
            style={{ opacity: 0.85 }}
          />
        </div>
      )}

      <div className="relative z-10 max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            {step === 5 ? 'Dein Trainingsplan' : 'Plan erstellen'}
          </h1>
          <p className="text-sm text-white/50 mt-1">{STEP_TITLES[step]}</p>
        </div>

        {/* Rate-Limit-Banner */}
        {isAtLimit && step < 5 && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              Du hast diesen Monat bereits 3 Pläne erstellt. Nächsten Monat kannst du
              neue Pläne generieren.
            </p>
          </div>
        )}

        {/* Fortschrittsbalken */}
        <div className="mb-8">
          <WizardProgress step={step} />
        </div>

        {/* Schritt-Inhalt */}
        <div className="min-h-[420px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {step === 1 && (
                <Step1SportZiel
                  formData={formData}
                  setFormData={setFormData}
                  userSports={userSports}
                />
              )}
              {step === 2 && (
                <Step2Intensitaet
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {step === 3 && (
                <Step3Equipment
                  formData={formData}
                  setFormData={setFormData}
                  gymAccessEnabled={gymAccessEnabled}
                  birthYear={birthYear}
                />
              )}
              {step === 4 && (
                <Step4Verletzungen
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {step === 5 && (
                <Step5Generierung
                  formData={formData}
                  userSports={userSports}
                  onGenerate={handleGenerate}
                  result={generateResult}
                  isGenerating={isGenerating}
                  error={generateError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            onClick={goBack}
            disabled={step === 5 && (isGenerating || generateResult !== null)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">Zurück</span>
          </button>

          {/* CTAs für Schritt 5 nach Generierung */}
          {step === 5 && generateResult !== null ? (
            <div className="flex gap-3 flex-1 justify-end">
              <button
                onClick={() => router.push('/training')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200"
                style={{ background: 'var(--sport-primary)' }}
              >
                Zum Training
                <ChevronRight size={18} />
              </button>
            </div>
          ) : step !== 5 ? (
            <button
              onClick={goNext}
              disabled={!canProceed() || isAtLimit}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              style={{ background: canProceed() && !isAtLimit ? 'var(--sport-primary)' : 'rgba(255,255,255,0.1)' }}
            >
              <span className="text-sm">
                {step === 4 ? 'Plan generieren' : 'Weiter'}
              </span>
              <ChevronRight size={18} />
            </button>
          ) : null}
        </div>
      </div>

      {/* CSS-Fallback für Sport Custom Properties */}
      <style>{`
        :root {
          --sport-primary: #16A34A;
          --sport-secondary: #15803D;
          --sport-accent: #DCFCE7;
          --sport-glow: rgba(22,163,74,0.35);
        }
        [data-sport="fussball"] {
          --sport-primary: #16A34A;
          --sport-secondary: #15803D;
          --sport-accent: #DCFCE7;
          --sport-glow: rgba(22,163,74,0.35);
        }
        [data-sport="tennis"] {
          --sport-primary: #C2621A;
          --sport-secondary: #9A4E15;
          --sport-accent: #FFEDD5;
          --sport-glow: rgba(194,98,26,0.35);
        }
        [data-sport="basketball"] {
          --sport-primary: #EA580C;
          --sport-secondary: #C2490A;
          --sport-accent: #FFEDD5;
          --sport-glow: rgba(234,88,12,0.35);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--sport-primary);
          cursor: pointer;
          box-shadow: 0 0 8px var(--sport-glow);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--sport-primary);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
