// ─────────────────────────────────────────────────────────────────
// app/api/turniere/route.ts – Turniersuche API
//
// GET /api/turniere
// Query-Parameter:
//   sport, dateFrom, dateTo, ageMin, ageMax, format (kommasepariert),
//   maxFee (kostenlos|unter_10|unter_25|beliebig), radius, userLat,
//   userLon, verified, freeSpots, sort, page, limit
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma, TournamentStatus } from '@prisma/client'
import type {
  TurnierListItem,
  TurnierApiResponse,
  TurnierFormat,
  TurnierFeeFilter,
  TurnierSortOption,
  TurnierDetails,
} from '@/lib/types/turnier'

// ── Haversine ────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Eintrittsgeld-Filter ─────────────────────────────────────────
function matchesFee(entryFee: number | null, filter: TurnierFeeFilter): boolean {
  switch (filter) {
    case 'kostenlos':
      return entryFee === null || entryFee === 0
    case 'unter_10':
      return entryFee === null || entryFee < 10
    case 'unter_25':
      return entryFee === null || entryFee < 25
    case 'beliebig':
      return true
  }
}

// ── Route Handler ────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    const userId = session?.user?.id ?? null

    const { searchParams } = req.nextUrl

    const sport = searchParams.get('sport') ?? 'alle'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const ageMin = parseInt(searchParams.get('ageMin') ?? '0', 10)
    const ageMax = parseInt(searchParams.get('ageMax') ?? '99', 10)
    const formatsRaw = searchParams.get('format') ?? ''
    const formats: TurnierFormat[] = formatsRaw
      ? (formatsRaw.split(',').filter(Boolean) as TurnierFormat[])
      : []
    const fee = (searchParams.get('maxFee') ?? 'beliebig') as TurnierFeeFilter
    const radius = parseFloat(searchParams.get('radius') ?? '50')
    const userLat = searchParams.get('userLat') ? parseFloat(searchParams.get('userLat')!) : null
    const userLon = searchParams.get('userLon') ? parseFloat(searchParams.get('userLon')!) : null
    const onlyVerified = searchParams.get('verified') === 'true'
    const onlyFreeSpots = searchParams.get('freeSpots') === 'true'
    const sort = (searchParams.get('sort') ?? 'datum') as TurnierSortOption
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

    // ── DB-Where Bedingungen ─────────────────────────────────────
    const allowedStatuses: TournamentStatus[] = onlyVerified
      ? [TournamentStatus.REGISTRATION_OPEN]
      : [
          TournamentStatus.PUBLISHED,
          TournamentStatus.REGISTRATION_OPEN,
          TournamentStatus.REGISTRATION_CLOSED,
          TournamentStatus.ONGOING,
        ]

    const andConditions: Prisma.TournamentWhereInput[] = [
      { isPublished: true },
      { status: { in: allowedStatuses } },
    ]

    // Datum-Filter
    const now = new Date()
    if (!dateFrom) {
      andConditions.push({ endDate: { gte: now } })
    } else {
      andConditions.push({ endDate: { gte: new Date(dateFrom) } })
    }
    if (dateTo) {
      andConditions.push({ startDate: { lte: new Date(dateTo) } })
    }

    // Sport-Filter
    if (sport !== 'alle') {
      andConditions.push({ sport: { slug: sport } })
    }

    // ── DB-Abfrage ───────────────────────────────────────────────
    const orderBy: Prisma.TournamentOrderByWithRelationInput =
      sort === 'name' ? { name: 'asc' } :
      sort === 'neu' ? { createdAt: 'desc' } :
      { startDate: 'asc' }

    const rawTurniere = await prisma.tournament.findMany({
      where: { AND: andConditions },
      include: {
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
        _count: {
          select: { entries: true },
        },
      },
      orderBy,
    })

    // ── Post-processing ──────────────────────────────────────────

    type WithExtra = (typeof rawTurniere)[number] & {
      distanceKm: number | null
      format: TurnierFormat | null
      detailAgeMin: number | null
      detailAgeMax: number | null
    }

    let turniere: WithExtra[] = rawTurniere.map((t) => {
      const details = t.details as TurnierDetails | null
      const distanceKm =
        userLat !== null && userLon !== null && t.latitude !== null && t.longitude !== null
          ? haversineKm(userLat, userLon, t.latitude, t.longitude)
          : null
      return {
        ...t,
        distanceKm,
        format: details?.format ?? null,
        detailAgeMin: details?.ageMin ?? null,
        detailAgeMax: details?.ageMax ?? null,
      }
    })

    // Radius-Filter
    if (userLat !== null && userLon !== null) {
      turniere = turniere.filter(
        (t) => t.distanceKm === null || t.distanceKm <= radius,
      )
    }

    // Gebühren-Filter
    turniere = turniere.filter((t) => matchesFee(t.entryFee, fee))

    // Format-Filter (aus details JSON)
    if (formats.length > 0) {
      turniere = turniere.filter((t) => t.format !== null && formats.includes(t.format))
    }

    // Alters-Filter (aus details JSON, mit Fallback auf keine Einschränkung)
    if (ageMin > 0) {
      turniere = turniere.filter(
        (t) => t.detailAgeMax === null || t.detailAgeMax >= ageMin,
      )
    }
    if (ageMax < 99) {
      turniere = turniere.filter(
        (t) => t.detailAgeMin === null || t.detailAgeMin <= ageMax,
      )
    }

    // Nur freie Plätze
    if (onlyFreeSpots) {
      turniere = turniere.filter(
        (t) => t.maxParticipants === null || t._count.entries < t.maxParticipants,
      )
    }

    // Sortierung nach Entfernung (post-processing, da Haversine in JS)
    if (sort === 'entfernung') {
      turniere.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0
        if (a.distanceKm === null) return 1
        if (b.distanceKm === null) return -1
        return a.distanceKm - b.distanceKm
      })
    }

    const total = turniere.length
    const offset = (page - 1) * limit
    const paginated = turniere.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    // ── isRegistered nach Pagination ─────────────────────────────
    let registeredIds = new Set<string>()
    if (userId && paginated.length > 0) {
      const entries = await prisma.tournamentEntry.findMany({
        where: {
          userId,
          tournamentId: { in: paginated.map((t) => t.id) },
        },
        select: { tournamentId: true },
      })
      registeredIds = new Set(entries.map((e) => e.tournamentId))
    }

    // ── Response mappen ──────────────────────────────────────────
    const result: TurnierListItem[] = paginated.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      city: t.city,
      state: t.state,
      address: t.address,
      latitude: t.latitude,
      longitude: t.longitude,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      registrationDeadline: t.registrationDeadline ? t.registrationDeadline.toISOString() : null,
      maxParticipants: t.maxParticipants,
      currentParticipants: t._count.entries,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      level: t.level,
      status: t.status,
      coverUrl: t.coverUrl,
      format: t.format,
      ageMin: t.detailAgeMin,
      ageMax: t.detailAgeMax,
      sport: {
        id: t.sport.id,
        name: t.sport.name,
        slug: t.sport.slug,
        colorPrimary: t.sport.colorPrimary,
        colorLight: t.sport.colorLight,
        colorGlow: t.sport.colorGlow,
        iconName: t.sport.iconName,
      },
      isRegistered: registeredIds.has(t.id),
      distanceKm: t.distanceKm,
    }))

    const response: TurnierApiResponse = { turniere: result, total, hasMore }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[api/turniere] Fehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 },
    )
  }
}
