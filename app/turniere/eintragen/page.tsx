// ─────────────────────────────────────────────────────────────────
// app/turniere/eintragen/page.tsx – Server Wrapper
// ─────────────────────────────────────────────────────────────────

import { Suspense } from 'react'
import type { Metadata } from 'next'
import TurnierEintragenClient from './TurnierEintragenClient'

export const metadata: Metadata = {
  title: 'Turnier eintragen | SportRise',
  description: 'Trag dein Turnier kostenlos auf SportRise ein – geprüft innerhalb 24–48 Stunden.',
}

export default function TurnierEintragenPage() {
  return (
    <Suspense>
      <TurnierEintragenClient />
    </Suspense>
  )
}
