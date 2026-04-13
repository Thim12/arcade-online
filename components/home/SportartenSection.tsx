'use client'

// ─────────────────────────────────────────────────────────────────
// SportartenSection – Drei aktive Sportarten mit SVG-Icons
//
// • Fußball / Tennis / Basketball mit Vereins- & Turnier-Counts
// • Eigene SVG-Icons (kein Emoji), 60×60 Viewbox
// • Coming-Soon-Block mit 5 künftigen Sportarten
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { PlusCircle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// ── Typen ─────────────────────────────────────────────────────────

interface SportCount {
  slug: string
  vereinCount: number
  tournamentCount: number
}

interface SportartenSectionProps {
  sportCounts: SportCount[]
}

type IconFC = () => JSX.Element

interface SportMeta {
  slug: string
  name: string
  colorHoverBorder: string
  colorBtnBorder: string
  colorBtnText: string
  colorBtnHoverBg: string
  description: string
  IconComponent: IconFC
}

// ── Coming-Soon-Sportarten ────────────────────────────────────────

const COMING_SOON = [
  'Leichtathletik',
  'Schwimmen',
  'Volleyball',
  'Handball',
  'Badminton',
]

// ── SVG-Ikonen ────────────────────────────────────────────────────

function FussballIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" fill="none">
      <circle cx="30" cy="30" r="29" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="20" stroke="#16A34A" strokeWidth="2" />
      {/* V0(30,17) V1(41,23) V2(41,37) V3(30,43) V4(19,37) V5(19,23) */}
      <g stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round">
        {/* 6 Seiten */}
        <line x1="30" y1="17" x2="41" y2="23" />
        <line x1="41" y1="23" x2="41" y2="37" />
        <line x1="41" y1="37" x2="30" y2="43" />
        <line x1="30" y1="43" x2="19" y2="37" />
        <line x1="19" y1="37" x2="19" y2="23" />
        <line x1="19" y1="23" x2="30" y2="17" />
        {/* 3 Diagonalen */}
        <line x1="30" y1="17" x2="30" y2="43" />
        <line x1="41" y1="23" x2="19" y2="37" />
        <line x1="41" y1="37" x2="19" y2="23" />
      </g>
    </svg>
  )
}

function TennisIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" fill="none">
      <circle cx="30" cy="30" r="29" fill="#FDECD0" stroke="#F6C89F" strokeWidth="1.5" />
      <defs>
        <clipPath id="tennis-racket-clip">
          <ellipse cx="30" cy="26" rx="14" ry="17" />
        </clipPath>
      </defs>
      {/* Strings geclippt auf Ellipse */}
      <g clipPath="url(#tennis-racket-clip)" stroke="#C2621A" strokeWidth="1.2" strokeOpacity="0.65">
        <line x1="16" y1="18" x2="44" y2="18" />
        <line x1="16" y1="26" x2="44" y2="26" />
        <line x1="16" y1="34" x2="44" y2="34" />
        <line x1="24" y1="9"  x2="24" y2="43" />
        <line x1="30" y1="9"  x2="30" y2="43" />
        <line x1="36" y1="9"  x2="36" y2="43" />
      </g>
      {/* Schlägerkopf */}
      <ellipse cx="30" cy="26" rx="14" ry="17" stroke="#C2621A" strokeWidth="2" />
      {/* Griff */}
      <rect x="27" y="43" width="6" height="11" rx="3" fill="#C2621A" />
    </svg>
  )
}

function BasketballIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" fill="none">
      <circle cx="30" cy="30" r="29" fill="#FFF7ED" stroke="#FFCBA4" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="20" stroke="#EA580C" strokeWidth="2" />
      <g stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round">
        <line x1="10" y1="30" x2="50" y2="30" />
        <line x1="30" y1="10" x2="30" y2="50" />
        <path d="M 20 10 Q 10 30 20 50" />
        <path d="M 40 10 Q 50 30 40 50" />
      </g>
    </svg>
  )
}

// ── Sport-Metadaten ───────────────────────────────────────────────

const SPORT_METAS: SportMeta[] = [
  {
    slug: 'fussball',
    name: 'Fußball',
    colorHoverBorder: 'hover:border-[#16A34A]/50',
    colorBtnBorder: 'border-[#16A34A]',
    colorBtnText: 'text-[#16A34A]',
    colorBtnHoverBg: 'hover:bg-[#F0FDF4]',
    description:
      'Vollständiges Profil: Position, starker Fuß, Liga, Stärken. Eigene VereinKI versteht den Unterschied zwischen Kreisklasse und Bezirksliga.',
    IconComponent: FussballIcon,
  },
  {
    slug: 'tennis',
    name: 'Tennis',
    colorHoverBorder: 'hover:border-[#C2621A]/50',
    colorBtnBorder: 'border-[#C2621A]',
    colorBtnText: 'text-[#C2621A]',
    colorBtnHoverBg: 'hover:bg-[#FDECD0]',
    description:
      'DTB-Leistungsklasse (LK 1–25), Spielhand, Rückhand, Oberfläche. KI kennt das LK-System. Sparringspartner-Funktion für Hessen.',
    IconComponent: TennisIcon,
  },
  {
    slug: 'basketball',
    name: 'Basketball',
    colorHoverBorder: 'hover:border-[#EA580C]/50',
    colorBtnBorder: 'border-[#EA580C]',
    colorBtnText: 'text-[#EA580C]',
    colorBtnHoverBg: 'hover:bg-[#FFF7ED]',
    description:
      'Position (PG bis Center), Körpergröße für Matching. Eigene BasketballKI wählt nur PG-Drills für PGs — nichts generisches.',
    IconComponent: BasketballIcon,
  },
]

// ── Komponente ────────────────────────────────────────────────────

export default function SportartenSection({ sportCounts }: SportartenSectionProps) {
  const getCount = (slug: string): { vereinCount: number; tournamentCount: number } =>
    sportCounts.find((s) => s.slug === slug) ?? { vereinCount: 0, tournamentCount: 0 }

  return (
    <section className="bg-[#F4F4F5] py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0A0A] tracking-tight">
            Fußball. Tennis. Basketball.
          </h2>
          <p className="mt-3 text-lg text-[#71717A] max-w-xl mx-auto">
            Jetzt in Hessen — bald in ganz Deutschland.
          </p>
        </motion.div>

        {/* Sport-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {SPORT_METAS.map((sport, i) => {
            const counts = getCount(sport.slug)
            const { IconComponent } = sport

            return (
              <motion.div
                key={sport.slug}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                className={`bg-white rounded-2xl p-8 border border-[#E4E4E7] transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-md ${sport.colorHoverBorder}`}
              >
                {/* Icon */}
                <div className="mb-5">
                  <IconComponent />
                </div>

                {/* Name + Counts */}
                <h3 className="text-xl font-bold text-[#0A0A0A] mb-1">{sport.name}</h3>
                <p className="text-sm text-[#71717A] mb-4">
                  {counts.vereinCount}{' '}
                  {counts.vereinCount === 1 ? 'Verein' : 'Vereine'} ·{' '}
                  {counts.tournamentCount}{' '}
                  {counts.tournamentCount === 1 ? 'Turnier' : 'Turniere'}
                </p>

                <hr className="border-[#E4E4E7] mb-4" />

                {/* Beschreibung */}
                <p className="text-sm text-[#52525B] leading-relaxed">
                  {sport.description}
                </p>

                {/* CTA — Outline-Button */}
                <Link
                  href={`/vereine?sport=${sport.slug}`}
                  className={`inline-flex items-center gap-2 mt-5 border ${sport.colorBtnBorder} ${sport.colorBtnText} ${sport.colorBtnHoverBg} text-sm font-medium px-5 py-2.5 rounded-lg transition-colors`}
                >
                  Vereine entdecken
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Coming Soon */}
        <motion.div
          className="bg-white/70 border border-dashed border-[#D4D4D8] rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.28, ease: 'easeOut' }}
        >
          <div className="flex justify-center mb-3">
            <PlusCircle className="h-6 w-6 text-[#A1A1AA]" />
          </div>
          <p className="text-sm font-semibold text-[#52525B] mb-3">
            Weitere Sportarten kommen bald
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMING_SOON.map((sport) => (
              <span
                key={sport}
                className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] bg-white border border-[#E4E4E7] px-3 py-1 rounded-full"
              >
                <Clock className="h-3 w-3" />
                {sport}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
