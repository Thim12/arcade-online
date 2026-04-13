// ─────────────────────────────────────────────────────────────────
// app/ernaehrung/plan-erstellen/page.tsx – Server Component
//
// Lädt birthYear + monatlichen KI-Verbrauch und übergibt
// sie an den Client-Wizard.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ErnaehrungPlanClient } from './ErnaehrungPlanClient'

export const metadata = { title: 'Ernährungsplan erstellen – SportRise' }

export interface ErnaehrungPlanPageProps {
  birthYear: number | null
  usedThisMonth: number
}

export default async function ErnaehrungPlanPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { birthYear: true },
  })

  if (user === null) redirect('/login')

  // ── Monatsverbrauch für Nutrition-Pläne zählen ────────────────
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const usedThisMonth = await prisma.aiUsageLog.count({
    where: {
      userId,
      type: 'nutrition',
      createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
    },
  })

  return (
    <ErnaehrungPlanClient
      birthYear={user.birthYear}
      usedThisMonth={usedThisMonth}
    />
  )
}
