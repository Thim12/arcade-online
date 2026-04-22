import { NextRequest, NextResponse } from 'next/server'

interface OpenFoodFactsProduct {
  product_name?: string
  product_name_de?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
  }
  categories_tags?: string[]
  image_front_url?: string
}

interface OpenFoodFactsResponse {
  status: number
  product?: OpenFoodFactsProduct
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'Barcode fehlt' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=product_name,product_name_de,nutriments,categories_tags,image_front_url`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'Open Food Facts nicht erreichbar' }, { status: 502 })
    }
    const data = (await res.json()) as OpenFoodFactsResponse
    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
    }
    const p = data.product
    const n = p.nutriments ?? {}

    return NextResponse.json({
      name: p.product_name_de || p.product_name || 'Unbekanntes Produkt',
      calories: Math.round(n['energy-kcal_100g'] ?? 0),
      proteinG: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      carbsG: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      fatG: Math.round((n.fat_100g ?? 0) * 10) / 10,
      fiberG: Math.round((n.fiber_100g ?? 0) * 10) / 10,
      category: 'FERTIGPRODUKTE',
      imageUrl: p.image_front_url || null,
      source: 'open_food_facts',
    })
  } catch {
    return NextResponse.json({ error: 'Fehler bei der Abfrage' }, { status: 500 })
  }
}