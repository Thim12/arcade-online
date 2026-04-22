'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Dumbbell,
  Salad,
  MapPin,
  Trophy,
  Users,
  User,
  Settings,
  LogOut,
  Brain,
  ChevronRight,
  ChevronDown,
  Home,
  Timer,
  Package,
  UtensilsCrossed,
  BarChart2,
} from 'lucide-react'

interface NavItem {
  href: string
  Icon: React.ElementType
  label: string
}

interface NavGroup {
  Icon: React.ElementType
  label: string
  basePath: string
  children: NavItem[]
}

interface SportColors {
  primary: string
}

const SPORT_COLORS: Record<string, SportColors> = {
  fussball: { primary: '#16A34A' },
  tennis: { primary: '#C2621A' },
  basketball: { primary: '#EA580C' },
}
const DEFAULT_COLORS: SportColors = { primary: '#16A34A' }

const MAIN_NAV: NavItem[] = [
  { href: '/dashboard', Icon: LayoutDashboard, label: 'Uebersicht' },
  { href: '/training', Icon: Dumbbell, label: 'Training' },
  { href: '/dashboard/ki-trainer', Icon: Brain, label: 'KI-Trainer' },
]

const ERNAEHRUNG_GROUP: NavGroup = {
  Icon: Salad,
  label: 'Ernaehrung',
  basePath: '/dashboard/ernaehrung',
  children: [
    { href: '/dashboard/ernaehrung', Icon: UtensilsCrossed, label: 'Uebersicht' },
    { href: '/dashboard/ernaehrung/kuehlschrank', Icon: Package, label: 'Kuehlschrank' },
    { href: '/dashboard/ernaehrung/fasten', Icon: Timer, label: 'Intervallfasten' },
    { href: '/dashboard/ernaehrung/rezepte', Icon: UtensilsCrossed, label: 'Rezepte' },
    { href: '/dashboard/ernaehrung/statistiken', Icon: BarChart2, label: 'Statistiken' },
    { href: '/dashboard/ernaehrung/einstellungen', Icon: Settings, label: 'Einstellungen' },
  ],
}

const SPORT_NAV: NavItem[] = [
  { href: '/vereine', Icon: MapPin, label: 'Vereine' },
  { href: '/turniere', Icon: Trophy, label: 'Turniere' },
  { href: '/community', Icon: Users, label: 'Community' },
]

const ACCOUNT_NAV: NavItem[] = [
  { href: '/dashboard/profil', Icon: User, label: 'Profil' },
  { href: '/dashboard/einstellungen', Icon: Settings, label: 'Einstellungen' },
]

function SportRiseLogo({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width="14" height="23" viewBox="0 0 14 23" fill="none" aria-hidden="true">
        <path d="M8 1L1 13H6L4 22L13 10H8Z" fill={primaryColor} />
      </svg>
      <span className="text-[19px] font-bold tracking-tight text-zinc-900">
        Sport
        <span style={{ color: primaryColor }}>Rise</span>
      </span>
    </div>
  )
}

interface SidebarProps {
  primarySport: string | null
  userName?: string
  userEmail?: string
}

export function Sidebar({ primarySport, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const colors = SPORT_COLORS[primarySport ?? ''] ?? DEFAULT_COLORS

  // Ernährung automatisch aufklappen wenn eine Unterseite aktiv ist
  const isErnaehrungActive = pathname.startsWith('/dashboard/ernaehrung')
  const [ernaehrungOpen, setErnaehrungOpen] = useState(isErnaehrungActive)

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/dashboard/ernaehrung') return pathname === '/dashboard/ernaehrung'
    return pathname.startsWith(href)
  }

  function NavLink({ item, indent = false }: { item: NavItem; indent?: boolean }) {
    const active = isActive(item.href)
    const { Icon, label, href } = item
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 rounded-xl w-full transition-all duration-150 group relative ${
          indent ? 'px-3 py-2 pl-10' : 'px-3 py-2.5'
        }`}
        style={{
          background: active ? `${colors.primary}12` : 'transparent',
          borderLeft: active ? `3px solid ${colors.primary}` : '3px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = '#F4F4F5'
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = 'transparent'
        }}
      >
        <Icon size={indent ? 15 : 18} style={{ color: active ? colors.primary : '#71717A' }} className="flex-shrink-0" />
        <span
          className={`font-medium truncate flex-1 transition-colors duration-150 ${indent ? 'text-[12px]' : 'text-[13px]'}`}
          style={{ color: active ? colors.primary : '#71717A' }}
        >
          {label}
        </span>
        {active && !indent && <ChevronRight size={14} style={{ color: colors.primary, flexShrink: 0 }} />}
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 z-30 flex flex-col bg-white border-r border-zinc-200">
      {/* Logo */}
      <div className="pt-6 pb-5 px-5 flex-shrink-0">
        <SportRiseLogo primaryColor={colors.primary} />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 px-3 overflow-y-auto min-h-0">
        {/* Home-Link */}
        <div className="mb-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors duration-150 w-full"
          >
            <Home size={18} className="flex-shrink-0" />
            Startseite
          </Link>
        </div>

        <div className="flex flex-col gap-0.5">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {/* Ernährung – Expandable Group */}
          <div>
            <button
              onClick={() => setErnaehrungOpen((prev) => !prev)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-150 group"
              style={{
                background: isErnaehrungActive ? `${colors.primary}12` : 'transparent',
                borderLeft: isErnaehrungActive ? `3px solid ${colors.primary}` : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isErnaehrungActive) e.currentTarget.style.background = '#F4F4F5'
              }}
              onMouseLeave={(e) => {
                if (!isErnaehrungActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Salad size={18} style={{ color: isErnaehrungActive ? colors.primary : '#71717A' }} className="flex-shrink-0" />
              <span
                className="text-[13px] font-medium truncate flex-1 text-left transition-colors duration-150"
                style={{ color: isErnaehrungActive ? colors.primary : '#71717A' }}
              >
                Ernaehrung
              </span>
              <ChevronDown
                size={14}
                className="flex-shrink-0 transition-transform duration-200"
                style={{
                  color: isErnaehrungActive ? colors.primary : '#A1A1AA',
                  transform: ernaehrungOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Sub-Items */}
            {ernaehrungOpen && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {ERNAEHRUNG_GROUP.children.map((child) => (
                  <NavLink key={child.href} item={child} indent />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 mb-3 px-3">
          <div className="h-px bg-zinc-100 mb-3" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Sport &amp; Community
          </p>
        </div>

        <div className="flex flex-col gap-0.5">
          {SPORT_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="flex-1" />

        <div className="my-4 px-3">
          <div className="h-px bg-zinc-100" />
        </div>

        <div className="flex flex-col gap-0.5 mb-3">
          {ACCOUNT_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Profile card */}
      <div className="px-3 pb-4 flex-shrink-0">
        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100">
          {userName && (
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                style={{ background: colors.primary }}
              >
                {userName[0]?.toUpperCase() ?? 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-800 truncate">{userName}</p>
                {userEmail && <p className="text-[11px] text-zinc-500 truncate">{userEmail}</p>}
              </div>
            </div>
          )}
          <button
            onClick={() => void signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-all duration-150 hover:bg-red-50 group"
          >
            <LogOut size={14} className="flex-shrink-0 text-red-400 group-hover:text-red-500" />
            <span className="text-[13px] font-medium text-zinc-500 group-hover:text-red-500 transition-colors duration-150">Abmelden</span>
          </button>
        </div>
      </div>
    </aside>
  )
}