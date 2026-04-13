'use client'
// ─────────────────────────────────────────────────────────────────
// components/dashboard/DashboardTopBar.tsx
//
// Sticky TopBar für alle Dashboard-Seiten:
//   – Tageszeit-abhängige Begrüßung + aktuelles Datum
//   – Benachrichtigungen-Bell mit ungelesenen Badge
//   – Avatar-Link zur Profilseite
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'

// ── Sportfarben ────────────────────────────────────────────────────

const SPORT_PRIMARY: Record<string, string> = {
  fussball:   '#16A34A',
  tennis:     '#C2621A',
  basketball: '#EA580C',
}
const DEFAULT_PRIMARY = '#16A34A'

// ── Hilfsfunktionen ────────────────────────────────────────────────

function getGreeting(vorname: string): string {
  const h = new Date().getHours()
  if (h < 12) return `Guten Morgen, ${vorname}`
  if (h < 18) return `Guten Tag, ${vorname}`
  return `Guten Abend, ${vorname}`
}

function getTodayString(): string {
  return new Date().toLocaleDateString('de-DE', {
    weekday:  'long',
    day:      'numeric',
    month:    'long',
    year:     'numeric',
    timeZone: 'Europe/Berlin',
  })
}

// ── Props ──────────────────────────────────────────────────────────

interface DashboardTopBarProps {
  userName:     string
  userImage:    string | null
  primarySport: string | null
  unreadCount:  number
}

// ── Component ─────────────────────────────────────────────────────

export function DashboardTopBar({
  userName,
  userImage,
  primarySport,
  unreadCount,
}: DashboardTopBarProps) {
  const [mounted, setMounted]     = useState(false)
  const [greeting, setGreeting]   = useState('')
  const [todayDate, setTodayDate] = useState('')
  const [scrolled, setScrolled]   = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
    const vorname = userName.split(' ')[0] ?? userName
    setGreeting(getGreeting(vorname))
    setTodayDate(getTodayString())
  }, [userName])

  // Scroll-Listener: läuft auf dem nächstgelegenen scrollenden Vorfahren
  // (das ist das <main>-Element im layout.tsx, da es min-h-screen hat)
  useEffect(() => {
    const mainEl = document.querySelector('main') ?? window

    function onScroll() {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const y = mainEl instanceof Window
          ? mainEl.scrollY
          : (mainEl as HTMLElement).scrollTop
        setScrolled(y > 24)
      })
    }

    mainEl.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      mainEl.removeEventListener('scroll', onScroll)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const vorname = userName.split(' ')[0] ?? userName
  const primary = SPORT_PRIMARY[primarySport ?? ''] ?? DEFAULT_PRIMARY

  // Scroll-abhängige Werte: oben = fast opak, unten = sehr transparent
  const bgOpacity  = scrolled ? '0.30' : '0.92'
  const blurAmount = scrolled ? '24px'  : '12px'
  const borderOpacity = scrolled ? 'rgba(228,228,231,0.25)' : '#E4E4E7'

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
      style={{
        background:           `rgba(250,250,250,${bgOpacity})`,
        backdropFilter:       `blur(${blurAmount})`,
        WebkitBackdropFilter: `blur(${blurAmount})`,
        borderBottom:         `1px solid ${borderOpacity}`,
        transition:           'background 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease',
      }}
    >
      {/* Linke Seite – Begrüßung + Datum */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#0A0A0A' }}>
          {mounted ? greeting : `Hallo, ${vorname}`}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#71717A' }}>
          {mounted ? todayDate : ''}
        </p>
      </div>

      {/* Rechte Seite – Bell + Avatar */}
      <div className="flex items-center gap-3">

        {/* Benachrichtigungen */}
        <Link
          href="/dashboard/benachrichtigungen"
          className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-[#F4F4F5]"
          style={{ color: '#52525B' }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full text-white font-bold"
              style={{ fontSize: 10, background: primary }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profil-Avatar */}
        <Link href="/dashboard/profil">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-9 h-9 rounded-full object-cover"
              style={{ outline: `2px solid ${primary}`, outlineOffset: 2 }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: primary }}
            >
              {vorname.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </motion.header>
  )
}
