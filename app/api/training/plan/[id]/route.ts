// ─────────────────────────────────────────────────────────────────
// DELETE /api/training/plan/[id]
//
// Löscht den Trainingsplan des eingeloggten Users endgültig.
// Alle verknüpften Sessions bleiben bestehen (planId → SetNull).
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id
  const planId = params.id

  try {
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
      select: { userId: true },
    })

    if (plan === null) {
      return Response.json({ error: 'Plan nicht gefunden.' }, { status: 404 })
    }

    if (plan.userId !== userId) {
      return Response.json({ error: 'Keine Berechtigung.' }, { status: 403 })
    }

    await prisma.trainingPlan.delete({ where: { id: planId } })

    return Response.json({
      success: true,
      data: { message: 'Trainingsplan wurde gelöscht.' },
    })
  } catch (error) {
    console.error('[DELETE /api/training/plan/[id]]', error)
    return Response.json({ error: 'Plan konnte nicht gelöscht werden.' }, { status: 500 })
  }
}
