// ─────────────────────────────────────────────────────────────────
// app/vereine/[id]/page.tsx – Vereins-Detailseite (Server Component)
//
// Route-Segment: /vereine/[slug]
// Sucht den Verein per Slug (oder ID) direkt via Prisma.
// Rendert weißen Sport-Hero + VereinDetailContent.
// ─────────────────────────────────────────────────────────────────

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ShieldCheck, MapPin } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { VereinDetailItem } from '@/lib/types/verein'
import { VereinDetailContent } from '@/components/vereine/VereinDetailContent'

// ── Hilfsfunktionen ───────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ── Seite ─────────────────────────────────────────────────────────

interface PageProps {
  params: { id: string }
}

export default async function VereinDetailPage({ params }: PageProps) {
  const [session, verein] = await Promise.all([
    auth(),
    prisma.verein.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
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
    }),
  ])

  if (!verein) notFound()

  const userId = session?.user?.id ?? null

  const [isMember, tournaments] = await Promise.all([
    userId !== null
      ? prisma.vereinFollow
          .findUnique({
            where: { userId_vereinId: { userId, vereinId: verein.id } },
            select: { id: true },
          })
          .then((r) => r !== null)
      : Promise.resolve(false),
    prisma.tournament.findMany({
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
    }),
  ])

  const vereinDetail: VereinDetailItem = {
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

  const { sport } = verein
  const initials = getInitials(verein.name)
  const heroGradient = `linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)`

  return (
    <div data-sport={sport.slug} className="min-h-screen bg-[#FAFAFA]">
      {/* ── Hero (260px) ───────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ height: 260, background: heroGradient }}
      >
        {/* Cover-Bild (12% opacity + Gradient-Overlay) */}
        {verein.coverUrl && (
          <Image
            src={verein.coverUrl}
            alt=""
            fill
            className="object-cover opacity-[0.05]"
            priority
          />
        )}
        {/* Fade to white */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />

        {/* Blur-Blob Atmosphäre */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: sport.colorPrimary }}
        />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between px-4 sm:px-6 py-5 max-w-4xl mx-auto">
          {/* Zurück-Link */}
          <Link
            href="/vereine"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Vereinssuche
          </Link>

          {/* Verein-Info */}
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl border-2 border-zinc-200 overflow-hidden shadow-lg flex-shrink-0">
              {verein.logoUrl ? (
                <Image
                  src={verein.logoUrl}
                  alt={verein.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: sport.colorPrimary }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Name + Stadt */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-zinc-900 leading-tight">{verein.name}</h1>
                {verein.isVerified && (
                  <ShieldCheck size={18} className="text-zinc-500 flex-shrink-0" aria-label="Verifizierter Verein" />
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-zinc-500 text-sm">
                <MapPin size={13} />
                <span>{verein.city}, {verein.postalCode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail-Inhalt (Client Component) ─────────────── */}
      <VereinDetailContent verein={vereinDetail} isLoggedIn={!!session} />
    </div>
  )
}
