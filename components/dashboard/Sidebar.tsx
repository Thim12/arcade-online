'use client'

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
  ChevronRight,
  LogOut,
  Brain,
} from 'lucide-react'

interface NavItem {
  href: string
  Icon: React.ElementType
  label: string
}

interface SportColors {
  primary: string
  glow: string
}

const SPORT_COLORS: Record<string, SportColors> = {
  fussball: { primary: '#16A34A', glow: 'rgba(22,163,74,0.35)' },
  tennis: { primary: '#C2621A', glow: 'rgba(194,98,26,0.35)' },
  basketball: { primary: '#EA580C', glow: 'rgba(234,88,12,0.35)' },
}
const DEFAULT_COLORS: SportColors = { primary: '#16A34A', glow: 'rgba(22,163,74,0.35)' }

const MAIN_NAV: NavItem[] = [
  { href: '/dashboard', Icon: LayoutDashboard, label: 'Uebersicht' },
  { href: '/training', Icon: Dumbbell, label: 'Training' },
  { href: '/dashboard/ki-trainer', Icon: Brain, label: 'KI-Trainer' },
  { href: '/ernaehrung/plan-erstellen', Icon: Salad, label: 'Ernaehrung' },
]

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
    <svg width="140" height="26" viewBox="0 0 140 26" fill="none" role="img" aria-label="SportRise">
      <text x="0" y="20" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" fontSize="18" fontWeight="700" fill="white" letterSpacing="-0.5">Sport</text>
      <text x="62" y="20" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" fontSize="18" fontWeight="700" fill={primaryColor} letterSpacing="-0.5">Rise</text>
    </svg>
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

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(item.href)
    const { Icon, label, href } = item
    return (
      <Link
        href={href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200 group"
        style={{
          background: active ? `${colors.primary}18` : 'transparent',
          border: active ? `1px solid ${colors.primary}35` : '1px solid transparent',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:bg-white/10"
          style={{ background: active ? `${colors.primary}22` : 'rgba(255,255,255,0.05)' }}
        >
          <Icon size={16} style={{ color: active ? colors.primary : 'rgba(255,255,255,0.35)' }} />
        </div>
        <span
          className="text-sm font-medium truncate flex-1 transition-colors duration-200"
          style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.40)' }}
        >
          {label}
        </span>
        {active && <ChevronRight size={14} style={{ color: colors.primary, flexShrink: 0 }} />}
      </Link>
    )
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 z-30 flex flex-col"
      style={{
        background: 'rgba(11,11,11,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="pt-8 pb-6 px-5 flex justify-center flex-shrink-0">
        <SportRiseLogo primaryColor={colors.primary} />
      </div>

      <nav className="flex flex-col flex-1 px-3 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-0.5">
          {MAIN_NAV.map((item) => (<NavLink key={item.href} item={item} />))}
        </div>

        <div className="mt-5 mb-3 px-1">
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.20)' }}>
            Sport & Community
          </p>
        </div>

        <div className="flex flex-col gap-0.5">
          {SPORT_NAV.map((item) => (<NavLink key={item.href} item={item} />))}
        </div>

        <div className="flex-1" />

        <div className="my-3 px-1">
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <div className="flex flex-col gap-0.5 mb-3">
          {ACCOUNT_NAV.map((item) => (<NavLink key={item.href} item={item} />))}
        </div>
      </nav>

      <div className="px-3 pb-3 flex-shrink-0">
        <div className="rounded-xl p-3" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
          {userName && (
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${colors.primary}22`, color: colors.primary }}>
                {userName[0]?.toUpperCase() ?? 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/70 truncate">{userName}</p>
                {userEmail && <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>{userEmail}</p>}
              </div>
            </div>
          )}
          <button
            onClick={() => void signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg transition-all duration-200 group hover:bg-red-500/10"
          >
            <LogOut size={14} style={{ color: 'rgba(239,68,68,0.55)' }} className="flex-shrink-0" />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Abmelden</span>
          </button>
        </div>
      </div>

      <div className="px-5 pb-4 flex-shrink-0">
        <p className="text-center leading-relaxed" style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </p>
      </div>
    </aside>
  )
}