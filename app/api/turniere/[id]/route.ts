// ─────────────────────────────────────────────────────────────────
// app/api/turniere/[id]/route.ts
//
// GET – Turnier-Detailseite
//
// Suche nach ID oder Slug.
// Gibt TurnierDetail zurück inkl. Anmelde-Status wenn eingeloggt.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { TurnierFormat } from '@/lib/types/turnier'

// ── Response-Typen ───────────────────────────────────────────────

export interface TurnierDetailSport {
  id: string
  name: string
  slug: string
  colorPrimary: string
  colorLight: string
  colorGlow: string
  iconName: string
}

export interface TurnierDetailParticipant {
  id: string
  name: string | null
  username: string | null
  image: string | null
  sportSlug: string | null
}

export interface TurnierDetailEntry {
  registeredAt: string
  teamName: string | null
  notes: string | null
}

export interface TurnierDetail {
  id: string
  name: string
  slug: string
  description: string | null
  city: string
  state: string
  address: string | null
  latitude: number | null
  longitude: number | null
  startDate: string
  endDate: string
  registrationDeadline: string | null
  maxParticipants: number | null
  currentParticipants: number
  entryFee: number | null
  prizePool: number | null
  level: string
  status: string
  coverUrl: string | null
  format: TurnierFormat | null
  ageMin: number | null
  ageMax: number | null
  rules: string | null
  contactInfo: string | null
  sport: TurnierDetailSport
  isRegistered: boolean
  myEntry: TurnierDetailEntry | null
  participants: TurnierDetailParticipant[]
  isPublicParticipants: boolean
}

// ── GET ──────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth()
  const userId = session?.user?.id ?? null
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

  if (!tournament) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 })
  }

  // Anmelde-Status (nur wenn eingeloggt)
  let myEntry: TurnierDetailEntry | null = null
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

  const participants: TurnierDetailParticipant[] = tournament.entries.map((e) => ({
    id: e.user.id,
    name: e.user.name,
    username: e.user.username,
    image: e.user.image,
    sportSlug: e.user.sports[0]?.sport.slug ?? null,
  }))

  const result: TurnierDetail = {
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
    participants,
    isPublicParticipants: true,
  }

  return NextResponse.json(result)
}
