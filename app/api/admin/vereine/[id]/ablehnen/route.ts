// ─────────────────────────────────────────────────────────────────
// app/api/admin/vereine/[id]/ablehnen/route.ts
//
// POST /api/admin/vereine/[id]/ablehnen
// Body: { reason: string }
// Admin-Only: Verein ablehnen.
// Setzt status=REJECTED, sendet Ablehnungsmail mit Begründung.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVereinRejectionEmail } from '@/lib/resend'

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

  const verein = await prisma.verein.findUnique({ where: { id } })

  if (!verein) {
    return NextResponse.json({ error: 'Verein nicht gefunden' }, { status: 404 })
  }

  await prisma.verein.update({
    where: { id },
    data: { status: 'REJECTED' },
  })

  if (verein.submitterEmail) {
    try {
      await sendVereinRejectionEmail({
        toEmail: verein.submitterEmail,
        vereinName: verein.name,
        reason,
      })
    } catch {
      // Mail-Fehler nicht kritisch
    }
  }

  return NextResponse.json({ success: true })
}
