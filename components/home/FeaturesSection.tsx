'use client'

// ─────────────────────────────────────────────────────────────────
// FeaturesSection – Premium "Alles inklusive" Feature-Grid
//
// Design: Bento-Grid-Layout mit Glassmorphism-Cards
// Hover: Card schwebt + Glow verstärkt sich + Gradient-Border
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
  accentColor: string
  glowColor: string
}

// ── Feature-Daten ─────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    Icon: MapPin,
    title: 'Vereine & Trainer finden',
    description:
      'Entdecke Vereine in deiner Nähe für Fußball, Tennis und Basketball — mit allen Infos auf einen Blick.',
    accentColor: '#16A34A',
    glowColor: 'rgba(22, 163, 74, 0.15)',
  },
  {
    Icon: Trophy,
    title: 'Turniere & Wettkämpfe',
    description:
      'Finde lokale Turniere und melde dich direkt an — kostenlos und ohne Umwege.',
    accentColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.15)',
  },
  {
    Icon: Dumbbell,
    title: 'KI-Trainingsplan',
    description:
      'Dein persönlicher Trainingsplan, erstellt von KI — abgestimmt auf dein Niveau und deine Ziele.',
    accentColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.15)',
  },
  {
    Icon: UtensilsCrossed,
    title: 'Ernährungsplan',
    description:
      'Passende Ernährungspläne für deinen Sport, erstellt mit KI-Unterstützung.',
    accentColor: '#EA580C',
    glowColor: 'rgba(234, 88, 12, 0.15)',
  },
  {
    Icon: BookOpen,
    title: 'Sport-Guides',
    description:
      'Tipps, Techniken und Wissen — kuratiert von der SportRise-Community.',
    accentColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.15)',
  },
  {
    Icon: Zap,
    title: 'Gamification & Abzeichen',
    description:
      'Verdiene XP, steige im Level auf und schalte geheime Abzeichen frei.',
    accentColor: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.15)',
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
    <section className="relative bg-[#030712] py-24 sm:py-32 overflow-hidden">
      {/* Subtiler Glow von oben */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(22,163,74,0.06) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Subtile Grid-Textur */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section-Heading ─────────────────────────────────── */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-sm font-semibold text-green-400 tracking-widest uppercase mb-4"
          >
            Alles inklusive
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white tracking-tight text-balance leading-[1.1]"
          >
            Alles was du brauchst
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="mt-5 text-lg text-white/40 max-w-xl mx-auto"
          >
            Von der Vereinssuche bis zum KI-Trainingsplan — SportRise bietet
            alles für deinen Sport.
          </motion.p>
        </div>

        {/* ── Feature-Grid (Bento-Style) ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature, i) => {
            const { Icon, title, description, accentColor, glowColor } = feature
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
                className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-7 card-hover overflow-hidden"
              >
                {/* Hover Glow — erscheint nur bei Hover */}
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)`,
                    filter: 'blur(30px)',
                  }}
                  aria-hidden="true"
                />

                {/* Icon — mit farbigem Akzent */}
                <div
                  className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `${accentColor}12`,
                    color: accentColor,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Titel */}
                <h3 className="relative text-base font-semibold text-white mb-2.5 group-hover:text-white/95 transition-colors">
                  {title}
                </h3>

                {/* Beschreibung */}
                <p className="relative text-sm text-white/40 leading-relaxed group-hover:text-white/50 transition-colors">
                  {description}
                </p>

                {/* Badge-Vorschau (nur letzte Card, wenn Badges vorhanden) */}
                {isLast && badges.length > 0 && (
                  <div className="relative mt-5 flex flex-wrap gap-1.5">
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
