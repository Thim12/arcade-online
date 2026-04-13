// ─────────────────────────────────────────────────────────────────
// POST /api/training/session/complete
//
// Speichert eine abgeschlossene Trainingseinheit, vergibt XP,
// prüft Badges und Easter Eggs, gibt Motivations-Feedback zurück.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { awardXP } from '@/lib/xp'
import { checkAndAwardBadges } from '@/lib/badge-checker'
import { checkNightTrainingEasterEgg, checkPerfectWeekEasterEgg } from '@/lib/ai/easter-eggs'
import { trainingAI } from '@/lib/ai/training-ai'
import type { PrismaClient } from '@prisma/client'

// ── Request-Typ ──────────────────────────────────────────────────

interface CompleteSessionBody {
  planId: string
  weekNumber: number
  dayName: string          // z.B. "Montag"
  durationMin: number
  mood: number             // 1–5
  notes?: string
  completedExerciseNames: string[]
}

// ── XP-Berechnung ────────────────────────────────────────────────

function calculateXP(durationMin: number, mood: number): number {
  const base = 75
  const durationBonus = Math.max(0, durationMin - 20)   // +1 XP pro Minute über 20
  const moodBonus = mood === 5 ? 25 : mood === 4 ? 10 : 0
  return Math.min(350, base + durationBonus + moodBonus)
}

// ── Streak-Aktualisierung ────────────────────────────────────────

async function updateStreakAfterSession(
  userId: string,
  completedAt: Date,
  db: PrismaClient,
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastTrainedAt: true, streakDays: true, longestStreak: true },
  })

  if (user === null) return

  const today = new Date(completedAt)
  today.setHours(0, 0, 0, 0)

  const msPerDay = 24 * 60 * 60 * 1000

  let newStreak: number

  if (user.lastTrainedAt === null) {
    newStreak = 1
  } else {
    const lastDate = new Date(user.lastTrainedAt)
    lastDate.setHours(0, 0, 0, 0)
    const diffDays = Math.round((today.getTime() - lastDate.getTime()) / msPerDay)

    if (diffDays === 0) {
      // Bereits heute trainiert → Streak nicht ändern
      return
    } else if (diffDays === 1) {
      newStreak = user.streakDays + 1
    } else {
      newStreak = 1
    }
  }

  await db.user.update({
    where: { id: userId },
    data: {
      lastTrainedAt: completedAt,
      streakDays: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
    },
  })
}

// ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  let body: CompleteSessionBody
  try {
    body = (await req.json()) as CompleteSessionBody
  } catch {
    return Response.json({ error: 'Ungültiger Request-Body.' }, { status: 400 })
  }

  const { planId, weekNumber, dayName, durationMin, mood, notes, completedExerciseNames } = body

  if (
    typeof planId !== 'string' ||
    typeof weekNumber !== 'number' ||
    typeof dayName !== 'string' ||
    typeof durationMin !== 'number' ||
    typeof mood !== 'number'
  ) {
    return Response.json({ error: 'Pflichtfelder fehlen oder haben falschen Typ.' }, { status: 400 })
  }

  try {
    const completedAt = new Date()
    const xpEarned = calculateXP(durationMin, mood)

    const sessionTitle = `${dayName} – Woche ${weekNumber} (${durationMin} Min)`

    // TrainingSession speichern
    const trainingSession = await prisma.trainingSession.create({
      data: {
        userId,
        planId,
        title: sessionTitle,
        durationMin,
        xpEarned,
        notes: notes ?? null,
        completedAt,
        sessionData: {
          weekNumber,
          dayName,
          mood,
          completedExerciseNames: completedExerciseNames ?? [],
        },
      },
    })

    // XP vergeben und Level berechnen
    const xpResult = await awardXP(userId, xpEarned, prisma)

    // Streak aktualisieren
    await updateStreakAfterSession(userId, completedAt, prisma)

    // Badges prüfen (parallel mit Easter Eggs)
    const [newBadges, nightEgg, perfectWeekEgg] = await Promise.all([
      checkAndAwardBadges(userId, 'TRAINING_COMPLETED', prisma),
      checkNightTrainingEasterEgg(userId, completedAt, prisma),
      checkPerfectWeekEasterEgg(userId, prisma),
    ])

    // Level-Up Badge prüfen wenn Level gestiegen
    const levelBadges = xpResult.leveledUp
      ? await checkAndAwardBadges(userId, 'LEVEL_UP', prisma)
      : []

    const allNewBadges = [...newBadges, ...levelBadges]

    // Motivations-Feedback (kein await blockieren – fire and forget, dann holen)
    let motivationFeedback = ''
    try {
      motivationFeedback = await trainingAI.generateSessionFeedback(trainingSession)
    } catch {
      motivationFeedback = `${durationMin} Minuten solide absolviert. Regelmäßigkeit bringt dich weiter als einzelne Ausreißer.`
    }

    // Easter-Egg XP-Bonus berechnen (aus den Eggs selbst schon vergeben,
    // nur zur Anzeige summieren)
    const easterEggXpBonus = (nightEgg ? 999 : 0) + (perfectWeekEgg ? 333 : 0)

    return Response.json({
      success: true,
      data: {
        session: {
          id: trainingSession.id,
          title: trainingSession.title,
          durationMin: trainingSession.durationMin,
          xpEarned: trainingSession.xpEarned,
          completedAt: trainingSession.completedAt.toISOString(),
        },
        xp: {
          earned: xpEarned,
          newTotal: xpResult.newXP,
          newLevel: xpResult.newLevel,
          leveledUp: xpResult.leveledUp,
        },
        easterEggXpBonus,
        motivationFeedback,
        newBadges: allNewBadges.map((b) => ({
          id: b.badge.id,
          name: b.badge.name,
          description: b.badge.description,
          iconName: b.badge.iconName,
          rarity: b.badge.rarity,
          xpReward: b.xpAwarded,
        })),
        attribution: 'Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform',
      },
    })
  } catch (error) {
    console.error('[POST /api/training/session/complete]', error)
    return Response.json({ error: 'Session konnte nicht gespeichert werden.' }, { status: 500 })
  }
}
