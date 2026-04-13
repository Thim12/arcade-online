// ─────────────────────────────────────────────────────────────────
// Zentrale App-Typen für SportRise.de
// ─────────────────────────────────────────────────────────────────

import type {
  User,
  Sport,
  UserSport,
  Badge,
  UserBadge,
  TrainingPlan,
  TrainingSession,
  Verein,
  Tournament,
  Post,
  PostLike,
  PostComment,
  NutritionPlan,
  AiUsageLog,
  Notification,
  SportLevel,
  BadgeRarity,
  GermanState,
  UserGoal,
  PostType,
  TournamentStatus,
  VereinStatus,
  NotificationType,
} from '@prisma/client'

// Re-Export Prisma Enums für einfachen Zugriff
export type {
  SportLevel,
  BadgeRarity,
  GermanState,
  UserGoal,
  PostType,
  TournamentStatus,
  VereinStatus,
  NotificationType,
}

// Re-Export Prisma Models
export type {
  User,
  Sport,
  UserSport,
  Badge,
  UserBadge,
  TrainingPlan,
  TrainingSession,
  Verein,
  Tournament,
  Post,
  PostLike,
  PostComment,
  NutritionPlan,
  AiUsageLog,
  Notification,
}

// ─────────────────────────────────────────────────────────────────
// BADGE REQUIREMENT – Discriminated Union
// Badge.requirement wird als Json in DB gespeichert;
// diese Typen geben der Laufzeit-Prüfung Struktur.
// ─────────────────────────────────────────────────────────────────

export type BadgeRequirement =
  | { type: 'training_plan_created' }
  | { type: 'training_sessions'; count: number }
  | { type: 'sessions_before_hour'; hour: number; count: number }
  | { type: 'sessions_after_hour'; hour: number; count: number }
  | { type: 'sessions_same_time_of_day'; count: number }
  | { type: 'streak_days'; days: number }
  | { type: 'recovery_logs'; count: number }
  | { type: 'meal_logged'; count: number }
  | { type: 'water_goal_days'; count: number }
  | { type: 'meals_logged'; count: number }
  | { type: 'nutrition_plan_followed_days'; count: number }
  | { type: 'post_created'; count: number }
  | { type: 'post_likes_received'; count: number }
  | { type: 'followers_reached'; count: number }
  | { type: 'comments_written'; count: number }
  | { type: 'diary_entries'; count: number }
  | { type: 'verein_joined' }
  | { type: 'tournament_entered'; count: number }
  | { type: 'verein_submitted_and_verified' }
  | { type: 'sparring_accepted'; count: number }
  | { type: 'level_reached'; level: number }
  | { type: 'training_at_time'; hour: number; minuteMin: number; minuteMax: number; count: number }
  | { type: 'meal_at_midnight'; hour: number }
  | { type: 'logo_clicks'; count: number }
  | { type: 'all_faq_opened' }
  | { type: 'first_registration' }
  | { type: 'perfect_week'; count: number }

// ─────────────────────────────────────────────────────────────────
// XP / LEVEL
// ─────────────────────────────────────────────────────────────────

export interface LevelInfo {
  level: number
  currentXp: number
  xpForCurrentLevel: number  // XP am Start von diesem Level
  xpForNextLevel: number     // XP die für Level+1 benötigt werden (Gesamtmenge)
  xpInCurrentLevel: number   // Fortschritt in diesem Level
  xpNeededInCurrentLevel: number // Gesamte XP die dieses Level braucht
  progressPercent: number    // 0–100
  isMaxLevel: boolean
}

// ─────────────────────────────────────────────────────────────────
// STREAK
// ─────────────────────────────────────────────────────────────────

export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  isActiveToday: boolean      // Hat user heute trainiert?
  lastTrainedAt: Date | null
}

// ─────────────────────────────────────────────────────────────────
// SPORT CONFIG (Frontend-seitig für UI-Rendering)
// ─────────────────────────────────────────────────────────────────

export interface SportConfig {
  slug: string
  name: string
  iconName: string
  colorPrimary: string
  colorLight: string
  colorGlow: string
  isActive: boolean
}

// ─────────────────────────────────────────────────────────────────
// AI ATTRIBUTION
// ─────────────────────────────────────────────────────────────────

export interface AiAttribution {
  model: string      // z.B. "Gemini 1.5 Flash"
  disclaimer: string // z.B. "Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform"
  generatedAt: Date
}

// ─────────────────────────────────────────────────────────────────
// AI TRAINING OUTPUT
// ─────────────────────────────────────────────────────────────────

export interface TrainingExercise {
  name: string
  setsOrDuration: string   // z.B. "3 x 12 Wdh." oder "20 Minuten"
  description: string
  tip: string | null       // Technik-Tipp, null wenn nicht vorhanden
}

export interface TrainingDay {
  dayLabel: string          // z.B. "Tag 1 – Technik"
  durationMin: number
  focusArea: string         // z.B. "Dribbling & Ballkontrolle"
  exercises: TrainingExercise[]
  warmup: string
  cooldown: string
}

export interface TrainingWeek {
  weekNumber: number
  theme: string            // z.B. "Grundlagen"
  days: TrainingDay[]
}

export interface AiTrainingPlanResult {
  title: string
  description: string
  totalWeeks: number
  sessionsPerWeek: number
  weeks: TrainingWeek[]
  attribution: AiAttribution
}

// ─────────────────────────────────────────────────────────────────
// AI NUTRITION OUTPUT
// ─────────────────────────────────────────────────────────────────

export interface Mahlzeit {
  name: string              // z.B. "Frühstück"
  gericht: string           // z.B. "Haferflocken mit Beeren"
  kalorien: number
  proteinG: number
  kohlenhydrateG: number
  fettG: number
  zubereitung: string
}

export interface Tagesplan {
  wochentag: string         // z.B. "Montag"
  gesamtKalorien: number
  mahlzeiten: Mahlzeit[]
}

export interface EinkaufslistenItem {
  kategorie: string         // z.B. "Obst & Gemüse"
  produkte: Array<{
    name:     string        // z.B. "Hähnchenbrust"
    menge:    string        // z.B. "500g"
    preisEur: number        // z.B. 4.99
  }>
}

export interface AiNutritionPlanResult {
  title: string
  beschreibung: string
  tagesKalorienZiel: number
  wochenplan: Tagesplan[]
  einkaufsliste: EinkaufslistenItem[]
  gesamtpreisEur: number
  tipps: string[]
  attribution: AiAttribution
}

// ─────────────────────────────────────────────────────────────────
// VEREIN SCORING (VereinAI – algorithmic)
// ─────────────────────────────────────────────────────────────────

export interface VereinScoringInput {
  vereinId: string
  userLatitude: number
  userLongitude: number
  vereinLatitude: number
  vereinLongitude: number
  userLevel: SportLevel
  vereinHatLevel: SportLevel[]    // Welche Level der Verein anbietet
  userAgeYear: number             // Geburtsjahr des Users
  vereinAgeMin: number | null
  vereinAgeMax: number | null
  vereinMonthlyFee: number | null // null = kostenlos/unbekannt
  isVerified: boolean
  vereinSportFeatureScore: number // 0–15, vom Aufrufer berechnet
}

export interface VereinScoringResult {
  vereinId: string
  totalScore: number              // 0–115
  breakdown: {
    distanzPunkte: number         // 0–40
    niveauPunkte: number          // 0–25
    alterPunkte: number           // 0–20
    preisPunkte: number           // 0–10
    sportFeaturePunkte: number    // 0–15
    verifiziertBonus: number      // 0 oder 5
  }
}

// ─────────────────────────────────────────────────────────────────
// API RESPONSE WRAPPER
// ─────────────────────────────────────────────────────────────────

export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = { success: false; error: string; code?: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}
