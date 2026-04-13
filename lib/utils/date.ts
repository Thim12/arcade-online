// ─────────────────────────────────────────────────────────────────
// Datums-Utilities für SportRise.de
// Alle Ausgaben auf Deutsch, Zeitzone: Europe/Berlin
// ─────────────────────────────────────────────────────────────────

const TIMEZONE = 'Europe/Berlin'
const LOCALE = 'de-DE'

/**
 * Formatiert ein Datum auf Deutsch.
 * Beispiel: "10. April 2026"
 */
export function formatGermanDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formatiert ein Datum mit Uhrzeit auf Deutsch.
 * Beispiel: "10. April 2026, 14:30 Uhr"
 */
export function formatGermanDateTime(date: Date): string {
  const datePart = date.toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${datePart}, ${timePart} Uhr`
}

/**
 * Kurzes Datumsformat.
 * Beispiel: "10.04.2026"
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Relative Zeitangabe auf Deutsch.
 * Beispiele: "gerade eben", "vor 5 Minuten", "vor 2 Stunden", "gestern", "vor 3 Tagen", "vor 2 Wochen"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSeconds < 60) return 'gerade eben'
  if (diffMinutes === 1) return 'vor 1 Minute'
  if (diffMinutes < 60) return `vor ${diffMinutes} Minuten`
  if (diffHours === 1) return 'vor 1 Stunde'
  if (diffHours < 24) return `vor ${diffHours} Stunden`
  if (diffDays === 1) return 'gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  if (diffWeeks === 1) return 'vor 1 Woche'
  if (diffWeeks < 5) return `vor ${diffWeeks} Wochen`
  if (diffMonths === 1) return 'vor 1 Monat'
  if (diffMonths < 12) return `vor ${diffMonths} Monaten`
  return formatGermanDate(date)
}

/**
 * Prüft ob ein Datum heute ist (in Europe/Berlin Zeitzone).
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE }) ===
    today.toLocaleDateString(LOCALE, { timeZone: TIMEZONE })
  )
}

/**
 * Prüft ob ein Datum gestern war (in Europe/Berlin Zeitzone).
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE }) ===
    yesterday.toLocaleDateString(LOCALE, { timeZone: TIMEZONE })
  )
}

/**
 * Gibt die Anzahl der vollen Tage zwischen zwei Daten zurück.
 * Ignoriert die Uhrzeit. Gibt immer einen positiven Wert zurück.
 */
export function getDaysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const startOfA = new Date(dateA)
  startOfA.setHours(0, 0, 0, 0)
  const startOfB = new Date(dateB)
  startOfB.setHours(0, 0, 0, 0)
  return Math.abs(Math.floor((startOfA.getTime() - startOfB.getTime()) / msPerDay))
}

/**
 * Formatiert eine Dauer in Minuten als lesbare Zeichenkette.
 * Beispiele: "45 Min.", "1 Std. 30 Min.", "2 Std."
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours} Std.`
  return `${hours} Std. ${remainingMinutes} Min.`
}
