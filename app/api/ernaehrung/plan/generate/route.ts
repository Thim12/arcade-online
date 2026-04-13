// ─────────────────────────────────────────────────────────────────
// POST /api/ernaehrung/plan/generate
//
// Generiert einen 7-Tage-Ernährungsplan aus den Wizard-Eingaben.
// Rate-Limit: max 3 Pläne pro Kalendermonat (Typ "nutrition").
// ─────────────────────────────────────────────────────────────────

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nutritionAI } from '@/lib/ai/nutrition-ai'
import { checkKILimit } from '@/lib/rate-limiter'
import type { NutritionFormData } from '@/lib/ai/nutrition-ai'
import type { SportSlug } from '@/lib/sport-profiles'
import type { UserGoal } from '@prisma/client'

// ── Validierung ─────────────────────────────────────────────────

const BodySchema = z.object({
  heightCm:          z.number().int().min(100).max(250),
  weightKg:          z.number().min(20).max(300),
  gender:            z.enum(['MAENNLICH', 'WEIBLICH']),
  goal:              z.enum(['HALTEN', 'ABNEHMEN', 'ZUNEHMEN', 'LEISTUNG', 'GESUND']),
  activityLevel:     z.enum(['SEDENTAER', 'LEICHT_AKTIV', 'MAESSIG_AKTIV', 'AKTIV', 'SEHR_AKTIV']),
  sportSlug:         z.enum(['fussball', 'tennis', 'basketball', 'none']),
  trainingsPerWeek:  z.number().int().min(0).max(7),
  sessionDurationMin: z.number().int().min(20).max(180),
  budget:            z.enum(['SEHR_GUENSTIG', 'GUENSTIG', 'MITTEL', 'KEIN_LIMIT']),
  isVegetarian:      z.boolean(),
  isVegan:           z.boolean(),
  isLaktosefrei:     z.boolean(),
  isGlutenfrei:      z.boolean(),
  ausschluesse:      z.string().max(300).optional(),
}).strict()

// ── Ziel-Mapping ─────────────────────────────────────────────────

const GOAL_MAP: Record<string, UserGoal[]> = {
  HALTEN:   ['FITNESS'],
  ABNEHMEN: ['ABNEHMEN'],
  ZUNEHMEN: ['MUSKELAUFBAU'],
  LEISTUNG: ['WETTKAMPF'],
  GESUND:   ['FITNESS'],
}

// ── POST Handler ─────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  // ── Body parsen ───────────────────────────────────────────────
  let body: z.infer<typeof BodySchema>
  try {
    const text = await request.text()
    const parsed = BodySchema.safeParse(JSON.parse(text))
    if (!parsed.success) {
      return Response.json(
        { error: `Ungültige Eingabe: ${parsed.error.errors[0]?.message ?? 'Validierungsfehler'}` },
        { status: 400 },
      )
    }
    body = parsed.data
  } catch {
    return Response.json({ error: 'Ungültiger Request-Body.' }, { status: 400 })
  }

  // ── Rate-Limit prüfen ─────────────────────────────────────────
  const { allowed, usedThisMonth: usedBefore, resetDate } = await checkKILimit(
    userId,
    'nutrition',
    prisma,
  )

  if (!allowed) {
    const resetStr = resetDate.toLocaleDateString('de-DE', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    return Response.json(
      {
        error: `Diesen Monat wurden bereits 3 Pläne erstellt. Nächste Generierung verfügbar ab ${resetStr}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        usedThisMonth: usedBefore,
        resetDate: resetDate.toISOString(),
      },
      { status: 429 },
    )
  }

  try {
    // ── User-Daten laden (birthYear für Alter) ────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthYear: true },
    })

    const age =
      user?.birthYear !== null && user?.birthYear !== undefined
        ? new Date().getFullYear() - user.birthYear
        : null

    // ── Allergien aufbauen ────────────────────────────────────
    const allergies: string[] = []
    if (body.isLaktosefrei) allergies.push('Laktose')
    if (body.isGlutenfrei) allergies.push('Gluten')
    if (body.ausschluesse !== undefined && body.ausschluesse.trim().length > 0) {
      allergies.push(body.ausschluesse.trim())
    }

    const goals: UserGoal[] = GOAL_MAP[body.goal] ?? ['FITNESS']

    const formData: NutritionFormData = {
      sportSlug:         body.sportSlug as SportSlug | 'none',
      weightKg:          body.weightKg,
      heightCm:          body.heightCm,
      age,
      gender:            body.gender,
      activityLevel:     body.activityLevel,
      trainingsPerWeek:  body.trainingsPerWeek,
      isVegetarian:      body.isVegetarian,
      isVegan:           body.isVegan,
      allergies,
      goals,
      budget:            body.budget,
      sessionDurationMin: body.sessionDurationMin,
    }

    // ── Plan generieren (loggt Usage intern) ──────────────────
    const saveResult = await nutritionAI.generateWeeklyPlan(userId, formData)

    // ── Vollständige planData für Preview laden ───────────────
    const savedPlan = await prisma.nutritionPlan.findUnique({
      where: { id: saveResult.planId },
      select: { planData: true },
    })

    // ── Monatsverbrauch nach Generierung zählen ───────────────
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const usedAfter = await prisma.aiUsageLog.count({
      where: {
        userId,
        type: 'nutrition',
        createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
      },
    })

    return Response.json({
      success: true,
      data: {
        planId:            saveResult.planId,
        title:             saveResult.title,
        tagesKalorienZiel: saveResult.tagesKalorienZiel,
        planData:          savedPlan?.planData ?? null,
        usedThisMonth:     usedAfter,
      },
    })
  } catch (error) {
    console.error('[POST /api/ernaehrung/plan/generate]', error)
    return Response.json({ error: 'Plan konnte nicht erstellt werden.' }, { status: 500 })
  }
}
