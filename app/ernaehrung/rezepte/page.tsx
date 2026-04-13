// ─────────────────────────────────────────────────────────────────
// /app/ernaehrung/rezepte/page.tsx  (Server Component)
//
// Extrahiert alle Rezepte aus den NutritionPlans des Users
// (planData.wochenplan[].mahlzeiten[]) und übergibt sie
// an den RezepteClient.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RezepteClient, type Rezept } from './RezepteClient'

export const metadata = {
  title: 'Rezept-Bibliothek | SportRise',
  description: 'Alle Rezepte aus deinen KI-generierten Ernährungsplänen.',
}

// ─────────────────────────────────────────────────────────────────
// planData-Typen (partial, nur was wir brauchen)
// ─────────────────────────────────────────────────────────────────

interface RawMahlzeit {
  name:           string  // z.B. "Frühstück", "Mittagessen"
  gericht:        string
  kalorien:       number
  proteinG:       number
  kohlenhydrateG: number
  fettG:          number
  zubereitung:    string
}

// ─────────────────────────────────────────────────────────────────
// Diät-Erkennung via Keyword-Heuristik
// Falsch-Negative sind ok – besser als zu strikt filtern
// ─────────────────────────────────────────────────────────────────

const FLEISCH_KEYWORDS = [
  'hähnchen', 'hühnchen', 'huhn', 'geflügel', 'pute', 'truthahn',
  'rindfleisch', 'rind', 'hackfleisch', 'steak', 'schnitzel',
  'schweinefleisch', 'schwein', 'speck', 'schinken', 'salami', 'wurst',
  'lachs', 'thunfisch', 'garnelen', 'shrimps', 'krabben', 'fisch',
  'bacon', 'fleisch',
]

const TIERISCH_KEYWORDS = [
  'milch', 'käse', 'sahne', 'joghurt', 'butter', 'honig', 'quark',
  'mozzarella', 'parmesan', 'feta', 'cheddar', 'skyr', 'eier',
  'ei,', ' ei ', 'eiern',
]

function detectDiet(gericht: string, zubereitung: string): { isVegetarisch: boolean; isVegan: boolean } {
  const text = (gericht + ' ' + zubereitung).toLowerCase()
  const hatFleisch  = FLEISCH_KEYWORDS.some((k) => text.includes(k))
  const hatTierisch = TIERISCH_KEYWORDS.some((k) => text.includes(k))
  const isVegetarisch = !hatFleisch
  const isVegan       = isVegetarisch && !hatTierisch
  return { isVegetarisch, isVegan }
}

interface RawTagesplan {
  mahlzeiten: RawMahlzeit[]
}

interface RawPlanData {
  wochenplan?: RawTagesplan[]
}

function normalizeMealType(name: string): Rezept['mahlzeitTyp'] {
  const lower = name.toLowerCase()
  if (lower.includes('früh') || lower.includes('frueh')) return 'FRUEHSTUECK'
  if (lower.includes('mittag'))                            return 'MITTAGESSEN'
  if (lower.includes('abend'))                            return 'ABENDESSEN'
  return 'SNACK'
}

function estimateMinutes(zubereitung: string): number {
  const lower = zubereitung.toLowerCase()
  if (lower.includes('20 min') || lower.includes('20min')) return 20
  if (lower.includes('30 min') || lower.includes('30min')) return 30
  if (lower.includes('15 min') || lower.includes('15min')) return 15
  if (lower.includes('5 min')  || lower.includes('5min'))  return 5
  if (lower.includes('10 min') || lower.includes('10min')) return 10
  if (lower.includes('45 min') || lower.includes('45min')) return 45
  return 20  // Fallback
}

function estimateDifficulty(zubereitung: string): Rezept['schwierigkeitsgrad'] {
  const words = zubereitung.split(' ').length
  if (words < 15) return 'Einfach'
  if (words < 30) return 'Mittel'
  return 'Fortgeschritten'
}

export default async function RezeptePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const userId = session.user.id

  const plans = await prisma.nutritionPlan.findMany({
    where:   { userId, isAiGenerated: true },
    select:  { id: true, planData: true, title: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  // Extrahiere Rezepte – dedupliziert nach Gericht-Name
  const seen = new Set<string>()
  const rezepte: Rezept[] = []

  for (const plan of plans) {
    const raw = plan.planData as unknown as RawPlanData
    if (!raw?.wochenplan) continue

    for (const tag of raw.wochenplan) {
      if (!Array.isArray(tag.mahlzeiten)) continue
      for (const m of tag.mahlzeiten) {
        if (!m.gericht || seen.has(m.gericht.toLowerCase())) continue
        seen.add(m.gericht.toLowerCase())

        rezepte.push({
          id:               `${plan.id}-${seen.size}`,
          name:             m.gericht,
          mahlzeitTyp:      normalizeMealType(m.name),
          kalorien:         m.kalorien,
          proteinG:         Math.round(m.proteinG),
          kohlenhydrateG:   Math.round(m.kohlenhydrateG),
          fettG:            Math.round(m.fettG),
          zubereitungMin:   estimateMinutes(m.zubereitung),
          schwierigkeitsgrad: estimateDifficulty(m.zubereitung),
          zubereitung:      m.zubereitung,
          // Zutaten aus Zubereitung extrahieren (einfache Heuristik)
          zutaten:          [],
          planTitel:        plan.title,
          ...detectDiet(m.gericht, m.zubereitung),
        })
      }
    }
  }

  return <RezepteClient rezepte={rezepte} />
}
