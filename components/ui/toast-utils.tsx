// ─────────────────────────────────────────────────────────────────
// components/ui/toast-utils.tsx
//
// Toast-Hilfsfunktionen für SportRise.
// Alle Varianten nutzen Lucide Icons, niemals Emojis.
// Wrapper um Sonner's toast() für konsistentes UI.
//
// Verfügbare Funktionen:
//   showSuccess(message)  – grüner Toast, CheckCircle2
//   showError(message)    – roter Toast, AlertCircle
//   showXP(amount)        – schwarzer Toast, Zap (dispatcht auch xp-gained Event)
//   showBadge(badge)      – sport-farbiger Toast, Badge-Icon
//   showInfo(message)     – blauer Toast, Info
//   showWarning(message)  – amber Toast, AlertTriangle
// ─────────────────────────────────────────────────────────────────

import { toast } from 'sonner'
import {
  CheckCircle2,
  AlertCircle,
  Zap,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { getBadgeIcon } from '@/lib/sport-icons'
import type { BadgeRarity } from '@prisma/client'

// ── Badge-Interface (Subset von DB-Badge) ────────────────────────

export interface ToastBadge {
  name: string
  iconName: string
  rarity: BadgeRarity
  xpReward: number
}

// ── Rarity-Farben ─────────────────────────────────────────────────

const RARITY_COLOR: Record<BadgeRarity, string> = {
  COMMON:    '#94a3b8',
  RARE:      '#3b82f6',
  EPIC:      '#a855f7',
  LEGENDARY: '#f59e0b',
}

const RARITY_LABEL: Record<BadgeRarity, string> = {
  COMMON:    'Gewöhnlich',
  RARE:      'Selten',
  EPIC:      'Episch',
  LEGENDARY: 'Legendär',
}

// ── showSuccess ───────────────────────────────────────────────────

export function showSuccess(message: string): void {
  toast.custom(() => (
    <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#16A34A]/30 rounded-2xl px-4 py-3 shadow-xl min-w-[260px]">
      <CheckCircle2 size={18} className="flex-shrink-0 text-[#16A34A]" />
      <span className="text-white text-sm font-medium">{message}</span>
    </div>
  ))
}

// ── showError ─────────────────────────────────────────────────────

export function showError(message: string): void {
  toast.custom(() => (
    <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#EF4444]/30 rounded-2xl px-4 py-3 shadow-xl min-w-[260px]">
      <AlertCircle size={18} className="flex-shrink-0 text-[#EF4444]" />
      <span className="text-white text-sm font-medium">{message}</span>
    </div>
  ))
}

// ── showXP ────────────────────────────────────────────────────────
// Zeigt Toast UND dispatcht xp-gained für die Float-Animation.

export function showXP(amount: number): void {
  // Float-Animation auslösen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('xp-gained', { detail: { amount } }),
    )
  }

  toast.custom(() => (
    <div className="flex items-center gap-3 bg-[#0A0A0A] border border-white/10 rounded-2xl px-4 py-3 shadow-xl min-w-[200px]">
      <Zap
        size={18}
        className="flex-shrink-0"
        style={{ color: 'var(--sport-primary, #16A34A)' }}
      />
      <span className="text-white text-sm">
        <span className="font-bold" style={{ color: 'var(--sport-primary, #16A34A)' }}>
          +{amount} XP
        </span>
      </span>
    </div>
  ))
}

// ── showBadge ─────────────────────────────────────────────────────

export function showBadge(badge: ToastBadge): void {
  const BadgeIcon = getBadgeIcon(badge.iconName)
  const color = RARITY_COLOR[badge.rarity]
  const label = RARITY_LABEL[badge.rarity]

  toast.custom(() => (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl min-w-[260px] border"
      style={{
        background: '#0A0A0A',
        borderColor: `${color}40`,
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 36,
          height: 36,
          background: `${color}18`,
          border: `1.5px solid ${color}50`,
          color,
        }}
      >
        <BadgeIcon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-white text-sm font-bold leading-tight truncate">{badge.name}</p>
        <p className="text-xs leading-tight mt-0.5" style={{ color: `${color}cc` }}>
          {label} · +{badge.xpReward} XP
        </p>
      </div>
    </div>
  ))
}

// ── showInfo ──────────────────────────────────────────────────────

export function showInfo(message: string): void {
  toast.custom(() => (
    <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#3B82F6]/30 rounded-2xl px-4 py-3 shadow-xl min-w-[260px]">
      <Info size={18} className="flex-shrink-0 text-[#3B82F6]" />
      <span className="text-white text-sm font-medium">{message}</span>
    </div>
  ))
}

// ── showWarning ───────────────────────────────────────────────────

export function showWarning(message: string): void {
  toast.custom(() => (
    <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#EAB308]/30 rounded-2xl px-4 py-3 shadow-xl min-w-[260px]">
      <AlertTriangle size={18} className="flex-shrink-0 text-[#EAB308]" />
      <span className="text-white text-sm font-medium">{message}</span>
    </div>
  ))
}
