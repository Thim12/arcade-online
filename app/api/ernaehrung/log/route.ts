// ─────────────────────────────────────────────────────────────────
// GET /api/ernaehrung/log?date=YYYY-MM-DD
//
// Lädt alle Mahlzeiten-Einträge und den Wasserzähler für ein Datum.
// Gibt außerdem Tagessummen und das Kalorienziel zurück.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseDateParam(raw: string | null): Date | null {
  if (!raw) return null
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return new Date(`${raw}T00:00:00.000Z`)
}

export async function GET(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const dateObj = parseDateParam(searchParams.get('date'))

  if (!dateObj) {
    return Response.json({ error: 'Ungültiger oder fehlender Datumsparameter (YYYY-MM-DD).' }, { status: 400 })
  }

  try {
    const [mealLogs, waterLog, latestPlan] = await Promise.all([
      prisma.mealLog.findMany({
        where: { userId, date: dateObj },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          mealType: true,
          foodId: true,
          foodName: true,
          portionGrams: true,
          calories: true,
          proteinG: true,
          carbsG: true,
          fatG: true,
          fiberG: true,
          createdAt: true,
        },
      }),
      prisma.waterLog.findUnique({
        where: { userId_date: { userId, date: dateObj } },
        select: { glasses: true },
      }),
      prisma.nutritionPlan.findFirst({
        where: { userId, isAiGenerated: true },
        orderBy: { createdAt: 'desc' },
        select: { planData: true },
      }),
    ])

    const calorieTarget: number =
      latestPlan !== null &&
      typeof (latestPlan.planData as Record<string, unknown>)['tagesKalorienZiel'] === 'number'
        ? ((latestPlan.planData as Record<string, unknown>)['tagesKalorienZiel'] as number)
        : 2000

    const totals = mealLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        proteinG: Math.round((acc.proteinG + log.proteinG) * 10) / 10,
        carbsG: Math.round((acc.carbsG + log.carbsG) * 10) / 10,
        fatG: Math.round((acc.fatG + log.fatG) * 10) / 10,
        fiberG: Math.round((acc.fiberG + log.fiberG) * 10) / 10,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    )

    return Response.json({
      mealLogs: mealLogs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      waterLog: { glasses: waterLog?.glasses ?? 0 },
      totals,
      calorieTarget,
    })
  } catch (error) {
    console.error('[GET /api/ernaehrung/log]', error)
    return Response.json({ error: 'Log konnte nicht geladen werden.' }, { status: 500 })
  }
}
