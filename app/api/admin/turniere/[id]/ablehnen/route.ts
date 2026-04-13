// ─────────────────────────────────────────────────────────────────
// app/api/admin/turniere/[id]/ablehnen/route.ts
//
// POST /api/admin/turniere/[id]/ablehnen
// Body: { reason: string }
// Admin-Only: Turnier ablehnen.
// Setzt isPublished=false, status=CANCELLED.
// Sendet Ablehnungsmail an Einreicher.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTurnierAbgelehntEmail } from '@/lib/resend'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { id } = params

  let reason = ''
  try {
    const body = (await req.json()) as { reason?: string }
    reason = (body.reason ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })
  }

  if (!reason) {
    return NextResponse.json({ error: 'Begründung ist erforderlich' }, { status: 400 })
  }

  const tournament = await prisma.tournament.findUnique({ where: { id } })

  if (!tournament) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 })
  }

  await prisma.tournament.update({
    where: { id },
    data: {
      isPublished: false,
      status: 'CANCELLED',
    },
  })

  if (tournament.submitterEmail) {
    try {
      const einreicherVorname = tournament.submitterName?.split(' ')[0] ?? 'Hallo'
      await sendTurnierAbgelehntEmail({
        toEmail: tournament.submitterEmail,
        einreicherVorname,
        turnierName: tournament.name,
        reason,
      })
    } catch {
      // Mail-Fehler nicht kritisch
    }
  }

  return NextResponse.json({ success: true })
}
