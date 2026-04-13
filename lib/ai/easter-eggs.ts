import type { PrismaClient } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────
// Easter Eggs – Stille Badge-Vergabe
//
// Alle Easter-Egg-Checks vergeben Badges STILL – kein Toast, kein
// sichtbarer Hinweis. Der User entdeckt sie selbst.
//
// Jede Funktion ist idempotent: doppelter Aufruf mit gleichen Daten
// vergibt das Badge nicht zweimal (@@unique([userId, badgeId])).
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Hilfsfunktion: Badge vergeben
// ─────────────────────────────────────────────────────────────────

/**
 * Vergibt ein Easter-Egg-Badge + XP-Bonus in einer DB-Transaktion.
 *
 * Prüft zuerst ob:
 *   1. Das Badge mit diesem Namen in der DB existiert
 *   2. Der User es noch nicht hat
 *
 * Gibt true zurück wenn das Badge vergeben wurde, false wenn es
 * bereits vorhanden war oder nicht existiert.
 */
export async function awardEasterEggBadge(
  userId: string,
  badgeName: string,
  xpBonus: number,
  prisma: PrismaClient,
): Promise<boolean> {
  // Badge in der DB suchen (nach Name)
  const badge = await prisma.badge.findUnique({
    where: { name: badgeName },
    select: { id: true },
  })

  if (badge === null) return false  // Badge nicht im Seed → kein Crash

  // Prüfen ob User das Badge bereits hat
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    select: { id: true },
  })

  if (existing !== null) return false  // Bereits vergeben

  // Badge + XP in einer Transaktion vergeben (atomisch)
  await prisma.$transaction([
    prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpBonus } },
    }),
  ])

  return true
}

// ─────────────────────────────────────────────────────────────────
// Check 1: Nacht-Training um 03:33 Uhr
// ─────────────────────────────────────────────────────────────────

/**
 * Prüft ob der User dreimal zwischen 03:31 und 03:35 Uhr trainiert hat.
 * Badge: "3:33 Uhr", XP: 999
 * Kein Toast – still vergeben.
 */
export async function checkNightTrainingEasterEgg(
  userId: string,
  completedAt: Date,
  prisma: PrismaClient,
): Promise<boolean> {
  const hour = completedAt.getHours()
  const minute = completedAt.getMinutes()

  // Diese Session muss im Zeitfenster liegen
  const isInWindow = hour === 3 && minute >= 31 && minute <= 35
  if (!isInWindow) return false

  // Alle Sessions im Zeitfenster 03:31–03:35 zählen
  const allSessions = await prisma.trainingSession.findMany({
    where: { userId },
    select: { completedAt: true },
  })

  const nightSessions = allSessions.filter((s) => {
    const h = s.completedAt.getHours()
    const m = s.completedAt.getMinutes()
    return h === 3 && m >= 31 && m <= 35
  })

  if (nightSessions.length < 3) return false

  return awardEasterEggBadge(userId, '3:33 Uhr', 999, prisma)
}

// ─────────────────────────────────────────────────────────────────
// Check 2: Logo 10x klicken
// ─────────────────────────────────────────────────────────────────

/**
 * Wird vom Frontend aufgerufen wenn der User das Logo klickt.
 * Der Klick-Zähler wird vom Frontend übergeben.
 * Bei 10 Klicks: Badge "Hartnäckig", XP: 25
 */
export async function checkLogoClickEasterEgg(
  userId: string,
  clickCount: number,
  prisma: PrismaClient,
): Promise<boolean> {
  if (clickCount < 10) return false

  return awardEasterEggBadge(userId, 'Hartnäckig', 25, prisma)
}

// ─────────────────────────────────────────────────────────────────
// Check 3: Perfekte Woche (3x)
// ─────────────────────────────────────────────────────────────────

/**
 * Zählt vollständige Wochen (Mo–So) in denen der User jeden Tag mindestens
 * eine Trainingseinheit abgeschlossen hat.
 *
 * Bei 3 perfekten Wochen: Badge "Perfekte Woche", XP: 333
 */
export async function checkPerfectWeekEasterEgg(
  userId: string,
  prisma: PrismaClient,
): Promise<boolean> {
  const sessions = await prisma.trainingSession.findMany({
    where: { userId },
    select: { completedAt: true },
    orderBy: { completedAt: 'asc' },
  })

  if (sessions.length < 7) return false  // Zu wenige Sessions für eine perfekte Woche

  // Sessions nach Kalendertag gruppieren (YYYY-MM-DD)
  const daysWithTraining = new Set<string>(
    sessions.map((s) => s.completedAt.toISOString().slice(0, 10)),
  )

  // Jede Kalenderwoche (Mo–So) prüfen
  let perfectWeekCount = 0

  // Früheste und späteste Session ermitteln
  const first = sessions[0].completedAt
  const last = sessions[sessions.length - 1].completedAt

  // Montag der ersten Woche berechnen
  const mondayOfFirst = new Date(first)
  const dayOfWeek = mondayOfFirst.getDay()  // 0=So, 1=Mo, ...
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  mondayOfFirst.setDate(mondayOfFirst.getDate() - daysToMonday)
  mondayOfFirst.setHours(0, 0, 0, 0)

  const cursor = new Date(mondayOfFirst)

  while (cursor <= last) {
    // Diese Woche: Mo bis So
    let allSevenDaysPresent = true

    for (let d = 0; d < 7; d++) {
      const day = new Date(cursor)
      day.setDate(cursor.getDate() + d)
      const dayKey = day.toISOString().slice(0, 10)

      if (!daysWithTraining.has(dayKey)) {
        allSevenDaysPresent = false
        break
      }
    }

    if (allSevenDaysPresent) {
      perfectWeekCount++
    }

    // Zur nächsten Woche
    cursor.setDate(cursor.getDate() + 7)
  }

  if (perfectWeekCount < 3) return false

  return awardEasterEggBadge(userId, 'Perfekte Woche', 333, prisma)
}

// ─────────────────────────────────────────────────────────────────
// Check 4: Alle FAQ geöffnet
// ─────────────────────────────────────────────────────────────────

/**
 * Wird vom Frontend aufgerufen wenn der User alle FAQ-Einträge geöffnet hat.
 * Das Frontend ist verantwortlich für die Erkennung ("alle offen").
 *
 * Badge: "Stiller Leser", XP: 200
 */
export async function checkAllFaqOpenedEasterEgg(
  userId: string,
  prisma: PrismaClient,
): Promise<boolean> {
  return awardEasterEggBadge(userId, 'Stiller Leser', 200, prisma)
}
