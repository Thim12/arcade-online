'use client'

// ─────────────────────────────────────────────────────────────────
// LevelPageClient.tsx – Client-Teil der Level-System-Seite
// (wird gebraucht, da useRef für Scroll-to-current-Level benötigt)
// ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, ChevronRight } from 'lucide-react'
import { getBadgeIcon } from '@/lib/sport-icons'
import type { LevelRow, XpSource } from './page'

// ── Tier-Konfiguration ────────────────────────────────────────────

const TIER_CONFIG = {
  common: {
    label: 'Common',
    color: '#71717A',
    bg: '#F4F4F5',
    border: '#E4E4E7',
    cardBg: 'bg-white',
    cardBorder: 'border-[#E4E4E7]',
    numberColor: 'text-[#71717A]',
  },
  rare: {
    label: 'Rare',
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#BFDBFE',
    cardBg: 'bg-[#EFF6FF]',
    cardBorder: 'border-[#BFDBFE]',
    numberColor: 'text-[#2563EB]',
  },
  epic: {
    label: 'Epic',
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE',
    cardBg: 'bg-[#F5F3FF]',
    cardBorder: 'border-[#DDD6FE]',
    numberColor: 'text-[#7C3AED]',
  },
  legendary: {
    label: 'Legendary',
    color: '#D97706',
    bg: '#FEF9C3',
    border: '#FCD34D',
    cardBg: 'bg-gradient-to-b from-[#FEF9C3] to-[#FEF3C7]',
    cardBorder: 'border-[#FCD34D]',
    numberColor: 'text-[#D97706]',
  },
}

type Tier = keyof typeof TIER_CONFIG

// ── XP Quellen-Karte ──────────────────────────────────────────────

function XpSourceCard({ source }: { source: XpSource }) {
  const Icon = getBadgeIcon(source.iconName)
  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#0A0A0A]" />
        </div>
        <span className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
          {source.xpRange}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#0A0A0A]">{source.label}</p>
        <p className="text-xs text-[#71717A] mt-0.5">{source.description}</p>
      </div>
    </div>
  )
}

// ── Level-Karte ───────────────────────────────────────────────────

function LevelCard({
  row,
  isCurrentLevel,
}: {
  row: LevelRow
  isCurrentLevel: boolean
}) {
  const cfg = TIER_CONFIG[row.tier as Tier]
  return (
    <div
      className={`relative flex-shrink-0 w-[120px] rounded-2xl border-2 p-3 flex flex-col items-center gap-1.5 transition-all duration-200 ${cfg.cardBg} ${cfg.cardBorder}`}
      style={
        isCurrentLevel
          ? { boxShadow: `0 0 0 3px white, 0 0 0 5px ${cfg.color}` }
          : {}
      }
    >
      {isCurrentLevel && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: cfg.color }}
        >
          Du
        </div>
      )}

      {/* Level-Nummer */}
      <span className={`text-2xl font-black ${cfg.numberColor}`}>{row.level}</span>

      {/* Tier-Label */}
      <span
        className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        {cfg.label}
      </span>

      {/* XP ab diesem Level */}
      <div className="text-center mt-1">
        <p className="text-[10px] text-[#A1A1AA]">Gesamt-XP</p>
        <p className="text-xs font-bold text-[#0A0A0A]">
          {row.totalXpNeeded.toLocaleString('de')}
        </p>
      </div>

      {/* XP für nächstes Level */}
      {row.level < 25 && (
        <div className="text-center">
          <p className="text-[9px] text-[#A1A1AA]">Nächstes Lv.</p>
          <p className="text-[10px] font-semibold text-[#71717A]">
            +{row.xpThisLevel.toLocaleString('de')} XP
          </p>
        </div>
      )}

      {row.level === 25 && (
        <p className="text-[9px] font-semibold text-[#D97706] mt-0.5">Max. Level</p>
      )}
    </div>
  )
}

// ── Haupt-Komponente ──────────────────────────────────────────────

interface Props {
  levels: LevelRow[]
  xpSources: XpSource[]
  currentLevel: number
}

export function LevelPageClient({ levels, xpSources, currentLevel }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentCardRef = useRef<HTMLDivElement>(null)

  // Scrolle zum aktuellen Level
  useEffect(() => {
    if (currentCardRef.current && scrollRef.current) {
      const container = scrollRef.current
      const card = currentCardRef.current
      const containerLeft = container.getBoundingClientRect().left
      const cardLeft = card.getBoundingClientRect().left
      const scrollOffset = card.offsetLeft - container.offsetLeft - container.clientWidth / 2 + card.clientWidth / 2
      container.scrollTo({ left: scrollOffset, behavior: 'smooth' })
    }
  }, [])

  // Tier-Gruppen für die Legende
  const tierGroups = [
    { tier: 'common' as Tier, levels: '1–5' },
    { tier: 'rare' as Tier, levels: '6–10' },
    { tier: 'epic' as Tier, levels: '11–20' },
    { tier: 'legendary' as Tier, levels: '21–25' },
  ]

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="bg-[#0A0A0A] px-4 pt-8 pb-6 relative overflow-hidden">
        {/* Abstraktes Rauten-Muster */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="rhombus"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <polygon
                points="20,4 36,20 20,36 4,20"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
              <circle cx="20" cy="20" r="2" fill="white" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rhombus)" />
        </svg>

        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-[#F59E0B]" />
            <h1 className="text-2xl font-black text-white tracking-tight">Level-System</h1>
          </div>
          <p className="text-[#A1A1AA] text-sm">
            25 Level · Verdiene XP durch Training, Ernährung und Community
          </p>

          {currentLevel > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <span className="text-white text-sm font-semibold">
                Dein Level: {currentLevel}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    TIER_CONFIG[
                      levels.find((l) => l.level === currentLevel)?.tier ?? 'common'
                    ].bg,
                  color:
                    TIER_CONFIG[
                      levels.find((l) => l.level === currentLevel)?.tier ?? 'common'
                    ].color,
                }}
              >
                {
                  TIER_CONFIG[
                    levels.find((l) => l.level === currentLevel)?.tier ?? 'common'
                  ].label
                }
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* ── Tier-Legende ─────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-4">
          {tierGroups.map(({ tier, levels: lvRange }) => {
            const cfg = TIER_CONFIG[tier]
            return (
              <div
                key={tier}
                className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="text-[10px]" style={{ color: cfg.color, opacity: 0.7 }}>
                  Lv. {lvRange}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Level-Karten (horizontal scrollbar) ─────────────── */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {levels.map((row) => (
            <div
              key={row.level}
              ref={row.isCurrentLevel ? currentCardRef : undefined}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: row.level * 0.015, duration: 0.25 }}
              >
                <LevelCard row={row} isCurrentLevel={row.isCurrentLevel} />
              </motion.div>
            </div>
          ))}
        </div>

        {/* ── XP-Formel ────────────────────────────────────────── */}
        <div className="mx-4 mt-6 bg-[#0A0A0A] rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <ChevronRight className="w-4 h-4 text-[#F59E0B]" />
            <p className="text-sm font-semibold">XP-Formel</p>
          </div>
          <p className="text-[#A1A1AA] text-xs leading-relaxed">
            Die XP für das nächste Level berechnet sich nach:{' '}
            <span className="text-white font-mono font-bold">Level² × 150</span>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              { lv: 5, xp: '3.750' },
              { lv: 10, xp: '15.000' },
              { lv: 25, xp: '93.750' },
            ].map((ex) => (
              <div key={ex.lv} className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-[10px] text-[#A1A1AA]">Level {ex.lv}</p>
                <p className="text-sm font-bold">{ex.xp} XP</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── XP-Quellen ───────────────────────────────────────── */}
        <div className="px-4 mt-6">
          <h2 className="text-sm font-bold text-[#0A0A0A] mb-3">XP-Quellen</h2>
          <div className="grid grid-cols-2 gap-3">
            {xpSources.map((source) => (
              <XpSourceCard key={source.label} source={source} />
            ))}
          </div>
        </div>

        {/* KI-Disclaimer */}
        <div className="text-center py-8 px-4">
          <p className="text-[10px] text-[#A1A1AA]">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </p>
        </div>
      </div>
    </div>
  )
}
