// ─────────────────────────────────────────────────────────────────
// /app/community/entdecken/page.tsx – Entdecken (Server Component)
// Lädt alle 3 Tab-Kategorien + Trending + Leaderboard serverseitig
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EntdeckenClient } from '@/components/community/EntdeckenClient'
import type { EntdeckenUser, TrendingPost, LeaderboardEntry } from '@/lib/types/profil'

export const metadata: Metadata = {
  title: 'Entdecken – SportRise',
  description: 'Lerne Sportlerinnen und Sportler in Hessen kennen',
}

const CARD_LIMIT = 12

export default async function EntdeckenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const currentUserId = session.user.id

  // Aktuellen User laden
  const me = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      id: true,
      state: true,
      level: true,
      sports: { select: { sportId: true }, take: 3 },
      following: { select: { followingId: true } },
    },
  })

  if (!me) redirect('/login')

  const followingIds = new Set(me.following.map((f) => f.followingId))
  const mySportIds = me.sports.map((s) => s.sportId)

  const userSelect = {
    id: true,
    name: true,
    username: true,
    image: true,
    level: true,
    xp: true,
    streakDays: true,
    state: true,
    city: true,
    sports: {
      include: {
        sport: {
          select: {
            id: true,
            name: true,
            slug: true,
            colorPrimary: true,
          },
        },
      },
      take: 3,
    },
    _count: { select: { followers: true } },
  } as const

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [nearbyRaw, sameSportRaw, similarLevelRaw, trendingRaw, topUsersRaw] =
    await Promise.all([
      me.state
        ? prisma.user.findMany({
            where: {
              id: { not: currentUserId },
              state: me.state,
              isPublicProfile: true,
              isActive: true,
            },
            orderBy: { level: 'desc' },
            take: CARD_LIMIT,
            select: userSelect,
          })
        : Promise.resolve([]),

      mySportIds.length > 0
        ? prisma.user.findMany({
            where: {
              id: { not: currentUserId },
              isPublicProfile: true,
              isActive: true,
              sports: { some: { sportId: { in: mySportIds } } },
            },
            orderBy: { level: 'desc' },
            take: CARD_LIMIT,
            select: userSelect,
          })
        : Promise.resolve([]),

      prisma.user.findMany({
        where: {
          id: { not: currentUserId },
          isPublicProfile: true,
          isActive: true,
          level: {
            gte: Math.max(1, me.level - 3),
            lte: me.level + 3,
          },
        },
        orderBy: { xp: 'desc' },
        take: CARD_LIMIT,
        select: userSelect,
      }),

      prisma.post.findMany({
        where: { isHidden: false, createdAt: { gte: sevenDaysAgo } },
        take: 20,
        select: {
          id: true,
          content: true,
          title: true,
          type: true,
          createdAt: true,
          user: { select: { name: true, username: true, image: true } },
          sport: {
            select: {
              id: true,
              name: true,
              slug: true,
              colorPrimary: true,
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),

      // Leaderboard Top 5
      prisma.user.findMany({
        where: { isPublicProfile: true, isActive: true },
        orderBy: { xp: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          level: true,
          xp: true,
          sports: {
            include: {
              sport: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  colorPrimary: true,
                },
              },
            },
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ])

  // Wöchentliche XP für Leaderboard
  const leaderUserIds = topUsersRaw.map((u) => u.id)
  const weeklySessions = await prisma.trainingSession.groupBy({
    by: ['userId'],
    where: { userId: { in: leaderUserIds }, completedAt: { gte: sevenDaysAgo } },
    _sum: { xpEarned: true },
  })
  const weeklyXpMap = new Map<string, number>()
  for (const s of weeklySessions) weeklyXpMap.set(s.userId, s._sum.xpEarned ?? 0)

  // Serialisieren
  function toEntdeckenUser(
    raw: (typeof nearbyRaw)[number],
  ): EntdeckenUser {
    return {
      id: raw.id,
      name: raw.name,
      username: raw.username,
      image: raw.image,
      level: raw.level,
      xp: raw.xp,
      streakDays: raw.streakDays,
      state: raw.state,
      city: raw.city,
      sports: raw.sports.map((us) => ({
        id: us.id,
        level: us.level,
        details: us.details as Record<string, unknown> | null,
        sport: us.sport,
      })),
      isFollowedByMe: followingIds.has(raw.id),
      followerCount: raw._count.followers,
    }
  }

  const trendingPosts: TrendingPost[] = [...trendingRaw]
    .sort(
      (a, b) =>
        b._count.likes + b._count.comments - (a._count.likes + a._count.comments),
    )
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      content: p.content,
      title: p.title,
      type: p.type,
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      createdAt: p.createdAt.toISOString(),
      user: p.user,
      sport: p.sport,
    }))

  const leaderboard: LeaderboardEntry[] = topUsersRaw.map((u, i) => ({
    rank: i + 1,
    id: u.id,
    name: u.name,
    username: u.username,
    image: u.image,
    level: u.level,
    xp: u.xp,
    weeklyXP: weeklyXpMap.get(u.id) ?? 0,
    sport: u.sports[0]?.sport ?? null,
  }))

  return (
    <EntdeckenClient
      nearby={nearbyRaw.map(toEntdeckenUser)}
      sameSport={sameSportRaw.map(toEntdeckenUser)}
      similarLevel={similarLevelRaw.map(toEntdeckenUser)}
      trendingPosts={trendingPosts}
      leaderboard={leaderboard}
      currentUserId={currentUserId}
    />
  )
}
