// ─────────────────────────────────────────────────────────────────
// app/api/vereine/route.ts – Vereinssuche API
//
// GET /api/vereine
// Query-Parameter:
//   sport, search, radiusKm, userLat, userLon,
//   priceCategories (kommasepariert), ageMin, ageMax,
//   onlyVerified, sort, page, limit
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, VereinStatus } from '@prisma/client'
import type {
  VereinListItem,
  VereinApiResponse,
  PriceCategory,
  SortOption,
} from '@/lib/types/verein'

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

// ── Preiskategorie-Logik ─────────────────────────────────────────
function matchesPrice(monthlyFee: number | null, categories: PriceCategory[]): boolean {
  if (categories.length === 0) return true
  return categories.some((cat) => {
    switch (cat) {
      case 'kostenlos':
        return monthlyFee === null || monthlyFee === 0
      case 'guenstig':
        return monthlyFee !== null && monthlyFee > 0 && monthlyFee < 30
      case 'mittel':
        return monthlyFee !== null && monthlyFee >= 30 && monthlyFee <= 60
      case 'premium':
        return monthlyFee !== null && monthlyFee > 60
    }
  })
}

// ── Route Handler ────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl

    const sport = searchParams.get('sport') ?? 'alle'
    const search = searchParams.get('search') ?? ''
    const radiusKm = parseFloat(searchParams.get('radiusKm') ?? '25')
    const userLat = searchParams.get('userLat') ? parseFloat(searchParams.get('userLat')!) : null
    const userLon = searchParams.get('userLon') ? parseFloat(searchParams.get('userLon')!) : null
    const priceCategoriesRaw = searchParams.get('priceCategories') ?? ''
    const priceCategories: PriceCategory[] = priceCategoriesRaw
      ? (priceCategoriesRaw.split(',').filter(Boolean) as PriceCategory[])
      : []
    const ageMin = parseInt(searchParams.get('ageMin') ?? '0', 10)
    const ageMax = parseInt(searchParams.get('ageMax') ?? '99', 10)
    const onlyVerified = searchParams.get('onlyVerified') === 'true'
    const sort = (searchParams.get('sort') ?? 'relevanz') as SortOption
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))

    // ── DB-Where Bedingungen ─────────────────────────────────────
    const andConditions: Prisma.VereinWhereInput[] = [
      { status: VereinStatus.VERIFIED },
    ]

    if (onlyVerified) {
      andConditions.push({ isVerified: true })
    }

    if (sport !== 'alle') {
      andConditions.push({ sport: { slug: sport } })
    }

    if (search.trim().length > 0) {
      andConditions.push({
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { city: { contains: search.trim(), mode: 'insensitive' } },
          { postalCode: { startsWith: search.trim() } },
        ],
      })
    }

    // Altersfilter: Verein-Altersbereich muss sich mit gesuchtem Bereich überschneiden
    if (ageMin > 0) {
      andConditions.push({
        OR: [{ ageMax: null }, { ageMax: { gte: ageMin } }],
      })
    }
    if (ageMax < 99) {
      andConditions.push({
        OR: [{ ageMin: null }, { ageMin: { lte: ageMax } }],
      })
    }

    // ── DB-Abfrage ───────────────────────────────────────────────
    const rawVereine = await prisma.verein.findMany({
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
          select: { follows: true },
        },
      },
      orderBy: sort === 'name' ? { name: 'asc' } : sort === 'neu' ? { createdAt: 'desc' } : undefined,
    })

    // ── Post-processing ──────────────────────────────────────────

    // Distanz berechnen + Radius-Filter
    type WithDistance = (typeof rawVereine)[number] & { distanceKm: number | null }
    let vereine: WithDistance[] = rawVereine.map((v) => {
      const distanceKm =
        userLat !== null && userLon !== null && v.latitude !== null && v.longitude !== null
          ? haversineKm(userLat, userLon, v.latitude, v.longitude)
          : null
      return { ...v, distanceKm }
    })

    // Radius-Filter nur wenn Standort bekannt
    if (userLat !== null && userLon !== null) {
      vereine = vereine.filter(
        (v) => v.distanceKm === null || v.distanceKm <= radiusKm,
      )
    }

    // Preis-Filter
    vereine = vereine.filter((v) => matchesPrice(v.monthlyFee, priceCategories))

    // Sortierung
    if (sort === 'entfernung') {
      vereine.sort((a, b) => {
        if (a.distanceKm === null && b.distanceKm === null) return 0
        if (a.distanceKm === null) return 1
        if (b.distanceKm === null) return -1
        return a.distanceKm - b.distanceKm
      })
    }
    // 'relevanz' und 'neu' wurden schon durch orderBy bzw. als Standardreihenfolge behandelt

    const total = vereine.length
    const offset = (page - 1) * limit
    const paginated = vereine.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    // ── Response mappen ──────────────────────────────────────────
    const result: VereinListItem[] = paginated.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      description: v.description,
      address: v.address,
      city: v.city,
      postalCode: v.postalCode,
      latitude: v.latitude,
      longitude: v.longitude,
      website: v.website,
      phone: v.phone,
      logoUrl: v.logoUrl,
      monthlyFee: v.monthlyFee,
      hasYouthTeam: v.hasYouthTeam,
      ageMin: v.ageMin,
      ageMax: v.ageMax,
      isVerified: v.isVerified,
      verifiedAt: v.verifiedAt ? v.verifiedAt.toISOString() : null,
      details: v.details as Record<string, unknown> | null,
      sport: {
        id: v.sport.id,
        name: v.sport.name,
        slug: v.sport.slug,
        colorPrimary: v.sport.colorPrimary,
        colorLight: v.sport.colorLight,
        colorGlow: v.sport.colorGlow,
        iconName: v.sport.iconName,
      },
      _followCount: v._count.follows,
      distanceKm: v.distanceKm,
    }))

    const response: VereinApiResponse = { vereine: result, total, hasMore }
    return NextResponse.json(response)
  } catch (error) {
    console.error('[api/vereine] Fehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 },
    )
  }
}
