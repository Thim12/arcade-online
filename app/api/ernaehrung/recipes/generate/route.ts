import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSmartRecipes } from '@/lib/ai/recipe-ai'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { sportSlug, remainingCalories } = await req.json()

    // Lade das aktuelle Kühlschrank-Inventar des Users
    const inventory = await prisma.userInventoryItem.findMany({
      where: { userId: session.user.id },
      select: { name: true, quantity: true }
    })

    const inventoryList = inventory.map(i => `${i.quantity}x ${i.name}`)

    // Falls die KI mal ausfällt, geben wir einen simulierten Zustand zurück (für lokalen Test-Workflow)
    let recipes;
    try {
      recipes = await generateSmartRecipes(
        inventoryList,
        sportSlug || 'Allgemeine Fitness',
        remainingCalories || 600
      )
    } catch (aiErr) {
      console.warn("⚠️ KI Recipe Engine fehlgeschlagen, verwende SIMULATION:", aiErr)
      recipes = {
        recipes: [
          {
            category: 'GUENSTIG_SCHNELL',
            title: 'Magerquark mit Früchten',
            description: 'Der Klassiker aus dem Kühlschrank.',
            prepTimeMin: 5,
            estimatedCostEur: 1.5,
            calories: 300,
            proteinG: 35,
            carbsG: 30,
            fatG: 2,
            steps: ['Quark in Schale geben.', 'Früchte schneiden und untermischen.'],
            usedInventoryItems: ['Quark', 'Apfel'],
            missingIngredients: []
          },
          {
            category: 'PERFORMANCE_PRO',
            title: 'Sportler-Reispfanne',
            description: 'Viel Energie für dein Training.',
            prepTimeMin: 20,
            estimatedCostEur: 4.0,
            calories: remainingCalories > 0 ? remainingCalories : 600,
            proteinG: 40,
            carbsG: 80,
            fatG: 15,
            steps: ['Reis kochen.', 'Gemüße anbraten.', 'Alles mischen.'],
            usedInventoryItems: ['Broccoli'],
            missingIngredients: ['Reis', 'Hähnchen']
          },
          {
            category: 'PREMIUM_MEAL',
            title: 'Lachs auf Quinoa-Bett',
            description: 'Maximale Mikronährstoffe.',
            prepTimeMin: 35,
            estimatedCostEur: 8.5,
            calories: 650,
            proteinG: 45,
            carbsG: 50,
            fatG: 25,
            steps: ['Quinoa kochen.', 'Lachs schonend garen.', 'Anrichten.'],
            usedInventoryItems: [],
            missingIngredients: ['Lachs', 'Quinoa']
          }
        ]
      }
    }

    return NextResponse.json(recipes)

  } catch (error) {
    console.error('API Error /recipes/generate:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
