'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Construction } from 'lucide-react'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function InArbeitClient(): React.JSX.Element {
  const router = useRouter()

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-white">
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none select-none"
        style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }}
        aria-hidden="true"
      />

      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center px-4 max-w-lg"
        >
          <motion.div variants={itemVariants} className="mx-auto mb-8">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-green-50">
              <Construction className="h-8 w-8 text-[#16A34A]" style={{ animation: 'spin 8s linear infinite' }} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center bg-green-50 border border-green-100 text-green-600 text-xs font-semibold px-3 py-1 rounded-full">
              In Entwicklung
            </span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-3xl font-bold text-zinc-900 tracking-tight mt-6 mb-4">
            Wird gerade gebaut
          </motion.h1>

          <motion.p variants={itemVariants} className="text-zinc-400 text-base leading-relaxed mb-10 max-w-md mx-auto">
            Dieses Feature ist momentan noch nicht verfuegbar, wird aber gerade aktiv entwickelt.
            Schau bald wieder vorbei!
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold rounded-xl transition-colors duration-200 text-sm"
            >
              Zur Startseite
            </Link>
            <button
              onClick={() => router.back()}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-medium rounded-xl border border-zinc-200 transition-colors duration-200 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurueck
            </button>
          </motion.div>

          <motion.p variants={itemVariants} className="mt-8 text-xs text-zinc-400">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}