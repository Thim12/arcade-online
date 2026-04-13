// ─────────────────────────────────────────────────────────────────
// GET /api/entdecken – Entdecken-Seite Daten
// Gibt 3 Kategorien von User-Cards + Trending Posts zurück.
// Tab-Param: nearby | same_sport | similar_level (default: alle)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CARD_LIMIT = 12

export async function GET(_request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const currentUserId = session.user.id

  // Aktuellen User laden
  const me = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      id: true,
      state: true,
      level: true,
      sports: {
        select: { sportId: true },
        take: 3,
      },
      following: {
        select: { followingId: true },
      },
    },
  })

  if (!me) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const followingIds = new Set(me.following.map((f) => f.followingId))
  const mySportIds = me.sports.map((s) => s.sportId)

  // ── User-Select Hilfsobjekt ────────────────────────────────────
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
    _count: {
      select: { followers: true },
    },
  } as const

  // ── Alle 3 Kategorien parallel laden ──────────────────────────
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [nearbyRaw, sameSportRaw, similarLevelRaw, trendingPostsRaw] =
    await Promise.all([
      // In der Nähe: gleicher Bundesstaat
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

      // Gleiche Sportart
      mySportIds.length > 0
        ? prisma.user.findMany({
            where: {
              id: { not: currentUserId },
              isPublicProfile: true,
              isActive: true,
              sports: {
                some: { sportId: { in: mySportIds } },
              },
            },
            orderBy: { level: 'desc' },
            take: CARD_LIMIT,
            select: userSelect,
          })
        : Promise.resolve([]),

      // Ähnliches Niveau (Level ±3)
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

      // Trending Posts (letzte 7 Tage, nach Likes+Kommentare sortiert)
      prisma.post.findMany({
        where: {
          isHidden: false,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: [{ reportsCount: 'asc' }],
        take: 20,
        select: {
          id: true,
          content: true,
          title: true,
          type: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              username: true,
              image: true,
            },
          },
          sport: {
            select: {
              id: true,
              name: true,
              slug: true,
              colorPrimary: true,
            },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
      }),
    ])

  // Trending: nach likes + comments sortieren
  const trendingPosts = [...trendingPostsRaw]
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

  // User-Array in EntdeckenUser-Format konvertieren
  function toEntdeckenUser(
    raw: (typeof nearbyRaw)[number],
  ) {
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

  return NextResponse.json({
    nearby: nearbyRaw.map(toEntdeckenUser),
    sameSport: sameSportRaw.map(toEntdeckenUser),
    similarLevel: similarLevelRaw.map(toEntdeckenUser),
    trendingPosts,
  })
}
