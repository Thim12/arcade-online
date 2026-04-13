'use client'
// ─────────────────────────────────────────────────────────────────
// ProfilClient.tsx – Sport-spezifische Profilseite
//
// Sections:
//   Hero          – Sportbild-Hintergrund, TiltCard-Avatar, User-Info
//   XP-Progress   – Level + XP-Fortschrittsbalken (Glass)
//   Stats-Row     – Einheiten / Minuten / XP / Abzeichen (Glass)
//   Sport-Profil  – Sportartspezifische Details (Glass)
//   Streak        – Aktuelle + Rekord-Streak (Glass)
//   Badges        – Rarity-Grid (Glass, dunkel)
//   Footer        – KI-Disclaimer
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  MapPin,
  Calendar,
  Flame,
  Zap,
  Trophy,
  Activity,
  Clock,
  Star,
  Shield,
  Award,
  User,
} from 'lucide-react'
import { getBadgeIcon } from '@/lib/sport-icons'
import type { BadgeRarity } from '@prisma/client'
import type { FussballProfil, TennisProfil, BasketballProfil } from '@/lib/sport-profiles'
import {
  FUSSBALL_POSITION_LABELS,
  FUSSBALL_LIGA_LABELS,
  FUSSBALL_SPIELSTIL_LABELS,
  FUSSBALL_STAERKE_LABELS,
  FUSSBALL_ZIEL_LABELS,
  STARKERFUSS_LABELS,
  TENNIS_SPIELSTIL_LABELS,
  TENNIS_OBERFLAECHE_LABELS,
  TENNIS_DISZIPLIN_LABELS,
  TENNIS_TURNIERERFAHRUNG_LABELS,
  TENNIS_RUECKHAND_LABELS,
  TENNIS_ZIEL_LABELS,
  SPIELHAND_LABELS,
  BASKETBALL_POSITION_LABELS,
  BASKETBALL_LIGA_LABELS,
  BASKETBALL_SPIELSTIL_LABELS,
  BASKETBALL_STAERKE_LABELS,
  BASKETBALL_ZIEL_LABELS,
  WURFHAND_LABELS,
} from '@/lib/sport-profiles'

// ── Types ──────────────────────────────────────────────────────────

export type SportDetailsPayload =
  | { sport: 'fussball'; data: FussballProfil }
  | { sport: 'tennis'; data: TennisProfil }
  | { sport: 'basketball'; data: BasketballProfil }
  | null

interface BadgeItem {
  id: string
  earnedAt: string
  badge: {
    id: string
    name: string
    description: string
    iconName: string
    rarity: BadgeRarity
    xpReward: number
  }
}

export interface ProfilClientProps {
  name: string
  email: string
  image: string | null
  level: number
  xp: number
  streakDays: number
  longestStreak: number
  primarySport: string | null
  city: string | null
  state: string | null
  bio: string | null
  createdAt: string
  birthYear: number | null
  totalSessions: number
  totalMinutes: number
  totalBadges: number
  sportPayload: SportDetailsPayload
  badges: BadgeItem[]
  xpInCurrentLevel: number
  xpNeededInCurrentLevel: number
  levelProgressPercent: number
}

// ── Theme ──────────────────────────────────────────────────────────

interface ThemeConfig {
  primary: string
  secondary: string
  glow: string
  glowStrong: string
  pageBg: string
  heroBg: string
  heroImage: string
  cardBg: string
  cardBorder: string
  label: string
}

const SPORT_THEMES: Record<string, ThemeConfig> = {
  fussball: {
    primary: '#16A34A',
    secondary: '#22c55e',
    glow: 'rgba(22,163,74,0.4)',
    glowStrong: 'rgba(22,163,74,0.7)',
    pageBg: 'linear-gradient(160deg, #030f06 0%, #04200a 35%, #051a08 70%, #020d04 100%)',
    heroBg: 'linear-gradient(135deg, #052e16 0%, #0a3d1e 100%)',
    heroImage:
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1400&q=80&fit=crop',
    cardBg: 'rgba(22,163,74,0.06)',
    cardBorder: 'rgba(22,163,74,0.15)',
    label: 'Fußball',
  },
  tennis: {
    primary: '#C2621A',
    secondary: '#f97316',
    glow: 'rgba(194,98,26,0.4)',
    glowStrong: 'rgba(194,98,26,0.7)',
    pageBg: 'linear-gradient(160deg, #1a0800 0%, #2d1206 35%, #241005 70%, #160800 100%)',
    heroBg: 'linear-gradient(135deg, #451a03 0%, #6b2d08 100%)',
    heroImage:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1400&q=80&fit=crop',
    cardBg: 'rgba(194,98,26,0.06)',
    cardBorder: 'rgba(194,98,26,0.15)',
    label: 'Tennis',
  },
  basketball: {
    primary: '#EA580C',
    secondary: '#fb923c',
    glow: 'rgba(234,88,12,0.4)',
    glowStrong: 'rgba(234,88,12,0.7)',
    pageBg: 'linear-gradient(160deg, #150300 0%, #2a0800 35%, #220700 70%, #130200 100%)',
    heroBg: 'linear-gradient(135deg, #431407 0%, #6b2312 100%)',
    heroImage:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1400&q=80&fit=crop',
    cardBg: 'rgba(234,88,12,0.06)',
    cardBorder: 'rgba(234,88,12,0.15)',
    label: 'Basketball',
  },
}

const DEFAULT_THEME = SPORT_THEMES['fussball'] as ThemeConfig

// ── Konstanten ─────────────────────────────────────────────────────

const GERMAN_STATE_LABELS: Record<string, string> = {
  HESSEN: 'Hessen',
  BAYERN: 'Bayern',
  BERLIN: 'Berlin',
  BRANDENBURG: 'Brandenburg',
  BREMEN: 'Bremen',
  HAMBURG: 'Hamburg',
  MECKLENBURG_VORPOMMERN: 'Mecklenburg-Vorpommern',
  NIEDERSACHSEN: 'Niedersachsen',
  NORDRHEIN_WESTFALEN: 'Nordrhein-Westfalen',
  RHEINLAND_PFALZ: 'Rheinland-Pfalz',
  SAARLAND: 'Saarland',
  SACHSEN: 'Sachsen',
  SACHSEN_ANHALT: 'Sachsen-Anhalt',
  SCHLESWIG_HOLSTEIN: 'Schleswig-Holstein',
  THUERINGEN: 'Thüringen',
  BADEN_WUERTTEMBERG: 'Baden-Württemberg',
}

const RARITY_DARK: Record<
  BadgeRarity,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  COMMON: {
    label: 'Common',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.20)',
    glow: 'rgba(148,163,184,0.10)',
  },
  RARE: {
    label: 'Selten',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
    glow: 'rgba(96,165,250,0.15)',
  },
  EPIC: {
    label: 'Episch',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.25)',
    glow: 'rgba(167,139,250,0.15)',
  },
  LEGENDARY: {
    label: 'Legendär',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.30)',
    glow: 'rgba(251,191,36,0.20)',
  },
}

// ── Animation Helpers ──────────────────────────────────────────────

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.55,
      delay,
      ease: [0.16, 1, 0.3, 1] as number[],
    },
  }
}

// ── AnimatedNumber ─────────────────────────────────────────────────

function AnimatedNumber({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!active) return
    let startTs: number | null = null
    let raf: number

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts
      const elapsed = ts - startTs
      const progress = Math.min(elapsed / 1200, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, active])

  return <>{(active ? display : value).toLocaleString('de-DE')}</>
}

// ── TiltCard ───────────────────────────────────────────────────────

function TiltCard({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const springX = useSpring(tiltX, { stiffness: 200, damping: 20 })
  const springY = useSpring(tiltY, { stiffness: 200, damping: 20 })
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    tiltX.set((e.clientX - rect.left) / rect.width - 0.5)
    tiltY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    tiltX.set(0)
    tiltY.set(0)
  }

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 800,
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Detail Row & Chip List ─────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span
        className="text-sm flex-shrink-0"
        style={{ color: 'rgba(255,255,255,0.45)', minWidth: 140 }}
      >
        {label}
      </span>
      <span className="text-sm font-semibold text-right text-white">{value}</span>
    </div>
  )
}

function ChipList({ items, theme }: { items: string[]; theme: ThemeConfig }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item) => (
        <span
          key={item}
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: `${theme.primary}18`,
            color: theme.secondary,
            border: `1px solid ${theme.primary}30`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

// ── Sport-Detail Sub-Components ────────────────────────────────────

function FussballDetails({
  data,
  theme,
}: {
  data: FussballProfil
  theme: ThemeConfig
}) {
  return (
    <div>
      <DetailRow label="Position" value={FUSSBALL_POSITION_LABELS[data.position]} />
      <DetailRow label="Starker Fuß" value={STARKERFUSS_LABELS[data.starkerFuss]} />
      <DetailRow label="Liga-Niveau" value={FUSSBALL_LIGA_LABELS[data.aktuellesLigaNiveau]} />
      {data.aktuellerVereinsname !== undefined && (
        <DetailRow label="Verein" value={data.aktuellerVereinsname} />
      )}
      <DetailRow label="Spielstil" value={FUSSBALL_SPIELSTIL_LABELS[data.spielstil]} />
      <DetailRow label="Trainer" value={data.hatTrainer ? 'Ja' : 'Nein'} />
      <DetailRow label="Training / Woche" value={`${data.trainingsEinheitenProWoche}×`} />
      <DetailRow label="Ziel" value={FUSSBALL_ZIEL_LABELS[data.ziel]} />
      {data.staerken.length > 0 && (
        <div className="mt-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Stärken
          </p>
          <ChipList
            items={data.staerken.map((s) => FUSSBALL_STAERKE_LABELS[s])}
            theme={theme}
          />
        </div>
      )}
    </div>
  )
}

function TennisDetails({
  data,
  theme,
}: {
  data: TennisProfil
  theme: ThemeConfig
}) {
  return (
    <div>
      <DetailRow label="Spielhand" value={SPIELHAND_LABELS[data.spielhand]} />
      <DetailRow label="Rückhand" value={TENNIS_RUECKHAND_LABELS[data.rueckhand]} />
      <DetailRow label="Spielstil" value={TENNIS_SPIELSTIL_LABELS[data.spielstil]} />
      <DetailRow
        label="Lieblingsoberfläche"
        value={TENNIS_OBERFLAECHE_LABELS[data.lieblingsoberflaeche]}
      />
      <DetailRow
        label="Turniererfahrung"
        value={TENNIS_TURNIERERFAHRUNG_LABELS[data.turniererfahrung]}
      />
      {data.dtbLk !== undefined && (
        <DetailRow label="DTB-LK" value={String(data.dtbLk)} />
      )}
      {data.aktuellerVereinsname !== undefined && (
        <DetailRow label="Verein" value={data.aktuellerVereinsname} />
      )}
      <DetailRow label="Trainer" value={data.hatTrainer ? 'Ja' : 'Nein'} />
      <DetailRow label="Training / Woche" value={`${data.trainingsEinheitenProWoche}×`} />
      <DetailRow label="Ziel" value={TENNIS_ZIEL_LABELS[data.ziel]} />
      {data.disziplinen.length > 0 && (
        <div className="mt-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Disziplinen
          </p>
          <ChipList
            items={data.disziplinen.map((d) => TENNIS_DISZIPLIN_LABELS[d])}
            theme={theme}
          />
        </div>
      )}
    </div>
  )
}

function BasketballDetails({
  data,
  theme,
}: {
  data: BasketballProfil
  theme: ThemeConfig
}) {
  return (
    <div>
      <DetailRow label="Position" value={BASKETBALL_POSITION_LABELS[data.position]} />
      <DetailRow label="Wurfhand" value={WURFHAND_LABELS[data.wurfhand]} />
      <DetailRow
        label="Liga-Niveau"
        value={BASKETBALL_LIGA_LABELS[data.aktuellesLigaNiveau]}
      />
      {data.aktuellerVereinsname !== undefined && (
        <DetailRow label="Verein" value={data.aktuellerVereinsname} />
      )}
      <DetailRow label="Spielstil" value={BASKETBALL_SPIELSTIL_LABELS[data.spielstil]} />
      <DetailRow label="Trainer" value={data.hatTrainer ? 'Ja' : 'Nein'} />
      <DetailRow label="Training / Woche" value={`${data.trainingsEinheitenProWoche}×`} />
      <DetailRow label="Ziel" value={BASKETBALL_ZIEL_LABELS[data.ziel]} />
      {data.staerken.length > 0 && (
        <div className="mt-4">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Stärken
          </p>
          <ChipList
            items={data.staerken.map((s) => BASKETBALL_STAERKE_LABELS[s])}
            theme={theme}
          />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Hauptkomponente
// ─────────────────────────────────────────────────────────────────

export function ProfilClient({
  name,
  email,
  image,
  level,
  xp,
  streakDays,
  longestStreak,
  primarySport,
  city,
  state,
  bio,
  createdAt,
  birthYear,
  totalSessions,
  totalMinutes,
  totalBadges,
  sportPayload,
  badges,
  xpInCurrentLevel,
  xpNeededInCurrentLevel,
  levelProgressPercent,
}: ProfilClientProps) {
  const theme =
    primarySport !== null && primarySport in SPORT_THEMES
      ? (SPORT_THEMES[primarySport] as ThemeConfig)
      : DEFAULT_THEME

  const [mounted, setMounted] = useState(false)
  const [xpBarWidth, setXpBarWidth] = useState(0)

  useEffect(() => {
    setMounted(true)
    const t = setTimeout(() => setXpBarWidth(levelProgressPercent), 300)
    return () => clearTimeout(t)
  }, [levelProgressPercent])

  const vorname = name.split(' ')[0] ?? name

  const locationParts: string[] = []
  if (city) locationParts.push(city)
  if (state) locationParts.push(GERMAN_STATE_LABELS[state] ?? state)
  const locationString = locationParts.join(', ')

  const memberSince = new Date(createdAt).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })

  const stats: Array<{
    icon: React.ElementType
    label: string
    value: number
    sub: string
  }> = [
    { icon: Activity, label: 'Einheiten', value: totalSessions, sub: 'absolviert' },
    { icon: Clock, label: 'Minuten', value: totalMinutes, sub: 'trainiert' },
    { icon: Zap, label: 'XP gesamt', value: xp, sub: 'Punkte' },
    { icon: Trophy, label: 'Abzeichen', value: totalBadges, sub: 'erhalten' },
  ]

  return (
    <div style={{ background: theme.pageBg, minHeight: '100vh' }}>
      {/* ── Hero Section ──────────────────────────────────────────── */}
      <motion.div
        {...fadeUp(0)}
        className="relative overflow-hidden"
        style={{
          background: theme.heroBg,
          borderBottom: `1px solid ${theme.cardBorder}`,
        }}
      >
        {/* Sportbild */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{
            backgroundImage: `url(${theme.heroImage})`,
            opacity: 0.08,
          }}
        />
        {/* Gradient-Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        <div className="relative px-8 py-10">
          <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-8">
            {/* TiltCard Avatar */}
            <TiltCard className="flex-shrink-0">
              <div
                className="w-28 h-28 rounded-2xl overflow-hidden"
                style={{
                  boxShadow: `0 0 40px ${theme.glowStrong}, 0 8px 32px rgba(0,0,0,0.60)`,
                  border: `2px solid ${theme.primary}60`,
                }}
              >
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-black text-4xl"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    }}
                  >
                    {vorname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </TiltCard>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-black text-white">{name}</h1>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: `${theme.primary}25`,
                    color: theme.secondary,
                    border: `1px solid ${theme.primary}40`,
                  }}
                >
                  Level {level} · {theme.label}
                </span>
              </div>

              <p
                className="text-sm mb-3"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                {email}
              </p>

              {bio !== null && (
                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                >
                  {bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4">
                {locationString.length > 0 && (
                  <span
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: 'rgba(255,255,255,0.50)' }}
                  >
                    <MapPin size={14} />
                    {locationString}
                  </span>
                )}
                <span
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: 'rgba(255,255,255,0.50)' }}
                >
                  <Calendar size={14} />
                  Dabei seit {memberSince}
                </span>
                {birthYear !== null && (
                  <span
                    className="flex items-center gap-1.5 text-sm"
                    style={{ color: 'rgba(255,255,255,0.50)' }}
                  >
                    <User size={14} />
                    Jahrgang {birthYear}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Page Content ────────────────────────────────────────────── */}
      <div className="px-8 py-8 w-full">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

          {/* ── LINKE SPALTE (2/3): XP · Stats · Sport-Profil ──────── */}
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* XP Progress Card */}
            <motion.div
              {...fadeUp(0.06)}
              className="rounded-2xl p-6"
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                backdropFilter: 'blur(12px)',
                boxShadow: `0 4px 24px ${theme.glow}`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${theme.primary}20` }}
                  >
                    <Zap size={20} style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: `${theme.primary}bb` }}
                    >
                      Erfahrungspunkte
                    </p>
                    <p className="text-2xl font-black text-white">
                      {xp.toLocaleString('de-DE')} XP
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Level
                  </p>
                  <p className="text-3xl font-black" style={{ color: theme.primary }}>
                    {level}
                  </p>
                </div>
              </div>

              {/* Fortschrittsbalken */}
              <div
                className="w-full rounded-full overflow-hidden mb-2"
                style={{ height: 8, background: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${xpBarWidth}%`,
                    background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
                    borderRadius: 9999,
                    transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: `0 0 10px ${theme.glow}`,
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {xpInCurrentLevel} / {xpNeededInCurrentLevel} XP bis Level {level + 1}
              </p>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(({ icon: Icon, label, value, sub }, i) => (
                <motion.div
                  key={label}
                  {...fadeUp(0.10 + i * 0.06)}
                  className="rounded-2xl p-5"
                  style={{
                    background: theme.cardBg,
                    border: `1px solid ${theme.cardBorder}`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${theme.primary}18` }}
                  >
                    <Icon size={18} style={{ color: theme.primary }} />
                  </div>
                  <p className="text-xl font-bold text-white">
                    <AnimatedNumber value={value} active={mounted} />
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {label} · {sub}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Sport-Profil Card */}
            {sportPayload !== null && (
              <motion.div
                {...fadeUp(0.28)}
                className="rounded-2xl p-6"
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${theme.primary}20` }}
                  >
                    <Shield size={20} style={{ color: theme.primary }} />
                  </div>
                  <h2 className="text-lg font-bold text-white">{theme.label}-Profil</h2>
                </div>

                {sportPayload.sport === 'fussball' && (
                  <FussballDetails data={sportPayload.data} theme={theme} />
                )}
                {sportPayload.sport === 'tennis' && (
                  <TennisDetails data={sportPayload.data} theme={theme} />
                )}
                {sportPayload.sport === 'basketball' && (
                  <BasketballDetails data={sportPayload.data} theme={theme} />
                )}
              </motion.div>
            )}
          </div>

          {/* ── RECHTE SPALTE (1/3): Streak · Badges ───────────────── */}
          <div className="flex flex-col gap-6">

            {/* Streak */}
            <motion.div
              {...fadeUp(0.34)}
              className="rounded-2xl p-6"
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(234,88,12,0.15)' }}
                >
                  <Flame size={20} style={{ color: '#fb923c' }} />
                </div>
                <h2 className="text-lg font-bold text-white">Streak</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: 'rgba(234,88,12,0.12)',
                    border: '1px solid rgba(234,88,12,0.25)',
                  }}
                >
                  <p className="text-4xl font-black" style={{ color: '#fb923c' }}>
                    <AnimatedNumber value={streakDays} active={mounted} />
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Aktuelle Streak
                  </p>
                </div>
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <p className="text-4xl font-black text-white">
                    <AnimatedNumber value={longestStreak} active={mounted} />
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Persönlicher Rekord
                  </p>
                </div>
              </div>

              {streakDays > 0 && streakDays >= longestStreak && (
                <p
                  className="mt-3 text-sm text-center font-semibold"
                  style={{ color: theme.primary }}
                >
                  Du bist auf deinem persönlichen Rekord!
                </p>
              )}
            </motion.div>

            {/* Badges */}
            <motion.div
              {...fadeUp(0.40)}
              className="rounded-2xl overflow-hidden"
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="px-6 py-5 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${theme.cardBorder}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${theme.primary}20` }}
                >
                  <Award size={20} style={{ color: theme.primary }} />
                </div>
                <h2 className="text-lg font-bold text-white">Abzeichen</h2>
                <span
                  className="ml-auto text-xs font-semibold"
                  style={{ color: `${theme.primary}99` }}
                >
                  {badges.length} erhalten
                </span>
              </div>

              {badges.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <Star
                    size={36}
                    style={{ color: 'rgba(255,255,255,0.08)', margin: '0 auto 12px' }}
                  />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Noch keine Abzeichen erhalten.
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.20)' }}>
                    Trainiere regelmäßig, um Abzeichen freizuschalten!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-5">
                  {badges.map((ub, i) => {
                    const rarity = RARITY_DARK[ub.badge.rarity]
                    const BadgeIcon = getBadgeIcon(ub.badge.iconName)
                    return (
                      <motion.div
                        key={ub.id}
                        {...fadeUp(0.42 + i * 0.04)}
                        className="flex items-center gap-3 p-4 rounded-xl"
                        style={{
                          background: rarity.bg,
                          border: `1px solid ${rarity.border}`,
                          boxShadow: `0 0 16px ${rarity.glow}`,
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `${rarity.color}18`,
                            border: `1px solid ${rarity.color}30`,
                          }}
                        >
                          <BadgeIcon size={22} style={{ color: rarity.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {ub.badge.name}
                          </p>
                          <p
                            className="text-xs truncate"
                            style={{ color: 'rgba(255,255,255,0.40)' }}
                          >
                            {ub.badge.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs font-semibold"
                              style={{ color: rarity.color }}
                            >
                              {rarity.label}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
                            <span
                              className="text-xs"
                              style={{ color: 'rgba(255,255,255,0.30)' }}
                            >
                              +{ub.badge.xpReward} XP
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>

          </div>
        </div>

        {/* KI-Footer */}
        <motion.p
          {...fadeUp(0.48)}
          className="text-center pb-10 mt-6"
          style={{ fontSize: 11, color: 'rgba(255,255,255,0.16)' }}
        >
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </motion.p>
      </div>
    </div>
  )
}
