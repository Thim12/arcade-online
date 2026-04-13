import { createHash } from 'node:crypto'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { BaseAI } from '@/lib/ai/base-ai'
import type { TrainingSession } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────────────────────────────

const MODEL_NAME = 'gemini-1.5-flash'

const MOTIVATION_SYSTEM_PROMPT =
  'Du bist Sportcoach in Deutschland. ' +
  'Gib zu einer Trainingseinheit genau 1–2 ehrliche, konkrete Sätze Feedback. ' +
  'Vermeide leere Floskeln wie "Weiter so!", "Super gemacht!" oder "Klasse!". ' +
  'Sei direkt und beziehe dich auf die konkreten Trainingsdaten. ' +
  'Antworte nur mit dem Feedback-Text, ohne Anführungszeichen oder Formatierung.'

// ─────────────────────────────────────────────────────────────────
// MotivationAI
//
// Erzeugt Kurzfeedback (1–2 Sätze) für eine abgeschlossene Trainingseinheit.
// Das Feedback wird per SHA-256 in session.sessionData gecacht:
//   - motivationFeedbackHash: SHA-256 von "${durationMin}-${xpEarned}-${title}"
//   - motivationFeedback:     generierter Text
//
// Kein Rate-Limit: Motivation-Feedback ist "gratis" (kurze Gemini-Calls,
// gecacht pro Session) und wird nicht in AiUsageLog protokolliert.
// ─────────────────────────────────────────────────────────────────

export class MotivationAI extends BaseAI<TrainingSession, string> {
  protected readonly aiType = 'motivation' as const

  // ── Öffentliche API ──────────────────────────────────────────

  /**
   * Gibt 1–2 Sätze Feedback für die Trainingseinheit zurück.
   *
   * Zuerst wird der SHA-256-Cache in session.sessionData geprüft.
   * Bei Cache-Treffer: sofortige Rückgabe ohne API-Call.
   * Bei Cache-Miss: Gemini-Call → Ergebnis cachen → zurückgeben.
   *
   * Bei Gemini-Fehler: Fallback-Text statt Absturz.
   */
  async generateFeedback(session: TrainingSession): Promise<string> {
    const hash = this.computeHash(session)
    const existingData = this.parseSessionData(session.sessionData)

    // Cache-Treffer
    if (
      typeof existingData['motivationFeedbackHash'] === 'string' &&
      existingData['motivationFeedbackHash'] === hash &&
      typeof existingData['motivationFeedback'] === 'string' &&
      existingData['motivationFeedback'].length > 0
    ) {
      return existingData['motivationFeedback'] as string
    }

    // Cache-Miss → KI aufrufen
    const feedback = await this.execute(session)

    // Ergebnis in sessionData persistieren
    await prisma.trainingSession.update({
      where: { id: session.id },
      data: {
        sessionData: {
          ...existingData,
          motivationFeedback: feedback,
          motivationFeedbackHash: hash,
        } satisfies Prisma.InputJsonValue,
      },
    })

    return feedback
  }

  // ── Interne Methoden ─────────────────────────────────────────

  /**
   * Ruft Gemini auf. Bei Fehler: Fallback-Text.
   * Kein Retry (max 2 Sätze = kurze Antwort, einmalig ausreichend).
   */
  protected async execute(session: TrainingSession): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey === undefined || apiKey === '') {
      return this.fallbackFeedback(session)
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: MOTIVATION_SYSTEM_PROMPT,
    })

    const prompt =
      `Trainingseinheit: "${session.title}"\n` +
      `Dauer: ${session.durationMin} Minuten\n` +
      `Verdiente XP: ${session.xpEarned}\n` +
      (session.notes !== null && session.notes !== undefined && session.notes !== ''
        ? `Eigene Notiz: ${session.notes}\n`
        : '') +
      '\nGib 1–2 Sätze konkretes Feedback zu dieser Einheit.'

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 120,
        },
      })
      const text = result.response.text().trim()
      return text.length > 0 ? text : this.fallbackFeedback(session)
    } catch {
      return this.fallbackFeedback(session)
    }
  }

  /**
   * SHA-256 über die wichtigsten Session-Parameter.
   * Gleiche Session → gleicher Hash → Cache-Treffer.
   */
  private computeHash(session: TrainingSession): string {
    return createHash('sha256')
      .update(`${session.durationMin}-${session.xpEarned}-${session.title}`)
      .digest('hex')
  }

  /**
   * Sicher: parsed session.sessionData als Record, gibt {} zurück wenn leer/ungültig.
   */
  private parseSessionData(raw: Prisma.JsonValue | null): Record<string, Prisma.JsonValue> {
    if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as Record<string, Prisma.JsonValue>
    }
    return {}
  }

  /**
   * Algorithmischer Fallback-Text wenn Gemini nicht verfügbar.
   * Kein leerer String, kein Crash.
   */
  private fallbackFeedback(session: TrainingSession): string {
    if (session.durationMin >= 90) {
      return `${session.durationMin} Minuten sind eine starke Leistung. Gute Regeneration danach ist genauso wichtig.`
    }
    if (session.durationMin < 20) {
      return `Kurze Einheit heute – konsequent dranbleiben ist entscheidend, auch wenn die Zeit knapp ist.`
    }
    return `${session.durationMin} Minuten solide absolviert. Regelmäßigkeit bringt dich weiter als einzelne Ausreißer.`
  }
}

// Singleton-Export
export const motivationAI = new MotivationAI()
