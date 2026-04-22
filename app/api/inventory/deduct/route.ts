// ─────────────────────────────────────────────────────────────────
// POST /api/inventory/deduct – Auto-Deduction Engine
//
// Wird aufgerufen wenn ein Meal geloggt wird.
// Berechnet verwendete Zutaten und reduziert Fridge-Inventar.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deductFromFridge } from '@/lib/nutrition-engine'
import { z } from 'zod'

const DeductSchema = z.object({
  entries: z.array(
    z.object({
      name: z.string().min(1),
      amountG: z.number().positive(),
    }),
  ).min(1),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = DeductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const result = await deductFromFridge(session.user.id, parsed.data.entries)

    return NextResponse.json({
      success: true,
      deducted: result.deducted,
      notFound: result.notFound,
      message:
        result.deducted.length > 0
          ? `${result.deducted.length} Zutat(en) vom Kühlschrank abgezogen.`
          : 'Keine passenden Zutaten im Kühlschrank gefunden.',
    })
  } catch (error) {
    console.error('[POST /api/inventory/deduct]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
