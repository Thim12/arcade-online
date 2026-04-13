// ─────────────────────────────────────────────────────────────────
// POST /api/sparring/request – Sparring-Anfrage senden
//
// Legt einen SparringRequest-Record in der DB an und sendet
// eine SPARRING_REQUEST-Notification an den Ziel-User.
//
// Body: { targetUserId: string; message?: string }
// Constraints:
//   • Kein Selbst-Request
//   • Nur eine offene Anfrage pro Paar (unique constraint)
//   • message max. 300 Zeichen
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const currentUserId = session.user.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('targetUserId' in body)) {
    return NextResponse.json({ error: 'targetUserId fehlt' }, { status: 400 })
  }

  const { targetUserId, message } = body as {
    targetUserId: string
    message?: string
  }

  if (typeof targetUserId !== 'string' || !targetUserId.trim()) {
    return NextResponse.json({ error: 'Ungültige targetUserId' }, { status: 400 })
  }

  if (targetUserId === currentUserId) {
    return NextResponse.json(
      { error: 'Sich selbst anfragen ist nicht möglich' },
      { status: 400 },
    )
  }

  const trimmedMessage =
    typeof message === 'string' ? message.trim().slice(0, 300) : null

  // Sender laden
  const sender = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { name: true, username: true },
  })

  // Ziel-User prüfen
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  })

  if (!target) {
    return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })
  }

  const senderName = sender?.name ?? sender?.username ?? 'Jemand'

  // SparringRequest in DB anlegen + Notification in einer Transaktion
  try {
    const sparringRequest = await prisma.$transaction(async (tx) => {
      const req = await tx.sparringRequest.create({
        data: {
          senderId: currentUserId,
          receiverId: targetUserId,
          message: trimmedMessage,
          status: 'PENDING',
        },
      })

      await tx.notification.create({
        data: {
          userId: targetUserId,
          type: 'SPARRING_REQUEST',
          title: 'Neue Sparring-Anfrage',
          body: `${senderName} möchte mit dir sparren.`,
          data: {
            senderId: currentUserId,
            senderName,
            sparringRequestId: req.id,
          },
        },
      })

      return req
    })

    return NextResponse.json({ success: true, id: sparringRequest.id }, { status: 201 })
  } catch (error) {
    // Unique-Constraint-Verletzung: es existiert bereits eine Anfrage zwischen diesen Usern
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Du hast diesem Nutzer bereits eine Anfrage gesendet' },
        { status: 409 },
      )
    }
    throw error
  }
}
