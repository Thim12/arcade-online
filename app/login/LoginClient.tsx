'use client'

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
  AlertCircle,
  ArrowRight,
  Zap,
  Shield,
  Users,
} from 'lucide-react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as LabelPrimitive from '@radix-ui/react-label'

interface LoginClientProps {
  error?: string
  callbackUrl?: string
}

const TESTIMONIALS = [
  {
    initials: 'JK',
    name: 'Jonas K.',
    sport: 'Fußball · Mittelstürmer',
    age: 17,
    quote:
      'Seit ich SportRise nutze, hat sich mein Training komplett verändert. Der KI-Plan ist genau auf mein Niveau abgestimmt.',
  },
  {
    initials: 'SM',
    name: 'Sarah M.',
    sport: 'Tennis · LK 14.3',
    age: 15,
    quote:
      'Endlich eine Plattform, die den Sportalltag in Deutschland wirklich versteht.',
  },
  {
    initials: 'LT',
    name: 'Leon T.',
    sport: 'Basketball · PG',
    age: 16,
    quote:
      'Die Community und das Turnier-Feature sind unglaublich. Ich habe hier Gegner gefunden, die wirklich auf meinem Niveau spielen.',
  },
]

const FEATURES = [
  { icon: Zap, label: 'KI-Trainingsplan' },
  { icon: Shield, label: 'DSGVO-konform' },
  { icon: Users, label: 'Community' },
  { icon: CheckCircle2, label: 'Kostenlos' },
]

const ERROR_MAP: Record<string, { message: string; hasRegistrationLink?: boolean }> = {
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

const FALLBACK_ERROR = { message: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' }

export default function LoginClient({ error: urlError, callbackUrl }: LoginClientProps) {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentError, setCurrentError] = useState<string | null>(urlError ?? null)

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

  const errorInfo = currentError
    ? (ERROR_MAP[currentError] ?? FALLBACK_ERROR)
    : null

  const currentTestimonial = TESTIMONIALS[testimonialIndex]

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* ── Left panel (55%) — Testimonials, Apple-style ────────── */}
      <div className="hidden lg:flex lg:w-[55%] bg-zinc-50 relative overflow-hidden flex-col">
        {/* Subtle decorative blob */}
        <div
          className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'rgba(22,163,74,0.06)', filter: 'blur(120px)' }}
        />
        <div
          className="absolute bottom-[-60px] left-[-40px] w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'rgba(22,163,74,0.04)', filter: 'blur(100px)' }}
        />

        {/* Logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
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
            <span className="text-zinc-900 font-bold text-xl tracking-tight">SportRise</span>
          </Link>
        </div>

        {/* Testimonial — vertically centered */}
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
              <div
                className="text-green-600 text-6xl font-serif leading-none mb-4 select-none"
                aria-hidden="true"
              >
                &#x201C;
              </div>

              <p className="text-zinc-800 text-xl font-light leading-relaxed max-w-[360px]">
                {currentTestimonial.quote}
              </p>

              <div className="w-10 h-[2px] bg-green-600 my-5" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 text-sm font-semibold">
                    {currentTestimonial.initials}
                  </span>
                </div>
                <div>
                  <p className="text-zinc-900 text-sm font-medium">{currentTestimonial.name}</p>
                  <p className="text-zinc-500 text-xs">
                    {currentTestimonial.sport} · {currentTestimonial.age} Jahre
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: feature chips + nav dots */}
        <div className="relative z-10 px-12 pb-10 flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-zinc-200 shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-green-600" />
                <span className="text-zinc-600 text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTestimonialIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === testimonialIndex
                    ? 'bg-green-600 w-8 h-1.5'
                    : 'bg-zinc-300 w-1.5 h-1.5 hover:bg-zinc-400'
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (45%) — Login form, white ─────────────────── */}
      <div className="flex-1 min-h-screen bg-white flex items-center justify-center px-6 py-12">
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
            <span className="text-zinc-900 font-bold text-lg tracking-tight">SportRise</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Willkommen zurück</h1>
            <p className="text-zinc-500 text-sm">
              Noch kein Konto?{' '}
              <Link
                href="/registrieren"
                className="text-green-600 font-medium hover:text-green-700 transition-colors"
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
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm leading-snug">
                    {errorInfo.message}
                    {errorInfo.hasRegistrationLink && (
                      <>
                        {' '}
                        <Link
                          href="/registrieren"
                          className="font-medium underline underline-offset-2 hover:text-red-900 transition-colors"
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
            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors text-zinc-900 text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
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
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-zinc-400 text-xs">oder per E-Mail</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <LabelPrimitive.Root
                htmlFor="email"
                className="text-sm font-medium text-zinc-900"
              >
                E-Mail
              </LabelPrimitive.Root>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.de"
                  required
                  autoComplete="email"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <LabelPrimitive.Root
                htmlFor="password"
                className="text-sm font-medium text-zinc-900"
              >
                Passwort
              </LabelPrimitive.Root>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dein Passwort"
                  required
                  autoComplete="current-password"
                  className="w-full h-12 pl-10 pr-11 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
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
                  className="w-4 h-4 rounded border border-zinc-300 bg-white data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600/30 transition-colors flex-shrink-0 flex items-center justify-center"
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
                  className="text-sm text-zinc-500 cursor-pointer select-none"
                >
                  Angemeldet bleiben
                </LabelPrimitive.Root>
              </div>
              <Link
                href="/passwort-vergessen"
                className="text-sm text-zinc-400 hover:text-green-600 transition-colors"
              >
                Passwort vergessen?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-12 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-1"
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
          <p className="mt-6 text-xs text-center text-zinc-400 leading-relaxed">
            Mit der Anmeldung stimmst du unseren{' '}
            <Link
              href="/agb"
              className="underline underline-offset-2 hover:text-zinc-600 transition-colors"
            >
              AGB
            </Link>{' '}
            und unserer{' '}
            <Link
              href="/datenschutz"
              className="underline underline-offset-2 hover:text-zinc-600 transition-colors"
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