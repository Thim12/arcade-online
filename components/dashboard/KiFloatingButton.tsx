'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain } from 'lucide-react'

const SPORT_COLORS: Record<string, { primary: string; glow: string }> = {
  fussball:   { primary: '#16A34A', glow: 'rgba(22,163,74,0.40)' },
  tennis:     { primary: '#C2621A', glow: 'rgba(194,98,26,0.40)' },
  basketball: { primary: '#EA580C', glow: 'rgba(234,88,12,0.40)' },
}
const DEFAULT_COLORS = { primary: '#16A34A', glow: 'rgba(22,163,74,0.40)' }

interface Props {
  primarySport: string | null
}

export function KiFloatingButton({ primarySport }: Props) {
  const pathname = usePathname()
  const visible = !pathname.startsWith('/dashboard/ki-trainer')
  const colors = SPORT_COLORS[primarySport ?? ''] ?? DEFAULT_COLORS

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Link
            href="/dashboard/ki-trainer"
            aria-label="KI-Trainer oeffnen"
            className="group relative flex items-center gap-0 rounded-full overflow-hidden transition-all duration-300 hover:gap-2 hover:px-5 hover:py-4"
            style={{
              height: 56,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
              boxShadow: `0 4px 24px ${colors.glow}, 0 2px 8px rgba(0,0,0,0.1)`,
              paddingLeft: 16,
              paddingRight: 16,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.paddingLeft = '20px'
              el.style.paddingRight = '20px'
              el.style.boxShadow = `0 8px 32px ${colors.glow}, 0 4px 12px rgba(0,0,0,0.12)`
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.paddingLeft = '16px'
              el.style.paddingRight = '16px'
              el.style.boxShadow = `0 4px 24px ${colors.glow}, 0 2px 8px rgba(0,0,0,0.1)`
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
            >
              <Brain size={22} color="#fff" className="flex-shrink-0" strokeWidth={2} />
            </motion.div>
            <span className="text-white text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 max-w-0 group-hover:max-w-xs">
              KI-Trainer
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}