'use client'
// ─────────────────────────────────────────────────────────────────
// DashboardHomeClient.tsx – Dashboard-UI (komplett neu)
//
// Sections:
//   Hero          – 200px, Sport-Gradient, Unsplash, XP-Leiste
//   Stats 2×2     – Streak / Trainingstage / Kalorien / Abzeichen
//   Heutiges Training
//   Quick-Actions – 6 Buttons horizontal scrollbar
//   XP-Wochen-Chart – reines SVG, letzte 7 Tage
//   Letzte Einheiten + Abzeichen (unten, 2-col)
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Flame,
  Activity,
  UtensilsCrossed,
  Award,
  BookOpen,
  Utensils,
  MapPin,
  Trophy,
  Users,
  BarChart2,
  Dumbbell,
  Moon,
  Clock,
  ChevronRight,
  Target,
  TrendingUp,
  Medal,
  Star,
  Calendar,
} from 'lucide-react'
import { getBadgeIcon } from '@/lib/sport-icons'
import type { BadgeRarity } from '@prisma/client'
import type {
  DashboardPageData,
  TodayTraining,
  RecentSession,
  RecentBadge,
  ActivePlanInfo,
  XpDayEntry,
  NutritionSummary,
} from './page'

// ── Sport-System ────────────────────────────────────────────────────

interface SportColors {
  primary:   string
  glow:      string
  highlight: string
}

const SPORT_COLORS: Record<string, SportColors> = {
  fussball:   { primary: '#16A34A', glow: 'rgba(22,163,74,0.35)',  highlight: '#22c55e' },
  tennis:     { primary: '#C2621A', glow: 'rgba(194,98,26,0.35)',  highlight: '#f97316' },
  basketball: { primary: '#EA580C', glow: 'rgba(234,88,12,0.35)', highlight: '#fb923c' },
}
const DEFAULT_COLORS: SportColors = {
  primary: '#16A34A', glow: 'rgba(22,163,74,0.35)', highlight: '#22c55e',
}

const SPORT_HERO_GRADIENT: Record<string, string> = {
  fussball:   'linear-gradient(135deg, #0A0A0A 0%, #0f1f0f 50%, #0A0A0A 100%)',
  tennis:     'linear-gradient(135deg, #1A1208 0%, #2D1E0A 50%, #1A1208 100%)',
  basketball: 'linear-gradient(135deg, #0A0500 0%, #1A0F00 50%, #0A0500 100%)',
}

const SPORT_HERO_IMAGE: Record<string, string> = {
  fussball:   'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1600&q=60',
  tennis:     'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1600&q=60',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&q=60',
}

const SPORT_NAMES: Record<string, string> = {
  fussball:   'Fußball',
  tennis:     'Tennis',
  basketball: 'Basketball',
}

// ── Rarity-Stile ────────────────────────────────────────────────────

const RARITY_STYLES: Record<BadgeRarity, { label: string; color: string; bg: string; border: string }> = {
  COMMON:    { label: 'Common',   color: '#71717A', bg: '#F4F4F5', border: '#E4E4E7' },
  RARE:      { label: 'Selten',   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  EPIC:      { label: 'Episch',   color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  LEGENDARY: { label: 'Legendär', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
}

// ── Animation-Helfer ────────────────────────────────────────────────

function fadeUp(delay = 0) {
  return {
    initial:    { opacity: 0, y: 20 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as number[] },
  }
}

// ── useCountUp ──────────────────────────────────────────────────────

function useCountUp(target: number, durationMs: number, active: boolean): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    let start: number | null = null
    let rafId: number

    const tick = (ts: number) => {
      if (start === null) start = ts
      const elapsed  = ts - start
      const progress = Math.min(elapsed / durationMs, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, durationMs, active])

  return count
}

// ── Datums-Helfer ────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const d        = new Date(iso)
  const now      = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Heute'
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7)  return `Vor ${diffDays} Tagen`
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' })
}

function getGreeting(name: string): string {
  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return `Guten Morgen, ${name}`
  if (hour >= 12 && hour < 18) return `Guten Tag, ${name}`
  if (hour >= 18 && hour < 22) return `Guten Abend, ${name}`
  return `Willkommen zurück, ${name}`
}

// ─────────────────────────────────────────────────────────────────
// Sub-Components
// ─────────────────────────────────────────────────────────────────

// ── XpWeekChart ─────────────────────────────────────────────────────

function XpWeekChart({ data, sportPrimary }: { data: XpDayEntry[]; sportPrimary: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const maxXp   = Math.max(...data.map((d) => d.xp), 1)
  const CHART_H = 80
  const LABEL_H = 24
  const TOTAL_H = CHART_H + LABEL_H
  const VIEW_W  = 700
  const BAR_W   = 60
  const BAR_GAP = 40
  const PAD_X   = 20

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${VIEW_W} ${TOTAL_H}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {data.map((day, i) => {
        const barH     = day.xp > 0 ? Math.max(4, (day.xp / maxXp) * CHART_H) : 3
        const x        = PAD_X + i * (BAR_W + BAR_GAP)
        const y        = CHART_H - barH
        const isHovered = hoveredIdx === i
        const fill     = day.xp === 0 ? '#E4E4E7' : sportPrimary
        const opacity  = day.isToday ? 1.0 : day.xp > 0 ? 0.65 : 0.5

        return (
          <g
            key={i}
            style={{ cursor: day.xp > 0 ? 'pointer' : 'default' }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Hover-Hintergrund */}
            <rect
              x={x - 4}
              y={0}
              width={BAR_W + 8}
              height={CHART_H}
              rx={6}
              fill={isHovered ? '#F4F4F5' : 'transparent'}
            />

            {/* Balken */}
            <rect
              x={x}
              y={y}
              width={BAR_W}
              height={barH}
              rx={day.isToday ? 6 : 4}
              fill={fill}
              opacity={opacity}
            />

            {/* Heute-Indikator */}
            {day.isToday && (
              <rect
                x={x}
                y={CHART_H - 3}
                width={BAR_W}
                height={3}
                rx={1.5}
                fill={sportPrimary}
                opacity={0.5}
              />
            )}

            {/* X-Achse Label */}
            <text
              x={x + BAR_W / 2}
              y={CHART_H + 17}
              textAnchor="middle"
              fontSize={10}
              fontWeight={day.isToday ? 700 : 400}
              fill={day.isToday ? sportPrimary : '#A1A1AA'}
              fontFamily="inherit"
            >
              {day.dayLabel}
            </text>

            {/* Tooltip */}
            {isHovered && day.xp > 0 && (
              <g>
                <rect
                  x={x + BAR_W / 2 - 30}
                  y={y - 28}
                  width={60}
                  height={22}
                  rx={5}
                  fill="#0A0A0A"
                />
                <text
                  x={x + BAR_W / 2}
                  y={y - 13}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="white"
                  fontFamily="inherit"
                >
                  {day.xp} XP
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── TodayTrainingCard ────────────────────────────────────────────────

function TodayTrainingCard({
  todayTraining,
  activePlan,
  colors,
}: {
  todayTraining: TodayTraining | null
  activePlan:    ActivePlanInfo | null
  colors:        SportColors
}) {
  if (!activePlan) {
    return (
      <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
            <Dumbbell size={20} style={{ color: colors.primary }} />
          </div>
          <h2 className="font-bold text-lg" style={{ color: '#0A0A0A' }}>Training heute</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: '#71717A' }}>
          Noch kein Trainingsplan aktiv. Lass unsere KI einen Plan für dich erstellen.
        </p>
        <Link
          href="/dashboard/training"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: colors.primary }}
        >
          Trainingsplan erstellen
          <ChevronRight size={16} />
        </Link>
      </div>
    )
  }

  if (todayTraining?.isRestDay) {
    return (
      <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F4F4F5' }}>
            <Moon size={20} style={{ color: '#52525B' }} />
          </div>
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#0A0A0A' }}>Heute: Ruhetag</h2>
            <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
              Woche {todayTraining.weekNumber} · {todayTraining.weekFocus}
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#52525B' }}>
          Ruhe ist ein integraler Bestandteil deines Trainings. Nutze den Tag für Regeneration,
          leichtes Dehnen oder mentale Entspannung.
        </p>
        <div className="mt-4 flex items-start gap-2">
          <Target size={14} style={{ color: '#A1A1AA', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs leading-relaxed" style={{ color: '#71717A' }}>
            {todayTraining.weeklyGoal}
          </p>
        </div>
      </div>
    )
  }

  if (todayTraining) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${colors.primary}12` }}
              >
                <Dumbbell size={20} style={{ color: colors.primary }} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg truncate" style={{ color: '#0A0A0A' }}>
                  {todayTraining.dayName}: {todayTraining.focus}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                  Woche {todayTraining.weekNumber} · {todayTraining.weekFocus}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm flex-shrink-0" style={{ color: '#52525B' }}>
              <Clock size={14} />
              <span>{todayTraining.totalMinutes} Min.</span>
            </div>
          </div>

          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2"
            style={{ background: `${colors.primary}08`, border: `1px solid ${colors.primary}20` }}
          >
            <Target size={14} style={{ color: colors.primary, flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: '#52525B' }}>
              {todayTraining.weeklyGoal}
            </p>
          </div>
        </div>

        {todayTraining.exercises.length > 0 && (
          <div style={{ borderTop: '1px solid #F4F4F5' }}>
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#A1A1AA' }}>
                Übungen heute
              </p>
              <div className="flex flex-col gap-2">
                {todayTraining.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: '#FAFAFA', border: '1px solid #F4F4F5' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: ex.isSportDrill ? colors.primary : '#A1A1AA' }}
                      />
                      <span className="text-sm font-medium truncate" style={{ color: '#0A0A0A' }}>
                        {ex.name}
                      </span>
                      {ex.isSportDrill && (
                        <span
                          className="font-medium flex-shrink-0"
                          style={{
                            fontSize:     10,
                            padding:      '2px 6px',
                            borderRadius: 9999,
                            background:   `${colors.primary}15`,
                            color:        colors.primary,
                          }}
                        >
                          Drill
                        </span>
                      )}
                    </div>
                    {(ex.sets !== undefined || ex.reps !== undefined) && (
                      <span className="text-xs flex-shrink-0" style={{ color: '#71717A' }}>
                        {ex.sets !== undefined && `${ex.sets}×`}
                        {ex.reps !== undefined && `${ex.reps}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pb-6" style={{ borderTop: '1px solid #F4F4F5', paddingTop: 16 }}>
          <Link
            href="/dashboard/training"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
            style={{ background: colors.primary }}
          >
            <Dumbbell size={16} />
            Training starten
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
          <Dumbbell size={20} style={{ color: colors.primary }} />
        </div>
        <div>
          <h2 className="font-bold text-lg" style={{ color: '#0A0A0A' }}>Dein Trainingsplan</h2>
          <p className="text-sm" style={{ color: '#71717A' }}>{activePlan.title}</p>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: '#52525B' }}>
        {activePlan.durationWeeks} Wochen · {activePlan.sessionsPerWeek}× pro Woche
      </p>
      <Link
        href="/dashboard/training"
        className="inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: colors.primary }}
      >
        Zum Trainingsplan <ChevronRight size={14} />
      </Link>
    </div>
  )
}

// ── RecentSessionsCard ───────────────────────────────────────────────

function RecentSessionsCard({
  sessions,
  colors,
}: {
  sessions: RecentSession[]
  colors:   SportColors
}) {
  return (
    <div className="rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #F4F4F5' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
            <TrendingUp size={18} style={{ color: colors.primary }} />
          </div>
          <h2 className="font-bold" style={{ color: '#0A0A0A' }}>Letzte Einheiten</h2>
        </div>
        <Link
          href="/dashboard/training"
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: colors.primary }}
        >
          Alle <ChevronRight size={12} />
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Calendar size={32} style={{ color: '#E4E4E7', margin: '0 auto 12px' }} />
          <p className="text-sm" style={{ color: '#71717A' }}>Noch keine Einheiten absolviert.</p>
          <p className="text-xs mt-1" style={{ color: '#A1A1AA' }}>
            Starte dein erstes Training und sammle XP!
          </p>
        </div>
      ) : (
        <div>
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className="px-6 py-4 flex items-center gap-4"
              style={{ borderBottom: i < sessions.length - 1 ? '1px solid #F4F4F5' : 'none' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F4F4F5' }}>
                <Activity size={16} style={{ color: '#52525B' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#0A0A0A' }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#A1A1AA' }}>
                  {formatRelative(s.completedAt)} · {s.durationMin} Min.
                </p>
              </div>
              <span className="text-sm font-semibold flex-shrink-0" style={{ color: colors.primary }}>
                +{s.xpEarned} XP
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── RecentBadgesCard ─────────────────────────────────────────────────

function RecentBadgesCard({
  badges,
  colors,
}: {
  badges: RecentBadge[]
  colors: SportColors
}) {
  return (
    <div className="rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
      <div
        className="px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #F4F4F5' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}12` }}>
            <Medal size={18} style={{ color: colors.primary }} />
          </div>
          <h2 className="font-bold" style={{ color: '#0A0A0A' }}>Abzeichen</h2>
        </div>
        <Link
          href="/dashboard/profil"
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: colors.primary }}
        >
          Alle <ChevronRight size={12} />
        </Link>
      </div>

      {badges.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Star size={32} style={{ color: '#E4E4E7', margin: '0 auto 12px' }} />
          <p className="text-sm" style={{ color: '#71717A' }}>Noch keine Abzeichen erhalten.</p>
          <p className="text-xs mt-1" style={{ color: '#A1A1AA' }}>
            Trainiere regelmäßig, um Abzeichen freizuschalten!
          </p>
        </div>
      ) : (
        <div className="px-5 py-4 flex flex-col gap-3">
          {badges.map((ub) => {
            const rarity    = RARITY_STYLES[ub.badge.rarity]
            const BadgeIcon = getBadgeIcon(ub.badge.iconName)
            return (
              <div
                key={ub.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: rarity.bg, border: `1px solid ${rarity.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${rarity.color}18` }}
                >
                  <BadgeIcon size={20} style={{ color: rarity.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0A0A0A' }}>
                    {ub.badge.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-medium" style={{ color: rarity.color }}>
                      {rarity.label}
                    </span>
                    <span style={{ color: '#E4E4E7' }}>·</span>
                    <span className="text-xs" style={{ color: '#71717A' }}>+{ub.badge.xpReward} XP</span>
                  </div>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: '#A1A1AA' }}>
                  {formatRelative(ub.earnedAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Hauptkomponente
// ─────────────────────────────────────────────────────────────────

// Suppress unused-import warning — NutritionSummary is used via data.nutrition type
type _NutritionSummaryCheck = NutritionSummary

export function DashboardHomeClient({ data }: { data: DashboardPageData }) {
  const sport        = data.primarySport ?? 'fussball'
  const colors       = SPORT_COLORS[sport]          ?? DEFAULT_COLORS
  const heroGradient = SPORT_HERO_GRADIENT[sport]   ?? SPORT_HERO_GRADIENT['fussball'] ?? ''
  const heroImage    = SPORT_HERO_IMAGE[sport]      ?? SPORT_HERO_IMAGE['fussball']    ?? ''
  const sportLabel   = SPORT_NAMES[sport]           ?? 'Sport'
  const firstName    = data.userName.split(' ')[0]  ?? data.userName

  const [mounted,    setMounted]    = useState(false)
  const [xpBarWidth, setXpBarWidth] = useState(0)
  const [greeting,   setGreeting]   = useState('')

  const xpCount = useCountUp(data.xp, 1400, mounted)

  useEffect(() => {
    setMounted(true)
    setGreeting(getGreeting(firstName))
    const t = setTimeout(() => setXpBarWidth(data.levelInfo.progressPercent), 300)
    return () => clearTimeout(t)
  }, [data.levelInfo.progressPercent, firstName])

  const cssVars = {
    '--sport-primary':   colors.primary,
    '--sport-glow':      colors.glow,
    '--sport-highlight': colors.highlight,
  } as React.CSSProperties

  const calPercent = data.nutrition
    ? Math.min(100, Math.round((data.nutrition.caloriesToday / data.nutrition.caloriesGoal) * 100))
    : 0

  const lastBadge = data.recentBadges[0] ?? null

  const weekXpTotal = data.xpHistory.reduce((sum, d) => sum + d.xp, 0)

  return (
    <div className="min-h-screen" style={{ ...cssVars, background: '#FAFAFA' }}>
      <div className="px-8 py-6 w-full">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0.0)}
          className="rounded-2xl overflow-hidden mb-6 relative"
          style={{ height: 200, background: heroGradient }}
        >
          {/* Layer 2: Unsplash */}
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            style={{ opacity: 0.08 }}
            priority
            sizes="(max-width: 1280px) 100vw, 1200px"
          />

          {/* Layer 3: Overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />

          {/* Layer 4: Blur Blob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none"
            style={{
              right:      -40,
              width:      300,
              height:     300,
              background: colors.primary,
              opacity:    0.06,
            }}
          />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between px-8 pt-6 pb-6">
            {/* Oben: Begrüßung + Sport-Tag */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'rgba(255,255,255,0.40)' }}
                >
                  {new Date().toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day:     'numeric',
                    month:   'long',
                  })}
                </p>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {mounted ? greeting : `Willkommen zurück, ${firstName}`}
                </h1>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: `${colors.primary}30`,
                    color:      colors.highlight,
                    border:     `1px solid ${colors.primary}40`,
                  }}
                >
                  {sportLabel}
                </span>
                <p
                  className="hidden xl:block text-right leading-relaxed"
                  style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)', maxWidth: 160 }}
                >
                  Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
                </p>
              </div>
            </div>

            {/* Unten: XP-Fortschrittsleiste */}
            {!data.levelInfo.isMaxLevel ? (
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'rgba(255,255,255,0.50)', minWidth: 40 }}
                  >
                    Lv.{data.level}
                  </span>
                  <div
                    className="flex-1 rounded-full overflow-hidden"
                    style={{ height: 6, background: 'rgba(255,255,255,0.12)' }}
                  >
                    <div
                      style={{
                        height:       '100%',
                        width:        `${xpBarWidth}%`,
                        background:   `linear-gradient(to right, ${colors.primary}, ${colors.highlight})`,
                        borderRadius: 9999,
                        transition:   'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'rgba(255,255,255,0.50)', minWidth: 40, textAlign: 'right' }}
                  >
                    Lv.{data.level + 1}
                  </span>
                  <span
                    className="text-xs hidden sm:block"
                    style={{ color: 'rgba(255,255,255,0.30)', minWidth: 90, textAlign: 'right' }}
                  >
                    {(mounted ? xpCount : data.xp).toLocaleString('de-DE')} XP
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {data.levelInfo.xpInCurrentLevel.toLocaleString('de-DE')} /{' '}
                  {data.levelInfo.xpNeededInCurrentLevel.toLocaleString('de-DE')} XP bis Level {data.level + 1}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">MAX LEVEL</span>
                <span className="text-xs" style={{ color: colors.highlight }}>Lv.{data.level}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stats 2×2 ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* Streak */}
          <motion.div {...fadeUp(0.08)}>
            <div
              className="rounded-2xl p-5 relative"
              style={{
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                border:     '1px solid #FED7AA',
              }}
            >
              {!data.trainedToday && (
                <span
                  className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: '#FB923C' }}
                />
              )}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
              >
                <Flame size={20} style={{ color: '#EA580C' }} />
              </div>
              <p className="text-2xl font-black" style={{ color: '#EA580C' }}>
                {data.streakDays}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#C2410C' }}>
                {data.streakDays === 1 ? 'Tag Streak' : 'Tage Streak'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#92400E' }}>
                Rekord: {data.longestStreak} {data.longestStreak === 1 ? 'Tag' : 'Tage'}
              </p>
            </div>
          </motion.div>

          {/* Trainingstage */}
          <motion.div {...fadeUp(0.12)}>
            <div
              className="rounded-2xl p-5"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}
              >
                <Activity size={20} style={{ color: '#16A34A' }} />
              </div>
              <p className="text-2xl font-black" style={{ color: '#15803D' }}>
                {data.trainingDaysThisWeek.filter(Boolean).length}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#166534' }}>
                Tage diese Woche
              </p>
              {/* 7 Mini-Punkte */}
              <div className="flex items-center gap-1.5 mt-2">
                {data.trainingDaysThisWeek.map((trained, i) => {
                  const isToday = i === 6
                  return (
                    <div
                      key={i}
                      style={{
                        width:        isToday ? 12 : 8,
                        height:       isToday ? 12 : 8,
                        borderRadius: '50%',
                        background:   trained ? '#16A34A' : '#D1FAE5',
                        flexShrink:   0,
                        border:       isToday ? '2px solid #16A34A' : 'none',
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Kalorien heute */}
          <motion.div {...fadeUp(0.16)}>
            <div
              className="rounded-2xl p-5"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#DBEAFE', border: '1px solid #BFDBFE' }}
              >
                <UtensilsCrossed size={20} style={{ color: '#2563EB' }} />
              </div>
              {data.nutrition ? (
                <>
                  <p className="text-2xl font-black" style={{ color: '#1D4ED8' }}>
                    {data.nutrition.caloriesToday.toLocaleString('de-DE')}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#1E40AF' }}>
                    von {data.nutrition.caloriesGoal.toLocaleString('de-DE')} kcal
                  </p>
                  <div
                    className="mt-2 rounded-full overflow-hidden"
                    style={{ height: 4, background: '#BFDBFE' }}
                  >
                    <div
                      style={{
                        height:       '100%',
                        width:        `${calPercent}%`,
                        background:   '#2563EB',
                        borderRadius: 9999,
                        transition:   'width 0.8s ease',
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold" style={{ color: '#1D4ED8' }}>—</p>
                  <p className="text-xs mt-0.5" style={{ color: '#3B82F6' }}>Kein Ernährungsplan</p>
                  <Link
                    href="/dashboard/ernaehrung"
                    className="text-xs font-medium mt-1 block"
                    style={{ color: '#2563EB' }}
                  >
                    Plan erstellen →
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Abzeichen */}
          <motion.div {...fadeUp(0.20)}>
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, #FEF9C3 0%, #FEF3C7 100%)',
                border:     '1px solid #FDE68A',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}
              >
                <Award size={20} style={{ color: '#D97706' }} />
              </div>
              <p className="text-2xl font-black" style={{ color: '#B45309' }}>
                {data.totalBadges}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#92400E' }}>
                Abzeichen gesamt
              </p>
              {lastBadge && (
                <p className="text-xs mt-1 truncate" style={{ color: '#78350F' }}>
                  Zuletzt: {lastBadge.badge.name}
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Heutiges Training ──────────────────────────────────────── */}
        <motion.div {...fadeUp(0.24)} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: colors.primary }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
              Training
            </p>
          </div>
          <TodayTrainingCard
            todayTraining={data.todayTraining}
            activePlan={data.activePlan}
            colors={colors}
          />
        </motion.div>

        {/* ── Quick-Actions ──────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.28)} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: colors.primary }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
              Schnellzugriff
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {(
              [
                { Icon: BookOpen,  label: 'Tagebuch',    href: '/dashboard/training' },
                { Icon: Utensils,  label: 'Ernährung',   href: '/dashboard/ernaehrung' },
                { Icon: MapPin,    label: 'Vereine',     href: '/vereine' },
                { Icon: Trophy,    label: 'Turniere',    href: '/turniere' },
                { Icon: Users,     label: 'Community',   href: '/community' },
                { Icon: BarChart2, label: 'Statistiken', href: '/dashboard/profil' },
              ] as const
            ).map(({ Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 flex-shrink-0 px-5 py-4 rounded-2xl transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: '#FFFFFF',
                  border:     '1px solid #E4E4E7',
                  minWidth:   80,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${colors.primary}10` }}
                >
                  <Icon size={20} style={{ color: colors.primary }} />
                </div>
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: '#0A0A0A' }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── XP-Wochen-Chart ────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.32)} className="mb-6">
          <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${colors.primary}12` }}
                >
                  <BarChart2 size={18} style={{ color: colors.primary }} />
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: '#0A0A0A' }}>XP diese Woche</h2>
                  <p className="text-xs" style={{ color: '#A1A1AA' }}>Letzte 7 Tage</p>
                </div>
              </div>
              <span className="text-sm font-semibold" style={{ color: colors.primary }}>
                {weekXpTotal.toLocaleString('de-DE')} XP
              </span>
            </div>
            <XpWeekChart data={data.xpHistory} sportPrimary={colors.primary} />
            <p className="mt-4 text-center" style={{ fontSize: 10, color: '#D4D4D8' }}>
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </div>
        </motion.div>

        {/* ── Letzte Einheiten + Abzeichen ───────────────────────────── */}
        <motion.div {...fadeUp(0.36)}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: colors.primary }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A1A1AA' }}>
              Fortschritt
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentSessionsCard sessions={data.recentSessions} colors={colors} />
            <RecentBadgesCard   badges={data.recentBadges}   colors={colors} />
          </div>
        </motion.div>

        {/* KI-Disclaimer (kleine Screens) */}
        <motion.p
          {...fadeUp(0.40)}
          className="mt-8 text-center xl:hidden"
          style={{ fontSize: 11, color: '#A1A1AA' }}
        >
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </motion.p>

        <div className="h-10" />
      </div>
    </div>
  )
}
