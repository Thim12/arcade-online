// ─────────────────────────────────────────────────────────────────
// app/training/erstellen/page.tsx – Server Component
//
// Lädt Nutzerdaten (Sportarten, Gym-Zugang) und übergibt sie
// an den Client-Wizard.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ErstellenClient } from './ErstellenClient'
import type { SportSlug } from '@/lib/sport-profiles'
import type { SportLevel, UserGoal } from '@prisma/client'

export const metadata = { title: 'Trainingsplan erstellen – SportRise' }

// ── Typen die an den Client weitergegeben werden ──────────────────

export interface UserSportForWizard {
  slug: SportSlug
  name: string
  colorPrimary: string
  colorGlow: string
  level: SportLevel
  goals: UserGoal[]
  equipment: string[]
}

export interface ErstellenPageProps {
  userSports: UserSportForWizard[]
  gymAccessEnabled: boolean
  birthYear: number | null
  primarySportSlug: string | null
  usedThisMonth: number
}

const SPORT_NAMES: Record<string, string> = {
  fussball:   'Fußball',
  tennis:     'Tennis',
  basketball: 'Basketball',
}

export default async function ErstellenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // ── User + Sportarten laden ───────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gymAccessEnabled: true,
      birthYear: true,
      sports: {
        include: {
          sport: {
            select: { slug: true, colorPrimary: true, colorGlow: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (user === null) redirect('/login')

  // ── Monatsverbrauch laden ─────────────────────────────────────
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const usedThisMonth = await prisma.aiUsageLog.count({
    where: {
      userId,
      type: 'training',
      createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
    },
  })

  // ── UserSports für Wizard aufbereiten ─────────────────────────
  const userSports: UserSportForWizard[] = user.sports.map((us) => {
    const slug = us.sport.slug as SportSlug

    const details = us.details as Record<string, unknown> | null

    const equipment: string[] = Array.isArray(details?.['heimbedarf'])
      ? (details['heimbedarf'] as string[])
      : []

    const goals: UserGoal[] = (us.goals ?? []) as UserGoal[]

    return {
      slug,
      name: SPORT_NAMES[slug] ?? slug,
      colorPrimary: us.sport.colorPrimary,
      colorGlow: us.sport.colorGlow,
      level: us.level,
      goals,
      equipment,
    }
  })

  return (
    <ErstellenClient
      userSports={userSports}
      gymAccessEnabled={user.gymAccessEnabled}
      birthYear={user.birthYear}
      primarySportSlug={session.user.primarySport}
      usedThisMonth={usedThisMonth}
    />
  )
}
