'use client'

// ─────────────────────────────────────────────────────────────────
// BenachrichtigungenClient – Vollständige Benachrichtigungen-Seite
//
// Features:
//   • Filter-Tabs: Alle / Aktivität / Community / Sport / System
//   • Zeitgruppen: Heute / Gestern / Diese Woche / Älter
//   • Optimistic Read: sofort als gelesen markieren im UI,
//     dann PATCH /api/notifications/[id]/read aufrufen
//   • Icon + Farbe je NotificationType
//   • "Alle gelesen" Button
//   • Leerer Zustand mit Icon
//   • Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellOff,
  Award,
  Calendar,
  Flame,
  CheckCircle2,
  UserPlus,
  Heart,
  MessageSquare,
  Zap,
  Swords,
  CheckCheck,
  Activity,
  Users,
  Dumbbell,
  Monitor,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/date'

// ── Typen ─────────────────────────────────────────────────────────

type NotificationKind =
  | 'TOURNAMENT_REMINDER'
  | 'BADGE_EARNED'
  | 'STREAK_WARNING'
  | 'VEREIN_UPDATE'
  | 'SYSTEM'
  | 'NEW_FOLLOWER'
  | 'NEW_LIKE'
  | 'NEW_COMMENT'
  | 'LEVEL_UP'
  | 'VEREIN_CONFIRMED'
  | 'SPARRING_REQUEST'
  | 'SPARRING_ACCEPTED'

interface NotificationItem {
  id: string
  type: NotificationKind
  title: string
  body: string
  isRead: boolean
  createdAt: string
  updatedAt: string
  data: Record<string, unknown> | null
}

type FilterTab = 'alle' | 'aktivitaet' | 'community' | 'sport' | 'system'

interface Props {
  initialNotifications: NotificationItem[]
}

// ── Konfiguration ─────────────────────────────────────────────────

const NOTIF_CONFIG: Record<
  NotificationKind,
  { Icon: LucideIcon; colorClass: string; bgClass: string; label: string }
> = {
  TOURNAMENT_REMINDER: {
    Icon: Calendar,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    label: 'Turnier',
  },
  BADGE_EARNED: {
    Icon: Award,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    label: 'Abzeichen',
  },
  STREAK_WARNING: {
    Icon: Flame,
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-50',
    label: 'Streak',
  },
  VEREIN_UPDATE: {
    Icon: CheckCircle2,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-50',
    label: 'Verein',
  },
  SYSTEM: {
    Icon: Bell,
    colorClass: 'text-gray-500',
    bgClass: 'bg-gray-100',
    label: 'System',
  },
  NEW_FOLLOWER: {
    Icon: UserPlus,
    colorClass: 'text-[#16A34A]',
    bgClass: 'bg-[#DCFCE7]',
    label: 'Follower',
  },
  NEW_LIKE: {
    Icon: Heart,
    colorClass: 'text-[#EF4444]',
    bgClass: 'bg-[#FEE2E2]',
    label: 'Like',
  },
  NEW_COMMENT: {
    Icon: MessageSquare,
    colorClass: 'text-[#3B82F6]',
    bgClass: 'bg-[#DBEAFE]',
    label: 'Kommentar',
  },
  LEVEL_UP: {
    Icon: Zap,
    colorClass: 'text-[#16A34A]',
    bgClass: 'bg-[#DCFCE7]',
    label: 'Level Up',
  },
  VEREIN_CONFIRMED: {
    Icon: CheckCircle2,
    colorClass: 'text-[#16A34A]',
    bgClass: 'bg-[#DCFCE7]',
    label: 'Verein',
  },
  SPARRING_REQUEST: {
    Icon: Swords,
    colorClass: 'text-[#3B82F6]',
    bgClass: 'bg-[#DBEAFE]',
    label: 'Sparring',
  },
  SPARRING_ACCEPTED: {
    Icon: CheckCircle2,
    colorClass: 'text-[#16A34A]',
    bgClass: 'bg-[#DCFCE7]',
    label: 'Sparring',
  },
}

// Welche Typen gehören zu welchem Tab
const TAB_TYPES: Record<FilterTab, NotificationKind[] | null> = {
  alle: null,
  aktivitaet: ['LEVEL_UP', 'BADGE_EARNED', 'STREAK_WARNING'],
  community: ['NEW_FOLLOWER', 'NEW_LIKE', 'NEW_COMMENT'],
  sport: ['TOURNAMENT_REMINDER', 'VEREIN_UPDATE', 'VEREIN_CONFIRMED', 'SPARRING_REQUEST', 'SPARRING_ACCEPTED'],
  system: ['SYSTEM'],
}

const TAB_LABELS: Record<FilterTab, { label: string; Icon: LucideIcon }> = {
  alle: { label: 'Alle', Icon: Bell },
  aktivitaet: { label: 'Aktivität', Icon: Activity },
  community: { label: 'Community', Icon: Users },
  sport: { label: 'Sport', Icon: Dumbbell },
  system: { label: 'System', Icon: Monitor },
}

// ── Hilfsfunktionen ───────────────────────────────────────────────

function getDateGroup(dateStr: string): 'heute' | 'gestern' | 'diese_woche' | 'aelter' {
  const date = new Date(dateStr)
  const now = new Date()

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(todayStart.getDate() - 1)
  const weekStart = new Date(todayStart)
  weekStart.setDate(todayStart.getDate() - 7)

  if (date >= todayStart) return 'heute'
  if (date >= yesterdayStart) return 'gestern'
  if (date >= weekStart) return 'diese_woche'
  return 'aelter'
}

const GROUP_LABELS: Record<string, string> = {
  heute: 'Heute',
  gestern: 'Gestern',
  diese_woche: 'Diese Woche',
  aelter: 'Älter',
}

const GROUP_ORDER = ['heute', 'gestern', 'diese_woche', 'aelter'] as const

// ── Haupt-Komponente ──────────────────────────────────────────────

export function BenachrichtigungenClient({ initialNotifications }: Props): React.JSX.Element {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [activeTab, setActiveTab] = useState<FilterTab>('alle')
  const [markingAll, setMarkingAll] = useState(false)

  // ── Optimistic Single Read ───────────────────────────────────────
  const markOneRead = useCallback(async (id: string): Promise<void> => {
    // Sofort im UI aktualisieren
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )
    // Im Hintergrund persistieren
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      // Silent fail – optimistic update bleibt
    }
  }, [])

  // ── Alle als gelesen ─────────────────────────────────────────────
  const markAllRead = useCallback(async (): Promise<void> => {
    setMarkingAll(true)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
    } catch {
      // Silent fail
    } finally {
      setMarkingAll(false)
    }
  }, [])

  // ── Gefilterte Liste ─────────────────────────────────────────────
  const filtered = useMemo<NotificationItem[]>(() => {
    const allowedTypes = TAB_TYPES[activeTab]
    if (allowedTypes === null) return notifications
    return notifications.filter((n) =>
      (allowedTypes as NotificationKind[]).includes(n.type),
    )
  }, [notifications, activeTab])

  // ── Nach Datum gruppieren ────────────────────────────────────────
  const grouped = useMemo<Map<string, NotificationItem[]>>(() => {
    const map = new Map<string, NotificationItem[]>()
    for (const n of filtered) {
      const group = getDateGroup(n.createdAt)
      const arr = map.get(group) ?? []
      arr.push(n)
      map.set(group, arr)
    }
    return map
  }, [filtered])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  )

  const tabUnread = useMemo<Record<FilterTab, number>>(() => {
    const result = {} as Record<FilterTab, number>
    for (const tab of Object.keys(TAB_LABELS) as FilterTab[]) {
      const allowedTypes = TAB_TYPES[tab]
      if (allowedTypes === null) {
        result[tab] = unreadCount
      } else {
        result[tab] = notifications.filter(
          (n) => !n.isRead && (allowedTypes as NotificationKind[]).includes(n.type),
        ).length
      }
    }
    return result
  }, [notifications, unreadCount])

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Benachrichtigungen
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {unreadCount} ungelesen
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[#16A34A] hover:bg-[#DCFCE7] rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                Alle gelesen
              </button>
            )}
          </div>

          {/* ── Filter-Tabs ──────────────────────────────────────── */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-px">
            {(Object.keys(TAB_LABELS) as FilterTab[]).map((tab) => {
              const { label, Icon } = TAB_LABELS[tab]
              const isActive = activeTab === tab
              const count = tabUnread[tab]
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors relative ${
                    isActive
                      ? 'text-[#16A34A] bg-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {count > 0 && (
                    <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#16A34A] rounded-full"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Inhalt ───────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

        {filtered.length === 0 ? (
          /* Leer-Zustand */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-20 text-gray-400"
          >
            <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <BellOff className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-gray-500">Keine Benachrichtigungen</p>
            <p className="text-xs text-gray-400">
              Aktivitäten erscheinen hier, sobald etwas passiert.
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            {GROUP_ORDER.map((group) => {
              const items = grouped.get(group)
              if (!items || items.length === 0) return null
              return (
                <section key={group}>
                  {/* Gruppen-Label */}
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                    {GROUP_LABELS[group]}
                  </h2>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <AnimatePresence initial={false}>
                      {items.map((notif, idx) => {
                        const cfg = NOTIF_CONFIG[notif.type]
                        const { Icon, colorClass, bgClass } = cfg
                        return (
                          <motion.div
                            key={notif.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                          >
                            <button
                              onClick={() => {
                                if (!notif.isRead) void markOneRead(notif.id)
                              }}
                              className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors ${
                                idx !== items.length - 1
                                  ? 'border-b border-gray-50'
                                  : ''
                              } ${
                                notif.isRead
                                  ? 'bg-white hover:bg-gray-50/50'
                                  : 'bg-blue-50/20 hover:bg-blue-50/40'
                              }`}
                            >
                              {/* Icon */}
                              <div
                                className={`flex-shrink-0 h-10 w-10 rounded-xl ${bgClass} flex items-center justify-center mt-0.5`}
                              >
                                <Icon className={`h-5 w-5 ${colorClass}`} />
                              </div>

                              {/* Text */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className={`text-sm leading-snug ${
                                      notif.isRead
                                        ? 'text-gray-700'
                                        : 'text-gray-900 font-semibold'
                                    }`}
                                  >
                                    {notif.title}
                                  </p>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                                      {formatRelativeTime(new Date(notif.createdAt))}
                                    </span>
                                    {!notif.isRead && (
                                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                  {notif.body}
                                </p>
                                <span className="inline-block mt-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                                  {cfg.label}
                                </span>
                              </div>
                            </button>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* ── KI-Hinweis ───────────────────────────────────────── */}
        <p className="mt-10 text-center text-[11px] text-gray-300">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </p>
      </div>
    </div>
  )
}
