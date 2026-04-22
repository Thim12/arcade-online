'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Footprints,
  Dumbbell,
  Salad,
  MapPin,
  Users,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

interface Props {
  vorname: string
  primarySport: string | null
}

interface SportColors {
  primary: string
  glow: string
  highlight: string
  bgLight: string
  bgAccent: string
}

interface TourItem {
  Icon: React.ElementType
  title: string
  text: string
}

const SPORT_COLORS: Record<string, SportColors> = {
  fussball: { primary: '#16A34A', glow: 'rgba(22,163,74,0.15)', highlight: '#22c55e', bgLight: '#f0fdf4', bgAccent: '#dcfce7' },
  tennis: { primary: '#C2621A', glow: 'rgba(194,98,26,0.15)', highlight: '#f97316', bgLight: '#fff7ed', bgAccent: '#ffedd5' },
  basketball: { primary: '#EA580C', glow: 'rgba(234,88,12,0.15)', highlight: '#fb923c', bgLight: '#fff7ed', bgAccent: '#ffedd5' },
}

const DEFAULT_COLORS: SportColors = {
  primary: '#16A34A', glow: 'rgba(22,163,74,0.15)', highlight: '#22c55e', bgLight: '#f0fdf4', bgAccent: '#dcfce7',
}

const SPORT_NAMES: Record<string, string> = {
  fussball: 'Fußball',
  tennis: 'Tennis',
  basketball: 'Basketball',
}

const SPORT_HINTS: Record<string, string> = {
  fussball: 'Hessen-Sportler seit heute — du gehörst zu den Ersten.',
  tennis: "LK-Spieler in Hessen — let's find your match.",
  basketball: 'Court-Vision in Hessen — die Community wartet.',
}

function getRotatingTexts(sport: string): string[] {
  if (sport === 'tennis') {
    return [
      'Sportprofil und LK-Niveau werden analysiert...',
      'LK-angepasste Übungen werden ausgewählt...',
      '4-Wochen-Progressionsplan wird erstellt...',
      'Ernährungsempfehlungen werden berechnet...',
      'Fertig!',
    ]
  }
  if (sport === 'basketball') {
    return [
      'Sportprofil und Niveau werden analysiert...',
      'Positionsspezifische Drills werden ausgewählt...',
      '4-Wochen-Progressionsplan wird erstellt...',
      'Ernährungsempfehlungen werden berechnet...',
      'Fertig!',
    ]
  }
  return [
    'Sportprofil und Niveau werden analysiert...',
    'Positionsspezifische Übungen werden ausgewählt...',
    '4-Wochen-Progressionsplan wird erstellt...',
    'Ernährungsempfehlungen werden berechnet...',
    'Fertig!',
  ]
}

const TOUR_ITEMS: TourItem[] = [
  {
    Icon: Dumbbell,
    title: 'Dein Trainingsplan',
    text: 'Positionsspezifisch von unserer eigenen KI. Heute startet Woche 1.',
  },
  {
    Icon: Salad,
    title: 'Ernährungsplan',
    text: 'Realistisch, günstig, lecker. Eigene NutritionKI hat alles vorbereitet.',
  },
  {
    Icon: MapPin,
    title: 'Vereinssuche in Hessen',
    text: 'Eigene VereinKI empfiehlt die drei besten Vereine für dein genaues Niveau.',
  },
  {
    Icon: Users,
    title: 'Community',
    text: 'Sportler in Hessen folgen, Fortschritte teilen, motiviert bleiben.',
  },
]

function useCountUp(target: number, durationMs: number, active: boolean): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    let startTime: number | null = null
    let rafId: number

    const animate = (ts: number) => {
      if (startTime === null) startTime = ts
      const elapsed = ts - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, durationMs, active])

  return count
}

function SportRiseLogo({ primaryColor }: { primaryColor: string }) {
  return (
    <svg
      width="140"
      height="26"
      viewBox="0 0 140 26"
      fill="none"
      role="img"
      aria-label="SportRise"
    >
      <text
        x="0"
        y="20"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        fontSize="18"
        fontWeight="700"
        fill="#18181b"
        letterSpacing="-0.5"
      >
        Sport
      </text>
      <text
        x="62"
        y="20"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        fontSize="18"
        fontWeight="700"
        fill={primaryColor}
        letterSpacing="-0.5"
      >
        Rise
      </text>
    </svg>
  )
}

export function OnboardingClient({ vorname, primarySport }: Props) {
  const router = useRouter()
  const { update } = useSession()

  const sport = primarySport ?? 'fussball'
  const colors = SPORT_COLORS[sport] ?? DEFAULT_COLORS
  const sportName = SPORT_NAMES[sport] ?? 'Sport'
  const sportHint = SPORT_HINTS[sport] ?? ''

  const [step, setStep] = useState(1)
  const [countUpActive, setCountUpActive] = useState(false)
  const xpCount = useCountUp(50, 900, countUpActive)
  const [rotatingIndex, setRotatingIndex] = useState(0)
  const [progressWidth, setProgressWidth] = useState(0)
  const [planError, setPlanError] = useState<string | null>(null)
  const step2StartRef = useRef(0)
  const isMountedStep2Ref = useRef(false)
  const [tourStep, setTourStep] = useState(1)
  const [isCompleting, setIsCompleting] = useState(false)
  const [allPulsing, setAllPulsing] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 200, left: 280 })
  const navItemRefs = useRef<Array<HTMLButtonElement | null>>([null, null, null, null])

  useEffect(() => {
    if (step !== 1) return
    const t = setTimeout(() => setCountUpActive(true), 1050)
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    if (step !== 2) return
    let idx = 0
    const texts = getRotatingTexts(sport)
    const interval = setInterval(() => {
      idx = Math.min(idx + 1, texts.length - 1)
      setRotatingIndex(idx)
    }, 1500)
    return () => clearInterval(interval)
  }, [step, sport])

  useEffect(() => {
    if (step !== 2) return
    step2StartRef.current = Date.now()
    isMountedStep2Ref.current = true
    setRotatingIndex(0)
    setPlanError(null)
    setProgressWidth(0)

    const barTimer = setTimeout(() => setProgressWidth(90), 40)

    const generate = async () => {
      try {
        const res = await fetch('/api/training/plan/generate', { method: 'POST' })
        if (!isMountedStep2Ref.current) return
        if (!res.ok) {
          let msg = 'Plan konnte nicht erstellt werden.'
          try {
            const body = (await res.json()) as { error?: string }
            if (typeof body.error === 'string') msg = body.error
          } catch { /* ignore */ }
          setPlanError(msg)
          return
        }
        const elapsed = Date.now() - step2StartRef.current
        const waitFor = Math.max(0, 3000 - elapsed)
        setTimeout(() => {
          if (!isMountedStep2Ref.current) return
          setProgressWidth(100)
          setTimeout(() => {
            if (isMountedStep2Ref.current) setStep(3)
          }, 500)
        }, waitFor)
      } catch {
        if (!isMountedStep2Ref.current) return
        setPlanError('Verbindungsfehler. Bitte versuche es erneut.')
      }
    }

    void generate()

    return () => {
      isMountedStep2Ref.current = false
      clearTimeout(barTimer)
    }
  }, [step])

  useEffect(() => {
    if (step !== 3) return
    const t = setTimeout(() => {
      const el = navItemRefs.current[tourStep - 1]
      if (el) {
        const rect = el.getBoundingClientRect()
        setTooltipPos({
          top: Math.max(16, rect.top + rect.height / 2 - 96),
          left: 264 + 20,
        })
      }
    }, 50)
    return () => clearTimeout(t)
  }, [tourStep, step])

  const completeTour = useCallback(async () => {
    if (isCompleting) return
    setIsCompleting(true)
    setAllPulsing(true)
    try {
      await fetch('/api/user/onboarding', { method: 'PATCH' })
      await update({ onboardingDone: true })
    } catch { /* ignore */ }
    setTimeout(() => router.push('/dashboard'), 700)
  }, [isCompleting, update, router])

  const handleTourNext = useCallback(() => {
    if (tourStep < 4) {
      setTourStep((prev) => prev + 1)
    } else {
      void completeTour()
    }
  }, [tourStep, completeTour])

  const handleTourSkip = useCallback(() => {
    void completeTour()
  }, [completeTour])

  // ── Step 3: Tour-Layout (light, Apple-style) ──────────────────────
  if (step === 3) {
    const activeItem = TOUR_ITEMS[tourStep - 1] ?? TOUR_ITEMS[0]
    const ActiveIcon = activeItem.Icon

    return (
      <div className="min-h-screen bg-white" data-sport={sport}>
        {/* Simulated dashboard background - light */}
        <div className="min-h-screen flex items-center justify-center pl-64">
          <p className="text-zinc-400 text-xs">Dashboard lädt...</p>
        </div>

        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[4px]"
        />

        {/* Mock-Sidebar — light Strava-style */}
        <aside
          className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col bg-white border-r border-zinc-200"
        >
          {/* Logo */}
          <div className="pt-8 pb-6 px-5 flex justify-center">
            <SportRiseLogo primaryColor={colors.primary} />
          </div>

          {/* Nav-Items */}
          <nav className="flex flex-col gap-1 px-3 flex-1">
            {TOUR_ITEMS.map((item, index) => {
              const isActive = tourStep - 1 === index
              const ItemIcon = item.Icon

              return (
                <button
                  key={index}
                  ref={(el) => { navItemRefs.current[index] = el }}
                  disabled
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-left w-full transition-all"
                  style={{
                    background: isActive
                      ? colors.bgLight
                      : allPulsing
                        ? colors.bgLight
                        : 'transparent',
                    boxShadow: isActive
                      ? `0 0 0 9999px rgba(0,0,0,0.15), 0 4px 20px ${colors.glow}`
                      : 'none',
                    border: isActive
                      ? `1px solid ${colors.primary}35`
                      : '1px solid transparent',
                    zIndex: isActive ? 51 : undefined,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isActive
                        ? colors.bgAccent
                        : '#f4f4f5',
                    }}
                  >
                    <ItemIcon
                      size={18}
                      style={{ color: isActive ? colors.primary : '#a1a1aa' }}
                    />
                  </div>
                  <span
                    className="text-sm font-medium truncate"
                    style={{ color: isActive ? '#18181b' : '#a1a1aa' }}
                  >
                    {item.title}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* KI-Disclaimer */}
          <div className="px-5 py-5">
            <p className="text-center leading-relaxed text-zinc-400" style={{ fontSize: 10 }}>
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </div>
        </aside>

        {/* Tooltip-Karte — light Apple-style */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tourStep}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed z-[60] w-[300px] bg-white rounded-2xl overflow-hidden"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            {/* Sport-Akzentlinie */}
            <div className="h-1 w-full" style={{ background: colors.primary }} />

            <div className="p-6">
              <ActiveIcon size={28} style={{ color: colors.primary }} />

              <h3 className="font-bold mt-3 mb-2 text-base text-zinc-900">
                {activeItem.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                {activeItem.text}
              </p>

              {/* Step-Fortschritt */}
              <div className="flex items-center gap-1.5 mt-4 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      flex: i === tourStep ? 3 : 1,
                      background: i <= tourStep ? colors.primary : '#e4e4e7',
                    }}
                  />
                ))}
              </div>

              {/* Aktionen */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleTourSkip}
                  disabled={isCompleting}
                  className="text-sm transition-colors disabled:opacity-40 text-zinc-400 hover:text-zinc-600"
                >
                  Tour überspringen
                </button>
                <button
                  onClick={handleTourNext}
                  disabled={isCompleting}
                  className="px-5 py-2 rounded-xl text-white text-sm font-medium transition-opacity disabled:opacity-40"
                  style={{ background: colors.primary }}
                >
                  {tourStep < 4 ? 'Weiter' : "Los geht's!"}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── Steps 1 & 2: Centered Layout ────────────────────────────
  const rotatingTexts = getRotatingTexts(sport)

  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center relative"
      data-sport={sport}
    >
      {/* Subtle decorative blob */}
      <div
        className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: colors.glow, filter: 'blur(120px)' }}
      />

      {/* Logo oben mittig */}
      <div className="absolute top-6 inset-x-0 flex justify-center z-10">
        <SportRiseLogo primaryColor={colors.primary} />
      </div>

      <div className="flex-1 flex items-center justify-center w-full px-6 pt-20 pb-8">
        <AnimatePresence mode="wait">

          {/* ── SCHRITT 1: WILLKOMMEN ─────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center max-w-md w-full"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: colors.bgLight }}
                >
                  <CheckCircle2 size={40} strokeWidth={1.5} style={{ color: colors.primary }} />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="text-3xl md:text-4xl font-bold text-zinc-900 mt-6 leading-tight tracking-tight"
              >
                Willkommen bei SportRise,&nbsp;{vorname}.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.65 }}
                className="text-lg text-zinc-500 mt-3"
              >
                Dein Profil ist erstellt. Jetzt startet das Beste.
              </motion.p>

              {/* Badge-Reveal Card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.85, ease: 'easeOut' }}
                className="relative mt-8 max-w-xs w-full"
              >
                <div className="flex items-center gap-4 rounded-2xl px-6 py-5 bg-zinc-50 border border-zinc-200 shadow-sm">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: colors.bgLight,
                      border: `1px solid ${colors.primary}30`,
                    }}
                  >
                    <Footprints size={28} style={{ color: colors.primary }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-zinc-900">Erster Schritt</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      COMMON · +50 XP
                    </p>
                  </div>
                </div>

                <div
                  className="absolute -top-2 -right-2 text-white font-bold rounded-full px-2.5 py-1 whitespace-nowrap"
                  style={{ fontSize: 10, background: colors.primary }}
                >
                  Abzeichen erhalten!
                </div>
              </motion.div>

              {/* XP-Counter */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.05 }}
                className="mt-5"
              >
                <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                  +{xpCount} XP
                </span>
              </motion.div>

              {/* Sport-Hinweis */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.3 }}
                className="text-xs text-center text-zinc-400 mt-3"
              >
                {sportHint}
              </motion.p>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(2)}
                className="mt-8 px-10 py-4 rounded-2xl text-white font-semibold text-lg flex items-center gap-2 transition-shadow"
                style={{
                  background: colors.primary,
                  boxShadow: `0 4px 24px ${colors.glow}`,
                }}
              >
                Los geht&apos;s
                <ArrowRight size={20} />
              </motion.button>
            </motion.div>
          )}

          {/* ── SCHRITT 2: PLAN WIRD ERSTELLT ─────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center max-w-md w-full"
            >
              {/* Konzentrische rotierende Ringe */}
              <div
                style={{
                  width: 120,
                  height: 120,
                  filter: `drop-shadow(0 0 12px ${colors.glow})`,
                }}
              >
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ originX: '60px', originY: '60px' }}
                  >
                    <circle
                      cx="60" cy="60" r="55"
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth="1.5"
                      strokeDasharray="90 255"
                      strokeLinecap="round"
                    />
                  </motion.g>
                  <motion.g
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    style={{ originX: '60px', originY: '60px' }}
                  >
                    <circle
                      cx="60" cy="60" r="42"
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth="1.5"
                      strokeDasharray="70 194"
                      strokeLinecap="round"
                      opacity={0.7}
                    />
                  </motion.g>
                  <motion.g
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    style={{ originX: '60px', originY: '60px' }}
                  >
                    <circle
                      cx="60" cy="60" r="28"
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth="1.5"
                      strokeDasharray="50 126"
                      strokeLinecap="round"
                      opacity={0.5}
                    />
                  </motion.g>
                </svg>
              </div>

              {/* Headline */}
              <p className="text-xl font-medium text-zinc-900 mt-8">
                Unsere eigene {sportName}-KI erstellt deinen ersten Trainingsplan...
              </p>

              {/* KI-Disclaimer */}
              <p className="text-xs mt-2 text-zinc-400">
                Selbst programmierte KI · kein externer Bot · DSGVO-konform
              </p>

              {/* Progress Bar */}
              <div className="w-full max-w-sm mt-8 rounded-full overflow-hidden bg-zinc-100" style={{ height: 6 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressWidth}%`,
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.highlight})`,
                    borderRadius: '9999px',
                    transition: progressWidth > 0 ? 'width 5.5s linear' : 'none',
                  }}
                />
              </div>

              {/* Rotierender Text */}
              <div className="mt-5 h-5">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={rotatingIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-zinc-400"
                  >
                    {rotatingTexts[rotatingIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Fehler-Zustand */}
              {planError !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex flex-col items-center gap-4"
                >
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle size={18} />
                    <p className="text-sm">{planError}</p>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="text-sm font-medium px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-400 transition-colors"
                  >
                    Überspringen und manuell starten
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}