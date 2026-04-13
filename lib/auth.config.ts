// ─────────────────────────────────────────────────────────────────
// auth.config.ts – Edge-kompatible NextAuth-Konfiguration
//
// Diese Datei wird sowohl von middleware.ts (Edge-Runtime) als auch
// von auth.ts (Node.js) importiert.
// KEINE Prisma-Imports hier – Edge Runtime hat kein Node.js!
// ─────────────────────────────────────────────────────────────────

import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: { strategy: 'jwt' as const },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // trustHost erlaubt Next.js auf localhost und Vercel ohne explizite NEXTAUTH_URL
  trustHost: true,

  callbacks: {
    // ── Session-Callback (Edge-safe: liest nur aus dem JWT-Token) ──────────
    // Wird von middleware.ts verwendet um req.auth zu befüllen.
    // Alle custom Felder wurden beim Login in auth.ts ins Token geschrieben.
    session({ session, token }) {
      session.user.id = (token.userId as string | undefined) ?? token.sub ?? ''
      session.user.role = (token.role as string | undefined) ?? 'USER'
      session.user.xp = (token.xp as number | undefined) ?? 0
      session.user.level = (token.level as number | undefined) ?? 1
      session.user.gymAccessEnabled = (token.gymAccessEnabled as boolean | undefined) ?? false
      session.user.onboardingDone = (token.onboardingDone as boolean | undefined) ?? false
      session.user.primarySport = (token.primarySport as string | null | undefined) ?? null
      return session
    },
  },
} satisfies NextAuthConfig
