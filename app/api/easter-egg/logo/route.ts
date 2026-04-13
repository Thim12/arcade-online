// ─────────────────────────────────────────────────────────────────
// POST /api/easter-egg/logo
// Vergibt das "Hartnäckig"-Badge (requirement.type = 'logo_clicks').
// Gibt { success, alreadyEarned, xpAwarded } zurück.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(): Promise<NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 })
  }

  // Badge mit requirement.type = 'logo_clicks' suchen
  const badge = await prisma.badge.findFirst({
    where: {
      requirement: {
        path: ['type'],
        equals: 'logo_clicks',
      },
    },
  })

  if (!badge) {
    return NextResponse.json({ success: false, error: 'Badge nicht gefunden' }, { status: 404 })
  }

  // Prüfen ob Badge bereits verdient wurde
  const existing = await prisma.userBadge.findUnique({
    where: {
      userId_badgeId: {
        userId: session.user.id,
        badgeId: badge.id,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ success: true, alreadyEarned: true, xpAwarded: 0 })
  }

  // Badge vergeben und XP gutschreiben (atomare Transaktion)
  await prisma.$transaction([
    prisma.userBadge.create({
      data: {
        userId: session.user.id,
        badgeId: badge.id,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        xp: { increment: badge.xpReward },
      },
    }),
  ])

  return NextResponse.json({ success: true, alreadyEarned: false, xpAwarded: badge.xpReward })
}
