// ─────────────────────────────────────────────────────────────────
// GET /api/sparring?status=all|pending|accepted|declined
// Gibt eigene gesendete + empfangene Anfragen zurück.
// Authentifizierung erforderlich.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PARTNER_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
  level: true,
  city: true,
  state: true,
  sports: {
    where: {
      sport: { is: { slug: 'tennis' } },
    },
    select: {
      level: true,
      details: true,
    },
    take: 1,
  },
} as const

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const currentUserId = session.user.id
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status') ?? 'all'

  // Gültigen Status-Filter bauen
  type StatusValue = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED'
  const statusMap: Record<string, StatusValue | undefined> = {
    pending: 'PENDING',
    accepted: 'ACCEPTED',
    declined: 'DECLINED',
    blocked: 'BLOCKED',
  }
  const prismaStatus = statusMap[statusFilter]

  const where = prismaStatus
    ? {
        OR: [
          { senderId: currentUserId, status: prismaStatus },
          { receiverId: currentUserId, status: prismaStatus },
        ],
      }
    : {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      }

  try {
    const requests = await prisma.sparringRequest.findMany({
      where,
      include: {
        sender: { select: PARTNER_SELECT },
        receiver: { select: PARTNER_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Typen serialisieren und Richtung (isSentByMe) ergänzen
    const serialized = requests.map((req) => {
      const isSentByMe = req.senderId === currentUserId
      const otherUser = isSentByMe ? req.receiver : req.sender
      const tennisSport = otherUser.sports[0]
      const details = tennisSport?.details as Record<string, unknown> | null

      return {
        id: req.id,
        status: req.status,
        message: req.message,
        isSentByMe,
        createdAt: req.createdAt.toISOString(),
        updatedAt: req.updatedAt.toISOString(),
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          image: otherUser.image,
          level: otherUser.level,
          city: otherUser.city,
          state: otherUser.state,
          tennisLevel: tennisSport?.level ?? null,
          lk: typeof details?.['lk'] === 'string' ? details['lk'] : null,
        },
      }
    })

    // In gesendet / empfangen / aktiv aufteilen
    const sent = serialized.filter((r) => r.isSentByMe)
    const received = serialized.filter((r) => !r.isSentByMe)
    const active = serialized.filter((r) => r.status === 'ACCEPTED')

    return NextResponse.json({ sent, received, active, all: serialized })
  } catch {
    return NextResponse.json(
      { error: 'Anfragen konnten nicht geladen werden' },
      { status: 500 },
    )
  }
}
