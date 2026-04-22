'use client'

import { motion } from 'framer-motion'
import {
  Trophy,
  Star,
  Award,
  Flame,
  Zap,
  Target,
  Shield,
  Crown,
  Calendar,
  Users,
  Dumbbell,
  Heart,
  Clock,
  Flag,
  Check,
  Lock,
  Medal,
  Brain,
  Rocket,
  TrendingUp,
  Timer,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface GamificationBadge {
  id: string
  name: string
  iconName: string
  rarity: string
  isSecret: boolean
}

interface GamificationSectionProps {
  badges: GamificationBadge[]
}

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Star,
  Award,
  Flame,
  Zap,
  Target,
  Shield,
  Crown,
  Calendar,
  Users,
  Dumbbell,
  Heart,
  Clock,
  Flag,
  Check,
  Lock,
  Medal,
  Brain,
  Rocket,
  TrendingUp,
  Timer,
}

const RARITY_DOT: Record<string, string> = {
  COMMON: 'bg-zinc-400',
  RARE: 'bg-blue-400',
  EPIC: 'bg-purple-400',
  LEGENDARY: 'bg-amber-400',
}

const RARITY_RING: Record<string, string> = {
  COMMON: 'ring-zinc-600',
  RARE: 'ring-blue-500',
  EPIC: 'ring-purple-500',
  LEGENDARY: 'ring-amber-500',
}

const FALLBACK_BADGES: GamificationBadge[] = [
  { id: 'fb-1', name: 'Erster Schritt', iconName: 'Trophy', rarity: 'COMMON', isSecret: false },
  { id: 'fb-2', name: 'Fleissiger Sportler', iconName: 'Dumbbell', rarity: 'COMMON', isSecret: false },
  { id: 'fb-3', name: '7 Tage am Stueck', iconName: 'Calendar', rarity: 'RARE', isSecret: false },
  { id: 'fb-4', name: 'Durchstarter', iconName: 'Rocket', rarity: 'RARE', isSecret: false },
  { id: 'fb-5', name: 'Torjaeger', iconName: 'Target', rarity: 'EPIC', isSecret: false },
  { id: 'fb-6', name: 'Vereinslegende', iconName: 'Crown', rarity: 'LEGENDARY', isSecret: false },
  { id: 'fb-7', name: 'Geheimnisvoller Fund', iconName: 'Lock', rarity: 'EPIC', isSecret: true },
  { id: 'fb-8', name: 'Nachteulen-Modus', iconName: 'Lock', rarity: 'RARE', isSecret: true },
  { id: 'fb-9', name: 'Legendaere Tat', iconName: 'Lock', rarity: 'LEGENDARY', isSecret: true },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function GamificationSection({ badges }: GamificationSectionProps) {
  const displayBadges: GamificationBadge[] = badges.length > 0 ? badges.slice(0, 9) : FALLBACK_BADGES

  return (
    <section className="bg-white py-28 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-4">
            Gamification
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight">
            Level aufsteigen. Abzeichen sammeln.
          </h2>
          <p className="mt-4 text-base text-zinc-500 max-w-lg leading-relaxed">
            Jedes Training bringt XP. Jede Mahlzeit bringt XP. Sammle Abzeichen
            und zeige, was du wirklich geleistet hast.
          </p>
        </motion.div>

        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="mt-10 bg-zinc-900 rounded-3xl p-8 sm:p-10"
        >
          <motion.div
            className="grid grid-cols-3 gap-6 sm:gap-8"
            variants={containerVariants}
            initial={false}
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            {displayBadges.map((badge) => {
              const dotClass = RARITY_DOT[badge.rarity] ?? RARITY_DOT['COMMON']
              const ringClass = RARITY_RING[badge.rarity] ?? RARITY_RING['COMMON']
              const IconComp: LucideIcon = ICON_MAP[badge.iconName] ?? Trophy

              return (
                <motion.div
                  key={badge.id}
                  variants={itemVariants}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-800 flex items-center justify-center ${
                        badge.isSecret ? 'border border-dashed border-zinc-700' : ''
                      }`}
                    >
                      {badge.isSecret ? (
                        <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white/20" />
                      ) : (
                        <IconComp className="w-5 h-5 sm:w-6 sm:h-6 text-white/70" />
                      )}
                    </div>
                    <span
                      className={`absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-zinc-900 ${dotClass}`}
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-white/70 text-center leading-tight">
                    {badge.isSecret ? '???' : badge.name}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>

          <div className="mt-10">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-sm text-white/50">Level 7</span>
              <span className="font-mono text-sm text-white/50">Level 8</span>
            </div>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#16A34A]"
                initial={false}
                whileInView={{ width: '65%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-2 text-xs text-white/25 font-mono">6 500 / 10 000 XP</p>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-xs text-zinc-400">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </p>
      </div>
    </section>
  )
}