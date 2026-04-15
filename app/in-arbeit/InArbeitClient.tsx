'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Construction } from 'lucide-react'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function InArbeitClient(): React.JSX.Element {
  const router = useRouter()

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-[#030712]">
      <div
        className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none select-none"
        style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full pointer-events-none select-none"
        style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
        aria-hidden="true"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-4 max-w-lg"
      >
        <motion.div variants={itemVariants} className="mx-auto mb-8">
          <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-2xl bg-[#16A34A]/10 border border-[#16A34A]/20">
            <Construction className="h-9 w-9 text-[#16A34A]" style={{ animation: 'spin 8s linear infinite' }} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/25 text-[#16A34A] text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse shrink-0" aria-hidden="true" />
            In Entwicklung
          </span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
          Wird gerade gebaut.
        </motion.h1>

        <motion.p variants={itemVariants} className="text-base sm:text-lg text-white/40 leading-relaxed mb-10 max-w-md mx-auto">
          Dieses Feature ist momentan noch nicht verfuegbar, wird aber gerade aktiv entwickelt.
          Schau bald wieder vorbei!
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold rounded-xl shadow-lg shadow-[#16A34A]/25 transition-all duration-300 hover:translate-y-[-2px] active:translate-y-0 text-sm"
          >
            Zur Startseite
          </Link>
          <button
            onClick={() => router.back()}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white font-medium rounded-xl border border-white/[0.08] hover:border-white/[0.15] backdrop-blur-sm transition-all duration-300 hover:translate-y-[-2px] active:translate-y-0 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurueck
          </button>
        </motion.div>

        <motion.p variants={itemVariants} className="mt-8 text-xs text-white/20">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </motion.p>
      </motion.div>
    </section>
  )
}