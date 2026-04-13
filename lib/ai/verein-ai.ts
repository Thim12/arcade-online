import { prisma } from '@/lib/prisma'
import { BaseAI } from '@/lib/ai/base-ai'
import type { SportSlug } from '@/lib/sport-profiles'
import type { SportLevel } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────
// Öffentliche Typen
// ─────────────────────────────────────────────────────────────────

export interface VereinPreferences {
  sportSlug: SportSlug
  userLatitude: number | null
  userLongitude: number | null
  userLevel: SportLevel
  monthlyBudgetEur: number | null  // null = egal
  userBirthYear: number | null
}

export interface VereinScoreBreakdown {
  entfernungScore: number  // 0–40
  niveauScore: number      // 0–30
  preisScore: number       // 0–20
  praeferenzScore: number  // 0–10
}

export interface VereinRecommendation {
  vereinId: string
  name: string
  city: string
  address: string
  state: string
  monthlyFee: number | null
  latitude: number | null
  longitude: number | null
  distanceKm: number | null
  score: number
  scoreBreakdown: VereinScoreBreakdown
  // Phase 2 – Claude (null wenn Claude nicht verfügbar)
  personalizedReason: string | null
  keyBenefit: string | null
  nextStep: string | null
}

// ─────────────────────────────────────────────────────────────────
// Interne Execute-Eingabe
// ─────────────────────────────────────────────────────────────────

interface VereinExecuteInput {
  userId: string
  prefs: VereinPreferences
  top3: VereinRecommendation[]
}

// ─────────────────────────────────────────────────────────────────
// Haversine-Formel
// ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─────────────────────────────────────────────────────────────────
// Phase-1-Scoring-Funktionen (rein algorithmisch)
// ─────────────────────────────────────────────────────────────────

/**
 * EntfernungScore 0–40 nach exakter Spec:
 * 0 km=40, 5 km=37, 10 km=33, 25 km=22, 50 km=10, >100 km=0
 */
function entfernungScore(distKm: number): number {
  if (distKm <= 0)   return 40
  if (distKm <= 5)   return 37
  if (distKm <= 10)  return 33
  if (distKm <= 25)  return 22
  if (distKm <= 50)  return 10
  if (distKm <= 100) return 3
  return 0
}

/**
 * NiveauScore 0–30:
 * Verein 1 Stufe über User = 30 (optimale Herausforderung)
 * Gleich = 20
 * 2 Stufen über = 12
 * 1 Stufe unter = 8
 * 2+ Stufen unter oder 3+ über = 0
 *
 * Da die Verein-Tabelle kein explizites Level-Feld hat, wird das
 * Level aus den Verein-Details abgeleitet oder ein neutraler Wert
 * von 15 verwendet.
 */
const LEVEL_ORDER: SportLevel[] = ['ANFAENGER', 'FORTGESCHRITTENE', 'WETTKAMPF', 'PROFI']

function niveauScore(userLevel: SportLevel, vereinLevel: SportLevel | null): number {
  if (vereinLevel === null) return 15  // neutral wenn unbekannt

  const userIdx = LEVEL_ORDER.indexOf(userLevel)
  const vereinIdx = LEVEL_ORDER.indexOf(vereinLevel)
  const diff = vereinIdx - userIdx

  if (diff === 1)  return 30  // Verein eine Stufe über User = ideal
  if (diff === 0)  return 20  // gleiche Stufe
  if (diff === 2)  return 12  // zwei Stufen über
  if (diff === -1) return 8   // eine Stufe unter
  return 0
}

/**
 * PreisScore 0–20:
 * Im Budget = 20, bis 10€ über Budget = 12, darüber = 0
 * Kein Budget angegeben: kostenlos=20, bis 25€=12, darüber=5
 */
function preisScore(monthlyFee: number | null, budget: number | null): number {
  const fee = monthlyFee ?? 0

  if (budget !== null) {
    if (fee <= budget)         return 20
    if (fee <= budget + 10)    return 12
    return 0
  }

  // Fallback ohne Budget
  if (fee === 0)   return 20
  if (fee <= 25)   return 12
  return 5
}

/**
 * PräferenzScore 0–10:
 * Verifizierter Verein = +5
 * Hat Jugendteam (relevant für User unter 25) = +5
 */
function praeferenzScore(
  isVerified: boolean,
  hasYouthTeam: boolean,
  userBirthYear: number | null,
): number {
  let score = 0
  if (isVerified) score += 5

  const userAge = userBirthYear !== null ? new Date().getFullYear() - userBirthYear : null
  if (hasYouthTeam && userAge !== null && userAge < 25) score += 5

  return score
}

// ─────────────────────────────────────────────────────────────────
// Claude-Response-Typ (raw fetch)
// ─────────────────────────────────────────────────────────────────

interface ClaudeTextContent {
  type: 'text'
  text: string
}

interface ClaudeResponse {
  id: string
  type: 'message'
  content: ClaudeTextContent[]
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

interface PersonalizedReason {
  personalizedReason: string
  keyBenefit: string
  nextStep: string
}

// ─────────────────────────────────────────────────────────────────
// VereinAI
// ─────────────────────────────────────────────────────────────────

export class VereinAI extends BaseAI<VereinExecuteInput, VereinRecommendation[]> {
  protected readonly aiType = 'verein' as const

  // ── Öffentliche API ──────────────────────────────────────────

  /**
   * Empfiehlt Vereine für den User.
   *
   * Phase 1 (kein API): Alle verifizierten Vereine der Sportart aus der DB laden
   *   und algorithmisch bewerten.
   * Phase 2 (Claude): Für die Top-3 personalisierte Begründungen generieren.
   *   Bei Claude-Fehler: graceful degradation ohne Begründungstext.
   */
  async recommend(userId: string, prefs: VereinPreferences): Promise<VereinRecommendation[]> {
    // Phase 1: DB laden + algorithmisch bewerten (kein Rate-Limit)
    const top10 = await this.phase1Score(prefs)

    if (top10.length === 0) return []

    const top3 = top10.slice(0, 3)

    // Phase 2: Claude-Call für Top-3 mit personalisierten Begründungen
    const withReasons = await this.execute({ userId, prefs, top3 })
    await this.logUsage(userId)

    // Top-3 mit Begründungen + restliche 7 ohne Begründung kombinieren
    const remainingIds = new Set(withReasons.map((r) => r.vereinId))
    const remaining = top10.slice(3).filter((r) => !remainingIds.has(r.vereinId))

    return [...withReasons, ...remaining]
  }

  // ── Phase 1: Algorithmisches Scoring ────────────────────────

  private async phase1Score(prefs: VereinPreferences): Promise<VereinRecommendation[]> {
    const sport = await prisma.sport.findUnique({
      where: { slug: prefs.sportSlug },
      select: { id: true },
    })

    if (sport === null) return []

    const vereine = await prisma.verein.findMany({
      where: {
        sportId: sport.id,
        isVerified: true,
        status: 'VERIFIED',
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        state: true,
        monthlyFee: true,
        latitude: true,
        longitude: true,
        isVerified: true,
        hasYouthTeam: true,
      },
      take: 100,
    })

    if (vereine.length === 0) return []

    const scored: VereinRecommendation[] = vereine.map((v) => {
      const distKm =
        prefs.userLatitude !== null &&
        prefs.userLongitude !== null &&
        v.latitude !== null &&
        v.longitude !== null
          ? haversineKm(prefs.userLatitude, prefs.userLongitude, v.latitude, v.longitude)
          : null

      const eScore = distKm !== null ? entfernungScore(distKm) : 15  // neutral ohne GPS
      const nScore = niveauScore(prefs.userLevel, null)               // kein Level im DB-Modell
      const pScore = preisScore(v.monthlyFee, prefs.monthlyBudgetEur)
      const pfScore = praeferenzScore(v.isVerified, v.hasYouthTeam, prefs.userBirthYear)

      return {
        vereinId: v.id,
        name: v.name,
        city: v.city,
        address: v.address,
        state: v.state,
        monthlyFee: v.monthlyFee,
        latitude: v.latitude,
        longitude: v.longitude,
        distanceKm: distKm !== null ? Math.round(distKm * 10) / 10 : null,
        score: eScore + nScore + pScore + pfScore,
        scoreBreakdown: {
          entfernungScore: eScore,
          niveauScore: nScore,
          preisScore: pScore,
          praeferenzScore: pfScore,
        },
        personalizedReason: null,
        keyBenefit: null,
        nextStep: null,
      }
    })

    return scored.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // ── Phase 2: Claude personalisierte Begründungen ─────────────

  /**
   * Ruft Claude 3.5 Haiku via raw fetch auf.
   * Gibt null zurück bei Fehler (graceful degradation).
   */
  private async getPersonalizedReason(
    verein: VereinRecommendation,
    prefs: VereinPreferences,
  ): Promise<PersonalizedReason | null> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey === undefined || apiKey === '') return null

    const levelLabels: Record<SportLevel, string> = {
      ANFAENGER: 'Anfänger',
      FORTGESCHRITTENE: 'Fortgeschrittene',
      WETTKAMPF: 'Wettkampfsportler',
      PROFI: 'Profi',
    }

    const prompt =
      `Du berätst einen ${levelLabels[prefs.userLevel]}-Sportler in Deutschland bei der Vereinssuche.\n\n` +
      `Verein: ${verein.name} in ${verein.city}\n` +
      `Monatsbeitrag: ${verein.monthlyFee !== null ? `${verein.monthlyFee}€` : 'kostenlos oder auf Anfrage'}\n` +
      (verein.distanceKm !== null ? `Entfernung: ca. ${verein.distanceKm} km\n` : '') +
      (prefs.monthlyBudgetEur !== null ? `Budget des Sportlers: ${prefs.monthlyBudgetEur}€/Monat\n` : '') +
      `\nSchreibe auf Deutsch eine persönliche Empfehlung in max. 2 Sätzen.\n` +
      `Antworte NUR mit diesem JSON (kein Markdown):\n` +
      `{"personalizedReason":"...","keyBenefit":"1 konkreter Vorteil","nextStep":"Was der Sportler jetzt tun soll"}`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 250,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(15_000),
      })

      if (!response.ok) return null

      const data: ClaudeResponse = (await response.json()) as ClaudeResponse
      const text = data.content.find((c) => c.type === 'text')?.text ?? ''

      // JSON aus der Antwort extrahieren (Claude könnte trotz Anweisung Markdown nutzen)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch === null) return null

      const parsed = JSON.parse(jsonMatch[0]) as PersonalizedReason

      if (
        typeof parsed.personalizedReason !== 'string' ||
        typeof parsed.keyBenefit !== 'string' ||
        typeof parsed.nextStep !== 'string'
      ) {
        return null
      }

      return parsed
    } catch {
      // Netzwerkfehler, Timeout, JSON-Parse-Fehler → graceful degradation
      return null
    }
  }

  /**
   * Phase 2: Ruft Claude für die Top-3 auf und ergänzt die Begründungen.
   * Fehler bei einzelnen Verein-Calls werden abgefangen (kein Abbruch des Gesamtergebnisses).
   */
  protected async execute(input: VereinExecuteInput): Promise<VereinRecommendation[]> {
    const withReasons = await Promise.all(
      input.top3.map(async (rec): Promise<VereinRecommendation> => {
        const reason = await this.getPersonalizedReason(rec, input.prefs)
        if (reason === null) return rec

        return {
          ...rec,
          personalizedReason: reason.personalizedReason,
          keyBenefit: reason.keyBenefit,
          nextStep: reason.nextStep,
        }
      }),
    )

    return withReasons
  }
}

// Singleton-Export
export const vereinAI = new VereinAI()
