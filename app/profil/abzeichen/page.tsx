// ─────────────────────────────────────────────────────────────────
// app/profil/abzeichen/page.tsx – Badge-Übersicht (Server Component)
//
// Lädt alle nicht-geheimen Abzeichen + Nutzer-Fortschritt aus der DB
// und übergibt sie an BadgesClient zur interaktiven Filterung.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { BadgeRarity } from '@prisma/client'
import { BadgesClient } from './BadgesClient'
import type { BadgeCategory, SerializedBadge, UserProgress } from './BadgesClient'

export const revalidate = 60

// ── Kategorie-Zuordnung ──────────────────────────────────────────

const TRAINING_TYPES = new Set([
  'training_plan_created',
  'training_sessions',
  'sessions_before_hour',
  'sessions_after_hour',
  'sessions_same_time_of_day',
  'perfect_week',
  'training_at_time',
  'recovery_logs',
])

const STREAK_TYPES = new Set(['streak_days'])

const ERNAEHRUNG_TYPES = new Set([
  'meal_logged',
  'meals_logged',
  'water_goal_days',
  'nutrition_plan_followed_days',
  'meal_at_midnight',
])

const SOZIAL_TYPES = new Set([
  'post_created',
  'post_likes_received',
  'followers_reached',
  'comments_written',
  'diary_entries',
  'sparring_accepted',
])

const SPORT_TYPES = new Set([
  'verein_joined',
  'tournament_entered',
  'verein_submitted_and_verified',
])

const MEILENSTEIN_TYPES = new Set([
  'level_reached',
  'first_registration',
  'logo_clicks',
  'all_faq_opened',
])

function getCategory(requirement: unknown): BadgeCategory {
  if (
    typeof requirement !== 'object' ||
    requirement === null ||
    Array.isArray(requirement)
  ) {
    return 'meilenstein'
  }
  const req = requirement as Record<string, unknown>
  const type = typeof req.type === 'string' ? req.type : ''

  if (TRAINING_TYPES.has(type)) return 'training'
  if (STREAK_TYPES.has(type)) return 'streak'
  if (ERNAEHRUNG_TYPES.has(type)) return 'ernaehrung'
  if (SOZIAL_TYPES.has(type)) return 'sozial'
  if (SPORT_TYPES.has(type)) return 'sport'
  if (MEILENSTEIN_TYPES.has(type)) return 'meilenstein'
  return 'meilenstein'
}

// ── Page Component ───────────────────────────────────────────────

export default async function AbzeichenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/anmelden')

  const userId = session.user.id

  const [
    allBadges,
    earnedBadges,
    totalSessions,
    userData,
    totalMealLogs,
    totalPosts,
    followerCount,
    tournamentEntries,
  ] = await Promise.all([
    prisma.badge.findMany({
      where: { isSecret: false },
      orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        iconName: true,
        rarity: true,
        xpReward: true,
        requirement: true,
        sportId: true,
        sport: {
          select: { name: true, slug: true, colorPrimary: true },
        },
      },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, earnedAt: true },
    }),
    prisma.trainingSession.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakDays: true, level: true },
    }),
    prisma.mealLog.count({ where: { userId } }),
    prisma.post.count({ where: { userId } }),
    prisma.userFollow.count({ where: { followingId: userId } }),
    prisma.tournamentEntry.count({ where: { userId } }),
  ])

  if (!userData) redirect('/anmelden')

  // Earned-Badge-Map aufbauen
  const earnedMap = new Map<string, string>()
  for (const ub of earnedBadges) {
    earnedMap.set(ub.badgeId, ub.earnedAt.toISOString())
  }

  // Serialisieren + kategorisieren
  const serializedBadges: SerializedBadge[] = allBadges.map((badge) => {
    const req =
      typeof badge.requirement === 'object' &&
      badge.requirement !== null &&
      !Array.isArray(badge.requirement)
        ? (badge.requirement as Record<string, unknown>)
        : {}

    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconName: badge.iconName,
      rarity: badge.rarity as BadgeRarity,
      xpReward: badge.xpReward,
      requirement: req,
      sportId: badge.sportId,
      sport: badge.sport ?? null,
      isEarned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) ?? null,
      category: getCategory(badge.requirement),
    }
  })

  // Earned badges zuerst sortieren
  serializedBadges.sort((a, b) => {
    if (a.isEarned && !b.isEarned) return -1
    if (!a.isEarned && b.isEarned) return 1
    return 0
  })

  const userProgress: UserProgress = {
    totalSessions,
    streakDays: userData.streakDays,
    level: userData.level,
    totalMealLogs,
    totalPosts,
    followerCount,
    tournamentEntries,
  }

  return (
    <BadgesClient
      badges={serializedBadges}
      totalBadgeCount={allBadges.length}
      earnedCount={earnedBadges.length}
      userProgress={userProgress}
    />
  )
}
