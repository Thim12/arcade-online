// ─────────────────────────────────────────────────────────────────
// /app/dashboard/ernaehrung/fasten/page.tsx – Intervallfasten
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FastingClient } from '@/app/dashboard/fasting/FastingClient'

export const metadata = {
  title: 'Intervallfasten | SportRise',
  description: 'Tracke deine Fastenperioden und verbessere deine Gesundheit.',
}

export default async function FastenPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [activeFast, recentFasts] = await Promise.all([
    prisma.fastingLog.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        targetDurationHours: true,
        fastingType: true,
        status: true,
      },
    }),
    prisma.fastingLog.findMany({
      where: {
        userId,
        startTime: { gte: sevenDaysAgo },
      },
      orderBy: { startTime: 'desc' },
      take: 14,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        targetDurationHours: true,
        fastingType: true,
        status: true,
      },
    }),
  ])

  const serializeDate = (d: Date | null) => (d ? d.toISOString() : null)

  const serializedActive = activeFast
    ? {
        id: activeFast.id,
        startTime: activeFast.startTime.toISOString(),
        endTime: serializeDate(activeFast.endTime),
        targetDurationHours: activeFast.targetDurationHours,
        fastingType: activeFast.fastingType,
        status: activeFast.status,
      }
    : null

  const serializedRecent = recentFasts.map((f) => ({
    id: f.id,
    startTime: f.startTime.toISOString(),
    endTime: serializeDate(f.endTime),
    targetDurationHours: f.targetDurationHours,
    fastingType: f.fastingType,
    status: f.status,
  }))

  return (
    <FastingClient
      initialActiveFast={serializedActive}
      initialRecentFasts={serializedRecent}
    />
  )
}
