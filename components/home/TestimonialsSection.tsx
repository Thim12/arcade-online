'use client'

// ─────────────────────────────────────────────────────────────────
// TestimonialsSection – Premium Nutzer-Zitate (Dark + Glassmorphism)
//
// Design: Dunkler Hintergrund, schwebende Glassmorphism-Cards,
// Premium Quotation-Marks, Sport-farbige Initialen-Kreise
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'

// ── Daten ─────────────────────────────────────────────────────────

interface Testimonial {
  id: string
  quote: string
  initials: string
  name: string
  sport: string
  accentColor: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      'Endlich eine KI, die den Unterschied zwischen Kreisliga A und Bezirksliga kennt. Mein neuer Verein: genau eine Stufe über meinem Level. Genau richtig.',
    initials: 'JK',
    name: 'Jonas K.',
    sport: 'Fußball · Mittelstürmer · Kreisliga A · 17 Jahre',
    accentColor: '#16A34A',
  },
  {
    id: 't2',
    quote:
      'Als LK-14-Sandplatz-Spielerin: LK-Turniere und Sparringspartner in Hessen. Das hat mir sonst kein Tool je geboten.',
    initials: 'SM',
    name: 'Sarah M.',
    sport: 'Tennis · LK 14.3 · Baseliner · 15 Jahre',
    accentColor: '#C2621A',
  },
  {
    id: 't3',
    quote:
      'Kein generischer Trainingsplan. Als PG bekomme ich PG-Drills. Das Tagebuch zeigt mir drei Monate Fortschritt schwarz auf weiß.',
    initials: 'LT',
    name: 'Leon T.',
    sport: 'Basketball · Point Guard · Bezirksliga · 16 Jahre',
    accentColor: '#EA580C',
  },
]

// ── Komponente ────────────────────────────────────────────────────

export default function TestimonialsSection() {
  return (
    <section className="relative bg-[#0a0a0a] py-24 sm:py-32 overflow-hidden">
      {/* Atmosphärischer Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.04) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white tracking-tight leading-[1.1]">
            Was Sportler sagen.
          </h2>
        </motion.div>

        {/* Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-7 card-hover overflow-hidden"
            >
              {/* Quotation Mark Deko */}
              <div
                className="absolute top-4 right-5 text-[64px] font-serif leading-none select-none pointer-events-none"
                style={{ color: `${t.accentColor}10` }}
                aria-hidden="true"
              >
                &ldquo;
              </div>

              {/* Farbiger Akzent-Streifen links */}
              <div
                className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full"
                style={{ backgroundColor: `${t.accentColor}40` }}
                aria-hidden="true"
              />

              {/* Zitat */}
              <p className="relative text-sm text-white/50 leading-relaxed mb-8 pl-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Autor */}
              <div className="relative flex items-center gap-3">
                {/* Initialen-Kreis mit Sport-Farbe */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold select-none"
                  style={{
                    backgroundColor: `${t.accentColor}15`,
                    color: t.accentColor,
                  }}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>

                <div>
                  <p className="font-semibold text-white/80 text-sm">{t.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{t.sport}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
