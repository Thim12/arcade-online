// ─────────────────────────────────────────────────────────────────
// POST /api/easter-egg/all-faq-opened
//
// Wird aufgerufen wenn der User alle FAQ-Einträge mindestens einmal
// geöffnet hat. Vergibt das Badge "Stiller Leser" + 200 XP.
//
// Idempotent: wiederholte Aufrufe vergeben das Badge nicht erneut.
// Gibt { success, awarded, xpAwarded } zurück.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAllFaqOpenedEasterEgg } from '@/lib/ai/easter-eggs'

export async function POST(): Promise<NextResponse> {
  try {
    const session = await auth()

    // Nicht eingeloggte Nutzer erhalten kein Easter-Egg — kein Fehler,
    // nur stille Ablehnung (kein 401 der im Frontend auffällt)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, awarded: false, xpAwarded: 0 })
    }

    // Prüfung und Vergabe via bestehende Easter-Egg-Logik in /lib/ai/easter-eggs.ts
    const awarded = await checkAllFaqOpenedEasterEgg(session.user.id, prisma)

    return NextResponse.json({
      success: true,
      awarded,
      // 200 XP nur wenn das Badge gerade zum ersten Mal vergeben wurde
      xpAwarded: awarded ? 200 : 0,
    })
  } catch {
    // Easter-Egg-Fehler dürfen niemals den User beeinflussen
    return NextResponse.json({ success: false, awarded: false, xpAwarded: 0 })
  }
}
