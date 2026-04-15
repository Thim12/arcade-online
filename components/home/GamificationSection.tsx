'use client'

// ─────────────────────────────────────────────────────────────────
// GamificationSection – Premium Badge-Grid & XP-Balken
//
// Design: Dunkle Sektion mit verstärkten Glow-Effekten,
// animiertem XP-Balken mit Shimmer, goldener Glow auf Legendaries
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
  glowColor: string
  ring?: string
}

const RARITY_CONFIG: Record<string, RarityConfig> = {
  COMMON: {
    cardBg: 'bg-white/[0.02]',
    iconColor: 'text-white/40',
    label: 'Gewöhnlich',
    labelColor: 'text-white/30',
    glowColor: 'transparent',
  },
  RARE: {
    cardBg: 'bg-blue-500/[0.04]',
    iconColor: 'text-blue-400/80',
    label: 'Selten',
    labelColor: 'text-blue-400/60',
    glowColor: 'rgba(96, 165, 250, 0.08)',
  },
  EPIC: {
    cardBg: 'bg-purple-500/[0.04]',
    iconColor: 'text-purple-400/80',
    label: 'Episch',
    labelColor: 'text-purple-400/60',
    glowColor: 'rgba(167, 139, 250, 0.08)',
  },
  LEGENDARY: {
    cardBg: 'bg-amber-500/[0.04]',
    iconColor: 'text-amber-400',
    label: 'Legendär',
    labelColor: 'text-amber-400/70',
    glowColor: 'rgba(245, 158, 11, 0.12)',
    ring: 'ring-1 ring-amber-500/20',
  },
}

const DEFAULT_RARITY = RARITY_CONFIG['COMMON']

// ── Fallback-Badges ───────────────────────────────────────────────

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
    <section className="relative bg-[#030712] py-28 sm:py-36 overflow-hidden">
      {/* Atmosphärische Glows */}
      <div
        className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Linke Spalte: Text & XP-Balken ─────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <p className="text-sm font-semibold tracking-widest uppercase text-green-400 mb-4">
              Gamification
            </p>

            <h2 className="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white tracking-tight mb-6 leading-[1.1]">
              Sport als Progression.
            </h2>

            <p className="text-base text-white/40 leading-relaxed max-w-md">
              Jedes Training bringt XP. Jede Mahlzeit bringt XP. Jeder Post bringt XP.
              Von Level 1 bis Level 25. Abzeichen die zeigen was du wirklich geleistet hast.
            </p>

            {/* XP-Fortschrittsbalken mit Shimmer */}
            <div className="mt-12">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-mono text-sm text-white/50">Level 7</span>
                <span className="font-mono text-sm text-white/50">Level 8</span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(90deg, #16A34A, #4ADE80)',
                  }}
                  initial={{ width: '0%' }}
                  whileInView={{ width: '65%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                >
                  {/* Shimmer-Effekt auf dem Balken */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s ease-in-out infinite',
                    }}
                  />
                </motion.div>
              </div>
              <p className="mt-2.5 text-xs text-white/25 font-mono">6 500 / 10 000 XP</p>
            </div>

            {/* Fußnote */}
            <p className="mt-10 text-xs italic text-white/15">
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
                  className={`relative rounded-xl p-4 border border-white/[0.06] transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1] hover:-translate-y-0.5 ${
                    config.cardBg
                  } ${config.ring ?? ''} ${badge.isSecret ? 'border-dashed' : ''}`}
                  style={{
                    boxShadow: config.glowColor !== 'transparent'
                      ? `0 0 20px ${config.glowColor}`
                      : 'none',
                  }}
                >
                  {badge.isSecret ? (
                    <>
                      <Lock className="h-6 w-6 text-white/15" />
                      <p className="text-white/25 text-xs font-medium mt-2 truncate">???</p>
                      <p className={`text-[10px] mt-1 ${config.labelColor}`}>{config.label}</p>
                    </>
                  ) : (
                    <>
                      <IconComp className={`h-6 w-6 ${config.iconColor}`} />
                      <p className="text-white/55 text-xs font-medium mt-2 truncate">{badge.name}</p>
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
