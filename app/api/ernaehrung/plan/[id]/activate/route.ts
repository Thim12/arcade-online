// ─────────────────────────────────────────────────────────────────
// POST /api/ernaehrung/plan/[id]/activate
//
// Aktiviert einen Ernährungsplan für den angemeldeten User.
// Deaktiviert alle anderen Pläne desselben Users atomisch.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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

  // ── Alle Pläne deaktivieren, dann Zielplan aktivieren ────────
  await prisma.$transaction([
    prisma.nutritionPlan.updateMany({
      where: { userId },
      data: { isActive: false },
    }),
    prisma.nutritionPlan.update({
      where: { id: planId },
      data: { isActive: true },
    }),
  ])

  return Response.json({ success: true })
}
