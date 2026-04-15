'use client'

// ─────────────────────────────────────────────────────────────────
// FinalCtaSection – Dramatischer Abschluss-CTA
//
// Design: Gradient-Hintergrund mit animierten Glow-Orbs
// Premium CTA-Button mit Hover-Effekt
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

// ── Daten ─────────────────────────────────────────────────────────

const CHIPS = ['Kein Abo', 'Keine Werbung', 'DSGVO-konform', 'Eigene KI']

// ── Komponente ────────────────────────────────────────────────────

export default function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* ── Dramatischer Gradient-Hintergrund ──────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#052e16] via-[#16A34A] to-[#065f46]" />

      {/* ── Animierte Glow-Orbs ────────────────────────────────── */}
      <motion.div
        className="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 30, -15, 0],
          y: [0, -20, 15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-[10%] right-[15%] w-[350px] h-[350px] rounded-full pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, -20, 25, 0],
          y: [0, 15, -20, 0],
        }}
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        aria-hidden="true"
      />

      {/* ── Subtiles Grid-Pattern ──────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white tracking-tight leading-[1.1]"
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
              className="border border-white/20 text-white/70 text-sm px-4 py-1.5 rounded-full backdrop-blur-sm"
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
          className="mt-6 italic text-white/35 text-sm"
        >
          Startet in Hessen — bald in ganz Deutschland
        </motion.p>

        {/* CTA-Button — Premium mit Glow */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
          className="mt-10"
        >
          <Link
            href="/registrieren"
            className="group inline-flex items-center gap-3 bg-white text-[#0A0A0A] font-semibold
                       px-10 py-4 rounded-xl transition-all duration-300
                       hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98]
                       shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                       hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
          >
            Profil erstellen
            <ArrowRight className="h-5 w-5 text-[#16A34A] transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* Kleingedruckt */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="mt-5 text-xs text-white/30"
        >
          Direkt loslegen · Kein Bestätigungsschritt · Jederzeit löschbar
        </motion.p>
      </div>
    </section>
  )
}
