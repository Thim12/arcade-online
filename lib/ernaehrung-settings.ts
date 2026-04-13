// ─────────────────────────────────────────────────────────────────
// lib/ernaehrung-settings.ts – Typen und Defaults für Ernährungs-Einstellungen
// Ausgelagert aus dem Route-Handler um Next.js-Route-Constraints zu erfüllen
// ─────────────────────────────────────────────────────────────────

import { z } from 'zod'

const MahlzeitenZeitenSchema = z.object({
  fruehstueck: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM erwartet'),
  mittag:      z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM erwartet'),
  abend:       z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM erwartet'),
  snack:       z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM erwartet'),
})

export const EinstellungenSchema = z.object({
  kalorienZiel:     z.number().int().min(1200).max(5000),
  proteinPct:       z.number().int().min(10).max(60),
  carbsPct:         z.number().int().min(10).max(70),
  fatPct:           z.number().int().min(10).max(60),
  wasserMlZiel:     z.number().int().min(1000).max(4000),
  isVegetarisch:    z.boolean(),
  isVegan:          z.boolean(),
  mahlzeitenZeiten: MahlzeitenZeitenSchema,
}).refine(
  (d) => d.proteinPct + d.carbsPct + d.fatPct === 100,
  { message: 'Protein + Kohlenhydrate + Fett muss genau 100 % ergeben.' },
)

export type NutritionEinstellungen = z.infer<typeof EinstellungenSchema>

export const DEFAULT_ERNAEHRUNG_EINSTELLUNGEN: NutritionEinstellungen = {
  kalorienZiel:     2000,
  proteinPct:       30,
  carbsPct:         45,
  fatPct:           25,
  wasserMlZiel:     2000,
  isVegetarisch:    false,
  isVegan:          false,
  mahlzeitenZeiten: {
    fruehstueck: '07:30',
    mittag:      '12:30',
    abend:       '19:00',
    snack:       '15:00',
  },
}
