// ─────────────────────────────────────────────────────────────────
// app/api/cron/turnier-check/route.ts
//
// GET /api/cron/turnier-check
// Vercel Cron Job – täglich 08:00 Uhr
// Ruft turnierAI.runDailyCheck(prisma) auf und erstellt
// Reminder-Notifications für passende User.
// Gesichert via CRON_SECRET Header.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { turnierAI } from '@/lib/ai/turnier-ai'

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Authentifizierung via CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await turnierAI.runDailyCheck(prisma)

    console.log(
      `TurnierKI: ${result.notificationsCreated} Notifications für ${result.usersChecked} User erstellt.`,
    )

    return NextResponse.json({
      success: true,
      notificationsCreated: result.notificationsCreated,
      tournamentsChecked: result.tournamentsChecked,
      usersChecked: result.usersChecked,
    })
  } catch (err) {
    console.error('[cron/turnier-check] Fehler:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 },
    )
  }
}
