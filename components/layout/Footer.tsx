// ─────────────────────────────────────────────────────────────────
// Footer – Globaler Seitenfuß für SportRise.de
//
// Design: Dunkles Navy-Hintergrund (#0A0F1E), weißer Text.
// Spalten: Über SportRise, Sportarten, Features, Rechtliches.
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { Instagram, Twitter } from 'lucide-react'

// ── Typen ─────────────────────────────────────────────────────────

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  heading: string
  links: FooterLink[]
}

// ── Konstanten ────────────────────────────────────────────────────

const ACTIVE_SPORTS: FooterLink[] = [
  { label: 'Fußball', href: '/fussball' },
  { label: 'Tennis', href: '/tennis' },
  { label: 'Basketball', href: '/basketball' },
]

const COMING_SOON_SPORTS: string[] = [
  'Leichtathletik',
  'Schwimmen',
  'Volleyball',
  'Handball',
  'Badminton',
]

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Features',
    links: [
      { label: 'Trainingsplan', href: '/training' },
      { label: 'KI-Assistent', href: '/ki-assistent' },
      { label: 'Vereinssuche', href: '/vereine' },
      { label: 'Turniere', href: '/turniere' },
      { label: 'Community', href: '/community' },
      { label: 'Gamification', href: '/profil' },
    ],
  },
  {
    heading: 'Rechtliches',
    links: [
      { label: 'Datenschutzerklärung', href: '/datenschutz' },
      { label: 'Impressum', href: '/impressum' },
      { label: 'Nutzungsbedingungen', href: '/nutzungsbedingungen' },
      { label: 'Kontakt', href: '/kontakt' },
    ],
  },
]

// ── Footer-Logo ───────────────────────────────────────────────────

function FooterLogo(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {/* Custom Lightning-Bolt SVG */}
      <svg
        width="13"
        height="22"
        viewBox="0 0 14 23"
        fill="none"
        aria-hidden="true"
      >
        <path d="M8 1L1 13H6L4 22L13 10H8Z" fill="#16A34A" />
      </svg>
      {/* Wortmarke – auf dunklem Hintergrund: "Sport" weiß, "Rise" grün */}
      <span className="text-[19px] font-bold leading-none tracking-tight select-none text-white">
        Sport<span style={{ color: '#16A34A' }}>Rise</span>
      </span>
    </div>
  )
}

// ── Haupt-Komponente ──────────────────────────────────────────────

export default function Footer(): React.JSX.Element {
  return (
    <footer className="bg-[#0A0F1E] text-white" aria-label="Seitenfuß">

      {/* ── Haupt-Bereich ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* ── Spalte 1: Über SportRise ──────────────────────── */}
          <div className="sm:col-span-2 lg:col-span-1">
            <FooterLogo />
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">
              Kostenlose, werbefreie Sportplattform für Jugendliche und Amateursportler in
              Deutschland. Kein Abo. Kein Bullshit.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/sportrise.de"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="SportRise auf Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/sportrise_de"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="SportRise auf Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* ── Spalte 2: Sportarten ─────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
              Sportarten
            </h3>
            <ul className="space-y-2.5">
              {ACTIVE_SPORTS.map((sport) => (
                <li key={sport.href}>
                  <Link
                    href={sport.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {sport.label}
                  </Link>
                </li>
              ))}

              {/* Trennlinie vor Coming-Soon */}
              <li className="pt-1" aria-hidden="true">
                <div className="h-px bg-white/5" />
              </li>

              {COMING_SOON_SPORTS.map((name) => (
                <li key={name} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{name}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500 leading-none">
                    Demnächst
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Spalten 3 + 4: Features & Rechtliches ─────────── */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* ── Untere Leiste ──────────────────────────────────────────── */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} SportRise. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-gray-600">
            Gebaut in Hessen, Deutschland.
          </p>
        </div>
      </div>

    </footer>
  )
}
