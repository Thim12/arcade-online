// ─────────────────────────────────────────────────────────────────
// app/admin/page.tsx
//
// Admin-Dashboard – Server Component.
// Auth-Check: nur ADMIN darf zugreifen (Middleware schützt /admin/*).
// Parallel-Prisma-Queries für alle Dashboard-Daten.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AdminDashboardClient from './AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  // ── Referenzdatum: vor 7 Tagen ───────────────────────────────────
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // ── Parallel-Queries ─────────────────────────────────────────────
  const [
    totalUsers,
    usersThisWeek,
    usersLastWeek,
    verifiedVereine,
    pendingVereine,
    activeTurniere,
    pendingTurniere,
    reportedPosts,
    sportUserCounts,
    activeUserCount,
  ] = await Promise.all([
    // Gesamt-User-Anzahl
    prisma.user.count(),

    // Neue User diese Woche
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),

    // Neue User letzte Woche (Vergleichswert für Trend)
    prisma.user.count({
      where: {
        createdAt: {
          gte: fourteenDaysAgo,
          lt: sevenDaysAgo,
        },
      },
    }),

    // Verifizierte Vereine
    prisma.verein.count({ where: { isVerified: true } }),

    // Ausstehende Vereine (PENDING)
    prisma.verein.findMany({
      where: { status: 'PENDING' },
      include: {
        sport: {
          select: { name: true, colorPrimary: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),

    // Aktive Turniere (verifiziert + published)
    prisma.tournament.count({
      where: {
        isVerified: true,
        isPublished: true,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
    }),

    // Ausstehende Turniere (DRAFT, nicht verifiziert)
    prisma.tournament.findMany({
      where: {
        isVerified: false,
        isPublished: false,
        status: 'DRAFT',
      },
      include: {
        sport: {
          select: { name: true, colorPrimary: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),

    // Gemeldete Posts (>= 3 Reports, nicht versteckt)
    prisma.post.findMany({
      where: {
        reportsCount: { gte: 3 },
        isHidden: false,
      },
      include: {
        user: { select: { name: true, username: true } },
        sport: { select: { name: true } },
      },
      orderBy: { reportsCount: 'desc' },
      take: 50,
    }),

    // Sport-Verteilung: User pro Sportart
    prisma.userSport.groupBy({
      by: ['sportId'],
      _count: { _all: true },
      orderBy: { _count: { sportId: 'desc' } },
    }),

    // Aktive User (isActive=true)
    prisma.user.count({ where: { isActive: true } }),
  ])

  // ── Sport-Namen auflösen ─────────────────────────────────────────
  const sportIds = sportUserCounts.map(s => s.sportId)
  const sports = await prisma.sport.findMany({
    where: { id: { in: sportIds } },
    select: { id: true, name: true, colorPrimary: true },
  })

  const sportMap = new Map(sports.map(s => [s.id, s]))

  const sportStats = sportUserCounts
    .map(s => {
      const sport = sportMap.get(s.sportId)
      if (!sport) return null
      return {
        name: sport.name,
        count: s._count._all,
        color: sport.colorPrimary,
      }
    })
    .filter((s): s is { name: string; count: number; color: string } => s !== null)

  // ── Serialisierung für Client ────────────────────────────────────
  // Prisma-Objekte → Plain JSON (Dates werden zu Strings)

  const serializedPendingVereine = pendingVereine.map(v => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    city: v.city,
    state: v.state as string,
    submitterName: v.submitterName,
    submitterEmail: v.submitterEmail,
    createdAt: v.createdAt.toISOString(),
    description: v.description,
    sport: v.sport,
    details: v.details,
  }))

  const serializedPendingTurniere = pendingTurniere.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    city: t.city,
    state: t.state as string,
    submitterName: t.submitterName,
    submitterEmail: t.submitterEmail,
    createdAt: t.createdAt.toISOString(),
    description: t.description,
    sport: t.sport,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    level: t.level as string,
  }))

  const serializedReportedPosts = reportedPosts.map(p => ({
    id: p.id,
    content: p.content,
    reportsCount: p.reportsCount,
    createdAt: p.createdAt.toISOString(),
    user: p.user,
    sport: p.sport,
  }))

  return (
    <AdminDashboardClient
      totalUsers={totalUsers}
      usersThisWeek={usersThisWeek}
      usersLastWeek={usersLastWeek}
      verifiedVereine={verifiedVereine}
      pendingVereine={serializedPendingVereine}
      activeTurniere={activeTurniere}
      pendingTurniere={serializedPendingTurniere}
      reportedPosts={serializedReportedPosts}
      sportStats={sportStats}
      activeUserCount={activeUserCount}
    />
  )
}
