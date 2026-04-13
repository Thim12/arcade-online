'use client'

// ─────────────────────────────────────────────────────────────────
// GamificationSection – Dunkle Sektion mit Badge-Grid & XP-Balken
//
// • bg-[#0A0A0A], zweispaltig Desktop
// • Links: Heading, XP-Fortschrittsbalken, Fußnote
// • Rechts: 3×3 Badge-Grid (Rarity-abhängiges Styling)
// • Eigener ICON_MAP: Lucide-Icons per iconName-String
// • Fallback-Badges wenn DB leer
// ─────────────────────────────────────────────────────────────────

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

// ── Typen ─────────────────────────────────────────────────────────

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

// ── Icon-Map ──────────────────────────────────────────────────────

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

// ── Rarity-Konfiguration ──────────────────────────────────────────

interface RarityConfig {
  cardBg: string
  iconColor: string
  label: string
  labelColor: string
  ring?: string
}

const RARITY_CONFIG: Record<string, RarityConfig> = {
  COMMON: {
    cardBg: 'bg-[#27272A]',
    iconColor: 'text-[#9CA3AF]',
    label: 'Gewöhnlich',
    labelColor: 'text-[#9CA3AF]',
  },
  RARE: {
    cardBg: 'bg-[#1e3a5f]',
    iconColor: 'text-[#60A5FA]',
    label: 'Selten',
    labelColor: 'text-[#60A5FA]',
  },
  EPIC: {
    cardBg: 'bg-[#2d1a4e]',
    iconColor: 'text-[#A78BFA]',
    label: 'Episch',
    labelColor: 'text-[#A78BFA]',
  },
  LEGENDARY: {
    cardBg: 'bg-[#431407]',
    iconColor: 'text-[#F59E0B]',
    label: 'Legendär',
    labelColor: 'text-[#F59E0B]',
    ring: 'ring-1 ring-[#F59E0B]/25',
  },
}

const DEFAULT_RARITY = RARITY_CONFIG['COMMON']

// ── Fallback-Badges (DB leer) ─────────────────────────────────────

const FALLBACK_BADGES: GamificationBadge[] = [
  { id: 'fb-1', name: 'Erster Schritt',    iconName: 'Trophy',    rarity: 'COMMON',    isSecret: false },
  { id: 'fb-2', name: 'Fleißiger Sportler', iconName: 'Dumbbell',  rarity: 'COMMON',    isSecret: false },
  { id: 'fb-3', name: '7 Tage am Stück',    iconName: 'Calendar',  rarity: 'RARE',      isSecret: false },
  { id: 'fb-4', name: 'Durchstarter',       iconName: 'Rocket',    rarity: 'RARE',      isSecret: false },
  { id: 'fb-5', name: 'Torjäger',           iconName: 'Target',    rarity: 'EPIC',      isSecret: false },
  { id: 'fb-6', name: 'Vereinslegende',     iconName: 'Crown',     rarity: 'LEGENDARY', isSecret: false },
  { id: 'fb-7', name: 'Geheimnisvoller Fund', iconName: 'Lock',    rarity: 'EPIC',      isSecret: true  },
  { id: 'fb-8', name: 'Nachteulen-Modus',   iconName: 'Lock',      rarity: 'RARE',      isSecret: true  },
  { id: 'fb-9', name: 'Legendäre Tat',      iconName: 'Lock',      rarity: 'LEGENDARY', isSecret: true  },
]

// ── Komponente ────────────────────────────────────────────────────

export default function GamificationSection({ badges }: GamificationSectionProps) {
  const displayBadges = badges.length > 0 ? badges.slice(0, 9) : FALLBACK_BADGES

  return (
    <section className="bg-[#0A0A0A] py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Linke Spalte: Text & XP-Balken ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="text-sm font-semibold tracking-widest uppercase text-[#16A34A] mb-4">
              Gamification
            </p>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
              Sport als Progression.
            </h2>

            <p className="text-base text-white/58 leading-relaxed max-w-md">
              Jedes Training bringt XP. Jede Mahlzeit bringt XP. Jeder Post bringt XP. Von Level 1 bis Level 25. Abzeichen die zeigen was du wirklich geleistet hast.
            </p>

            {/* XP-Fortschrittsbalken */}
            <div className="mt-10">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-sm text-white/60">Level 7</span>
                <span className="font-mono text-sm text-white/60">Level 8</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#16A34A] to-[#4ADE80] rounded-full"
                  style={{ width: '65%' }}
                />
              </div>
              <p className="mt-2 text-xs text-white/40 font-mono">6 500 / 10 000 XP</p>
            </div>

            {/* Fußnote */}
            <p className="mt-8 text-xs italic text-white/22">
              Manche Abzeichen werden nicht verraten...
            </p>
          </motion.div>

          {/* ── Rechte Spalte: 3×3 Badge-Grid ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="grid grid-cols-3 gap-3"
          >
            {displayBadges.map((badge, i) => {
              const config = RARITY_CONFIG[badge.rarity] ?? DEFAULT_RARITY
              const IconComp: LucideIcon = ICON_MAP[badge.iconName] ?? Trophy

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.88 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: 'easeOut' }}
                  className={`rounded-xl p-4 border border-white/[0.07] transition-colors hover:bg-white/[0.09] ${
                    config.cardBg
                  } ${config.ring ?? ''} ${badge.isSecret ? 'border-dashed' : ''}`}
                >
                  {badge.isSecret ? (
                    <>
                      <Lock className="h-6 w-6 text-white/18" />
                      <p className="text-white/40 text-xs font-medium mt-2 truncate">???</p>
                      <p className={`text-[10px] mt-1 ${config.labelColor}`}>{config.label}</p>
                    </>
                  ) : (
                    <>
                      <IconComp className={`h-6 w-6 ${config.iconColor}`} />
                      <p className="text-white/[68%] text-xs font-medium mt-2 truncate">{badge.name}</p>
                      <p className={`text-[10px] mt-1 ${config.labelColor}`}>{config.label}</p>
                    </>
                  )}
                </motion.div>
              )
            })}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
