// ─────────────────────────────────────────────────────────────────
// app/page.tsx – SportRise.de Startseite
//
// Server Component.
// Kein PageLayout-Wrapper: Navbar ist transparent auf der Homepage
// (Logik bereits in Navbar.tsx via pathname === '/').
//
// Aufbau:
//   <Navbar /> (transparent, wechselt bei Scroll > 60px zu weiß)
//   <main>
//     <HeroSection />              Vollbild-Hero mit Stagger-Animationen
//     <TickerSection />            Live-Aktivitäts-Ticker
//     <FeaturesSection />          "Alles inklusive" Feature-Grid (dunkel)
//     <SportartenSection />        Fußball / Tennis / Basketball Karten
//     <WieEsFunktioniertSection /> 3 Schritte, alternierend L/R
//     <GamificationSection />      XP-Balken + Badge-Grid (dunkel)
//     <TestimonialsSection />      3 Nutzer-Zitate
//     <FinalCtaSection />          Grüner Abschluss-CTA
//   </main>
//   <Footer />
//
// Daten: Promise.all für parallele DB-Abfragen, try/catch für
// graceful Degradation bei DB-Ausfall (zeigt Fallback-Daten).
//
// ISR: revalidate = 300 s (5 Minuten)
// ─────────────────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/home/HeroSection'
import TickerSection from '@/components/home/TickerSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import SportartenSection from '@/components/home/SportartenSection'
import WieEsFunktioniertSection from '@/components/home/WieEsFunktioniertSection'
import GamificationSection from '@/components/home/GamificationSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import FinalCtaSection from '@/components/home/FinalCtaSection'

// ── ISR ───────────────────────────────────────────────────────────

export const revalidate = 300

// ── Typen ─────────────────────────────────────────────────────────

interface TickerItem {
  id: string
  text: string
}

interface BadgePreview {
  id: string
  name: string
  rarity: string
}

interface SportCount {
  slug: string
  vereinCount: number
  tournamentCount: number
}

interface GamificationBadge {
  id: string
  name: string
  iconName: string
  rarity: string
  isSecret: boolean
}

interface HomeData {
  userCount: number
  vereinCount: number
  tickerItems: TickerItem[]
  featureBadges: BadgePreview[]
  sportCounts: SportCount[]
  gamificationBadges: GamificationBadge[]
}

// ── Fallback-Ticker (DB leer oder nicht erreichbar) ───────────────

const FALLBACK_TICKER: TickerItem[] = [
  { id: 'f01', text: 'Lukas aus Frankfurt — 45 Min. Fußball-Training absolviert' },
  { id: 'f02', text: 'Anna aus Wiesbaden folgt jetzt dem TSV Einheit Frankfurt' },
  { id: 'f03', text: 'Max hat das Abzeichen "Erster Schritt" erhalten' },
  { id: 'f04', text: 'Jonas aus Kassel — 60 Min. Basketball-Training absolviert' },
  { id: 'f05', text: 'Sarah folgt jetzt dem TC Rot-Weiß Kassel' },
  { id: 'f06', text: 'Tim hat das Abzeichen "7 Tage am Stück" erhalten' },
  { id: 'f07', text: 'Felix aus Darmstadt — 30 Min. Tennis-Training absolviert' },
  { id: 'f08', text: 'Laura aus Fulda folgt jetzt dem VfB 1900 Gießen' },
  { id: 'f09', text: 'Marco aus Gießen — 50 Min. Fußball-Training absolviert' },
  { id: 'f10', text: 'Nina hat das Abzeichen "Durchstarter" erhalten' },
]

// ── Daten-Abfrage ─────────────────────────────────────────────────

async function getHomeData(): Promise<HomeData> {
  try {
    const [
      userCount,
      vereinCount,
      recentSessions,
      recentFollows,
      recentBadgeEarns,
      sports,
      allBadges,
    ] = await Promise.all([
      // Gesamtzahl registrierter Sportler
      prisma.user.count(),

      // Nur verifizierte Vereine zählen
      prisma.verein.count({ where: { isVerified: true } }),

      // Letzte 15 abgeschlossene Trainingseinheiten mit Sportart
      prisma.trainingSession.findMany({
        take: 15,
        orderBy: { completedAt: 'desc' },
        where: { planId: { not: null } },
        include: {
          user: { select: { name: true, city: true } },
          plan: { select: { sport: { select: { name: true } } } },
        },
      }),

      // Letzte 15 Verein-Follows
      prisma.vereinFollow.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          verein: { select: { name: true } },
        },
      }),

      // Letzte 15 Abzeichen-Verleihungen (keine Secrets im Ticker)
      prisma.userBadge.findMany({
        take: 15,
        orderBy: { earnedAt: 'desc' },
        where: { badge: { isSecret: false } },
        include: {
          user: { select: { name: true } },
          badge: { select: { name: true } },
        },
      }),

      // Aktive Sportarten mit Vereins- und Turnier-Counts
      prisma.sport.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          slug: true,
          _count: {
            select: {
              vereine: true,
              tournaments: true,
            },
          },
        },
      }),

      // Bis zu 12 Abzeichen (public + secret) für Feature- & Gamification-Sektion
      prisma.badge.findMany({
        take: 12,
        orderBy: [{ rarity: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          name: true,
          rarity: true,
          iconName: true,
          isSecret: true,
        },
      }),
    ])

    // Ticker-Items aus Echtzeit-Aktivitäten aufbauen
    const liveItems: TickerItem[] = [
      ...recentSessions.map((s) => ({
        id: `ts-${s.id}`,
        text: `${s.user.name ?? 'Ein Sportler'}${
          s.user.city ? ` aus ${s.user.city}` : ''
        } — ${s.durationMin} Min. ${s.plan?.sport.name ?? 'Sport'}-Training`,
      })),
      ...recentFollows.map((f) => ({
        id: `vf-${f.id}`,
        text: `${f.user.name ?? 'Jemand'} folgt jetzt ${f.verein.name}`,
      })),
      ...recentBadgeEarns.map((b) => ({
        id: `ub-${b.id}`,
        text: `${b.user.name ?? 'Jemand'} hat das Abzeichen "${b.badge.name}" erhalten`,
      })),
    ]

    // Sport-Counts für SportartenSection
    const sportCounts: SportCount[] = sports.map((s) => ({
      slug: s.slug,
      vereinCount: s._count.vereine,
      tournamentCount: s._count.tournaments,
    }))

    // FeaturesSection: nur öffentliche Badges, max. 9
    const featureBadges: BadgePreview[] = allBadges
      .filter((b) => !b.isSecret)
      .slice(0, 9)
      .map((b) => ({ id: b.id, name: b.name, rarity: b.rarity }))

    // GamificationSection: alle Badges (public + secret), max. 9
    const gamificationBadges: GamificationBadge[] = allBadges.slice(0, 9).map((b) => ({
      id: b.id,
      name: b.name,
      rarity: b.rarity,
      iconName: b.iconName,
      isSecret: b.isSecret,
    }))

    return {
      userCount,
      vereinCount,
      tickerItems: liveItems.length > 0 ? liveItems : FALLBACK_TICKER,
      featureBadges,
      sportCounts,
      gamificationBadges,
    }
  } catch {
    // DB nicht erreichbar oder Fehler → Seite zeigt Fallback-Daten
    return {
      userCount: 0,
      vereinCount: 0,
      tickerItems: FALLBACK_TICKER,
      featureBadges: [],
      sportCounts: [],
      gamificationBadges: [],
    }
  }
}

// ── Seite ─────────────────────────────────────────────────────────

export default async function HomePage() {
  const data = await getHomeData()

  return (
    <>
      {/*
        Kein PageLayout-Wrapper: die Navbar ist auf der Homepage
        transparent und geht direkt hinter den Hero-Bereich.
        PageLayout würde einen festen weißen Hintergrund + Padding setzen,
        was das transparente Navbar-Verhalten zerstören würde.
      */}
      <Navbar />

      <main>
        <HeroSection
          userCount={data.userCount}
          vereinCount={data.vereinCount}
        />
        <TickerSection items={data.tickerItems} />
        <FeaturesSection badges={data.featureBadges} />
        <SportartenSection sportCounts={data.sportCounts} />
        <WieEsFunktioniertSection />
        <GamificationSection badges={data.gamificationBadges} />
        <TestimonialsSection />
        <FinalCtaSection />
      </main>

      <Footer />
    </>
  )
}
