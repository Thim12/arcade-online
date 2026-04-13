'use client'

// ─────────────────────────────────────────────────────────────────
// app/error.tsx
//
// Globale Fehler-Seite. MUSS 'use client' sein (Next.js Pflicht).
// Zeigt in Produktion: generische Nachricht.
// Zeigt in Entwicklung: vollständige Error-Details.
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6 py-16">
      {/* ── Icon ──────────────────────────────────────────────── */}
      <AlertTriangle
        size={80}
        strokeWidth={1.5}
        className="text-[#E4E4E7]"
      />

      {/* ── Text ────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold text-[#0A0A0A] mt-8">
        Etwas ist schiefgelaufen.
      </h2>
      <p className="text-[#71717A] mt-2 text-center max-w-xs leading-relaxed">
        Ein unerwarteter Fehler ist aufgetreten.
        {error.digest && (
          <span className="block text-xs text-[#A1A1AA] mt-1">
            Fehler-ID: {error.digest}
          </span>
        )}
      </p>

      {/* ── Dev-only: Error-Details ──────────────────────────────── */}
      {isDev && (
        <div className="mt-6 w-full max-w-lg bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4">
          <p className="text-[#991B1B] text-xs font-semibold uppercase tracking-wide mb-2">
            Entwickler-Info (nur in Development sichtbar)
          </p>
          <code className="text-[#B91C1C] text-xs font-mono block whitespace-pre-wrap break-all leading-relaxed">
            {error.name}: {error.message}
            {error.stack && `\n\n${error.stack}`}
          </code>
        </div>
      )}

      {/* ── Buttons ─────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-[#16A34A] text-white font-semibold px-6 py-3 rounded-xl
                     hover:bg-[#15803D] transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <RefreshCw size={18} />
          Seite neu laden
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 border border-[#E4E4E7] text-[#52525B] font-medium
                     px-6 py-3 rounded-xl hover:bg-[#F4F4F5] hover:border-[#D4D4D8]
                     transition-all hover:-translate-y-0.5"
        >
          <Home size={18} />
          Zur Startseite
        </Link>
      </div>

      <p className="text-[#A1A1AA] text-xs mt-12">
        SportRise.de — Kostenlos. Werbefrei.
      </p>
    </div>
  )
}
