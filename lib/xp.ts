// ─────────────────────────────────────────────────────────────────
// xp.ts – XP- und Level-System
//
// Formel: Um Level n zu erreichen, sind folgende kumulierte XP nötig:
//   xpForLevel(n) = 150 × Σ(i=1 bis n-1)(i²)
//                 = 150 × (n-1) × n × (2n-1) / 6
//
// XP innerhalb eines Levels (von Level n zu n+1):
//   n² × 150
//
// Beispiele:
//   Level 1 →  0 XP          (braucht 150 XP bis Level 2)
//   Level 2 →  150 XP        (braucht 600 XP bis Level 3)
//   Level 3 →  750 XP        (braucht 1350 XP bis Level 4)
//   Level 4 →  2.100 XP      (braucht 2400 XP bis Level 5)
//   Level 5 →  4.500 XP      (braucht 3750 XP bis Level 6)
//
// Max-Level: 25 (entspricht dem "Level 25" Legendary-Badge)
// ─────────────────────────────────────────────────────────────────

import type { PrismaClient } from '@prisma/client'

export const MAX_LEVEL = 25

// ── XP-Schwellenwerte ────────────────────────────────────────────

/**
 * Berechnet die kumulierten XP, die benötigt werden um Level n zu erreichen.
 * Level 1 = 0 XP (Startpunkt).
 */
export function xpThreshold(level: number): number {
  if (level <= 1) return 0
  const n = level - 1
  // Summe der Quadrate 1² + 2² + ... + n² = n(n+1)(2n+1)/6
  return 150 * Math.floor((n * (n + 1) * (2 * n + 1)) / 6)
}

/**
 * XP die innerhalb des angegebenen Levels benötigt werden (von Level n zu n+1).
 * Formel: n² × 150
 */
export function xpPerLevel(level: number): number {
  return level * level * 150
}

// ── Level-Berechnung ─────────────────────────────────────────────

/**
 * Gibt das aktuelle Level für eine gegebene Gesamt-XP-Zahl zurück.
 * Capped bei MAX_LEVEL (25).
 */
export function calculateLevel(totalXP: number): number {
  let level = 1
  while (level < MAX_LEVEL && xpThreshold(level + 1) <= totalXP) {
    level++
  }
  return level
}

// ── XP-Fortschritt ───────────────────────────────────────────────

export interface XpProgress {
  level: number
  currentXP: number       // Gesamt-XP des Users
  currentLevelXP: number  // XP am Anfang des aktuellen Levels
  nextLevelXP: number     // XP die für das nächste Level benötigt werden (kumuliert)
  xpInLevel: number       // Fortschritt innerhalb des aktuellen Levels
  xpNeededInLevel: number // Gesamte XP die dieses Level braucht (n² × 150)
  xpToNextLevel: number   // Noch fehlende XP bis zum nächsten Level
  percentage: number      // Fortschritt 0–100
  isMaxLevel: boolean
}

/**
 * Gibt detaillierte Fortschrittsinformationen für die XP-Anzeige zurück.
 */
export function getXPProgress(totalXP: number): XpProgress {
  const level = calculateLevel(totalXP)
  const isMaxLevel = level >= MAX_LEVEL

  const currentLevelXP = xpThreshold(level)
  const nextLevelXP = xpThreshold(level + 1)
  const xpInLevel = totalXP - currentLevelXP
  const xpNeededInLevel = xpPerLevel(level) // = level² × 150

  const xpToNextLevel = isMaxLevel ? 0 : Math.max(0, nextLevelXP - totalXP)
  const percentage = isMaxLevel
    ? 100
    : Math.min(100, Math.floor((xpInLevel / xpNeededInLevel) * 100))

  return {
    level,
    currentXP: totalXP,
    currentLevelXP,
    nextLevelXP,
    xpInLevel,
    xpNeededInLevel,
    xpToNextLevel,
    percentage,
    isMaxLevel,
  }
}

// ── XP Vergabe ───────────────────────────────────────────────────

export interface AwardXPResult {
  newXP: number
  newLevel: number
  leveledUp: boolean
  xpGained: number
}

/**
 * Vergibt XP an einen User und aktualisiert sein Level.
 * Gibt zurück ob ein Level-Up stattgefunden hat.
 *
 * @param userId    - Prisma User ID
 * @param amount    - XP-Betrag (muss > 0 sein)
 * @param prisma    - Prisma-Instanz (dependency injection für Testbarkeit)
 */
export async function awardXP(
  userId: string,
  amount: number,
  prisma: PrismaClient,
): Promise<AwardXPResult> {
  // Edge-Cases
  if (amount <= 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    })
    const currentXP = user?.xp ?? 0
    return {
      newXP: currentXP,
      newLevel: user?.level ?? 1,
      leveledUp: false,
      xpGained: 0,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  })

  if (!user) {
    throw new Error(`[xp] User ${userId} nicht gefunden.`)
  }

  const newXP = user.xp + amount
  const newLevel = calculateLevel(newXP)
  const leveledUp = newLevel > user.level

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel },
  })

  return { newXP, newLevel, leveledUp, xpGained: amount }
}
