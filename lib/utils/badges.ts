import { prisma } from '@/lib/prisma'
import type { BadgeRequirement } from '@/lib/types'
import { levelForXp } from '@/lib/utils/xp'

// ─────────────────────────────────────────────────────────────────
// BadgeChecker
//
// Prüft nach jeder relevanten Aktion, ob der User neue Badges
// verdient hat. Schreibt UserBadge in die DB und aktualisiert
// User.xp (+ User.level) falls XP vergeben werden.
//
// Alle Methoden sind idempotent – doppeltes Aufrufen ist sicher
// (@@unique([userId, badgeId]) in der DB).
//
// Hinweis: Einige Badge-Typen (Easter Eggs, nicht implementierte
// Modelle) geben immer false zurück und werden durch den
// action-basierten badge-checker.ts für Echtzeit-Checks abgedeckt.
// ─────────────────────────────────────────────────────────────────

export class BadgeChecker {
  private readonly userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Vergibt ein einzelnes Badge an den User falls noch nicht vorhanden.
   * Aktualisiert User.xp und User.level.
   * Gibt true zurück wenn Badge neu vergeben wurde.
   */
  private async awardBadge(badgeId: string, xpReward: number): Promise<boolean> {
    try {
      const existing = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: { userId: this.userId, badgeId },
        },
      })

      if (existing !== null) return false

      // Badge vergeben + XP hinzufügen
      await prisma.$transaction([
        prisma.userBadge.create({
          data: { userId: this.userId, badgeId },
        }),
        prisma.user.update({
          where: { id: this.userId },
          data: {
            xp: { increment: xpReward },
          },
        }),
      ])

      // Level neu berechnen und aktualisieren
      const updatedUser = await prisma.user.findUnique({
        where: { id: this.userId },
        select: { xp: true },
      })

      if (updatedUser !== null) {
        const newLevel = levelForXp(updatedUser.xp)
        await prisma.user.update({
          where: { id: this.userId },
          data: { level: newLevel },
        })
      }

      return true
    } catch {
      // Unique constraint violation – Badge bereits vorhanden, kein Fehler
      return false
    }
  }

  /**
   * Holt alle Badges aus der DB und prüft anhand der Requirement-Typen.
   * Ruft intern evaluateRequirement auf.
   */
  async checkAll(context: BadgeCheckContext): Promise<BadgeCheckSummary> {
    const allBadges = await prisma.badge.findMany({
      include: { userBadges: { where: { userId: this.userId } } },
    })

    const newlyEarned: string[] = []

    for (const badge of allBadges) {
      // Bereits vorhanden → überspringen
      if (badge.userBadges.length > 0) continue

      const requirement = badge.requirement as BadgeRequirement
      const qualifies = this.evaluateRequirement(requirement, context)

      if (qualifies) {
        const awarded = await this.awardBadge(badge.id, badge.xpReward)
        if (awarded) {
          newlyEarned.push(badge.name)
        }
      }
    }

    return { newlyEarned }
  }

  /**
   * Evaluiert eine BadgeRequirement gegen den aktuellen Kontext.
   * Gibt true zurück wenn die Bedingung erfüllt ist.
   * Requirement-Typen entsprechen exakt den Werten aus prisma/seed.ts.
   */
  private evaluateRequirement(req: BadgeRequirement, ctx: BadgeCheckContext): boolean {
    switch (req.type) {
      case 'training_plan_created':
        return ctx.hasCreatedTrainingPlan

      case 'training_sessions':
        return ctx.totalTrainingSessions >= req.count

      // Zeitbasierte Training-Badges: Erfordern Analyse einzelner Sessions.
      // Werden durch den action-basierten badge-checker.ts abgedeckt.
      case 'sessions_before_hour':
      case 'sessions_after_hour':
      case 'sessions_same_time_of_day':
        return false

      case 'streak_days':
        return ctx.streakDays >= req.days

      case 'recovery_logs':
        // RecoveryLog-Modell noch nicht implementiert
        return false

      case 'meal_logged':
        return ctx.mealLogCount >= req.count

      case 'water_goal_days':
        // WaterLog-Modell noch nicht implementiert
        return false

      case 'meals_logged':
        return ctx.mealLogCount >= req.count

      case 'nutrition_plan_followed_days':
        return ctx.nutritionPlanCount >= req.count

      case 'post_created':
        return ctx.totalPosts >= req.count

      case 'post_likes_received':
        return ctx.postLikesReceived >= req.count

      case 'followers_reached':
        // Follow-Modell noch nicht implementiert
        return false

      case 'comments_written':
        return ctx.commentsWritten >= req.count

      case 'diary_entries':
        // TrainingDiaryEntry-Modell noch nicht implementiert
        return false

      case 'verein_joined':
        return ctx.vereinFollowCount >= 1

      case 'tournament_entered':
        return ctx.tournamentEntryCount >= req.count

      case 'verein_submitted_and_verified':
        // Erfordert separaten Admin-Flow
        return false

      case 'sparring_accepted':
        // SparringRequest-Modell noch nicht implementiert
        return false

      case 'level_reached':
        return ctx.userLevel >= req.level

      // Easter Eggs: Werden durch spezifische Frontend-Aktionen ausgelöst
      case 'training_at_time':
      case 'meal_at_midnight':
      case 'logo_clicks':
      case 'all_faq_opened':
      case 'perfect_week':
        return false

      case 'first_registration':
        return ctx.userRegistrationNumber !== null &&
          ctx.userRegistrationNumber <= 100

      default:
        return false
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// BadgeCheckContext
//
// Wird von der aufrufenden Funktion aufgebaut und an checkAll()
// übergeben. Enthält alle relevanten Zähler des Users.
// ─────────────────────────────────────────────────────────────────

export interface BadgeCheckContext {
  hasCreatedTrainingPlan: boolean
  totalTrainingSessions: number
  streakDays: number
  userLevel: number
  totalPosts: number
  postLikesReceived: number       // Likes erhalten (auf eigene Posts)
  commentsWritten: number
  vereinFollowCount: number
  tournamentEntryCount: number
  nutritionPlanCount: number
  mealLogCount: number            // 0 bis MealLog-Modell implementiert
  userRegistrationNumber: number | null
  lastTrainingCompletedAt: Date | null
}

export interface BadgeCheckSummary {
  newlyEarned: string[]  // Badge-Namen die neu vergeben wurden
}

// ─────────────────────────────────────────────────────────────────
// buildBadgeContext
//
// Hilfsfunktion: Baut den BadgeCheckContext direkt aus der DB auf.
// Kann nach jeder relevanten Aktion aufgerufen werden.
// ─────────────────────────────────────────────────────────────────

export async function buildBadgeContext(userId: string): Promise<BadgeCheckContext> {
  const [
    user,
    totalTrainingSessions,
    hasTrainingPlanCount,
    totalPosts,
    postLikesReceived,
    commentsWritten,
    vereinFollowCount,
    tournamentEntryCount,
    nutritionPlanCount,
    lastSession,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, streakDays: true },
    }),
    prisma.trainingSession.count({ where: { userId } }),
    prisma.trainingPlan.count({ where: { userId } }),
    prisma.post.count({ where: { userId } }),
    // Likes erhalten = Likes auf eigene Posts
    prisma.postLike.count({ where: { post: { userId } } }),
    prisma.postComment.count({ where: { userId } }),
    prisma.vereinFollow.count({ where: { userId } }),
    prisma.tournamentEntry.count({ where: { userId } }),
    prisma.nutritionPlan.count({ where: { userId } }),
    prisma.trainingSession.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),
  ])

  if (user === null) {
    throw new Error(`User ${userId} nicht gefunden`)
  }

  return {
    hasCreatedTrainingPlan: hasTrainingPlanCount > 0,
    totalTrainingSessions,
    streakDays: user.streakDays,
    userLevel: user.level,
    totalPosts,
    postLikesReceived,
    commentsWritten,
    vereinFollowCount,
    tournamentEntryCount,
    nutritionPlanCount,
    mealLogCount: 0, // MealLog-Modell noch nicht implementiert
    userRegistrationNumber: null,  // bei Bedarf separat berechnen
    lastTrainingCompletedAt: lastSession?.completedAt ?? null,
  }
}
