// ─────────────────────────────────────────────────────────────────
// app/api/auth/parent-verify/route.ts
//
// GET /api/auth/parent-verify?token=...
// Elternteil bestätigt die Registrierung des Kindes.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportrise.de'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token')

  if (token === null || token.trim() === '') {
    return NextResponse.redirect(`${APP_URL}/?eltern=ungueltig`)
  }

  const user = await prisma.user.findUnique({
    where: { parentVerifyToken: token },
    select: { id: true, name: true, email: true, isParentVerified: true },
  })

  if (user === null) {
    return NextResponse.redirect(`${APP_URL}/?eltern=ungueltig`)
  }

  if (user.isParentVerified) {
    // Bereits bestätigt – einfach weiterleiten
    return NextResponse.redirect(`${APP_URL}/?eltern=bereits-bestaetigt`)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isParentVerified:  true,
      isActive:          true,
      gymAccessEnabled:  false, // Unter 14 bleibt kein Fitnessstudio-Zugang
      parentVerifyToken: null,
    },
  })

  // Vorname aus dem gespeicherten Namen extrahieren
  const vorname = user.name?.split(' ')[0] ?? 'Sportler'

  void sendWelcomeEmail({
    toEmail: user.email,
    vorname,
  })

  return NextResponse.redirect(`${APP_URL}/?eltern=bestaetigt`)
}
