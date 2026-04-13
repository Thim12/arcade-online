'use client'

// ─────────────────────────────────────────────────────────────────
// app/login/LoginClient.tsx – Login-Formular (Client Component)
//
// Layout: Zweispaltig (links 55% dunkel, rechts 45% weiß)
// Links:  Blur-Blobs, SVG-Grid, Logo, rotierende Testimonials,
//         Feature-Chips, Nav-Dots
// Rechts: Google-Button, E-Mail/Passwort-Formular, Error-Banner,
//         Checkbox "Angemeldet bleiben", Link "Passwort vergessen"
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  MapPin,
  Brain,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as LabelPrimitive from '@radix-ui/react-label'

// ── Types ─────────────────────────────────────────────────────────

interface LoginClientProps {
  error?: string
  callbackUrl?: string
}

// ── Static data ───────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    initials: 'JK',
    name: 'Jonas K.',
    sport: 'Fußball Mittelstürmer',
    age: 17,
    quote:
      'Seit ich SportRise nutze, hat sich mein Training komplett verändert. Der KI-Plan ist genau auf mein Niveau abgestimmt.',
  },
  {
    initials: 'SM',
    name: 'Sarah M.',
    sport: 'Tennis LK 14.3',
    age: 15,
    quote:
      'Endlich eine Plattform, die den Sportalltag in Deutschland wirklich versteht. Die Vereinssuche hat mir so viel Zeit gespart.',
  },
  {
    initials: 'LT',
    name: 'Leon T.',
    sport: 'Basketball PG',
    age: 16,
    quote:
      'Die Community und das Turnier-Feature sind unglaublich. Ich habe hier Gegner gefunden, die wirklich auf meinem Niveau spielen.',
  },
]

const FEATURES = [
  { icon: CheckCircle2, label: 'Kostenlos & werbefrei' },
  { icon: MapPin, label: 'Hessen & DE-weit' },
  { icon: Brain, label: 'KI-Trainingsplan' },
  { icon: Clock, label: 'Immer verfügbar' },
]

// ── Error map ─────────────────────────────────────────────────────

interface ErrorInfo {
  message: string
  hasRegistrationLink?: boolean
}

const ERROR_MAP: Record<string, ErrorInfo> = {
  user_not_found: {
    message: 'Diese E-Mail ist noch nicht registriert.',
    hasRegistrationLink: true,
  },
  wrong_password: { message: 'E-Mail oder Passwort ist falsch.' },
  CredentialsSignin: { message: 'E-Mail oder Passwort ist falsch.' },
  OAuthSignin: { message: 'Google-Anmeldung fehlgeschlagen.' },
  OAuthCallback: { message: 'Google-Anmeldung fehlgeschlagen.' },
  OAuthCreateAccount: { message: 'Google-Anmeldung fehlgeschlagen.' },
  Callback: { message: 'Google-Anmeldung fehlgeschlagen.' },
  pending_verification: {
    message: 'Dein Konto wartet auf Eltern-Bestätigung. Bitte prüfe deine E-Mails.',
  },
  too_many_attempts: {
    message: 'Zu viele Versuche. Bitte warte 15 Minuten und versuche es erneut.',
  },
  account_suspended: {
    message: 'Dein Account wurde gesperrt. Wende dich an support@sportrise.de.',
  },
}

const FALLBACK_ERROR: ErrorInfo = {
  message: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
}

// ── Component ─────────────────────────────────────────────────────

export default function LoginClient({ error: urlError, callbackUrl }: LoginClientProps) {
  const router = useRouter()

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentError, setCurrentError] = useState<string | null>(urlError ?? null)

  // Testimonial rotation
  const [testimonialIndex, setTestimonialIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────

  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setCurrentError(null)

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (result?.error) {
      setCurrentError(result.error)
      setIsLoading(false)
      return
    }

    router.push(safeCallbackUrl)
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setCurrentError(null)
    await signIn('google', { callbackUrl: safeCallbackUrl })
  }

  // ── Derived values ────────────────────────────────────────────

  const errorInfo = currentError
    ? (ERROR_MAP[currentError] ?? FALLBACK_ERROR)
    : null

  const currentTestimonial = TESTIMONIALS[testimonialIndex]

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (55%, dark, sticky) ──────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#0A0A0A] relative overflow-hidden flex-col sticky top-0 h-screen">
        {/* Blur blob – top right */}
        <div
          className="absolute top-[-60px] right-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'rgba(22,163,74,0.08)', filter: 'blur(120px)' }}
        />
        {/* Blur blob – bottom left */}
        <div
          className="absolute bottom-[80px] left-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'rgba(22,163,74,0.05)', filter: 'blur(80px)' }}
        />
        {/* SVG grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='40' height='40' fill='none' stroke='rgba(255,255,255,0.025)' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Logo – top left */}
        <div className="relative z-10 p-8">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <rect width="32" height="32" rx="8" fill="#16A34A" />
              <path
                d="M16 24V10M10 16l6-6 6 6"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-white font-bold text-xl tracking-tight">SportRise</span>
          </Link>
        </div>

        {/* Testimonial – vertically centered */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex flex-col"
            >
              {/* Decorative opening quote */}
              <div
                className="text-[#16A34A] text-7xl font-serif leading-none mb-4 select-none"
                aria-hidden="true"
              >
                &#x201C;
              </div>

              {/* Quote text */}
              <p className="text-white/85 text-xl font-light italic max-w-[320px] leading-relaxed">
                {currentTestimonial.quote}
              </p>

              {/* Green separator */}
              <div className="w-10 h-[2px] bg-[#16A34A] my-5" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold">
                    {currentTestimonial.initials}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{currentTestimonial.name}</p>
                  <p className="text-white/50 text-xs">
                    {currentTestimonial.sport} · {currentTestimonial.age} Jahre
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: feature chips + nav dots */}
        <div className="relative z-10 px-12 pb-10 flex flex-col gap-5">
          {/* Feature chips */}
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
              >
                <Icon className="w-3.5 h-3.5 text-[#16A34A]" />
                <span className="text-white/60 text-xs">{label}</span>
              </div>
            ))}
          </div>

          {/* Nav dots */}
          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTestimonialIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === testimonialIndex
                    ? 'bg-[#16A34A] w-8 h-1.5'
                    : 'bg-white/20 w-1.5 h-1.5 hover:bg-white/40'
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (45%, white) ─────────────────────────────── */}
      <div className="flex-1 lg:w-[45%] bg-white flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="32" height="32" rx="8" fill="#16A34A" />
              <path
                d="M16 24V10M10 16l6-6 6 6"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[#0A0A0A] font-bold text-lg tracking-tight">SportRise</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-[#0A0A0A] mb-2">Willkommen zurück</h1>
            <p className="text-[#71717A] text-sm">
              Noch kein Konto?{' '}
              <Link
                href="/registrieren"
                className="text-[#16A34A] font-medium hover:text-[#15803D] transition-colors"
              >
                Jetzt registrieren
              </Link>
            </p>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {errorInfo && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
                  <p className="text-[#991B1B] text-sm leading-snug">
                    {errorInfo.message}
                    {errorInfo.hasRegistrationLink && (
                      <>
                        {' '}
                        <Link
                          href="/registrieren"
                          className="font-medium underline underline-offset-2 hover:text-[#7F1D1D] transition-colors"
                        >
                          Jetzt registrieren
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#FAFAFA] transition-colors text-[#0A0A0A] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {/* Google G – four-color SVG */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.252 17.64 11.944 17.64 9.2z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Mit Google anmelden
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E4E4E7]" />
            <span className="text-[#71717A] text-xs">oder per E-Mail</span>
            <div className="flex-1 h-px bg-[#E4E4E7]" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <LabelPrimitive.Root
                htmlFor="email"
                className="text-sm font-medium text-[#0A0A0A]"
              >
                E-Mail
              </LabelPrimitive.Root>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.de"
                  required
                  autoComplete="email"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E4E4E7] bg-white text-[#0A0A0A] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <LabelPrimitive.Root
                htmlFor="password"
                className="text-sm font-medium text-[#0A0A0A]"
              >
                Passwort
              </LabelPrimitive.Root>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dein Passwort"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-11 rounded-lg border border-[#E4E4E7] bg-white text-[#0A0A0A] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#52525B] transition-colors"
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckboxPrimitive.Root
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="w-4 h-4 rounded border border-[#E4E4E7] bg-white data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/30 transition-colors flex-shrink-0 flex items-center justify-center"
                >
                  <CheckboxPrimitive.Indicator>
                    <svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </CheckboxPrimitive.Indicator>
                </CheckboxPrimitive.Root>
                <LabelPrimitive.Root
                  htmlFor="rememberMe"
                  className="text-sm text-[#52525B] cursor-pointer select-none"
                >
                  Angemeldet bleiben
                </LabelPrimitive.Root>
              </div>
              <Link
                href="/passwort-vergessen"
                className="text-sm text-[#71717A] hover:text-[#16A34A] transition-colors"
              >
                Passwort vergessen?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-11 rounded-lg bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803D] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-1"
              style={{
                boxShadow: isLoading ? 'none' : '0 4px 24px rgba(22,163,74,0.35)',
              }}
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Wird angemeldet…
                </>
              ) : (
                <>
                  Anmelden
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Privacy note */}
          <p className="mt-6 text-xs text-center text-[#71717A] leading-relaxed">
            Mit der Anmeldung stimmst du unseren{' '}
            <Link
              href="/agb"
              className="underline underline-offset-2 hover:text-[#52525B] transition-colors"
            >
              AGB
            </Link>{' '}
            und unserer{' '}
            <Link
              href="/datenschutz"
              className="underline underline-offset-2 hover:text-[#52525B] transition-colors"
            >
              Datenschutzerklärung
            </Link>{' '}
            zu.
          </p>
        </div>
      </div>
    </div>
  )
}
