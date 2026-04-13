// ─────────────────────────────────────────────────────────────────
// GET  /api/posts/[id]/comment – Kommentare eines Posts laden
// POST /api/posts/[id]/comment – Kommentar hinzufügen
// Author erhält +15 XP, badge check, Notification
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardXP } from '@/lib/xp'

interface RouteParams {
  params: { id: string }
}

// ── GET /api/posts/[id]/comment ───────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const comments = await prisma.postComment.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: 'asc' },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          level: true,
        },
      },
    },
  })

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
    })),
  })
}

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

  if (!body || typeof body !== 'object' || !('content' in body)) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
  }

  const { content } = body as { content: string }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Kommentar fehlt' }, { status: 400 })
  }

  if (content.length > 500) {
    return NextResponse.json({ error: 'Kommentar zu lang (max. 500 Zeichen)' }, { status: 400 })
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
  }

  const comment = await prisma.postComment.create({
    data: {
      userId: session.user.id,
      postId: params.id,
      content: content.trim(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          level: true,
        },
      },
    },
  })

  // XP für Autor + Notification (fire-and-forget)
  try {
    // Kommentierer bekommt XP
    await awardXP(session.user.id, 15, prisma)

    // Post-Author erhält Notification (wenn jemand anderes kommentiert)
    if (post.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'SYSTEM',
          title: 'Neuer Kommentar',
          body: `${session.user.name ?? 'Jemand'} hat deinen Post kommentiert.`,
          data: { postId: params.id },
        },
      })
    }
  } catch {
    // Fehler dürfen Kommentar nicht blockieren
  }

  const commentCount = await prisma.postComment.count({ where: { postId: params.id } })

  return NextResponse.json({
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
    },
    commentCount,
  }, { status: 201 })
}
