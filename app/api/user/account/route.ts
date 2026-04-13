// ─────────────────────────────────────────────────────────────────
// DELETE /api/user/account
//
// Löscht den eingeloggten Account nach Bestätigung.
// Body: { confirmToken: "LÖSCHEN" }
//
// Unterschied zu /api/user/delete-account:
//   Diese Route erfordert explizite Bestätigung via confirmToken.
//   Löscht zusätzlich den Supabase Auth User (graceful).
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin } from '@/lib/supabase'

const CONFIRM_TOKEN = 'LÖSCHEN'

export async function DELETE(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  // Bestätigungs-Token aus Body lesen
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const { confirmToken } = body as { confirmToken?: unknown }

  if (typeof confirmToken !== 'string' || confirmToken !== CONFIRM_TOKEN) {
    return NextResponse.json(
      { error: `Zur Bestätigung muss "${CONFIRM_TOKEN}" eingegeben werden.` },
      { status: 400 },
    )
  }

  const userId = session.user.id

  // Prüfen ob User existiert
  const exists = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, email: true },
  })

  if (!exists) {
    return NextResponse.json({ error: 'Account nicht gefunden.' }, { status: 404 })
  }

  try {
    // 1. Supabase Auth User löschen (graceful – Fehler nicht weiterwerfen)
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
      const supabaseUser = userList.users.find(
        (u) => u.email?.toLowerCase() === exists.email.toLowerCase(),
      )
      if (supabaseUser) {
        await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id)
      }
    } catch (supabaseErr) {
      console.error('[DELETE /api/user/account] Supabase Auth sync fehlgeschlagen:', supabaseErr)
    }

    // 2. Prisma User löschen (CASCADE löscht alle Relationen)
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/user/account]', error)
    return NextResponse.json(
      { error: 'Account konnte nicht gelöscht werden. Bitte erneut versuchen.' },
      { status: 500 },
    )
  }
}
