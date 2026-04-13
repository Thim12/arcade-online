'use client'

// ─────────────────────────────────────────────────────────────────
// Navbar – Globale Navigation für SportRise.de
//
// Verhalten:
//   • Auf "/" (Homepage): startet transparent (dark Hero dahinter),
//     wechselt nach 60 px Scroll zu bg-white/95 + border.
//   • Alle anderen Seiten: immer bg-white + border (kein Transparent).
//
// Features:
//   • Easter Egg: 10 Klicks in 3 s → Spring-Animation + Toast
//   • Benachrichtigungen: Popover mit Ungelesen-Badge (Radix UI)
//   • User-Dropdown: Avatar + Menü (Radix UI DropdownMenu)
//   • Mobiles Full-Screen-Menü mit Framer Motion
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import * as Popover from '@radix-ui/react-popover'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  Bell,
  BellOff,
  Menu,
  X,
  Award,
  Calendar,
  Flame,
  CheckCircle2,
  LogOut,
  Settings,
  User,
  Dumbbell,
  Sparkles,
  Brain,
  UserPlus,
  Heart,
  MessageSquare,
  Zap,
  Swords,
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
  data: Record<string, unknown> | null
}

// ── Konstanten ────────────────────────────────────────────────────

const NAV_LINKS: { href: string; label: string; color: string | null }[] = [
  { href: '/fussball', label: 'Fußball', color: '#16A34A' },
  { href: '/tennis', label: 'Tennis', color: '#C2621A' },
  { href: '/basketball', label: 'Basketball', color: '#EA580C' },
  { href: '/community', label: 'Community', color: null },
  { href: '/turniere', label: 'Turniere', color: null },
  { href: '/vereine', label: 'Vereine', color: null },
]

const NOTIF_CONFIG: Record<
  NotificationKind,
  { Icon: LucideIcon; colorClass: string; bgClass: string }
> = {
  TOURNAMENT_REMINDER: { Icon: Calendar, colorClass: 'text-purple-600', bgClass: 'bg-purple-50' },
  BADGE_EARNED: { Icon: Award, colorClass: 'text-amber-600', bgClass: 'bg-amber-50' },
  STREAK_WARNING: { Icon: Flame, colorClass: 'text-orange-500', bgClass: 'bg-orange-50' },
  VEREIN_UPDATE: { Icon: CheckCircle2, colorClass: 'text-green-600', bgClass: 'bg-green-50' },
  SYSTEM: { Icon: Bell, colorClass: 'text-gray-500', bgClass: 'bg-gray-50' },
  NEW_FOLLOWER: { Icon: UserPlus, colorClass: 'text-[#16A34A]', bgClass: 'bg-[#DCFCE7]' },
  NEW_LIKE: { Icon: Heart, colorClass: 'text-[#EF4444]', bgClass: 'bg-[#FEE2E2]' },
  NEW_COMMENT: { Icon: MessageSquare, colorClass: 'text-[#3B82F6]', bgClass: 'bg-[#DBEAFE]' },
  LEVEL_UP: { Icon: Zap, colorClass: 'text-[#16A34A]', bgClass: 'bg-[#DCFCE7]' },
  VEREIN_CONFIRMED: { Icon: CheckCircle2, colorClass: 'text-[#16A34A]', bgClass: 'bg-[#DCFCE7]' },
  SPARRING_REQUEST: { Icon: Swords, colorClass: 'text-[#3B82F6]', bgClass: 'bg-[#DBEAFE]' },
  SPARRING_ACCEPTED: { Icon: CheckCircle2, colorClass: 'text-[#16A34A]', bgClass: 'bg-[#DCFCE7]' },
}

// ── Hilfsfunktionen ───────────────────────────────────────────────

function getLevelColor(level: number): string {
  if (level <= 5) return 'bg-green-100 text-green-700'
  if (level <= 10) return 'bg-blue-100 text-blue-700'
  if (level <= 20) return 'bg-purple-100 text-purple-700'
  return 'bg-amber-100 text-amber-700'
}

function deriveUsername(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name?.trim()) {
    return '@' + name.trim().toLowerCase().replace(/\s+/g, '.')
  }
  if (email) {
    return '@' + email.split('@')[0]
  }
  return '@nutzer'
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
    }
    return name.trim()[0]?.toUpperCase() ?? '?'
  }
  if (email) {
    return email[0]?.toUpperCase() ?? '?'
  }
  return '?'
}

// ── SportRise Logo ────────────────────────────────────────────────

function SportRiseLogo({ isLight }: { isLight: boolean }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {/* Custom Lightning-Bolt SVG – kein Lucide Zap */}
      <svg
        width="13"
        height="22"
        viewBox="0 0 14 23"
        fill="none"
        aria-hidden="true"
      >
        <path d="M8 1L1 13H6L4 22L13 10H8Z" fill="#16A34A" />
      </svg>
      {/* Wortmarke */}
      <span className="text-[19px] font-bold leading-none tracking-tight select-none">
        <span style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>Sport</span>
        <span style={{ color: '#16A34A' }}>Rise</span>
      </span>
    </div>
  )
}

// ── Haupt-Komponente ──────────────────────────────────────────────

export default function Navbar(): React.JSX.Element {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const logoControls = useAnimation()

  const isHomePage = pathname === '/'

  // Scroll-State (nur relevant auf der Homepage)
  const [scrolled, setScrolled] = useState(false)

  // Mobile-Menü
  const [mobileOpen, setMobileOpen] = useState(false)

  // Benachrichtigungen
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)

  // Easter Egg
  const [easterEggVisible, setEasterEggVisible] = useState(false)
  const logoClickTimestamps = useRef<number[]>([])

  // isLight: bestimmt Farbschema der Navbar
  const isLight = !isHomePage || scrolled

  // ── Scroll-Listener ─────────────────────────────────────────────
  useEffect(() => {
    const onScroll = (): void => {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    // Initialer Check (bei direktem Link auf Seite mit Scroll-Position)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Mobile-Menü: Body-Scroll sperren ────────────────────────────
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // ── Mobile-Menü: Escape-Taste schließt Menü ─────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // ── Mobile-Menü: Route-Wechsel schließt Menü ────────────────────
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // ── Benachrichtigungen: Laden ────────────────────────────────────
  const fetchNotifications = useCallback(async (): Promise<void> => {
    setNotifLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = (await res.json()) as {
        notifications: NotificationItem[]
        unreadCount: number
      }
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // Netzwerkfehler still ignorieren
    } finally {
      setNotifLoading(false)
    }
  }, [])

  // Beim Login sofort Badge-Zähler laden
  useEffect(() => {
    if (status === 'authenticated') {
      void fetchNotifications()
    }
  }, [status, fetchNotifications])

  // ── Benachrichtigungen: Alle als gelesen markieren ───────────────
  const markAllRead = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // Still ignorieren
    }
  }, [])

  // ── Easter Egg: Logo-Klick ───────────────────────────────────────
  const handleLogoClick = useCallback((): void => {
    const now = Date.now()
    logoClickTimestamps.current = [
      ...logoClickTimestamps.current.filter((t) => now - t < 3000),
      now,
    ]

    if (logoClickTimestamps.current.length >= 10) {
      logoClickTimestamps.current = []

      // Spring-Animation: scale 1 → 1.12 → 1
      void logoControls.start({
        scale: [1, 1.12, 1],
        transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
      })

      setEasterEggVisible(true)

      // API-Call nur wenn eingeloggt
      if (session?.user?.id) {
        fetch('/api/easter-egg/logo', { method: 'POST' }).catch(() => {})
      }

      setTimeout(() => setEasterEggVisible(false), 4000)
    }
  }, [logoControls, session?.user?.id])

  // ── Aktiven Link bestimmen ───────────────────────────────────────
  const isActiveLink = (href: string): boolean =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  // ── Link-Farben je nach Navbar-Modus ────────────────────────────
  const linkBase = isLight
    ? 'text-gray-600 hover:text-gray-900'
    : 'text-white/80 hover:text-white'

  const linkActive = isLight ? 'text-gray-900 font-semibold' : 'text-white font-semibold'

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-[60] transition-all duration-300 ${
          isLight
            ? 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────────────────── */}
            <motion.button
              animate={logoControls}
              onClick={handleLogoClick}
              className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fussball focus-visible:ring-offset-2 rounded-md"
              aria-label="SportRise – Startseite"
            >
              <Link href="/" tabIndex={-1}>
                <SportRiseLogo isLight={isLight} />
              </Link>
            </motion.button>

            {/* ── Desktop-Navigation ───────────────────────────── */}
            <nav
              className="hidden lg:flex items-center gap-0.5"
              aria-label="Hauptnavigation"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                    isActiveLink(link.href) ? linkActive : linkBase
                  }`}
                >
                  {link.color && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: link.color }}
                      aria-hidden="true"
                    />
                  )}
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Rechte Seite ─────────────────────────────────── */}
            <div className="flex items-center gap-2">

              {/* Desktop Auth-Bereich */}
              <div className="hidden lg:flex items-center gap-2">
                {status === 'loading' ? (
                  <div className="h-9 w-36 rounded-lg bg-gray-100 animate-pulse" />
                ) : status === 'authenticated' && session?.user ? (

                  <>
                    {/* ── Benachrichtigungs-Glocke ─────────────── */}
                    <Popover.Root
                      open={notifOpen}
                      onOpenChange={(open) => {
                        setNotifOpen(open)
                        if (open) void fetchNotifications()
                      }}
                    >
                      <Popover.Trigger asChild>
                        <button
                          className={`relative h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                            isLight
                              ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                          aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ''}`}
                        >
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                            <span
                              className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none"
                              aria-hidden="true"
                            >
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </button>
                      </Popover.Trigger>

                      <Popover.Portal>
                        <Popover.Content
                          align="end"
                          sideOffset={8}
                          className="z-[70] w-80 rounded-xl bg-white shadow-xl border border-gray-100 outline-none data-[state=open]:animate-fade-in"
                        >
                          {/* Popover-Kopfzeile */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <span className="text-sm font-semibold text-gray-900">
                              Benachrichtigungen
                            </span>
                            {unreadCount > 0 && (
                              <button
                                onClick={() => void markAllRead()}
                                className="text-xs text-fussball hover:text-fussball/80 font-medium transition-colors"
                              >
                                Alle gelesen
                              </button>
                            )}
                          </div>

                          {/* Benachrichtigungs-Liste */}
                          <div className="max-h-80 overflow-y-auto">
                            {notifLoading ? (
                              <div className="flex flex-col gap-2 p-4">
                                {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                      <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="flex flex-col items-center gap-2.5 py-10 text-gray-400">
                                <BellOff className="h-7 w-7" />
                                <p className="text-sm">Keine Benachrichtigungen</p>
                              </div>
                            ) : (
                              <ul>
                                {notifications.map((notif) => {
                                  const cfg = NOTIF_CONFIG[notif.type]
                                  const { Icon, colorClass, bgClass } = cfg
                                  return (
                                    <li
                                      key={notif.id}
                                      className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                                        notif.isRead ? 'bg-white' : 'bg-blue-50/30'
                                      }`}
                                    >
                                      {/* Icon */}
                                      <div
                                        className={`flex-shrink-0 h-8 w-8 rounded-full ${bgClass} flex items-center justify-center`}
                                      >
                                        <Icon className={`h-4 w-4 ${colorClass}`} />
                                      </div>

                                      {/* Inhalt */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                          <p
                                            className={`text-sm leading-snug ${
                                              notif.isRead
                                                ? 'text-gray-700'
                                                : 'text-gray-900 font-medium'
                                            }`}
                                          >
                                            {notif.title}
                                          </p>
                                          {!notif.isRead && (
                                            <span
                                              className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-blue-500"
                                              aria-label="Ungelesen"
                                            />
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                          {notif.body}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                          {formatRelativeTime(new Date(notif.createdAt))}
                                        </p>
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </div>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>

                    {/* ── User-Avatar Dropdown ──────────────────── */}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                            isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                          }`}
                          aria-label="Benutzermenü"
                        >
                          {/* Avatar */}
                          <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-fussball/20 to-fussball/10 flex items-center justify-center flex-shrink-0 border border-gray-200">
                            {session.user.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={session.user.image}
                                alt={session.user.name ?? 'Avatar'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-fussball">
                                {getInitials(session.user.name, session.user.email)}
                              </span>
                            )}
                          </div>
                          {/* Level-Pill */}
                          <span
                            className={`hidden xl:inline-flex text-xs font-semibold px-1.5 py-0.5 rounded-full ${getLevelColor(session.user.level)}`}
                          >
                            Lvl. {session.user.level}
                          </span>
                        </button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          sideOffset={8}
                          className="z-[70] w-56 rounded-xl bg-white shadow-xl border border-gray-100 outline-none p-1 data-[state=open]:animate-fade-in"
                        >
                          {/* Profil-Kopfzeile */}
                          <DropdownMenu.Label className="px-3 py-2.5">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {session.user.name ?? 'Sportler'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {deriveUsername(session.user.name, session.user.email)}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span
                                className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${getLevelColor(session.user.level)}`}
                              >
                                Level {session.user.level}
                              </span>
                              <span className="text-xs text-gray-400">{session.user.xp} XP</span>
                            </div>
                          </DropdownMenu.Label>

                          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

                          {/* Navigations-Einträge */}
                          {[
                            { href: '/profil', label: 'Mein Profil', Icon: User },
                            { href: '/training', label: 'Training', Icon: Dumbbell },
                            { href: '/ki-assistent', label: 'KI-Assistent', Icon: Brain },
                            { href: '/einstellungen', label: 'Einstellungen', Icon: Settings },
                          ].map(({ href, label, Icon }) => (
                            <DropdownMenu.Item key={href} asChild>
                              <Link
                                href={href}
                                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 rounded-lg cursor-pointer outline-none hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                              >
                                <Icon className="h-4 w-4 text-gray-400" />
                                {label}
                              </Link>
                            </DropdownMenu.Item>
                          ))}

                          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

                          {/* Abmelden */}
                          <DropdownMenu.Item
                            onSelect={() => void signOut({ redirectTo: '/' })}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 rounded-lg cursor-pointer outline-none hover:bg-red-50 focus:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Abmelden
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </>

                ) : (

                  /* Nicht eingeloggt */
                  <>
                    <Link
                      href="/anmelden"
                      className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isLight
                          ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      Anmelden
                    </Link>
                    <Link
                      href="/registrieren"
                      className="px-3.5 py-2 text-sm font-semibold text-white bg-fussball hover:bg-fussball/90 rounded-lg transition-colors shadow-sm"
                    >
                      Registrieren
                    </Link>
                  </>

                )}
              </div>

              {/* ── Hamburger (Mobile) ─────────────────────────── */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className={`lg:hidden h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                  isLight
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                <motion.div
                  animate={{ rotate: mobileOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </motion.div>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Full-Screen Menü ────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-white overflow-y-auto lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            {/* Kopfzeile mit Close-Button */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
              <SportRiseLogo isLight />
              <button
                onClick={() => setMobileOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Menü schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 pt-4 pb-8">

              {/* Eingeloggt: Kurzprofil anzeigen */}
              {status === 'authenticated' && session?.user && (
                <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-gray-50">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-fussball/20 to-fussball/10 flex items-center justify-center flex-shrink-0 border border-gray-200">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? 'Avatar'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-fussball">
                        {getInitials(session.user.name, session.user.email)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session.user.name ?? 'Sportler'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex text-xs font-semibold px-1.5 py-0.5 rounded-full ${getLevelColor(session.user.level)}`}
                      >
                        Level {session.user.level}
                      </span>
                      <span className="text-xs text-gray-400">{session.user.xp} XP</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sportart-Links (mit Farb-Dot) */}
              <p className="px-1 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Sportarten
              </p>
              <nav className="flex flex-col gap-0.5 mb-6">
                {NAV_LINKS.filter((l) => l.color).map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActiveLink(link.href)
                          ? 'bg-gray-50 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: link.color ?? '#888' }}
                        aria-hidden="true"
                      />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Weitere Links */}
              <p className="px-1 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Entdecken
              </p>
              <nav className="flex flex-col gap-0.5 mb-6">
                {NAV_LINKS.filter((l) => !l.color).map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActiveLink(link.href)
                          ? 'bg-gray-50 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Auth-Bereich (Mobile) */}
              <div className="pt-4 border-t border-gray-100">
                {status === 'authenticated' && session?.user ? (
                  <div className="flex flex-col gap-1">
                    {[
                      { href: '/profil', label: 'Mein Profil', Icon: User },
                      { href: '/training', label: 'Training', Icon: Dumbbell },
                      { href: '/ki-assistent', label: 'KI-Assistent', Icon: Brain },
                      { href: '/einstellungen', label: 'Einstellungen', Icon: Settings },
                    ].map(({ href, label, Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-gray-400" />
                        {label}
                      </Link>
                    ))}
                    <button
                      onClick={() => void signOut({ redirectTo: '/' })}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Abmelden
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/anmelden"
                      className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium text-gray-900 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Anmelden
                    </Link>
                    <Link
                      href="/registrieren"
                      className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white bg-fussball hover:bg-fussball/90 transition-colors"
                    >
                      Kostenlos registrieren
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Easter Egg Toast ───────────────────────────────────────── */}
      <AnimatePresence>
        {easterEggVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-2xl border border-white/10 max-w-xs"
            role="status"
            aria-live="polite"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Easter Egg gefunden!</p>
              <p className="text-xs text-gray-400">Geheimes Abzeichen freigeschaltet</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
