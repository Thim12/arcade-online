// ─────────────────────────────────────────────────────────────────
// PATCH /api/training/plan/[id]/pause
//
// Pausiert oder reaktiviert einen Trainingsplan.
// Setzt isActive auf den jeweils anderen Wert.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function PATCH(_req: Request, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id
  const planId = params.id

  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
      select: { userId: true, isActive: true },
    })

    if (plan === null) {
      return Response.json({ error: 'Plan nicht gefunden.' }, { status: 404 })
    }

    if (plan.userId !== userId) {
      return Response.json({ error: 'Keine Berechtigung.' }, { status: 403 })
    }

    const updated = await prisma.trainingPlan.update({
      where: { id: planId },
      data: { isActive: !plan.isActive },
      select: { id: true, isActive: true },
    })

    return Response.json({
      success: true,
      data: {
        id: updated.id,
        isActive: updated.isActive,
        message: updated.isActive ? 'Plan wurde reaktiviert.' : 'Plan wurde pausiert.',
      },
    })
  } catch (error) {
    console.error('[PATCH /api/training/plan/[id]/pause]', error)
    return Response.json({ error: 'Plan konnte nicht aktualisiert werden.' }, { status: 500 })
  }
}
