// ─────────────────────────────────────────────────────────────────
// app/dashboard/page.tsx – Dashboard-Übersicht (Server Component)
//
// Lädt alle Dashboard-Daten aus der DB und gibt sie an
// DashboardHomeClient weiter (kein Client-seitiger API-Aufruf nötig).
// ─────────────────────────────────────────────────────────────────

export const revalidate = 60

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLevelInfo } from '@/lib/utils/xp'
import { DashboardHomeClient } from './DashboardHomeClient'
import type { BadgeRarity } from '@prisma/client'

// ── Hilftypen für planData (JSON) ────────────────────────────────

interface PlanExercise {
  name:         string
  sets?:        number
  reps?:        number
  description:  string
  isSportDrill: boolean
}

interface PlanDay {
  dayName:      string
  isRestDay:    boolean
  focus?:       string
  totalMinutes: number
  exercises:    PlanExercise[]
}

interface PlanWeek {
  weekNumber:  number
  focus:       string
  weeklyGoal:  string
  days:        PlanDay[]
}

interface PlanData {
  planName:    string
  description: string
  weeks:       PlanWeek[]
}

interface NutritionPlanData {
  tagesKalorienZiel?: number
}

// ── Exportierte Typen für DashboardHomeClient ─────────────────────

export interface TodayTraining {
  dayName:      string
  isRestDay:    boolean
  focus:        string
  totalMinutes: number
  exercises:    { name: string; sets?: number; reps?: number; isSportDrill: boolean }[]
  weekNumber:   number
  weekFocus:    string
  weeklyGoal:   string
}

export interface RecentSession {
  id:          string
  title:       string
  durationMin: number
  xpEarned:    number
  completedAt: string  // ISO-String
}

export interface RecentBadge {
  id:       string
  earnedAt: string  // ISO-String
  badge: {
    name:        string
    description: string
    iconName:    string
    rarity:      BadgeRarity
    xpReward:    number
  }
}

export interface ActivePlanInfo {
  id:              string
  title:           string
  durationWeeks:   number
  sessionsPerWeek: number
}

export interface DashboardLevelInfo {
  level:                  number
  currentXp:              number
  xpForCurrentLevel:      number
  xpForNextLevel:         number
  xpInCurrentLevel:       number
  xpNeededInCurrentLevel: number
  progressPercent:        number
  isMaxLevel:             boolean
}

export interface XpDayEntry {
  dayLabel: string   // "Mo", "Di", etc.
  xp:       number
  isToday:  boolean
}

export interface NutritionSummary {
  caloriesGoal:   number
  caloriesToday:  number
}

export interface UpcomingTournament {
  id:         string
  name:       string
  startDate:  string  // ISO-String
  city:       string
  sportName:  string
}

export interface DashboardPageData {
  userName:             string
  userImage:            string | null
  primarySport:         string | null
  xp:                   number
  level:                number
  streakDays:           number
  longestStreak:        number
  levelInfo:            DashboardLevelInfo
  activePlan:           ActivePlanInfo | null
  todayTraining:        TodayTraining | null
  recentSessions:       RecentSession[]
  recentBadges:         RecentBadge[]
  unreadNotifications:  number
  totalSessions:        number
  totalBadges:          number
  xpHistory:            XpDayEntry[]
  nutrition:            NutritionSummary | null
  upcomingTournaments:  UpcomingTournament[]
  trainedToday:         boolean
  trainingDaysThisWeek: boolean[]  // 7 Einträge, Index 0 = vor 6 Tagen, Index 6 = heute
}

// ── Hilfsfunktionen ──────────────────────────────────────────────

const DAY_NAMES = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
  'Donnerstag', 'Freitag', 'Samstag',
]

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function startOfDayDate(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function getTodayTraining(
  rawPlanData: unknown,
  createdAt:    Date,
  durationWeeks: number,
): TodayTraining | null {
  try {
    const data = rawPlanData as PlanData
    if (!Array.isArray(data?.weeks) || data.weeks.length === 0) return null

    const now          = new Date()
    const msPerDay     = 1000 * 60 * 60 * 24
    const daysSince    = Math.floor((now.getTime() - createdAt.getTime()) / msPerDay)
    const weekIndex    = Math.min(Math.floor(daysSince / 7), durationWeeks - 1)
    const week         = data.weeks[weekIndex]
    if (!week) return null

    const todayName = DAY_NAMES[now.getDay()] ?? ''
    const todayDay  = week.days.find((d) => d.dayName === todayName)
    if (!todayDay) return null

    return {
      dayName:      todayDay.dayName,
      isRestDay:    todayDay.isRestDay,
      focus:        todayDay.focus ?? week.focus,
      totalMinutes: todayDay.totalMinutes,
      exercises:    (todayDay.exercises ?? []).slice(0, 5).map((e) => ({
        name:         e.name,
        sets:         e.sets,
        reps:         e.reps,
        isSportDrill: e.isSportDrill,
      })),
      weekNumber:  week.weekNumber,
      weekFocus:   week.focus,
      weeklyGoal:  week.weeklyGoal,
    }
  } catch {
    return null
  }
}

// ── Page Component ────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/registrieren')

  const userId = session.user.id
  const now = new Date()
  const todayStart = startOfDayDate(now)
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)

  // Parallele DB-Abfragen
  const [
    userData,
    unreadCount,
    totalSessions,
    totalBadges,
    xpSessionsRaw,
    nutritionPlan,
    caloriesTodayResult,
    tournamentEntriesRaw,
  ] = await Promise.all([
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
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.trainingSession.count({ where: { userId } }),
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
      where: { userId, isActive: true },
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

    // Nächste Turniere des Users
    prisma.tournamentEntry.findMany({
      where: {
        userId,
        tournament: {
          startDate:   { gte: now },
          isPublished: true,
        },
      },
      orderBy: { tournament: { startDate: 'asc' } },
      take:    3,
      select: {
        id: true,
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
  ])

  if (!userData) redirect('/registrieren')

  const levelInfo = getLevelInfo(userData.xp)
  const rawPlan   = userData.trainingPlans[0] ?? null

  const activePlan: ActivePlanInfo | null = rawPlan
    ? {
        id:              rawPlan.id,
        title:           rawPlan.title,
        durationWeeks:   rawPlan.durationWeeks,
        sessionsPerWeek: rawPlan.sessionsPerWeek,
      }
    : null

  const todayTraining = rawPlan
    ? getTodayTraining(rawPlan.planData, rawPlan.createdAt, rawPlan.durationWeeks)
    : null

  // ── XP-History aufbauen (7 Tage, Index 0 = vor 6 Tagen, Index 6 = heute) ──
  const days = Array.from({ length: 7 }, (_, i) => {
    return new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
  })

  const xpHistory: XpDayEntry[] = days.map((d, i) => {
    const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    const xp = xpSessionsRaw
      .filter((s) => s.completedAt >= d && s.completedAt < nextDay)
      .reduce((sum, s) => sum + s.xpEarned, 0)
    return {
      dayLabel: DAY_LABELS[d.getDay()] ?? '',
      xp,
      isToday: i === 6,
    }
  })

  const trainingDaysThisWeek = days.map((d) => {
    const nextDay = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    return xpSessionsRaw.some((s) => s.completedAt >= d && s.completedAt < nextDay)
  })

  const trainedToday = trainingDaysThisWeek[6] ?? false

  // ── Ernährungs-Zusammenfassung ────────────────────────────────────
  let nutrition: NutritionSummary | null = null
  if (nutritionPlan) {
    const pd = nutritionPlan.planData as NutritionPlanData
    const caloriesGoal  = pd.tagesKalorienZiel ?? 0
    const caloriesToday = caloriesTodayResult._sum.calories ?? 0
    if (caloriesGoal > 0) {
      nutrition = { caloriesGoal, caloriesToday }
    }
  }

  // ── Turniere ──────────────────────────────────────────────────────
  const upcomingTournaments: UpcomingTournament[] = tournamentEntriesRaw.map((entry) => ({
    id:        entry.tournament.id,
    name:      entry.tournament.name,
    startDate: entry.tournament.startDate.toISOString(),
    city:      entry.tournament.city,
    sportName: entry.tournament.sport.name,
  }))

  const data: DashboardPageData = {
    userName:      userData.name ?? 'Sportler',
    userImage:     userData.image,
    primarySport:  session.user.primarySport ?? null,
    xp:            userData.xp,
    level:         levelInfo.level,
    streakDays:    userData.streakDays,
    longestStreak: userData.longestStreak,
    levelInfo: {
      level:                  levelInfo.level,
      currentXp:              levelInfo.currentXp,
      xpForCurrentLevel:      levelInfo.xpForCurrentLevel,
      xpForNextLevel:         levelInfo.xpForNextLevel,
      xpInCurrentLevel:       levelInfo.xpInCurrentLevel,
      xpNeededInCurrentLevel: levelInfo.xpNeededInCurrentLevel,
      progressPercent:        levelInfo.progressPercent,
      isMaxLevel:             levelInfo.isMaxLevel,
    },
    activePlan,
    todayTraining,
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
    unreadNotifications:  unreadCount,
    totalSessions,
    totalBadges,
    xpHistory,
    nutrition,
    upcomingTournaments,
    trainedToday,
    trainingDaysThisWeek,
  }

  return <DashboardHomeClient data={data} />
}
