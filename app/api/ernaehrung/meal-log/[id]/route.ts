// ─────────────────────────────────────────────────────────────────
// DELETE /api/ernaehrung/meal-log/[id]
//
// Löscht einen einzelnen Mahlzeiten-Eintrag des authentifizierten Users.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id
  const { id } = params

  if (!id || typeof id !== 'string') {
    return Response.json({ error: 'ID fehlt.' }, { status: 400 })
  }

  try {
    // Sicherheitscheck: Eintrag muss dem User gehören
    const existing = await prisma.mealLog.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return Response.json({ error: 'Eintrag nicht gefunden.' }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return Response.json({ error: 'Keine Berechtigung.' }, { status: 403 })
    }

    await prisma.mealLog.delete({ where: { id } })

    return Response.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/ernaehrung/meal-log/[id]]', error)
    return Response.json({ error: 'Eintrag konnte nicht gelöscht werden.' }, { status: 500 })
  }
}
