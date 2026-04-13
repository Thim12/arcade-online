import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { BaseAI } from '@/lib/ai/base-ai'
import type { SportSlug } from '@/lib/sport-profiles'
import type { UserGoal } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────────────────────────────

const MODEL_NAME = 'gemini-1.5-flash'
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

// System-Prompt ist FEST – keine variablen Teile (außer User-Daten im User-Message)
const NUTRITION_SYSTEM_PROMPT = `Du bist Sporternährungswissenschaftler für deutschen Amateursport (DGE-zertifiziert).

ABSOLUT VERBOTEN – diese Zutaten dürfen in keinem Gericht erscheinen:
Quinoa, Açaí, Açai, Spirulina, Chiasamen, Chia, Matcha, Goji-Beeren, Kokoswasser,
Kokosnussöl, Mandelmehl, Hanfsamen, Moringa, Collagen-Pulver, Protein-Pulver,
Süßkartoffeln, Tempeh, Tofu (außer bei veganer Ernährung), Edamame, Miso,
alle als "Superfood" beworbenen Produkte.

AUSSCHLIESSLICH diese deutschen Alltagsprodukte verwenden:
Frühstück: Haferflocken, Vollkornbrot, Graubrot, Roggenknäckebrot, Eier (Rührei, Spiegelei, gekocht),
  Quark, Naturjoghurt, Buttermilch, Milch, Käse (Gouda, Emmentaler, Frischkäse), Butter,
  Marmelade, Honig, Apfel, Banane, Beeren (Erdbeeren, Heidelbeeren, Himbeeren), Orange.
Mittagessen/Abendessen: Hähnchenbrust, Hähnchenschenkel, Putenbrust, Rindergeschnetzeltes,
  Schweinefilet, Lachs, Thunfisch (Dose), Hering, Forelle, Eier.
  Beilagen: Kartoffeln (gekocht, als Ofenkartoffel, Stampfkartoffeln), Vollkornnudeln,
  Vollkornreis, Linsen, Kidneybohnen, Kichererbsen.
  Gemüse: Brokkoli, Spinat, Karotten, Paprika (rot/gelb), Tomaten, Gurke, Zucchini,
  Blumenkohl, Erbsen, Mais, Feldsalat, Eisbergsalat.
Snacks: Quark, Hüttenkäse, Naturjoghurt, hartgekochte Eier, Vollkornbrot mit Käse,
  Apfel, Banane, Mandeln (Handvoll), Walnüsse (Handvoll), Möhrenstifte.
Getränke: Wasser, Sprudelwasser, ungesüßter Tee, Kaffee (ohne Sirup), Milch.

REGELN:
- Alle Gerichte müssen in max. 30 Minuten zuzubereiten sein.
- Realistische Portionsgrößen für Amateursportler.
- Trainingstage: höherer Kohlenhydratanteil vor dem Training, erhöhter Proteinanteil nach dem Training.
- Ruhetage: leicht reduzierte Kalorien, höherer Gemüseanteil.
- Antworte NUR mit validem JSON ohne Markdown-Codeblöcke.`

// ─────────────────────────────────────────────────────────────────
// Öffentliche Typen
// ─────────────────────────────────────────────────────────────────

export type ActivityLevel = 'SEDENTAER' | 'LEICHT_AKTIV' | 'MAESSIG_AKTIV' | 'AKTIV' | 'SEHR_AKTIV'
export type Gender = 'MAENNLICH' | 'WEIBLICH'

export interface NutritionFormData {
  sportSlug: SportSlug | 'none'
  weightKg: number | null
  heightCm: number | null
  age: number | null
  gender: Gender | null
  activityLevel: ActivityLevel
  trainingsPerWeek: number
  isVegetarian: boolean
  isVegan: boolean
  allergies: string[]
  goals: UserGoal[]
  dailyCalorieTarget?: number   // optional: überschreibt TDEE-Berechnung
  budget?: 'SEHR_GUENSTIG' | 'GUENSTIG' | 'MITTEL' | 'KEIN_LIMIT'
  sessionDurationMin?: number
}

export interface NutritionPlanSaveResult {
  planId: string
  title: string
  tagesKalorienZiel: number
  durationDays: 7
}

// ─────────────────────────────────────────────────────────────────
// Interne Execute-Eingabe
// ─────────────────────────────────────────────────────────────────

interface NutritionExecuteInput {
  userId: string
  formData: NutritionFormData
  tdee: number
}

// ─────────────────────────────────────────────────────────────────
// Zod-Schema für Gemini-Output
// ─────────────────────────────────────────────────────────────────

const MahlzeitSchema = z.object({
  name: z.string().min(1),       // z.B. "Frühstück", "Snack", "Mittagessen"
  gericht: z.string().min(1),
  kalorien: z.number().int().positive(),
  proteinG: z.number().nonnegative(),
  kohlenhydrateG: z.number().nonnegative(),
  fettG: z.number().nonnegative(),
  zubereitung: z.string().min(1),
})

const TagesplanSchema = z.object({
  wochentag: z.string().min(1),
  gesamtKalorien: z.number().int().positive(),
  istTrainingsTag: z.boolean(),
  mahlzeiten: z.array(MahlzeitSchema).min(3),
})

const EinkaufslistenItemSchema = z.object({
  kategorie: z.string().min(1),
  produkte: z.array(
    z.object({
      name:     z.string().min(1),
      menge:    z.string().min(1),
      preisEur: z.number().nonnegative(),
    }),
  ).min(1),
})

const NutritionPlanAiOutputSchema = z.object({
  title:             z.string().min(1),
  beschreibung:      z.string().min(1),
  tagesKalorienZiel: z.number().int().positive(),
  wochenplan:        z.array(TagesplanSchema).length(7),
  einkaufsliste:     z.array(EinkaufslistenItemSchema).min(1),
  gesamtpreisEur:    z.number().nonnegative(),
  tipps:             z.array(z.string().min(1)).min(1),
})

type NutritionPlanAiOutput = z.infer<typeof NutritionPlanAiOutputSchema>

// ─────────────────────────────────────────────────────────────────
// Harris-Benedict TDEE (rein mathematisch, kein API-Call)
// ─────────────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTAER:     1.2,    // überwiegend sitzend
  LEICHT_AKTIV:  1.375,  // 1–3 Tage/Woche Sport
  MAESSIG_AKTIV: 1.55,   // 3–5 Tage/Woche Sport
  AKTIV:         1.725,  // 6–7 Tage/Woche Sport
  SEHR_AKTIV:    1.9,    // 2x täglich oder körperliche Arbeit
}

/**
 * Berechnet den täglichen Gesamtenergiebedarf (TDEE) nach Harris-Benedict.
 * Gibt einen gerundeten Wert in kcal zurück.
 */
export function calculateTDEE(
  heightCm: number,
  weightKg: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
): number {
  // Harris-Benedict revidierte Formel (Mifflin-St Jeor)
  const bmr =
    gender === 'MAENNLICH'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

// ─────────────────────────────────────────────────────────────────
// NutritionAI
// ─────────────────────────────────────────────────────────────────

export class NutritionAI extends BaseAI<NutritionExecuteInput, NutritionPlanSaveResult> {
  protected readonly aiType = 'nutrition' as const

  private getGeminiModel() {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey === undefined || apiKey === '') {
      throw new Error('GEMINI_API_KEY ist nicht gesetzt.')
    }
    const genAI = new GoogleGenerativeAI(apiKey)
    return genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: NUTRITION_SYSTEM_PROMPT,
    })
  }

  // ── Öffentliche API ──────────────────────────────────────────

  /**
   * Generiert einen 7-Tage-Ernährungsplan, speichert ihn in der DB.
   * TDEE wird automatisch berechnet wenn möglich.
   */
  async generateWeeklyPlan(
    userId: string,
    formData: NutritionFormData,
  ): Promise<NutritionPlanSaveResult> {
    // TDEE berechnen wenn alle Daten vorhanden
    let tdee = 2200  // Fallback
    if (
      formData.heightCm !== null &&
      formData.weightKg !== null &&
      formData.age !== null &&
      formData.gender !== null
    ) {
      tdee = calculateTDEE(
        formData.heightCm,
        formData.weightKg,
        formData.age,
        formData.gender,
        formData.activityLevel,
      )
    }
    // Manuelles Kalorienziel überschreibt TDEE
    if (formData.dailyCalorieTarget !== undefined && formData.dailyCalorieTarget > 0) {
      tdee = formData.dailyCalorieTarget
    }

    const result = await this.execute({ userId, formData, tdee })
    await this.logUsage(userId)
    return result
  }

  /**
   * Erzeugt 2-Satz-Feedback basierend auf dem letzten Ernährungsplan
   * und den letzten 7 Trainingseinheiten. Kein Rate-Limit (kein API-Call-Logging).
   */
  async generateWeeklyFeedback(userId: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey === undefined || apiKey === '') {
      return 'Achte auf ausreichend Protein und komplexe Kohlenhydrate rund ums Training.'
    }

    // Letzte Woche: Plan + Sessions laden
    const [latestPlan, recentSessions] = await Promise.all([
      prisma.nutritionPlan.findFirst({
        where: { userId, isAiGenerated: true },
        orderBy: { createdAt: 'desc' },
        select: { title: true, planData: true },
      }),
      prisma.trainingSession.findMany({
        where: {
          userId,
          completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { completedAt: 'desc' },
        select: { title: true, durationMin: true, xpEarned: true },
        take: 7,
      }),
    ])

    const trainingsText =
      recentSessions.length > 0
        ? `Letzte 7 Tage: ${recentSessions.length} Einheiten (${recentSessions.reduce((a, s) => a + s.durationMin, 0)} Min gesamt).`
        : 'Letzte Woche keine Trainingseinheiten erfasst.'

    const planText =
      latestPlan !== null
        ? `Aktueller Ernährungsplan: ${latestPlan.title}.`
        : 'Kein Ernährungsplan vorhanden.'

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction:
        'Du bist Sporternährungsberater. Gib 1–2 ehrliche, konkrete Sätze Feedback zur ' +
        'Ernährungssituation. Keine Phrasen. Direkt und praktisch. Nur der Text, keine Anführungszeichen.',
    })

    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${planText}\n${trainingsText}\n\nWas ist dein konkretes Feedback?` }],
          },
        ],
        generationConfig: { temperature: 0.6, maxOutputTokens: 120 },
      })
      return result.response.text().trim()
    } catch {
      return 'Achte auf ausreichend Protein nach dem Training und komplexe Kohlenhydrate vorher.'
    }
  }

  // ── Interne Methoden ─────────────────────────────────────────

  private buildUserMessage(formData: NutritionFormData, tdee: number): string {
    const sportLabels: Record<SportSlug, string> = {
      fussball:   'Fußball',
      tennis:     'Tennis',
      basketball: 'Basketball',
    }
    const sportText =
      formData.sportSlug === 'none'
        ? 'Kein spezifischer Sport / Allgemein'
        : sportLabels[formData.sportSlug]

    const activityLabels: Record<ActivityLevel, string> = {
      SEDENTAER:     'wenig aktiv',
      LEICHT_AKTIV:  'leicht aktiv',
      MAESSIG_AKTIV: 'mäßig aktiv',
      AKTIV:         'sehr aktiv',
      SEHR_AKTIV:    'extrem aktiv',
    }

    const budgetLabels: Record<string, string> = {
      SEHR_GUENSTIG: 'Sehr günstig (unter 30 €/Woche)',
      GUENSTIG:      'Günstig (30–50 €/Woche)',
      MITTEL:        'Mittel (50–80 €/Woche)',
      KEIN_LIMIT:    'Kein Budget-Limit (Qualität aus dem Supermarkt, keine Superfoods)',
    }

    const dietText = formData.isVegan
      ? 'vegane Ernährung'
      : formData.isVegetarian
        ? 'vegetarische Ernährung'
        : 'normale Mischkost'

    const allergyText =
      formData.allergies.length > 0
        ? `ALLERGIEN/UNVERTRÄGLICHKEITEN – diese UNBEDINGT vermeiden: ${formData.allergies.join(', ')}\n`
        : ''

    const goalLabels: Partial<Record<UserGoal, string>> = {
      FITNESS:            'allgemeine Fitness',
      WETTKAMPF:          'Wettkampfvorbereitung',
      ABNEHMEN:           'Körperfett reduzieren',
      MUSKELAUFBAU:       'Muskeln aufbauen',
      FREIZEITSPORT:      'Freizeitsport',
      TECHNIK_VERBESSERN: 'Leistung optimieren',
    }
    const goalsText =
      formData.goals.length > 0
        ? formData.goals.map((g) => goalLabels[g] ?? g).join(', ')
        : 'allgemeine Fitness'

    const budgetText =
      formData.budget !== undefined
        ? `Budget: ${budgetLabels[formData.budget] ?? formData.budget}\n`
        : ''

    const sessionText =
      formData.sessionDurationMin !== undefined
        ? `Trainingsdauer pro Einheit: ${formData.sessionDurationMin} Minuten\n`
        : ''

    return (
      `ERNÄHRUNGSPLAN ERSTELLEN:\n\n` +
      `Sportart: ${sportText}\n` +
      `Trainingsfrequenz: ${formData.trainingsPerWeek}x pro Woche\n` +
      `Aktivitätsniveau: ${activityLabels[formData.activityLevel]}\n` +
      `Ernährungsweise: ${dietText}\n` +
      allergyText +
      `Ziele: ${goalsText}\n` +
      budgetText +
      sessionText +
      (formData.weightKg !== null ? `Gewicht: ${formData.weightKg} kg\n` : '') +
      (formData.heightCm !== null ? `Größe: ${formData.heightCm} cm\n` : '') +
      (formData.age !== null ? `Alter: ${formData.age} Jahre\n` : '') +
      `Kalorienziel pro Tag: ca. ${tdee} kcal\n` +
      `\nAntworte mit diesem JSON-Schema:\n` +
      `{\n` +
      `  "title": "Name des Ernährungsplans",\n` +
      `  "beschreibung": "Kurze Beschreibung (2-3 Sätze)",\n` +
      `  "tagesKalorienZiel": ${tdee},\n` +
      `  "wochenplan": [\n` +
      `    {\n` +
      `      "wochentag": "Montag",\n` +
      `      "gesamtKalorien": ${tdee},\n` +
      `      "istTrainingsTag": true,\n` +
      `      "mahlzeiten": [\n` +
      `        {\n` +
      `          "name": "Frühstück",\n` +
      `          "gericht": "Name des Gerichts",\n` +
      `          "kalorien": 500,\n` +
      `          "proteinG": 25,\n` +
      `          "kohlenhydrateG": 60,\n` +
      `          "fettG": 15,\n` +
      `          "zubereitung": "Kurze Anleitung (1-2 Sätze)"\n` +
      `        }\n` +
      `      ]\n` +
      `    }\n` +
      `  ],\n` +
      `  "einkaufsliste": [\n` +
      `    {\n` +
      `      "kategorie": "Fleisch & Fisch",\n` +
      `      "produkte": [\n` +
      `        { "name": "Hähnchenbrust", "menge": "500g", "preisEur": 4.99 },\n` +
      `        { "name": "Lachs", "menge": "300g", "preisEur": 3.49 }\n` +
      `      ]\n` +
      `    }\n` +
      `  ],\n` +
      `  "gesamtpreisEur": 45.50,\n` +
      `  "tipps": ["Ernährungstipp 1"]\n` +
      `}\n\n` +
      `Erstelle ALLE 7 Tage (Montag bis Sonntag) mit je 4-5 Mahlzeiten. ` +
      `Berechne gesamtpreisEur als Summe aller Produktpreise in der Einkaufsliste.` +
      (formData.isVegan ? '\nNUR vegane Gerichte!' : '') +
      (formData.isVegetarian && !formData.isVegan ? '\nNUR vegetarische Gerichte!' : '')
    )
  }

  protected async execute(input: NutritionExecuteInput): Promise<NutritionPlanSaveResult> {
    const model = this.getGeminiModel()
    const userMessage = this.buildUserMessage(input.formData, input.tdee)

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.6,
            topP: 0.85,
            maxOutputTokens: 8192,
          },
        })

        const responseText = result.response.text()
        const parsed: unknown = JSON.parse(responseText)
        const validated: NutritionPlanAiOutput = NutritionPlanAiOutputSchema.parse(parsed)

        const savedPlan = await prisma.nutritionPlan.create({
          data: {
            userId: input.userId,
            title: validated.title,
            isAiGenerated: true,
            planData: validated as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        })

        return {
          planId: savedPlan.id,
          title: validated.title,
          tagesKalorienZiel: validated.tagesKalorienZiel,
          durationDays: 7,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
        }
      }
    }

    throw new Error(
      `NutritionAI: Plan konnte nach ${MAX_RETRIES} Versuchen nicht generiert werden. ` +
        `Letzter Fehler: ${lastError?.message ?? 'Unbekannt'}`,
    )
  }
}

// Singleton-Export
export const nutritionAI = new NutritionAI()
