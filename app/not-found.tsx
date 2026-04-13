'use client'

// ─────────────────────────────────────────────────────────────────
// app/not-found.tsx
//
// 404-Seite. Client Component (benötigt history.back()).
// Vollbreite, bg-[#FAFAFA], geometrische SVG-Illustration.
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6 py-16">
      {/* ── Geometrische 404-Illustration ──────────────────────── */}
      <svg
        width="300"
        height="180"
        viewBox="0 0 300 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Dekorative Hintergrund-Elemente */}
        <rect x="0" y="158" width="44" height="3" rx="1.5" fill="#F4F4F5" />
        <rect x="256" y="158" width="44" height="3" rx="1.5" fill="#F4F4F5" />
        <circle cx="150" cy="174" r="4" fill="#E4E4E7" />
        <circle cx="130" cy="170" r="2.5" fill="#F4F4F5" />
        <circle cx="170" cy="170" r="2.5" fill="#F4F4F5" />

        {/* Erste "4" – linke Seite */}
        {/* Linke vertikale Leiste */}
        <rect x="8" y="16" width="13" height="88" rx="4" fill="#D4D4D4" />
        {/* Horizontale Verbindung */}
        <rect x="8" y="63" width="58" height="13" rx="4" fill="#A3A3A3" />
        {/* Rechte vertikale Leiste (länger) */}
        <rect x="53" y="16" width="13" height="116" rx="4" fill="#E5E5E5" />
        {/* Oberes Dekorations-Rechteck */}
        <rect x="14" y="10" width="40" height="8" rx="3" fill="#F4F4F5" />

        {/* "0" – Mitte, Ring aus zwei überlagerten Rechtecken */}
        {/* Äußeres Rechteck (ausgefüllt dunkel) */}
        <rect x="100" y="16" width="100" height="136" rx="50" fill="#D4D4D4" />
        {/* Inneres Ausschnitt-Rechteck (Hintergrundfarbe) */}
        <rect x="122" y="40" width="56" height="88" rx="28" fill="#FAFAFA" />
        {/* Kleine Highlights */}
        <rect x="100" y="44" width="14" height="26" rx="7" fill="#E5E5E5" opacity="0.6" />

        {/* Zweite "4" – rechte Seite (gespiegelt) */}
        {/* Linke vertikale Leiste */}
        <rect x="226" y="16" width="13" height="88" rx="4" fill="#D4D4D4" />
        {/* Horizontale Verbindung */}
        <rect x="226" y="63" width="58" height="13" rx="4" fill="#A3A3A3" />
        {/* Rechte vertikale Leiste */}
        <rect x="271" y="16" width="13" height="116" rx="4" fill="#E5E5E5" />
        {/* Oberes Dekorations-Rechteck */}
        <rect x="238" y="10" width="40" height="8" rx="3" fill="#F4F4F5" />

        {/* Schwebende Mini-Rechtecke als Akzente */}
        <rect x="80" y="8" width="6" height="6" rx="1.5" fill="#E4E4E7" transform="rotate(12 80 8)" />
        <rect x="212" y="8" width="6" height="6" rx="1.5" fill="#E4E4E7" transform="rotate(-8 212 8)" />
        <rect x="88" y="148" width="8" height="4" rx="2" fill="#F4F4F5" />
        <rect x="204" y="148" width="8" height="4" rx="2" fill="#F4F4F5" />
      </svg>

      {/* ── Text ────────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold text-[#0A0A0A] mt-8">
        Seite nicht gefunden.
      </h2>
      <p className="text-[#71717A] mt-2 text-center max-w-xs leading-relaxed">
        Diese Seite existiert nicht oder wurde verschoben.
      </p>

      {/* ── Buttons ─────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 bg-[#16A34A] text-white font-semibold px-6 py-3 rounded-xl
                     hover:bg-[#15803D] transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Home size={18} />
          Zur Startseite
        </Link>
        <button
          onClick={() => history.back()}
          className="flex items-center gap-2 border border-[#E4E4E7] text-[#52525B] font-medium
                     px-6 py-3 rounded-xl hover:bg-[#F4F4F5] hover:border-[#D4D4D8]
                     transition-all hover:-translate-y-0.5"
        >
          <ArrowLeft size={18} />
          Zurück
        </button>
      </div>

      {/* Kleine Branding-Note */}
      <p className="text-[#A1A1AA] text-xs mt-12">
        SportRise.de — Kostenlos. Werbefrei.
      </p>
    </div>
  )
}
