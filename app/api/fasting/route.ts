// ─────────────────────────────────────────────────────────────────
// POST /api/fasting – Start / Stop Fasting Sessions
// GET  /api/fasting – Aktive Session + History laden
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const StartSchema = z.object({
  action: z.literal('start'),
  fastingType: z.enum(['F16_8', 'F18_6', 'F20_4', 'F24', 'CUSTOM']),
  targetDurationHours: z.number().int().min(1).max(72),
})

const StopSchema = z.object({
  action: z.literal('stop'),
  fastingLogId: z.string().min(1),
})

const ActionSchema = z.discriminatedUnion('action', [StartSchema, StopSchema])

function serializeFast(f: {
  id: string
  startTime: Date
  endTime: Date | null
  targetDurationHours: number
  fastingType: string
  status: string
}) {
  return {
    id: f.id,
    startTime: f.startTime.toISOString(),
    endTime: f.endTime ? f.endTime.toISOString() : null,
    targetDurationHours: f.targetDurationHours,
    fastingType: f.fastingType,
    status: f.status,
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = ActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Daten', details: parsed.error.flatten() }, { status: 400 })
    }

    const userId = session.user.id

    if (parsed.data.action === 'start') {
      // Prüfe ob bereits ein aktives Fasten existiert
      const existing = await prisma.fastingLog.findFirst({
        where: { userId, status: 'ACTIVE' },
      })

      if (existing) {
        return NextResponse.json({ error: 'Es läuft bereits ein aktives Fasten.' }, { status: 409 })
      }

      const fast = await prisma.fastingLog.create({
        data: {
          userId,
          startTime: new Date(),
          targetDurationHours: parsed.data.targetDurationHours,
          fastingType: parsed.data.fastingType as 'F16_8' | 'F18_6' | 'F20_4' | 'F24' | 'CUSTOM',
          status: 'ACTIVE',
        },
      })

      return NextResponse.json({ fast: serializeFast(fast) })
    }

    // action === 'stop'
    const fast = await prisma.fastingLog.findFirst({
      where: { id: parsed.data.fastingLogId, userId },
    })

    if (!fast || fast.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Kein aktives Fasten gefunden.' }, { status: 404 })
    }

    const endTime = new Date()
    const elapsedHours =
      (endTime.getTime() - fast.startTime.getTime()) / 3600000

    // Wenn >= 90% der Zielzeit erreicht → COMPLETED, sonst FAILED
    const isCompleted = elapsedHours >= fast.targetDurationHours * 0.9
    const status = isCompleted ? 'COMPLETED' : 'FAILED'

    const updated = await prisma.fastingLog.update({
      where: { id: fast.id },
      data: {
        endTime,
        status: status as 'COMPLETED' | 'FAILED',
      },
    })

    return NextResponse.json({ fast: serializeFast(updated) })
  } catch (error) {
    console.error('[POST /api/fasting]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const userId = session.user.id
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [activeFast, history] = await Promise.all([
      prisma.fastingLog.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { startTime: 'desc' },
      }),
      prisma.fastingLog.findMany({
        where: { userId, startTime: { gte: sevenDaysAgo } },
        orderBy: { startTime: 'desc' },
        take: 14,
      }),
    ])

    return NextResponse.json({
      activeFast: activeFast ? serializeFast(activeFast) : null,
      history: history.map(serializeFast),
    })
  } catch (error) {
    console.error('[GET /api/fasting]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
