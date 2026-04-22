// ─────────────────────────────────────────────────────────────────
// lib/formulas.ts – Zentrale Berechnungsformeln für SportRise
//
// • Mifflin-St. Jeor BMR
// • TDEE mit Activity-Level
// • Autophagie-Phasen-Calculator
// • Fasting-State-Engine
// • Body Fat Estimation (Navy Method)
// • Makro-Zielberechnung
// ─────────────────────────────────────────────────────────────────

// ── Typen ─────────────────────────────────────────────────────────

export type GenderType = 'MAENNLICH' | 'WEIBLICH' | 'DIVERS'

export type ActivityLevelType =
  | 'SEDENTAER'
  | 'LEICHT_AKTIV'
  | 'MAESSIG_AKTIV'
  | 'AKTIV'
  | 'SEHR_AKTIV'

export interface BMRInput {
  heightCm: number
  weightKg: number
  ageYears: number
  gender: GenderType
}

export interface TDEEInput extends BMRInput {
  activityLevel: ActivityLevelType
}

export interface MacroTargets {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface FastingPhase {
  id: string
  name: string
  description: string
  startHour: number
  endHour: number
  color: string
  icon: string // Lucide icon name
}

export interface CurrentFastingState {
  phase: FastingPhase
  elapsedHours: number
  elapsedMinutes: number
  remainingHours: number
  remainingMinutes: number
  progressPercent: number
  isComplete: boolean
}

// ── Konstanten ────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevelType, number> = {
  SEDENTAER: 1.2,
  LEICHT_AKTIV: 1.375,
  MAESSIG_AKTIV: 1.55,
  AKTIV: 1.725,
  SEHR_AKTIV: 1.9,
}

export const FASTING_PHASES: FastingPhase[] = [
  {
    id: 'digestion',
    name: 'Verdauungsphase',
    description: 'Dein Körper verdaut die letzte Mahlzeit. Insulin ist erhöht.',
    startHour: 0,
    endHour: 4,
    color: '#F59E0B',
    icon: 'Utensils',
  },
  {
    id: 'blood_sugar_drop',
    name: 'Blutzucker sinkt',
    description: 'Insulinspiegel fällt. Dein Körper beginnt, gespeicherte Glukose zu nutzen.',
    startHour: 4,
    endHour: 8,
    color: '#F97316',
    icon: 'TrendingDown',
  },
  {
    id: 'fat_burning_start',
    name: 'Fettverbrennung beginnt',
    description: 'Glykogenspeicher leeren sich. Fettsäuren werden mobilisiert.',
    startHour: 8,
    endHour: 12,
    color: '#EF4444',
    icon: 'Flame',
  },
  {
    id: 'fat_burning_max',
    name: 'Maximale Fettverbrennung',
    description: 'Ketose setzt ein. Dein Körper verbrennt primär Fett als Energiequelle.',
    startHour: 12,
    endHour: 16,
    color: '#DC2626',
    icon: 'Zap',
  },
  {
    id: 'autophagy',
    name: 'Autophagie aktiviert',
    description: 'Zellerneuerung beginnt. Beschädigte Zellbestandteile werden recycelt.',
    startHour: 16,
    endHour: 24,
    color: '#7C3AED',
    icon: 'Sparkles',
  },
  {
    id: 'hgh_boost',
    name: 'HGH-Anstieg',
    description: 'Wachstumshormon steigt stark an. Muskelerhalt und Regeneration werden gefördert.',
    startHour: 24,
    endHour: 72,
    color: '#2563EB',
    icon: 'ArrowUpCircle',
  },
]

export const FASTING_PRESETS: Record<string, { label: string; fastHours: number; eatHours: number }> = {
  F16_8: { label: '16:8', fastHours: 16, eatHours: 8 },
  F18_6: { label: '18:6', fastHours: 18, eatHours: 6 },
  F20_4: { label: '20:4', fastHours: 20, eatHours: 4 },
  F24: { label: '24:0', fastHours: 24, eatHours: 0 },
  CUSTOM: { label: 'Individuell', fastHours: 16, eatHours: 8 },
}

// ── BMR (Mifflin-St. Jeor) ───────────────────────────────────────

export function calculateBMR(input: BMRInput): number {
  const { heightCm, weightKg, ageYears, gender } = input

  if (gender === 'MAENNLICH') {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5
  }
  // WEIBLICH & DIVERS nutzen die weibliche Formel als Basis
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161
}

// ── TDEE ──────────────────────────────────────────────────────────

export function calculateTDEE(input: TDEEInput): number {
  const bmr = calculateBMR(input)
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel]
  return Math.round(bmr * multiplier)
}

// ── Makro-Ziele ───────────────────────────────────────────────────

export function calculateMacroTargets(
  tdee: number,
  proteinPct: number = 30,
  carbsPct: number = 45,
  fatPct: number = 25,
): MacroTargets {
  return {
    calories: tdee,
    proteinG: Math.round((tdee * (proteinPct / 100)) / 4),
    carbsG: Math.round((tdee * (carbsPct / 100)) / 4),
    fatG: Math.round((tdee * (fatPct / 100)) / 9),
  }
}

// ── Fasting State Engine ──────────────────────────────────────────

export function getCurrentFastingState(
  startTime: Date,
  targetDurationHours: number,
  now: Date = new Date(),
): CurrentFastingState {
  const elapsedMs = now.getTime() - startTime.getTime()
  const elapsedTotalMinutes = Math.max(0, Math.floor(elapsedMs / 60000))
  const elapsedHours = Math.floor(elapsedTotalMinutes / 60)
  const elapsedMinutes = elapsedTotalMinutes % 60

  const targetMinutes = targetDurationHours * 60
  const remainingTotalMinutes = Math.max(0, targetMinutes - elapsedTotalMinutes)
  const remainingHours = Math.floor(remainingTotalMinutes / 60)
  const remainingMinutes = remainingTotalMinutes % 60

  const progressPercent = Math.min(100, (elapsedTotalMinutes / targetMinutes) * 100)
  const isComplete = elapsedTotalMinutes >= targetMinutes

  const elapsedHoursFloat = elapsedTotalMinutes / 60

  // Bestimme die aktuelle Phase
  let currentPhase = FASTING_PHASES[0]
  for (const phase of FASTING_PHASES) {
    if (elapsedHoursFloat >= phase.startHour && elapsedHoursFloat < phase.endHour) {
      currentPhase = phase
      break
    }
    if (elapsedHoursFloat >= phase.startHour) {
      currentPhase = phase
    }
  }

  return {
    phase: currentPhase,
    elapsedHours,
    elapsedMinutes,
    remainingHours,
    remainingMinutes,
    progressPercent,
    isComplete,
  }
}

// ── Autophagie-Level ──────────────────────────────────────────────

export function getAutophagyLevel(elapsedHours: number): number {
  if (elapsedHours < 12) return 0
  if (elapsedHours < 16) return Math.round(((elapsedHours - 12) / 4) * 25)
  if (elapsedHours < 24) return 25 + Math.round(((elapsedHours - 16) / 8) * 50)
  if (elapsedHours < 48) return 75 + Math.round(((elapsedHours - 24) / 24) * 25)
  return 100
}

// ── Body Fat Estimation (Navy Method) ─────────────────────────────

export function estimateBodyFat(
  gender: GenderType,
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipCm?: number,
): number {
  if (gender === 'MAENNLICH') {
    const bf =
      495 /
        (1.0324 -
          0.19077 * Math.log10(waistCm - neckCm) +
          0.15456 * Math.log10(heightCm)) -
      450
    return Math.round(Math.max(2, Math.min(60, bf)) * 10) / 10
  }

  // Weiblich / Divers
  const hip = hipCm ?? waistCm * 1.1
  const bf =
    495 /
      (1.29579 -
        0.35004 * Math.log10(waistCm + hip - neckCm) +
        0.221 * Math.log10(heightCm)) -
    450
  return Math.round(Math.max(2, Math.min(60, bf)) * 10) / 10
}

// ── Wassergehalt aus Nahrung (grobe Schätzung) ────────────────────

export function estimateWaterFromFood(totalCalories: number): number {
  // ~0.35ml Wasser pro kcal als Durchschnitt gemischter Ernährung
  return Math.round(totalCalories * 0.35)
}

// ── Alter aus Geburtsjahr ─────────────────────────────────────────

export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear
}
