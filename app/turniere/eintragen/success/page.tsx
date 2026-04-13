'use client'

// ─────────────────────────────────────────────────────────────────
// app/turniere/eintragen/success/page.tsx
// Dunkle Erfolgsseite nach erfolgreicher Turnier-Einreichung
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, Mail, Clock, Trophy } from 'lucide-react'

const INFO_ITEMS = [
  {
    icon: Mail,
    title: 'Bestätigungs-E-Mail',
    desc: 'Du hast eine E-Mail mit den Details deiner Einreichung erhalten.',
  },
  {
    icon: Clock,
    title: '24–48 Stunden Prüfzeit',
    desc: 'Unser Team prüft die Angaben und schaltet das Turnier frei.',
  },
  {
    icon: Trophy,
    title: 'Dann sofort sichtbar',
    desc: 'Nach der Freischaltung erscheint das Turnier in der Turniersuche.',
  },
]

export default function TurnierEintragenSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-6 py-16">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="mb-8"
      >
        <CheckCircle2 size={96} className="text-[#16A34A]" strokeWidth={1.5} />
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Vielen Dank!
        </h1>
        <p className="mt-3 text-[#A1A1AA] text-base max-w-md">
          Dein Turnier wurde eingereicht. Wir prüfen es innerhalb von{' '}
          <span className="text-white font-semibold">24–48 Stunden</span>.
        </p>
      </motion.div>

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="w-full max-w-md space-y-3 mb-10"
      >
        {INFO_ITEMS.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
            className="flex items-start gap-4 rounded-xl bg-white/5 border border-white/10 px-5 py-4"
          >
            <div className="w-9 h-9 rounded-lg bg-[#16A34A]/15 border border-[#16A34A]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={18} className="text-[#16A34A]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-[#71717A] mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        <Link
          href="/turniere"
          className="flex-1 flex items-center justify-center h-12 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #16A34A, #15803D)',
            boxShadow: '0 4px 20px rgba(22,163,74,0.35)',
          }}
        >
          Zur Turniersuche
        </Link>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center h-12 rounded-xl text-sm font-semibold text-white border border-white/20 hover:border-white/40 transition-colors"
        >
          Zur Startseite
        </Link>
      </motion.div>

      {/* KI-Hinweis */}
      <p className="mt-10 text-[10px] text-[#52525B] text-center">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>
    </div>
  )
}
