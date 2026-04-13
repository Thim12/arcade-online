// ─────────────────────────────────────────────────────────────────
// app/api/admin/vereine/[id]/bestaetigen/route.ts
//
// POST /api/admin/vereine/[id]/bestaetigen
// Admin-Only: Verein verifizieren.
// Setzt status=VERIFIED, isVerified=true, verifiedAt=now().
// Vergibt +200 XP an Einreicher (falls SportRise-Account vorhanden).
// Sendet Bestätigungsmail an Einreicher.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendVereinConfirmationEmail } from '@/lib/resend'
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

  const verein = await prisma.verein.findUnique({ where: { id } })

  if (!verein) {
    return NextResponse.json({ error: 'Verein nicht gefunden' }, { status: 404 })
  }

  if (verein.status === 'VERIFIED') {
    return NextResponse.json({ error: 'Verein ist bereits verifiziert' }, { status: 400 })
  }

  await prisma.verein.update({
    where: { id },
    data: {
      status: 'VERIFIED',
      isVerified: true,
      verifiedAt: new Date(),
    },
  })

  // +200 XP: Einreicher-Account via submitterEmail nachschlagen
  if (verein.submitterEmail) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: verein.submitterEmail },
        select: { id: true },
      })
      if (user) {
        await awardXP(user.id, 200, prisma)
      }
    } catch {
      // XP-Fehler nicht kritisch
    }

    // Bestätigungsmail senden
    try {
      await sendVereinConfirmationEmail({
        toEmail: verein.submitterEmail,
        vereinName: verein.name,
        vereinSlug: verein.slug,
      })
    } catch {
      // Mail-Fehler nicht kritisch
    }
  }

  return NextResponse.json({ success: true })
}
