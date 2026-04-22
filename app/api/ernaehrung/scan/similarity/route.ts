import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

interface SimilarityRequestBody {
  embedding: number[]
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SimilarityRequestBody
    const { embedding } = body

    if (!embedding || !Array.isArray(embedding) || embedding.length !== 1024) {
      return NextResponse.json({ error: 'Embedding muss ein Array mit 1024 Werten sein' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('match_custom_products', {
      query_embedding: embedding,
      match_threshold: 0.85,
      match_count: 5,
    })

    if (error) {
      console.error('Similarity search error:', error)
      return NextResponse.json({ error: 'Fehler bei der Aehnlichkeitssuche' }, { status: 500 })
    }

    return NextResponse.json({ matches: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Ungueltige Anfrage' }, { status: 400 })
  }
}