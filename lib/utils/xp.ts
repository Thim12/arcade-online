import type { LevelInfo } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────────────────────────────

export const MAX_LEVEL = 25
export const XP_MULTIPLIER = 150

// ─────────────────────────────────────────────────────────────────
// Kernformel: XP-Schwelle für Level n
// Formel: n² × 150
// Beispiele:
//   Level 1: 1²  × 150 =    150 XP
//   Level 5: 5²  × 150 =  3.750 XP
//  Level 10: 10² × 150 = 15.000 XP
//  Level 25: 25² × 150 = 93.750 XP
// ─────────────────────────────────────────────────────────────────

/**
 * Gibt die GESAMTE XP zurück, die benötigt wird um Level `n` zu BEGINNEN.
 * Level 1 beginnt bei 0 XP.
 * Level 2 beginnt bei 150 XP (1² × 150).
 * Level n beginnt bei Summe von (i² × 150) für i von 1 bis n-1.
 */
export function totalXpAtLevel(level: number): number {
  if (level <= 1) return 0
  const clampedLevel = Math.min(level, MAX_LEVEL)
  let total = 0
  for (let i = 1; i < clampedLevel; i++) {
    total += i * i * XP_MULTIPLIER
  }
  return total
}

/**
 * Gibt zurück, wie viele XP das Aufsteigen VON Level `n` auf Level `n+1` kostet.
 * (Entspricht n² × 150)
 */
export function xpRequiredForNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity
  return level * level * XP_MULTIPLIER
}

/**
 * Berechnet den aktuellen Level anhand der Gesamt-XP.
 * Level 1 bis MAX_LEVEL.
 */
export function levelForXp(totalXp: number): number {
  if (totalXp < 0) return 1
  let level = 1
  while (level < MAX_LEVEL) {
    const xpNeededForNext = totalXpAtLevel(level + 1)
    if (totalXp < xpNeededForNext) break
    level++
  }
  return level
}

/**
 * Berechnet den XP-Fortschritt innerhalb des aktuellen Levels.
 * Gibt zurück: { xpInCurrentLevel, xpNeededInCurrentLevel, progressPercent }
 */
export function xpProgressInCurrentLevel(totalXp: number): {
  xpInCurrentLevel: number
  xpNeededInCurrentLevel: number
  progressPercent: number
} {
  const level = levelForXp(totalXp)

  if (level >= MAX_LEVEL) {
    return {
      xpInCurrentLevel: 0,
      xpNeededInCurrentLevel: 0,
      progressPercent: 100,
    }
  }

  const xpAtCurrentLevel = totalXpAtLevel(level)
  const xpAtNextLevel = totalXpAtLevel(level + 1)
  const xpInCurrentLevel = totalXp - xpAtCurrentLevel
  const xpNeededInCurrentLevel = xpAtNextLevel - xpAtCurrentLevel
  const progressPercent = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededInCurrentLevel) * 100))

  return {
    xpInCurrentLevel,
    xpNeededInCurrentLevel,
    progressPercent,
  }
}

/**
 * Gibt alle relevanten Level-Informationen für das UI zurück.
 */
export function getLevelInfo(totalXp: number): LevelInfo {
  const level = levelForXp(totalXp)
  const isMaxLevel = level >= MAX_LEVEL
  const xpForCurrentLevel = totalXpAtLevel(level)
  const xpForNextLevel = isMaxLevel ? totalXp : totalXpAtLevel(level + 1)
  const { xpInCurrentLevel, xpNeededInCurrentLevel, progressPercent } =
    xpProgressInCurrentLevel(totalXp)

  return {
    level,
    currentXp: totalXp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpInCurrentLevel,
    xpNeededInCurrentLevel,
    progressPercent,
    isMaxLevel,
  }
}
