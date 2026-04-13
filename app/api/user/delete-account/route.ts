// ─────────────────────────────────────────────────────────────────
// app/api/user/delete-account/route.ts
//
// DELETE /api/user/delete-account
// Löscht den eingeloggten User vollständig aus der Datenbank.
// Alle verknüpften Daten werden per Prisma-CASCADE mitgelöscht:
//   UserSports, TrainingPlans, TrainingSessions, UserBadges,
//   Posts, PostLikes, PostComments, TournamentEntries,
//   VereinFollows, NutritionPlans, AiUsageLogs, Notifications,
//   Accounts (OAuth), Sessions (NextAuth)
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function DELETE(): Promise<NextResponse> {
  // ── Authentifizierung prüfen ───────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Nicht autorisiert. Bitte zuerst einloggen.' },
      { status: 401 },
    )
  }

  const userId = session.user.id

  // ── User existiert? ────────────────────────────────────────────
  const exists = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true },
  }).catch(() => null)

  if (!exists) {
    return NextResponse.json(
      { error: 'Account nicht gefunden.' },
      { status: 404 },
    )
  }

  // ── Löschen (CASCADE in Prisma-Schema übernimmt alle Relations) ─
  try {
    // 1. Supabase Auth User suchen und löschen (graceful)
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
      if (dbUser?.email) {
        const supabaseUser = userList.users.find(
          (u) => u.email?.toLowerCase() === dbUser.email!.toLowerCase(),
        )
        if (supabaseUser) {
          await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id)
        }
      }
    } catch (supabaseErr) {
      console.error('[delete-account] Supabase Auth sync fehlgeschlagen:', supabaseErr)
    }

    // 2. Prisma User löschen (CASCADE löscht alle verknüpften Daten)
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[delete-account] Fehler beim Löschen:', err)
    return NextResponse.json(
      { error: 'Account konnte nicht gelöscht werden. Bitte erneut versuchen.' },
      { status: 500 },
    )
  }
}
