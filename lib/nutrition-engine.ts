// ─────────────────────────────────────────────────────────────────
// lib/nutrition-engine.ts – Die "Gehirn"-Logik von SportRise
//
// 1. deductFromFridge()     – Auto-Deduction bei Meal-Logging
// 2. calculateRecipeMatchScore() – Rezept-Scoring aus Kühlschrank
// 3. calculateBMRAndTDEE()  – Wrapper für User-Objekt
// ─────────────────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma'
import {
  calculateBMR,
  calculateTDEE,
  calculateMacroTargets,
  calculateAge,
  type GenderType,
  type ActivityLevelType,
  type MacroTargets,
} from '@/lib/formulas'

// ── Typen ─────────────────────────────────────────────────────────

interface DeductionMealEntry {
  name: string
  amountG: number
}

interface InventoryItem {
  id: string
  name: string
  quantityG: number
  quantity: number
  expiryDate: Date | null
  category: string | null
}

interface RecipeWithIngredients {
  id: string
  title: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  prepTimeMin: number
  dietType: string
  ingredients: { name: string; amountG: number; isOptional: boolean }[]
}

interface RecipeMatchResult {
  recipe: RecipeWithIngredients
  score: number
  matchedIngredients: string[]
  missingIngredients: string[]
  expiringBonus: number
}

interface UserForTDEE {
  gender: string | null
  heightCm: number | null
  weightKg: number | null
  birthYear: number | null
  activityLevel: string | null
}

interface BMRAndTDEEResult {
  bmr: number
  tdee: number
  macros: MacroTargets
}

// ── String-Matching Helfer ────────────────────────────────────────

function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s]/g, '')
}

function ingredientMatches(fridgeName: string, recipeName: string): boolean {
  const a = normalizeIngredientName(fridgeName)
  const b = normalizeIngredientName(recipeName)

  // Exakter Match
  if (a === b) return true

  // Enthält-Check (z.B. "Bio-Vollmilch" enthält "milch")
  if (a.includes(b) || b.includes(a)) return true

  // Wort-basierter Match (mindestens ein gemeinsames Wort mit 4+ Zeichen)
  const wordsA = a.split(/\s+/).filter((w) => w.length >= 4)
  const wordsB = b.split(/\s+/).filter((w) => w.length >= 4)
  return wordsA.some((wa) => wordsB.some((wb) => wa === wb || wa.includes(wb) || wb.includes(wa)))
}

// ── 1. deductFromFridge ───────────────────────────────────────────

export async function deductFromFridge(
  userId: string,
  mealEntries: DeductionMealEntry[],
): Promise<{ deducted: string[]; notFound: string[] }> {
  const deducted: string[] = []
  const notFound: string[] = []

  // Lade alle Inventar-Items des Users
  const inventory = await prisma.userInventoryItem.findMany({
    where: { userId },
    select: { id: true, name: true, quantityG: true, quantity: true },
  })

  // Prisma-Transaction: Alle Abzüge atomar durchführen
  const operations: ReturnType<typeof prisma.userInventoryItem.update>[] = []

  for (const entry of mealEntries) {
    // Finde passendes Item im Inventar
    const matchedItem = inventory.find((item) =>
      ingredientMatches(item.name, entry.name) && item.quantityG > 0,
    )

    if (!matchedItem) {
      notFound.push(entry.name)
      continue
    }

    const newQuantityG = Math.max(0, matchedItem.quantityG - entry.amountG)
    const shouldDelete = newQuantityG <= 0

    if (shouldDelete) {
      // Wenn Menge aufgebraucht UND quantity = 1, lösche das Item
      if (matchedItem.quantity <= 1) {
        operations.push(
          prisma.userInventoryItem.delete({ where: { id: matchedItem.id } }) as never,
        )
      } else {
        // Reduziere Stückzahl und setze Gramm auf Default zurück
        operations.push(
          prisma.userInventoryItem.update({
            where: { id: matchedItem.id },
            data: {
              quantity: matchedItem.quantity - 1,
              quantityG: 100, // Reset für nächste Einheit
            },
          }),
        )
      }
    } else {
      operations.push(
        prisma.userInventoryItem.update({
          where: { id: matchedItem.id },
          data: { quantityG: newQuantityG },
        }),
      )
    }

    // Update auch den lokalen State damit nachfolgende Matches korrekt sind
    matchedItem.quantityG = newQuantityG
    deducted.push(entry.name)
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations)
  }

  return { deducted, notFound }
}

// ── 2. calculateRecipeMatchScore ──────────────────────────────────

export function calculateRecipeMatchScore(
  fridgeItems: InventoryItem[],
  recipes: RecipeWithIngredients[],
): RecipeMatchResult[] {
  const now = new Date()

  return recipes
    .map((recipe) => {
      const requiredIngredients = recipe.ingredients.filter((i) => !i.isOptional)
      const allIngredients = recipe.ingredients

      let matchedCount = 0
      let totalRequired = requiredIngredients.length
      const matchedIngredients: string[] = []
      const missingIngredients: string[] = []
      let expiringBonus = 0

      for (const ingredient of allIngredients) {
        const fridgeMatch = fridgeItems.find(
          (item) => ingredientMatches(item.name, ingredient.name) && item.quantityG > 0,
        )

        if (fridgeMatch) {
          matchedIngredients.push(ingredient.name)
          if (!ingredient.isOptional) {
            matchedCount++
          }

          // Bonus für bald ablaufende Lebensmittel (nutze sie zuerst!)
          if (fridgeMatch.expiryDate) {
            const daysUntilExpiry = Math.ceil(
              (fridgeMatch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            )
            if (daysUntilExpiry <= 2) expiringBonus += 20
            else if (daysUntilExpiry <= 5) expiringBonus += 10
            else if (daysUntilExpiry <= 7) expiringBonus += 5
          }
        } else if (!ingredient.isOptional) {
          missingIngredients.push(ingredient.name)
        }
      }

      // Score: Basis = (matched / required) × 100
      // + Ablauf-Bonus (max 60)
      // + Kleine Bonus für optionale Matches
      const baseScore = totalRequired > 0 ? (matchedCount / totalRequired) * 100 : 0
      const optionalBonus = (matchedIngredients.length - matchedCount) * 3
      const score = Math.min(100, Math.round(baseScore + Math.min(60, expiringBonus) + optionalBonus))

      return {
        recipe,
        score,
        matchedIngredients,
        missingIngredients,
        expiringBonus,
      }
    })
    .sort((a, b) => b.score - a.score)
}

// ── 3. calculateBMRAndTDEE ────────────────────────────────────────

export function calculateBMRAndTDEE(
  user: UserForTDEE,
  proteinPct: number = 30,
  carbsPct: number = 45,
  fatPct: number = 25,
): BMRAndTDEEResult | null {
  if (!user.heightCm || !user.weightKg || !user.birthYear) {
    return null
  }

  const gender: GenderType = (user.gender as GenderType) ?? 'MAENNLICH'
  const activityLevel: ActivityLevelType =
    (user.activityLevel as ActivityLevelType) ?? 'MAESSIG_AKTIV'
  const ageYears = calculateAge(user.birthYear)

  const bmr = calculateBMR({ heightCm: user.heightCm, weightKg: user.weightKg, ageYears, gender })
  const tdee = calculateTDEE({
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    ageYears,
    gender,
    activityLevel,
  })
  const macros = calculateMacroTargets(tdee, proteinPct, carbsPct, fatPct)

  return { bmr: Math.round(bmr), tdee, macros }
}

// ── 4. Quick-Add Vorschläge (Tageszeit-basiert) ───────────────────

export function getTimeBasedSuggestions(hour: number): string[] {
  if (hour >= 5 && hour < 10) {
    return ['Haferflocken', 'Vollkornbrot', 'Ei', 'Magerquark', 'Banane', 'Müsli']
  }
  if (hour >= 10 && hour < 14) {
    return ['Reis', 'Hähnchenbrust', 'Lachs', 'Kartoffeln', 'Salat', 'Vollkornnudeln']
  }
  if (hour >= 14 && hour < 17) {
    return ['Apfel', 'Nüsse', 'Proteinriegel', 'Joghurt', 'Banane', 'Karotten']
  }
  if (hour >= 17 && hour < 22) {
    return ['Lachs', 'Gemüsepfanne', 'Tofu', 'Hüttenkäse', 'Thunfisch', 'Brokkoli']
  }
  return ['Wasser', 'Kräutertee', 'Nüsse']
}
