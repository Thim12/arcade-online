// ─────────────────────────────────────────────────────────────────
// POST /api/posts/[id]/like – Like togglen
// Author erhält +5 XP wenn geliked (nicht wenn unlike)
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardXP } from '@/lib/xp'

interface RouteParams {
  params: { id: string }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
  }

  const existing = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: session.user.id, postId: params.id } },
  })

  let liked: boolean

  if (existing) {
    await prisma.postLike.delete({
      where: { userId_postId: { userId: session.user.id, postId: params.id } },
    })
    liked = false
  } else {
    await prisma.postLike.create({
      data: { userId: session.user.id, postId: params.id },
    })
    liked = true

    // Author erhält XP (nicht sich selbst liken)
    if (post.userId !== session.user.id) {
      try {
        await awardXP(post.userId, 5, prisma)
      } catch {
        // XP-Fehler dürfen Like nicht blockieren
      }
    }
  }

  const likeCount = await prisma.postLike.count({ where: { postId: params.id } })

  return NextResponse.json({ liked, likeCount })
}
