// ─────────────────────────────────────────────────────────────────
// PATCH /api/notifications/[id]/read – Einzelne Notification als
// gelesen markieren (Optimistic-UI Support für Benachrichtigungen-Seite)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function PATCH(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }

  const { id } = params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 })
  }

  // Sicherstellen, dass die Notification dem eingeloggten User gehört
  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!notification) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  if (notification.userId !== session.user.id) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
