'use client'

// ─────────────────────────────────────────────────────────────────
// components/vereine/VereinCard.tsx
//
// Exports:
//   - VereinCardSkeleton  (Lade-Placeholder)
//   - VereinCard          (Haupt-Karte)
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck,
  Globe,
  Phone,
  MapPin,
  ChevronDown,
  ChevronRight,
  Euro,
  Users,
  CalendarDays,
  Navigation,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { VereinListItem } from '@/lib/types/verein'

// ── Skeleton ─────────────────────────────────────────────────────

export function VereinCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white overflow-hidden animate-pulse">
      {/* Gradient-Streifen */}
      <div className="h-1.5 bg-[#E4E4E7]" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo Placeholder */}
          <div className="w-12 h-12 rounded-xl bg-[#F4F4F5] flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-[#F4F4F5] rounded w-3/4" />
            <div className="h-3 bg-[#F4F4F5] rounded w-1/2" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-6 bg-[#F4F4F5] rounded-full w-20" />
          <div className="h-6 bg-[#F4F4F5] rounded-full w-16" />
        </div>
      </div>
    </div>
  )
}

// ── Initialen-Fallback ────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ── VereinCard ────────────────────────────────────────────────────

interface VereinCardProps {
  verein: VereinListItem
  isSelected?: boolean
  onClick?: () => void
}

export function VereinCard({ verein, isSelected = false, onClick }: VereinCardProps) {
  const [expanded, setExpanded] = useState(false)

  const { sport } = verein
  const initials = getInitials(verein.name)

  // Gradient-Streifen oben
  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(90deg, ${sport.colorPrimary} 0%, ${sport.colorGlow} 100%)`,
  }

  // Distanz formatieren
  const distanceLabel =
    verein.distanceKm !== null
      ? verein.distanceKm < 1
        ? '< 1 km'
        : `${verein.distanceKm.toFixed(1)} km`
      : null

  // Monatsbeitrag formatieren
  const feeLabel =
    verein.monthlyFee === null
      ? 'Kostenlos / auf Anfrage'
      : verein.monthlyFee === 0
        ? 'Kostenlos'
        : `${verein.monthlyFee.toFixed(0)} €/Monat`

  // Altersbereich formatieren
  const ageLabel =
    verein.ageMin !== null && verein.ageMax !== null
      ? `${verein.ageMin}–${verein.ageMax} Jahre`
      : verein.ageMin !== null
        ? `Ab ${verein.ageMin} Jahren`
        : verein.ageMax !== null
          ? `Bis ${verein.ageMax} Jahre`
          : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'rounded-xl border bg-white overflow-hidden cursor-pointer transition-shadow duration-150',
        isSelected
          ? 'border-[var(--sport-primary,#16A34A)] shadow-md ring-1 ring-[var(--sport-primary,#16A34A)]'
          : 'border-[#E4E4E7] hover:shadow-md hover:border-[#D4D4D8]',
      )}
      onClick={onClick}
    >
      {/* Farbstreifen */}
      <div className="h-1.5" style={gradientStyle} />

      <div className="p-4">
        {/* Header: Logo + Name + Badges */}
        <div className="flex items-start gap-3">
          {/* Logo oder Initialen */}
          <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden border border-[#E4E4E7]">
            {verein.logoUrl ? (
              <Image
                src={verein.logoUrl}
                alt={verein.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: sport.colorPrimary }}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Name + Stadt */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[15px] font-semibold text-[#0A0A0A] leading-tight truncate">
                {verein.name}
              </h3>
              {verein.isVerified && (
                <ShieldCheck
                  size={15}
                  className="flex-shrink-0 text-[var(--sport-primary,#16A34A)]"
                  aria-label="Verifizierter Verein"
                />
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-[#71717A] text-xs">
              <MapPin size={11} />
              <span>
                {verein.city}
                {distanceLabel ? ` · ${distanceLabel}` : ''}
              </span>
            </div>
          </div>

          {/* Distanz-Badge */}
          {distanceLabel && (
            <span
              className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
              style={{
                backgroundColor: sport.colorLight,
                color: sport.colorPrimary,
              }}
            >
              <Navigation size={10} />
              {distanceLabel}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {/* Monatsbeitrag */}
          <span className="flex items-center gap-1 text-xs text-[#52525B] bg-[#F4F4F5] px-2 py-1 rounded-full">
            <Euro size={11} />
            {feeLabel}
          </span>

          {/* Jugendteam */}
          {verein.hasYouthTeam && (
            <span className="flex items-center gap-1 text-xs text-[#52525B] bg-[#F4F4F5] px-2 py-1 rounded-full">
              <Users size={11} />
              Jugendteam
            </span>
          )}

          {/* Altersbereich */}
          {ageLabel && (
            <span className="flex items-center gap-1 text-xs text-[#52525B] bg-[#F4F4F5] px-2 py-1 rounded-full">
              <CalendarDays size={11} />
              {ageLabel}
            </span>
          )}
        </div>

        {/* Expand-Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((p) => !p)
          }}
          className="mt-3 w-full flex items-center justify-between text-xs text-[#71717A] hover:text-[#52525B] transition-colors group"
        >
          <span className="group-hover:underline">Details {expanded ? 'ausblenden' : 'anzeigen'}</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} />
          </motion.div>
        </button>

        {/* Expandierbare Details */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-2 border-t border-[#F4F4F5] mt-2">
                {verein.description && (
                  <p className="text-xs text-[#52525B] leading-relaxed line-clamp-3">
                    {verein.description}
                  </p>
                )}
                {verein.website && (
                  <a
                    href={verein.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-[var(--sport-primary,#16A34A)] hover:underline"
                  >
                    <Globe size={12} />
                    {verein.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {verein.phone && (
                  <a
                    href={`tel:${verein.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-[#52525B] hover:text-[#0A0A0A]"
                  >
                    <Phone size={12} />
                    {verein.phone}
                  </a>
                )}
                {!verein.description && !verein.website && !verein.phone && (
                  <p className="text-xs text-[#A1A1AA] italic">Keine weiteren Details verfügbar.</p>
                )}
                <Link
                  href={`/vereine/${verein.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-opacity hover:opacity-80 mt-1"
                  style={{ borderColor: sport.colorPrimary, color: sport.colorPrimary }}
                >
                  Verein ansehen
                  <ChevronRight size={12} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
