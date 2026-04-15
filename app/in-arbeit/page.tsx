// ─────────────────────────────────────────────────────────────────
// app/in-arbeit/page.tsx – "Coming Soon / In Arbeit"-Seite
//
// Professionelle Platzhalter-Seite für Features, die noch nicht
// implementiert sind. Wird von Links wie /ki-assistent, /einstellungen,
// /kontakt etc. verwendet.
// ─────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import PageLayout from '@/components/layout/PageLayout'
import InArbeitClient from './InArbeitClient'

export const metadata: Metadata = {
  title: 'In Arbeit',
  description: 'Dieses Feature wird gerade entwickelt und ist bald verfügbar.',
}

export default function InArbeitPage() {
  return (
    <PageLayout>
      <InArbeitClient />
    </PageLayout>
  )
}
