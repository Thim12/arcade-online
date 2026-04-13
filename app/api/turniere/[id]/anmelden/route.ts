// ─────────────────────────────────────────────────────────────────
// app/api/turniere/[id]/anmelden/route.ts
//
// POST – Turnier-Anmeldung
//
// Checks: Auth, Doppelt-Anmeldung, Status = REGISTRATION_OPEN,
//         Plätze frei, Frist noch nicht abgelaufen.
// Danach: TournamentEntry erstellen + 200 XP + Badge + Notification
//         + E-Mail (fire-and-forget).
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardXP } from '@/lib/xp'
import { checkAndAwardBadges } from '@/lib/badge-checker'
import { sendTournamentConfirmationEmail } from '@/lib/resend'

const XP_TOURNAMENT = 200

export async function POST(
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
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      startDate: true,
      registrationDeadline: true,
      maxParticipants: true,
      status: true,
      _count: { select: { entries: true } },
    },
  })

  if (!tournament) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 })
  }

  // Status-Check
  if (tournament.status !== 'REGISTRATION_OPEN') {
    return NextResponse.json(
      { error: 'Anmeldung ist aktuell nicht geöffnet' },
      { status: 409 },
    )
  }

  // Frist-Check
  if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
    return NextResponse.json(
      { error: 'Anmeldefrist ist abgelaufen' },
      { status: 409 },
    )
  }

  // Plätze-Check
  if (
    tournament.maxParticipants !== null &&
    tournament._count.entries >= tournament.maxParticipants
  ) {
    return NextResponse.json(
      { error: 'Das Turnier ist bereits ausgebucht' },
      { status: 409 },
    )
  }

  // Doppelt-Anmeldung prüfen
  const existing = await prisma.tournamentEntry.findUnique({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId } },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Du bist bereits für dieses Turnier angemeldet' },
      { status: 409 },
    )
  }

  // Anmeldung erstellen
  const entry = await prisma.tournamentEntry.create({
    data: { tournamentId: tournament.id, userId },
    select: { registeredAt: true },
  })

  // XP vergeben
  const xpResult = await awardXP(userId, XP_TOURNAMENT, prisma)

  // Badge prüfen (fire-and-forget – Fehler nicht propagieren)
  checkAndAwardBadges(userId, 'TOURNAMENT_ENTERED', prisma).catch(() => null)

  // Notification erstellen
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: 'Turnieranmeldung bestätigt',
      body: `Du bist erfolgreich für "${tournament.name}" angemeldet. Viel Erfolg!`,
    },
  })

  // E-Mail senden (fire-and-forget)
  prisma.user
    .findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })
    .then((user) => {
      if (!user?.email) return
      const datum = tournament.startDate.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      sendTournamentConfirmationEmail({
        toEmail: user.email,
        userName: user.name ?? 'Sportler',
        turnierName: tournament.name,
        turnierDatum: datum,
        turnierStadt: tournament.city,
        turnierSlug: tournament.slug,
      }).catch(() => null)
    })
    .catch(() => null)

  return NextResponse.json({
    success: true,
    registeredAt: entry.registeredAt.toISOString(),
    xpGained: xpResult.xpGained,
    newXP: xpResult.newXP,
    newLevel: xpResult.newLevel,
    leveledUp: xpResult.leveledUp,
  })
}
