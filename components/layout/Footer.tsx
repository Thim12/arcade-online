import Link from 'next/link'
import { Instagram, Twitter } from 'lucide-react'

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  heading: string
  links: FooterLink[]
}

const ACTIVE_SPORTS: FooterLink[] = [
  { label: 'Fussball', href: '/vereine?sport=fussball' },
  { label: 'Tennis', href: '/vereine?sport=tennis' },
  { label: 'Basketball', href: '/vereine?sport=basketball' },
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
      { label: 'KI-Trainer', href: '/dashboard/ki-trainer' },
      { label: 'Vereinssuche', href: '/vereine' },
      { label: 'Turniere', href: '/turniere' },
      { label: 'Community', href: '/community' },
      { label: 'Gamification', href: '/profil' },
    ],
  },
  {
    heading: 'Rechtliches',
    links: [
      { label: 'Datenschutzerklaerung', href: '/datenschutz' },
      { label: 'Impressum', href: '/impressum' },
      { label: 'Nutzungsbedingungen', href: '/agb' },
      { label: 'Kontakt', href: '/in-arbeit' },
    ],
  },
]

function FooterLogo(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="13" height="22" viewBox="0 0 14 23" fill="none" aria-hidden="true">
        <path d="M8 1L1 13H6L4 22L13 10H8Z" fill="#16A34A" />
      </svg>
      <span className="text-[19px] font-bold leading-none tracking-tight select-none text-white">
        Sport<span style={{ color: '#16A34A' }}>Rise</span>
      </span>
    </div>
  )
}

export default function Footer(): React.JSX.Element {
  return (
    <footer className="relative bg-[#030712] text-white overflow-hidden" aria-label="Seitenfuss">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none select-none"
        style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
        aria-hidden="true"
      />
      <div className="border-t border-white/[0.04]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <FooterLogo />
            <p className="mt-4 text-sm text-white/30 leading-relaxed max-w-xs">
              Kostenlose, werbefreie Sportplattform fuer Jugendliche und Amateursportler in
              Deutschland. Kein Abo. Kein Bullshit.
            </p>
            <p className="mt-4 text-[11px] text-white/15 leading-relaxed">
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/sportrise.de"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-white/30 hover:text-white/60 transition-all duration-300"
                aria-label="SportRise auf Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/sportrise_de"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-white/30 hover:text-white/60 transition-all duration-300"
                aria-label="SportRise auf Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/20 mb-4">
              Sportarten
            </h3>
            <ul className="space-y-2.5">
              {ACTIVE_SPORTS.map((sport) => (
                <li key={sport.href}>
                  <Link href={sport.href} className="text-sm text-white/35 hover:text-white/70 transition-colors duration-200">
                    {sport.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1" aria-hidden="true"><div className="h-px bg-white/[0.04]" /></li>
              {COMING_SOON_SPORTS.map((name) => (
                <li key={name} className="flex items-center gap-2">
                  <span className="text-sm text-white/20">{name}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/[0.03] text-white/20 border border-white/[0.06] leading-none">
                    Demnaechst
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/20 mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/35 hover:text-white/70 transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} SportRise. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-white/20">
            Gebaut in Hessen, Deutschland.
          </p>
        </div>
      </div>
    </footer>
  )
}