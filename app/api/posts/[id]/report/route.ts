// ─────────────────────────────────────────────────────────────────
// POST /api/posts/[id]/report – Post melden
// Auto-Hide nach 5 Reports
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

const VALID_REASONS = [
  'SPAM',
  'BELEIDIGUNG',
  'UNANGEMESSENER_INHALT',
  'FALSCHE_INFORMATION',
] as const

type ReportReason = typeof VALID_REASONS[number]

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('reason' in body)) {
    return NextResponse.json({ error: 'Grund fehlt' }, { status: 400 })
  }

  const { reason } = body as { reason: string }

  if (!VALID_REASONS.includes(reason as ReportReason)) {
    return NextResponse.json({ error: 'Ungültiger Grund' }, { status: 400 })
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
  }

  // Eigenen Post kann man nicht melden
  if (post.userId === session.user.id) {
    return NextResponse.json({ error: 'Eigene Posts können nicht gemeldet werden' }, { status: 400 })
  }

  // Bereits gemeldet?
  const existing = await prisma.postReport.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: params.id } },
  })

  if (existing) {
    return NextResponse.json({ error: 'Du hast diesen Post bereits gemeldet' }, { status: 409 })
  }

  // Report erstellen + reportsCount incrementieren
  await prisma.$transaction([
    prisma.postReport.create({
      data: {
        userId: session.user.id,
        postId: params.id,
        reason,
      },
    }),
    prisma.post.update({
      where: { id: params.id },
      data: { reportsCount: { increment: 1 } },
    }),
  ])

  // Auto-Hide prüfen (>= 5 Reports)
  const updated = await prisma.post.findUnique({
    where: { id: params.id },
    select: { reportsCount: true },
  })

  if (updated && updated.reportsCount >= 5) {
    await prisma.post.update({
      where: { id: params.id },
      data: { isHidden: true },
    })
  }

  return NextResponse.json({ success: true })
}
