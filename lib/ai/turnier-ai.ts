import type { PrismaClient } from '@prisma/client'
import { NotificationType } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────
// TurnierAI – Täglicher Benachrichtigungs-Check
//
// KEIN BaseAI, KEIN externer API-Call.
// Wird von der Vercel-Cron-Route täglich um 08:00 Uhr aufgerufen.
//
// Logik:
//   1. Alle Turniere laden deren Anmeldefrist in den nächsten 7 Tagen endet.
//   2. Für jeden User mit passendem Sportprofil prüfen:
//      - Noch nicht angemeldet (kein TournamentEntry)
//      - Noch keine TOURNAMENT_REMINDER-Notification für dieses Turnier
//      - Noch freie Plätze (oder kein Limit)
//   3. Notification erstellen.
// ─────────────────────────────────────────────────────────────────

export interface DailyCheckResult {
  notificationsCreated: number
  tournamentsChecked: number
  usersChecked: number
}

export class TurnierAI {
  /**
   * Führt den täglichen Turnier-Erinnerungs-Check durch.
   * Nimmt die Prisma-Client-Instanz als Parameter (testbar + serverless-sicher).
   */
  async runDailyCheck(prisma: PrismaClient): Promise<DailyCheckResult> {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // ── Schritt 1: Relevante Turniere laden ──────────────────
    // Anmeldefrist endet zwischen jetzt und in 7 Tagen
    const tournaments = await prisma.tournament.findMany({
      where: {
        isPublished: true,
        status: { in: ['REGISTRATION_OPEN', 'PUBLISHED'] },
        registrationDeadline: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      select: {
        id: true,
        name: true,
        sportId: true,
        registrationDeadline: true,
        maxParticipants: true,
        _count: { select: { entries: true } },
      },
    })

    if (tournaments.length === 0) {
      return { notificationsCreated: 0, tournamentsChecked: 0, usersChecked: 0 }
    }

    // Turnier-IDs nach Sport gruppieren (für effiziente User-Suche)
    const sportIds = Array.from(new Set(tournaments.map((t) => t.sportId)))

    // ── Schritt 2: User mit passendem Sportprofil laden ──────
    const users = await prisma.user.findMany({
      where: {
        sports: {
          some: {
            sportId: { in: sportIds },
          },
        },
      },
      select: {
        id: true,
        sports: { select: { sportId: true } },
        tournamentEntries: { select: { tournamentId: true } },
        notifications: {
          where: {
            type: NotificationType.TOURNAMENT_REMINDER,
          },
          select: { data: true },
        },
      },
    })

    if (users.length === 0) {
      return {
        notificationsCreated: 0,
        tournamentsChecked: tournaments.length,
        usersChecked: 0,
      }
    }

    // ── Schritt 3: Für jeden User passende Turniere finden ───
    const notificationsToCreate: Array<{
      userId: string
      type: NotificationType
      title: string
      body: string
      data: { tournamentId: string }
    }> = []

    for (const user of users) {
      const userSportIds = new Set(user.sports.map((s) => s.sportId))
      const userEntryIds = new Set(user.tournamentEntries.map((e) => e.tournamentId))

      // Bereits erhaltene TOURNAMENT_REMINDER-Notifications extrahieren
      const alreadyNotifiedTournamentIds = new Set<string>()
      for (const notification of user.notifications) {
        if (
          notification.data !== null &&
          typeof notification.data === 'object' &&
          !Array.isArray(notification.data)
        ) {
          const data = notification.data as Record<string, unknown>
          if (typeof data['tournamentId'] === 'string') {
            alreadyNotifiedTournamentIds.add(data['tournamentId'])
          }
        }
      }

      for (const tournament of tournaments) {
        // Check 1: Sportart stimmt überein
        if (!userSportIds.has(tournament.sportId)) continue

        // Check 2: User noch nicht angemeldet
        if (userEntryIds.has(tournament.id)) continue

        // Check 3: Noch keine Reminder-Notification für dieses Turnier
        if (alreadyNotifiedTournamentIds.has(tournament.id)) continue

        // Check 4: Noch freie Plätze (oder kein Limit)
        if (
          tournament.maxParticipants !== null &&
          tournament._count.entries >= tournament.maxParticipants
        ) {
          continue
        }

        // Check 5: Anmeldefrist berechnen für Notification-Text
        const deadlineDate = tournament.registrationDeadline
        const daysLeft =
          deadlineDate !== null
            ? Math.ceil(
                (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              )
            : null

        const bodyText =
          daysLeft !== null
            ? `Anmeldefrist endet in ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'}. Sichere dir jetzt deinen Startplatz.`
            : 'Anmeldefrist endet bald. Jetzt anmelden.'

        notificationsToCreate.push({
          userId: user.id,
          type: NotificationType.TOURNAMENT_REMINDER,
          title: `Turnier: ${tournament.name}`,
          body: bodyText,
          data: { tournamentId: tournament.id },
        })
      }
    }

    if (notificationsToCreate.length === 0) {
      return {
        notificationsCreated: 0,
        tournamentsChecked: tournaments.length,
        usersChecked: users.length,
      }
    }

    // ── Schritt 4: Notifications in Batches erstellen ────────
    // createMany für Performance (kein N+1)
    await prisma.notification.createMany({
      data: notificationsToCreate,
      skipDuplicates: true,
    })

    return {
      notificationsCreated: notificationsToCreate.length,
      tournamentsChecked: tournaments.length,
      usersChecked: users.length,
    }
  }
}

// Singleton-Export
export const turnierAI = new TurnierAI()
