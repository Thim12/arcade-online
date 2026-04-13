// ─────────────────────────────────────────────────────────────────
// app/dashboard/ki-trainer/page.tsx – KI-Trainer (Server Component)
//
// Lädt Nutzerdaten, aktiven Plan und Rate-Limit-Status
// und gibt alles an KiTrainerClient weiter.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { KiTrainerClient } from './KiTrainerClient'
import type { SportLevel, UserGoal } from '@prisma/client'

// ── Typen ──────────────────────────────────────────────────────────

export interface ActivePlanPreview {
  id:             string
  title:          string
  durationWeeks:  number
  sessionsPerWeek: number
  createdAt:      string  // ISO-String
}

export interface KiTrainerPageData {
  primarySport:    string | null
  level:           SportLevel
  goals:           UserGoal[]
  usedThisMonth:   number
  monthlyLimit:    number
  resetDate:       string  // ISO-String (erster des nächsten Monats)
  activePlan:      ActivePlanPreview | null
}

// ── Page Component ─────────────────────────────────────────────────

export default async function KiTrainerPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/registrieren')

  const userId = session.user.id
  const now    = new Date()

  const firstOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // Parallele DB-Abfragen
  const [userSport, usedCount, activePlan] = await Promise.all([
    prisma.userSport.findFirst({
      where:  { userId, sport: { slug: session.user.primarySport ?? '' } },
      select: { level: true, goals: true },
    }),
    prisma.aiUsageLog.count({
      where: {
        userId,
        type:      'training',
        createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
      },
    }),
    prisma.trainingPlan.findFirst({
      where:   { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select:  {
        id:             true,
        title:          true,
        durationWeeks:  true,
        sessionsPerWeek: true,
        createdAt:      true,
      },
    }),
  ])

  const data: KiTrainerPageData = {
    primarySport:  session.user.primarySport ?? null,
    level:         userSport?.level ?? 'ANFAENGER',
    goals:         userSport?.goals ?? ['FREIZEITSPORT'],
    usedThisMonth: usedCount,
    monthlyLimit:  3,
    resetDate:     firstOfNextMonth.toISOString(),
    activePlan:    activePlan
      ? {
          id:             activePlan.id,
          title:          activePlan.title,
          durationWeeks:  activePlan.durationWeeks,
          sessionsPerWeek: activePlan.sessionsPerWeek,
          createdAt:      activePlan.createdAt.toISOString(),
        }
      : null,
  }

  return <KiTrainerClient data={data} />
}
