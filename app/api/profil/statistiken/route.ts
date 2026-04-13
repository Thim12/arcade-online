// ─────────────────────────────────────────────────────────────────
// GET /api/profil/statistiken
//
// Gibt detaillierte Statistiken des eingeloggten Users zurück:
//   totalSessions, totalMinutes, totalBadges, totalXP,
//   totalPosts, followerCount, followingCount, totalTournaments
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const [
      sessionStats,
      totalBadges,
      totalPosts,
      followerCount,
      followingCount,
      totalTournaments,
      user,
    ] = await Promise.all([
      // Session-Aggregat: Anzahl + Minuten gesamt
      prisma.trainingSession.aggregate({
        where: { userId },
        _count: { id: true },
        _sum:   { durationMin: true },
      }),

      prisma.userBadge.count({ where: { userId } }),

      prisma.post.count({ where: { userId, isHidden: false } }),

      prisma.userFollow.count({ where: { followingId: userId } }),

      prisma.userFollow.count({ where: { followerId: userId } }),

      prisma.tournamentEntry.count({ where: { userId } }),

      prisma.user.findUnique({
        where:  { id: userId },
        select: { xp: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions:    sessionStats._count.id,
        totalMinutes:     sessionStats._sum.durationMin ?? 0,
        totalBadges,
        totalXP:          user?.xp ?? 0,
        totalPosts,
        followerCount,
        followingCount,
        totalTournaments,
      },
    })
  } catch (error) {
    console.error('[GET /api/profil/statistiken]', error)
    return NextResponse.json(
      { error: 'Statistiken konnten nicht geladen werden.' },
      { status: 500 },
    )
  }
}
