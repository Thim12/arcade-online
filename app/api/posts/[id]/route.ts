// ─────────────────────────────────────────────────────────────────
// DELETE /api/posts/[id]  – Post löschen (eigene oder ADMIN)
// PATCH  /api/posts/[id]  – Post bearbeiten (eigene, max. 15 Min)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

// ── DELETE /api/posts/[id] ────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
  }

  if (post.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  await prisma.post.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}

// ── PATCH /api/posts/[id] ─────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { userId: true, createdAt: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
  }

  if (post.userId !== session.user.id) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // Max. 15 Minuten nach Erstellung editierbar
  const diffMs = Date.now() - post.createdAt.getTime()
  if (diffMs > 15 * 60 * 1000) {
    return NextResponse.json(
      { error: 'Post kann nur innerhalb von 15 Minuten bearbeitet werden' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('content' in body)) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
  }

  const { content } = body as { content: string }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Text fehlt' }, { status: 400 })
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: 'Text zu lang (max. 2000 Zeichen)' }, { status: 400 })
  }

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: { content: content.trim() },
    select: { id: true, content: true, updatedAt: true },
  })

  return NextResponse.json({ post: updated })
}
