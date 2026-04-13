'use client'

// ─────────────────────────────────────────────────────────────────
// components/providers/XpAnimationProvider.tsx
//
// Context-Provider für das globale XP-Float-System.
// Stellt useXpAnimation()-Hook bereit für einfaches Auslösen von
// XP-, Level-Up- und Badge-Animationen ohne direkten Event-Dispatch.
//
// Rendert XpAnimation (FloatingXP + LevelUpOverlay + BadgeReveal)
// als globales Portal in den DOM-Root.
// ─────────────────────────────────────────────────────────────────

import { createContext, useContext, useCallback } from 'react'
import { XpAnimation, type BadgeEarned } from '@/components/ui/XpAnimation'

// ── Kontext-Interface ────────────────────────────────────────────

interface XpAnimationContextValue {
  /** Zeigt schwebendes "+N XP" Label an */
  triggerXP: (amount: number, reason?: string) => void
  /** Zeigt Vollbild-LevelUp-Overlay an */
  triggerLevelUp: (newLevel: number, perks?: string[]) => void
  /** Öffnet Badge-Reveal-Modal für ein oder mehrere Abzeichen */
  triggerBadges: (badges: BadgeEarned[]) => void
}

const XpAnimationContext = createContext<XpAnimationContextValue>({
  triggerXP: () => {},
  triggerLevelUp: () => {},
  triggerBadges: () => {},
})

// ── Hook ────────────────────────────────────────────────────────

export function useXpAnimation(): XpAnimationContextValue {
  return useContext(XpAnimationContext)
}

// ── Provider ─────────────────────────────────────────────────────

export function XpAnimationProvider({ children }: { children: React.ReactNode }) {
  const triggerXP = useCallback((amount: number, reason?: string) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('xp-gained', { detail: { amount, reason } }),
    )
  }, [])

  const triggerLevelUp = useCallback((newLevel: number, perks: string[] = []) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('level-up', { detail: { newLevel, perks } }),
    )
  }, [])

  const triggerBadges = useCallback((badges: BadgeEarned[]) => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('badges-earned', { detail: { badges } }),
    )
  }, [])

  return (
    <XpAnimationContext.Provider value={{ triggerXP, triggerLevelUp, triggerBadges }}>
      {children}
      {/* XpAnimationPortal: FloatingXP + LevelUpOverlay + BadgeRevealModal */}
      <XpAnimation />
    </XpAnimationContext.Provider>
  )
}
