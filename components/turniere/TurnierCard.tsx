'use client'

// ─────────────────────────────────────────────────────────────────
// components/turniere/TurnierCard.tsx
//
// Exports:
//   - TurnierCardSkeleton  (Lade-Placeholder)
//   - TurnierCard          (Haupt-Karte)
// ─────────────────────────────────────────────────────────────────

import Link from 'next/link'
import {
  MapPin,
  Trophy,
  CheckCircle,
  User,
  Users,
  Shield,
  Shuffle,
  Calendar,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { TurnierListItem, TurnierFormat } from '@/lib/types/turnier'
import { TURNIER_FORMAT_LABELS, LEVEL_LABELS } from '@/lib/types/turnier'

// ── Datum-Formatierung ────────────────────────────────────────────

const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function formatDateBox(startIso: string, endIso: string): { day: string; month: string; multiDay: boolean } {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  if (sameDay) {
    return {
      day: String(start.getDate()).padStart(2, '0'),
      month: MONTH_SHORT[start.getMonth()] ?? '',
      multiDay: false,
    }
  }

  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()
  if (sameMonth) {
    return {
      day: `${start.getDate()}–${end.getDate()}`,
      month: MONTH_SHORT[start.getMonth()] ?? '',
      multiDay: true,
    }
  }

  return {
    day: `${start.getDate()} – ${end.getDate()}`,
    month: `${MONTH_SHORT[start.getMonth()]} / ${MONTH_SHORT[end.getMonth()]}`,
    multiDay: true,
  }
}

// ── Format-Icon ───────────────────────────────────────────────────

function FormatIcon({ format, size = 11 }: { format: TurnierFormat; size?: number }) {
  switch (format) {
    case 'EINZEL':
      return <User size={size} />
    case 'DOPPEL':
      return <Users size={size} />
    case 'MANNSCHAFT':
      return <Shield size={size} />
    case 'GEMISCHT':
      return <Shuffle size={size} />
  }
}

// ── Skeleton ─────────────────────────────────────────────────────

export function TurnierCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white overflow-hidden animate-pulse">
      <div className="h-1 bg-[#E4E4E7]" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-lg bg-[#F4F4F5] flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2 pt-1">
            <div className="h-4 bg-[#F4F4F5] rounded w-3/4" />
            <div className="h-3 bg-[#F4F4F5] rounded w-1/2" />
            <div className="flex gap-2 mt-2">
              <div className="h-5 bg-[#F4F4F5] rounded-full w-16" />
              <div className="h-5 bg-[#F4F4F5] rounded-full w-14" />
              <div className="h-5 bg-[#F4F4F5] rounded-full w-20" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="h-4 bg-[#F4F4F5] rounded w-24" />
          <div className="h-7 bg-[#F4F4F5] rounded-lg w-20" />
        </div>
      </div>
    </div>
  )
}

// ── TurnierCard ───────────────────────────────────────────────────

interface TurnierCardProps {
  turnier: TurnierListItem
}

export function TurnierCard({ turnier }: TurnierCardProps) {
  const { sport } = turnier
  const dateBox = formatDateBox(turnier.startDate, turnier.endDate)
  const freeSpots =
    turnier.maxParticipants !== null
      ? turnier.maxParticipants - turnier.currentParticipants
      : null
  const isSoldOut = freeSpots !== null && freeSpots <= 0
  const isLowSpots = freeSpots !== null && freeSpots > 0 && freeSpots < 5
  const fillPercent =
    turnier.maxParticipants !== null && turnier.maxParticipants > 0
      ? Math.min(100, Math.round((turnier.currentParticipants / turnier.maxParticipants) * 100))
      : null

  const distanceLabel =
    turnier.distanceKm !== null
      ? turnier.distanceKm < 1
        ? '< 1 km'
        : `${turnier.distanceKm.toFixed(1)} km`
      : null

  const feeLabel =
    turnier.entryFee === null || turnier.entryFee === 0
      ? 'Kostenlos'
      : `${turnier.entryFee.toFixed(0)} €`

  const isFree = turnier.entryFee === null || turnier.entryFee === 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-[#E4E4E7] bg-white overflow-hidden hover:shadow-md hover:border-[#D4D4D8] transition-shadow duration-150"
    >
      {/* 4px Farbstreifen oben */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${sport.colorPrimary} 0%, ${sport.colorGlow} 100%)`,
        }}
      />

      {/* Angemeldet-Banner */}
      {turnier.isRegistered && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-[#DCFCE7] text-[#15803D] text-xs font-medium">
          <CheckCircle size={13} />
          Du bist angemeldet
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 64×64 Datum-Box */}
          <div
            className="w-16 h-16 rounded-lg flex-shrink-0 flex flex-col items-center justify-center text-white select-none"
            style={{ background: sport.colorPrimary }}
          >
            <span
              className={cn(
                'font-bold leading-none',
                dateBox.multiDay ? 'text-[11px]' : 'text-2xl',
              )}
            >
              {dateBox.day}
            </span>
            <span className="text-[10px] font-medium uppercase mt-0.5 opacity-90">
              {dateBox.month}
            </span>
          </div>

          {/* Name + Stadt */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-[#0A0A0A] leading-tight line-clamp-2">
                {turnier.name}
              </h3>
              {isSoldOut && (
                <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  Ausgebucht
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-[#71717A] text-xs">
              <MapPin size={11} />
              <span>
                {turnier.city}
                {distanceLabel ? ` · ${distanceLabel}` : ''}
              </span>
            </div>

            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {/* Sport-Badge */}
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: sport.colorLight, color: sport.colorPrimary }}
              >
                {sport.name}
              </span>

              {/* Format-Badge */}
              {turnier.format && (
                <span className="flex items-center gap-1 text-[11px] text-[#52525B] bg-[#F4F4F5] px-2 py-0.5 rounded-full">
                  <FormatIcon format={turnier.format} />
                  {TURNIER_FORMAT_LABELS[turnier.format]}
                </span>
              )}

              {/* Alters-Badge */}
              {(turnier.ageMin !== null || turnier.ageMax !== null) && (
                <span className="flex items-center gap-1 text-[11px] text-[#52525B] bg-[#F4F4F5] px-2 py-0.5 rounded-full">
                  <Calendar size={11} />
                  {turnier.ageMin !== null && turnier.ageMax !== null
                    ? `${turnier.ageMin}–${turnier.ageMax} Jahre`
                    : turnier.ageMin !== null
                      ? `Ab ${turnier.ageMin} Jahren`
                      : `Bis ${turnier.ageMax} Jahre`}
                </span>
              )}

              {/* Level-Badge */}
              <span className="flex items-center gap-1 text-[11px] text-[#52525B] bg-[#F4F4F5] px-2 py-0.5 rounded-full">
                <Trophy size={11} />
                {LEVEL_LABELS[turnier.level] ?? turnier.level}
              </span>
            </div>
          </div>
        </div>

        {/* Preis + Fortschrittsbalken + Link */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Preis */}
            <p
              className={cn(
                'text-sm font-semibold',
                isFree ? 'text-[#16A34A]' : 'text-[#0A0A0A]',
              )}
            >
              {feeLabel}
            </p>

            {/* Fortschrittsbalken */}
            {fillPercent !== null && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full rounded-full bg-[#F4F4F5] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      isLowSpots || isSoldOut ? 'bg-red-500' : 'bg-[var(--sport-primary,#16A34A)]',
                    )}
                    style={{
                      width: `${fillPercent}%`,
                      '--sport-primary': sport.colorPrimary,
                    } as React.CSSProperties}
                  />
                </div>
                <p className="text-[10px] text-[#71717A] mt-0.5">
                  {isSoldOut
                    ? 'Ausgebucht'
                    : isLowSpots
                      ? `Noch ${freeSpots} Platz${freeSpots === 1 ? '' : 'e'} frei`
                      : `${turnier.currentParticipants} / ${turnier.maxParticipants} Teilnehmer`}
                </p>
              </div>
            )}
          </div>

          {/* Details-Link */}
          <Link
            href={`/turniere/${turnier.slug}`}
            className="flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: sport.colorPrimary, color: sport.colorPrimary }}
          >
            Details →
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
