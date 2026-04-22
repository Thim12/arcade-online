'use client'

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

const NAV_LINKS: { href: string; label: string; color: string | null; sport?: string }[] = [
  { href: '/vereine?sport=fussball', label: 'Fussball', color: '#16A34A', sport: 'fussball' },
  { href: '/vereine?sport=tennis', label: 'Tennis', color: '#C2621A', sport: 'tennis' },
  { href: '/vereine?sport=basketball', label: 'Basketball', color: '#EA580C', sport: 'basketball' },
  { href: '/community', label: 'Community', color: null },
  { href: '/turniere', label: 'Turniere', color: null },
  { href: '/vereine', label: 'Vereine', color: null },
]

const NOTIF_CONFIG: Record<
  NotificationKind,
  { Icon: LucideIcon; colorClass: string; bgClass: string }
> = {
  TOURNAMENT_REMINDER: { Icon: Calendar, colorClass: 'text-purple-500', bgClass: 'bg-purple-100' },
  BADGE_EARNED: { Icon: Award, colorClass: 'text-amber-500', bgClass: 'bg-amber-100' },
  STREAK_WARNING: { Icon: Flame, colorClass: 'text-orange-500', bgClass: 'bg-orange-100' },
  VEREIN_UPDATE: { Icon: CheckCircle2, colorClass: 'text-green-600', bgClass: 'bg-green-100' },
  SYSTEM: { Icon: Bell, colorClass: 'text-zinc-500', bgClass: 'bg-zinc-100' },
  NEW_FOLLOWER: { Icon: UserPlus, colorClass: 'text-[#16A34A]', bgClass: 'bg-green-100' },
  NEW_LIKE: { Icon: Heart, colorClass: 'text-red-500', bgClass: 'bg-red-100' },
  NEW_COMMENT: { Icon: MessageSquare, colorClass: 'text-blue-500', bgClass: 'bg-blue-100' },
  LEVEL_UP: { Icon: Zap, colorClass: 'text-[#16A34A]', bgClass: 'bg-green-100' },
  VEREIN_CONFIRMED: { Icon: CheckCircle2, colorClass: 'text-[#16A34A]', bgClass: 'bg-green-100' },
  SPARRING_REQUEST: { Icon: Swords, colorClass: 'text-blue-500', bgClass: 'bg-blue-100' },
  SPARRING_ACCEPTED: { Icon: CheckCircle2, colorClass: 'text-[#16A34A]', bgClass: 'bg-green-100' },
}

function getLevelColor(level: number): string {
  if (level <= 5) return 'bg-green-100 text-green-700 border border-green-200'
  if (level <= 10) return 'bg-blue-100 text-blue-700 border border-blue-200'
  if (level <= 20) return 'bg-purple-100 text-purple-700 border border-purple-200'
  return 'bg-amber-100 text-amber-700 border border-amber-200'
}

function deriveUsername(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) return '@' + name.trim().toLowerCase().replace(/\s+/g, '.')
  if (email) return '@' + email.split('@')[0]
  return '@nutzer'
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
    return name.trim()[0]?.toUpperCase() ?? '?'
  }
  if (email) return email[0]?.toUpperCase() ?? '?'
  return '?'
}

function SportRiseLogo(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <svg width="13" height="22" viewBox="0 0 14 23" fill="none" aria-hidden="true">
        <path d="M8 1L1 13H6L4 22L13 10H8Z" fill="#16A34A" />
      </svg>
      <span className="text-[17px] font-bold leading-none tracking-tight select-none text-zinc-900">
        Sport<span className="text-[#16A34A]">Rise</span>
      </span>
    </div>
  )
}

export default function Navbar(): React.JSX.Element {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const logoControls = useAnimation()
  const isHomePage = pathname === '/'
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const [easterEggVisible, setEasterEggVisible] = useState(false)
  const logoClickTimestamps = useRef<number[]>([])

  

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onScroll = (): void => { setScrolled(window.scrollY > 60) }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const fetchNotifications = useCallback(async (): Promise<void> => {
    setNotifLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = (await res.json()) as { notifications: NotificationItem[]; unreadCount: number }
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch { /* Netzwerkfehler still ignorieren */ }
    finally { setNotifLoading(false) }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') void fetchNotifications()
  }, [status, fetchNotifications])

  const markAllRead = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch { /* still ignorieren */ }
  }, [])

  const handleLogoClick = useCallback((): void => {
    const now = Date.now()
    logoClickTimestamps.current = [...logoClickTimestamps.current.filter((t) => now - t < 3000), now]
    if (logoClickTimestamps.current.length >= 10) {
      logoClickTimestamps.current = []
      void logoControls.start({ scale: [1, 1.12, 1], transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } })
      setEasterEggVisible(true)
      if (session?.user?.id) fetch('/api/easter-egg/logo', { method: 'POST' }).catch(() => {})
      setTimeout(() => setEasterEggVisible(false), 4000)
    }
  }, [logoControls, session?.user?.id])

  const isActiveLink = (href: string): boolean =>
    pathname === href || (href !== '/' && pathname.startsWith(href.split('?')[0]))

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-[60] transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <motion.button
              animate={logoControls}
              onClick={handleLogoClick}
              className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 rounded-md"
              aria-label="SportRise – Startseite"
            >
              <Link href="/" tabIndex={-1}>
                <SportRiseLogo />
              </Link>
            </motion.button>

            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Hauptnavigation">
              {NAV_LINKS.map((link) => {
                const active = isActiveLink(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 text-[13px] font-medium rounded-full px-3.5 py-1.5 transition-all duration-200 ${
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
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
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2.5">
                {!mounted || status === 'loading' ? null : status === 'authenticated' && session?.user ? (
                  <>
                    <Popover.Root open={notifOpen} onOpenChange={(open) => { setNotifOpen(open); if (open) void fetchNotifications() }}>
                      <Popover.Trigger asChild>
                        <button
                          className="relative h-9 w-9 flex items-center justify-center rounded-full transition-colors text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                          aria-label={`Benachrichtigungen${unreadCount > 0 ? ` (${unreadCount} ungelesen)` : ''}`}
                        >
                          <Bell className="h-[18px] w-[18px]" />
                          {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 flex items-center justify-center rounded-full bg-[#16A34A] text-[10px] font-bold text-white leading-none min-w-[18px]">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </button>
                      </Popover.Trigger>

                      <Popover.Portal>
                        <Popover.Content
                          align="end"
                          sideOffset={8}
                          className="z-[70] w-80 rounded-2xl bg-white border border-zinc-200 shadow-xl outline-none"
                        >
                          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                            <span className="text-sm font-semibold text-zinc-900">Benachrichtigungen</span>
                            {unreadCount > 0 && (
                              <button onClick={() => void markAllRead()} className="text-xs text-[#16A34A] hover:text-[#15803D] font-medium transition-colors">
                                Alle gelesen
                              </button>
                            )}
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {notifLoading ? (
                              <div className="flex flex-col gap-3 p-4">
                                {[1, 2, 3].map((i) => (<div key={i} className="flex gap-3"><div className="h-8 w-8 rounded-full bg-zinc-100 animate-pulse flex-shrink-0" /><div className="flex-1 space-y-1.5"><div className="h-3 bg-zinc-100 rounded animate-pulse w-3/4" /><div className="h-3 bg-zinc-100 rounded animate-pulse w-1/2" /></div></div>))}
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="flex flex-col items-center gap-2.5 py-10 text-zinc-400">
                                <BellOff className="h-7 w-7" />
                                <p className="text-sm text-zinc-500">Keine Benachrichtigungen</p>
                              </div>
                            ) : (
                              <ul>
                                {notifications.map((notif) => {
                                  const cfg = NOTIF_CONFIG[notif.type]
                                  const { Icon, colorClass, bgClass } = cfg
                                  return (
                                    <li key={notif.id} className={`flex gap-3 px-4 py-3 border-b border-zinc-50 last:border-0 transition-colors ${notif.isRead ? '' : 'bg-zinc-50/50'}`}>
                                      <div className={`flex-shrink-0 h-8 w-8 rounded-full ${bgClass} flex items-center justify-center`}>
                                        <Icon className={`h-4 w-4 ${colorClass}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-1">
                                          <p className={`text-sm leading-snug ${notif.isRead ? 'text-zinc-500' : 'text-zinc-900 font-medium'}`}>{notif.title}</p>
                                          {!notif.isRead && <span className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-[#16A34A]" aria-label="Ungelesen" />}
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{notif.body}</p>
                                        <p className="text-[11px] text-zinc-400 mt-1">{formatRelativeTime(new Date(notif.createdAt))}</p>
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

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="flex items-center gap-2 px-2 py-1.5 rounded-full transition-colors hover:bg-zinc-100" aria-label="Benutzermenue">
                          <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center flex-shrink-0">
                            {session.user.image ? (
                              <img src={session.user.image} alt={session.user.name ?? 'Avatar'} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-white">{getInitials(session.user.name, session.user.email)}</span>
                            )}
                          </div>
                          <span className={`hidden xl:inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${getLevelColor(session.user.level)}`}>
                            Lvl. {session.user.level}
                          </span>
                        </button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          sideOffset={8}
                          className="z-[70] w-56 rounded-2xl bg-white border border-zinc-200 shadow-xl outline-none p-1"
                        >
                          <DropdownMenu.Label className="px-3 py-2.5">
                            <p className="text-sm font-semibold text-zinc-900 truncate">{session.user.name ?? 'Sportler'}</p>
                            <p className="text-xs text-zinc-500 truncate">{deriveUsername(session.user.name, session.user.email)}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${getLevelColor(session.user.level)}`}>
                                Level {session.user.level}
                              </span>
                              <span className="text-xs text-zinc-500">{session.user.xp} XP</span>
                            </div>
                          </DropdownMenu.Label>
                          <DropdownMenu.Separator className="my-1 h-px bg-zinc-100" />
                          {[
                            { href: '/profil', label: 'Mein Profil', Icon: User },
                            { href: '/training', label: 'Training', Icon: Dumbbell },
                            { href: '/dashboard/ki-trainer', label: 'KI-Trainer', Icon: Brain },
                            { href: '/profil/einstellungen', label: 'Einstellungen', Icon: Settings },
                          ].map(({ href, label, Icon }) => (
                            <DropdownMenu.Item key={href} asChild>
                              <Link href={href} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-zinc-600 rounded-xl cursor-pointer outline-none hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 transition-colors">
                                <Icon className="h-4 w-4" />
                                {label}
                              </Link>
                            </DropdownMenu.Item>
                          ))}
                          <DropdownMenu.Separator className="my-1 h-px bg-zinc-100" />
                          <DropdownMenu.Item
                            onSelect={() => void signOut({ redirectTo: '/' })}
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 rounded-xl cursor-pointer outline-none hover:bg-red-50 focus:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Abmelden
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-[13px] font-medium rounded-full px-4 py-1.5 transition-all duration-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
                    >
                      Anmelden
                    </Link>
                    <Link
                      href="/registrieren"
                      className="px-4 py-1.5 text-[13px] font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-full transition-all duration-200 shadow-[0_2px_12px_rgba(22,163,74,0.25)]"
                    >
                      Registrieren
                    </Link>
                  </>
                )}
              </div>

              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full transition-colors text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                aria-label={mobileOpen ? 'Menue schliessen' : 'Menue oeffnen'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                <motion.div animate={{ rotate: mobileOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </button>
            </div>
          </div>
        </div>
      </header>

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
            <div className="flex items-center justify-between h-16 px-5 border-b border-zinc-100">
              <SportRiseLogo />
              <button onClick={() => setMobileOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors" aria-label="Menue schliessen">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-8">
              {status === 'authenticated' && session?.user && (
                <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center flex-shrink-0">
                    {session.user.image ? (
                      <img src={session.user.image} alt={session.user.name ?? 'Avatar'} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">{getInitials(session.user.name, session.user.email)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{session.user.name ?? 'Sportler'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex text-xs font-semibold px-1.5 py-0.5 rounded-full ${getLevelColor(session.user.level)}`}>
                        Level {session.user.level}
                      </span>
                      <span className="text-xs text-zinc-500">{session.user.xp} XP</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="px-1 mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Sportarten</p>
              <nav className="flex flex-col gap-0.5 mb-6">
                {NAV_LINKS.filter((l) => l.color).map((link, i) => (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, duration: 0.2 }}>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActiveLink(link.href) ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      }`}
                    >
                      <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: link.color ?? '#888' }} aria-hidden="true" />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <p className="px-1 mb-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Entdecken</p>
              <nav className="flex flex-col gap-0.5 mb-6">
                {NAV_LINKS.filter((l) => !l.color).map((link, i) => (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.04, duration: 0.2 }}>
                    <Link
                      href={link.href}
                      className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActiveLink(link.href) ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="pt-4 border-t border-zinc-200">
                {status === 'authenticated' && session?.user ? (
                  <div className="flex flex-col gap-0.5">
                    {[
                      { href: '/profil', label: 'Mein Profil', Icon: User },
                      { href: '/training', label: 'Training', Icon: Dumbbell },
                      { href: '/dashboard/ki-trainer', label: 'KI-Trainer', Icon: Brain },
                      { href: '/profil/einstellungen', label: 'Einstellungen', Icon: Settings },
                    ].map(({ href, label, Icon }) => (
                      <Link key={href} href={href} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                    <button onClick={() => void signOut({ redirectTo: '/' })} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors mt-1">
                      <LogOut className="h-4 w-4" />
                      Abmelden
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link href="/login" className="flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors">
                      Anmelden
                    </Link>
                    <Link
                      href="/registrieren"
                      className="flex items-center justify-center px-4 py-3 rounded-full text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors"
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

      <AnimatePresence>
        {easterEggVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 bg-white text-zinc-900 rounded-2xl shadow-xl border border-zinc-200"
            role="status"
            aria-live="polite"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Easter Egg gefunden!</p>
              <p className="text-xs text-zinc-500">Geheimes Abzeichen freigeschaltet</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}