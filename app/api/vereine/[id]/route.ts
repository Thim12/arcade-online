// ─────────────────────────────────────────────────────────────────
// app/api/vereine/[id]/route.ts
//
// GET – Vereins-Detailseite
//
// Suche nach ID oder Slug.
// Gibt VereinDetailItem zurück (alle VereinListItem-Felder
// + coverUrl, followCount, isMember, tournaments).
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { VereinDetailItem } from '@/lib/types/verein'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const session = await auth()
  const userId = session?.user?.id ?? null
  const { id } = params

  const verein = await prisma.verein.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      status: 'VERIFIED',
    },
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
      coverUrl: true,
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

  if (!verein) {
    return NextResponse.json({ error: 'Verein nicht gefunden' }, { status: 404 })
  }

  // Mitgliedschaft prüfen (nur wenn eingeloggt)
  const isMember =
    userId !== null
      ? (await prisma.vereinFollow.findUnique({
          where: { userId_vereinId: { userId, vereinId: verein.id } },
          select: { id: true },
        })) !== null
      : false

  // Kommende Turniere derselben Sportart (max 3)
  const tournaments = await prisma.tournament.findMany({
    where: {
      sportId: verein.sport.id,
      startDate: { gte: new Date() },
      isPublished: true,
    },
    orderBy: { startDate: 'asc' },
    take: 3,
    select: {
      id: true,
      name: true,
      startDate: true,
      city: true,
      level: true,
      entryFee: true,
    },
  })

  const result: VereinDetailItem = {
    id: verein.id,
    name: verein.name,
    slug: verein.slug,
    description: verein.description,
    address: verein.address,
    city: verein.city,
    postalCode: verein.postalCode,
    latitude: verein.latitude,
    longitude: verein.longitude,
    website: verein.website,
    phone: verein.phone,
    logoUrl: verein.logoUrl,
    coverUrl: verein.coverUrl,
    monthlyFee: verein.monthlyFee,
    hasYouthTeam: verein.hasYouthTeam,
    ageMin: verein.ageMin,
    ageMax: verein.ageMax,
    isVerified: verein.isVerified,
    verifiedAt: verein.verifiedAt?.toISOString() ?? null,
    details: verein.details as Record<string, unknown> | null,
    sport: verein.sport,
    _followCount: verein._count.follows,
    distanceKm: null,
    followCount: verein._count.follows,
    isMember,
    tournaments: tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate.toISOString(),
      city: t.city,
      level: t.level,
      entryFee: t.entryFee,
    })),
  }

  return NextResponse.json(result)
}
