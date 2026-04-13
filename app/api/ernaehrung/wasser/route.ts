// ─────────────────────────────────────────────────────────────────
// POST /api/ernaehrung/wasser
//
// Setzt oder aktualisiert die Glasanzahl für ein Datum (Upsert).
// Prüft ob 7 Tage in Folge 8 Gläser getrunken wurden → Badge.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface WasserBody {
  date: string   // YYYY-MM-DD
  glasses: number
}

function parseDateParam(raw: string): Date | null {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  return new Date(`${raw}T00:00:00.000Z`)
}

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  let body: WasserBody
  try {
    body = (await req.json()) as WasserBody
  } catch {
    return Response.json({ error: 'Ungültiger Request-Body.' }, { status: 400 })
  }

  const { date, glasses } = body

  if (typeof date !== 'string' || typeof glasses !== 'number') {
    return Response.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 })
  }

  if (glasses < 0 || glasses > 8) {
    return Response.json({ error: 'Glasanzahl muss zwischen 0 und 8 liegen.' }, { status: 400 })
  }

  const dateObj = parseDateParam(date)
  if (!dateObj) {
    return Response.json({ error: 'Ungültiges Datum (YYYY-MM-DD erwartet).' }, { status: 400 })
  }

  try {
    await prisma.waterLog.upsert({
      where: { userId_date: { userId, date: dateObj } },
      update: { glasses },
      create: { userId, date: dateObj, glasses },
    })

    // Badge: 7 Tage in Folge 8 Gläser
    let earnedHydrationBadge = false
    if (glasses === 8) {
      const recentLogs = await prisma.waterLog.findMany({
        where: {
          userId,
          date: {
            gte: new Date(dateObj.getTime() - 6 * 24 * 60 * 60 * 1000),
            lte: dateObj,
          },
        },
        select: { glasses: true, date: true },
        orderBy: { date: 'desc' },
        take: 7,
      })

      if (recentLogs.length >= 7 && recentLogs.every((l) => l.glasses >= 8)) {
        // Badge "Hydrations-Champion" vergeben falls noch nicht vorhanden
        const hydrationBadge = await prisma.badge.findFirst({
          where: { name: 'Hydrations-Champion' },
          select: { id: true, xpReward: true },
        })
        if (hydrationBadge) {
          const alreadyEarned = await prisma.userBadge.findUnique({
            where: { userId_badgeId: { userId, badgeId: hydrationBadge.id } },
          })
          if (!alreadyEarned) {
            await prisma.userBadge.create({
              data: { userId, badgeId: hydrationBadge.id },
            })
            earnedHydrationBadge = true
          }
        }
      }
    }

    return Response.json({ success: true, glasses, earnedHydrationBadge })
  } catch (error) {
    console.error('[POST /api/ernaehrung/wasser]', error)
    return Response.json({ error: 'Wasserzähler konnte nicht aktualisiert werden.' }, { status: 500 })
  }
}
