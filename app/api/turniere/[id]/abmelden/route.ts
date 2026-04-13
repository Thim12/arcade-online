// ─────────────────────────────────────────────────────────────────
// app/api/turniere/[id]/abmelden/route.ts
//
// DELETE – Turnier-Abmeldung
//
// Nur erlaubt bis 24 Stunden vor Turnier-Beginn.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MS_24H = 24 * 60 * 60 * 1000

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = params

  // Turnier laden
  const tournament = await prisma.tournament.findFirst({
    where: { OR: [{ id }, { slug: id }], isPublished: true },
    select: { id: true, name: true, startDate: true },
  })

  if (!tournament) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 })
  }

  // 24h-Sperrfrist prüfen
  const cutoff = new Date(tournament.startDate.getTime() - MS_24H)
  if (new Date() > cutoff) {
    return NextResponse.json(
      { error: 'Abmeldung ist weniger als 24 Stunden vor Turnierbeginn nicht mehr möglich' },
      { status: 409 },
    )
  }

  // Entry prüfen
  const entry = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId } },
    select: { id: true },
  })

  if (!entry) {
    return NextResponse.json(
      { error: 'Du bist nicht für dieses Turnier angemeldet' },
      { status: 404 },
    )
  }

  // Löschen
  await prisma.tournamentEntry.delete({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId } },
  })

  // Notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: 'Turnierabmeldung bestätigt',
      body: `Du wurdest erfolgreich von "${tournament.name}" abgemeldet.`,
    },
  })

  return NextResponse.json({ success: true })
}
