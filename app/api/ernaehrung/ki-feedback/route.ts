// ─────────────────────────────────────────────────────────────────
// POST /api/ernaehrung/ki-feedback
//
// Generiert wöchentliches KI-Ernährungs-Feedback.
// Rate-Limit: 1× pro 7 Tage pro User.
// Speichert Feedback in nutrition_feedbacks Tabelle.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nutritionAI } from '@/lib/ai/nutrition-ai'

const FEEDBACK_TYPE = 'nutrition_feedback'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function POST() {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    // Rate-Limit: 1× pro Woche prüfen
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
    const recentLog = await prisma.aiUsageLog.findFirst({
      where: {
        userId,
        type: FEEDBACK_TYPE,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    })

    if (recentLog !== null) {
      const nextAvailable = new Date(recentLog.createdAt.getTime() + SEVEN_DAYS_MS)
      return Response.json(
        {
          error: 'Rate-Limit: Feedback kann nur 1× pro Woche generiert werden.',
          nextAvailableAt: nextAvailable.toISOString(),
        },
        { status: 429 },
      )
    }

    // KI-Feedback generieren
    const feedbackText = await nutritionAI.generateWeeklyFeedback(userId)

    // Parallel: Feedback speichern + Usage loggen
    const [saved] = await Promise.all([
      prisma.nutritionFeedback.create({
        data: { userId, feedback: feedbackText },
        select: { id: true, createdAt: true },
      }),
      prisma.aiUsageLog.create({
        data: { userId, type: FEEDBACK_TYPE },
      }),
    ])

    return Response.json({
      feedback: feedbackText,
      generatedAt: saved.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[POST /api/ernaehrung/ki-feedback]', error)
    return Response.json(
      { error: 'Feedback konnte nicht generiert werden.' },
      { status: 500 },
    )
  }
}
