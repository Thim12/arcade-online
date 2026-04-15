'use client'

// ─────────────────────────────────────────────────────────────────
// SportartenSection – Premium-Sportarten-Karten (Dark Design)
//
// Design: Dunkler Hintergrund mit Sport-farbigem Glow auf Hover
// Jede Sportart hat ihren eigenen Farbakzent und SVG-Icon
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
  color: string
  glowColor: string
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
      <circle cx="30" cy="30" r="29" fill="rgba(22,163,74,0.08)" stroke="rgba(22,163,74,0.25)" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="20" stroke="#16A34A" strokeWidth="2" />
      <g stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7">
        <line x1="30" y1="17" x2="41" y2="23" />
        <line x1="41" y1="23" x2="41" y2="37" />
        <line x1="41" y1="37" x2="30" y2="43" />
        <line x1="30" y1="43" x2="19" y2="37" />
        <line x1="19" y1="37" x2="19" y2="23" />
        <line x1="19" y1="23" x2="30" y2="17" />
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
      <circle cx="30" cy="30" r="29" fill="rgba(194,98,26,0.08)" stroke="rgba(194,98,26,0.25)" strokeWidth="1.5" />
      <defs>
        <clipPath id="tennis-racket-clip-dark">
          <ellipse cx="30" cy="26" rx="14" ry="17" />
        </clipPath>
      </defs>
      <g clipPath="url(#tennis-racket-clip-dark)" stroke="#C2621A" strokeWidth="1.2" strokeOpacity="0.5">
        <line x1="16" y1="18" x2="44" y2="18" />
        <line x1="16" y1="26" x2="44" y2="26" />
        <line x1="16" y1="34" x2="44" y2="34" />
        <line x1="24" y1="9" x2="24" y2="43" />
        <line x1="30" y1="9" x2="30" y2="43" />
        <line x1="36" y1="9" x2="36" y2="43" />
      </g>
      <ellipse cx="30" cy="26" rx="14" ry="17" stroke="#C2621A" strokeWidth="2" />
      <rect x="27" y="43" width="6" height="11" rx="3" fill="#C2621A" />
    </svg>
  )
}

function BasketballIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true" fill="none">
      <circle cx="30" cy="30" r="29" fill="rgba(234,88,12,0.08)" stroke="rgba(234,88,12,0.25)" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="20" stroke="#EA580C" strokeWidth="2" />
      <g stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7">
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
    color: '#16A34A',
    glowColor: 'rgba(22, 163, 74, 0.2)',
    description:
      'Vollständiges Profil: Position, starker Fuß, Liga, Stärken. Eigene VereinKI versteht den Unterschied zwischen Kreisklasse und Bezirksliga.',
    IconComponent: FussballIcon,
  },
  {
    slug: 'tennis',
    name: 'Tennis',
    color: '#C2621A',
    glowColor: 'rgba(194, 98, 26, 0.2)',
    description:
      'DTB-Leistungsklasse (LK 1–25), Spielhand, Rückhand, Oberfläche. KI kennt das LK-System. Sparringspartner-Funktion für Hessen.',
    IconComponent: TennisIcon,
  },
  {
    slug: 'basketball',
    name: 'Basketball',
    color: '#EA580C',
    glowColor: 'rgba(234, 88, 12, 0.2)',
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
    <section className="relative bg-[#0a0a0a] py-24 sm:py-32 overflow-hidden">
      {/* Subtile Gradient-Dekoration */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white tracking-tight leading-[1.1]">
            Fußball. Tennis. Basketball.
          </h2>
          <p className="mt-4 text-lg text-white/35 max-w-xl mx-auto">
            Jetzt in Hessen — bald in ganz Deutschland.
          </p>
        </motion.div>

        {/* Sport-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {SPORT_METAS.map((sport, i) => {
            const counts = getCount(sport.slug)
            const { IconComponent } = sport

            return (
              <motion.div
                key={sport.slug}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 card-hover overflow-hidden"
              >
                {/* Hover Glow */}
                <div
                  className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse, ${sport.glowColor} 0%, transparent 70%)`,
                    filter: 'blur(40px)',
                  }}
                  aria-hidden="true"
                />

                {/* Icon */}
                <div className="relative mb-6 transition-transform duration-300 group-hover:scale-105">
                  <IconComponent />
                </div>

                {/* Name + Counts */}
                <h3 className="relative text-xl font-bold text-white mb-1.5">{sport.name}</h3>
                <p className="relative text-sm text-white/35 mb-5">
                  {counts.vereinCount}{' '}
                  {counts.vereinCount === 1 ? 'Verein' : 'Vereine'} ·{' '}
                  {counts.tournamentCount}{' '}
                  {counts.tournamentCount === 1 ? 'Turnier' : 'Turniere'}
                </p>

                <hr className="relative border-white/[0.06] mb-5" />

                {/* Beschreibung */}
                <p className="relative text-sm text-white/40 leading-relaxed mb-6">
                  {sport.description}
                </p>

                {/* CTA — Outline-Button mit Sport-Farbe */}
                <Link
                  href={`/vereine?sport=${sport.slug}`}
                  className="relative inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg border transition-all duration-300 group-hover:scale-[1.02]"
                  style={{
                    borderColor: `${sport.color}40`,
                    color: sport.color,
                  }}
                >
                  Vereine entdecken
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Coming Soon */}
        <motion.div
          className="mt-8 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-2xl p-6 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        >
          <div className="flex justify-center mb-3">
            <PlusCircle className="h-6 w-6 text-white/20" />
          </div>
          <p className="text-sm font-semibold text-white/40 mb-3">
            Weitere Sportarten kommen bald
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {COMING_SOON.map((sport) => (
              <span
                key={sport}
                className="inline-flex items-center gap-1.5 text-xs text-white/25 bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full"
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
