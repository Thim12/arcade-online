'use client'

// ─────────────────────────────────────────────────────────────────
// components/profil/AbzeichenClient.tsx – Abzeichen-Seite Client
// Filter-Tabs: Alle / Training / Ernährung / Sozial / Sport / Streak / Meilenstein
// Verdiente Badges: vollständig sichtbar (geheim → amber dashed)
// Unverdiente Badges: content opacity-40 + Fortschrittsbalken
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Lock } from 'lucide-react'
import type { ProfilBadge } from '@/lib/types/profil'
import { BadgeIcon, RARITY_STYLES } from '@/components/profil/ProfilClient'

// ── Typen ─────────────────────────────────────────────────────────

type FilterTab =
  | 'Alle'
  | 'Training'
  | 'Ernährung'
  | 'Sozial'
  | 'Sport'
  | 'Streak'
  | 'Meilenstein'

const TABS: FilterTab[] = [
  'Alle',
  'Training',
  'Ernährung',
  'Sozial',
  'Sport',
  'Streak',
  'Meilenstein',
]

interface AbzeichenProfilUser {
  name: string | null
  username: string | null
  image: string | null
  primarySportSlug: string | null
  primarySportColor: string | null
}

interface AbzeichenClientProps {
  badges: ProfilBadge[]
  profilUser: AbzeichenProfilUser
  isOwnProfile: boolean
}

// ── Hero-Gradienten ───────────────────────────────────────────────

const HERO_GRADIENTS: Record<string, string> = {
  fussball: 'linear-gradient(135deg, #0A0A0A 0%, #0f1f0f 50%, #0A0A0A 100%)',
  tennis: 'linear-gradient(135deg, #1A1208 0%, #2D1E0A 50%, #1A1208 100%)',
  basketball: 'linear-gradient(135deg, #0A0500 0%, #1A0F00 50%, #0A0500 100%)',
}

// ── Rarity Icon-Farben (für inline styles) ────────────────────────

const RARITY_ICON_BG: Record<string, string> = {
  COMMON: 'rgba(156, 163, 175, 0.15)',
  RARE: 'rgba(59, 130, 246, 0.15)',
  EPIC: 'rgba(139, 92, 246, 0.15)',
  LEGENDARY: 'rgba(245, 158, 11, 0.15)',
}

const RARITY_ICON_COLOR: Record<string, string> = {
  COMMON: '#9CA3AF',
  RARE: '#3B82F6',
  EPIC: '#8B5CF6',
  LEGENDARY: '#F59E0B',
}

// ── Badge-Kategorie ───────────────────────────────────────────────

function getBadgeCategory(req: Record<string, unknown>): Exclude<FilterTab, 'Alle'> {
  const type = req['type'] as string
  if (
    ['training_plan_created', 'training_sessions', 'sessions_before_hour', 'sessions_after_hour'].includes(type)
  )
    return 'Training'
  if (
    ['meal_logged', 'meals_logged', 'water_goal_days', 'nutrition_plan_followed_days'].includes(type)
  )
    return 'Ernährung'
  if (['post_created', 'verein_joined'].includes(type)) return 'Sozial'
  if (type === 'tournament_entered') return 'Sport'
  if (type === 'streak_days') return 'Streak'
  if (type === 'level_reached') return 'Meilenstein'
  return 'Training'
}

// ── Fortschritts-Label ────────────────────────────────────────────

function getProgressLabel(req: Record<string, unknown>): string {
  const type = req['type'] as string
  switch (type) {
    case 'training_sessions':
    case 'sessions_before_hour':
    case 'sessions_after_hour':
      return 'Sessions'
    case 'training_plan_created':
      return 'Pläne'
    case 'post_created':
      return 'Posts'
    case 'verein_joined':
      return 'Vereine'
    case 'streak_days':
      return 'Tage'
    case 'meal_logged':
    case 'meals_logged':
      return 'Mahlzeiten'
    case 'water_goal_days':
    case 'nutrition_plan_followed_days':
      return 'Tage'
    case 'tournament_entered':
      return 'Turniere'
    case 'level_reached':
      return 'Level'
    default:
      return 'Punkte'
  }
}

// ── Datumsformatierung ────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── AbzeichenBadgeCard ────────────────────────────────────────────

function AbzeichenBadgeCard({ badge }: { badge: ProfilBadge }) {
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES['COMMON']
  const iconColor = RARITY_ICON_COLOR[badge.rarity] ?? RARITY_ICON_COLOR['COMMON']
  const iconBg = RARITY_ICON_BG[badge.rarity] ?? RARITY_ICON_BG['COMMON']

  // Geheim + verdient → Amber-Sonderlayout
  if (badge.isEarned && badge.isSecret) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#D97706] bg-gradient-to-br from-[#FEF9C3] to-[#FEF3C7] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-[#D97706] uppercase tracking-widest">
            Geheimabzeichen
          </span>
          <span className="text-[9px] text-[#92400E] font-medium">
            +{badge.xpReward} XP
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 py-1">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)' }}
          >
            <span style={{ color: '#D97706' }}>
              <BadgeIcon name={badge.iconName} size={24} />
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#0A0A0A]">{badge.name}</p>
            <p className="text-[11px] text-[#71717A] mt-0.5 leading-tight">
              {badge.description}
            </p>
          </div>
        </div>

        {badge.earnedAt && (
          <p className="text-[10px] text-[#92400E] text-center">
            Verdient: {formatDate(badge.earnedAt)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${style.border} ${style.bg}`}>
      {/* Haupt-Inhalt — bei unverdient opacity-40 */}
      <div className={`p-4 flex flex-col gap-3 ${!badge.isEarned ? 'opacity-40' : ''}`}>
        <div className="flex items-center justify-between">
          <span className={`text-[9px] font-bold uppercase tracking-wider ${style.text}`}>
            {style.label}
          </span>
          <span className="text-[9px] text-[#A1A1AA] font-medium">
            +{badge.xpReward} XP
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 py-1">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: iconBg }}
          >
            <span style={{ color: iconColor }}>
              <BadgeIcon name={badge.iconName} size={24} />
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#0A0A0A]">{badge.name}</p>
            <p className="text-[11px] text-[#71717A] mt-0.5 leading-tight">
              {badge.description}
            </p>
          </div>
        </div>

        {badge.isEarned && badge.earnedAt ? (
          <p className="text-[10px] text-[#A1A1AA] text-center">
            Verdient: {formatDate(badge.earnedAt)}
          </p>
        ) : (
          <div className="flex items-center justify-center gap-1 text-[10px] text-[#A1A1AA]">
            <Lock size={10} />
            Noch nicht verdient
          </div>
        )}
      </div>

      {/* Fortschrittsbalken (unverdient, außerhalb des opacity-Wrappers) */}
      {!badge.isEarned &&
        badge.progressTotal != null &&
        badge.progressCurrent != null && (
          <div className="px-4 pb-4 pt-0">
            <div className="flex items-center justify-between text-[10px] text-[#71717A] mb-1.5">
              <span>
                {badge.progressCurrent}/{badge.progressTotal}{' '}
                {getProgressLabel(badge.requirement)}
              </span>
              <span className="font-medium">{badge.progress ?? 0}%</span>
            </div>
            <div className="h-1.5 bg-[#E4E4E7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${badge.progress ?? 0}%`,
                  backgroundColor: iconColor,
                }}
              />
            </div>
          </div>
        )}
    </div>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────

export function AbzeichenClient({
  badges,
  profilUser,
  isOwnProfile,
}: AbzeichenClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<FilterTab>('Alle')

  const heroGradient =
    HERO_GRADIENTS[profilUser.primarySportSlug ?? ''] ??
    'linear-gradient(135deg, #0A0A0A, #111)'

  // Gefilterte Liste
  const filteredBadges =
    activeTab === 'Alle'
      ? badges
      : badges.filter((b) => getBadgeCategory(b.requirement) === activeTab)

  const earnedFiltered = filteredBadges.filter((b) => b.isEarned)
  const unearnedFiltered = filteredBadges.filter((b) => !b.isEarned)

  // Anzahl verdienter Badges je Tab (für Badge-Counter)
  function earnedCountForTab(tab: FilterTab): number {
    const list =
      tab === 'Alle'
        ? badges
        : badges.filter((b) => getBadgeCategory(b.requirement) === tab)
    return list.filter((b) => b.isEarned).length
  }

  const totalEarned = badges.filter((b) => b.isEarned).length

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div
        className="relative w-full"
        style={{ height: 160, background: heroGradient }}
      >
        {profilUser.primarySportColor && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${profilUser.primarySportColor}80 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Zurück-Button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-all backdrop-blur-sm"
          >
            ← Zurück
          </button>
        </div>

        {/* Titel */}
        <div className="absolute bottom-6 left-0 right-0 px-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy size={16} className="text-yellow-400" />
            <h1 className="text-white font-bold text-lg">
              {isOwnProfile
                ? 'Deine Abzeichen'
                : `Abzeichen von ${profilUser.name ?? profilUser.username ?? 'Profil'}`}
            </h1>
          </div>
          <p className="text-white/50 text-xs">
            {totalEarned} von {badges.length} verdient
          </p>
        </div>
      </div>

      {/* ── Content (weiß) ────────────────────────────────────────── */}
      <div className="bg-white relative -mt-4 rounded-t-3xl min-h-[calc(100vh-156px)]">
        <div className="max-w-2xl mx-auto px-5 pt-5 pb-12">
          {/* ── Filter-Tabs ───────────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-5">
            {TABS.map((tab) => {
              const earned = earnedCountForTab(tab)
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={
                    isActive
                      ? { backgroundColor: '#0A0A0A', color: '#fff' }
                      : { backgroundColor: '#F4F4F5', color: '#3F3F46' }
                  }
                >
                  {tab}
                  {earned > 0 && (
                    <span
                      className="text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                      style={
                        isActive
                          ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }
                          : { backgroundColor: '#E4E4E7', color: '#71717A' }
                      }
                    >
                      {earned}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Verdiente Abzeichen ───────────────────────────────── */}
          {earnedFiltered.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-[#0A0A0A] mb-3 flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500" />
                Verdient
                <span className="text-xs text-[#71717A] font-normal">
                  ({earnedFiltered.length})
                </span>
              </h2>
              <motion.div className="grid grid-cols-2 sm:grid-cols-3 gap-3" layout>
                <AnimatePresence mode="popLayout">
                  {earnedFiltered.map((badge) => (
                    <motion.div
                      key={badge.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AbzeichenBadgeCard badge={badge} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}

          {/* ── Noch zu erreichen ─────────────────────────────────── */}
          {unearnedFiltered.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[#0A0A0A] mb-3 flex items-center gap-2">
                <Lock size={14} className="text-[#A1A1AA]" />
                Noch zu erreichen
                <span className="text-xs text-[#71717A] font-normal">
                  ({unearnedFiltered.length})
                </span>
              </h2>
              <motion.div className="grid grid-cols-2 sm:grid-cols-3 gap-3" layout>
                <AnimatePresence mode="popLayout">
                  {unearnedFiltered.map((badge) => (
                    <motion.div
                      key={badge.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <AbzeichenBadgeCard badge={badge} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}

          {/* Leere Kategorie */}
          {earnedFiltered.length === 0 && unearnedFiltered.length === 0 && (
            <div className="text-center py-16">
              <Trophy size={32} className="text-[#E4E4E7] mx-auto mb-3" />
              <p className="text-sm text-[#A1A1AA]">
                Keine Abzeichen in dieser Kategorie
              </p>
            </div>
          )}

          {/* KI-Hinweis */}
          <p className="text-[10px] text-[#D4D4D8] text-center mt-10">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </p>
        </div>
      </div>
    </div>
  )
}
