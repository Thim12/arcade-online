'use client'

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-2xl bg-green-50 flex items-center justify-center">
          <CheckCircle2 size={48} className="text-green-600" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
          Vielen Dank!
        </h1>
        <p className="mt-3 text-zinc-500 text-base max-w-md">
          Dein Turnier wurde eingereicht. Wir prüfen es innerhalb von{' '}
          <span className="text-zinc-900 font-semibold">24–48 Stunden</span>.
        </p>
      </motion.div>

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
            className="flex items-start gap-4 rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-4"
          >
            <div className="w-9 h-9 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        <Link
          href="/turniere"
          className="flex-1 flex items-center justify-center h-12 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          Zur Turniersuche
        </Link>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center h-12 rounded-xl text-sm font-semibold text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
        >
          Zur Startseite
        </Link>
      </motion.div>

      <p className="mt-10 text-[10px] text-zinc-400 text-center">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>
    </div>
  )
}