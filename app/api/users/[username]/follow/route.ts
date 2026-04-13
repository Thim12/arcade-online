// ─────────────────────────────────────────────────────────────────
// POST /api/users/[username]/follow – Follow / Unfollow Toggle
// Optimistic UI-kompatibel: gibt isFollowing + followerCount zurück
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: NextRequest,
  { params }: { params: { username: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const currentUserId = session.user.id
  const { username } = params

  // Ziel-User suchen
  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })

  if (!target) {
    return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })
  }

  if (target.id === currentUserId) {
    return NextResponse.json({ error: 'Sich selbst folgen ist nicht möglich' }, { status: 400 })
  }

  // Bestehenden Follow prüfen
  const existing = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: target.id,
      },
    },
    select: { id: true },
  })

  if (existing) {
    // Unfollow
    await prisma.userFollow.delete({
      where: { id: existing.id },
    })
  } else {
    // Follow
    await prisma.userFollow.create({
      data: {
        followerId: currentUserId,
        followingId: target.id,
      },
    })
  }

  const followerCount = await prisma.userFollow.count({
    where: { followingId: target.id },
  })

  return NextResponse.json({
    isFollowing: !existing,
    followerCount,
  })
}
