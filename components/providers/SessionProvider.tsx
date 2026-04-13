'use client'

// ─────────────────────────────────────────────────────────────────
// SessionProvider – Client-seitiger Wrapper für NextAuth v5
// Macht useSession() in allen Client-Komponenten verfügbar.
// ─────────────────────────────────────────────────────────────────

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: React.ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps): React.JSX.Element {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
