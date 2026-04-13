// ─────────────────────────────────────────────────────────────────
// PATCH /api/sparring/[id] – Sparring-Anfrage-Status ändern
// Body: { status: "ACCEPTED" | "DECLINED" | "BLOCKED" }
// Nur der Empfänger kann ACCEPTED/DECLINED setzen.
// Der Sender kann BLOCKED setzen (Partner blockieren).
// Bei ACCEPTED: Notification an Sender.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const currentUserId = session.user.id
  const { id } = params

  if (!id?.trim()) {
    return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('status' in body)) {
    return NextResponse.json({ error: 'Status fehlt' }, { status: 400 })
  }

  const { status } = body as { status: string }
  const allowed = ['ACCEPTED', 'DECLINED', 'BLOCKED']

  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: 'Ungültiger Status. Erlaubt: ACCEPTED, DECLINED, BLOCKED' },
      { status: 400 },
    )
  }

  // Anfrage laden
  const sparring = await prisma.sparringRequest.findUnique({
    where: { id },
    include: {
      sender: { select: { id: true, name: true, username: true } },
      receiver: { select: { id: true, name: true, username: true } },
    },
  })

  if (!sparring) {
    return NextResponse.json({ error: 'Anfrage nicht gefunden' }, { status: 404 })
  }

  // Berechtigungsprüfung
  const isReceiver = sparring.receiverId === currentUserId
  const isSender = sparring.senderId === currentUserId

  if (!isReceiver && !isSender) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // Empfänger darf ACCEPTED und DECLINED setzen
  if ((status === 'ACCEPTED' || status === 'DECLINED') && !isReceiver) {
    return NextResponse.json(
      { error: 'Nur der Empfänger kann annehmen oder ablehnen' },
      { status: 403 },
    )
  }

  // Bereits abgeschlossene Anfragen nicht mehr ändern (außer BLOCKED)
  if (sparring.status === 'BLOCKED' && status !== 'BLOCKED') {
    return NextResponse.json(
      { error: 'Blockierte Anfragen können nicht geändert werden' },
      { status: 409 },
    )
  }

  // Status aktualisieren
  const updated = await prisma.sparringRequest.update({
    where: { id },
    data: { status: status as 'ACCEPTED' | 'DECLINED' | 'BLOCKED' },
  })

  // Bei ACCEPTED: Notification an den Sender
  if (status === 'ACCEPTED') {
    const receiverName =
      sparring.receiver.name ?? sparring.receiver.username ?? 'Jemand'

    await prisma.notification.create({
      data: {
        userId: sparring.senderId,
        type: 'SPARRING_ACCEPTED',
        title: 'Sparring-Anfrage angenommen!',
        body: `${receiverName} hat deine Sparring-Anfrage angenommen. Ihr könnt jetzt ein Treffen vereinbaren.`,
        data: {
          link: '/sparring',
          sparringId: id,
          partnerName: receiverName,
          partnerUsername: sparring.receiver.username,
        },
      },
    })
  }

  return NextResponse.json({ sparring: updated })
}
