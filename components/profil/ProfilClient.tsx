'use client'

// ─────────────────────────────────────────────────────────────────
// ProfilClient.tsx – Öffentliches Profil Client-Komponente
// Hero (dunkel, sport-spez. Gradient) → Info-Bereich (weiß) →
// Badge-Showcase → Post-Grid
// Follower-Modal + Post-Detail-Modal als inline Radix Dialogs
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Flame,
  MapPin,
  Trophy,
  Heart,
  MessageCircle,
  X,
  Loader2,
  Star,
  Shield,
  Zap,
  AlertCircle,
  ChevronRight,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Grid3x3,
  Award,
} from 'lucide-react'
import type {
  ProfilUser,
  ProfilPost,
  ProfilBadge,
  FollowUser,
} from '@/lib/types/profil'

// ── Props ─────────────────────────────────────────────────────────

interface ProfilClientProps {
  user: ProfilUser
  posts: ProfilPost[]
  isOwnProfile: boolean
  isFollowingThisUser: boolean
  currentUserId: string | null
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

const LEVEL_LABELS: Record<string, string> = {
  ANFAENGER: 'Anfänger',
  FORTGESCHRITTENE: 'Fortgeschrittene',
  WETTKAMPF: 'Wettkampf',
  PROFI: 'Profi',
}

// Sport-Gradienten für den Hero-Bereich
const HERO_GRADIENTS: Record<string, string> = {
  fussball:
    'linear-gradient(135deg, #0A0A0A 0%, #0f1f0f 50%, #0A0A0A 100%)',
  tennis:
    'linear-gradient(135deg, #1A1208 0%, #2D1E0A 50%, #1A1208 100%)',
  basketball:
    'linear-gradient(135deg, #0A0500 0%, #1A0F00 50%, #0A0500 100%)',
}

// Rarity-Styles
const RARITY_STYLES: Record<
  string,
  { border: string; bg: string; text: string; label: string }
> = {
  COMMON: {
    border: 'border-[#9CA3AF]',
    bg: 'bg-[#F9FAFB]',
    text: 'text-[#6B7280]',
    label: 'Gewöhnlich',
  },
  RARE: {
    border: 'border-[#3B82F6]',
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#2563EB]',
    label: 'Selten',
  },
  EPIC: {
    border: 'border-[#8B5CF6]',
    bg: 'bg-[#F5F3FF]',
    text: 'text-[#7C3AED]',
    label: 'Episch',
  },
  LEGENDARY: {
    border: 'border-[#F59E0B]',
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#D97706]',
    label: 'Legendär',
  },
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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium"
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

// ── Lucide-Icon dynamisch nach Name ──────────────────────────────

function BadgeIcon({ name, size = 24 }: { name: string; size?: number }) {
  // Fallback: generisches Award-Icon für unbekannte Namen
  switch (name) {
    case 'Trophy':
      return <Trophy size={size} />
    case 'Star':
      return <Star size={size} />
    case 'Shield':
      return <Shield size={size} />
    case 'Zap':
      return <Zap size={size} />
    case 'Flame':
      return <Flame size={size} />
    default:
      return <Award size={size} />
  }
}

// ── Follow-User-Liste (für Modal) ─────────────────────────────────

function FollowUserItem({ user }: { user: FollowUser }) {
  return (
    <Link
      href={`/profil/${user.username ?? ''}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F9FAFB] transition-colors group"
    >
      <div className="flex-shrink-0">
        {user.image ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={user.image}
              alt={user.name ?? 'Avatar'}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{
              backgroundColor:
                user.sports[0]?.colorPrimary ?? '#16A34A',
            }}
          >
            {getInitials(user.name)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0A0A0A] truncate">
          {user.name ?? 'Unbekannt'}
        </p>
        {user.username && (
          <p className="text-xs text-[#71717A]">@{user.username}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: `${getLevelColor(user.level)}20`,
            color: getLevelColor(user.level),
          }}
        >
          Lv.{user.level}
        </span>
        <ChevronRight
          size={14}
          className="text-[#D4D4D8] group-hover:text-[#71717A] transition-colors"
        />
      </div>
    </Link>
  )
}

// ── Post-Grid-Karte ────────────────────────────────────────────────

function PostGridCard({
  post,
  onClick,
}: {
  post: ProfilPost
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-xl overflow-hidden group bg-[#F4F4F5] border border-[#E4E4E7]"
    >
      {post.mediaUrl && post.mediaType !== 'video' ? (
        <Image
          src={post.mediaUrl}
          alt={post.title ?? 'Post'}
          fill
          className="object-cover"
        />
      ) : (
        // Text-Gradient-Card
        <div
          className="absolute inset-0 flex items-end p-2"
          style={{
            background: `linear-gradient(135deg, ${post.sport.colorPrimary}25, ${post.sport.colorPrimary}10)`,
          }}
        >
          <p className="text-xs text-[#3F3F46] leading-tight line-clamp-3 text-left">
            {post.content}
          </p>
        </div>
      )}

      {/* Hover-Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center gap-3 text-white">
          <span className="flex items-center gap-1 text-sm font-semibold">
            <Heart size={14} className="fill-white" />
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            <MessageCircle size={14} />
            {post.commentCount}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────

export function ProfilClient({
  user,
  posts,
  isOwnProfile,
  isFollowingThisUser,
  currentUserId,
}: ProfilClientProps) {
  const router = useRouter()
  const primarySport = user.sports[0]?.sport
  const heroGradient =
    HERO_GRADIENTS[primarySport?.slug ?? ''] ?? 'linear-gradient(135deg, #0A0A0A, #111)'
  const levelColor = getLevelColor(user.level)

  // ── Follow-State ──────────────────────────────────────────────
  const [isFollowing, setIsFollowing] = useState(isFollowingThisUser)
  const [followerCount, setFollowerCount] = useState(user.followerCount)
  const [isFollowLoading, setIsFollowLoading] = useState(false)

  // ── Modal-State ───────────────────────────────────────────────
  const [followModalType, setFollowModalType] = useState<
    'followers' | 'following' | null
  >(null)
  const [followModalUsers, setFollowModalUsers] = useState<FollowUser[]>([])
  const [followModalLoading, setFollowModalLoading] = useState(false)

  const [selectedPost, setSelectedPost] = useState<ProfilPost | null>(null)

  // ── Toast ─────────────────────────────────────────────────────
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

  // ── Follow Toggle ─────────────────────────────────────────────
  const handleFollow = useCallback(async () => {
    if (!currentUserId || !user.username || isFollowLoading) return
    setIsFollowLoading(true)

    // Optimistic
    const newFollowing = !isFollowing
    setIsFollowing(newFollowing)
    setFollowerCount((c) => c + (newFollowing ? 1 : -1))

    try {
      const res = await fetch(`/api/users/${user.username}/follow`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as {
        isFollowing: boolean
        followerCount: number
      }
      setIsFollowing(data.isFollowing)
      setFollowerCount(data.followerCount)
    } catch {
      // Rollback
      setIsFollowing(!newFollowing)
      setFollowerCount((c) => c + (newFollowing ? -1 : 1))
      showToast('Aktion fehlgeschlagen', 'error')
    }
    setIsFollowLoading(false)
  }, [currentUserId, user.username, isFollowing, isFollowLoading, showToast])

  // ── Follower / Following Modal öffnen ─────────────────────────
  const openFollowModal = useCallback(
    async (type: 'followers' | 'following') => {
      setFollowModalType(type)
      setFollowModalUsers([])
      setFollowModalLoading(true)

      try {
        const res = await fetch(`/api/users/${user.username}/${type}`)
        if (!res.ok) throw new Error()
        const data = (await res.json()) as { users: FollowUser[] }
        setFollowModalUsers(data.users)
      } catch {
        showToast('Liste konnte nicht geladen werden', 'error')
      }
      setFollowModalLoading(false)
    },
    [user.username, showToast],
  )

  // ── Nachrichten-Button ────────────────────────────────────────
  const handleMessage = useCallback(() => {
    showToast('DMs kommen bald!', 'info')
  }, [showToast])

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── Hero (dunkel, 220px) ──────────────────────────────────── */}
      <div
        className="relative w-full"
        style={{ height: 220, background: heroGradient }}
        data-sport={primarySport?.slug}
      >
        {/* Sport-Glow */}
        {primarySport && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${primarySport.colorPrimary}80 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Navigation zurück */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs transition-all backdrop-blur-sm"
          >
            ← Zurück
          </button>
        </div>
      </div>

      {/* ── Info-Bereich (hell, weiß) ─────────────────────────────── */}
      <div className="bg-white relative -mt-12 rounded-t-3xl shadow-2xl">
        <div className="max-w-2xl mx-auto px-5 pb-6">
          {/* ── Avatar (halb herausragend) ───────────────────────── */}
          <div className="flex items-end justify-between -mt-11 mb-4">
            <div className="relative">
              {user.image ? (
                <div
                  className="relative w-[88px] h-[88px] rounded-full overflow-hidden border-4 border-white shadow-xl"
                >
                  <Image
                    src={user.image}
                    alt={user.name ?? 'Avatar'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-[88px] h-[88px] rounded-full border-4 border-white shadow-xl flex items-center justify-center text-2xl font-bold text-white"
                  style={{
                    backgroundColor:
                      primarySport?.colorPrimary ?? '#16A34A',
                  }}
                >
                  {getInitials(user.name)}
                </div>
              )}
            </div>

            {/* Aktions-Buttons */}
            <div className="flex items-center gap-2 pb-1">
              {isOwnProfile ? (
                <>
                  <Link
                    href="/dashboard/profil"
                    className="px-4 py-2 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#3F3F46] hover:bg-[#F4F4F5] transition-all"
                  >
                    Profil bearbeiten
                  </Link>
                  <Link
                    href="/dashboard/training"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                    style={{ backgroundColor: primarySport?.colorPrimary ?? '#16A34A' }}
                  >
                    Trainingsplan
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading || !currentUserId}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                    style={
                      isFollowing
                        ? {
                            backgroundColor: '#F4F4F5',
                            color: '#3F3F46',
                            border: '1px solid #E4E4E7',
                          }
                        : {
                            backgroundColor:
                              primarySport?.colorPrimary ?? '#16A34A',
                            color: '#fff',
                          }
                    }
                  >
                    {isFollowLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck size={14} />
                        Folge ich
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} />
                        Folgen
                      </>
                    )}
                  </button>

                  {isFollowing && (
                    <button
                      onClick={handleMessage}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#3F3F46] hover:bg-[#F4F4F5] transition-all"
                    >
                      <MessageSquare size={14} />
                      Nachricht
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Name + Streak + Level ────────────────────────────── */}
          <div className="mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#0A0A0A]">
                {user.name ?? 'Unbekannt'}
              </h1>
              {user.streakDays > 0 && (
                <span className="flex items-center gap-0.5 text-sm font-semibold text-orange-500">
                  <Flame size={14} className="fill-orange-500" />
                  {user.streakDays}
                </span>
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  backgroundColor: `${levelColor}20`,
                  color: levelColor,
                }}
              >
                Level {user.level}
              </span>
            </div>
            {user.username && (
              <p className="text-sm text-[#71717A] mt-0.5">
                @{user.username}
              </p>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-[#52525B] leading-relaxed mb-3">
              {user.bio}
            </p>
          )}

          {/* Standort */}
          {(user.city ?? user.state) && (
            <div className="flex items-center gap-1 text-xs text-[#71717A] mb-3">
              <MapPin size={12} />
              <span>
                {user.city
                  ? `${user.city}${user.state ? `, ${STATE_LABELS[user.state] ?? user.state}` : ''}`
                  : user.state
                    ? STATE_LABELS[user.state] ?? user.state
                    : ''}
              </span>
            </div>
          )}

          {/* ── Stats-Reihe ────────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-4 py-3 border-y border-[#F4F4F5]">
            <button
              onClick={() => openFollowModal('followers')}
              className="text-center hover:opacity-70 transition-opacity"
            >
              <div className="text-base font-bold text-[#0A0A0A]">
                {followerCount}
              </div>
              <div className="text-xs text-[#71717A]">Follower</div>
            </button>
            <button
              onClick={() => openFollowModal('following')}
              className="text-center hover:opacity-70 transition-opacity"
            >
              <div className="text-base font-bold text-[#0A0A0A]">
                {user.followingCount}
              </div>
              <div className="text-xs text-[#71717A]">Following</div>
            </button>
            <div className="text-center">
              <div className="text-base font-bold text-[#0A0A0A]">
                {user.postCount}
              </div>
              <div className="text-xs text-[#71717A]">Posts</div>
            </div>
          </div>

          {/* ── Sport-Profil-Chips ────────────────────────────────── */}
          {user.sports.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {user.sports.map((us) => (
                <span
                  key={us.id}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border"
                  style={{
                    backgroundColor: `${us.sport.colorPrimary}12`,
                    color: us.sport.colorPrimary,
                    borderColor: `${us.sport.colorPrimary}30`,
                  }}
                >
                  {us.sport.name}
                  <span className="text-[10px] opacity-70">
                    {LEVEL_LABELS[us.level] ?? us.level}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Abzeichen-Showcase ───────────────────────────────────── */}
        {user.topBadges.length > 0 && (
          <div className="bg-[#F9FAFB] border-t border-[#E4E4E7] px-5 py-5">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#0A0A0A] flex items-center gap-1.5">
                  <Trophy size={14} className="text-yellow-500" />
                  Abzeichen
                </h2>
                <Link
                  href={`/profil/${user.username}/abzeichen`}
                  className="text-xs text-[#71717A] hover:text-[#3F3F46] transition-colors flex items-center gap-1"
                >
                  Alle ansehen
                  <ChevronRight size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {user.topBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} compact />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Post-Grid ─────────────────────────────────────────────── */}
        <div className="border-t border-[#E4E4E7] px-5 py-5">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-1.5 mb-3">
              <Grid3x3 size={14} className="text-[#71717A]" />
              <h2 className="text-sm font-semibold text-[#0A0A0A]">Posts</h2>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-10 text-[#A1A1AA] text-sm">
                Noch keine Posts
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {posts.map((post) => (
                  <PostGridCard
                    key={post.id}
                    post={post}
                    onClick={() => setSelectedPost(post)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Follower/Following Modal ──────────────────────────────── */}
      <Dialog.Root
        open={followModalType !== null}
        onOpenChange={(open) => {
          if (!open) setFollowModalType(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F4F4F5]">
              <Dialog.Title className="text-base font-semibold text-[#0A0A0A]">
                {followModalType === 'followers' ? 'Follower' : 'Folgt'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors text-[#A1A1AA]">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            <div className="max-h-80 overflow-y-auto px-2 py-2">
              {followModalLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-[#D4D4D8]" />
                </div>
              ) : followModalUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#A1A1AA]">
                  Noch niemand hier
                </div>
              ) : (
                followModalUsers.map((u) => (
                  <FollowUserItem key={u.id} user={u} />
                ))
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Post-Detail-Modal ──────────────────────────────────────── */}
      <Dialog.Root
        open={selectedPost !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPost(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F4F4F5] flex-shrink-0">
              <div className="flex items-center gap-2">
                {selectedPost && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${selectedPost.sport.colorPrimary}15`,
                      color: selectedPost.sport.colorPrimary,
                    }}
                  >
                    {selectedPost.sport.name}
                  </span>
                )}
                <Dialog.Title className="text-sm font-semibold text-[#0A0A0A]">
                  {selectedPost?.title ?? 'Post'}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors text-[#A1A1AA]">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {selectedPost && (
                <>
                  {selectedPost.mediaUrl && selectedPost.mediaType !== 'video' && (
                    <div
                      className="relative w-full rounded-xl overflow-hidden mb-4"
                      style={{ aspectRatio: '4/3' }}
                    >
                      <Image
                        src={selectedPost.mediaUrl}
                        alt="Post-Bild"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p className="text-sm text-[#3F3F46] leading-relaxed whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F4F4F5]">
                    <span className="flex items-center gap-1.5 text-sm text-[#71717A]">
                      <Heart size={14} />
                      {selectedPost.likeCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-[#71717A]">
                      <MessageCircle size={14} />
                      {selectedPost.commentCount}
                    </span>
                    <Link
                      href={`/community#${selectedPost.id}`}
                      className="ml-auto text-xs text-[#71717A] hover:text-[#3F3F46] transition-colors flex items-center gap-1"
                    >
                      Im Feed ansehen
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Toast */}
      <Toast state={toast} onClose={hideToast} />
    </div>
  )
}

// ── Badge-Card (kompakte Variante für Showcase) ───────────────────

function BadgeCard({
  badge,
  compact = false,
}: {
  badge: ProfilBadge
  compact?: boolean
}) {
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.COMMON

  if (compact) {
    return (
      <div
        className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${style.border} ${style.bg}`}
        title={badge.name}
      >
        <div className={`${style.text}`}>
          <BadgeIcon name={badge.iconName} size={20} />
        </div>
        <p className="text-[9px] text-center text-[#3F3F46] leading-tight line-clamp-2 font-medium">
          {badge.name}
        </p>
        {badge.rarity === 'LEGENDARY' && (
          <div className="w-full h-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600" />
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${style.border} ${style.bg}`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${style.text} flex-shrink-0`}
        style={{ backgroundColor: `${style.text}15` }}
      >
        <BadgeIcon name={badge.iconName} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0A0A0A] truncate">
          {badge.name}
        </p>
        <p className="text-xs text-[#71717A] truncate">{badge.description}</p>
      </div>
    </div>
  )
}

// Re-Export für AbzeichenClient
export { BadgeCard, BadgeIcon, RARITY_STYLES, getLevelColor, getInitials }

// Unfollow-Button-Variante (hover → "Entfolgen" anzeigen)
export function FollowButtonWithHover({
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
      style={
        isFollowing
          ? hovered
            ? {
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FECACA',
              }
            : {
                backgroundColor: '#F4F4F5',
                color: '#3F3F46',
                border: '1px solid #E4E4E7',
              }
          : { backgroundColor: color, color: '#fff' }
      }
    >
      {isLoading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isFollowing ? (
        hovered ? (
          <>
            <UserX size={12} />
            Entfolgen
          </>
        ) : (
          <>
            <UserCheck size={12} />
            Folge ich
          </>
        )
      ) : (
        <>
          <UserPlus size={12} />
          Folgen
        </>
      )}
    </button>
  )
}
