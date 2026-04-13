// ─────────────────────────────────────────────────────────────────
// GET  /api/posts  – Feed laden (cursor-based pagination)
// POST /api/posts  – Post erstellen (+50 XP, badge check)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardXP } from '@/lib/xp'
import { checkAndAwardBadges } from '@/lib/badge-checker'
import { PostType } from '@prisma/client'

const PAGE_SIZE = 15
const LOAD_MORE_SIZE = 10

// ── GET /api/posts ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const cursor    = searchParams.get('cursor') ?? undefined
  const sportSlug = searchParams.get('sport') ?? undefined
  const typeParam = searchParams.get('type') ?? undefined
  const isFirstPage = !cursor

  const take = isFirstPage ? PAGE_SIZE : LOAD_MORE_SIZE

  // Sport-ID auflösen wenn Filter gesetzt
  let sportId: string | undefined
  if (sportSlug) {
    const sport = await prisma.sport.findUnique({
      where: { slug: sportSlug },
      select: { id: true },
    })
    sportId = sport?.id
  }

  // PostType validieren
  const validTypes: PostType[] = [
    'TEXT', 'TIP', 'QUESTION', 'ACHIEVEMENT', 'MATCH_RESULT',
    'TRAINING_UPDATE', 'MOTIVATION',
  ]
  const postType = typeParam && validTypes.includes(typeParam as PostType)
    ? (typeParam as PostType)
    : undefined

  const posts = await prisma.post.findMany({
    where: {
      isHidden: false,
      ...(sportId ? { sportId } : {}),
      ...(postType ? { type: postType } : {}),
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
    take: take + 1, // +1 um nextCursor zu ermitteln
    ...(cursor ? {
      cursor: { id: cursor },
      skip: 1,
    } : {}),
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
      sport: {
        select: {
          id: true,
          name: true,
          slug: true,
          colorPrimary: true,
        },
      },
      likes: {
        where: { userId: session.user.id },
        select: { id: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  })

  const hasMore = posts.length > take
  const items = hasMore ? posts.slice(0, take) : posts
  const nextCursor = hasMore ? items[items.length - 1]?.id : null

  const data = items.map((post) => ({
    id: post.id,
    content: post.content,
    title: post.title,
    type: post.type,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    isPinned: post.isPinned,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    user: post.user,
    sport: post.sport,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    isLikedByMe: post.likes.length > 0,
  }))

  return NextResponse.json({ posts: data, nextCursor, hasMore })
}

// ── POST /api/posts ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
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

  if (
    !body ||
    typeof body !== 'object' ||
    !('content' in body) ||
    !('sportId' in body)
  ) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 })
  }

  const {
    content,
    sportId,
    type = 'TEXT',
    title,
    mediaUrl,
    mediaType,
  } = body as {
    content: string
    sportId: string
    type?: string
    title?: string
    mediaUrl?: string
    mediaType?: string
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Text fehlt' }, { status: 400 })
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: 'Text zu lang (max. 2000 Zeichen)' }, { status: 400 })
  }

  const validTypes: PostType[] = [
    'TEXT', 'TIP', 'QUESTION', 'ACHIEVEMENT', 'MATCH_RESULT',
    'TRAINING_UPDATE', 'MOTIVATION',
  ]
  const postType: PostType = validTypes.includes(type as PostType)
    ? (type as PostType)
    : 'TEXT'

  // Prüfen ob Sport existiert
  const sport = await prisma.sport.findUnique({ where: { id: sportId }, select: { id: true } })
  if (!sport) {
    return NextResponse.json({ error: 'Sport nicht gefunden' }, { status: 400 })
  }

  const post = await prisma.post.create({
    data: {
      userId: session.user.id,
      sportId,
      type: postType,
      content: content.trim(),
      title: typeof title === 'string' && title.trim() ? title.trim() : null,
      mediaUrl: typeof mediaUrl === 'string' && mediaUrl ? mediaUrl : null,
      mediaType: typeof mediaType === 'string' && mediaType ? mediaType : null,
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
      sport: {
        select: {
          id: true,
          name: true,
          slug: true,
          colorPrimary: true,
        },
      },
    },
  })

  // XP + Badge (fire-and-forget, Fehler nicht an den User zurückgeben)
  try {
    await awardXP(session.user.id, 50, prisma)
    await checkAndAwardBadges(session.user.id, 'POST_CREATED', prisma)
  } catch {
    // XP/Badge-Fehler dürfen die Post-Erstellung nicht blockieren
  }

  return NextResponse.json({
    post: {
      id: post.id,
      content: post.content,
      title: post.title,
      type: post.type,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      isPinned: post.isPinned,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      user: post.user,
      sport: post.sport,
      likeCount: 0,
      commentCount: 0,
      isLikedByMe: false,
    },
  }, { status: 201 })
}
