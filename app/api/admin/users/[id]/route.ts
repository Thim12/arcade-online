// ─────────────────────────────────────────────────────────────────
// app/api/admin/users/[id]/route.ts
//
// PATCH /api/admin/users/[id]
// Body: { role?: string } | { ban: true }
// Admin-Only: Role ändern oder User bannen.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_ROLES = ['USER', 'MODERATOR', 'ADMIN', 'BANNED'] as const
type ValidRole = (typeof VALID_ROLES)[number]

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { id } = params

  let body: { role?: string; ban?: boolean }
  try {
    body = (await req.json()) as { role?: string; ban?: boolean }
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
  }

  // Admin kann sich nicht selbst bannen oder degradieren
  if (id === session.user.id && (body.ban === true || body.role === 'BANNED')) {
    return NextResponse.json({ error: 'Du kannst dich nicht selbst bannen' }, { status: 400 })
  }

  let data: { role?: string; isActive?: boolean } = {}

  if (body.ban === true) {
    data = { role: 'BANNED', isActive: false }
  } else if (typeof body.role === 'string') {
    if (!VALID_ROLES.includes(body.role as ValidRole)) {
      return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 })
    }
    data = { role: body.role }
    // Entbannen: isActive wieder auf true
    if (body.role !== 'BANNED' && !user.isActive) {
      data.isActive = true
    }
  } else {
    return NextResponse.json({ error: 'Keine Änderung angegeben' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
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
  })

  return NextResponse.json({ user: updated })
}
