// ─────────────────────────────────────────────────────────────────
// app/api/auth/upload-avatar/route.ts
//
// POST /api/auth/upload-avatar
// Nimmt eine Bilddatei (multipart/form-data, Feld: "file") entgegen,
// lädt sie in den Supabase Storage Bucket "avatars" hoch und
// gibt die öffentliche URL zurück.
//
// Response: { url: string }
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ungültige Formulardaten.' }, { status: 400 })
  }

  const file = formData.get('file')

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Keine Datei hochgeladen.' }, { status: 400 })
  }

  const contentType = file.type || 'image/jpeg'

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: 'Nur JPEG, PNG und WebP sind erlaubt.' },
      { status: 400 },
    )
  }

  const arrayBuffer = await file.arrayBuffer()

  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Datei zu groß (max. 5 MB).' }, { status: 400 })
  }

  const buffer = Buffer.from(arrayBuffer)

  // Dateiendung aus Content-Type ableiten
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
  }
  const ext = extMap[contentType] ?? 'jpg'
  const storagePath = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await getSupabaseAdmin().storage
    .from('avatars')
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    })

  if (uploadError !== null) {
    return NextResponse.json({ error: 'Upload fehlgeschlagen.' }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = getSupabaseAdmin().storage.from('avatars').getPublicUrl(storagePath)

  return NextResponse.json({ url: publicUrl })
}
