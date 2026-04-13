import { prisma } from '@/lib/prisma'

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

export type AiType = 'training' | 'nutrition' | 'verein' | 'motivation'

// ─────────────────────────────────────────────────────────────────
// Abstrakte Basisklasse
//
// Jede KI-Klasse erbt von BaseAI<TInput, TOutput>.
// TInput  = was die execute()-Methode entgegennimmt
// TOutput = was execute() zurückgibt
//
// Die Basisklasse stellt bereit:
//   - logUsage → schreibt AiUsageLog-Eintrag nach erfolgreichem API-Call
// ─────────────────────────────────────────────────────────────────

export abstract class BaseAI<TInput, TOutput> {
  protected abstract readonly aiType: AiType

  /**
   * Erstellt einen AiUsageLog-Eintrag für den User.
   * Muss nach jedem erfolgreichen API-Call aufgerufen werden.
   */
  protected async logUsage(userId: string, tokensUsed?: number): Promise<void> {
    await prisma.aiUsageLog.create({
      data: {
        userId,
        type: this.aiType,
        tokensUsed: tokensUsed ?? null,
      },
    })
  }

  /**
   * Kernlogik des KI-Calls – wird von den Unterklassen implementiert.
   */
  protected abstract execute(input: TInput): Promise<TOutput>
}
