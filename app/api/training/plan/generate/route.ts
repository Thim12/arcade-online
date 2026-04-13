// ─────────────────────────────────────────────────────────────────
// POST /api/training/plan/generate
//
// Generiert einen Trainingsplan aus den Wizard-Eingaben.
// Rate-Limit: max 3 Pläne pro Kalendermonat.
// Gibt nach Generierung die erste Trainingswoche als Preview zurück.
// ─────────────────────────────────────────────────────────────────

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { trainingAI } from '@/lib/ai/training-ai'
import type { TrainingFormData } from '@/lib/ai/training-ai'
import type { SportSlug } from '@/lib/sport-profiles'
import type { SportLevel, UserGoal } from '@prisma/client'

// ── Interne Plan-Typen (spiegeln GeneratedPlan aus training-ai.ts) ──

interface PlanExerciseRaw {
  name: string
}

interface PlanDayRaw {
  dayName: string
  isRestDay: boolean
  focus?: string
  totalMinutes: number
  exercises: PlanExerciseRaw[]
}

interface PlanWeekRaw {
  weekNumber: number
  focus: string
  weeklyGoal: string
  days: PlanDayRaw[]
}

interface GeneratedPlanRaw {
  weeks: PlanWeekRaw[]
}

// ── Validierung ────────────────────────────────────────────────────

const VALID_SPORT_SLUGS: readonly SportSlug[] = ['fussball', 'tennis', 'basketball']
const VALID_LEVELS: readonly SportLevel[] = ['ANFAENGER', 'FORTGESCHRITTENE', 'WETTKAMPF', 'PROFI']
const VALID_GOALS: readonly UserGoal[] = [
  'FITNESS', 'WETTKAMPF', 'FREIZEITSPORT', 'ABNEHMEN', 'MUSKELAUFBAU', 'TECHNIK_VERBESSERN',
]

const BodySchema = z.object({
  sportSlug:           z.enum(['fussball', 'tennis', 'basketball']).optional(),
  level:               z.enum(['ANFAENGER', 'FORTGESCHRITTENE', 'WETTKAMPF', 'PROFI']).optional(),
  durationWeeks:       z.number().int().min(2).max(16).optional(),
  sessionsPerWeek:     z.number().int().min(1).max(7).optional(),
  goals:               z.array(z.enum(['FITNESS', 'WETTKAMPF', 'FREIZEITSPORT', 'ABNEHMEN', 'MUSKELAUFBAU', 'TECHNIK_VERBESSERN'])).min(1).optional(),
  minutesPerSession:   z.number().int().optional(),
  equipment:           z.array(z.string()).optional(),
  injuredAreas:        z.array(z.string()).optional(),
  injuryNotes:         z.string().max(300).optional(),
}).strict()

function isSportSlug(slug: string): slug is SportSlug {
  return (VALID_SPORT_SLUGS as readonly string[]).includes(slug)
}

// ── Ziel-Fallback-Mapping (aus alten Registrierungs-Slugs) ─────────

type ZielSlug = 'SPASS' | 'VERBESSERN' | 'PROFI' | 'GESUNDHEIT' | 'COMMUNITY' | 'TURNIERE'

const ZIEL_TO_GOAL: Record<ZielSlug, UserGoal> = {
  SPASS:      'FREIZEITSPORT',
  VERBESSERN: 'TECHNIK_VERBESSERN',
  PROFI:      'WETTKAMPF',
  GESUNDHEIT: 'FITNESS',
  COMMUNITY:  'FREIZEITSPORT',
  TURNIERE:   'WETTKAMPF',
}

// ── Rate-Limit-Prüfung ─────────────────────────────────────────────

const MONTHLY_PLAN_LIMIT = 3

async function checkMonthlyLimit(
  userId: string,
): Promise<{ allowed: boolean; usedThisMonth: number; resetDate: Date }> {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const count = await prisma.aiUsageLog.count({
    where: {
      userId,
      type: 'training',
      createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
    },
  })

  return {
    allowed: count < MONTHLY_PLAN_LIMIT,
    usedThisMonth: count,
    resetDate: firstOfNextMonth,
  }
}

// ── POST Handler ───────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  // ── Body parsen (optional – Wizard sendet JSON, Legacy kein Body) ─
  let body: z.infer<typeof BodySchema> = {}
  try {
    const text = await request.text()
    if (text.length > 0) {
      const parsed = BodySchema.safeParse(JSON.parse(text))
      if (!parsed.success) {
        return Response.json(
          { error: `Ungültige Eingabe: ${parsed.error.errors[0]?.message ?? 'Validierungsfehler'}` },
          { status: 400 },
        )
      }
      body = parsed.data
    }
  } catch {
    return Response.json({ error: 'Ungültiger Request-Body.' }, { status: 400 })
  }

  // ── Rate-Limit prüfen ─────────────────────────────────────────────
  const { allowed, usedThisMonth, resetDate } = await checkMonthlyLimit(userId)

  if (!allowed) {
    const resetStr = resetDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    return Response.json(
      {
        error: `Diesen Monat wurden bereits ${MONTHLY_PLAN_LIMIT} Pläne erstellt. Nächste Generierung verfügbar ab ${resetStr}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        usedThisMonth,
        resetDate: resetDate.toISOString(),
      },
      { status: 429 },
    )
  }

  // ── Sportart bestimmen ────────────────────────────────────────────
  const rawSport = body.sportSlug ?? session.user.primarySport

  if (rawSport === null || rawSport === undefined || !isSportSlug(rawSport)) {
    return Response.json({ error: 'Keine gültige Sportart im Profil gefunden.' }, { status: 400 })
  }

  const sportSlug: SportSlug = rawSport

  try {
    // ── UserSport laden ───────────────────────────────────────────
    const userSport = await prisma.userSport.findFirst({
      where: { userId, sport: { slug: sportSlug } },
      select: { level: true, goals: true, details: true },
    })

    // ── Level bestimmen ───────────────────────────────────────────
    const level: SportLevel =
      (body.level !== undefined && (VALID_LEVELS as readonly string[]).includes(body.level))
        ? body.level
        : (userSport?.level ?? 'ANFAENGER')

    // ── Ziele bestimmen ───────────────────────────────────────────
    let goals: UserGoal[] = []

    if (body.goals !== undefined && body.goals.length > 0) {
      goals = body.goals.filter((g): g is UserGoal =>
        (VALID_GOALS as readonly string[]).includes(g),
      )
    }

    // Fallback 1: aus UserSport.goals
    if (goals.length === 0) {
      goals = userSport?.goals ?? []
    }

    // Fallback 2: aus UserSport.details.selectedZiele (alte Registrierung)
    if (goals.length === 0 && userSport?.details !== null && userSport?.details !== undefined) {
      const details = userSport.details as Record<string, unknown>
      const selectedZiele = details['selectedZiele']
      if (Array.isArray(selectedZiele)) {
        const mapped = new Set<UserGoal>()
        for (const z of selectedZiele) {
          if (typeof z === 'string' && Object.prototype.hasOwnProperty.call(ZIEL_TO_GOAL, z)) {
            mapped.add(ZIEL_TO_GOAL[z as ZielSlug])
          }
        }
        goals = Array.from(mapped)
      }
    }

    if (goals.length === 0) goals = ['FREIZEITSPORT']

    const formData: TrainingFormData = {
      sportSlug,
      level,
      durationWeeks:   body.durationWeeks   ?? 8,
      sessionsPerWeek: body.sessionsPerWeek ?? 3,
      goals,
    }

    // ── Plan generieren ───────────────────────────────────────────
    const result = await trainingAI.generatePlan(userId, formData)

    // ── Erste Woche als Preview laden ─────────────────────────────
    const savedPlan = await prisma.trainingPlan.findUnique({
      where: { id: result.planId },
      select: { planData: true },
    })

    const planDataRaw = savedPlan?.planData as GeneratedPlanRaw | null
    const firstWeekRaw = planDataRaw?.weeks?.[0] ?? null

    const firstWeekPreview = firstWeekRaw !== null
      ? {
          weekNumber:  firstWeekRaw.weekNumber,
          focus:       firstWeekRaw.focus,
          weeklyGoal:  firstWeekRaw.weeklyGoal,
          days: firstWeekRaw.days.map((d) => ({
            dayName:       d.dayName,
            isRestDay:     d.isRestDay,
            focus:         d.focus ?? null,
            totalMinutes:  d.totalMinutes,
            exerciseCount: d.exercises.length,
          })),
        }
      : null

    return Response.json({
      success: true,
      data: {
        planId:          result.planId,
        planName:        result.planName,
        durationWeeks:   result.durationWeeks,
        sessionsPerWeek: result.sessionsPerWeek,
        firstWeekPreview,
      },
    })
  } catch (error) {
    console.error('[POST /api/training/plan/generate]', error)
    return Response.json({ error: 'Plan konnte nicht erstellt werden.' }, { status: 500 })
  }
}
