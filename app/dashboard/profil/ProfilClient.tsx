'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  ChevronRight,
  TrendingUp,
  Target,
  Sparkles,
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

interface ThemeConfig {
  primary: string
  secondary: string
  glow: string
  glowStrong: string
  pageBg: string
  heroImage: string
  label: string
}

const SPORT_THEMES: Record<string, ThemeConfig> = {
  fussball: {
    primary: '#16A34A', secondary: '#22c55e', glow: 'rgba(22,163,74,0.4)', glowStrong: 'rgba(22,163,74,0.7)',
    pageBg: '#FAFAFA',
    heroImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400&q=75',
    label: 'Fussball',
  },
  tennis: {
    primary: '#C2621A', secondary: '#f97316', glow: 'rgba(194,98,26,0.4)', glowStrong: 'rgba(194,98,26,0.7)',
    pageBg: '#FAFAFA',
    heroImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1400&q=75',
    label: 'Tennis',
  },
  basketball: {
    primary: '#EA580C', secondary: '#fb923c', glow: 'rgba(234,88,12,0.4)', glowStrong: 'rgba(234,88,12,0.7)',
    pageBg: '#FAFAFA',
    heroImage: 'https://images.unsplash.com/photo-1559692048-79a3f837883d?w=1400&q=75',
    label: 'Basketball',
  },
}

const DEFAULT_THEME = SPORT_THEMES['fussball'] as ThemeConfig

const GERMAN_STATE_LABELS: Record<string, string> = {
  HESSEN: 'Hessen', BAYERN: 'Bayern', BERLIN: 'Berlin', BRANDENBURG: 'Brandenburg',
  BREMEN: 'Bremen', HAMBURG: 'Hamburg', MECKLENBURG_VORPOMMERN: 'Mecklenburg-Vorpommern',
  NIEDERSACHSEN: 'Niedersachsen', NORDRHEIN_WESTFALEN: 'Nordrhein-Westfalen',
  RHEINLAND_PFALZ: 'Rheinland-Pfalz', SAARLAND: 'Saarland', SACHSEN: 'Sachsen',
  SACHSEN_ANHALT: 'Sachsen-Anhalt', SCHLESWIG_HOLSTEIN: 'Schleswig-Holstein',
  THUERINGEN: 'Thueringen', BADEN_WUERTTEMBERG: 'Baden-Wuerttemberg',
}

const RARITY_LIGHT: Record<BadgeRarity, { label: string; color: string; bg: string; border: string }> = {
  COMMON: { label: 'Common', color: '#71717A', bg: '#F4F4F5', border: '#E4E4E7' },
  RARE: { label: 'Selten', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  EPIC: { label: 'Episch', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  LEGENDARY: { label: 'Legendaer', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
}

function getLevelTier(level: number): { label: string; bg: string; text: string; border: string } {
  if (level >= 20) return { label: 'Legende', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
  if (level >= 10) return { label: 'Elite', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
  if (level >= 5) return { label: 'Fortgeschritten', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
  return { label: 'Anfaenger', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
}

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as number[] },
  }
}

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

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: React.ElementType }) {
  const Icon = icon
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-zinc-500 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-zinc-400" />}
        {label}
      </span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
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
            background: `${theme.primary}10`,
            color: theme.primary,
            border: `1px solid ${theme.primary}25`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function FussballDetails({ data, theme }: { data: FussballProfil; theme: ThemeConfig }) {
  return (
    <div>
      <DetailRow label="Position" value={FUSSBALL_POSITION_LABELS[data.position]} icon={Target} />
      <DetailRow label="Starker Fuss" value={STARKERFUSS_LABELS[data.starkerFuss]} />
      <DetailRow label="Liga-Niveau" value={FUSSBALL_LIGA_LABELS[data.aktuellesLigaNiveau]} icon={TrendingUp} />
      {data.aktuellerVereinsname !== undefined && <DetailRow label="Verein" value={data.aktuellerVereinsname} icon={MapPin} />}
      <DetailRow label="Spielstil" value={FUSSBALL_SPIELSTIL_LABELS[data.spielstil]} />
      <DetailRow label="Training/Woche" value={`${data.trainingsEinheitenProWoche}x`} icon={Activity} />
      <DetailRow label="Ziel" value={FUSSBALL_ZIEL_LABELS[data.ziel]} icon={Star} />
      {data.staerken.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-100">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Staerken</p>
          <ChipList items={data.staerken.map((s) => FUSSBALL_STAERKE_LABELS[s])} theme={theme} />
        </div>
      )}
    </div>
  )
}

function TennisDetails({ data, theme }: { data: TennisProfil; theme: ThemeConfig }) {
  return (
    <div>
      <DetailRow label="Spielhand" value={SPIELHAND_LABELS[data.spielhand]} />
      <DetailRow label="Rueckhand" value={TENNIS_RUECKHAND_LABELS[data.rueckhand]} />
      <DetailRow label="Spielstil" value={TENNIS_SPIELSTIL_LABELS[data.spielstil]} />
      <DetailRow label="Oberflaeche" value={TENNIS_OBERFLAECHE_LABELS[data.lieblingsoberflaeche]} />
      <DetailRow label="Turniererfahrung" value={TENNIS_TURNIERERFAHRUNG_LABELS[data.turniererfahrung]} icon={Trophy} />
      {data.dtbLk !== undefined && <DetailRow label="DTB-LK" value={String(data.dtbLk)} />}
      {data.aktuellerVereinsname !== undefined && <DetailRow label="Verein" value={data.aktuellerVereinsname} icon={MapPin} />}
      <DetailRow label="Training/Woche" value={`${data.trainingsEinheitenProWoche}x`} icon={Activity} />
      <DetailRow label="Ziel" value={TENNIS_ZIEL_LABELS[data.ziel]} icon={Star} />
      {data.disziplinen.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-100">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Disziplinen</p>
          <ChipList items={data.disziplinen.map((d) => TENNIS_DISZIPLIN_LABELS[d])} theme={theme} />
        </div>
      )}
    </div>
  )
}

function BasketballDetails({ data, theme }: { data: BasketballProfil; theme: ThemeConfig }) {
  return (
    <div>
      <DetailRow label="Position" value={BASKETBALL_POSITION_LABELS[data.position]} icon={Target} />
      <DetailRow label="Wurfhand" value={WURFHAND_LABELS[data.wurfhand]} />
      <DetailRow label="Liga-Niveau" value={BASKETBALL_LIGA_LABELS[data.aktuellesLigaNiveau]} icon={TrendingUp} />
      {data.aktuellerVereinsname !== undefined && <DetailRow label="Verein" value={data.aktuellerVereinsname} icon={MapPin} />}
      <DetailRow label="Spielstil" value={BASKETBALL_SPIELSTIL_LABELS[data.spielstil]} />
      <DetailRow label="Training/Woche" value={`${data.trainingsEinheitenProWoche}x`} icon={Activity} />
      <DetailRow label="Ziel" value={BASKETBALL_ZIEL_LABELS[data.ziel]} icon={Star} />
      {data.staerken.length > 0 && (
        <div className="mt-5 pt-4 border-t border-zinc-100">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Staerken</p>
          <ChipList items={data.staerken.map((s) => BASKETBALL_STAERKE_LABELS[s])} theme={theme} />
        </div>
      )}
    </div>
  )
}

const SPORT_ICONS: Record<string, string> = {
  fussball: '⚽',
  tennis: '🎾',
  basketball: '🏀',
}

export function ProfilClient({
  name, email, image, level, xp, streakDays, longestStreak, primarySport,
  city, state, bio, createdAt, birthYear, totalSessions, totalMinutes, totalBadges,
  sportPayload, badges, xpInCurrentLevel, xpNeededInCurrentLevel, levelProgressPercent,
}: ProfilClientProps) {
  const theme = primarySport !== null && primarySport in SPORT_THEMES
    ? (SPORT_THEMES[primarySport] as ThemeConfig)
    : DEFAULT_THEME
  const [mounted, setMounted] = useState(false)
  const [xpBarWidth, setXpBarWidth] = useState(0)
  const [activeTab, setActiveTab] = useState<'profil' | 'badges'>('profil')

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
  const memberSince = new Date(createdAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  const levelTier = getLevelTier(level)

  const stats: Array<{ icon: React.ElementType; label: string; value: number; sub: string; color: string }> = [
    { icon: Activity, label: 'Einheiten', value: totalSessions, sub: 'absolviert', color: theme.primary },
    { icon: Clock, label: 'Minuten', value: totalMinutes, sub: 'trainiert', color: '#7C3AED' },
    { icon: Zap, label: 'XP gesamt', value: xp, sub: 'Punkte', color: '#EAB308' },
    { icon: Trophy, label: 'Abzeichen', value: totalBadges, sub: 'erhalten', color: '#EA580C' },
  ]

  const tabs: Array<{ id: 'profil' | 'badges'; label: string; icon: React.ElementType }> = [
    { id: 'profil', label: 'Profil', icon: User },
    { id: 'badges', label: 'Abzeichen', icon: Award },
  ]

  return (
    <div style={{ background: theme.pageBg }} className="min-h-screen">
      {/* ── Hero Banner ──────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="relative overflow-hidden bg-white border-b border-zinc-200/60">
        <div className="absolute top-0 inset-x-0 h-1" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }} />
        <div className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${theme.heroImage})`, opacity: 0.04 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 70% 50%, ${theme.primary}08 0%, transparent 60%)` }} />

        <div className="relative max-w-5xl mx-auto px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-xl"
                style={{ border: `3px solid ${theme.primary}` }}
              >
                {image ? (
                  <img src={image} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-4xl" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>
                    {vorname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center" style={{ border: `2px solid ${theme.primary}` }}>
                <span className="text-xs font-bold" style={{ color: theme.primary }}>{level}</span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">{name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${levelTier.bg} ${levelTier.text} border ${levelTier.border}`}>
                  Level {level} · {levelTier.label}
                </span>
              </div>

              {bio !== null && bio.length > 0 && (
                <p className="text-sm text-zinc-500 mt-1 mb-2 line-clamp-2">{bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-zinc-400">
                {locationString.length > 0 && (
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{locationString}</span>
                )}
                <span className="flex items-center gap-1.5"><Calendar size={14} />Seit {memberSince}</span>
                {birthYear !== null && (
                  <span className="flex items-center gap-1.5"><User size={14} />Jg. {birthYear}</span>
                )}
                <span className="flex items-center gap-1.5">{SPORT_ICONS[primarySport ?? 'fussball'] ?? '⚽'}{theme.label}</span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={16} style={{ color: theme.primary }} />
                <span className="text-sm font-semibold text-zinc-700">{mounted ? xp.toLocaleString('de-DE') : xp.toLocaleString('de-DE')} XP</span>
              </div>
              <span className="text-xs text-zinc-400">
                {xpInCurrentLevel.toLocaleString('de-DE')} / {xpNeededInCurrentLevel.toLocaleString('de-DE')} XP bis Level {level + 1}
              </span>
            </div>
            <div className="w-full rounded-full overflow-hidden bg-zinc-100" style={{ height: 8 }}>
              <div
                style={{
                  height: '100%',
                  width: `${xpBarWidth}%`,
                  background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
                  borderRadius: 9999,
                  transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: `0 0 12px ${theme.glow}`,
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Mobile Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-zinc-200 shadow-sm sm:hidden">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column (2/3) ──────────────── */}
          <div className={`lg:col-span-2 flex flex-col gap-6 ${activeTab !== 'profil' ? 'hidden sm:flex' : ''}`}>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(({ icon: Icon, label, value, sub, color }, i) => (
                <motion.div key={label} {...fadeUp(0.05 + i * 0.04)} className="bg-white rounded-2xl p-5 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}12` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <p className="text-2xl font-extrabold text-zinc-900">
                    <AnimatedNumber value={value} active={mounted} />
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                </motion.div>
              ))}
            </div>

            {/* Streak Card */}
            <motion.div {...fadeUp(0.2)} className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-3 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(234,88,12,0.10)' }}>
                  <Flame size={20} className="text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">Streak</h2>
                {streakDays > 0 && (
                  <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                    {streakDays} Tag{streakDays !== 1 ? 'e' : ''}
                  </span>
                )}
              </div>
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)' }}>
                    <p className="text-4xl font-black text-orange-500">
                      <AnimatedNumber value={streakDays} active={mounted} />
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Aktuelle Streak</p>
                  </div>
                  <div className="rounded-xl p-5 text-center bg-zinc-50 border border-zinc-200">
                    <p className="text-4xl font-black text-zinc-900">
                      <AnimatedNumber value={longestStreak} active={mounted} />
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Persoenlicher Rekord</p>
                  </div>
                </div>
                {streakDays > 0 && streakDays >= longestStreak && (
                  <p className="mt-4 text-sm text-center font-semibold" style={{ color: theme.primary }}>
                    Du bist auf deinem persoenlichen Rekord!
                  </p>
                )}
              </div>
            </motion.div>

            {/* Sport-Profil Card */}
            {sportPayload !== null && (
              <motion.div {...fadeUp(0.26)} className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-5 flex items-center gap-3 border-b border-zinc-100">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}12` }}>
                    <Shield size={20} style={{ color: theme.primary }} />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900">{theme.label}-Profil</h2>
                  <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ color: theme.primary, background: `${theme.primary}10`, border: `1px solid ${theme.primary}25` }}>
                    {theme.label}
                  </span>
                </div>
                <div className="px-6 py-2">
                  {sportPayload.sport === 'fussball' && <FussballDetails data={sportPayload.data} theme={theme} />}
                  {sportPayload.sport === 'tennis' && <TennisDetails data={sportPayload.data} theme={theme} />}
                  {sportPayload.sport === 'basketball' && <BasketballDetails data={sportPayload.data} theme={theme} />}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Column (1/3) — Badges ────────── */}
          <div className={`flex flex-col gap-6 ${activeTab !== 'badges' ? 'hidden sm:flex' : ''}`}>
            <motion.div {...fadeUp(0.32)} className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-3 border-b border-zinc-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}12` }}>
                  <Award size={20} style={{ color: theme.primary }} />
                </div>
                <h2 className="text-lg font-bold text-zinc-900">Abzeichen</h2>
                <span className="ml-auto text-xs font-semibold" style={{ color: theme.primary }}>
                  {badges.length} erhalten
                </span>
              </div>

              {badges.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                    <Star size={28} className="text-zinc-300" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">Noch keine Abzeichen</p>
                  <p className="text-xs mt-1 text-zinc-400">
                    Trainiere regelmaessig, um Abzeichen freizuschalten!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {badges.slice(0, 8).map((ub, i) => {
                    const rarity = RARITY_LIGHT[ub.badge.rarity]
                    const BadgeIcon = getBadgeIcon(ub.badge.iconName)
                    return (
                      <motion.div
                        key={ub.id}
                        {...fadeUp(0.34 + i * 0.03)}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors"
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${rarity.color}12`, border: `1px solid ${rarity.color}25` }}
                        >
                          <BadgeIcon size={22} style={{ color: rarity.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-zinc-900 truncate">{ub.badge.name}</p>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ color: rarity.color, background: rarity.bg, border: `1px solid ${rarity.border}` }}
                            >
                              {rarity.label}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{ub.badge.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold" style={{ color: rarity.color }}>+{ub.badge.xpReward}</p>
                          <p className="text-[10px] text-zinc-400">XP</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {badges.length > 8 && (
                <div className="px-6 py-4 border-t border-zinc-100">
                  <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity" style={{ color: theme.primary }}>
                    Alle {badges.length} Abzeichen anzeigen
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div {...fadeUp(0.4)} className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Sparkles size={20} className="text-zinc-600" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">Schnelluebersicht</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Mitglied seit</span>
                  <span className="text-sm font-semibold text-zinc-900">{memberSince}</span>
                </div>
                {birthYear !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-500">Jahrgang</span>
                    <span className="text-sm font-semibold text-zinc-900">{birthYear}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Hauptsport</span>
                  <span className="text-sm font-semibold" style={{ color: theme.primary }}>{theme.label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-500">Level</span>
                  <span className="text-sm font-semibold text-zinc-900">{level} ({levelTier.label})</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.p {...fadeUp(0.48)} className="text-center pb-10 mt-8 text-xs text-zinc-400">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </motion.p>
      </div>
    </div>
  )
}