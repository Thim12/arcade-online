// ─────────────────────────────────────────────────────────────────
// app/api/vereine/ki-empfehlung/route.ts
//
// POST – KI-gestützte Vereinsempfehlung
//
// Auth:        Erforderlich (401 sonst)
// Rate-Limit:  5 Anfragen / Monat (AiUsageLog, type = 'verein')
// KI:          vereinAI.recommend() → Phase 1 algorithmisch + Phase 2 Claude (optional)
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { vereinAI } from '@/lib/ai/verein-ai'
import type { VereinPreferences } from '@/lib/ai/verein-ai'
import type { SportLevel } from '@/lib/types'
import type {
  KIEmpfehlungRequest,
  KIEmpfehlungResponse,
  KIVereinEmpfehlung,
  VereinListItem,
} from '@/lib/types/verein'

const MAX_MONTHLY_REQUESTS = 5

// Fußball-Liga → SportLevel Mapping
const FUSSBALL_LIGA_TO_LEVEL: Record<string, SportLevel> = {
  KREISLIGA_C: 'ANFAENGER',
  KREISLIGA_B: 'ANFAENGER',
  KREISLIGA_A: 'ANFAENGER',
  BEZIRKSLIGA: 'FORTGESCHRITTENE',
  LANDESLIGA: 'FORTGESCHRITTENE',
  VERBANDSLIGA: 'WETTKAMPF',
  OBERLIGA: 'WETTKAMPF',
  REGIONALLIGA: 'WETTKAMPF',
  DRITTE_LIGA: 'PROFI',
  ZWEITE_BUNDESLIGA: 'PROFI',
  BUNDESLIGA: 'PROFI',
}

// Basketball-Liga → SportLevel Mapping
const BASKETBALL_LIGA_TO_LEVEL: Record<string, SportLevel> = {
  KREISLIGA: 'ANFAENGER',
  BEZIRKSLIGA: 'ANFAENGER',
  LANDESLIGA: 'FORTGESCHRITTENE',
  VERBANDSLIGA: 'FORTGESCHRITTENE',
  OBERLIGA: 'FORTGESCHRITTENE',
  REGIONALLIGA: 'WETTKAMPF',
  DRITTE_LIGA: 'WETTKAMPF',
  PRO_B: 'PROFI',
  BEKO_BBL: 'PROFI',
  BUNDESLIGA: 'PROFI',
}

function tennisLkToLevel(lk: number | undefined): SportLevel {
  if (lk === undefined) return 'ANFAENGER'
  if (lk <= 2) return 'PROFI'
  if (lk <= 7) return 'WETTKAMPF'
  if (lk <= 14) return 'FORTGESCHRITTENE'
  return 'ANFAENGER'
}

function deriveUserLevel(body: KIEmpfehlungRequest): SportLevel {
  switch (body.sportSlug) {
    case 'fussball':
      return (body.fussballLiga !== undefined ? FUSSBALL_LIGA_TO_LEVEL[body.fussballLiga] : undefined) ?? 'ANFAENGER'
    case 'tennis':
      return tennisLkToLevel(body.lkValue)
    case 'basketball':
      return (body.basketballLiga !== undefined ? BASKETBALL_LIGA_TO_LEVEL[body.basketballLiga] : undefined) ?? 'ANFAENGER'
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }
  const userId = session.user.id

  // ── Rate-Limit: max 5 KI-Anfragen pro Kalendermonat ──────────
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const usageCount = await prisma.aiUsageLog.count({
    where: {
      userId,
      type: 'verein',
      createdAt: { gte: startOfMonth },
    },
  })

  if (usageCount >= MAX_MONTHLY_REQUESTS) {
    return NextResponse.json(
      { error: 'Monatliches Limit von 5 KI-Anfragen erreicht.', remainingMonthlyRequests: 0 },
      { status: 429 },
    )
  }

  // ── Request parsen ────────────────────────────────────────────
  const body = (await req.json()) as KIEmpfehlungRequest

  // Geburtsjahr aus Session-User falls verfügbar (nicht im Session-Token)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { birthYear: true },
  })

  const prefs: VereinPreferences = {
    sportSlug: body.sportSlug,
    userLatitude: body.userLat,
    userLongitude: body.userLon,
    userLevel: deriveUserLevel(body),
    monthlyBudgetEur: body.maxBudget,
    userBirthYear: dbUser?.birthYear ?? null,
  }

  // ── KI aufrufen (logUsage wird intern nach Phase-2 aufgerufen) ─
  const recommendations = await vereinAI.recommend(userId, prefs)

  if (recommendations.length === 0) {
    return NextResponse.json({
      recommendations: [],
      remainingMonthlyRequests: Math.max(0, MAX_MONTHLY_REQUESTS - usageCount),
    } satisfies KIEmpfehlungResponse)
  }

  // ── Volle VereinListItem-Daten für Top-3 laden ────────────────
  const vereinIds = recommendations.slice(0, 3).map((r) => r.vereinId)
  const vereineRaw = await prisma.verein.findMany({
    where: { id: { in: vereinIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      address: true,
      city: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      website: true,
      phone: true,
      logoUrl: true,
      monthlyFee: true,
      hasYouthTeam: true,
      ageMin: true,
      ageMax: true,
      isVerified: true,
      verifiedAt: true,
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
      _count: { select: { follows: true } },
    },
  })

  const vereinMap = new Map<string, VereinListItem>(
    vereineRaw.map((v) => [
      v.id,
      {
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
        verifiedAt: v.verifiedAt?.toISOString() ?? null,
        details: v.details as Record<string, unknown> | null,
        sport: v.sport,
        _followCount: v._count.follows,
        distanceKm: null,
      },
    ]),
  )

  // Empfehlungen mit Vereinsdaten anreichern (Reihenfolge nach Score beibehalten)
  const result: KIVereinEmpfehlung[] = recommendations
    .slice(0, 3)
    .filter((r) => vereinMap.has(r.vereinId))
    .map((r) => {
      const verein = vereinMap.get(r.vereinId)!
      return {
        verein: { ...verein, distanceKm: r.distanceKm },
        matchScore: r.score,
        personalizedReason: r.personalizedReason,
        keyBenefit: r.keyBenefit,
        nextStep: r.nextStep,
      }
    })

  return NextResponse.json({
    recommendations: result,
    remainingMonthlyRequests: Math.max(0, MAX_MONTHLY_REQUESTS - usageCount - 1),
  } satisfies KIEmpfehlungResponse)
}
