// ─────────────────────────────────────────────────────────────────
// app/onboarding/page.tsx – Server Component
//
// Guard: Nicht eingeloggt → /registrieren
//        onboardingDone   → /dashboard
// Übergibt vorname + primarySport an den Client-Wizard.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/registrieren')
  }

  if (session.user.onboardingDone === true) {
    redirect('/dashboard')
  }

  const vorname      = session.user.name?.split(' ')[0] ?? 'Sportler'
  const primarySport = session.user.primarySport ?? null

  return (
    <OnboardingClient
      vorname={vorname}
      primarySport={primarySport}
    />
  )
}
