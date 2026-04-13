// ─────────────────────────────────────────────────────────────────
// PATCH /api/profil
//
// Aktualisiert Profildaten des eingeloggten Users.
// Validierung via Zod: name, bio, city, state, isPublicProfile,
//                      emailNotifications
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GermanState } from '@prisma/client'

// ── Zod-Schema ───────────────────────────────────────────────────

const GermanStateEnum = z.nativeEnum(GermanState)

const ProfilUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name darf nicht leer sein.')
    .max(60, 'Name darf maximal 60 Zeichen haben.')
    .optional(),
  bio: z
    .string()
    .trim()
    .max(300, 'Bio darf maximal 300 Zeichen haben.')
    .optional(),
  city: z
    .string()
    .trim()
    .max(80, 'Stadt darf maximal 80 Zeichen haben.')
    .optional(),
  state: GermanStateEnum.optional().nullable(),
  isPublicProfile: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
})

// ── Handler ──────────────────────────────────────────────────────

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const result = ProfilUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler.', details: result.error.flatten() },
      { status: 422 },
    )
  }

  const { name, bio, city, state, isPublicProfile, emailNotifications } = result.data

  // Nur geänderte Felder übergeben
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData['name'] = name
  if (bio !== undefined) updateData['bio'] = bio === '' ? null : bio
  if (city !== undefined) updateData['city'] = city === '' ? null : city
  if (state !== undefined) updateData['state'] = state
  if (isPublicProfile !== undefined) updateData['isPublicProfile'] = isPublicProfile
  if (emailNotifications !== undefined) updateData['emailNotifications'] = emailNotifications

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data:  updateData,
      select: {
        id:                 true,
        name:               true,
        bio:                true,
        city:               true,
        state:              true,
        isPublicProfile:    true,
        emailNotifications: true,
        image:              true,
        username:           true,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('[PATCH /api/profil]', error)
    return NextResponse.json(
      { error: 'Profil konnte nicht gespeichert werden.' },
      { status: 500 },
    )
  }
}
