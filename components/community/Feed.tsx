'use client'

// ─────────────────────────────────────────────────────────────────
// Feed.tsx – Community-Feed Haupt-Layout
// 3 Spalten: Links (User-Info + Filter), Mitte (Posts), Rechts (Turniere)
// Infinite Scroll via IntersectionObserver
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Loader2, AlertCircle, Trophy, Calendar, Users } from 'lucide-react'
import { PostComposer } from './PostComposer'
import { PostCard } from './PostCard'

// ── Typen ────────────────────────────────────────────────────────

export interface FeedPost {
  id: string
  content: string
  title: string | null
  type: string
  mediaUrl: string | null
  mediaType: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    level: number
  }
  sport: {
    id: string
    name: string
    slug: string
    colorPrimary: string
  }
  likeCount: number
  commentCount: number
  isLikedByMe: boolean
}

interface Sport {
  id: string
  name: string
  slug: string
  colorPrimary: string
}

interface Tournament {
  id: string
  name: string
  city: string
  state: string
  startDate: string
  level: string
  sport: {
    name: string
    slug: string
    colorPrimary: string
  }
}

interface CurrentUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  xp: number
  state: string | null
  city: string | null
  postCount: number
  followerCount: number
  followingCount: number
  sports: Sport[]
}

interface FeedProps {
  currentUser: CurrentUser
  initialPosts: FeedPost[]
  initialNextCursor: string | null
  initialHasMore: boolean
  sports: Sport[]
  tournaments: Tournament[]
}

// ── Feed-Filter-Optionen ─────────────────────────────────────────

const TYPE_FILTERS = [
  { label: 'Alle',             value: null },
  { label: 'Training-Updates', value: 'TRAINING_UPDATE' },
  { label: 'Tipps',            value: 'TIP' },
  { label: 'Fragen',           value: 'QUESTION' },
] as const

type TypeFilter = typeof TYPE_FILTERS[number]['value']

// ── Level-Badge-Farbe ────────────────────────────────────────────

function getLevelColor(level: number): string {
  if (level >= 20) return '#FBBF24'
  if (level >= 10) return '#A78BFA'
  if (level >= 5)  return '#60A5FA'
  return '#34D399'
}

// ── State-Label ───────────────────────────────────────────────────

const STATE_LABELS: Record<string, string> = {
  HESSEN: 'Hessen', BAYERN: 'Bayern', BERLIN: 'Berlin',
  NORDRHEIN_WESTFALEN: 'NRW', HAMBURG: 'Hamburg',
  SACHSEN: 'Sachsen', THUERINGEN: 'Thüringen',
  NIEDERSACHSEN: 'Niedersachsen', Baden_WUERTTEMBERG: 'Baden-Württemberg',
  RHEINLAND_PFALZ: 'Rheinland-Pfalz', SACHSEN_ANHALT: 'Sachsen-Anhalt',
  SAARLAND: 'Saarland', BREMEN: 'Bremen', MECKLENBURG_VORPOMMERN: 'Mecklenburg-Vorpommern',
  SCHLESWIG_HOLSTEIN: 'Schleswig-Holstein', BRANDENBURG: 'Brandenburg',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const LEVEL_LABELS: Record<string, string> = {
  ANFAENGER: 'Anfänger', FORTGESCHRITTENE: 'Fortgeschrittene',
  WETTKAMPF: 'Wettkampf', PROFI: 'Profi',
}

// ── Skeleton-Card ────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-9 h-9 rounded-full shimmer-bg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 shimmer-bg rounded w-32" />
          <div className="h-2 shimmer-bg rounded w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 shimmer-bg rounded w-full" />
        <div className="h-3 shimmer-bg rounded w-4/5" />
        <div className="h-3 shimmer-bg rounded w-3/5" />
      </div>
      <div className="flex gap-3 mt-4 pt-3 border-t border-white/5">
        <div className="h-6 shimmer-bg rounded-lg w-12" />
        <div className="h-6 shimmer-bg rounded-lg w-12" />
      </div>
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────────────

interface ToastState {
  visible: boolean
  message: string
  type: 'error' | 'success'
}

function Toast({ state, onClose }: { state: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (!state.visible) return
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [state.visible, onClose])

  return (
    <AnimatePresence>
      {state.visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium"
          style={{
            backgroundColor: state.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
            borderColor: state.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)',
            color: state.type === 'error' ? '#FCA5A5' : '#6EE7B7',
          }}
        >
          <AlertCircle size={14} />
          {state.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────

export function Feed({
  currentUser,
  initialPosts,
  initialNextCursor,
  initialHasMore,
  sports,
  tournaments,
}: FeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [activeSportSlug, setActiveSportSlug] = useState<string | null>(null)
  const [activeTypeFilter, setActiveTypeFilter] = useState<TypeFilter>(null)
  const [isFiltering, setIsFiltering] = useState(false)

  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'error' })
  const sentinelRef = useRef<HTMLDivElement>(null)

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToast({ visible: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }))
  }, [])

  // ── Filter-Änderung ───────────────────────────────────────────

  const applyFilter = useCallback(
    async (sportSlug: string | null, typeFilter: TypeFilter) => {
      setIsFiltering(true)
      const params = new URLSearchParams()
      if (sportSlug) params.set('sport', sportSlug)
      if (typeFilter) params.set('type', typeFilter)

      try {
        const res = await fetch(`/api/posts?${params.toString()}`)
        if (!res.ok) throw new Error()
        const data = await res.json() as { posts: FeedPost[]; nextCursor: string | null; hasMore: boolean }
        setPosts(data.posts)
        setNextCursor(data.nextCursor)
        setHasMore(data.hasMore)
      } catch {
        showToast('Feed konnte nicht geladen werden')
      }
      setIsFiltering(false)
    },
    [showToast]
  )

  const handleSportFilter = useCallback(
    (slug: string | null) => {
      setActiveSportSlug(slug)
      void applyFilter(slug, activeTypeFilter)
    },
    [activeTypeFilter, applyFilter]
  )

  const handleTypeFilter = useCallback(
    (type: TypeFilter) => {
      setActiveTypeFilter(type)
      void applyFilter(activeSportSlug, type)
    },
    [activeSportSlug, applyFilter]
  )

  // ── Infinite Scroll ───────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursor) return
    setIsLoadingMore(true)

    const params = new URLSearchParams({ cursor: nextCursor })
    if (activeSportSlug) params.set('sport', activeSportSlug)
    if (activeTypeFilter) params.set('type', activeTypeFilter)

    try {
      const res = await fetch(`/api/posts?${params.toString()}`)
      if (!res.ok) throw new Error()
      const data = await res.json() as { posts: FeedPost[]; nextCursor: string | null; hasMore: boolean }
      setPosts((prev) => [...prev, ...data.posts])
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch {
      showToast('Weitere Posts konnten nicht geladen werden')
    }
    setIsLoadingMore(false)
  }, [isLoadingMore, hasMore, nextCursor, activeSportSlug, activeTypeFilter, showToast])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  // ── Optimistic Post-Erstellung ────────────────────────────────

  const handlePostCreated = useCallback((post: FeedPost) => {
    setPosts((prev) => [post, ...prev])
    showToast('Post erstellt! +50 XP', 'success')
  }, [showToast])

  // ── Post-Update / Delete ──────────────────────────────────────

  const handlePostDelete = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }, [])

  const handlePostUpdate = useCallback((postId: string, content: string) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, content, updatedAt: new Date().toISOString() } : p)
    )
  }, [])

  // ── Primär-Sport des Users ────────────────────────────────────
  const primarySport = currentUser.sports[0]
  const levelColor = getLevelColor(currentUser.level)

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[22%_54%_24%] gap-6 items-start">

          {/* ═══════════════════════════════════════════════════════════
              LINKE SPALTE – User-Info + Filter
          ═══════════════════════════════════════════════════════════ */}
          <div className="hidden lg:block space-y-4 lg:sticky lg:top-6">
            {/* User-Info-Panel */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* Deckfarbe */}
              <div
                className="h-16 w-full"
                style={{
                  background: primarySport
                    ? `linear-gradient(135deg, ${primarySport.colorPrimary}40, ${primarySport.colorPrimary}15)`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)',
                }}
              />

              <div className="px-4 pb-4 -mt-7">
                {/* Avatar – ragt aus Header heraus */}
                <div className="mb-3">
                  {currentUser.image ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden ring-3 ring-[#0A0A0A] border-2 border-white/15">
                      <Image src={currentUser.image} alt={currentUser.name ?? ''} fill className="object-cover" />
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full ring-3 ring-[#0A0A0A] border-2 border-white/15 flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: primarySport?.colorPrimary ?? '#16A34A' }}
                    >
                      {currentUser.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {currentUser.name ?? 'Dein Profil'}
                    </h3>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: `${levelColor}20`, color: levelColor }}
                    >
                      Lv.{currentUser.level}
                    </span>
                  </div>
                  {currentUser.username && (
                    <p className="text-xs text-white/40 mt-0.5">@{currentUser.username}</p>
                  )}
                  {(currentUser.city ?? currentUser.state) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-white/30">
                      <MapPin size={10} />
                      <span>
                        {currentUser.city
                          ? currentUser.city
                          : currentUser.state
                          ? STATE_LABELS[currentUser.state] ?? currentUser.state
                          : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-white/10">
                  {[
                    { label: 'Posts',     value: currentUser.postCount },
                    { label: 'Follower',  value: currentUser.followerCount },
                    { label: 'Following', value: currentUser.followingCount },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-sm font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-white/30">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Aktive Sportarten */}
                {currentUser.sports.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {currentUser.sports.map((sport) => (
                      <span
                        key={sport.id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${sport.colorPrimary}20`, color: sport.colorPrimary }}
                      >
                        {sport.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Region-Hinweis */}
                <p className="text-xs text-white/25 mt-3 leading-relaxed">
                  Jetzt in Hessen · Bald deutschlandweit
                </p>
              </div>
            </div>

            {/* Sport-Filter-Tabs */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <p className="text-xs text-white/40 font-medium mb-2 px-1">Sportart</p>
              <div className="space-y-1">
                <button
                  onClick={() => handleSportFilter(null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeSportSlug === null
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  Alle Sportarten
                </button>
                {sports.map((sport) => (
                  <button
                    key={sport.slug}
                    onClick={() => handleSportFilter(sport.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                      activeSportSlug === sport.slug
                        ? 'bg-white/15 text-white'
                        : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sport.colorPrimary }}
                    />
                    {sport.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              MITTLERE SPALTE – PostComposer + Feed
          ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-4 min-w-0">
            {/* PostComposer */}
            <PostComposer
              currentUser={currentUser}
              sports={sports}
              onPostCreated={handlePostCreated}
              onError={(msg) => showToast(msg)}
            />

            {/* Post-Typ-Filter (horizontal scroll) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={String(filter.value)}
                  onClick={() => handleTypeFilter(filter.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    activeTypeFilter === filter.value
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/50 hover:text-white/70 hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Feed-Inhalt */}
            {isFiltering ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-white/20" />
                </div>
                <p className="text-sm text-white/40">Noch keine Posts.</p>
                <p className="text-xs text-white/25 mt-1">Sei der Erste, der etwas teilt!</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser.id}
                    onDelete={handlePostDelete}
                    onUpdate={handlePostUpdate}
                  />
                ))}
              </AnimatePresence>
            )}

            {/* Load-More Sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {/* Loading-Indikator */}
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-white/30" />
              </div>
            )}

            {/* Ende des Feeds */}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-xs text-white/25 py-4">
                Alle Posts geladen
              </p>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              RECHTE SPALTE – Upcoming Tournaments
          ═══════════════════════════════════════════════════════════ */}
          <div className="hidden lg:block space-y-4 lg:sticky lg:top-6">
            {/* KI-Hinweis */}
            <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-2">
              <p className="text-xs text-white/25 leading-relaxed">
                Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
              </p>
            </div>

            {/* Bevorstehende Turniere */}
            {tournaments.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={14} className="text-yellow-400" />
                  <h3 className="text-sm font-semibold text-white">Bevorstehende Turniere</h3>
                </div>
                <div className="space-y-3">
                  {tournaments.map((t) => (
                    <div key={t.id} className="group">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: t.sport.colorPrimary }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/80 leading-tight truncate">
                            {t.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-white/35">
                            <MapPin size={9} />
                            <span className="truncate">{t.city}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-white/35">
                            <Calendar size={9} />
                            <span>{formatDate(t.startDate)}</span>
                            <span
                              className="ml-1 px-1 py-0.5 rounded text-white/50"
                              style={{ backgroundColor: `${t.sport.colorPrimary}15`, fontSize: '9px' }}
                            >
                              {LEVEL_LABELS[t.level] ?? t.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Toast */}
      <Toast state={toast} onClose={hideToast} />
    </div>
  )
}
