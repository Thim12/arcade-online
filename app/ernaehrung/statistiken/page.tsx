// ─────────────────────────────────────────────────────────────────
// /app/ernaehrung/statistiken/page.tsx  (Server Component)
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatistikenClient } from './StatistikenClient'

export const metadata = {
  title: 'Ernährungsstatistiken | SportRise',
  description: 'Deine Ernährungsstatistiken der letzten 30 Tage.',
}

function todayAtMidnightUTC(): Date {
  const now = new Date()
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  )
}

function formatDateKey(d: Date): string {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

export default async function StatistikenPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const today = todayAtMidnightUTC()
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)

  // Parallel queries
  const [mealLogs, waterLogs, activePlan, latestFeedback, feedbackRateCheck] =
    await Promise.all([
      prisma.mealLog.findMany({
        where: { userId, date: { gte: thirtyDaysAgo } },
        select: {
          date: true,
          calories: true,
          proteinG: true,
          carbsG: true,
          fatG: true,
        },
        orderBy: { date: 'asc' },
      }),
      prisma.waterLog.findMany({
        where: { userId, date: { gte: thirtyDaysAgo } },
        select: { date: true, glasses: true },
      }),
      prisma.nutritionPlan.findFirst({
        where: { userId, isActive: true },
        select: { planData: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.nutritionFeedback.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { feedback: true, createdAt: true },
      }),
      prisma.aiUsageLog.findFirst({
        where: {
          userId,
          type: 'nutrition_feedback',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { createdAt: true },
      }),
    ])

  // Kalorienziel aus aktivem Plan oder Fallback 2000
  const calorieTarget: number =
    activePlan !== null &&
    typeof (activePlan.planData as Record<string, unknown>)['tagesKalorienZiel'] === 'number'
      ? ((activePlan.planData as Record<string, unknown>)['tagesKalorienZiel'] as number)
      : 2000

  // Gruppiere MealLogs nach Datum
  const mealByDate = new Map<string, { calories: number; proteinG: number; carbsG: number; fatG: number; count: number }>()
  for (const log of mealLogs) {
    const key = formatDateKey(new Date(log.date))
    const existing = mealByDate.get(key) ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, count: 0 }
    mealByDate.set(key, {
      calories:  existing.calories  + log.calories,
      proteinG:  existing.proteinG  + log.proteinG,
      carbsG:    existing.carbsG    + log.carbsG,
      fatG:      existing.fatG      + log.fatG,
      count:     existing.count     + 1,
    })
  }

  // Gruppiere WaterLogs nach Datum
  const waterByDate = new Map<string, number>()
  for (const log of waterLogs) {
    waterByDate.set(formatDateKey(new Date(log.date)), log.glasses)
  }

  // Baue 30-Tage Array
  type DayData = {
    date: string
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    glasses: number
    mealCount: number
    hasData: boolean
  }

  const days: DayData[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
    const key = formatDateKey(d)
    const meal = mealByDate.get(key)
    const glasses = waterByDate.get(key) ?? 0
    days.push({
      date:      key,
      calories:  meal?.calories  ?? 0,
      proteinG:  meal?.proteinG  ?? 0,
      carbsG:    meal?.carbsG    ?? 0,
      fatG:      meal?.fatG      ?? 0,
      glasses,
      mealCount: meal?.count     ?? 0,
      hasData:   meal !== undefined,
    })
  }

  // Berechne Statistiken
  const daysWithData = days.filter((d) => d.hasData)
  const avgCalories =
    daysWithData.length > 0
      ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
      : 0

  const proteinTarget = Math.round((calorieTarget * 0.30) / 4)  // g
  const daysProteinMet = daysWithData.filter((d) => d.proteinG >= proteinTarget * 0.9).length
  const proteinGoalPct =
    daysWithData.length > 0
      ? Math.round((daysProteinMet / daysWithData.length) * 100)
      : 0

  const waterGoalMl = 2000
  const waterStreakDays = (() => {
    let streak = 0
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].glasses * 250 >= waterGoalMl) {
        streak++
      } else if (i === days.length - 1) {
        // Heute noch nicht voll – zählt nicht gegen Streak
        continue
      } else {
        break
      }
    }
    return streak
  })()

  const totalMeals = mealLogs.length

  // Durchschnittliche Makro-Verteilung (nur Tage mit Daten)
  const avgMacros = daysWithData.length > 0
    ? {
        proteinG:  Math.round(daysWithData.reduce((s, d) => s + d.proteinG, 0) / daysWithData.length),
        carbsG:    Math.round(daysWithData.reduce((s, d) => s + d.carbsG, 0) / daysWithData.length),
        fatG:      Math.round(daysWithData.reduce((s, d) => s + d.fatG, 0) / daysWithData.length),
      }
    : { proteinG: 0, carbsG: 0, fatG: 0 }

  return (
    <StatistikenClient
      days={days}
      calorieTarget={calorieTarget}
      avgCalories={avgCalories}
      proteinGoalPct={proteinGoalPct}
      waterStreakDays={waterStreakDays}
      totalMeals={totalMeals}
      avgMacros={avgMacros}
      latestFeedback={
        latestFeedback !== null
          ? { text: latestFeedback.feedback, date: latestFeedback.createdAt.toISOString() }
          : null
      }
      canGenerateFeedback={feedbackRateCheck === null}
    />
  )
}
