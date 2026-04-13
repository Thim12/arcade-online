'use client'

// ─────────────────────────────────────────────────────────────────
// FinalCtaSection – Grüner Abschluss-CTA
//
// • bg-[#16A34A] volle Breite
// • Heading, Merkmal-Chips, Region-Hinweis, Button → /registrieren
// • Rein statisch (kein DB-Query)
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// ── Daten ─────────────────────────────────────────────────────────

const CHIPS = ['Kein Abo', 'Keine Werbung', 'DSGVO-konform', 'Eigene KI']

// ── Komponente ────────────────────────────────────────────────────

export default function FinalCtaSection() {
  return (
    <section className="bg-[#16A34A] py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight"
        >
          Starte jetzt. Kostenlos. Für immer.
        </motion.h2>

        {/* Chips */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {CHIPS.map((chip) => (
            <span
              key={chip}
              className="border border-white/25 text-white/78 text-sm px-4 py-1.5 rounded-full"
            >
              {chip}
            </span>
          ))}
        </motion.div>

        {/* Region-Hinweis */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
          className="mt-6 italic text-white/40 text-sm"
        >
          Startet in Hessen — bald in ganz Deutschland
        </motion.p>

        {/* CTA-Button */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
          className="mt-10"
        >
          <Link
            href="/registrieren"
            className="inline-flex items-center gap-3 bg-white text-[#0A0A0A] font-semibold
                       px-10 py-4 rounded-lg transition-all duration-200
                       hover:bg-white/90 hover:scale-[1.01]
                       hover:shadow-[0_4px_24px_rgba(0,0,0,0.14)]"
          >
            Profil erstellen
            <ArrowRight className="h-5 w-5 text-[#16A34A]" />
          </Link>
        </motion.div>

        {/* Kleingedruckt */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="mt-5 text-xs text-white/40"
        >
          Direkt loslegen · Kein Bestätigungsschritt · Jederzeit löschbar
        </motion.p>
      </div>
    </section>
  )
}
