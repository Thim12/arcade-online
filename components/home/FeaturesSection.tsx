'use client'

// ─────────────────────────────────────────────────────────────────
// FeaturesSection – "Wie es funktioniert" / Feature-Grid
//
// • id="wie-es-funktioniert" → Scroll-Target aus HeroSection
// • 6 Cards mit Framer Motion whileInView (Stagger: i × 0.07 s)
// • viewport={{ once: true, margin: '-50px' }}
// • Letzte Card (Gamification) zeigt Badge-Vorschau wenn Badges vorhanden
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import {
  MapPin,
  Trophy,
  Dumbbell,
  UtensilsCrossed,
  BookOpen,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ── Typen ─────────────────────────────────────────────────────────

interface BadgePreview {
  id: string
  name: string
  rarity: string
}

interface FeaturesSectionProps {
  badges: BadgePreview[]
}

interface Feature {
  Icon: LucideIcon
  title: string
  description: string
  accent: string
  iconBg: string
}

// ── Feature-Daten ─────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    Icon: MapPin,
    title: 'Vereine & Trainer finden',
    description:
      'Entdecke Vereine in deiner Nähe für Fußball, Tennis und Basketball — mit allen Infos auf einen Blick.',
    accent: 'text-green-400',
    iconBg: 'bg-green-500/10',
  },
  {
    Icon: Trophy,
    title: 'Turniere & Wettkämpfe',
    description:
      'Finde lokale Turniere und melde dich direkt an — kostenlos und ohne Umwege.',
    accent: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  {
    Icon: Dumbbell,
    title: 'KI-Trainingsplan',
    description:
      'Dein persönlicher Trainingsplan, erstellt von KI — abgestimmt auf dein Niveau und deine Ziele.',
    accent: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Ernährungsplan',
    description:
      'Passende Ernährungspläne für deinen Sport, erstellt mit KI-Unterstützung.',
    accent: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
  },
  {
    Icon: BookOpen,
    title: 'Sport-Guides',
    description:
      'Tipps, Techniken und Wissen — kuratiert von der SportRise-Community.',
    accent: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
  },
  {
    Icon: Zap,
    title: 'Gamification & Abzeichen',
    description:
      'Verdiene XP, steige im Level auf und schalte geheime Abzeichen frei.',
    accent: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10',
  },
]

// ── Rarity-Styles für Badge-Vorschau ─────────────────────────────

const RARITY_STYLES: Record<string, string> = {
  COMMON: 'bg-white/5 text-white/45 border-white/10',
  RARE: 'bg-blue-500/10 text-blue-400/80 border-blue-500/20',
  EPIC: 'bg-purple-500/10 text-purple-400/80 border-purple-500/20',
  LEGENDARY: 'bg-amber-500/10 text-amber-400/80 border-amber-500/20',
}

// ── Komponente ────────────────────────────────────────────────────

export default function FeaturesSection({ badges }: FeaturesSectionProps) {
  return (
    <section
      className="relative bg-gray-950 py-20 sm:py-28 overflow-hidden"
    >
      {/* Subtiler Glow von oben */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(22,163,74,0.07) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section-Heading ─────────────────────────────────── */}
        <div className="text-center mb-14 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-sm font-semibold text-green-400 tracking-widest uppercase mb-3"
          >
            Alles inklusive
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight text-balance"
          >
            Alles was du brauchst
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="mt-4 text-lg text-white/50 max-w-xl mx-auto"
          >
            Von der Vereinssuche bis zum KI-Trainingsplan — SportRise bietet
            alles für deinen Sport.
          </motion.p>
        </div>

        {/* ── Feature-Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature, i) => {
            const { Icon, title, description, accent, iconBg } = feature
            const isLast = i === FEATURES.length - 1

            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.07,
                  ease: 'easeOut',
                }}
                className="group relative rounded-2xl bg-white/[0.04] border border-white/[0.07] p-6 hover:bg-white/[0.06] hover:border-white/[0.12] transition-colors"
              >
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 ${iconBg} ${accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Titel */}
                <h3 className="text-base font-semibold text-white mb-2">
                  {title}
                </h3>

                {/* Beschreibung */}
                <p className="text-sm text-white/50 leading-relaxed">
                  {description}
                </p>

                {/* Badge-Vorschau (nur letzte Card, wenn Badges vorhanden) */}
                {isLast && badges.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {badges.slice(0, 6).map((badge) => (
                      <span
                        key={badge.id}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          RARITY_STYLES[badge.rarity] ?? RARITY_STYLES['COMMON']
                        }`}
                      >
                        {badge.name}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
