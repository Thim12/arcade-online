// ─────────────────────────────────────────────────────────────────
// app/vereine/page.tsx – Vereinssuche Server Component
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { VereinSucheClient } from '@/components/vereine/VereinSucheClient'

export const metadata: Metadata = {
  title: 'Vereinssuche | SportRise',
  description:
    'Finde Sportvereine in deiner Nähe. Kostenlos, werbefreie Vereinssuche für Jugendliche und Amateursportler in Deutschland.',
}

export default async function VereineSeite() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return <VereinSucheClient isLoggedIn={isLoggedIn} />
}
