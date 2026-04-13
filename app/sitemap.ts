// ─────────────────────────────────────────────────────────────────
// app/sitemap.ts – Automatisch generierte Sitemap
//
// Enthält statische Routen mit festgelegten Prioritäten sowie
// dynamische Routen für verifizierte Vereine und veröffentlichte
// Turniere aus der Datenbank.
//
// DB-Fehler beim Build werden abgefangen — die statischen Routen
// werden immer ausgespielt, auch wenn die DB nicht erreichbar ist.
// ─────────────────────────────────────────────────────────────────

import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportrise.de'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // ── Statische Routen ─────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
      lastModified: now,
    },
    {
      url: `${BASE_URL}/vereine`,
      changeFrequency: 'daily',
      priority: 0.9,
      lastModified: now,
    },
    {
      url: `${BASE_URL}/turniere`,
      changeFrequency: 'daily',
      priority: 0.9,
      lastModified: now,
    },
    {
      url: `${BASE_URL}/ueber-uns`,
      changeFrequency: 'monthly',
      priority: 0.7,
      lastModified: now,
    },
    {
      url: `${BASE_URL}/faq`,
      changeFrequency: 'monthly',
      priority: 0.7,
      lastModified: now,
    },
    {
      url: `${BASE_URL}/datenschutz`,
      changeFrequency: 'yearly',
      priority: 0.3,
      lastModified: now,
    },
    {
      url: `${BASE_URL}/impressum`,
      changeFrequency: 'yearly',
      priority: 0.3,
      lastModified: now,
    },
    {
      url: `${BASE_URL}/agb`,
      changeFrequency: 'yearly',
      priority: 0.3,
      lastModified: now,
    },
  ]

  // ── Dynamische Routen: verifizierte Vereine ───────────────────
  let vereineRoutes: MetadataRoute.Sitemap = []
  try {
    const vereine = await prisma.verein.findMany({
      where: { status: 'VERIFIED' },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })

    vereineRoutes = vereine.map((v) => ({
      url: `${BASE_URL}/vereine/${v.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      lastModified: v.updatedAt,
    }))
  } catch {
    // DB beim Sitemap-Build nicht erreichbar → nur statische Routen
    // Das darf den Build nicht abbrechen.
  }

  // ── Dynamische Routen: öffentliche Turniere ───────────────────
  let turnierRoutes: MetadataRoute.Sitemap = []
  try {
    const turniere = await prisma.tournament.findMany({
      where: {
        status: {
          in: ['PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING'],
        },
      },
      select: { id: true, updatedAt: true, status: true },
      orderBy: { updatedAt: 'desc' },
    })

    turnierRoutes = turniere.map((t) => ({
      url: `${BASE_URL}/turniere/${t.id}`,
      // Aktive Turniere öfter crawlen als geschlossene
      changeFrequency: (
        t.status === 'ONGOING' || t.status === 'REGISTRATION_OPEN'
          ? 'daily'
          : 'weekly'
      ) as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: t.status === 'ONGOING' ? 0.8 : 0.7,
      lastModified: t.updatedAt,
    }))
  } catch {
    // DB beim Sitemap-Build nicht erreichbar → nur statische Routen
  }

  return [...staticRoutes, ...vereineRoutes, ...turnierRoutes]
}
