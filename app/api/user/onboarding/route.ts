// ─────────────────────────────────────────────────────────────────
// PATCH /api/user/onboarding
//
// Setzt onboardingDone = true für den eingeloggten User.
// Wird am Ende des Onboarding-Wizards aufgerufen.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH() {
  const session = await auth()

  if (!session?.user?.id) {
    return Response.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { onboardingDone: true },
  })

  return Response.json({ success: true })
}
