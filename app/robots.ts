// ─────────────────────────────────────────────────────────────────
// app/robots.ts – robots.txt Konfiguration
//
// Erlaubt Crawling aller öffentlichen Seiten.
// Sperrt sensible Bereiche: Admin, API, Nutzer-Dashboard,
// Profileinstellungen und interne Next.js-Routen.
// ─────────────────────────────────────────────────────────────────

import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportrise.de'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Alle Crawler
        userAgent: '*',
        allow: [
          '/',
          '/vereine',
          '/vereine/',
          '/turniere',
          '/turniere/',
          '/ueber-uns',
          '/faq',
          '/datenschutz',
          '/impressum',
          '/agb',
        ],
        disallow: [
          // Admin-Bereich
          '/admin',
          '/admin/',
          // Alle API-Routen (keine öffentliche Crawler-Relevanz)
          '/api/',
          // Eingeloggte Nutzer-Bereiche
          '/dashboard',
          '/dashboard/',
          '/training',
          '/training/',
          '/ernaehrung',
          '/ernaehrung/',
          '/profil/',
          '/profil/einstellungen',
          '/community',
          '/community/',
          '/sparring',
          '/sparring/',
          '/benachrichtigungen',
          '/onboarding',
          '/onboarding/',
          // Auth-Seiten (kein SEO-Wert)
          '/login',
          '/registrieren',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
