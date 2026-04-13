// ─────────────────────────────────────────────────────────────────
// GET  /api/ernaehrung/einstellungen  → aktuelle Einstellungen laden
// PATCH /api/ernaehrung/einstellungen → Einstellungen speichern
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  EinstellungenSchema,
  DEFAULT_ERNAEHRUNG_EINSTELLUNGEN,
} from '@/lib/ernaehrung-settings'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nutritionSettings: true },
    })

    const raw = user?.nutritionSettings
    const parsed = EinstellungenSchema.safeParse(raw)

    return Response.json(
      parsed.success ? parsed.data : DEFAULT_ERNAEHRUNG_EINSTELLUNGEN,
    )
  } catch (error) {
    console.error('[GET /api/ernaehrung/einstellungen]', error)
    return Response.json(
      { error: 'Einstellungen konnten nicht geladen werden.' },
      { status: 500 },
    )
  }
}

// ── PATCH ─────────────────────────────────────────────────────────

export async function PATCH(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const result = EinstellungenSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validierungsfehler.', details: result.error.flatten() },
      { status: 422 },
    )
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { nutritionSettings: result.data },
    })

    return Response.json({ success: true, settings: result.data })
  } catch (error) {
    console.error('[PATCH /api/ernaehrung/einstellungen]', error)
    return Response.json(
      { error: 'Einstellungen konnten nicht gespeichert werden.' },
      { status: 500 },
    )
  }
}
