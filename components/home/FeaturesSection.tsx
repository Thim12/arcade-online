'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  Zap,
  Eye,
  Brain,
  Trophy,
  Users,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface BadgePreview {
  id: string
  name: string
  rarity: string
}

interface FeaturesSectionProps {
  badges: BadgePreview[]
}

type IconColorClass = {
  bg: string
  text: string
  border: string
}

interface Feature {
  Icon: LucideIcon
  title: string
  description: string
  iconColor: IconColorClass
}

const FEATURES: Feature[] = [
  {
    Icon: Shield,
    title: 'Kostenlos & ohne Werbung',
    description:
      'Keine Abos, keine Werbung — SportRise ist und bleibt komplett kostenlos.',
    iconColor: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  },
  {
    Icon: Brain,
    title: 'Deine eigene KI',
    description:
      'Trainingsplaene, Ernaehrungstipps und Analysen — persoenlich erstellt von deiner KI.',
    iconColor: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  },
  {
    Icon: Eye,
    title: 'DSGVO-konform',
    description:
      'Deine Daten gehoeren dir. SportRise erfuellt die hoechsten europaeischen Datenschutzstandards.',
    iconColor: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  },
  {
    Icon: Trophy,
    title: 'Gamification & Abzeichen',
    description:
      'Verdiene XP, steige im Level auf und schalte seltene Abzeichen frei.',
    iconColor: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  },
  {
    Icon: Users,
    title: 'Vereinssuche & Turniere',
    description:
      'Finde Vereine in deiner Naehe und melde dich direkt fuer lokale Turniere an.',
    iconColor: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  },
  {
    Icon: Sparkles,
    title: 'Community',
    description:
      'Tritt der SportRise-Community bei — teile Erfolge und motiviere andere.',
    iconColor: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  },
]

const RARITY_STYLES: Record<string, string> = {
  COMMON: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  RARE: 'bg-blue-50 text-blue-700 border-blue-200',
  EPIC: 'bg-purple-50 text-purple-700 border-purple-200',
  LEGENDARY: 'bg-amber-50 text-amber-700 border-amber-200',
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export default function FeaturesSection({ badges }: FeaturesSectionProps) {
  const visibleBadges = badges.slice(0, 6)

  return (
    <section className="bg-zinc-50 py-28 sm:py-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 mb-4">
            Alles inklusive
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight">
            Kein Abo. Keine Werbung.
          </h2>
          <p className="mt-4 text-lg text-zinc-500 max-w-xl mx-auto">
            Von der Vereinssuche bis zum KI-Trainingsplan — alles kostenlos, alles fuer deinen Sport.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial={false}
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feature) => {
            const { Icon, title, description, iconColor } = feature

            return (
              <motion.div
                key={title}
                variants={cardVariants}
                className="group relative bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1 hover:border-zinc-300"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 border ${iconColor.bg} ${iconColor.text} ${iconColor.border}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="text-base font-bold text-zinc-900 mb-2">
                  {title}
                </h3>

                <p className="text-sm text-zinc-500 leading-relaxed">
                  {description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>

        {visibleBadges.length > 0 && (
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            className="mt-12 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="text-xs font-semibold text-zinc-500 mr-1">
              Abzeichen
            </span>
            {visibleBadges.map((badge) => (
              <span
                key={badge.id}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  RARITY_STYLES[badge.rarity] ?? RARITY_STYLES['COMMON']
                }`}
              >
                {badge.name}
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}