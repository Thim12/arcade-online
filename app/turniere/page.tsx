// ─────────────────────────────────────────────────────────────────
// app/turniere/page.tsx – Turniersuche Server Component
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TurnierSucheClient } from '@/components/turniere/TurnierSucheClient'

export const metadata: Metadata = {
  title: 'Turniersuche | SportRise',
  description:
    'Finde Turniere in deiner Nähe. Kostenlose, werbefreie Turniersuche für Jugendliche und Amateursportler in Deutschland.',
}

export default async function TurniereSeite() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  let primarySport: string | null = null
  let userBirthYear: number | null = null

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        birthYear: true,
        sports: {
          include: { sport: { select: { slug: true } } },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })
    if (dbUser) {
      userBirthYear = dbUser.birthYear
      primarySport = dbUser.sports[0]?.sport.slug ?? null
    }
  }

  return (
    <TurnierSucheClient
      isLoggedIn={isLoggedIn}
      primarySport={primarySport}
      userBirthYear={userBirthYear}
    />
  )
}
