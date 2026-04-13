// ─────────────────────────────────────────────────────────────────
// app/api/admin/users/route.ts
//
// GET /api/admin/users?q=<suchbegriff>
// Admin-Only: User-Suche (name, username, email) mit Debounce auf Client-Seite.
// Gibt max. 20 User zurück.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { username: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      level: true,
      xp: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ users })
}
