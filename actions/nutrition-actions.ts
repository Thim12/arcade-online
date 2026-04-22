'use server'

// ─────────────────────────────────────────────────────────────────
// Server Action: trackMealAndSyncFridge
//
// Loggt eine Mahlzeit UND dekrementiert automatisch passende
// Kühlschrank-Items in einer einzigen Prisma-Transaktion.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { MealType } from '@prisma/client'

// ── Typen ─────────────────────────────────────────────────────────

interface MealInput {
  date: string       // YYYY-MM-DD
  mealType: MealType
  foodId: string
  foodName: string
  portionGrams: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

interface SyncResult {
  success: boolean
  mealLogId?: string
  deductedItems: Array<{ id: string; name: string; deductedG: number; remainingG: number; depleted: boolean }>
  error?: string
}

// ── Fuzzy-Name-Match ──────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]/g, '')
}

function fuzzyMatch(foodName: string, inventoryName: string): boolean {
  const a = normalize(foodName)
  const b = normalize(inventoryName)
  // Exakter Match nach Normalisierung
  if (a === b) return true
  // Einer enthält den anderen
  if (a.includes(b) || b.includes(a)) return true
  return false
}

// ── Haupt-Action ──────────────────────────────────────────────────

export async function trackMealAndSyncFridge(meal: MealInput): Promise<SyncResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, deductedItems: [], error: 'Nicht authentifiziert.' }
  }

  const userId = session.user.id
  const dateObj = new Date(`${meal.date}T00:00:00.000Z`)

  try {
    const result = await prisma.$transaction(async (tx) => {
      // A) MealLog erstellen
      const mealLog = await tx.mealLog.create({
        data: {
          userId,
          date: dateObj,
          mealType: meal.mealType,
          foodId: meal.foodId,
          foodName: meal.foodName,
          portionGrams: meal.portionGrams,
          calories: meal.calories,
          proteinG: meal.proteinG,
          carbsG: meal.carbsG,
          fatG: meal.fatG,
          fiberG: meal.fiberG,
        },
      })

      // B) Passende Kühlschrank-Items suchen (fuzzy match auf foodName)
      const inventoryItems = await tx.userInventoryItem.findMany({
        where: { userId },
      })

      const matches = inventoryItems.filter((item) => fuzzyMatch(meal.foodName, item.name))

      const deductedItems: SyncResult['deductedItems'] = []

      let remainingToDeduct = meal.portionGrams

      // C) Dekrementierung – verteile auf alle passenden Items
      for (const item of matches) {
        if (remainingToDeduct <= 0) break

        const currentG = item.quantityG
        const deductG = Math.min(remainingToDeduct, currentG)
        const newG = currentG - deductG
        const depleted = newG <= 0

        if (depleted) {
          // Item komplett verbraucht → löschen
          await tx.userInventoryItem.delete({ where: { id: item.id } })
        } else {
          // Menge reduzieren
          await tx.userInventoryItem.update({
            where: { id: item.id },
            data: { quantityG: newG },
          })
        }

        deductedItems.push({
          id: item.id,
          name: item.name,
          deductedG: deductG,
          remainingG: depleted ? 0 : newG,
          depleted,
        })

        remainingToDeduct -= deductG
      }

      return { mealLogId: mealLog.id, deductedItems }
    })

    return {
      success: true,
      mealLogId: result.mealLogId,
      deductedItems: result.deductedItems,
    }
  } catch (error) {
    console.error('[trackMealAndSyncFridge]', error)
    return {
      success: false,
      deductedItems: [],
      error: 'Mahlzeit konnte nicht gespeichert werden.',
    }
  }
}
