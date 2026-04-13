// ─────────────────────────────────────────────────────────────────
// app/training/statistiken/page.tsx – Server Component
//
// Lädt alle Trainingsdaten des Users und übergibt sie an StatsClient.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatsClient } from './StatsClient'
import type { SportSlug } from '@/lib/sport-profiles'

export const metadata = { title: 'Meine Statistiken – SportRise' }

// ── Typen ─────────────────────────────────────────────────────────

export interface WeeklyBar {
  weekLabel: string   // z.B. "KW 14"
  isoWeek: string     // z.B. "2026-W14"
  sessions: number
  totalMinutes: number
}

export interface ActivityCell {
  date: string        // ISO-Datum "YYYY-MM-DD"
  count: number       // 0-3+
}

export interface StatsData {
  totalSessions: number
  totalMinutes: number
  currentStreak: number
  longestStreak: number
  estimatedCalories: number
  weeklyBars: WeeklyBar[]        // letzte 8 Wochen
  activityGrid: ActivityCell[][] // 52 Wochen × 7 Tage
  sportName: string
  sportSlug: SportSlug | null
  sportColorPrimary: string
  sportColorGlow: string
  bestWeekSessions: number
  bestSessionMinutes: number
  totalXP: number
}

// ── ISO-Woche berechnen ───────────────────────────────────────────

function getIsoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: d.getUTCFullYear(), week: weekNo }
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Hilfsfunktionen ───────────────────────────────────────────────

const SPORT_NAMES: Record<string, string> = {
  fussball:   'Fußball',
  tennis:     'Tennis',
  basketball: 'Basketball',
}

const CALORIES_PER_MIN: Record<string, number> = {
  fussball:   8,
  tennis:     7,
  basketball: 7,
}

export default async function StatistikenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // ── User-Daten laden ──────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      streakDays: true,
      longestStreak: true,
      sports: {
        include: {
          sport: {
            select: { slug: true, colorPrimary: true, colorGlow: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  })

  if (user === null) redirect('/login')

  // ── Trainingssessions laden (letzte 365 Tage) ─────────────────
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 365)

  const sessions = await prisma.trainingSession.findMany({
    where: {
      userId,
      completedAt: { gte: cutoff },
    },
    select: {
      completedAt: true,
      durationMin: true,
    },
    orderBy: { completedAt: 'asc' },
  })

  // ── Sport-Infos ───────────────────────────────────────────────
  const primarySport = user.sports[0]?.sport ?? null
  const sportSlug = primarySport?.slug as SportSlug | null
  const sportName = sportSlug !== null ? (SPORT_NAMES[sportSlug] ?? sportSlug) : 'Sport'
  const calPerMin = sportSlug !== null ? (CALORIES_PER_MIN[sportSlug] ?? 7) : 7

  // ── Gesamt-Statistiken ────────────────────────────────────────
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((s, t) => s + t.durationMin, 0)
  const estimatedCalories = Math.round(totalMinutes * calPerMin)

  // ── Bestes Session ────────────────────────────────────────────
  const bestSessionMinutes = sessions.reduce(
    (max, t) => Math.max(max, t.durationMin), 0,
  )

  // ── Activity Grid (52 × 7) ────────────────────────────────────
  // Wir bauen ein Grid der letzten 364 Tage (= 52 Wochen)
  // Spalten = Wochen (alt → neu), Zeilen = Wochentag (Mo–So)
  const today = new Date()
  // Montagsausrichtung: Finde den letzten Montag
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1 // 0=Mo
  const gridEnd = new Date(today)
  gridEnd.setDate(today.getDate() - dayOfWeek + 6) // letzter Sonntag der aktuellen Woche

  const gridStart = new Date(gridEnd)
  gridStart.setDate(gridEnd.getDate() - 364) // 52 Wochen × 7 = 364 Tage

  // Sessions als Map: "YYYY-MM-DD" → count
  const sessionMap = new Map<string, number>()
  for (const s of sessions) {
    const key = toDateString(new Date(s.completedAt))
    sessionMap.set(key, (sessionMap.get(key) ?? 0) + 1)
  }

  // Grid aufbauen: 52 Wochen × 7 Tage
  const activityGrid: ActivityCell[][] = []
  const cursor = new Date(gridStart)

  for (let week = 0; week < 52; week++) {
    const weekRow: ActivityCell[] = []
    for (let day = 0; day < 7; day++) {
      const dateStr = toDateString(cursor)
      const count = Math.min(sessionMap.get(dateStr) ?? 0, 4)
      weekRow.push({ date: dateStr, count })
      cursor.setDate(cursor.getDate() + 1)
    }
    activityGrid.push(weekRow)
  }

  // ── Wöchentliche Balken (letzte 8 Wochen) ────────────────────
  // Wochensessions zählen
  const weekMap = new Map<string, { sessions: number; minutes: number; weekNo: number }>()

  for (const s of sessions) {
    const date = new Date(s.completedAt)
    const { year, week } = getIsoWeek(date)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    const existing = weekMap.get(key) ?? { sessions: 0, minutes: 0, weekNo: week }
    weekMap.set(key, {
      sessions: existing.sessions + 1,
      minutes:  existing.minutes + s.durationMin,
      weekNo:   week,
    })
  }

  // Letzte 8 ISO-Wochen generieren
  const recentWeeks: WeeklyBar[] = []
  const nowCursor = new Date()

  for (let i = 7; i >= 0; i--) {
    const d = new Date(nowCursor)
    d.setDate(d.getDate() - i * 7)
    const { year, week } = getIsoWeek(d)
    const key = `${year}-W${String(week).padStart(2, '0')}`
    const data = weekMap.get(key) ?? { sessions: 0, minutes: 0, weekNo: week }
    recentWeeks.push({
      weekLabel: `KW ${week}`,
      isoWeek:   key,
      sessions:  data.sessions,
      totalMinutes: data.minutes,
    })
  }

  // ── Beste Woche ───────────────────────────────────────────────
  const bestWeekSessions = Math.max(...recentWeeks.map((w) => w.sessions), 0)

  const statsData: StatsData = {
    totalSessions,
    totalMinutes,
    currentStreak:    user.streakDays,
    longestStreak:    user.longestStreak,
    estimatedCalories,
    weeklyBars:       recentWeeks,
    activityGrid,
    sportName,
    sportSlug,
    sportColorPrimary: primarySport?.colorPrimary ?? '#16A34A',
    sportColorGlow:    primarySport?.colorGlow    ?? 'rgba(22,163,74,0.35)',
    bestWeekSessions,
    bestSessionMinutes,
    totalXP: user.xp,
  }

  return <StatsClient data={statsData} />
}
