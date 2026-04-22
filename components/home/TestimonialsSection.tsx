'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

interface Testimonial {
  id: string
  quote: string
  name: string
  role: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      'Seit ich SportRise nutze, trainiere ich regelmaessig. Der KI-Plan passt sich perfekt an meinen Fortschritt an.',
    name: 'Lukas M.',
    role: '17 Jahre · Fussball · Frankfurt',
  },
  {
    id: 't2',
    quote:
      'Die Turniersuche hat mein Spiel auf das naechste Level gebracht. Endlich findet man als Nachwuchsspieler Wettbewerbe.',
    name: 'Anna K.',
    role: '15 Jahre · Tennis · Wiesbaden',
  },
  {
    id: 't3',
    quote:
      'Ohne Werbung, ohne Abo, einfach gut. Die Community-Motivation ist unschlagbar.',
    name: 'Max T.',
    role: '16 Jahre · Basketball · Kassel',
  },
]

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: 'easeOut' },
  }),
}

export default function TestimonialsSection() {
  return (
    <section className="bg-zinc-50 py-28 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-200 text-zinc-600 mb-4">
            Community
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight">
            Was Sportler sagen
          </h2>
          <p className="mt-4 text-zinc-500 text-lg">
            Echte Erfahrungen aus unserer Community
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.id}
              custom={i}
              initial={false}
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={CARD_VARIANTS}
              className="relative bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-sm overflow-hidden group hover:shadow-lg hover:shadow-zinc-200/50 transition-shadow duration-300"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-zinc-700 leading-relaxed mb-6 text-[15px]">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="pt-4 border-t border-zinc-100">
                <p className="text-zinc-900 font-bold">{t.name}</p>
                <p className="text-zinc-500 text-sm mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}