// ─────────────────────────────────────────────────────────────────
// app/turniere/meine/page.tsx
//
// Server Component – Meine Turniere (Auth required)
// Lädt alle Turnier-Einträge des Users und splittet in upcoming/vergangen.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import MeineTurniereClient, { type MeinTurniereEntry } from '@/components/turniere/MeineTurniereClient'
import type { TurnierFormat } from '@/lib/types/turnier'

export const metadata: Metadata = {
  title: 'Meine Turniere | SportRise',
  description: 'Deine Turnier-Anmeldungen auf SportRise.de.',
}

export default async function MeineTurnierePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/anmelden')

  const userId = session.user.id
  const now = new Date()

  const rawEntries = await prisma.tournamentEntry.findMany({
    where: { userId },
    orderBy: { tournament: { startDate: 'asc' } },
    select: {
      id: true,
      registeredAt: true,
      tournament: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          startDate: true,
          endDate: true,
          details: true,
          level: true,
          entryFee: true,
          maxParticipants: true,
          sport: {
            select: {
              id: true,
              name: true,
              slug: true,
              colorPrimary: true,
              colorLight: true,
              colorGlow: true,
              iconName: true,
            },
          },
          _count: { select: { entries: true } },
        },
      },
    },
  })

  const upcoming: MeinTurniereEntry[] = []
  const vergangen: MeinTurniereEntry[] = []

  for (const raw of rawEntries) {
    const { tournament } = raw
    const details = tournament.details as Record<string, unknown> | null
    const format = (details?.format as TurnierFormat) ?? null

    const entry: MeinTurniereEntry = {
      entryId: raw.id,
      registeredAt: raw.registeredAt.toISOString(),
      tournament: {
        id: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
        city: tournament.city,
        startDate: tournament.startDate.toISOString(),
        endDate: tournament.endDate.toISOString(),
        format,
        level: tournament.level,
        entryFee: tournament.entryFee,
        maxParticipants: tournament.maxParticipants,
        currentParticipants: tournament._count.entries,
        sport: tournament.sport,
      },
    }

    if (tournament.startDate >= now) {
      upcoming.push(entry)
    } else {
      vergangen.push(entry)
    }
  }

  // Vergangen in umgekehrter Reihenfolge (neueste zuerst)
  vergangen.reverse()

  return (
    <main>
      <MeineTurniereClient upcoming={upcoming} vergangen={vergangen} />
    </main>
  )
}
