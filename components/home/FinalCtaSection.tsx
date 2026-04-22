'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const CHIPS = ['Kein Abo', 'Keine Werbung', 'DSGVO-konform', 'Eigene KI']

export default function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-white py-28 sm:py-36">
      {/* Decorative gradient */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(22,163,74,0.06) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight"
        >
          Starte jetzt. Kostenlos. Fuer immer.
        </motion.h2>

        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {CHIPS.map((chip) => (
            <span
              key={chip}
              className="inline-flex bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full"
            >
              {chip}
            </span>
          ))}
        </motion.div>

        <motion.p
          initial={false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
          className="mt-6 italic text-zinc-500 text-sm"
        >
          Startet in Hessen — bald in ganz Deutschland
        </motion.p>

        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
          className="mt-10"
        >
          <Link
            href="/registrieren"
            className="group inline-flex items-center gap-3 bg-[#16A34A] text-white font-bold
                       px-10 py-4 rounded-full transition-all duration-200
                       hover:bg-[#15803D] hover:scale-[1.02] active:scale-[0.98]
                       shadow-[0_4px_24px_rgba(22,163,74,0.3)]
                       hover:shadow-[0_8px_40px_rgba(22,163,74,0.4)]"
          >
            Profil erstellen
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <motion.p
          initial={false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="mt-5 text-xs text-zinc-400"
        >
          Direkt loslegen · Kein Bestaetigungsschritt · Jederzeit loeschbar
        </motion.p>

        <motion.p
          initial={false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.38, ease: 'easeOut' }}
          className="mt-16 text-xs text-zinc-400"
        >
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </motion.p>
      </div>
    </section>
  )
}