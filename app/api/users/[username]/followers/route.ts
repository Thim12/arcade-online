// ─────────────────────────────────────────────────────────────────
// GET /api/users/[username]/followers – Follower-Liste
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const { username } = params

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true, isPublicProfile: true },
  })

  if (!target) {
    return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })
  }

  const isOwnProfile = session.user.id === target.id
  if (!target.isPublicProfile && !isOwnProfile) {
    return NextResponse.json({ error: 'Profil ist privat' }, { status: 403 })
  }

  const follows = await prisma.userFollow.findMany({
    where: { followingId: target.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          level: true,
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
            take: 2,
          },
        },
      },
    },
  })

  const users = follows.map((f) => ({
    id: f.follower.id,
    name: f.follower.name,
    username: f.follower.username,
    image: f.follower.image,
    level: f.follower.level,
    sports: f.follower.sports.map((us) => us.sport),
  }))

  return NextResponse.json({ users, total: users.length })
}
