// ─────────────────────────────────────────────────────────────────
// app/vereine/eintragen/page.tsx – Server Wrapper
// ─────────────────────────────────────────────────────────────────

import { Suspense } from 'react'
import type { Metadata } from 'next'
import VereinEintragenClient from './VereinEintragenClient'

export const metadata: Metadata = {
  title: 'Verein eintragen | SportRise',
  description: 'Trag deinen Verein kostenlos auf SportRise ein – geprüft innerhalb 24–48 Stunden.',
}

export default function VereinEintragenPage() {
  return (
    <Suspense>
      <VereinEintragenClient />
    </Suspense>
  )
}
