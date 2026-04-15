'use client'

// ─────────────────────────────────────────────────────────────────
// HeroSection – Premium Vollbild-Hero für SportRise.de
//
// Design-Philosophie: Nike.com Energie × Spotify Atmosphäre
//
// Layer-Aufbau:
//   1. Tiefer Gradient-Hintergrund (fast schwarz)
//   2. Unsplash-Sportplatzbild (extrem niedrige Deckkraft)
//   3. Overlay-Gradient (oben → unten)
//   4. Animierte Glow-Orbs (grün + blau, langsam schwebend)
//   5. Inhalt: Eyebrow → H1 → Subtext → CTA → Stats
//   6. Scroll-Indikator
//
// Animationen: Framer Motion Stagger-Container
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, ChevronDown } from 'lucide-react'

// ── Konstanten ────────────────────────────────────────────────────

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80'

// ── Typen ─────────────────────────────────────────────────────────

interface HeroSectionProps {
  userCount: number
  vereinCount: number
}

// ── Framer Motion Varianten ───────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ── Animated Counter Hook ─────────────────────────────────────────

function useCountUp(target: number, duration: number = 2000): number {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref as React.RefObject<HTMLElement>, { once: true })

  useEffect(() => {
    if (!isInView || target <= 0) return

    let startTime: number | null = null
    let rafId: number

    const step = (timestamp: number): void => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress)
      setCount(Math.floor(eased * target))

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [isInView, target, duration])

  return count
}

// ── Stat-Box Komponente ───────────────────────────────────────────

function StatBox({ value, label, suffix }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="relative">
      <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
        {value}
        {suffix && <span className="text-green-400">{suffix}</span>}
      </p>
      <p className="text-sm text-white/40 mt-0.5">{label}</p>
    </div>
  )
}

// ── Komponente ────────────────────────────────────────────────────

export default function HeroSection({
  userCount,
  vereinCount,
}: HeroSectionProps): React.JSX.Element {
  const animatedUserCount = useCountUp(userCount)
  const animatedVereinCount = useCountUp(vereinCount)

  const scrollToHowItWorks = useCallback((): void => {
    document
      .getElementById('wie-es-funktioniert')
      ?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* ── Layer 1: Tiefer Dunkel-Gradient ─────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030712] via-[#060d1f] to-[#0a0a0a]" />

      {/* ── Layer 2: Hintergrundbild (8% Deckkraft für mehr Drama) ── */}
      <div className="absolute inset-0" style={{ opacity: 0.08 }}>
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* ── Layer 3: Overlay-Gradients ─────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />

      {/* ── Layer 4: Animierte Glow-Orbs ──────────────────────────── */}
      <motion.div
        className="absolute top-[20%] left-[15%] w-[600px] h-[600px] rounded-full pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] rounded-full pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -30, 20, 0],
          y: [0, 20, -40, 0],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      />

      {/* ── Subtile Grid-Textur ────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* ── Layer 5: Inhalt ───────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pt-36 lg:pt-44 lg:pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-green-400 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse"
                aria-hidden="true"
              />
              Kostenlos &amp; Werbefrei
            </span>
          </motion.div>

          {/* H1 — Mutig, groß, beeindruckend */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-[80px] font-bold text-white leading-[1.04] tracking-[-0.02em] text-balance mb-6"
          >
            Dein Sport.{' '}
            <span className="text-gradient-green">Deine Plattform.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-white/50 max-w-xl leading-relaxed mb-10"
          >
            KI-Trainingsplan, Vereinssuche, Turniere und Community für
            Jugendliche und Amateursportler in Deutschland — alles an einem Ort,
            komplett gratis.
          </motion.p>

          {/* CTA-Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 mb-16"
          >
            {/* Primärer CTA — mit Glow-Pulse */}
            <Link
              href="/registrieren"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl shadow-lg shadow-green-900/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-[15px] animate-glow-pulse"
            >
              Kostenlos registrieren
              <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>

            {/* Sekundärer CTA */}
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white font-medium rounded-xl border border-white/[0.08] hover:border-white/[0.15] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-[15px]"
            >
              Wie es funktioniert
              <ChevronDown className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-10 sm:gap-14"
          >
            <StatBox
              value={animatedUserCount > 0 ? animatedUserCount.toLocaleString('de-DE') : '0'}
              label="Sportler"
            />
            <StatBox
              value={animatedVereinCount > 0 ? animatedVereinCount.toLocaleString('de-DE') : '0'}
              label="Vereine"
            />
            <StatBox value="3" label="aktive Sportarten" />
            <StatBox value="5" label="bald verfügbar" suffix="+" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll-Indikator ──────────────────────────────────────── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 pointer-events-none select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <span className="text-[10px] text-white/20 tracking-[0.2em] uppercase font-medium">
          Scroll
        </span>
        <div className="animate-bounce-y" aria-hidden="true">
          <ChevronDown className="h-4 w-4 text-white/20" />
        </div>
      </motion.div>
    </section>
  )
}
