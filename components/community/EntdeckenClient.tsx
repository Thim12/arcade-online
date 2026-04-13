'use client'

// ─────────────────────────────────────────────────────────────────
// EntdeckenClient.tsx – Entdecken-Seite mit 3 Tabs
// User-Cards, Trending Posts, Leaderboard
// Follow-Toggle optimistisch, Sparring-Anfrage per API
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Flame,
  Trophy,
  Heart,
  MessageCircle,
  AlertCircle,
  UserPlus,
  UserCheck,
  UserX,
  Loader2,
  Swords,
  Star,
  TrendingUp,
} from 'lucide-react'
import type {
  EntdeckenUser,
  TrendingPost,
  LeaderboardEntry,
  ProfilUserSport,
} from '@/lib/types/profil'

// ── Props ─────────────────────────────────────────────────────────

interface EntdeckenClientProps {
  nearby: EntdeckenUser[]
  sameSport: EntdeckenUser[]
  similarLevel: EntdeckenUser[]
  trendingPosts: TrendingPost[]
  leaderboard: LeaderboardEntry[]
  currentUserId: string
}

// ── Hilfsfunktionen ───────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getLevelColor(level: number): string {
  if (level >= 20) return '#FBBF24'
  if (level >= 10) return '#A78BFA'
  if (level >= 5) return '#60A5FA'
  return '#34D399'
}

const STATE_LABELS: Record<string, string> = {
  HESSEN: 'Hessen',
  BAYERN: 'Bayern',
  BERLIN: 'Berlin',
  NORDRHEIN_WESTFALEN: 'NRW',
  HAMBURG: 'Hamburg',
  SACHSEN: 'Sachsen',
  THUERINGEN: 'Thüringen',
  NIEDERSACHSEN: 'Niedersachsen',
  BADEN_WUERTTEMBERG: 'Baden-Württemberg',
  RHEINLAND_PFALZ: 'Rheinland-Pfalz',
  SACHSEN_ANHALT: 'Sachsen-Anhalt',
  SAARLAND: 'Saarland',
  BREMEN: 'Bremen',
  MECKLENBURG_VORPOMMERN: 'Mecklenburg-Vorpommern',
  SCHLESWIG_HOLSTEIN: 'Schleswig-Holstein',
  BRANDENBURG: 'Brandenburg',
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'Gerade eben'
  if (hours < 24) return `vor ${hours} Std.`
  if (days < 7) return `vor ${days} Tag${days !== 1 ? 'en' : ''}`
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
  })
}

// Prüft ob TennisDetails-sparring aktiv
function isSparringTennis(sports: ProfilUserSport[]): boolean {
  const tennis = sports.find((us) => us.sport.slug === 'tennis')
  if (!tennis?.details) return false
  const d = tennis.details as Record<string, unknown>
  return d['sucheSparringpartner'] === true
}

// Kurzinfo-Text für User-Card
function getSportShortInfo(us: ProfilUserSport): string {
  if (!us.details) return ''
  const d = us.details as Record<string, unknown>
  const parts: string[] = []
  if (typeof d['position'] === 'string') parts.push(d['position'])
  if (typeof d['liga'] === 'string') parts.push(d['liga'])
  if (typeof d['lk'] === 'string') parts.push(`LK ${d['lk']}`)
  if (typeof d['spielstil'] === 'string') parts.push(d['spielstil'])
  return parts.slice(0, 2).join(' · ')
}

// ── Toast ─────────────────────────────────────────────────────────

interface ToastState {
  visible: boolean
  message: string
  type: 'success' | 'error' | 'info'
}

function Toast({
  state,
  onClose,
}: {
  state: ToastState
  onClose: () => void
}) {
  useEffect(() => {
    if (!state.visible) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [state.visible, onClose])

  const colors = {
    success: {
      bg: 'rgba(52,211,153,0.15)',
      border: 'rgba(52,211,153,0.3)',
      text: '#6EE7B7',
    },
    error: {
      bg: 'rgba(239,68,68,0.15)',
      border: 'rgba(239,68,68,0.3)',
      text: '#FCA5A5',
    },
    info: {
      bg: 'rgba(96,165,250,0.15)',
      border: 'rgba(96,165,250,0.3)',
      text: '#93C5FD',
    },
  }
  const c = colors[state.type]

  return (
    <AnimatePresence>
      {state.visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium whitespace-nowrap"
          style={{
            backgroundColor: c.bg,
            borderColor: c.border,
            color: c.text,
          }}
        >
          <AlertCircle size={14} />
          {state.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Follow-Button ─────────────────────────────────────────────────

function FollowButton({
  isFollowing,
  isLoading,
  onToggle,
  color,
}: {
  isFollowing: boolean
  isLoading: boolean
  onToggle: () => void
  color: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
      style={
        isFollowing
          ? hovered
            ? { backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }
            : { backgroundColor: '#F4F4F5', color: '#3F3F46', border: '1px solid #E4E4E7' }
          : { backgroundColor: color, color: '#fff' }
      }
    >
      {isLoading ? (
        <Loader2 size={11} className="animate-spin" />
      ) : isFollowing ? (
        hovered ? (
          <>
            <UserX size={11} />
            Entfolgen
          </>
        ) : (
          <>
            <UserCheck size={11} />
            Folge ich
          </>
        )
      ) : (
        <>
          <UserPlus size={11} />
          Folgen
        </>
      )}
    </button>
  )
}

// ── User-Card ─────────────────────────────────────────────────────

function UserCard({
  user,
  onFollow,
  onSparring,
  followLoading,
}: {
  user: EntdeckenUser
  onFollow: (userId: string, username: string) => void
  onSparring: (userId: string) => void
  followLoading: string | null
}) {
  const primarySport = user.sports[0]
  const sportColor = primarySport?.sport.colorPrimary ?? '#16A34A'
  const isHessen = user.state === 'HESSEN'
  const showSparring = isSparringTennis(user.sports)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden"
    >
      {/* Mini-Header mit Sport-Farbe */}
      <div
        className="h-10 w-full"
        style={{
          background: `linear-gradient(135deg, ${sportColor}25, ${sportColor}10)`,
        }}
      />

      <div className="px-3 pb-3 -mt-5">
        {/* Avatar */}
        <div className="mb-2">
          {user.image ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
              <Image
                src={user.image}
                alt={user.name ?? 'Avatar'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: sportColor }}
            >
              {getInitials(user.name)}
            </div>
          )}
        </div>

        {/* Info */}
        <Link
          href={`/profil/${user.username ?? ''}`}
          className="block hover:opacity-80 transition-opacity mb-1"
        >
          <p className="text-sm font-semibold text-[#0A0A0A] truncate leading-tight">
            {user.name ?? 'Unbekannt'}
          </p>
          {user.username && (
            <p className="text-xs text-[#71717A]">@{user.username}</p>
          )}
        </Link>

        {/* Sport-Chip + Level */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {primarySport && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${sportColor}15`,
                color: sportColor,
              }}
            >
              {primarySport.sport.name}
            </span>
          )}
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{
              backgroundColor: `${getLevelColor(user.level)}20`,
              color: getLevelColor(user.level),
            }}
          >
            Lv.{user.level}
          </span>
          {user.streakDays > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-orange-500 font-semibold">
              <Flame size={10} className="fill-orange-500" />
              {user.streakDays}
            </span>
          )}
          {isHessen && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">
              Hessen
            </span>
          )}
        </div>

        {/* Standort */}
        {(user.city ?? user.state) && (
          <div className="flex items-center gap-1 text-[10px] text-[#A1A1AA] mb-1.5">
            <MapPin size={9} />
            <span>
              {user.city
                ? user.city
                : user.state
                  ? (STATE_LABELS[user.state] ?? user.state)
                  : ''}
            </span>
          </div>
        )}

        {/* Sport-Kurzinfo */}
        {primarySport && getSportShortInfo(primarySport) && (
          <p className="text-[10px] text-[#71717A] mb-2 truncate">
            {getSportShortInfo(primarySport)}
          </p>
        )}

        {/* Sparring-Banner (Tennis) */}
        {showSparring && (
          <div className="bg-green-50 border border-green-100 rounded-lg px-2 py-1.5 mb-2">
            <p className="text-[10px] font-semibold text-green-700 mb-1">
              Sucht Sparring-Partner
            </p>
            <button
              onClick={() => onSparring(user.id)}
              className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded-md transition-colors"
            >
              <Swords size={10} />
              Anfrage senden
            </button>
          </div>
        )}

        {/* Follow-Button */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[10px] text-[#A1A1AA]">
            {user.followerCount} Follower
          </span>
          <FollowButton
            isFollowing={user.isFollowedByMe}
            isLoading={followLoading === user.id}
            onToggle={() => onFollow(user.id, user.username ?? '')}
            color={sportColor}
          />
        </div>
      </div>
    </motion.div>
  )
}

// ── Trending Post Card ─────────────────────────────────────────────

function TrendingCard({ post }: { post: TrendingPost }) {
  return (
    <Link
      href={`/community#${post.id}`}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
    >
      <div
        className="w-1.5 h-full min-h-[40px] rounded-full flex-shrink-0"
        style={{ backgroundColor: post.sport.colorPrimary }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/80 leading-tight line-clamp-2 group-hover:text-white transition-colors">
          {post.title ?? post.content}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-medium"
            style={{ color: post.sport.colorPrimary }}
          >
            {post.sport.name}
          </span>
          <span className="text-[10px] text-white/30">
            {formatRelativeTime(post.createdAt)}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="flex items-center gap-0.5 text-[10px] text-white/40">
              <Heart size={9} />
              {post.likeCount}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-white/40">
              <MessageCircle size={9} />
              {post.commentCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Leaderboard Entry ─────────────────────────────────────────────

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const rankColors: Record<number, string> = {
    1: '#FBBF24',
    2: '#9CA3AF',
    3: '#CD7F32',
  }
  const rankColor = rankColors[entry.rank] ?? '#71717A'

  return (
    <Link
      href={`/profil/${entry.username ?? ''}`}
      className="flex items-center gap-2.5 py-2 hover:bg-white/5 rounded-lg px-1 transition-colors"
    >
      <span
        className="text-xs font-bold tabular-nums w-4 flex-shrink-0"
        style={{ color: rankColor }}
      >
        {entry.rank}
      </span>
      <div className="flex-shrink-0">
        {entry.image ? (
          <div className="relative w-7 h-7 rounded-full overflow-hidden">
            <Image
              src={entry.image}
              alt={entry.name ?? 'Avatar'}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: entry.sport?.colorPrimary ?? '#16A34A' }}
          >
            {getInitials(entry.name)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/80 truncate">
          {entry.name ?? 'Unbekannt'}
        </p>
        {entry.sport && (
          <span
            className="text-[10px] font-medium"
            style={{ color: entry.sport.colorPrimary }}
          >
            {entry.sport.name}
          </span>
        )}
      </div>
      <div className="flex flex-col items-end flex-shrink-0">
        <span className="text-xs font-bold text-white/70 tabular-nums">
          {entry.xp.toLocaleString('de-DE')} XP
        </span>
        {entry.weeklyXP > 0 && (
          <span className="text-[10px] text-green-400 flex items-center gap-0.5">
            <TrendingUp size={9} />
            +{entry.weeklyXP}
          </span>
        )}
      </div>
    </Link>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────

type TabId = 'nearby' | 'same_sport' | 'similar_level'

const TABS: { id: TabId; label: string }[] = [
  { id: 'nearby', label: 'In deiner Nähe' },
  { id: 'same_sport', label: 'Gleiche Sportart' },
  { id: 'similar_level', label: 'Ähnliches Niveau' },
]

export function EntdeckenClient({
  nearby,
  sameSport,
  similarLevel,
  trendingPosts,
  leaderboard,
  currentUserId,
}: EntdeckenClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('nearby')

  // Follow-State: Map userId → isFollowing
  const [followMap, setFollowMap] = useState<Map<string, boolean>>(() => {
    const map = new Map<string, boolean>()
    for (const u of [...nearby, ...sameSport, ...similarLevel]) {
      map.set(u.id, u.isFollowedByMe)
    }
    return map
  })
  const [followLoading, setFollowLoading] = useState<string | null>(null)

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  })

  const showToast = useCallback(
    (message: string, type: ToastState['type'] = 'info') => {
      setToast({ visible: true, message, type })
    },
    [],
  )
  const hideToast = useCallback(
    () => setToast((t) => ({ ...t, visible: false })),
    [],
  )

  // ── Follow Toggle ──────────────────────────────────────────────
  const handleFollow = useCallback(
    async (userId: string, username: string) => {
      if (!username || followLoading === userId) return
      setFollowLoading(userId)

      const wasFollowing = followMap.get(userId) ?? false
      setFollowMap((prev) => new Map(prev).set(userId, !wasFollowing))

      try {
        const res = await fetch(`/api/users/${username}/follow`, {
          method: 'POST',
        })
        if (!res.ok) throw new Error()
        const data = (await res.json()) as { isFollowing: boolean }
        setFollowMap((prev) => new Map(prev).set(userId, data.isFollowing))
      } catch {
        setFollowMap((prev) => new Map(prev).set(userId, wasFollowing))
        showToast('Aktion fehlgeschlagen', 'error')
      }
      setFollowLoading(null)
    },
    [followLoading, followMap, showToast],
  )

  // ── Sparring-Anfrage ───────────────────────────────────────────
  const handleSparring = useCallback(
    async (targetUserId: string) => {
      try {
        const res = await fetch('/api/sparring/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId }),
        })
        if (!res.ok) throw new Error()
        showToast('Sparring-Anfrage gesendet!', 'success')
      } catch {
        showToast('Anfrage fehlgeschlagen', 'error')
      }
    },
    [showToast],
  )

  // Aktuelle Tab-User
  const currentUsers: EntdeckenUser[] = (() => {
    const raw =
      activeTab === 'nearby'
        ? nearby
        : activeTab === 'same_sport'
          ? sameSport
          : similarLevel

    // Follow-Status aus live followMap übernehmen
    return raw.map((u) => ({
      ...u,
      isFollowedByMe: followMap.get(u.id) ?? u.isFollowedByMe,
    }))
  })()

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Entdecken</h1>
          <p className="text-sm text-white/50">
            Sportler in Hessen kennenlernen
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/30">
            <MapPin size={11} />
            <span>Aktuell: Hessen · Bald deutschlandweit</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* ── Linke Spalte: Tabs + User-Grid ──────────────────── */}
          <div>
            {/* Tab-Bar */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={
                    activeTab === tab.id
                      ? { backgroundColor: '#0A0A0A', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
                      : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* User-Grid */}
            {currentUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Star size={24} className="text-white/20" />
                </div>
                <p className="text-sm text-white/40">
                  {activeTab === 'nearby'
                    ? 'Keine Sportler in deiner Region gefunden'
                    : activeTab === 'same_sport'
                      ? 'Keine Sportler mit gleicher Sportart gefunden'
                      : 'Keine Sportler mit ähnlichem Niveau gefunden'}
                </p>
                <p className="text-xs text-white/25 mt-1">
                  Vervollständige dein Profil für bessere Empfehlungen
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {currentUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onFollow={handleFollow}
                      onSparring={handleSparring}
                      followLoading={followLoading}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── Rechte Spalte: Trending + Leaderboard ────────────── */}
          <div className="space-y-4">

            {/* KI-Hinweis */}
            <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-2">
              <p className="text-xs text-white/25 leading-relaxed">
                Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
              </p>
            </div>

            {/* Trending Posts */}
            {trendingPosts.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                  <TrendingUp size={13} className="text-white/60" />
                  <h3 className="text-sm font-semibold text-white/80">
                    Trending diese Woche
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {trendingPosts.map((post) => (
                    <TrendingCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <Trophy size={13} className="text-yellow-400" />
                    <h3 className="text-sm font-semibold text-white/80">
                      Top Sportler
                    </h3>
                  </div>
                  <Link
                    href="/leaderboard"
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    Alle →
                  </Link>
                </div>
                <div className="px-3 py-2 divide-y divide-white/5">
                  {leaderboard.map((entry) => (
                    <LeaderboardRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast state={toast} onClose={hideToast} />
    </div>
  )
}
