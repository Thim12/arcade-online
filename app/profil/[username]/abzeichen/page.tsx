// ─────────────────────────────────────────────────────────────────
// /app/profil/[username]/abzeichen/page.tsx – Abzeichen-Übersicht
// Server Component: lädt verdiente + nicht-geheime unverdiente Badges,
// berechnet Fortschritt je Requirement-Typ serverseitig.
// ─────────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AbzeichenClient } from '@/components/profil/AbzeichenClient'
import type { ProfilBadge } from '@/lib/types/profil'

interface AbzeichenPageProps {
  params: { username: string }
}

export async function generateMetadata({
  params,
}: AbzeichenPageProps): Promise<Metadata> {
  const { username } = params
  const u = await prisma.user.findUnique({
    where: { username },
    select: { name: true, username: true },
  })
  if (!u) return { title: 'Abzeichen – SportRise' }
  return {
    title: `Abzeichen – ${u.name ?? u.username} – SportRise`,
    description: `Alle Abzeichen von ${u.name ?? u.username} auf SportRise`,
  }
}

export default async function AbzeichenPage({ params }: AbzeichenPageProps) {
  const session = await auth()
  const currentUserId = session?.user?.id ?? null

  const { username } = params

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      isPublicProfile: true,
      streakDays: true,
      level: true,
      sports: {
        select: {
          sportId: true,
          sport: {
            select: { id: true, name: true, slug: true, colorPrimary: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!user) notFound()

  const isOwnProfile = currentUserId === user.id
  if (!user.isPublicProfile && !isOwnProfile) notFound()

  const sportIds = user.sports.map((us) => us.sportId)
  const userStreakDays = user.streakDays
  const userLevel = user.level

  // ── 1. Verdiente Badges ─────────────────────────────────────────
  const earnedUserBadges = await prisma.userBadge.findMany({
    where: { userId: user.id },
    include: {
      badge: {
        include: {
          sport: {
            select: { id: true, name: true, slug: true, colorPrimary: true },
          },
        },
      },
    },
    orderBy: { earnedAt: 'desc' },
  })

  const earnedBadgeIds = earnedUserBadges.map((ub) => ub.badgeId)

  // ── 2. Unverdiente, nicht-geheime Badges (sport-relevant + agnostisch) ─
  const unearnedBadges = await prisma.badge.findMany({
    where: {
      ...(earnedBadgeIds.length > 0 ? { id: { notIn: earnedBadgeIds } } : {}),
      isSecret: false,
      ...(sportIds.length > 0
        ? { OR: [{ sportId: null }, { sportId: { in: sportIds } }] }
        : { sportId: null }),
    },
    include: {
      sport: {
        select: { id: true, name: true, slug: true, colorPrimary: true },
      },
    },
    orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
  })

  // ── 3. Fortschritts-Kontext (parallel laden) ───────────────────
  const [
    trainingSessionCount,
    trainingPlanCount,
    postCount,
    vereinCount,
    mealCount,
    tournamentCount,
  ] = await Promise.all([
    prisma.trainingSession.count({ where: { userId: user.id } }),
    prisma.trainingPlan.count({ where: { userId: user.id } }),
    prisma.post.count({ where: { userId: user.id, isHidden: false } }),
    prisma.vereinFollow.count({ where: { userId: user.id } }),
    prisma.mealLog.count({ where: { userId: user.id } }),
    prisma.tournamentEntry.count({ where: { userId: user.id } }),
  ])

  // ── 4. Fortschritt je Requirement-Typ ──────────────────────────
  function computeProgress(req: Record<string, unknown>): {
    progressCurrent: number
    progressTotal: number
    progress: number
  } {
    const type = req['type'] as string
    const required = typeof req['count'] === 'number' ? req['count'] : 1
    let actual = 0

    switch (type) {
      case 'training_sessions':
      case 'sessions_before_hour':
      case 'sessions_after_hour':
        actual = trainingSessionCount
        break
      case 'training_plan_created':
        actual = trainingPlanCount
        break
      case 'post_created':
        actual = postCount
        break
      case 'verein_joined':
        actual = vereinCount
        break
      case 'streak_days':
        actual = userStreakDays
        break
      case 'meal_logged':
      case 'meals_logged':
      case 'water_goal_days':
      case 'nutrition_plan_followed_days':
        actual = mealCount
        break
      case 'tournament_entered':
        actual = tournamentCount
        break
      case 'level_reached':
        actual = userLevel
        break
      default:
        actual = 0
    }

    const progressCurrent = Math.min(actual, required)
    const progress =
      required > 0 ? Math.round((progressCurrent / required) * 100) : 0
    return { progressCurrent, progressTotal: required, progress }
  }

  // ── 5. Typen serialisieren ─────────────────────────────────────
  const earnedBadges: ProfilBadge[] = earnedUserBadges.map((ub) => ({
    id: ub.badge.id,
    name: ub.badge.name,
    description: ub.badge.description,
    iconName: ub.badge.iconName,
    rarity: ub.badge.rarity,
    xpReward: ub.badge.xpReward,
    isSecret: ub.badge.isSecret,
    requirement: ub.badge.requirement as Record<string, unknown>,
    sportId: ub.badge.sportId,
    sport: ub.badge.sport,
    earnedAt: ub.earnedAt.toISOString(),
    isEarned: true,
  }))

  const unearnedBadgesList: ProfilBadge[] = unearnedBadges.map((b) => {
    const req = b.requirement as Record<string, unknown>
    const { progressCurrent, progressTotal, progress } = computeProgress(req)
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      iconName: b.iconName,
      rarity: b.rarity,
      xpReward: b.xpReward,
      isSecret: b.isSecret,
      requirement: req,
      sportId: b.sportId,
      sport: b.sport,
      earnedAt: null,
      isEarned: false,
      progress,
      progressCurrent,
      progressTotal,
    }
  })

  const allBadges: ProfilBadge[] = [...earnedBadges, ...unearnedBadgesList]
  const primarySport = user.sports[0]?.sport ?? null

  return (
    <AbzeichenClient
      badges={allBadges}
      profilUser={{
        name: user.name,
        username: user.username,
        image: user.image,
        primarySportSlug: primarySport?.slug ?? null,
        primarySportColor: primarySport?.colorPrimary ?? null,
      }}
      isOwnProfile={isOwnProfile}
    />
  )
}
