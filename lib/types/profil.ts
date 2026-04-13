// ─────────────────────────────────────────────────────────────────
// lib/types/profil.ts – Gemeinsame TypeScript-Typen für
// Profilseite, Entdecken-Seite und Abzeichen-Seite
// ─────────────────────────────────────────────────────────────────

import type { BadgeRarity, SportLevel } from '@prisma/client'

// ── Sport-Kurzinfo ────────────────────────────────────────────────

export interface SportInfo {
  id: string
  name: string
  slug: string
  colorPrimary: string
}

// ── Fußball-spezifische Details (UserSport.details) ───────────────

export interface FussballDetails {
  position?: string
  liga?: string
  vereinName?: string
  hatTeam?: boolean
}

// ── Tennis-spezifische Details ────────────────────────────────────

export interface TennisDetails {
  lk?: string
  spielstil?: string
  lieblingsbelag?: string
  sucheSparringpartner?: boolean
}

// ── Basketball-spezifische Details ────────────────────────────────

export interface BasketballDetails {
  position?: string
  liga?: string
  spielstil?: string
}

export type SportDetails = FussballDetails | TennisDetails | BasketballDetails

// ── UserSport (im Profil) ─────────────────────────────────────────

export interface ProfilUserSport {
  id: string
  level: SportLevel
  details: SportDetails | null
  sport: SportInfo
}

// ── Badge (im Profil / Abzeichen-Seite) ──────────────────────────

export interface ProfilBadge {
  id: string
  name: string
  description: string
  iconName: string
  rarity: BadgeRarity
  xpReward: number
  isSecret: boolean
  requirement: Record<string, unknown>
  sportId: string | null
  sport: SportInfo | null
  earnedAt: string | null     // ISO-String – null wenn nicht verdient
  isEarned: boolean
  progress?: number           // 0–100 Fortschritt für nicht-verdiente Badges
  progressCurrent?: number    // z.B. 17
  progressTotal?: number      // z.B. 25
}

// ── Post (kompaktes Grid-Format) ──────────────────────────────────

export interface ProfilPost {
  id: string
  type: string
  content: string
  title: string | null
  mediaUrl: string | null
  mediaType: string | null
  likeCount: number
  commentCount: number
  createdAt: string
  sport: SportInfo
}

// ── User-Profil (vollständig) ─────────────────────────────────────

export interface ProfilUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  bio: string | null
  level: number
  xp: number
  streakDays: number
  state: string | null
  city: string | null
  isPublicProfile: boolean
  createdAt: string
  sports: ProfilUserSport[]
  topBadges: ProfilBadge[]   // Top 6 für die Showcase-Sektion
  postCount: number
  followerCount: number
  followingCount: number
}

// ── Follower / Following (Modal-Listen) ───────────────────────────

export interface FollowUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  sports: SportInfo[]
}

// ── Entdecken – User-Card ─────────────────────────────────────────

export interface EntdeckenUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  xp: number
  streakDays: number
  state: string | null
  city: string | null
  sports: ProfilUserSport[]
  isFollowedByMe: boolean
  followerCount: number
}

// ── Trending Post (Entdecken-Seite) ──────────────────────────────

export interface TrendingPost {
  id: string
  content: string
  title: string | null
  type: string
  likeCount: number
  commentCount: number
  createdAt: string
  user: {
    name: string | null
    username: string | null
    image: string | null
  }
  sport: SportInfo
}

// ── Leaderboard-Eintrag ───────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  xp: number
  weeklyXP: number
  sport: SportInfo | null
}

// ── Entdecken API Response ────────────────────────────────────────

export interface EntdeckenData {
  nearby: EntdeckenUser[]
  sameSport: EntdeckenUser[]
  similarLevel: EntdeckenUser[]
  trendingPosts: TrendingPost[]
  leaderboard: LeaderboardEntry[]
}
