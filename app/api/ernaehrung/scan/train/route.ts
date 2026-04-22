import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase-server'

interface TrainRequestBody {
  name: string
  category: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  embedding: number[]
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nur Admins duerfen Produkte trainieren' }, { status: 403 })
  }

  try {
    const body = (await request.json()) as TrainRequestBody

    const { name, category, calories, proteinG, carbsG, fatG, embedding } = body

    if (!name || !embedding || !Array.isArray(embedding) || embedding.length !== 1024) {
      return NextResponse.json({ error: 'Ungueltige Daten' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('custom_products')
      .insert({
        name: name.trim(),
        category: category || 'CUSTOM',
        calories: Number(calories) || 0,
        protein: Number(proteinG) || 0,
        carbs: Number(carbsG) || 0,
        fat: Number(fatG) || 0,
        embedding,
        created_by: session.user.id,
      })
      .select('id, name')
      .single()

    if (error) {
      console.error('Train insert error:', error)
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch {
    return NextResponse.json({ error: 'Ungueltige Anfrage' }, { status: 400 })
  }
}