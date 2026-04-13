// ─────────────────────────────────────────────────────────────────
// app/api/vereine/[id]/mitglied/route.ts
//
// POST – Vereinsmitgliedschaft beantragen (VereinFollow erstellen)
//
// Auth:        Erforderlich (401 sonst)
// Idempotent:  Bereits Mitglied → 200 ohne XP
// Erfolgreich: VereinFollow.create + 150 XP + Badge-Check
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardXP } from '@/lib/xp'
import { checkAndAwardBadges } from '@/lib/badge-checker'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const userId = session.user.id
  const vereinId = params.id

  // Verein-Existenz prüfen
  const verein = await prisma.verein.findUnique({
    where: { id: vereinId },
    select: { id: true },
  })

  if (!verein) {
    return NextResponse.json({ error: 'Verein nicht gefunden' }, { status: 404 })
  }

  // Bereits Mitglied? → Idempotent zurückgeben
  const existing = await prisma.vereinFollow.findUnique({
    where: { userId_vereinId: { userId, vereinId } },
    select: { id: true },
  })

  if (existing) {
    return NextResponse.json({ alreadyMember: true, leveledUp: false, newBadges: [] })
  }

  // Mitgliedschaft erstellen + XP + Badge parallel
  await prisma.vereinFollow.create({
    data: { userId, vereinId },
  })

  const [xpResult, newBadges] = await Promise.all([
    awardXP(userId, 150, prisma),
    checkAndAwardBadges(userId, 'VEREIN_FOLLOWED', prisma),
  ])

  return NextResponse.json({
    alreadyMember: false,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    newBadges: newBadges.map((b) => ({
      id: b.badge.id,
      name: b.badge.name,
      iconName: b.badge.iconName,
      xpReward: b.xpAwarded,
    })),
  })
}
