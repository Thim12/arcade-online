// ─────────────────────────────────────────────────────────────────
// badge-checker.ts – Badge-Vergabe nach User-Aktionen
//
// Prüft nur die Badges, die für eine bestimmte Aktion relevant sind
// (nicht alle 40 Badges bei jedem Call). Gibt eine Liste neu
// verdienter Badges zurück und schreibt sie in UserBadge.
//
// Verwendung:
//   const newBadges = await checkAndAwardBadges(userId, 'TRAINING_COMPLETED', prisma)
//
// Requirement-Typen entsprechen den Werten aus prisma/seed.ts.
// ─────────────────────────────────────────────────────────────────

import type { PrismaClient, Badge } from '@prisma/client'

// ── Aktions-Typen ────────────────────────────────────────────────

export type BadgeAction =
  | 'TRAINING_PLAN_CREATED'    // Ersten Trainingsplan erstellt
  | 'TRAINING_COMPLETED'       // Trainingseinheit abgeschlossen
  | 'POST_CREATED'             // Community-Post verfasst
  | 'VEREIN_FOLLOWED'          // Einem Verein gefolgt
  | 'TOURNAMENT_ENTERED'       // Für Turnier angemeldet
  | 'NUTRITION_PLAN_CREATED'   // Ernährungsplan erstellt
  | 'MEAL_LOGGED'              // Mahlzeit eingetragen
  | 'LOGIN'                    // User hat sich eingeloggt (für Streak-Badges)
  | 'LEVEL_UP'                 // User hat ein neues Level erreicht

export interface BadgeCheckResult {
  badge: Badge
  xpAwarded: number
}

// ── Badge-Requirement Typen (aus seed.ts) ────────────────────────

interface TrainingSessionsReq { type: 'training_sessions'; count: number }
interface TrainingPlanCreatedReq { type: 'training_plan_created' }
interface StreakDaysReq { type: 'streak_days'; days: number }
interface LevelReachedReq { type: 'level_reached'; level: number }
interface PostCreatedReq { type: 'post_created'; count: number }
interface VereinJoinedReq { type: 'verein_joined' }
interface TournamentEnteredReq { type: 'tournament_entered'; count: number }
interface MealLoggedReq { type: 'meal_logged'; count: number }
interface MealsLoggedReq { type: 'meals_logged'; count: number }

type BadgeRequirementRaw =
  | TrainingSessionsReq
  | TrainingPlanCreatedReq
  | StreakDaysReq
  | LevelReachedReq
  | PostCreatedReq
  | VereinJoinedReq
  | TournamentEnteredReq
  | MealLoggedReq
  | MealsLoggedReq
  | { type: string; [key: string]: unknown }

// ── Hauptfunktion ────────────────────────────────────────────────

/**
 * Prüft alle für die Aktion relevanten Badges und vergibt sie
 * wenn die Voraussetzungen erfüllt sind.
 *
 * @returns Liste der neu verdienten Badges (kann leer sein)
 */
export async function checkAndAwardBadges(
  userId: string,
  action: BadgeAction,
  prisma: PrismaClient,
): Promise<BadgeCheckResult[]> {
  const relevantTypes = getRelevantRequirementTypes(action)
  if (!relevantTypes.length) return []

  // Bereits verdiente Badge-IDs des Users laden
  const earnedBadgeIds = await prisma.userBadge
    .findMany({
      where: { userId },
      select: { badgeId: true },
    })
    .then((rows) => new Set(rows.map((r) => r.badgeId)))

  // Kandidaten: Badges mit passendem requirement.type, noch nicht verdient
  const allBadges = await prisma.badge.findMany({
    where: {
      id: { notIn: Array.from(earnedBadgeIds) },
      isSecret: false,
    },
  })

  // Nur Badges mit relevanten Requirement-Typen filtern
  const candidates = allBadges.filter((badge) => {
    const req = badge.requirement as BadgeRequirementRaw
    return relevantTypes.includes(req.type)
  })

  if (!candidates.length) return []

  // User-Kontext für Requirement-Checks laden
  const context = await loadUserContext(userId, action, prisma)

  const newBadges: BadgeCheckResult[] = []

  for (const badge of candidates) {
    const req = badge.requirement as BadgeRequirementRaw
    const met = await isRequirementMet(req, context)

    if (met) {
      // Sicher upsert – verhindert Race-Condition bei parallelen Requests
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
        update: {},
        create: { userId, badgeId: badge.id },
      })

      newBadges.push({ badge, xpAwarded: badge.xpReward })
    }
  }

  return newBadges
}

// ── Mapping: Aktion → relevante Requirement-Typen ────────────────

function getRelevantRequirementTypes(action: BadgeAction): string[] {
  switch (action) {
    case 'TRAINING_PLAN_CREATED':
      return ['training_plan_created']

    case 'TRAINING_COMPLETED':
      return [
        'training_sessions',
        'sessions_before_hour',
        'sessions_after_hour',
        'sessions_same_time_of_day',
      ]

    case 'POST_CREATED':
      return ['post_created']

    case 'VEREIN_FOLLOWED':
      return ['verein_joined']

    case 'TOURNAMENT_ENTERED':
      return ['tournament_entered']

    case 'MEAL_LOGGED':
      return ['meal_logged', 'meals_logged', 'water_goal_days']

    case 'NUTRITION_PLAN_CREATED':
      return ['nutrition_plan_followed_days']

    case 'LOGIN':
      return ['streak_days']

    case 'LEVEL_UP':
      return ['level_reached']

    default:
      return []
  }
}

// ── User-Kontext für Checks ──────────────────────────────────────

interface UserContext {
  trainingSessionCount: number
  streakDays: number
  level: number
  postCount: number
  tournamentCount: number
  vereinFollowCount: number
  mealCount: number
}

async function loadUserContext(
  userId: string,
  action: BadgeAction,
  prisma: PrismaClient,
): Promise<UserContext> {
  // Nur die für die Aktion nötigen Counts laden (performance)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakDays: true, level: true },
  })

  const [
    trainingSessionCount,
    postCount,
    tournamentCount,
    vereinFollowCount,
  ] = await Promise.all([
    action === 'TRAINING_COMPLETED'
      ? prisma.trainingSession.count({ where: { userId } })
      : Promise.resolve(0),

    action === 'POST_CREATED'
      ? prisma.post.count({ where: { userId } })
      : Promise.resolve(0),

    action === 'TOURNAMENT_ENTERED'
      ? prisma.tournamentEntry.count({ where: { userId } })
      : Promise.resolve(0),

    action === 'VEREIN_FOLLOWED'
      ? prisma.vereinFollow.count({ where: { userId } })
      : Promise.resolve(0),
  ])

  // Mahlzeiten-Count: echte MealLog-Tabelle
  const mealCount =
    action === 'MEAL_LOGGED'
      ? await prisma.mealLog.count({ where: { userId } })
      : 0

  return {
    trainingSessionCount,
    streakDays: user?.streakDays ?? 0,
    level: user?.level ?? 1,
    postCount,
    tournamentCount,
    vereinFollowCount,
    mealCount,
  }
}

// ── Requirement-Prüfung ──────────────────────────────────────────

async function isRequirementMet(
  req: BadgeRequirementRaw,
  ctx: UserContext,
): Promise<boolean> {
  switch (req.type) {
    case 'training_plan_created':
      // Dieser Badge wird einmalig vergeben – caller stellt sicher, dass ein Plan erstellt wurde
      return true

    case 'training_sessions': {
      const r = req as TrainingSessionsReq
      return ctx.trainingSessionCount >= r.count
    }

    case 'streak_days': {
      const r = req as StreakDaysReq
      return ctx.streakDays >= r.days
    }

    case 'level_reached': {
      const r = req as LevelReachedReq
      return ctx.level >= r.level
    }

    case 'post_created': {
      const r = req as PostCreatedReq
      return ctx.postCount >= r.count
    }

    case 'verein_joined':
      return ctx.vereinFollowCount >= 1

    case 'tournament_entered': {
      const r = req as TournamentEnteredReq
      return ctx.tournamentCount >= r.count
    }

    case 'meal_logged': {
      const r = req as MealLoggedReq
      return ctx.mealCount >= r.count
    }

    case 'meals_logged': {
      const r = req as MealsLoggedReq
      return ctx.mealCount >= r.count
    }

    default:
      // Komplexe Requirement-Typen (z.B. sessions_before_hour, easter eggs)
      // werden durch spezifische Events ausgelöst, nicht durch diesen Checker.
      return false
  }
}
