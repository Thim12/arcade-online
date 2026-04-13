// ─────────────────────────────────────────────────────────────────
// GET /api/leaderboard
//
// Query params:
//   sport  = fussball | tennis | basketball | (leer = Gesamt)
//   period = week | month | all          (default: week)
//   page   = 1, 2, 3, …                 (default: 1)
//
// Response: LeaderboardResponse
//   leaderboard  LeaderboardEntry[]  (max. 50 pro Seite)
//   myRank       number | null
//   myEntry      LeaderboardEntry | null
//   total        number
//   page         number
//   totalPages   number
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── Exportierte Typen ────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  xp: number
  periodXP: number
  sport: {
    id: string
    name: string
    slug: string
    colorPrimary: string
  } | null
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  myRank: number | null
  myEntry: LeaderboardEntry | null
  total: number
  page: number
  totalPages: number
}

// ── Konstanten ───────────────────────────────────────────────────

const PAGE_SIZE = 50

type Period = 'week' | 'month' | 'all'

// ── Hilfsfunktionen ──────────────────────────────────────────────

function getStartDate(period: Period): Date | null {
  if (period === 'all') return null
  const now = new Date()
  if (period === 'week') {
    const day = now.getDay() // 0=So, 1=Mo, …
    const diff = day === 0 ? -6 : 1 - day // Tage zurück bis Montag
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }
  // month
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function toEntry(
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    level: number
    xp: number
    sports: { sport: { id: string; name: string; slug: string; colorPrimary: string } }[]
  },
  rank: number,
  periodXP: number,
): LeaderboardEntry {
  return {
    rank,
    id: user.id,
    name: user.name,
    username: user.username,
    image: user.image,
    level: user.level,
    xp: user.xp,
    periodXP,
    sport: user.sports[0]?.sport ?? null,
  }
}

// ── Gemeinsames Select ───────────────────────────────────────────

const userSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
  level: true,
  xp: true,
  sports: {
    include: {
      sport: {
        select: {
          id: true,
          name: true,
          slug: true,
          colorPrimary: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
    take: 1,
  },
} as const

// ── Handler ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }
  const myId = session.user.id

  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') ?? ''
  const rawPeriod = searchParams.get('period') ?? 'week'
  const period: Period =
    rawPeriod === 'month' ? 'month' : rawPeriod === 'all' ? 'all' : 'week'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const sportFilter = sport
    ? { sports: { some: { sport: { slug: sport } } } }
    : {}

  const baseWhere = { isPublicProfile: true, isActive: true, ...sportFilter }

  // ── ALL-TIME ────────────────────────────────────────────────────
  if (period === 'all') {
    const [total, users] = await Promise.all([
      prisma.user.count({ where: baseWhere }),
      prisma.user.findMany({
        where: baseWhere,
        orderBy: { xp: 'desc' },
        skip: offset,
        take: PAGE_SIZE,
        select: userSelect,
      }),
    ])

    const leaderboard = users.map((u, i) => toEntry(u, offset + i + 1, u.xp))

    const myIdx = leaderboard.findIndex((e) => e.id === myId)
    let myRank: number | null = null
    let myEntry: LeaderboardEntry | null = null

    if (myIdx >= 0) {
      myRank = leaderboard[myIdx].rank
      myEntry = leaderboard[myIdx]
    } else {
      const me = await prisma.user.findUnique({
        where: { id: myId },
        select: userSelect,
      })
      if (me) {
        const countAbove = await prisma.user.count({
          where: { ...baseWhere, xp: { gt: me.xp } },
        })
        myRank = countAbove + 1
        myEntry = toEntry(me, myRank, me.xp)
      }
    }

    const response: LeaderboardResponse = {
      leaderboard,
      myRank,
      myEntry,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    }
    return NextResponse.json(response)
  }

  // ── WOCHE / MONAT ────────────────────────────────────────────────
  const startDate = getStartDate(period)!

  const eligibleUsers = await prisma.user.findMany({
    where: baseWhere,
    select: { id: true },
  })
  const eligibleIds = eligibleUsers.map((u) => u.id)

  if (eligibleIds.length === 0) {
    const response: LeaderboardResponse = {
      leaderboard: [],
      myRank: null,
      myEntry: null,
      total: 0,
      page: 1,
      totalPages: 0,
    }
    return NextResponse.json(response)
  }

  // Gruppiere Trainings-Sessions nach User + summiere XP im Zeitraum
  const groups = await prisma.trainingSession.groupBy({
    by: ['userId'],
    where: {
      userId: { in: eligibleIds },
      completedAt: { gte: startDate },
    },
    _sum: { xpEarned: true },
    orderBy: { _sum: { xpEarned: 'desc' } },
  })

  const total = groups.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const paginated = groups.slice(offset, offset + PAGE_SIZE)
  const paginatedIds = paginated.map((g) => g.userId)

  const usersRaw = await prisma.user.findMany({
    where: { id: { in: paginatedIds } },
    select: userSelect,
  })
  const usersMap = new Map(usersRaw.map((u) => [u.id, u]))

  const leaderboard: LeaderboardEntry[] = paginated
    .map((g, i) => {
      const u = usersMap.get(g.userId)
      if (!u) return null
      return toEntry(u, offset + i + 1, g._sum.xpEarned ?? 0)
    })
    .filter((e): e is LeaderboardEntry => e !== null)

  const myIdx = leaderboard.findIndex((e) => e.id === myId)
  let myRank: number | null = null
  let myEntry: LeaderboardEntry | null = null

  if (myIdx >= 0) {
    myRank = leaderboard[myIdx].rank
    myEntry = leaderboard[myIdx]
  } else {
    const myGroupIdx = groups.findIndex((g) => g.userId === myId)
    if (myGroupIdx >= 0) {
      myRank = myGroupIdx + 1
      let me = usersMap.get(myId)
      if (!me) {
        me = (await prisma.user.findUnique({
          where: { id: myId },
          select: userSelect,
        })) ?? undefined
      }
      if (me) {
        myEntry = toEntry(me, myRank, groups[myGroupIdx]._sum.xpEarned ?? 0)
      }
    }
  }

  const response: LeaderboardResponse = {
    leaderboard,
    myRank,
    myEntry,
    total,
    page,
    totalPages,
  }
  return NextResponse.json(response)
}
