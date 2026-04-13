// ─────────────────────────────────────────────────────────────────
// GET /api/dashboard
//
// Bündelt alle Dashboard-Daten in einem einzigen Request:
//   activeTrainingPlan, todayTrainingDay, activeNutritionPlan,
//   todayMealLogs, xpHistory7Days, nextTournaments, streakInfo,
//   levelProgress, unreadNotificationsCount, recentPosts
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getXPProgress } from '@/lib/xp'

// ── Wochentag-Mapping ────────────────────────────────────────────

const DE_DAY_NAMES = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
  'Donnerstag', 'Freitag', 'Samstag',
] as const

const DE_DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const

// ── JSON-Typen für planData ──────────────────────────────────────

interface PlanDay {
  dayName:      string
  isRestDay:    boolean
  focus?:       string
  totalMinutes: number
  exercises?:   { name: string; sets?: number; reps?: number; isSportDrill?: boolean }[]
}

interface PlanWeek {
  weekNumber: number
  focus:      string
  weeklyGoal: string
  days:       PlanDay[]
}

interface GeneratedPlanData {
  planName:    string
  description: string
  weeks:       PlanWeek[]
}

interface NutritionPlanData {
  tagesKalorienZiel?: number
}

// ── Hilfsfunktionen ──────────────────────────────────────────────

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getTodayDay(
  planData: unknown,
  createdAt: Date,
  durationWeeks: number,
): PlanDay | null {
  try {
    const data = planData as GeneratedPlanData
    if (!Array.isArray(data?.weeks) || data.weeks.length === 0) return null

    const now = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / msPerDay)
    const weekIndex = Math.min(Math.floor(daysSince / 7), durationWeeks - 1)
    const week = data.weeks[weekIndex]
    if (!week) return null

    const todayName = DE_DAY_NAMES[now.getDay()] ?? ''
    return week.days.find((d) => d.dayName === todayName) ?? null
  } catch {
    return null
  }
}

// ── Handler ──────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const todayStart = startOfDay(now)
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)

  try {
    const [
      userData,
      unreadCount,
      totalSessions,
      totalBadges,
      xpSessionsRaw,
      nutritionPlan,
      caloriesTodayResult,
      tournamentEntriesRaw,
      recentPosts,
    ] = await Promise.all([
      // Userdaten + aktiver Plan + letzte Sessions + letzte Abzeichen
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name:          true,
          image:         true,
          xp:            true,
          level:         true,
          streakDays:    true,
          longestStreak: true,
          trainingPlans: {
            where:   { isActive: true },
            orderBy: { createdAt: 'desc' },
            take:    1,
            select: {
              id:              true,
              title:           true,
              durationWeeks:   true,
              sessionsPerWeek: true,
              createdAt:       true,
              planData:        true,
              sport: {
                select: {
                  slug:         true,
                  colorPrimary: true,
                },
              },
            },
          },
          trainingSessions: {
            orderBy: { completedAt: 'desc' },
            take:    5,
            select: {
              id:          true,
              title:       true,
              durationMin: true,
              xpEarned:    true,
              completedAt: true,
            },
          },
          userBadges: {
            orderBy: { earnedAt: 'desc' },
            take:    3,
            select: {
              id:       true,
              earnedAt: true,
              badge: {
                select: {
                  id:          true,
                  name:        true,
                  description: true,
                  iconName:    true,
                  rarity:      true,
                  xpReward:    true,
                },
              },
            },
          },
        },
      }),

      // Ungelesene Benachrichtigungen
      prisma.notification.count({ where: { userId, isRead: false } }),

      // Gesamt-Sessions
      prisma.trainingSession.count({ where: { userId } }),

      // Gesamt-Abzeichen
      prisma.userBadge.count({ where: { userId } }),

      // XP-History letzte 7 Tage
      prisma.trainingSession.findMany({
        where: {
          userId,
          completedAt: { gte: sevenDaysAgo },
        },
        select: {
          completedAt: true,
          xpEarned:    true,
        },
      }),

      // Aktiver Ernährungsplan
      prisma.nutritionPlan.findFirst({
        where:  { userId, isActive: true },
        select: { planData: true },
      }),

      // Kalorien heute
      prisma.mealLog.aggregate({
        where: {
          userId,
          date: {
            gte: todayStart,
            lt:  new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        _sum: { calories: true },
      }),

      // Nächste Turniere
      prisma.tournamentEntry.findMany({
        where: {
          userId,
          tournament: { startDate: { gte: now }, isPublished: true },
        },
        orderBy: { tournament: { startDate: 'asc' } },
        take:    3,
        select: {
          tournament: {
            select: {
              id:        true,
              name:      true,
              startDate: true,
              city:      true,
              sport:     { select: { name: true } },
            },
          },
        },
      }),

      // Letzte Posts des Users
      prisma.post.findMany({
        where:   { userId, isHidden: false },
        orderBy: { createdAt: 'desc' },
        take:    3,
        select: {
          id:      true,
          type:    true,
          content: true,
          title:   true,
          createdAt: true,
          sport: { select: { name: true, slug: true, colorPrimary: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
    ])

    if (!userData) {
      return NextResponse.json({ error: 'User nicht gefunden.' }, { status: 404 })
    }

    // ── Level-Fortschritt ──────────────────────────────────────────
    const xpProgress = getXPProgress(userData.xp)

    // ── Aktiver Trainingsplan ──────────────────────────────────────
    const rawPlan = userData.trainingPlans[0] ?? null
    const todayDay = rawPlan
      ? getTodayDay(rawPlan.planData, rawPlan.createdAt, rawPlan.durationWeeks)
      : null

    // ── XP-History (7 Tage) ───────────────────────────────────────
    const days = Array.from({ length: 7 }, (_, i) =>
      new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000),
    )

    const xpHistory7Days = days.map((d, i) => {
      const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000)
      const xp = xpSessionsRaw
        .filter((s) => s.completedAt >= d && s.completedAt < nextDay)
        .reduce((sum, s) => sum + s.xpEarned, 0)
      return {
        dayLabel: DE_DAY_LABELS[d.getDay()] ?? '',
        xp,
        isToday: i === 6,
      }
    })

    // ── Ernährungs-Summary ─────────────────────────────────────────
    let nutritionSummary: { caloriesGoal: number; caloriesToday: number } | null = null
    if (nutritionPlan) {
      const pd = nutritionPlan.planData as NutritionPlanData
      const goal = pd.tagesKalorienZiel ?? 0
      if (goal > 0) {
        nutritionSummary = {
          caloriesGoal:  goal,
          caloriesToday: caloriesTodayResult._sum.calories ?? 0,
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name:          userData.name,
          image:         userData.image,
          xp:            userData.xp,
          level:         userData.level,
          streakDays:    userData.streakDays,
          longestStreak: userData.longestStreak,
        },
        levelProgress: {
          level:           xpProgress.level,
          currentXP:       xpProgress.currentXP,
          xpInLevel:       xpProgress.xpInLevel,
          xpNeededInLevel: xpProgress.xpNeededInLevel,
          xpToNextLevel:   xpProgress.xpToNextLevel,
          percentage:      xpProgress.percentage,
          isMaxLevel:      xpProgress.isMaxLevel,
        },
        streakInfo: {
          streakDays:    userData.streakDays,
          longestStreak: userData.longestStreak,
          trainedToday:  (xpHistory7Days[6]?.xp ?? 0) > 0,
        },
        activeTrainingPlan: rawPlan
          ? {
              id:              rawPlan.id,
              title:           rawPlan.title,
              durationWeeks:   rawPlan.durationWeeks,
              sessionsPerWeek: rawPlan.sessionsPerWeek,
              sportSlug:       rawPlan.sport.slug,
              sportColorPrimary: rawPlan.sport.colorPrimary,
            }
          : null,
        todayTrainingDay: todayDay,
        activeNutritionPlan: nutritionSummary,
        xpHistory7Days,
        nextTournaments: tournamentEntriesRaw.map((e) => ({
          id:        e.tournament.id,
          name:      e.tournament.name,
          startDate: e.tournament.startDate.toISOString(),
          city:      e.tournament.city,
          sportName: e.tournament.sport.name,
        })),
        unreadNotificationsCount: unreadCount,
        recentSessions: userData.trainingSessions.map((s) => ({
          id:          s.id,
          title:       s.title,
          durationMin: s.durationMin,
          xpEarned:    s.xpEarned,
          completedAt: s.completedAt.toISOString(),
        })),
        recentBadges: userData.userBadges.map((ub) => ({
          id:       ub.id,
          earnedAt: ub.earnedAt.toISOString(),
          badge:    ub.badge,
        })),
        recentPosts: recentPosts.map((p) => ({
          id:           p.id,
          type:         p.type,
          content:      p.content,
          title:        p.title,
          createdAt:    p.createdAt.toISOString(),
          sport:        p.sport,
          likeCount:    p._count.likes,
          commentCount: p._count.comments,
        })),
        stats: {
          totalSessions,
          totalBadges,
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json(
      { error: 'Dashboard-Daten konnten nicht geladen werden.' },
      { status: 500 },
    )
  }
}
