// ─────────────────────────────────────────────────────────────────
// GET /api/openfoodfacts?barcode=4000417025005
//
// Proxy zu OpenFoodFacts – holt Makro- und Mikronährstoffdaten
// anhand eines EAN/UPC Barcodes. Keine API-Keys nötig.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const BarcodeSchema = z.string().regex(/^\d{8,14}$/, 'Ungültiger Barcode (8-14 Ziffern)')

interface OFFNutriments {
  'energy-kcal_100g'?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
  fiber_100g?: number
  sugars_100g?: number
  'saturated-fat_100g'?: number
  cholesterol_100g?: number
  sodium_100g?: number
  'vitamin-a_100g'?: number
  'vitamin-c_100g'?: number
  'vitamin-d_100g'?: number
  'vitamin-e_100g'?: number
  'vitamin-k_100g'?: number
  'vitamin-b6_100g'?: number
  'vitamin-b12_100g'?: number
  iron_100g?: number
  calcium_100g?: number
  magnesium_100g?: number
  zinc_100g?: number
}

interface OFFProduct {
  product_name?: string
  product_name_de?: string
  brands?: string
  categories_tags?: string[]
  image_url?: string
  nutriments?: OFFNutriments
  quantity?: string
}

interface OFFResponse {
  status: number
  product?: OFFProduct
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const barcode = searchParams.get('barcode')

    const parsed = BarcodeSchema.safeParse(barcode)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültiger Barcode. Erwartet: 8-14 Ziffern.' },
        { status: 400 },
      )
    }

    // OpenFoodFacts API aufrufen
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${parsed.data}.json?fields=product_name,product_name_de,brands,categories_tags,image_url,nutriments,quantity`,
      {
        headers: { 'User-Agent': 'SportRise/1.0 (contact@sportrise.de)' },
        next: { revalidate: 86400 }, // Cache 24h
      },
    )

    if (!offRes.ok) {
      return NextResponse.json({ error: 'OpenFoodFacts nicht erreichbar.' }, { status: 502 })
    }

    const data = (await offRes.json()) as OFFResponse

    if (data.status !== 1 || !data.product) {
      return NextResponse.json(
        { error: 'Produkt nicht gefunden.', barcode: parsed.data },
        { status: 404 },
      )
    }

    const p = data.product
    const n = p.nutriments ?? {}

    return NextResponse.json({
      barcode: parsed.data,
      name: p.product_name_de || p.product_name || 'Unbekanntes Produkt',
      brand: p.brands ?? null,
      imageUrl: p.image_url ?? null,
      quantity: p.quantity ?? null,
      categories: p.categories_tags ?? [],
      macros: {
        caloriesPer100g: Math.round(n['energy-kcal_100g'] ?? 0),
        proteinGPer100g: Math.round((n.proteins_100g ?? 0) * 10) / 10,
        carbsGPer100g: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
        fatGPer100g: Math.round((n.fat_100g ?? 0) * 10) / 10,
        fiberGPer100g: Math.round((n.fiber_100g ?? 0) * 10) / 10,
      },
      micros: {
        sugarGPer100g: n.sugars_100g ?? null,
        saturatedFatGPer100g: n['saturated-fat_100g'] ?? null,
        cholesterolMgPer100g: n.cholesterol_100g != null ? n.cholesterol_100g * 1000 : null,
        sodiumMgPer100g: n.sodium_100g != null ? n.sodium_100g * 1000 : null,
        vitaminA_mcg: n['vitamin-a_100g'] != null ? n['vitamin-a_100g'] * 1000000 : null,
        vitaminC_mg: n['vitamin-c_100g'] != null ? n['vitamin-c_100g'] * 1000 : null,
        vitaminD_mcg: n['vitamin-d_100g'] != null ? n['vitamin-d_100g'] * 1000000 : null,
        vitaminE_mg: n['vitamin-e_100g'] != null ? n['vitamin-e_100g'] * 1000 : null,
        vitaminK_mcg: n['vitamin-k_100g'] != null ? n['vitamin-k_100g'] * 1000000 : null,
        vitaminB6_mg: n['vitamin-b6_100g'] != null ? n['vitamin-b6_100g'] * 1000 : null,
        vitaminB12_mcg: n['vitamin-b12_100g'] != null ? n['vitamin-b12_100g'] * 1000000 : null,
        ironMg: n.iron_100g != null ? n.iron_100g * 1000 : null,
        calciumMg: n.calcium_100g != null ? n.calcium_100g * 1000 : null,
        magnesiumMg: n.magnesium_100g != null ? n.magnesium_100g * 1000 : null,
        zincMg: n.zinc_100g != null ? n.zinc_100g * 1000 : null,
      },
    })
  } catch (error) {
    console.error('[GET /api/openfoodfacts]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
