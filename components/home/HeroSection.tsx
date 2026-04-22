'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface HeroSectionProps {
  userCount: number
  vereinCount: number
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const formatCount = (n: number): string => {
  if (n <= 0) return ''
  return n.toLocaleString('de-DE')
}

const SPORT_SHOWCASE = [
  { name: 'Fußball',     color: '#16A34A', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80' },
  { name: 'Tennis',      color: '#C2621A', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80' },
  { name: 'Basketball',  color: '#EA580C', image: 'https://images.unsplash.com/photo-1559692048-79a3f837883d?w=600&q=80' },
  { name: 'Fitness',     color: '#7C3AED', image: 'https://images.unsplash.com/photo-1517466787926-bc5b6be5293b?w=600&q=80' },
  { name: 'Laufen',      color: '#2563EB', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80' },
  { name: 'Schwimmen',   color: '#0891B2', image: 'https://images.unsplash.com/photo-1535127014032-4c6101293211?w=600&q=80' },
]

export default function HeroSection({
  userCount,
  vereinCount,
}: HeroSectionProps): React.JSX.Element {
  const userDisplay =
    userCount > 0 ? `${formatCount(userCount)}+ Sportler` : '10.000+ Sportler'
  const vereinDisplay =
    vereinCount > 0 ? `${formatCount(vereinCount)}+ Vereine` : '500+ Vereine'

  return (
    <section className="relative overflow-hidden bg-white min-h-[92vh] flex flex-col items-center justify-center py-20 sm:py-28 lg:py-36">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(22,163,74,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-48 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(194,98,26,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial={false}
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Pill badges */}
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <span className="inline-flex items-center px-3.5 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full">
              Jetzt starten
            </span>
            <span className="inline-flex items-center px-3.5 py-1 text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full">
              Gratis
            </span>
            <span className="inline-flex items-center px-3.5 py-1 text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full">
              Kein Abo
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-900 tracking-tight leading-[1.05] mb-6"
          >
            Dein Sport.{' '}
            <span className="relative inline-flex items-center gap-2">
              Deine
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-[#16A34A] shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" />
              </svg>
              Plattform.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            KI-Trainingsplan, Vereinssuche, Turniere und Community — alles an
            einem Ort, komplett gratis.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Link
              href="/registrieren"
              className="group inline-flex items-center justify-center gap-2.5 bg-[#16A34A] text-white font-semibold rounded-full px-8 py-4 hover:bg-[#15803D] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(22,163,74,0.3)] hover:shadow-[0_8px_32px_rgba(22,163,74,0.4)]"
            >
              Kostenlos registrieren
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-zinc-900 text-white font-semibold rounded-full px-8 py-4 hover:bg-zinc-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Anmelden
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-6 text-sm text-zinc-500 mb-16"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
              {userDisplay}
            </span>
            <span className="h-3 w-px bg-zinc-200" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              {vereinDisplay}
            </span>
            <span className="h-3 w-px bg-zinc-200" aria-hidden="true" />
            <span>100% gratis</span>
          </motion.div>
        </motion.div>

        {/* Sport Showcase Cards */}
        <motion.div
          initial={false}
          animate="visible"
          className="relative"
        >
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {SPORT_SHOWCASE.map((sport, i) => (
              <motion.div
                key={sport.name}
                initial={false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative flex-shrink-0 w-[180px] sm:w-[200px] h-[240px] sm:h-[270px] rounded-2xl overflow-hidden snap-center group cursor-pointer"
                style={{ boxShadow: `0 4px 24px rgba(0,0,0,0.08)` }}
              >
                {/* Image */}
                <img
                  src={sport.image}
                  alt={sport.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading={i < 2 ? 'eager' : 'lazy'}
                />

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, ${sport.color}CC 0%, ${sport.color}66 40%, transparent 100%)`,
                  }}
                />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full ring-2 ring-white/50"
                      style={{ background: sport.color === '#16A34A' || sport.color === '#C2621A' || sport.color === '#EA580C' ? '#fff' : sport.color }}
                      aria-hidden="true"
                    />
                    <span className="text-white/80 text-xs font-medium tracking-wide uppercase">
                      Sportart
                    </span>
                  </div>
                  <h3 className="text-white text-lg sm:text-xl font-bold leading-tight">
                    {sport.name}
                  </h3>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </motion.div>
            ))}
          </div>

          {/* Fade edges */}
          <div className="absolute top-0 bottom-4 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 bottom-4 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={false}
          animate="visible"
          className="mt-14 text-center text-xs text-zinc-400"
        >
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </motion.p>
      </div>
    </section>
  )
}