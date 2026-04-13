'use client'

// ─────────────────────────────────────────────────────────────────
// TestimonialsSection – Drei statische Nutzer-Zitate
//
// • Kein Foto — Initialen-Kreis statt Avatar-Bild
// • border-l-4 border-[#16A34A] Karten
// • Statische Daten (kein DB-Query nötig)
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'

// ── Daten ─────────────────────────────────────────────────────────

interface Testimonial {
  id: string
  quote: string
  initials: string
  name: string
  sport: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      'Endlich eine KI, die den Unterschied zwischen Kreisliga A und Bezirksliga kennt. Mein neuer Verein: genau eine Stufe über meinem Level. Genau richtig.',
    initials: 'JK',
    name: 'Jonas K.',
    sport: 'Fußball · Mittelstürmer · Kreisliga A · 17 Jahre',
  },
  {
    id: 't2',
    quote:
      'Als LK-14-Sandplatz-Spielerin: LK-Turniere und Sparringspartner in Hessen. Das hat mir sonst kein Tool je geboten.',
    initials: 'SM',
    name: 'Sarah M.',
    sport: 'Tennis · LK 14.3 · Baseliner · 15 Jahre',
  },
  {
    id: 't3',
    quote:
      'Kein generischer Trainingsplan. Als PG bekomme ich PG-Drills. Das Tagebuch zeigt mir drei Monate Fortschritt schwarz auf weiß.',
    initials: 'LT',
    name: 'Leon T.',
    sport: 'Basketball · Point Guard · Bezirksliga · 16 Jahre',
  },
]

// ── Komponente ────────────────────────────────────────────────────

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0A0A] tracking-tight">
            Was Sportler sagen.
          </h2>
        </motion.div>

        {/* Karten */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.09, ease: 'easeOut' }}
              className="border-l-4 border-[#16A34A] pl-6 py-2"
            >
              {/* Zitat */}
              <p className="italic text-[#52525B] leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Autor */}
              <div className="flex items-center gap-3">
                {/* Initialen-Kreis (kein Foto) */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A]
                             flex items-center justify-center text-sm font-bold select-none"
                  aria-hidden="true"
                >
                  {t.initials}
                </div>

                <div>
                  <p className="font-semibold text-[#0A0A0A] text-sm">{t.name}</p>
                  <p className="text-xs text-[#71717A] mt-0.5">{t.sport}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
