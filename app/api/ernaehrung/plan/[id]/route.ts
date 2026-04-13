// ─────────────────────────────────────────────────────────────────
// DELETE /api/ernaehrung/plan/[id]
//
// Löscht einen Ernährungsplan des angemeldeten Users.
// Eigentümerschaft wird geprüft – fremde Pläne werden mit 404
// abgewiesen (kein Timing-Side-Channel).
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id
  const planId = params.id

  if (!planId || typeof planId !== 'string') {
    return Response.json({ error: 'Ungültige Plan-ID.' }, { status: 400 })
  }

  // ── Eigentümerschaft prüfen ───────────────────────────────────
  const plan = await prisma.nutritionPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  })

  if (plan === null) {
    return Response.json({ error: 'Plan nicht gefunden.' }, { status: 404 })
  }

  await prisma.nutritionPlan.delete({ where: { id: planId } })

  return Response.json({ success: true })
}
