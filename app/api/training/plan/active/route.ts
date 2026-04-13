// ─────────────────────────────────────────────────────────────────
// GET /api/training/plan/active
//
// Liefert den aktiven Trainingsplan des eingeloggten Users inkl.
// heutigem Trainingstag und Fortschrittsstatistiken.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── Plan-Daten-Typen (entsprechen GeneratedPlan aus training-ai.ts) ─

interface PlanExercise {
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

interface PlanDay {
  dayName: string
  isRestDay: boolean
  focus?: string
  warmupMinutes?: number
  cooldownMinutes?: number
  totalMinutes: number
  notes?: string
  exercises: PlanExercise[]
}

interface PlanWeek {
  weekNumber: number
  focus: string
  weeklyGoal: string
  days: PlanDay[]
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

// ── Response-Typen ───────────────────────────────────────────────

export interface WeekStripDay {
  dayName: string
  deIndex: number    // 0=Montag...6=Sonntag
  isToday: boolean
  isRestDay: boolean
  isCompleted: boolean
  isMissed: boolean  // Trainingstag in der Vergangenheit ohne Session
  isFuture: boolean
  totalMinutes: number
  focus?: string
}

// ────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Aktiven Plan laden
    const plan = await prisma.trainingPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        sport: { select: { slug: true, colorPrimary: true, colorLight: true, colorGlow: true } },
        sessions: {
          select: { id: true, completedAt: true, durationMin: true, xpEarned: true, notes: true, sessionData: true },
          orderBy: { completedAt: 'asc' },
        },
      },
    })

    if (plan === null) {
      return Response.json({ success: true, data: null })
    }

    const planData = plan.planData as unknown as GeneratedPlan
    const now = new Date()

    // Heutigen DE-Wochentagsindex ermitteln (0=Montag)
    const todayDeIndex = JS_DAY_TO_DE_INDEX[now.getDay()] ?? 0

    // Plan-Start (Montag der Woche, in der der Plan erstellt wurde)
    const planStart = new Date(plan.createdAt)
    // Auf Mitternacht normalisieren
    planStart.setHours(0, 0, 0, 0)

    // Tage seit Plan-Start
    const msPerDay = 24 * 60 * 60 * 1000
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const daysElapsed = Math.max(0, Math.floor((today.getTime() - planStart.getTime()) / msPerDay))

    // Aktuelle Woche (0-basiert, cap an Gesamtwochen-1)
    const currentWeekIndex = Math.min(
      Math.floor(daysElapsed / 7),
      plan.durationWeeks - 1,
    )
    const currentWeekNumber = currentWeekIndex + 1

    // Aktueller Tag innerhalb der Woche (heutiger Wochentag nach Plan-Schema)
    // planStart.getDay() liefert den JS-Wochentag des Plan-Starts
    // Die Tage im Plan sind immer Mo=0..So=6
    // todayDeIndex ist bereits der heutige Wochentag im DE-Schema

    const currentWeek: PlanWeek | undefined = planData.weeks[currentWeekIndex]
    const todayDay: PlanDay | null = currentWeek?.days[todayDeIndex] ?? null

    // Abgeschlossene Sessions nach Datum gruppieren (YYYY-MM-DD)
    const completedDates = new Set<string>(
      plan.sessions.map((s) => {
        const d = new Date(s.completedAt)
        d.setHours(0, 0, 0, 0)
        return d.toISOString().slice(0, 10)
      }),
    )

    const todayKey = today.toISOString().slice(0, 10)
    const isTodayCompleted = completedDates.has(todayKey)

    // Wochenstreifen für aktuelle Woche aufbauen
    // Montag der aktuellen Woche
    const mondayOfCurrentWeek = new Date(planStart)
    mondayOfCurrentWeek.setDate(planStart.getDate() + currentWeekIndex * 7)
    mondayOfCurrentWeek.setHours(0, 0, 0, 0)

    const weekStrip: WeekStripDay[] = DE_DAY_NAMES.map((name, deIndex) => {
      const dayDate = new Date(mondayOfCurrentWeek)
      dayDate.setDate(mondayOfCurrentWeek.getDate() + deIndex)
      const dayKey = dayDate.toISOString().slice(0, 10)
      const isToday = dayKey === todayKey
      const isFuture = dayDate.getTime() > today.getTime()

      const planDay: PlanDay | undefined = currentWeek?.days[deIndex]
      const isRestDay = planDay?.isRestDay ?? true
      const isCompleted = completedDates.has(dayKey) && !isRestDay

      // Missed: Trainingstag, in der Vergangenheit, keine Session
      const isMissed = !isRestDay && !isCompleted && !isToday && !isFuture

      return {
        dayName: name,
        deIndex,
        isToday,
        isRestDay,
        isCompleted,
        isMissed,
        isFuture,
        totalMinutes: planDay?.totalMinutes ?? 0,
        focus: planDay?.focus,
      }
    })

    // Gesamtfortschritt berechnen
    // Geplante Sessions = Summe aller Nicht-Rest-Tage über alle Wochen
    let totalPlannedSessions = 0
    for (const week of planData.weeks) {
      for (const day of week.days) {
        if (!day.isRestDay) totalPlannedSessions++
      }
    }

    const completedSessions = plan.sessions.length
    const percentComplete = totalPlannedSessions > 0
      ? Math.min(100, Math.round((completedSessions / totalPlannedSessions) * 100))
      : 0

    return Response.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          title: plan.title,
          description: plan.description ?? '',
          level: plan.level,
          durationWeeks: plan.durationWeeks,
          sessionsPerWeek: plan.sessionsPerWeek,
          isActive: plan.isActive,
          sportSlug: plan.sport.slug,
          sportColorPrimary: plan.sport.colorPrimary,
          sportColorLight: plan.sport.colorLight,
          sportColorGlow: plan.sport.colorGlow,
          createdAt: plan.createdAt.toISOString(),
          planData,
        },
        currentWeekNumber,
        currentDayDeIndex: todayDeIndex,
        todayDay,
        isTodayCompleted,
        isTodayRestDay: todayDay?.isRestDay ?? false,
        weekStrip,
        stats: {
          completedSessions,
          totalSessions: totalPlannedSessions,
          percentComplete,
        },
        attribution: 'Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform',
      },
    })
  } catch (error) {
    console.error('[GET /api/training/plan/active]', error)
    return Response.json({ error: 'Trainingsplan konnte nicht geladen werden.' }, { status: 500 })
  }
}
