// ─────────────────────────────────────────────────────────────────
// app/api/auth/parent-deny/route.ts
//
// GET /api/auth/parent-deny?token=...
// Elternteil lehnt die Registrierung des Kindes ab.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportrise.de'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token')

  if (token === null || token.trim() === '') {
    return NextResponse.redirect(`${APP_URL}/?eltern=ungueltig`)
  }

  const user = await prisma.user.findUnique({
    where: { parentVerifyToken: token },
    select: { id: true, isParentVerified: true },
  })

  if (user === null) {
    return NextResponse.redirect(`${APP_URL}/?eltern=ungueltig`)
  }

  if (user.isParentVerified) {
    // Bereits bestätigt – Ablehnung nicht mehr möglich
    return NextResponse.redirect(`${APP_URL}/?eltern=bereits-bestaetigt`)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isActive:          false,
      parentVerifyToken: null,
    },
  })

  return NextResponse.redirect(`${APP_URL}/?eltern=abgelehnt`)
}
