// ─────────────────────────────────────────────────────────────────
// rate-limiter.ts – KI Usage-Log Utility (API-Route Wrapper)
//
// Schlanker Wrapper um die Usage-Log-Logik aus base-ai.ts.
// Für die direkte Verwendung in Next.js API-Routes ohne Klassen-Instanz.
// ─────────────────────────────────────────────────────────────────

import type { PrismaClient } from '@prisma/client'

export type AiType = 'training' | 'nutrition' | 'verein' | 'motivation'

const MONTHLY_PLAN_LIMIT = 3

// ── Öffentliche Funktionen ───────────────────────────────────────

/**
 * Loggt eine KI-Nutzung in der DB.
 * Muss nach jedem erfolgreichen API-Call aufgerufen werden.
 */
export async function logKIUsage(
  userId: string,
  type: AiType,
  prisma: PrismaClient,
  tokensUsed?: number,
): Promise<void> {
  await prisma.aiUsageLog.create({
    data: {
      userId,
      type,
      tokensUsed: tokensUsed ?? null,
    },
  })
}

/**
 * Prüft ob ein User das monatliche KI-Limit erreicht hat.
 * Gibt allowed=false zurück wenn count >= 3.
 */
export async function checkKILimit(
  userId: string,
  type: AiType,
  prisma: PrismaClient,
): Promise<{ allowed: boolean; usedThisMonth: number; resetDate: Date }> {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const count = await prisma.aiUsageLog.count({
    where: {
      userId,
      type,
      createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
    },
  })

  return {
    allowed: count < MONTHLY_PLAN_LIMIT,
    usedThisMonth: count,
    resetDate: firstOfNextMonth,
  }
}
