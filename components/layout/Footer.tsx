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

const SPORT_DOT_COLORS: Record<string, string> = {
  Fussball: 'bg-green-400',
  Tennis: 'bg-amber-400',
  Basketball: 'bg-orange-400',
}

function FooterLogo(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="14" height="23" viewBox="0 0 14 23" fill="none" aria-hidden="true">
        <path d="M8 1L1 13H6L4 22L13 10H8Z" fill="#22c55e" />
      </svg>
      <span className="text-[20px] font-bold leading-none tracking-tight select-none text-white">
        Sport<span className="text-green-400">Rise</span>
      </span>
    </div>
  )
}

export default function Footer(): React.JSX.Element {
  return (
    <footer className="bg-zinc-950" aria-label="Seitenfuss">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="pt-16 pb-10 border-b border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            <div className="sm:col-span-2 lg:col-span-4">
              <FooterLogo />
              <p className="mt-5 text-[15px] text-zinc-400 leading-relaxed max-w-sm">
                Kostenlose, werbefreie Sportplattform fuer Jugendliche und Amateursportler in Deutschland.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <a
                  href="https://instagram.com/sportrise.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all duration-200"
                  aria-label="SportRise auf Instagram"
                >
                  <Instagram className="h-[18px] w-[18px]" />
                </a>
                <a
                  href="https://twitter.com/sportrise_de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all duration-200"
                  aria-label="SportRise auf Twitter"
                >
                  <Twitter className="h-[18px] w-[18px]" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-5">
                Sportarten
              </h3>
              <ul className="space-y-3">
                {ACTIVE_SPORTS.map((sport) => (
                  <li key={sport.href}>
                    <Link
                      href={sport.href}
                      className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-white transition-colors duration-200"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${SPORT_DOT_COLORS[sport.label] ?? 'bg-zinc-500'}`}
                        aria-hidden="true"
                      />
                      {sport.label}
                    </Link>
                  </li>
                ))}
                <li aria-hidden="true"><div className="h-px bg-zinc-800 my-1" /></li>
                {COMING_SOON_SPORTS.map((name) => (
                  <li key={name} className="flex items-center gap-2.5">
                    <span className="text-sm text-zinc-500">{name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700 leading-none">
                      Bald
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="lg:col-span-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-5">
                  {col.heading}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
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
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} SportRise. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-zinc-600">
            Gebaut in Hessen, Deutschland.
          </p>
        </div>
      </div>
    </footer>
  )
}