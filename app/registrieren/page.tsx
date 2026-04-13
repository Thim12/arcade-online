// ─────────────────────────────────────────────────────────────────
// app/registrieren/page.tsx – Server Component
// ─────────────────────────────────────────────────────────────────

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import RegistrierenClient from './RegistrierenClient'

export const metadata: Metadata = {
  title: 'Registrieren – SportRise',
  description: 'Erstelle dein kostenloses SportRise-Konto.',
}

export default async function RegistrierenPage() {
  const session = await auth()
  if (session !== null) redirect('/dashboard')

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
      <RegistrierenClient />
    </Suspense>
  )
}
