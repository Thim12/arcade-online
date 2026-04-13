// ─────────────────────────────────────────────────────────────────
// POST /api/ernaehrung/meal-log
//
// Trägt eine Mahlzeit ein. Vergib +25 XP wenn Kalorienziel erstmals
// zu 90–110 % erreicht wird (einmalig pro Tag).
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardXP } from '@/lib/xp'
import { checkAndAwardBadges } from '@/lib/badge-checker'
import type { MealType } from '@prisma/client'

interface MealLogBody {
  date: string       // YYYY-MM-DD
  mealType: string
  foodId: string
  foodName: string
  portionGrams: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

const VALID_MEAL_TYPES: MealType[] = ['FRUEHSTUECK', 'MITTAGESSEN', 'ABENDESSEN', 'SNACK']

function parseDateParam(raw: string): Date | null {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return new Date(`${raw}T00:00:00.000Z`)
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  let body: MealLogBody
  try {
    body = (await req.json()) as MealLogBody
  } catch {
    return Response.json({ error: 'Ungültiger Request-Body.' }, { status: 400 })
  }

  const { date, mealType, foodId, foodName, portionGrams, calories, proteinG, carbsG, fatG, fiberG } = body

  if (
    typeof date !== 'string' ||
    typeof mealType !== 'string' ||
    typeof foodId !== 'string' ||
    typeof foodName !== 'string' ||
    typeof portionGrams !== 'number' ||
    typeof calories !== 'number'
  ) {
    return Response.json({ error: 'Pflichtfelder fehlen oder ungültiger Typ.' }, { status: 400 })
  }

  if (!VALID_MEAL_TYPES.includes(mealType as MealType)) {
    return Response.json({ error: 'Ungültiger Mahlzeiten-Typ.' }, { status: 400 })
  }

  const dateObj = parseDateParam(date)
  if (!dateObj) {
    return Response.json({ error: 'Ungültiges Datum (YYYY-MM-DD erwartet).' }, { status: 400 })
  }

  try {
    // Kalorienziel ermitteln
    const latestPlan = await prisma.nutritionPlan.findFirst({
      where: { userId, isAiGenerated: true },
      orderBy: { createdAt: 'desc' },
      select: { planData: true },
    })
    const calorieTarget: number =
      latestPlan !== null &&
      typeof (latestPlan.planData as Record<string, unknown>)['tagesKalorienZiel'] === 'number'
        ? ((latestPlan.planData as Record<string, unknown>)['tagesKalorienZiel'] as number)
        : 2000

    // Bisherigen Tages-Kalorienwert laden (vor diesem Eintrag)
    const existingLogs = await prisma.mealLog.findMany({
      where: { userId, date: dateObj },
      select: { calories: true },
    })
    const calorieBefore = existingLogs.reduce((sum, l) => sum + l.calories, 0)

    // Neuen Eintrag speichern
    const newLog = await prisma.mealLog.create({
      data: {
        userId,
        date: dateObj,
        mealType: mealType as MealType,
        foodId,
        foodName,
        portionGrams,
        calories,
        proteinG: proteinG ?? 0,
        carbsG: carbsG ?? 0,
        fatG: fatG ?? 0,
        fiberG: fiberG ?? 0,
      },
    })

    const calorieAfter = calorieBefore + calories
    const percBefore = calorieBefore / calorieTarget
    const percAfter = calorieAfter / calorieTarget

    // XP vergeben wenn Tagesziel erstmals auf 90–110 % erreicht
    let xpResult: { newXP: number; newLevel: number; leveledUp: boolean } | null = null
    if (percBefore < 0.9 && percAfter >= 0.9 && percAfter <= 1.1) {
      const result = await awardXP(userId, 25, prisma)
      xpResult = { newXP: result.newXP, newLevel: result.newLevel, leveledUp: result.leveledUp }
    }

    // Badge-Check
    const newBadges = await checkAndAwardBadges(userId, 'MEAL_LOGGED', prisma)

    return Response.json({
      success: true,
      data: {
        log: {
          id: newLog.id,
          mealType: newLog.mealType,
          foodId: newLog.foodId,
          foodName: newLog.foodName,
          portionGrams: newLog.portionGrams,
          calories: newLog.calories,
          proteinG: newLog.proteinG,
          carbsG: newLog.carbsG,
          fatG: newLog.fatG,
          fiberG: newLog.fiberG,
          createdAt: newLog.createdAt.toISOString(),
        },
        caloriesTotal: calorieAfter,
        calorieTarget,
        xpAwarded: xpResult !== null ? 25 : 0,
        xp: xpResult,
        newBadges: newBadges.map((b) => ({
          id: b.badge.id,
          name: b.badge.name,
          iconName: b.badge.iconName,
          rarity: b.badge.rarity,
          xpReward: b.xpAwarded,
        })),
      },
    })
  } catch (error) {
    console.error('[POST /api/ernaehrung/meal-log]', error)
    return Response.json({ error: 'Eintrag konnte nicht gespeichert werden.' }, { status: 500 })
  }
}
