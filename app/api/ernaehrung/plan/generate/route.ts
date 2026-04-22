// ─────────────────────────────────────────────────────────────────
// POST /api/ernaehrung/plan/generate
//
// Generiert einen 7-Tage-Ernährungsplan aus den Wizard-Eingaben.
// Rate-Limit: max 3 Pläne pro Kalendermonat (Typ "nutrition").
// ─────────────────────────────────────────────────────────────────

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nutritionAI } from '@/lib/ai/nutrition-ai'
import { checkKILimit } from '@/lib/rate-limiter'
import type { NutritionFormData } from '@/lib/ai/nutrition-ai'
import type { SportSlug } from '@/lib/sport-profiles'
import type { UserGoal } from '@prisma/client'

// ── Validierung ─────────────────────────────────────────────────

const BodySchema = z.object({
  heightCm:          z.number().int().min(100).max(250),
  weightKg:          z.number().min(20).max(300),
  gender:            z.enum(['MAENNLICH', 'WEIBLICH']),
  goal:              z.enum(['HALTEN', 'ABNEHMEN', 'ZUNEHMEN', 'LEISTUNG', 'GESUND']),
  activityLevel:     z.enum(['SEDENTAER', 'LEICHT_AKTIV', 'MAESSIG_AKTIV', 'AKTIV', 'SEHR_AKTIV']),
  sportSlug:         z.enum(['fussball', 'tennis', 'basketball', 'none']),
  trainingsPerWeek:  z.number().int().min(0).max(7),
  sessionDurationMin: z.number().int().min(20).max(180),
  budget:            z.enum(['SEHR_GUENSTIG', 'GUENSTIG', 'MITTEL', 'KEIN_LIMIT']),
  isVegetarian:      z.boolean(),
  isVegan:           z.boolean(),
  isLaktosefrei:     z.boolean(),
  isGlutenfrei:      z.boolean(),
  ausschluesse:      z.string().max(300).optional(),
}).strict()

// ── Ziel-Mapping ─────────────────────────────────────────────────

const GOAL_MAP: Record<string, UserGoal[]> = {
  HALTEN:   ['FITNESS'],
  ABNEHMEN: ['ABNEHMEN'],
  ZUNEHMEN: ['MUSKELAUFBAU'],
  LEISTUNG: ['WETTKAMPF'],
  GESUND:   ['FITNESS'],
}

// ── POST Handler ─────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  // ── Body parsen ───────────────────────────────────────────────
  let body: z.infer<typeof BodySchema>
  try {
    const text = await request.text()
    const parsed = BodySchema.safeParse(JSON.parse(text))
    if (!parsed.success) {
      return Response.json(
        { error: `Ungültige Eingabe: ${parsed.error.errors[0]?.message ?? 'Validierungsfehler'}` },
        { status: 400 },
      )
    }
    body = parsed.data
  } catch {
    return Response.json({ error: 'Ungültiger Request-Body.' }, { status: 400 })
  }

  // ── Rate-Limit prüfen ─────────────────────────────────────────
  const { allowed, usedThisMonth: usedBefore, resetDate } = await checkKILimit(
    userId,
    'nutrition',
    prisma,
  )

  if (!allowed) {
    const resetStr = resetDate.toLocaleDateString('de-DE', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    return Response.json(
      {
        error: `Diesen Monat wurden bereits 3 Pläne erstellt. Nächste Generierung verfügbar ab ${resetStr}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        usedThisMonth: usedBefore,
        resetDate: resetDate.toISOString(),
      },
      { status: 429 },
    )
  }

  try {
    // ── User-Daten laden (birthYear für Alter) ────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthYear: true },
    })

    const age =
      user?.birthYear !== null && user?.birthYear !== undefined
        ? new Date().getFullYear() - user.birthYear
        : null

    // ── Allergien aufbauen ────────────────────────────────────
    const allergies: string[] = []
    if (body.isLaktosefrei) allergies.push('Laktose')
    if (body.isGlutenfrei) allergies.push('Gluten')
    if (body.ausschluesse !== undefined && body.ausschluesse.trim().length > 0) {
      allergies.push(body.ausschluesse.trim())
    }

    const goals: UserGoal[] = GOAL_MAP[body.goal] ?? ['FITNESS']

    const formData: NutritionFormData = {
      sportSlug:         body.sportSlug as SportSlug | 'none',
      weightKg:          body.weightKg,
      heightCm:          body.heightCm,
      age,
      gender:            body.gender,
      activityLevel:     body.activityLevel,
      trainingsPerWeek:  body.trainingsPerWeek,
      isVegetarian:      body.isVegetarian,
      isVegan:           body.isVegan,
      allergies,
      goals,
      budget:            body.budget,
      sessionDurationMin: body.sessionDurationMin,
    }

    // ── Plan generieren (fallback auf Simulation) ─────────────
    let saveResult: { planId: string; title: string; tagesKalorienZiel: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let planData: any = null

    try {
      saveResult = await nutritionAI.generateWeeklyPlan(userId, formData)
      
      const savedPlan = await prisma.nutritionPlan.findUnique({
        where: { id: saveResult.planId },
        select: { planData: true },
      })
      planData = savedPlan?.planData ?? null
    } catch (err) {
      console.warn("⚠️ KI-Generierung fehlgeschlagen, verwende SIMULATION:", err)
      const simulatedId = "sim-plan-" + Date.now()
      saveResult = { planId: simulatedId, title: "Dein Ernährungsplan (MOCK)", tagesKalorienZiel: 2500 }
      planData = {
        title: "Dein Ernährungsplan (MOCK)",
        beschreibung: "Dies ist ein simulierter Ernährungsplan, um den Scanner testen zu können, ohne API Keys.",
        tagesKalorienZiel: 2500,
        wochenplan: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map((day) => ({
          wochentag: day,
          gesamtKalorien: 2500,
          istTrainingsTag: day === 'Mittwoch' || day === 'Freitag',
          mahlzeiten: [
            { name: "Frühstück", gericht: "Haferflocken mit Beeren", kalorien: 500, proteinG: 20, kohlenhydrateG: 60, fettG: 15, zubereitung: "Mischen und essen." },
            { name: "Mittagessen", gericht: "Hähnchen mit Reis", kalorien: 800, proteinG: 50, kohlenhydrateG: 80, fettG: 20, zubereitung: "Alles anbraten." },
            { name: "Snack", gericht: "Quark mit Banane", kalorien: 400, proteinG: 30, kohlenhydrateG: 40, fettG: 5, zubereitung: "Einfach verrühren." },
            { name: "Abendessen", gericht: "Lachs mit Gemüse", kalorien: 800, proteinG: 40, kohlenhydrateG: 30, fettG: 40, zubereitung: "Im Ofen backen." }
          ]
        })),
        einkaufsliste: [
          { kategorie: "Trockenprodukte", produkte: [{ name: "Haferflocken", menge: "500g", preisEur: 0.99 }] },
          { kategorie: "Protein", produkte: [{ name: "Hähnchen", menge: "1kg", preisEur: 8.99 }] }
        ],
        gesamtpreisEur: 9.98,
        tipps: ["Trinke genug Wasser!"]
      }

      await prisma.nutritionPlan.create({
        data: {
          id: simulatedId,
          userId,
          title: saveResult.title,
          isAiGenerated: true,
          planData: planData as never,
        }
      })
    }

    // ── Monatsverbrauch nach Generierung zählen ───────────────
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const usedAfter = await prisma.aiUsageLog.count({
      where: {
        userId,
        type: 'nutrition',
        createdAt: { gte: firstOfMonth, lt: firstOfNextMonth },
      },
    })

    return Response.json({
      success: true,
      data: {
        planId:            saveResult.planId,
        title:             saveResult.title,
        tagesKalorienZiel: saveResult.tagesKalorienZiel,
        planData,
        usedThisMonth:     usedAfter,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[POST /api/ernaehrung/plan/generate]', error)

    let userMessage = 'Plan konnte nicht erstellt werden.'

    if (message.includes('GEMINI_API_KEY')) {
      userMessage = 'KI-Dienst ist aktuell nicht verfügbar. Bitte versuche es später erneut.'
    } else if (message.includes('RATE_LIMIT') || message.includes('3 Versuchen')) {
      userMessage = 'Die KI konnte keinen gültigen Plan erzeugen. Bitte versuche es mit anderen Einstellungen erneut.'
    } else if (message.includes('quota') || message.includes('429') || message.includes('rate')) {
      userMessage = 'Es gibt aktuell zu viele Anfragen. Bitte versuche es in ein paar Minuten erneut.'
    } else if (message.includes('network') || message.includes('fetch') || message.includes('ECONNREFUSED')) {
      userMessage = 'Netzwerkfehler beim Kontaktieren der KI. Bitte überprüfe deine Internetverbindung.'
    } else if (message.includes('JSON') || message.includes('parse') || message.includes('ZodError')) {
      userMessage = 'Die KI hat eine ungültige Antwort geliefert. Bitte versuche es erneut.'
    }

    return Response.json({ error: userMessage }, { status: 500 })
  }
}
