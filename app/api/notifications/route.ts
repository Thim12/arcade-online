// ─────────────────────────────────────────────────────────────────
// GET  /api/notifications  – Liste der letzten 20 Benachrichtigungen
// PATCH /api/notifications  – Alle als gelesen markieren
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  const session = await auth()

  // Unauthentifizierte Nutzer erhalten leere Liste (kein 401)
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
