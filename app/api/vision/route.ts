// ─────────────────────────────────────────────────────────────────
// POST /api/vision – TF.js Detection-Data Aggregation
//
// Empfängt erkannte Objekte vom Client-Side Vision Scanner,
// klassifiziert sie und speichert sie als UserInventoryItem.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const VisionItemSchema = z.object({
  name: z.string().min(1).max(100),
  confidence: z.number().min(0).max(1),
  category: z.string().optional(),
})

const VisionSchema = z.object({
  items: z.array(VisionItemSchema).min(1).max(50),
})

// Kategorie-Mapping basierend auf erkanntem Objekt-Typ
const CATEGORY_MAP: Record<string, string> = {
  Banane: 'OBST',
  Apfel: 'OBST',
  Orange: 'OBST',
  Brokkoli: 'GEMUESE',
  Karotte: 'GEMUESE',
  Pizza: 'FERTIGPRODUKTE',
  Sandwich: 'FERTIGPRODUKTE',
  'Hot Dog': 'FERTIGPRODUKTE',
  Donut: 'FERTIGPRODUKTE',
  Kuchen: 'FERTIGPRODUKTE',
  Flasche: 'GETRAENKE',
  Tasse: 'GETRAENKE',
  Schüssel: 'SONSTIGES',
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = VisionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const userId = session.user.id
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 7)

    // Dedupliziere nach Name (nur höchste Confidence behalten)
    const uniqueItems = new Map<string, { name: string; confidence: number; category?: string }>()
    for (const item of parsed.data.items) {
      const existing = uniqueItems.get(item.name.toLowerCase())
      if (!existing || existing.confidence < item.confidence) {
        uniqueItems.set(item.name.toLowerCase(), item)
      }
    }

    const createdItems = await prisma.$transaction(
      Array.from(uniqueItems.values()).map((item) =>
        prisma.userInventoryItem.create({
          data: {
            userId,
            name: item.name,
            category: item.category ?? CATEGORY_MAP[item.name] ?? 'SONSTIGES',
            quantity: 1,
            quantityG: 100, // Default Schätzung
            expiryDate: defaultExpiry,
            addedVia: 'BATCH_SCAN',
          },
        }),
      ),
    )

    return NextResponse.json({
      success: true,
      count: createdItems.length,
      items: createdItems.map((i) => ({ id: i.id, name: i.name, category: i.category })),
    })
  } catch (error) {
    console.error('[POST /api/vision]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
