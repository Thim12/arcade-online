'use client'
// ─────────────────────────────────────────────────────────────────
// components/ui/XpAnimation.tsx
//
// Globale XP-Animations-Komponente:
//   1. FloatingXP  – schwebendes "+N XP" Label (CustomEvent)
//   2. LevelUpOverlay – Vollbild-Overlay bei Level-Up
//   3. BadgeRevealModal – Radix Dialog für neue Abzeichen
//
// Trigger von außen via CustomEvents:
//   window.dispatchEvent(new CustomEvent('xp-gained', {
//     detail: { amount: number, reason?: string }
//   }))
//   window.dispatchEvent(new CustomEvent('level-up', {
//     detail: { newLevel: number, perks?: string[] }
//   }))
//   window.dispatchEvent(new CustomEvent('badges-earned', {
//     detail: { badges: BadgeEarned[] }
//   }))
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { Zap, X, ChevronRight } from 'lucide-react'
import { getBadgeIcon } from '@/lib/sport-icons'
import type { BadgeRarity } from '@prisma/client'

// ── Typen ────────────────────────────────────────────────────────

interface FloatingXPItem {
  id:     number
  amount: number
  reason: string
  x:      number
  y:      number
}

interface LevelUpData {
  newLevel: number
  perks:    string[]
}

export interface BadgeEarned {
  id:          string
  name:        string
  description: string
  iconName:    string
  rarity:      BadgeRarity
  xpReward:    number
}

// ── Rarity-Glow-Farben ───────────────────────────────────────────

const RARITY_GLOW: Record<BadgeRarity, string> = {
  COMMON:    'rgba(148,163,184,0.5)',
  RARE:      'rgba(59,130,246,0.6)',
  EPIC:      'rgba(168,85,247,0.65)',
  LEGENDARY: 'rgba(245,158,11,0.7)',
}

const RARITY_LABEL: Record<BadgeRarity, string> = {
  COMMON:    'Gewöhnlich',
  RARE:      'Selten',
  EPIC:      'Episch',
  LEGENDARY: 'Legendär',
}

const RARITY_COLOR: Record<BadgeRarity, string> = {
  COMMON:    '#94a3b8',
  RARE:      '#3b82f6',
  EPIC:      '#a855f7',
  LEGENDARY: '#f59e0b',
}

// ── FloatingXP ───────────────────────────────────────────────────

function FloatingXPLayer() {
  const [items, setItems] = useState<FloatingXPItem[]>([])
  const counterRef = useRef(0)

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ amount: number; reason?: string }>
      const amount = ev.detail?.amount ?? 0
      if (amount <= 0) return

      const id = ++counterRef.current
      // Zufällige Position innerhalb des Viewports (zentriert leicht rechts)
      const x = 40 + Math.random() * 20  // vw-Prozent 40–60
      const y = 30 + Math.random() * 30  // vh-Prozent 30–60

      setItems((prev) => [
        ...prev,
        { id, amount, reason: ev.detail?.reason ?? '', x, y },
      ])

      // Nach Animation entfernen
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id))
      }, 1600)
    }

    window.addEventListener('xp-gained', handler)
    return () => window.removeEventListener('xp-gained', handler)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -60, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              position:  'absolute',
              left:      `${item.x}vw`,
              top:       `${item.y}vh`,
              transform: 'translateX(-50%)',
              color:     'var(--sport-primary, #16A34A)',
            }}
            className="font-black text-xl drop-shadow-lg select-none"
          >
            +{item.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── LevelUpOverlay ───────────────────────────────────────────────

function LevelUpOverlay() {
  const [data, setData] = useState<LevelUpData | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ newLevel: number; perks?: string[] }>
      setData({
        newLevel: ev.detail.newLevel,
        perks:    ev.detail.perks ?? [],
      })

      // Auto-Close nach 2.5s
      setTimeout(() => setData(null), 2500)
    }

    window.addEventListener('level-up', handler)
    return () => window.removeEventListener('level-up', handler)
  }, [])

  return (
    <AnimatePresence>
      {data !== null && (
        <motion.div
          key="level-up-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setData(null)}
          className="fixed inset-0 z-[10000] flex items-center justify-center cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #0A0A0A 0%, #0f1f0f 50%, #0A0A0A 100%)',
          }}
        >
          <div className="text-center select-none" onClick={(e) => e.stopPropagation()}>
            {/* Zap Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              className="flex items-center justify-center mx-auto mb-4"
              style={{
                width:  96,
                height: 96,
                color:  'var(--sport-primary, #16A34A)',
                filter: `drop-shadow(0 0 24px var(--sport-primary, #16A34A))`,
              }}
            >
              <Zap size={80} fill="currentColor" />
            </motion.div>

            {/* Level-Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <p className="text-white/60 text-base font-semibold tracking-widest uppercase mb-1">
                Level Up
              </p>
              <p className="text-white text-5xl font-black tracking-tight">
                Level {data.newLevel}!
              </p>
              <p className="text-white/70 text-xl mt-2">
                Du hast Level {data.newLevel} erreicht!
              </p>
            </motion.div>

            {/* Perks */}
            {data.perks.length > 0 && (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-5 space-y-1"
              >
                {data.perks.map((perk, i) => (
                  <li key={i} className="text-white/60 text-sm flex items-center justify-center gap-2">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--sport-primary, #16A34A)' }}
                    />
                    {perk}
                  </li>
                ))}
              </motion.ul>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-white/30 text-xs mt-6"
            >
              Tippe irgendwo um fortzufahren
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── BadgeRevealModal ─────────────────────────────────────────────

function BadgeRevealModal() {
  const [badges, setBadges] = useState<BadgeEarned[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [open, setOpen] = useState(false)

  const handleClose = useCallback(() => {
    setOpen(false)
    setBadges([])
    setCurrentIndex(0)
  }, [])

  const handleNext = useCallback(() => {
    if (currentIndex < badges.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      handleClose()
    }
  }, [currentIndex, badges.length, handleClose])

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ badges: BadgeEarned[] }>
      const newBadges = ev.detail?.badges
      if (!Array.isArray(newBadges) || newBadges.length === 0) return
      setBadges(newBadges)
      setCurrentIndex(0)
      setOpen(true)
    }

    window.addEventListener('badges-earned', handler)
    return () => window.removeEventListener('badges-earned', handler)
  }, [])

  const badge = badges[currentIndex]
  const isLast = currentIndex === badges.length - 1

  if (!badge) return null

  const BadgeIcon = getBadgeIcon(badge.iconName)

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001]"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="fixed left-1/2 top-1/2 z-[10002] w-[calc(100vw-2rem)] max-w-sm
                       -translate-x-1/2 -translate-y-1/2 rounded-3xl p-8 text-center
                       border border-white/10 outline-none"
            style={{
              background: 'linear-gradient(160deg, #111827 0%, #1a2340 100%)',
              boxShadow: `0 0 60px ${RARITY_GLOW[badge.rarity]}, 0 20px 40px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Schließen-Button */}
            <Dialog.Close asChild>
              <button
                className="absolute right-4 top-4 rounded-full p-1.5 text-white/40
                           hover:text-white/70 transition-colors"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </Dialog.Close>

            {/* Badge-Anzahl */}
            {badges.length > 1 && (
              <p className="text-white/40 text-xs mb-4 tracking-wide">
                {currentIndex + 1} / {badges.length}
              </p>
            )}

            {/* Badge-Icon */}
            <AnimatePresence mode="wait">
              <motion.div
                key={badge.id}
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="flex items-center justify-center mx-auto mb-5"
                style={{
                  width:  90,
                  height: 90,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: `2px solid ${RARITY_COLOR[badge.rarity]}`,
                  boxShadow: `0 0 28px ${RARITY_GLOW[badge.rarity]}`,
                  color: RARITY_COLOR[badge.rarity],
                }}
              >
                <BadgeIcon size={44} />
              </motion.div>
            </AnimatePresence>

            {/* Rarity-Label */}
            <p
              className="text-xs font-bold tracking-widest uppercase mb-2"
              style={{ color: RARITY_COLOR[badge.rarity] }}
            >
              {RARITY_LABEL[badge.rarity]}
            </p>

            {/* Badge-Name */}
            <AnimatePresence mode="wait">
              <motion.div
                key={badge.id + '-info'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-white font-bold text-2xl mb-1">
                  {badge.name}
                </p>
                <p className="text-white/60 text-sm mb-4">
                  {badge.description}
                </p>
                <p
                  className="text-base font-bold"
                  style={{ color: 'var(--sport-primary, #16A34A)' }}
                >
                  +{badge.xpReward} XP
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Weiter / Schließen */}
            <button
              onClick={handleNext}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-3
                         font-semibold text-sm transition-all duration-200
                         hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: `linear-gradient(135deg, ${RARITY_COLOR[badge.rarity]}22, ${RARITY_COLOR[badge.rarity]}44)`,
                border:     `1px solid ${RARITY_COLOR[badge.rarity]}55`,
                color:      RARITY_COLOR[badge.rarity],
              }}
            >
              {isLast ? 'Schließen' : (
                <>
                  Weiter
                  <ChevronRight size={16} />
                </>
              )}
            </button>

            {/* Attribution */}
            <p className="text-white/20 text-[10px] mt-4 leading-tight">
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Haupt-Export ─────────────────────────────────────────────────

export function XpAnimation() {
  return (
    <>
      <FloatingXPLayer />
      <LevelUpOverlay />
      <BadgeRevealModal />
    </>
  )
}
