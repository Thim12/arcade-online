// ─────────────────────────────────────────────────────────────────
// GET /api/profil/[username]
//
// Gibt öffentliche Profil-Daten für einen User anhand des Usernamens.
// Privates Profil: nur der eigene User oder Follower dürfen es sehen.
//
// Response:
//   name, image, level, xp, streakDays, longestStreak,
//   primarySport, bio, city, state, createdAt,
//   totalSessions, totalBadges, sportPayload, recentBadges
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } },
): Promise<NextResponse> {
  const session = await auth()
  const currentUserId = session?.user?.id ?? null

  const { username } = params

  if (!username) {
    return NextResponse.json({ error: 'Kein Benutzername angegeben.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id:              true,
      name:            true,
      image:           true,
      bio:             true,
      level:           true,
      xp:              true,
      streakDays:      true,
      longestStreak:   true,
      city:            true,
      state:           true,
      isPublicProfile: true,
      createdAt:       true,
      sports: {
        include: {
          sport: {
            select: {
              id:           true,
              name:         true,
              slug:         true,
              colorPrimary: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      userBadges: {
        orderBy: { earnedAt: 'desc' },
        take:    6,
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
      _count: {
        select: {
          trainingSessions: true,
          userBadges:       true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Profil nicht gefunden.' }, { status: 404 })
  }

  const isOwnProfile = currentUserId === user.id

  // Privates Profil: nur eigener User oder Follower darf es sehen
  if (!user.isPublicProfile && !isOwnProfile) {
    // Follower prüfen
    let isFollower = false
    if (currentUserId) {
      const follow = await prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId:  currentUserId,
            followingId: user.id,
          },
        },
        select: { id: true },
      })
      isFollower = follow !== null
    }

    if (!isFollower) {
      return NextResponse.json(
        { error: 'Dieses Profil ist privat.' },
        { status: 403 },
      )
    }
  }

  // Primäre Sportart (älteste)
  const primarySport = user.sports[0]?.sport.slug ?? null

  // Sport-Payload (alle Sportarten des Users)
  const sportPayload = user.sports.map((us) => ({
    id:      us.id,
    level:   us.level,
    goals:   us.goals,
    details: us.details as Record<string, unknown> | null,
    sport:   us.sport,
  }))

  // Letzte Abzeichen
  const recentBadges = user.userBadges.map((ub) => ({
    id:       ub.id,
    earnedAt: ub.earnedAt.toISOString(),
    badge:    ub.badge,
  }))

  return NextResponse.json({
    success: true,
    profile: {
      id:            user.id,
      name:          user.name,
      image:         user.image,
      bio:           user.bio,
      level:         user.level,
      xp:            user.xp,
      streakDays:    user.streakDays,
      longestStreak: user.longestStreak,
      city:          user.city,
      state:         user.state,
      isPublicProfile: user.isPublicProfile,
      createdAt:     user.createdAt.toISOString(),
      primarySport,
      sportPayload,
      recentBadges,
      totalSessions: user._count.trainingSessions,
      totalBadges:   user._count.userBadges,
    },
    isOwnProfile,
  })
}
