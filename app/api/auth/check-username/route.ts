// ─────────────────────────────────────────────────────────────────
// app/api/auth/check-username/route.ts
//
// GET /api/auth/check-username?username=...
// Prüft ob ein Benutzername bereits vergeben ist.
// Antwort: { available: boolean }
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const username = request.nextUrl.searchParams.get('username')

  if (username === null || username.trim() === '') {
    return NextResponse.json({ available: false }, { status: 400 })
  }

  const normalised = username.trim().toLowerCase()

  // Mindestlänge 3, Maximallänge 20, nur erlaubte Zeichen
  if (normalised.length < 3 || normalised.length > 20 || !/^[a-zA-Z0-9_]+$/.test(normalised)) {
    return NextResponse.json({ available: false }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { username: normalised },
    select: { id: true },
  })

  return NextResponse.json({ available: existing === null })
}
