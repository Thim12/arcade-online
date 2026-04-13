// ─────────────────────────────────────────────────────────────────
// app/api/auth/check-email/route.ts
//
// GET /api/auth/check-email?email=...
// Prüft ob eine E-Mail-Adresse bereits registriert ist.
// Antwort: { available: boolean }
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const email = request.nextUrl.searchParams.get('email')

  if (email === null || email.trim() === '') {
    return NextResponse.json({ available: false }, { status: 400 })
  }

  const normalised = email.toLowerCase().trim()

  // Einfache Format-Prüfung – keine DB-Abfrage bei offensichtlich ungültiger E-Mail
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    return NextResponse.json({ available: false }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalised },
    select: { id: true },
  })

  return NextResponse.json({ available: existing === null })
}
