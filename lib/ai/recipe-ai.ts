import { GoogleGenerativeAI } from '@google/generative-ai'

export interface RecipeEngineOutput {
  recipes: {
    category: 'GUENSTIG_SCHNELL' | 'PERFORMANCE_PRO' | 'PREMIUM_MEAL'
    title: string
    description: string
    prepTimeMin: number
    estimatedCostEur: number
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    steps: string[]
    usedInventoryItems: string[]
    missingIngredients: string[]
  }[]
}

export async function generateSmartRecipes(
  inventory: string[],
  sportSlug: string,
  remainingCalories: number
): Promise<RecipeEngineOutput> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
Du bist eine hochmoderne Smart Recipe Engine für Sportler. 
Erstelle genau 3 Rezepte in den vorgegebenen Kategorien:
1. "GUENSTIG_SCHNELL" (Unter 5 Euro, unter 15 Min).
2. "PERFORMANCE_PRO" (Optimiert für die gewählte Sportart: ${sportSlug}).
3. "PREMIUM_MEAL" (Hohe Komplexität, Fokus auf Mikronährstoffe).

DER NUTZER HAT NOCH KALORIEN FREI: ${remainingCalories} kcal.
Passe die Portionsgrößen exakt an dieses Ziel an. 

AKTUELLER KÜHLSCHRANK-INHALT DES NUTZERS:
${inventory.length > 0 ? inventory.join(', ') : 'Keine Zutaten vorhanden (Alles muss gekauft werden)'}

Verwende so viele Zutaten aus dem Kühlschrank (usedInventoryItems) wie möglich. Was fehlt, packst du in missingIngredients.
Liefere das Ergebnis als reines, gültiges JSON-Objekt ohne Markdown Tags.
Die Struktur MUSS exakt so aussehen:
{
  "recipes": [
    {
      "category": "GUENSTIG_SCHNELL" | "PERFORMANCE_PRO" | "PREMIUM_MEAL",
      "title": "...",
      "description": "...",
      "prepTimeMin": 10,
      "estimatedCostEur": 3.5,
      "calories": 500,
      "proteinG": 30,
      "carbsG": 40,
      "fatG": 15,
      "steps": ["..."],
      "usedInventoryItems": ["..."],
      "missingIngredients": ["..."]
    }
  ]
}
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '')
    const object = JSON.parse(text)
    return object as RecipeEngineOutput
  } catch (error) {
    console.error('Smart Recipe Engine Error:', error)
    throw new Error('Konnte Rezepte nicht generieren.')
  }
}
