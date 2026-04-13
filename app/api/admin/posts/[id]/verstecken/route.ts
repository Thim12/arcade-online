// ─────────────────────────────────────────────────────────────────
// app/api/admin/posts/[id]/verstecken/route.ts
//
// POST /api/admin/posts/[id]/verstecken
// Admin-Only: Post verstecken (isHidden=true).
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
  }

  const { id } = params

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) {
    return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
  }

  await prisma.post.update({
    where: { id },
    data: { isHidden: true },
  })

  return NextResponse.json({ success: true })
}
