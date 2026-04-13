// ─────────────────────────────────────────────────────────────────
// app/turniere/[id]/page.tsx
//
// Server Component – Turnier-Detailseite
// Lädt Turnier-Daten server-seitig und übergibt sie an den Client.
// ─────────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TurnierDetailClient from '@/components/turniere/TurnierDetailClient'
import type { TurnierDetail } from '@/app/api/turniere/[id]/route'
import type { TurnierFormat } from '@/lib/types/turnier'

// ── Metadata ─────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { id: string } },
): Promise<Metadata> {
  const { id } = params

  const tournament = await prisma.tournament.findFirst({
    where: { OR: [{ id }, { slug: id }], isPublished: true },
    select: { name: true, city: true, description: true },
  })

  if (!tournament) {
    return { title: 'Turnier nicht gefunden' }
  }

  return {
    title: `${tournament.name} – Turnier in ${tournament.city} | SportRise`,
    description:
      tournament.description?.slice(0, 155) ??
      `Turnier in ${tournament.city} auf SportRise.de – kostenlos, werbefrei.`,
  }
}

// ── Page ─────────────────────────────────────────────────────────

export default async function TurnierDetailPage(
  { params }: { params: { id: string } },
) {
  const session = await auth()
  const userId = session?.user?.id ?? null
  const isLoggedIn = userId !== null
  const { id } = params

  const tournament = await prisma.tournament.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isPublished: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      city: true,
      state: true,
      address: true,
      latitude: true,
      longitude: true,
      startDate: true,
      endDate: true,
      registrationDeadline: true,
      maxParticipants: true,
      entryFee: true,
      prizePool: true,
      level: true,
      status: true,
      coverUrl: true,
      details: true,
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
      entries: {
        take: 10,
        orderBy: { registeredAt: 'asc' },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              sports: {
                take: 1,
                orderBy: { createdAt: 'asc' },
                select: {
                  sport: { select: { slug: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!tournament) notFound()

  // Anmelde-Status
  let myEntry: TurnierDetail['myEntry'] = null
  let isRegistered = false

  if (userId !== null) {
    const entry = await prisma.tournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId } },
      select: { registeredAt: true, teamName: true, notes: true },
    })
    if (entry) {
      isRegistered = true
      myEntry = {
        registeredAt: entry.registeredAt.toISOString(),
        teamName: entry.teamName,
        notes: entry.notes,
      }
    }
  }

  // Details-JSON auslesen
  const details = tournament.details as Record<string, unknown> | null
  const format = (details?.format as TurnierFormat) ?? null
  const ageMin = (details?.ageMin as number) ?? null
  const ageMax = (details?.ageMax as number) ?? null
  const rules = (details?.rules as string) ?? null
  const contactInfo = (details?.contactInfo as string) ?? null

  const turnierDetail: TurnierDetail = {
    id: tournament.id,
    name: tournament.name,
    slug: tournament.slug,
    description: tournament.description,
    city: tournament.city,
    state: tournament.state,
    address: tournament.address,
    latitude: tournament.latitude,
    longitude: tournament.longitude,
    startDate: tournament.startDate.toISOString(),
    endDate: tournament.endDate.toISOString(),
    registrationDeadline: tournament.registrationDeadline?.toISOString() ?? null,
    maxParticipants: tournament.maxParticipants,
    currentParticipants: tournament._count.entries,
    entryFee: tournament.entryFee,
    prizePool: tournament.prizePool,
    level: tournament.level,
    status: tournament.status,
    coverUrl: tournament.coverUrl,
    format,
    ageMin,
    ageMax,
    rules,
    contactInfo,
    sport: tournament.sport,
    isRegistered,
    myEntry,
    participants: tournament.entries.map((e) => ({
      id: e.user.id,
      name: e.user.name,
      username: e.user.username,
      image: e.user.image,
      sportSlug: e.user.sports[0]?.sport.slug ?? null,
    })),
    isPublicParticipants: true,
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <TurnierDetailClient turnier={turnierDetail} isLoggedIn={isLoggedIn} />
    </main>
  )
}
