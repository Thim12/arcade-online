// ─────────────────────────────────────────────────────────────────
// next.config.mjs – Next.js Konfiguration
//
// Security-Headers, Image-Optimierung, TypeScript-Build-Checks
// und Performance-Logging für SportRise.de
// ─────────────────────────────────────────────────────────────────

/** @type {import('next').NextConfig} */

// ── Security-Headers ─────────────────────────────────────────────
// Werden auf alle Routen angewendet (source: '/(.*)')
const securityHeaders = [
  // Verhindert Clickjacking (kein Einbetten in iframes)
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Verhindert MIME-Type-Sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Referrer-Info nur an gleiche Origin senden
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Kamera/Mikrofon/Standort sperren (außer eigene Herkunft für Standort)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
  // DNS-Prefetching für Performance erlauben
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // Content Security Policy
  // Erlaubt: eigene Origin, Google OAuth, Google Maps, Supabase, Vercel Analytics
  // Sperrt: object-src (kein Flash/Plugins), frame-src außer Google (für OAuth)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js benötigt 'unsafe-eval' für HMR und 'unsafe-inline' für Styled-JSX
      // In Production kann 'unsafe-eval' entfernt werden, wenn kein eval() genutzt wird
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-scripts.com vitals.vercel-insights.com maps.googleapis.com accounts.google.com",
      // Tailwind und inline-Styles benötigen 'unsafe-inline'
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      // Google Fonts und eigene Fonts
      "font-src 'self' fonts.gstatic.com",
      // Bilder: eigene Domain, Unsplash, Supabase Storage, Google-Avatare, Maps-Tiles
      "img-src 'self' data: blob: images.unsplash.com *.supabase.co lh3.googleusercontent.com avatars.githubusercontent.com maps.googleapis.com maps.gstatic.com *.googleusercontent.com",
      // API-Calls: Supabase, Vercel Analytics, Google Maps, Google Auth
      "connect-src 'self' *.supabase.co vitals.vercel-insights.com *.vercel-insights.com maps.googleapis.com accounts.google.com",
      // Google OAuth-Popup und Maps-Iframes
      "frame-src accounts.google.com",
      // Keine Flash-/Plugin-Objekte
      "object-src 'none'",
      // Nur eigene Origin als Basis für relative URLs
      "base-uri 'self'",
      // Formulare nur an eigene Origin senden
      "form-action 'self' accounts.google.com",
      // HTTP → HTTPS erzwingen
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig = {
  // TypeScript-Fehler im Build verhindern den Deploy — kein silences ignoreBuildErrors
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint-Fehler im Build ebenfalls nicht ignorieren
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ── Image-Optimierung ──────────────────────────────────────────
  images: {
    remotePatterns: [
      // Supabase Storage (alle Subdomains für verschiedene Projekte)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      // Google OAuth Profilbilder
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // GitHub OAuth Profilbilder (optional)
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Unsplash (nur Sportplätze und Natur, keine Personen)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // ── Experimental ──────────────────────────────────────────────
  experimental: {
    // Prisma-Client läuft als Server-seitiges Package (kein Edge-Runtime-Bundle)
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // ── Security-Headers für alle Routen ──────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // ── Logging ───────────────────────────────────────────────────
  // In Production nur minimales Logging — kein vollständiges Fetch-URL-Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
}

export default nextConfig
