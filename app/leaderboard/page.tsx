'use client'

// ─────────────────────────────────────────────────────────────────
// app/leaderboard/page.tsx – Bestenliste
//
// Client Component mit Sport-Filter-Tabs + Zeitraum-Filter.
// Fetcht Daten von /api/leaderboard auf Filteränderung.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, Award, Crown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { LeaderboardEntry, LeaderboardResponse } from '@/app/api/leaderboard/route'

// ── Typen ────────────────────────────────────────────────────────

type SportFilter = '' | 'fussball' | 'tennis' | 'basketball'
type PeriodFilter = 'week' | 'month' | 'all'

// ── Sport-Filter-Konfiguration ───────────────────────────────────

const SPORT_TABS: { id: SportFilter; label: string; color: string }[] = [
  { id: '', label: 'Gesamt', color: '#0A0A0A' },
  { id: 'fussball', label: 'Fußball', color: '#16A34A' },
  { id: 'tennis', label: 'Tennis', color: '#C2621A' },
  { id: 'basketball', label: 'Basketball', color: '#EA580C' },
]

const PERIOD_TABS: { id: PeriodFilter; label: string }[] = [
  { id: 'week', label: 'Diese Woche' },
  { id: 'month', label: 'Dieser Monat' },
  { id: 'all', label: 'Gesamt' },
]

// ── Podest-Konfiguration ─────────────────────────────────────────

const PODEST_CONFIG = [
  {
    rank: 1,
    height: 'h-[110px]',
    cardClass:
      'bg-gradient-to-b from-[#FEF9C3] to-[#FEF3C7] border-[#F59E0B] shadow-[0_4px_20px_rgba(245,158,11,0.25)]',
    icon: Trophy,
    iconColor: '#D97706',
    label: 'Gold',
    textColor: '#92400E',
    order: 2,
  },
  {
    rank: 2,
    height: 'h-[80px]',
    cardClass:
      'bg-gradient-to-b from-[#F1F5F9] to-[#E2E8F0] border-[#CBD5E1] shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
    icon: Medal,
    iconColor: '#64748B',
    label: 'Silber',
    textColor: '#475569',
    order: 1,
  },
  {
    rank: 3,
    height: 'h-[60px]',
    cardClass:
      'bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5] border-[#FCA894] shadow-[0_4px_12px_rgba(251,146,60,0.2)]',
    icon: Award,
    iconColor: '#EA580C',
    label: 'Bronze',
    textColor: '#9A3412',
    order: 3,
  },
]

// ── Avatar ───────────────────────────────────────────────────────

function Avatar({
  image,
  name,
  size = 40,
}: {
  image: string | null
  name: string | null
  size?: number
}) {
  const initials = (name ?? 'S')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? 'Sportler'}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-[#E4E4E7] flex items-center justify-center text-[#71717A] font-bold"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  )
}

// ── Podest-Karte ─────────────────────────────────────────────────

function PodestCard({
  entry,
  config,
}: {
  entry: LeaderboardEntry
  config: (typeof PODEST_CONFIG)[0]
}) {
  const Icon = config.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (config.rank - 1) * 0.08, duration: 0.3 }}
      className={`flex flex-col items-center gap-2 order-${config.order}`}
      style={{ order: config.order }}
    >
      {/* Avatar + Icon */}
      <div className="relative">
        <Avatar image={entry.image} name={entry.name} size={config.rank === 1 ? 52 : 44} />
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow"
          style={{ backgroundColor: config.iconColor }}
        >
          <Icon className="w-3 h-3 text-white" />
        </div>
      </div>

      {/* Name */}
      <p
        className="text-xs font-semibold text-center max-w-[80px] truncate"
        style={{ color: config.textColor }}
      >
        {entry.name ?? entry.username ?? 'Sportler'}
      </p>

      {/* XP */}
      <p className="text-[10px] text-[#71717A]">
        {entry.periodXP.toLocaleString('de')} XP
      </p>

      {/* Podest-Block */}
      <div
        className={`w-[88px] rounded-t-xl border-2 flex items-center justify-center ${config.cardClass} ${config.height}`}
      >
        <span className="text-xl font-black" style={{ color: config.textColor }}>
          {config.rank}
        </span>
      </div>
    </motion.div>
  )
}

// ── Rang-Zeile ───────────────────────────────────────────────────

function RankRow({
  entry,
  isMe,
  sportColor,
}: {
  entry: LeaderboardEntry
  isMe: boolean
  sportColor: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isMe
          ? 'border-l-2 bg-[#F0FDF4]'
          : 'bg-white hover:bg-[#F8F8F8]'
      }`}
      style={isMe ? { borderLeftColor: sportColor } : {}}
    >
      {/* Rang */}
      <span className="w-7 text-sm font-bold text-[#A1A1AA] text-right flex-shrink-0">
        {entry.rank}
      </span>

      {/* Avatar */}
      <Avatar image={entry.image} name={entry.name} size={36} />

      {/* Name + Level */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0A0A0A] truncate">
          {entry.name ?? entry.username ?? 'Sportler'}
          {isMe && (
            <span className="ml-1.5 text-[10px] font-medium text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded-full">
              Du
            </span>
          )}
        </p>
        <p className="text-[11px] text-[#A1A1AA]">Level {entry.level}</p>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-[#0A0A0A]">
          {entry.periodXP.toLocaleString('de')}
        </p>
        <p className="text-[10px] text-[#A1A1AA]">XP</p>
      </div>
    </motion.div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────

export default function LeaderboardPage() {
  const [sport, setSport] = useState<SportFilter>('')
  const [period, setPeriod] = useState<PeriodFilter>('week')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<string | null>(null)

  const activeSport = SPORT_TABS.find((s) => s.id === sport) ?? SPORT_TABS[0]

  // Aktuellen User laden (einmalig)
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((s: { user?: { id?: string } }) => {
        setMyId(s?.user?.id ?? null)
      })
      .catch(() => null)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (sport) params.set('sport', sport)
      params.set('period', period)
      params.set('page', String(page))
      const res = await fetch(`/api/leaderboard?${params.toString()}`)
      if (res.ok) {
        const json = (await res.json()) as LeaderboardResponse
        setData(json)
      }
    } catch {
      // kein error state nötig
    } finally {
      setLoading(false)
    }
  }, [sport, period, page])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Filter-Änderung → zurück zu Seite 1
  const handleSportChange = (s: SportFilter) => {
    setSport(s)
    setPage(1)
  }
  const handlePeriodChange = (p: PeriodFilter) => {
    setPeriod(p)
    setPage(1)
  }

  const top3 = data?.leaderboard.slice(0, 3) ?? []
  const rest = data?.leaderboard.slice(3) ?? []
  const showPodest = page === 1 && top3.length >= 2

  const periodLabel =
    period === 'week' ? 'Diese Woche' : period === 'month' ? 'Dieser Monat' : 'Gesamt'

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative bg-[#0A0A0A] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1519766304817-4f37bda74b38?w=1400&q=80"
          alt="Sportstadion"
          fill
          className="object-cover opacity-[0.08] pointer-events-none"
          priority
        />
        <div className="relative px-4 pt-8 pb-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-[#F59E0B]" />
            <h1 className="text-2xl font-black text-white tracking-tight">Bestenliste</h1>
          </div>
          <p className="text-[#A1A1AA] text-sm">
            {activeSport.id ? activeSport.label : 'Alle Sportarten'} · {periodLabel}
          </p>
        </div>
      </div>

      {/* ── Filter ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E4E4E7] shadow-sm">
        {/* Sport-Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide gap-1 px-4 pt-3 pb-1">
          {SPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSportChange(tab.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                sport === tab.id
                  ? 'text-white shadow-sm'
                  : 'bg-[#F4F4F5] text-[#71717A] hover:bg-[#E4E4E7]'
              }`}
              style={sport === tab.id ? { backgroundColor: tab.color } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Zeitraum-Pills */}
        <div className="flex gap-2 px-4 pb-3 pt-1">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handlePeriodChange(tab.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 ${
                period === tab.id
                  ? 'bg-[#0A0A0A] text-white border-transparent'
                  : 'bg-transparent text-[#71717A] border-[#E4E4E7] hover:border-[#A1A1AA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#A1A1AA] animate-spin" />
          </div>
        ) : data && data.leaderboard.length === 0 ? (
          <div className="text-center py-20 text-[#A1A1AA] text-sm">
            Noch keine Einträge für diesen Zeitraum.
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${sport}-${period}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Podest */}
              {showPodest && (
                <div className="mb-8">
                  <div className="flex items-end justify-center gap-3">
                    {PODEST_CONFIG.map((cfg) => {
                      const entry = top3.find((e) => e.rank === cfg.rank)
                      if (!entry) return null
                      return <PodestCard key={cfg.rank} entry={entry} config={cfg} />
                    })}
                  </div>
                </div>
              )}

              {/* Rang 4–50 (oder alle bei page > 1) */}
              <div className="space-y-2">
                {(page === 1 ? rest : data?.leaderboard ?? []).map((entry) => (
                  <RankRow
                    key={entry.id}
                    entry={entry}
                    isMe={entry.id === myId}
                    sportColor={activeSport.color}
                  />
                ))}
              </div>

              {/* Eigene Position (wenn nicht auf Seite) */}
              {data?.myEntry && myId && !data.leaderboard.some((e) => e.id === myId) && (
                <div className="mt-6">
                  <p className="text-xs text-[#A1A1AA] mb-2 px-1">Deine Position</p>
                  <div className="border-t border-dashed border-[#E4E4E7] pt-3">
                    <RankRow
                      entry={data.myEntry}
                      isMe
                      sportColor={activeSport.color}
                    />
                  </div>
                </div>
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-xl border border-[#E4E4E7] disabled:opacity-40 hover:bg-[#F4F4F5] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#71717A]" />
                  </button>
                  <span className="text-sm text-[#71717A]">
                    Seite {page} von {data.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className="p-2 rounded-xl border border-[#E4E4E7] disabled:opacity-40 hover:bg-[#F4F4F5] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#71717A]" />
                  </button>
                </div>
              )}

              {/* Gesamt-Zahl */}
              {data && (
                <p className="text-center text-[10px] text-[#A1A1AA] mt-4">
                  {data.total.toLocaleString('de')} Teilnehmer
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Kein KI-Attribut hier – reine Daten-Seite */}
      <div className="pb-8" />
    </div>
  )
}
