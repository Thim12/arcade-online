// ─────────────────────────────────────────────────────────────────
// middleware.ts – Next.js App Router Middleware
//
// Schützt Routen basierend auf:
//   1. CRON-Secret-Prüfung (/api/cron/*)
//   2. Öffentliche Routen ohne Auth-Pflicht
//   3. Auth-Pflicht für alle geschützten Routen
//   4. Admin-Schutz (/admin/*)
//   5. Gym-Sperre für Nutzer ohne gymAccessEnabled (unter 14-Jährige)
//   6. Onboarding-Gate (/dashboard ohne onboardingDone)
//
// Läuft auf der Edge Runtime — kein Node.js, kein Prisma-Client.
// Session-Felder (role, gymAccessEnabled, onboardingDone) werden
// beim Login in lib/auth.ts als JWT-Claims gesetzt und sind hier verfügbar.
//
// Route Groups wie app/(static)/ueber-uns beeinflussen die URL nicht —
// /ueber-uns und /faq sind als öffentliche Pfade explizit gelistet.
// ─────────────────────────────────────────────────────────────────

import NextAuth from 'next-auth'
import authConfig from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

// ── Öffentliche Routen (kein Login erforderlich) ─────────────────
// Hinweis: app/(static)/ueber-uns → URL /ueber-uns
//          app/(static)/faq       → URL /faq
const PUBLIC_PATHS = [
  '/',
  '/vereine',
  '/turniere',
  '/login',
  '/registrieren',
  '/datenschutz',
  '/impressum',
  '/agb',
  '/faq',
  '/ueber-uns',
  '/kontakt',
]

// Prefixes die öffentlich sind (z.B. /vereine/1234-fc-frankfurt)
const PUBLIC_PREFIXES = [
  '/vereine/',
  '/turniere/',
  '/api/public/',
  '/_next/',
  '/favicon',
]

// ── Geschützte Routen (Login erforderlich) ───────────────────────
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/training',
  '/ernaehrung',
  '/profil',
  '/community',
  '/sparring',
  '/onboarding',
]

// ── Middleware-Handler ───────────────────────────────────────────

export default auth(
  (
    req: NextRequest & {
      auth: {
        user?: {
          id?: string
          role?: string
          gymAccessEnabled?: boolean
          onboardingDone?: boolean
        }
      } | null
    },
  ) => {
    const { pathname } = req.nextUrl
    const session = req.auth
    const isLoggedIn = !!session?.user

    // ── 1. Cron-Job Authentifizierung ────────────────────────────
    // Muss als erstes geprüft werden — keine Session erforderlich.
    // Vercel sendet den CRON_SECRET im Authorization-Header.
    if (pathname.startsWith('/api/cron/')) {
      const authHeader = req.headers.get('Authorization')
      const cronSecret = process.env.CRON_SECRET

      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Nicht autorisiert' },
          { status: 401 },
        )
      }
      return NextResponse.next()
    }

    // ── 2. Statische und öffentliche Ressourcen ──────────────────
    const isPublic =
      PUBLIC_PATHS.includes(pathname) ||
      PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

    if (isPublic) return NextResponse.next()

    // ── 3. NextAuth-interne API-Routen immer erlauben ───────────
    if (pathname.startsWith('/api/auth/')) return NextResponse.next()

    // ── 4. Auth-Pflicht für geschützte Routen ───────────────────
    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    )

    if (isProtected && !isLoggedIn) {
      const loginUrl = new URL('/login', req.nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Ab hier: User ist eingeloggt (oder Route ist weder public noch protected)
    if (isLoggedIn && session.user) {
      const user = session.user

      // ── 5. Admin-Schutz (/admin/*) ─────────────────────────────
      // Nur User mit role = 'ADMIN' dürfen das Admin-Dashboard sehen.
      // Alle anderen werden zur Startseite umgeleitet.
      if (pathname.startsWith('/admin')) {
        if (user.role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/', req.nextUrl.origin))
        }
        return NextResponse.next()
      }

      // ── 6. Gym-Zugangs-Kontrolle (/training/gym) ───────────────
      // gymAccessEnabled wird im JWT auf false gesetzt für Nutzer
      // unter 14 Jahren. Das Gym-Bereich enthält intensive Programme,
      // die für jüngere Nutzer nicht geeignet sind.
      if (pathname.startsWith('/training/gym')) {
        if (!user.gymAccessEnabled) {
          return NextResponse.redirect(
            new URL('/training', req.nextUrl.origin),
          )
        }
      }

      // ── 7. Onboarding-Gate ─────────────────────────────────────
      // Nutzer, die /dashboard besuchen wollen ohne Onboarding abgeschlossen
      // zu haben, werden zu /onboarding umgeleitet.
      // /onboarding selbst ist ausgenommen um Redirect-Schleifen zu verhindern.
      if (
        pathname.startsWith('/dashboard') &&
        !user.onboardingDone &&
        !pathname.startsWith('/onboarding')
      ) {
        return NextResponse.redirect(
          new URL('/onboarding', req.nextUrl.origin),
        )
      }
    }

    return NextResponse.next()
  },
)

// ── Matcher-Konfiguration ────────────────────────────────────────
// Alle Routen außer statische Assets, Next.js-interne Routen,
// Bilder, Fonts und bekannte statische Dateien.

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js)$).*)',
  ],
}
