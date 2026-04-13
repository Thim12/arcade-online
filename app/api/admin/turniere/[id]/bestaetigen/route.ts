// ─────────────────────────────────────────────────────────────────
// app/api/admin/turniere/[id]/bestaetigen/route.ts
//
// POST /api/admin/turniere/[id]/bestaetigen
// Admin-Only: Turnier verifizieren.
// Setzt isVerified=true, isPublished=true, status=REGISTRATION_OPEN.
// Vergibt +200 XP an Einreicher (via submittedByUserId).
// Sendet Bestätigungsmail an Einreicher.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTurnierVerifiziertEmail } from '@/lib/resend'
import { awardXP } from '@/lib/xp'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { id } = params

  const tournament = await prisma.tournament.findUnique({ where: { id } })

  if (!tournament) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 })
  }

  if (tournament.isVerified) {
    return NextResponse.json({ error: 'Turnier ist bereits verifiziert' }, { status: 400 })
  }

  await prisma.tournament.update({
    where: { id },
    data: {
      isVerified: true,
      isPublished: true,
      status: 'REGISTRATION_OPEN',
    },
  })

  // +200 XP an Einreicher
  if (tournament.submittedByUserId) {
    try {
      await awardXP(tournament.submittedByUserId, 200, prisma)
    } catch {
      // XP-Fehler nicht kritisch
    }
  }

  // Bestätigungsmail
  if (tournament.submitterEmail) {
    try {
      const einreicherVorname = tournament.submitterName?.split(' ')[0] ?? 'Hallo'
      await sendTurnierVerifiziertEmail({
        toEmail: tournament.submitterEmail,
        einreicherVorname,
        turnierName: tournament.name,
        turnierSlug: tournament.slug,
      })
    } catch {
      // Mail-Fehler nicht kritisch
    }
  }

  return NextResponse.json({ success: true })
}
