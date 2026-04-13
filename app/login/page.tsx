// ─────────────────────────────────────────────────────────────────
// app/login/page.tsx – Server Component
//
// Aufgaben:
//   1. Eingeloggte User direkt zu /dashboard weiterleiten
//   2. error + callbackUrl aus searchParams extrahieren
//   3. LoginClient rendern (Client Component)
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: 'Anmelden',
  description: 'Melde dich bei SportRise an und starte dein Training.',
}

interface LoginPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()

  // Bereits eingeloggt → kein Grund, die Login-Seite zu zeigen
  if (session?.user) {
    redirect('/dashboard')
  }

  // Werte sicher als string extrahieren (kein Array, kein undefined)
  const rawError = searchParams.error
  const rawCallbackUrl = searchParams.callbackUrl

  const error = typeof rawError === 'string' ? rawError : undefined
  const callbackUrl = typeof rawCallbackUrl === 'string' ? rawCallbackUrl : undefined

  return <LoginClient error={error} callbackUrl={callbackUrl} />
}
