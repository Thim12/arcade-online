import type { StreakInfo } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────
// Streak-Logik
//
// Regeln:
// - Ein Tag = ein Kalendertag (Europe/Berlin Zeitzone)
// - Streak ist aktiv wenn: letztes Training war HEUTE oder GESTERN
// - Streak bricht ab wenn: letztes Training war vor 2+ Tagen
// - completedAt-Liste muss aufsteigend sortiert sein (älteste zuerst)
// ─────────────────────────────────────────────────────────────────

const TIMEZONE = 'Europe/Berlin'

/**
 * Gibt den Tageshash eines Datums zurück (YYYY-MM-DD in Europe/Berlin).
 * Wird für Datumsvergleiche ohne Uhrzeit verwendet.
 */
function toDayString(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Gibt den Tageshash des heutigen Tages zurück.
 */
function todayString(): string {
  return toDayString(new Date())
}

/**
 * Gibt den Tageshash von gestern zurück.
 */
function yesterdayString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return toDayString(yesterday)
}

/**
 * Berechnet den aktuellen Streak anhand einer Liste von Training-Timestamps.
 *
 * @param completedAtList - Array aller TrainingSession.completedAt Dates (beliebige Reihenfolge)
 * @returns StreakInfo
 */
export function calculateStreak(completedAtList: Date[]): StreakInfo {
  if (completedAtList.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      lastTrainedAt: null,
    }
  }

  // Einzigartige Trainingstage ermitteln (ein Training pro Tag zählt)
  const uniqueDayStrings = Array.from(
    new Set(completedAtList.map((date) => toDayString(date)))
  )

  // Sortieren: neueste zuerst
  uniqueDayStrings.sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('.').map(Number)
    const [dayB, monthB, yearB] = b.split('.').map(Number)
    const dateA = new Date(yearA!, monthA! - 1, dayA!)
    const dateB = new Date(yearB!, monthB! - 1, dayB!)
    return dateB.getTime() - dateA.getTime()
  })

  // Helper: "DD.MM.YYYY" → Date
  const parseDayStr = (s: string): Date => {
    const [d, m, y] = s.split('.').map(Number)
    return new Date(y!, m! - 1, d!)
  }

  // Längsten Streak aller Zeiten berechnen (chronologisch aufsteigend)
  const chronoAsc = [...uniqueDayStrings].reverse()
  let longestStreak = 1
  let runningStreak = 1
  for (let i = 1; i < chronoAsc.length; i++) {
    const diffDays = Math.round(
      (parseDayStr(chronoAsc[i]!).getTime() - parseDayStr(chronoAsc[i - 1]!).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    if (diffDays === 1) {
      runningStreak++
      if (runningStreak > longestStreak) longestStreak = runningStreak
    } else {
      runningStreak = 1
    }
  }

  const today = todayString()
  const yesterday = yesterdayString()
  const mostRecentDay = uniqueDayStrings[0]!

  // Prüfen ob Streak noch aktiv (heute oder gestern trainiert)
  if (mostRecentDay !== today && mostRecentDay !== yesterday) {
    // Streak ist abgebrochen
    const lastTrainedAt = completedAtList.reduce((latest, current) =>
      current > latest ? current : latest
    )
    return {
      currentStreak: 0,
      longestStreak,
      isActiveToday: false,
      lastTrainedAt,
    }
  }

  // Streak rückwärts zählen
  let streak = 0
  let expectedDate = new Date()

  // Wenn nicht heute, dann gestern als Startpunkt
  if (mostRecentDay !== today) {
    expectedDate.setDate(expectedDate.getDate() - 1)
  }

  for (const dayString of uniqueDayStrings) {
    const expectedString = toDayString(expectedDate)
    if (dayString === expectedString) {
      streak++
      expectedDate.setDate(expectedDate.getDate() - 1)
    } else {
      // Lücke im Streak → abbrechen
      break
    }
  }

  const lastTrainedAt = completedAtList.reduce((latest, current) =>
    current > latest ? current : latest
  )

  return {
    currentStreak: streak,
    longestStreak,
    isActiveToday: mostRecentDay === today,
    lastTrainedAt,
  }
}

/**
 * Prüft ob der Streak noch aktiv ist (heute oder gestern trainiert).
 */
export function isStreakActive(lastTrainedAt: Date | null): boolean {
  if (lastTrainedAt === null) return false
  const lastDay = toDayString(lastTrainedAt)
  return lastDay === todayString() || lastDay === yesterdayString()
}
