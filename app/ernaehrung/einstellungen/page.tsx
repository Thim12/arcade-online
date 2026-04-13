// ─────────────────────────────────────────────────────────────────
// /app/ernaehrung/einstellungen/page.tsx  (Server Component)
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EinstellungenClient } from './EinstellungenClient'
import {
  DEFAULT_ERNAEHRUNG_EINSTELLUNGEN,
  type NutritionEinstellungen,
} from '@/lib/ernaehrung-settings'
import { z } from 'zod'

export const metadata = {
  title: 'Ernährungs-Einstellungen | SportRise',
  description: 'Passe deine Makro-Ziele, Wasserziel und Mahlzeiten-Zeiten an.',
}

// Inline Zod-Parse (um doppelten Import zu vermeiden)
function parseSettings(raw: unknown): NutritionEinstellungen {
  const EinstellungenSchema = z.object({
    kalorienZiel:     z.number().int().min(1200).max(5000),
    proteinPct:       z.number().int().min(10).max(60),
    carbsPct:         z.number().int().min(10).max(70),
    fatPct:           z.number().int().min(10).max(60),
    wasserMlZiel:     z.number().int().min(1000).max(4000),
    isVegetarisch:    z.boolean(),
    isVegan:          z.boolean(),
    mahlzeitenZeiten: z.object({
      fruehstueck: z.string(),
      mittag:      z.string(),
      abend:       z.string(),
      snack:       z.string(),
    }),
  })
  const result = EinstellungenSchema.safeParse(raw)
  return result.success ? result.data : DEFAULT_ERNAEHRUNG_EINSTELLUNGEN
}

export default async function EinstellungenPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nutritionSettings: true },
  })

  const settings = parseSettings(user?.nutritionSettings)

  // Aktiver Plan (für Plan-Übersicht)
  const activePlan = await prisma.nutritionPlan.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { id: true, title: true, createdAt: true },
  })

  return (
    <EinstellungenClient
      initialSettings={settings}
      activePlan={activePlan !== null
        ? { id: activePlan.id, title: activePlan.title, createdAt: activePlan.createdAt.toISOString() }
        : null
      }
    />
  )
}
