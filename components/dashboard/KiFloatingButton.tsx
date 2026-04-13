'use client'
// ─────────────────────────────────────────────────────────────────
// components/dashboard/KiFloatingButton.tsx
//
// Floating-Button (fixed, unten rechts) auf allen Dashboard-Seiten.
// Navigiert zu /dashboard/ki-trainer.
// Nicht sichtbar wenn bereits auf /dashboard/ki-trainer.
// Sportfarbe als Hintergrund (via primarySport-Prop).
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain } from 'lucide-react'

// ── Konstanten ─────────────────────────────────────────────────────

const SPORT_COLORS: Record<string, { primary: string; glow: string }> = {
  fussball:   { primary: '#16A34A', glow: 'rgba(22,163,74,0.45)'  },
  tennis:     { primary: '#C2621A', glow: 'rgba(194,98,26,0.45)'  },
  basketball: { primary: '#EA580C', glow: 'rgba(234,88,12,0.45)'  },
}
const DEFAULT_COLORS = { primary: '#16A34A', glow: 'rgba(22,163,74,0.45)' }

// ── Component ──────────────────────────────────────────────────────

interface Props {
  primarySport: string | null
}

export function KiFloatingButton({ primarySport }: Props) {
  const pathname = usePathname()
  const visible  = !pathname.startsWith('/dashboard/ki-trainer')
  const colors   = SPORT_COLORS[primarySport ?? ''] ?? DEFAULT_COLORS

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 right-6 z-40"
        >
          <Link
            href="/dashboard/ki-trainer"
            aria-label="KI-Trainer öffnen"
            className="group flex items-center gap-0 rounded-full overflow-hidden transition-all duration-300 hover:gap-2.5 hover:px-4"
            style={{
              width: 48,
              height: 48,
              background: colors.primary,
              boxShadow: `0 4px 20px ${colors.glow}`,
              paddingLeft: 14,
              paddingRight: 14,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.width = 'auto'
              el.style.paddingLeft = '14px'
              el.style.paddingRight = '16px'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.width = '48px'
              el.style.paddingLeft = '14px'
              el.style.paddingRight = '14px'
            }}
          >
            <Brain size={20} color="#fff" className="flex-shrink-0" />
            <span
              className="text-white text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 max-w-0 group-hover:max-w-xs"
            >
              KI-Trainer
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
