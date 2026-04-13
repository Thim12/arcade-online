'use client'

// ─────────────────────────────────────────────────────────────────
// HeroSection – Vollbild-Hero der SportRise.de Homepage
//
// Aufbau (5 Layer):
//   1. Dunkler Gradient-Hintergrund
//   2. Unsplash-Bild bei 12 % Deckkraft
//   3. Dunkler Overlay-Gradient (oben → unten)
//   4. Grüner Glow-Blob (Atmosphäre)
//   5. Inhalt: Eyebrow → H1 → Subtext → CTA → Stats → Scroll-Indikator
//
// Animationen: Framer Motion Stagger-Container (0.15 s zwischen Items)
// ─────────────────────────────────────────────────────────────────

import { useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
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
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
}

// ── Komponente ────────────────────────────────────────────────────

export default function HeroSection({
  userCount,
  vereinCount,
}: HeroSectionProps): React.JSX.Element {
  const scrollToHowItWorks = useCallback((): void => {
    document
      .getElementById('wie-es-funktioniert')
      ?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* ── Layer 1: Tiefer Dunkel-Gradient ─────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-[#060d1f] to-gray-900" />

      {/* ── Layer 2: Hintergrundbild (12 % Deckkraft) ────────────── */}
      <div className="absolute inset-0" style={{ opacity: 0.12 }}>
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* ── Layer 3: Overlay (oben dunkel → transparent) ─────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-transparent" />

      {/* ── Layer 4: Grüner Glow-Blob ─────────────────────────────── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full pointer-events-none select-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(22,163,74,0.16) 0%, transparent 70%)',
          filter: 'blur(50px)',
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
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-semibold tracking-widest uppercase">
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"
                aria-hidden="true"
              />
              Kostenlos &amp; Werbefrei
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.06] tracking-tight text-balance mb-6"
          >
            Dein Sport.{' '}
            <span className="text-green-400">Deine Plattform.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-white/60 max-w-xl leading-relaxed mb-10"
          >
            KI-Trainingsplan, Vereinssuche, Turniere und Community für
            Jugendliche und Amateursportler in Deutschland — alles an einem Ort,
            komplett gratis.
          </motion.p>

          {/* CTA-Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 mb-14"
          >
            <Link
              href="/registrieren"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              Kostenlos registrieren
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/8 hover:bg-white/[12%] text-white font-medium rounded-xl border border-white/15 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              Wie es funktioniert
              <ChevronDown className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-8"
          >
            {[
              {
                value:
                  userCount > 0 ? userCount.toLocaleString('de-DE') : '0',
                label: 'Sportler',
              },
              {
                value:
                  vereinCount > 0 ? vereinCount.toLocaleString('de-DE') : '0',
                label: 'Vereine',
              },
              { value: '3', label: 'aktive Sportarten' },
              { value: '5+', label: 'bald verfügbar' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/45 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll-Indikator ──────────────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 pointer-events-none select-none">
        <span className="text-[10px] text-white/25 tracking-widest uppercase font-medium">
          Scroll
        </span>
        <div className="animate-bounce-y" aria-hidden="true">
          <ChevronDown className="h-4 w-4 text-white/25" />
        </div>
      </div>
    </section>
  )
}
