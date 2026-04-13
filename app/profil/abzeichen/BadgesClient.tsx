'use client'

// ─────────────────────────────────────────────────────────────────
// BadgesClient.tsx – Interaktive Badge-Übersicht
//
// Empfängt alle Badge-Daten vom Server, filtert client-seitig
// nach Kategorie und Rarity.
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Star } from 'lucide-react'
import type { BadgeRarity } from '@prisma/client'
import { getBadgeIcon } from '@/lib/sport-icons'

// ── Typen ────────────────────────────────────────────────────────

export type BadgeCategory =
  | 'alle'
  | 'training'
  | 'streak'
  | 'ernaehrung'
  | 'sozial'
  | 'sport'
  | 'meilenstein'

export interface SerializedBadge {
  id: string
  name: string
  description: string
  iconName: string
  rarity: BadgeRarity
  xpReward: number
  requirement: Record<string, unknown>
  sportId: string | null
  sport: { name: string; slug: string; colorPrimary: string } | null
  isEarned: boolean
  earnedAt: string | null
  category: BadgeCategory
}

export interface UserProgress {
  totalSessions: number
  streakDays: number
  level: number
  totalMealLogs: number
  totalPosts: number
  followerCount: number
  tournamentEntries: number
}

interface Props {
  badges: SerializedBadge[]
  totalBadgeCount: number
  earnedCount: number
  userProgress: UserProgress
}

// ── Rarity-Konfiguration ─────────────────────────────────────────

const RARITY_CONFIG: Record<
  BadgeRarity,
  {
    label: string
    cardClass: string
    iconBg: string
    iconColor: string
    pillBg: string
    pillText: string
    dot: string
  }
> = {
  COMMON: {
    label: 'Common',
    cardClass: 'bg-white border border-[#E4E4E7]',
    iconBg: 'bg-[#F4F4F5]',
    iconColor: 'text-[#71717A]',
    pillBg: 'bg-[#F4F4F5]',
    pillText: 'text-[#71717A]',
    dot: '#71717A',
  },
  RARE: {
    label: 'Rare',
    cardClass: 'bg-[#EFF6FF] border border-[#BFDBFE]',
    iconBg: 'bg-[#DBEAFE]',
    iconColor: 'text-[#2563EB]',
    pillBg: 'bg-[#DBEAFE]',
    pillText: 'text-[#2563EB]',
    dot: '#2563EB',
  },
  EPIC: {
    label: 'Epic',
    cardClass: 'bg-[#F5F3FF] border border-[#DDD6FE]',
    iconBg: 'bg-[#EDE9FE]',
    iconColor: 'text-[#7C3AED]',
    pillBg: 'bg-[#EDE9FE]',
    pillText: 'text-[#7C3AED]',
    dot: '#7C3AED',
  },
  LEGENDARY: {
    label: 'Legendary',
    cardClass:
      'bg-gradient-to-br from-[#FEF9C3] to-[#FEF3C7] border border-[#FCD34D] shadow-[0_4px_16px_rgba(234,179,8,0.2)]',
    iconBg: 'bg-[#FEF9C3]',
    iconColor: 'text-[#D97706]',
    pillBg: 'bg-[#FEF9C3]',
    pillText: 'text-[#D97706]',
    dot: '#D97706',
  },
}

const RARITY_ORDER: BadgeRarity[] = ['LEGENDARY', 'EPIC', 'RARE', 'COMMON']

// ── Kategorie-Tabs ───────────────────────────────────────────────

const CATEGORIES: { id: BadgeCategory; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'training', label: 'Training' },
  { id: 'streak', label: 'Streak' },
  { id: 'ernaehrung', label: 'Ernährung' },
  { id: 'sozial', label: 'Sozial' },
  { id: 'sport', label: 'Sport' },
  { id: 'meilenstein', label: 'Meilenstein' },
]

const RARITY_FILTERS: { id: BadgeRarity | 'alle'; label: string }[] = [
  { id: 'alle', label: 'Alle Raritäten' },
  { id: 'COMMON', label: 'Common' },
  { id: 'RARE', label: 'Rare' },
  { id: 'EPIC', label: 'Epic' },
  { id: 'LEGENDARY', label: 'Legendary' },
]

// ── Fortschritts-Berechnung ──────────────────────────────────────

function getProgress(
  req: Record<string, unknown>,
  up: UserProgress,
): { current: number; target: number } | null {
  const type = req.type as string
  if (type === 'training_sessions') {
    const target = (req.count as number) ?? 0
    return { current: Math.min(up.totalSessions, target), target }
  }
  if (type === 'streak_days') {
    const target = (req.days as number) ?? 0
    return { current: Math.min(up.streakDays, target), target }
  }
  if (type === 'level_reached') {
    const target = (req.level as number) ?? 0
    return { current: Math.min(up.level, target), target }
  }
  if (type === 'meal_logged' || type === 'meals_logged') {
    const target = (req.count as number) ?? 0
    return { current: Math.min(up.totalMealLogs, target), target }
  }
  if (type === 'post_created') {
    const target = (req.count as number) ?? 0
    return { current: Math.min(up.totalPosts, target), target }
  }
  if (type === 'followers_reached') {
    const target = (req.count as number) ?? 0
    return { current: Math.min(up.followerCount, target), target }
  }
  if (type === 'tournament_entered') {
    const target = (req.count as number) ?? 0
    return { current: Math.min(up.tournamentEntries, target), target }
  }
  return null
}

// ── Badge-Card ───────────────────────────────────────────────────

function BadgeCard({
  badge,
  userProgress,
}: {
  badge: SerializedBadge
  userProgress: UserProgress
}) {
  const cfg = RARITY_CONFIG[badge.rarity]
  const Icon = getBadgeIcon(badge.iconName)
  const progress = badge.isEarned ? null : getProgress(badge.requirement, userProgress)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: badge.isEarned ? 1 : 0.55, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className={`relative rounded-2xl p-4 flex flex-col gap-3 ${cfg.cardClass}`}
    >
      {/* Icon */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={`w-[52px] h-[52px] rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}
        >
          {badge.isEarned ? (
            <Icon className={`w-6 h-6 ${cfg.iconColor}`} />
          ) : (
            <Lock className="w-5 h-5 text-[#A1A1AA]" />
          )}
        </div>

        {/* Rarity Pill */}
        <span
          className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full ${cfg.pillBg} ${cfg.pillText}`}
        >
          {cfg.label}
        </span>
      </div>

      {/* Name + Description */}
      <div>
        <p className="text-sm font-semibold text-[#0A0A0A] leading-tight">{badge.name}</p>
        <p className="text-xs text-[#71717A] mt-0.5 leading-snug">{badge.description}</p>
      </div>

      {/* Fortschritts-Balken */}
      {!badge.isEarned && progress && progress.target > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[#A1A1AA]">
            <span>{progress.current.toLocaleString('de')}</span>
            <span>{progress.target.toLocaleString('de')}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#E4E4E7] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((progress.current / progress.target) * 100))}%`,
                backgroundColor: cfg.dot,
              }}
            />
          </div>
        </div>
      )}

      {/* Verdient-Datum */}
      {badge.isEarned && badge.earnedAt && (
        <div className="flex items-center gap-1">
          <Star className={`w-3 h-3 ${cfg.iconColor}`} />
          <span className="text-[10px] text-[#71717A]">
            Verdient am{' '}
            {new Date(badge.earnedAt).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      )}

      {/* XP Reward */}
      <div className="mt-auto">
        <span className="text-[10px] font-medium text-[#71717A]">
          +{badge.xpReward.toLocaleString('de')} XP
        </span>
      </div>
    </motion.div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────

export function BadgesClient({ badges, totalBadgeCount, earnedCount, userProgress }: Props) {
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>('alle')
  const [activeRarity, setActiveRarity] = useState<BadgeRarity | 'alle'>('alle')

  const filtered = badges.filter((b) => {
    const catOk = activeCategory === 'alle' || b.category === activeCategory
    const rarOk = activeRarity === 'alle' || b.rarity === activeRarity
    return catOk && rarOk
  })

  // Zähle pro Kategorie
  const countPerCategory = CATEGORIES.reduce<Record<BadgeCategory, number>>(
    (acc, cat) => {
      acc[cat.id] =
        cat.id === 'alle'
          ? badges.length
          : badges.filter((b) => b.category === cat.id).length
      return acc
    },
    {} as Record<BadgeCategory, number>,
  )

  const progressPercent =
    totalBadgeCount > 0 ? Math.round((earnedCount / totalBadgeCount) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-[#0A0A0A] px-4 pt-8 pb-6 relative overflow-hidden">
        {/* Subtiles Hintergrundmuster */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="diamonds" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <polygon points="16,2 30,16 16,30 2,16" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diamonds)" />
        </svg>

        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-white tracking-tight">Abzeichen</h1>
          <p className="text-[#A1A1AA] text-sm mt-1">
            {earnedCount} von {totalBadgeCount} Abzeichen verdient
          </p>

          {/* Gesamtfortschritt */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-[#71717A]">
              <span>{progressPercent}% erreicht</span>
              <span>
                {earnedCount}/{totalBadgeCount}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#16A34A]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter-Bereich ──────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E4E4E7] shadow-sm">
        {/* Kategorie-Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide gap-1 px-4 pt-3 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                activeCategory === cat.id
                  ? 'bg-[#0A0A0A] text-white'
                  : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
              }`}
            >
              {cat.label}
              <span
                className={`text-[10px] px-1 rounded-full ${
                  activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-[#E4E4E7] text-[#A1A1AA]'
                }`}
              >
                {countPerCategory[cat.id]}
              </span>
            </button>
          ))}
        </div>

        {/* Rarity-Filter */}
        <div className="flex overflow-x-auto scrollbar-hide gap-1.5 px-4 pb-3 pt-1">
          {RARITY_FILTERS.map((rf) => {
            const cfg = rf.id !== 'alle' ? RARITY_CONFIG[rf.id] : null
            const isActive = activeRarity === rf.id
            return (
              <button
                key={rf.id}
                onClick={() => setActiveRarity(rf.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 border ${
                  isActive
                    ? cfg
                      ? `${cfg.pillBg} ${cfg.pillText} border-transparent`
                      : 'bg-[#0A0A0A] text-white border-transparent'
                    : 'bg-transparent text-[#71717A] border-[#E4E4E7] hover:border-[#A1A1AA]'
                }`}
              >
                {cfg && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: cfg.dot }}
                  />
                )}
                {rf.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Badge-Grid ──────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#A1A1AA] text-sm">
            Keine Abzeichen in dieser Kategorie.
          </div>
        ) : (
          <>
            {/* Raritäten in Reihenfolge: Legendary zuerst */}
            {RARITY_ORDER.map((rarity) => {
              const inRarity = filtered.filter((b) => b.rarity === rarity)
              if (inRarity.length === 0) return null
              const cfg = RARITY_CONFIG[rarity]
              return (
                <div key={rarity} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cfg.dot }}
                    />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-[#71717A]">
                      {cfg.label}
                    </h2>
                    <span className="text-xs text-[#A1A1AA]">({inRarity.length})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AnimatePresence mode="popLayout">
                      {inRarity.map((badge) => (
                        <BadgeCard key={badge.id} badge={badge} userProgress={userProgress} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* KI-Disclaimer (nicht zutreffend hier, aber App-weites Attribut) */}
      <div className="text-center pb-8 px-4">
        <p className="text-[10px] text-[#A1A1AA]">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </p>
      </div>
    </div>
  )
}
