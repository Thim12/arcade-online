// ─────────────────────────────────────────────────────────────────
// app/training/page.tsx – Training-Übersicht (Server Component)
//
// Lädt den aktiven Trainingsplan aus der DB, berechnet Wochentag,
// Wochenstreifen und Fortschritt – und gibt alles an das
// TrainingDashboard Client Component weiter.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TrainingDashboard } from '@/components/training/TrainingDashboard'
import type { TrainingPageData, PlanDay, WeekStripDay } from '@/components/training/TrainingDashboard'

// ── Lokale Plan-Daten-Typen (spiegeln GeneratedPlan aus training-ai.ts) ─

interface PlanExerciseRaw {
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

interface PlanDayRaw {
  dayName: string
  isRestDay: boolean
  focus?: string
  warmupMinutes?: number
  cooldownMinutes?: number
  totalMinutes: number
  notes?: string
  exercises: PlanExerciseRaw[]
}

interface PlanWeek {
  weekNumber: number
  focus: string
  weeklyGoal: string
  days: PlanDayRaw[]
}

interface GeneratedPlan {
  planName: string
  description: string
  estimatedCaloriesBurnPerSession: number
  weeks: PlanWeek[]
  progressionTips: string[]
  safetyWarnings: string[]
}

// ── Wochentag-Mapping (JS getDay() → DE-Index 0=Montag) ─────────

const JS_DAY_TO_DE_INDEX: Record<number, number> = {
  0: 6, // Sonntag
  1: 0, // Montag
  2: 1, // Dienstag
  3: 2, // Mittwoch
  4: 3, // Donnerstag
  5: 4, // Freitag
  6: 5, // Samstag
}

const DE_DAY_NAMES = [
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
] as const

// ── Hilfsfunktionen ───────────────────────────────────────────────

function toPlanDay(raw: PlanDayRaw): PlanDay {
  return {
    dayName: raw.dayName,
    isRestDay: raw.isRestDay,
    focus: raw.focus,
    warmupMinutes: raw.warmupMinutes,
    cooldownMinutes: raw.cooldownMinutes,
    totalMinutes: raw.totalMinutes,
    notes: raw.notes,
    exercises: (raw.exercises ?? []).map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
      description: ex.description,
      instructions: ex.instructions ?? [],
      muscleGroups: ex.muscleGroups ?? [],
      difficulty: ex.difficulty ?? 'MITTEL',
      equipment: ex.equipment ?? [],
      isSportDrill: ex.isSportDrill ?? false,
      injuryModifications: ex.injuryModifications ?? [],
    })),
  }
}

// ── Page Component ─────────────────────────────────────────────────

export default async function TrainingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/registrieren')

  const userId = session.user.id

  // Aktiven Plan laden inkl. Sport-Farben und abgeschlossener Sessions
  const plan = await prisma.trainingPlan.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      sport: {
        select: {
          slug: true,
          colorPrimary: true,
          colorLight: true,
          colorGlow: true,
        },
      },
      sessions: {
        select: { completedAt: true },
        orderBy: { completedAt: 'asc' },
      },
    },
  })

  // Kein aktiver Plan → Null-State
  if (plan === null) {
    return <TrainingDashboard data={null} />
  }

  const planData = plan.planData as unknown as GeneratedPlan
  const now = new Date()

  // Heute normalisiert (Mitternacht)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const todayKey = today.toISOString().slice(0, 10)

  // Heutiger DE-Wochentagsindex (0=Montag)
  const todayDeIndex = JS_DAY_TO_DE_INDEX[now.getDay()] ?? 0

  // Plan-Start normalisiert
  const planStart = new Date(plan.createdAt)
  planStart.setHours(0, 0, 0, 0)

  // Vergangene Tage seit Plan-Start
  const msPerDay = 24 * 60 * 60 * 1000
  const daysElapsed = Math.max(
    0,
    Math.floor((today.getTime() - planStart.getTime()) / msPerDay),
  )

  // Aktuelle Woche (0-basiert, cap an Gesamtwochen-1)
  const currentWeekIndex = Math.min(
    Math.floor(daysElapsed / 7),
    plan.durationWeeks - 1,
  )
  const currentWeekNumber = currentWeekIndex + 1

  const currentWeek: PlanWeek | undefined = planData.weeks[currentWeekIndex]

  // Heutiger Trainingstag
  const todayDayRaw: PlanDayRaw | undefined = currentWeek?.days[todayDeIndex]
  const todayDay: PlanDay | null =
    todayDayRaw !== undefined ? toPlanDay(todayDayRaw) : null

  // Abgeschlossene Sessions nach Datum gruppieren
  const completedDates = new Set<string>(
    plan.sessions.map((s) => {
      const d = new Date(s.completedAt)
      d.setHours(0, 0, 0, 0)
      return d.toISOString().slice(0, 10)
    }),
  )

  const isTodayCompleted = completedDates.has(todayKey)

  // Montag der aktuellen Woche
  const mondayOfCurrentWeek = new Date(planStart)
  mondayOfCurrentWeek.setDate(planStart.getDate() + currentWeekIndex * 7)
  mondayOfCurrentWeek.setHours(0, 0, 0, 0)

  // Wochenstreifen aufbauen
  const weekStrip: WeekStripDay[] = DE_DAY_NAMES.map((name, deIndex) => {
    const dayDate = new Date(mondayOfCurrentWeek)
    dayDate.setDate(mondayOfCurrentWeek.getDate() + deIndex)
    const dayKey = dayDate.toISOString().slice(0, 10)
    const isToday = dayKey === todayKey
    const isFuture = dayDate.getTime() > today.getTime()

    const planDayRaw: PlanDayRaw | undefined = currentWeek?.days[deIndex]
    const isRestDay = planDayRaw?.isRestDay ?? true
    const isCompleted = completedDates.has(dayKey) && !isRestDay
    const isMissed = !isRestDay && !isCompleted && !isToday && !isFuture

    return {
      dayName: name,
      deIndex,
      isToday,
      isRestDay,
      isCompleted,
      isMissed,
      isFuture,
      totalMinutes: planDayRaw?.totalMinutes ?? 0,
      focus: planDayRaw?.focus,
    }
  })

  // Gesamtfortschritt berechnen
  let totalPlannedSessions = 0
  for (const week of planData.weeks) {
    for (const day of week.days) {
      if (!day.isRestDay) totalPlannedSessions++
    }
  }

  const completedSessions = plan.sessions.length
  const percentComplete =
    totalPlannedSessions > 0
      ? Math.min(100, Math.round((completedSessions / totalPlannedSessions) * 100))
      : 0

  // TrainingPageData aufbauen
  const data: TrainingPageData = {
    planId: plan.id,
    planTitle: plan.title,
    planDescription: plan.description ?? '',
    planLevel: plan.level,
    durationWeeks: plan.durationWeeks,
    sessionsPerWeek: plan.sessionsPerWeek,
    sportSlug: plan.sport.slug,
    sportColorPrimary: plan.sport.colorPrimary,
    sportColorLight: plan.sport.colorLight,
    sportColorGlow: plan.sport.colorGlow,
    planCreatedAt: plan.createdAt.toISOString(),
    currentWeekNumber,
    currentDayDeIndex: todayDeIndex,
    todayDay,
    isTodayCompleted,
    isTodayRestDay: todayDay?.isRestDay ?? false,
    weekStrip,
    completedSessions,
    totalSessions: totalPlannedSessions,
    percentComplete,
    estimatedCaloriesBurnPerSession:
      planData.estimatedCaloriesBurnPerSession ?? 300,
    progressionTips: planData.progressionTips ?? [],
    safetyWarnings: planData.safetyWarnings ?? [],
    attribution:
      'Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform',
  }

  return <TrainingDashboard data={data} />
}
