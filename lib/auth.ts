// ─────────────────────────────────────────────────────────────────
// auth.ts – Vollständige NextAuth v5 Konfiguration (Node.js only)
//
// Erweitert auth.config.ts um:
//   - PrismaAdapter (Session-Persistenz für OAuth)
//   - Credentials Provider (E-Mail + Passwort)
//   - JWT-Callback: lädt User-Daten aus DB beim Login
//   - SignIn-Event: Streak-Logik aktualisieren
// ─────────────────────────────────────────────────────────────────

import NextAuth, { type DefaultSession, CredentialsSignin } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import authConfig from './auth.config'
import { prisma } from './prisma'

// ── Module Augmentation ──────────────────────────────────────────

// ── Custom Credential Errors ──────────────────────────────────────
// Gibt dem Login-Formular differenzierte Fehlercodes zurück.
// result.error = 'user_not_found' | 'wrong_password' | 'CredentialsSignin'
class UserNotFoundError extends CredentialsSignin {
  code = 'user_not_found' as const
}
class WrongPasswordError extends CredentialsSignin {
  code = 'wrong_password' as const
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      xp: number
      level: number
      gymAccessEnabled: boolean
      onboardingDone: boolean
      primarySport: string | null
    } & DefaultSession['user']
  }
}

// Lokales Interface für app-spezifische JWT-Felder.
// next-auth/jwt module augmentation ist in beta.25 nicht verfügbar →
// explizite Type-Cast-Strategie über AppToken.
interface AppToken {
  userId?: string
  role?: string
  xp?: number
  level?: number
  gymAccessEnabled?: boolean
  onboardingDone?: boolean
  primarySport?: string | null
  sub?: string
}

// ── NextAuth Export ──────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  // Prisma Adapter: speichert OAuth-Accounts und Sessions in der DB
  adapter: PrismaAdapter(prisma),

  providers: [
    // Google OAuth (aus authConfig übernommen)
    ...authConfig.providers,

    // Credentials: E-Mail + Passwort Login (bcrypt)
    Credentials({
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        // Edge-Case: fehlende Daten
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== 'string' ||
          typeof credentials.password !== 'string'
        ) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        // Kein User gefunden oder OAuth-only User (kein Passwort gesetzt)
        if (!user || !user.password) throw new UserNotFoundError()

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) throw new WrongPasswordError()

        return user
      },
    }),
  ],

  callbacks: {
    // ── JWT-Callback ─────────────────────────────────────────────
    // Wird bei jedem Request aufgerufen.
    // Nur beim ersten Login (wenn `user` vorhanden) DB-Abfrage.
    async jwt({ token, user, trigger, session }) {
      // Beim initialen Login: User-Daten aus DB laden und in Token cachen
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            role: true,
            xp: true,
            level: true,
            gymAccessEnabled: true,
            onboardingDone: true,
            sports: {
              include: { sport: { select: { slug: true } } },
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        })

        if (dbUser) {
          const appToken = token as unknown as AppToken
          appToken.userId = dbUser.id
          appToken.role = dbUser.role
          appToken.xp = dbUser.xp
          appToken.level = dbUser.level
          appToken.gymAccessEnabled = dbUser.gymAccessEnabled
          appToken.onboardingDone = dbUser.onboardingDone
          appToken.primarySport = dbUser.sports[0]?.sport.slug ?? null
        }
      }

      // Bei useSession().update({ onboardingDone: true }): Token-Feld aktualisieren,
      // damit die Client-Session sofort den neuen Wert reflektiert.
      if (trigger === 'update' && session !== null && session !== undefined && typeof session === 'object') {
        const appToken = token as unknown as AppToken
        const raw = session as unknown as Record<string, unknown>
        if (typeof raw['onboardingDone'] === 'boolean') {
          appToken.onboardingDone = raw['onboardingDone'] as boolean
        }
      }

      return token
    },

    // ── Session-Callback ─────────────────────────────────────────
    // Befüllt die Client-seitige Session aus dem JWT-Token.
    async session({ session, token }) {
      const appToken = token as unknown as AppToken
      session.user.id = appToken.userId ?? appToken.sub ?? ''
      session.user.role = appToken.role ?? 'USER'
      session.user.xp = appToken.xp ?? 0
      session.user.level = appToken.level ?? 1
      session.user.gymAccessEnabled = appToken.gymAccessEnabled ?? false
      session.user.onboardingDone = appToken.onboardingDone ?? false
      session.user.primarySport = appToken.primarySport ?? null
      return session
    },
  },

  events: {
    // ── SignIn-Event: Streak-Tracking ────────────────────────────
    // Läuft nach jedem erfolgreichen Login.
    // Aktualisiert streakDays, longestStreak und lastActiveDate.
    // Fehler brechen den Login NIEMALS ab (try/catch).
    async signIn({ user }) {
      if (!user.id) return

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            lastActiveDate: true,
            streakDays: true,
            longestStreak: true,
          },
        })

        if (!dbUser) return

        const now = new Date()
        // Normalisierung auf Tagesebene (ohne Uhrzeit) für korrekten Vergleich
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // Erster Login ever
        if (!dbUser.lastActiveDate) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastActiveDate: now,
              streakDays: 1,
              longestStreak: Math.max(dbUser.longestStreak, 1),
            },
          })
          return
        }

        const lastDate = new Date(
          dbUser.lastActiveDate.getFullYear(),
          dbUser.lastActiveDate.getMonth(),
          dbUser.lastActiveDate.getDate(),
        )

        const diffDays = Math.round(
          (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        )

        // Heute schon eingeloggt – nichts tun
        if (diffDays === 0) return

        // Gestern eingeloggt → Streak fortführen
        // Mehr als 1 Tag Pause → Streak auf 1 zurücksetzen
        const newStreak = diffDays === 1 ? dbUser.streakDays + 1 : 1

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastActiveDate: now,
            streakDays: newStreak,
            longestStreak: Math.max(dbUser.longestStreak, newStreak),
          },
        })
      } catch {
        // Streak-Fehler dürfen den Login nicht blockieren
      }
    },
  },
})
