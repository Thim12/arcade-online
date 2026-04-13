// ─────────────────────────────────────────────────────────────────
// GET /api/xp-history
//
// Query params:
//   userId  – User-ID (optional, default: eingeloggter User)
//   limit   – Anzahl der Tage (default: 30, max: 90)
//
// Response: { success: true, history: { date: string, xp: number }[] }
//   date = ISO-Datumsstring (YYYY-MM-DD)
//   xp   = Summe der XP aus TrainingSessions an diesem Tag
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  // userId: optional – nur der eingeloggte User oder Admin-Zugriff
  const requestedUserId = searchParams.get('userId')
  const userId = requestedUserId ?? session.user.id

  // Wenn fremder User angefragt: nur öffentliche Profile erlaubt
  if (requestedUserId && requestedUserId !== session.user.id) {
    const target = await prisma.user.findUnique({
      where:  { id: requestedUserId },
      select: { isPublicProfile: true },
    })
    if (!target?.isPublicProfile) {
      return NextResponse.json(
        { error: 'Zugriff verweigert.' },
        { status: 403 },
      )
    }
  }

  // limit: 7–90 Tage, default 30
  const rawLimit = parseInt(searchParams.get('limit') ?? '30', 10)
  const limit = Math.min(90, Math.max(7, isNaN(rawLimit) ? 30 : rawLimit))

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const startDate = new Date(todayStart.getTime() - (limit - 1) * 24 * 60 * 60 * 1000)

  try {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        userId,
        completedAt: { gte: startDate },
      },
      select: {
        completedAt: true,
        xpEarned:    true,
      },
      orderBy: { completedAt: 'asc' },
    })

    // Aggregiere XP nach Tag (YYYY-MM-DD)
    const xpByDate = new Map<string, number>()

    for (const s of sessions) {
      const d = new Date(s.completedAt)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      xpByDate.set(key, (xpByDate.get(key) ?? 0) + s.xpEarned)
    }

    // Alle Tage im Zeitraum aufbauen (inkl. 0-XP-Tage)
    const history = Array.from({ length: limit }, (_, i) => {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateKey = d.toISOString().slice(0, 10)
      return {
        date: dateKey,
        xp:   xpByDate.get(dateKey) ?? 0,
      }
    })

    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error('[GET /api/xp-history]', error)
    return NextResponse.json(
      { error: 'XP-Historie konnte nicht geladen werden.' },
      { status: 500 },
    )
  }
}
