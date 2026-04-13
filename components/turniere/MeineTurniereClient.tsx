'use client'

// ─────────────────────────────────────────────────────────────────
// components/turniere/MeineTurniereClient.tsx
//
// Meine Turniere – Tabs "Angemeldet" und "Vergangen"
// Countdown · ICS-Download · Abmelden-Dialog · Social-Share
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Download,
  Share2,
  Loader2,
  AlertCircle,
  User,
  Users,
  Shield,
  Shuffle,
  X,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TurnierFormat } from '@/lib/types/turnier'
import { TURNIER_FORMAT_LABELS, LEVEL_LABELS } from '@/lib/types/turnier'

// ── Exported Type (used by server page) ───────────────────────────

export interface MeinTurniereEntry {
  entryId: string
  registeredAt: string
  tournament: {
    id: string
    name: string
    slug: string
    city: string
    startDate: string
    endDate: string
    format: TurnierFormat | null
    level: string
    entryFee: number | null
    maxParticipants: number | null
    currentParticipants: number
    sport: {
      id: string
      name: string
      slug: string
      colorPrimary: string
      colorLight: string
      colorGlow: string
      iconName: string
    }
  }
}

// ── Countdown ─────────────────────────────────────────────────────

interface CountdownState {
  days: number
  hours: number
  isToday: boolean
  isTomorrow: boolean
  isPast: boolean
}

function getTimeDiff(dateIso: string): CountdownState {
  const now = new Date()
  const target = new Date(dateIso)
  const diffMs = target.getTime() - now.getTime()

  if (diffMs <= 0) {
    return { days: 0, hours: 0, isToday: false, isTomorrow: false, isPast: true }
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  // Same calendar day
  const sameDay =
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()

  // Tomorrow calendar day
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow =
    !sameDay &&
    target.getFullYear() === tomorrow.getFullYear() &&
    target.getMonth() === tomorrow.getMonth() &&
    target.getDate() === tomorrow.getDate()

  return { days, hours, isToday: sameDay, isTomorrow, isPast: false }
}

function useCountdown(dateIso: string): CountdownState | null {
  const [state, setState] = useState<CountdownState | null>(null)

  useEffect(() => {
    setState(getTimeDiff(dateIso))
    const id = setInterval(() => setState(getTimeDiff(dateIso)), 60_000)
    return () => clearInterval(id)
  }, [dateIso])

  return state
}

// ── Format Icon ────────────────────────────────────────────────────

function FormatIcon({ format, size = 11 }: { format: TurnierFormat; size?: number }) {
  switch (format) {
    case 'EINZEL':     return <User size={size} />
    case 'DOPPEL':     return <Users size={size} />
    case 'MANNSCHAFT': return <Shield size={size} />
    case 'GEMISCHT':   return <Shuffle size={size} />
  }
}

// ── Date Box ─────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function DateBox({ startIso, colorPrimary }: { startIso: string; colorPrimary: string }) {
  const d = new Date(startIso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTH_SHORT[d.getMonth()] ?? ''
  return (
    <div
      className="w-14 h-14 rounded-lg flex-shrink-0 flex flex-col items-center justify-center text-white select-none"
      style={{ background: colorPrimary }}
    >
      <span className="text-xl font-bold leading-none">{day}</span>
      <span className="text-[10px] font-medium uppercase mt-0.5 opacity-90">{month}</span>
    </div>
  )
}

// ── Countdown Badge ───────────────────────────────────────────────

function CountdownBadge({ dateIso }: { dateIso: string }) {
  const cd = useCountdown(dateIso)

  if (!cd) return null
  if (cd.isPast) return null

  if (cd.isToday) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EF4444] text-white"
      >
        <Clock size={9} />
        Heute!
      </motion.span>
    )
  }

  if (cd.isTomorrow) {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30"
      >
        <Clock size={9} />
        Morgen!
      </motion.span>
    )
  }

  const isUrgent = cd.days <= 2

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        isUrgent
          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25'
          : 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/25',
      )}
    >
      <Clock size={9} />
      Noch {cd.days} Tag{cd.days !== 1 ? 'e' : ''}{cd.hours > 0 ? ` ${cd.hours} Std` : ''}
    </motion.span>
  )
}

// ── Toast ─────────────────────────────────────────────────────────

interface ToastState {
  visible: boolean
  message: string
  type: 'success' | 'error'
}

function useToast() {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' })

  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)
  }, [])

  return { toast, show }
}

function Toast({ toast }: { toast: ToastState }) {
  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white',
            toast.type === 'success' ? 'bg-[#16A34A]' : 'bg-[#EF4444]',
          )}
        >
          {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Abmelden Dialog ───────────────────────────────────────────────

interface AbmeldenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentName: string
  onConfirm: () => Promise<void>
}

function AbmeldenDialog({ open, onOpenChange, tournamentName, onConfirm }: AbmeldenDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Abmelden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#1A1A1A] border border-white/10 p-6 shadow-2xl focus:outline-none"
        >
          <div className="flex items-start justify-between mb-4">
            <Dialog.Title className="text-base font-bold text-white">
              Abmeldung bestätigen
            </Dialog.Title>
            <Dialog.Close className="text-[#71717A] hover:text-white transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-[#A1A1AA] leading-relaxed mb-5">
            Möchtest du dich wirklich von{' '}
            <span className="text-white font-semibold">{tournamentName}</span>{' '}
            abmelden? Eine Abmeldung ist nur bis 24 Stunden vor Turnierbeginn möglich.
          </Dialog.Description>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/50 border border-red-800 mb-4">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Dialog.Close
              className="flex-1 h-10 rounded-xl border border-white/20 text-sm font-medium text-[#A1A1AA] hover:text-white hover:border-white/40 transition-colors"
              disabled={loading}
            >
              Abbrechen
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-[#EF4444] text-sm font-semibold text-white flex items-center justify-center gap-2 hover:bg-[#DC2626] transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Abmelden
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Upcoming TurnierCard ──────────────────────────────────────────

interface UpcomingCardProps {
  entry: MeinTurniereEntry
  onAbgemeldet: (entryId: string) => void
  showToast: (msg: string, type?: 'success' | 'error') => void
}

function UpcomingCard({ entry, onAbgemeldet, showToast }: UpcomingCardProps) {
  const { tournament } = entry
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleAbmelden() {
    const res = await fetch(`/api/turniere/${tournament.id}/abmelden`, { method: 'DELETE' })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? 'Fehler beim Abmelden')
    }
    onAbgemeldet(entry.entryId)
    showToast(`Von "${tournament.name}" abgemeldet`)
  }

  const isToday = (() => {
    const now = new Date()
    const d = new Date(tournament.startDate)
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  })()

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl bg-[#111111] border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
      >
        {/* Sport-Farbstreifen */}
        <div
          className="h-0.5"
          style={{ background: `linear-gradient(90deg, ${tournament.sport.colorPrimary}, transparent)` }}
        />

        <div className="p-4">
          <div className="flex items-start gap-3">
            <DateBox startIso={tournament.startDate} colorPrimary={tournament.sport.colorPrimary} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 justify-between">
                <h3 className="text-[15px] font-semibold text-white leading-tight line-clamp-2">
                  {tournament.name}
                </h3>
                {isToday && (
                  <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444] text-white">
                    HEUTE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 mt-0.5 text-[#71717A] text-xs">
                <MapPin size={11} />
                <span>{tournament.city}</span>
              </div>

              {/* Badges */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: tournament.sport.colorPrimary + '22',
                    color: tournament.sport.colorPrimary,
                  }}
                >
                  {tournament.sport.name}
                </span>

                {tournament.format && (
                  <span className="flex items-center gap-1 text-[11px] text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded-full">
                    <FormatIcon format={tournament.format} />
                    {TURNIER_FORMAT_LABELS[tournament.format]}
                  </span>
                )}

                <span className="flex items-center gap-1 text-[11px] text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded-full">
                  <Trophy size={9} />
                  {LEVEL_LABELS[tournament.level] ?? tournament.level}
                </span>

                {/* Angemeldet-Badge */}
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#16A34A] bg-[#16A34A]/15 px-2 py-0.5 rounded-full border border-[#16A34A]/25">
                  <CheckCircle size={9} />
                  Angemeldet
                </span>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <CountdownBadge dateIso={tournament.startDate} />

            <div className="flex items-center gap-2 ml-auto">
              {/* ICS Download */}
              <a
                href={`/api/turniere/${tournament.slug}/kalender`}
                download
                className="flex items-center gap-1 h-8 px-3 rounded-lg border border-white/15 text-xs font-medium text-[#A1A1AA] hover:text-white hover:border-white/30 transition-colors"
                title="Zum Kalender hinzufügen"
              >
                <Download size={12} />
                <span className="hidden sm:inline">Kalender</span>
              </a>

              {/* Details-Link */}
              <Link
                href={`/turniere/${tournament.slug}`}
                className="flex items-center h-8 px-3 rounded-lg text-xs font-semibold border transition-colors hover:opacity-80"
                style={{
                  borderColor: tournament.sport.colorPrimary + '60',
                  color: tournament.sport.colorPrimary,
                }}
              >
                Details
              </Link>

              {/* Abmelden */}
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="flex items-center h-8 px-3 rounded-lg border border-white/10 text-xs font-medium text-[#71717A] hover:text-[#EF4444] hover:border-[#EF4444]/40 transition-colors"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AbmeldenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tournamentName={tournament.name}
        onConfirm={handleAbmelden}
      />
    </>
  )
}

// ── Past TurnierCard ──────────────────────────────────────────────

interface PastCardProps {
  entry: MeinTurniereEntry
  showToast: (msg: string, type?: 'success' | 'error') => void
}

function PastCard({ entry, showToast }: PastCardProps) {
  const { tournament } = entry
  const [shareLoading, setShareLoading] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/turniere/${tournament.slug}`
    const text = `Ich habe am "${tournament.name}" in ${tournament.city} teilgenommen! #SportRise`

    if (navigator.share) {
      setShareLoading(true)
      try {
        await navigator.share({ title: tournament.name, text, url })
      } catch {
        // user cancelled share
      } finally {
        setShareLoading(false)
      }
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link kopiert!')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-xl bg-[#0D0D0D] border border-white/8 overflow-hidden opacity-75"
    >
      {/* Sport-Farbstreifen (gedimmt) */}
      <div
        className="h-0.5 opacity-40"
        style={{ background: tournament.sport.colorPrimary }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <DateBox startIso={tournament.startDate} colorPrimary={tournament.sport.colorPrimary + '80'} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between">
              <h3 className="text-[15px] font-semibold text-white/60 leading-tight line-clamp-2">
                {tournament.name}
              </h3>
              <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/8 text-[#71717A] border border-white/10">
                Vergangen
              </span>
            </div>

            <div className="flex items-center gap-1 mt-0.5 text-[#52525B] text-xs">
              <MapPin size={11} />
              <span>{tournament.city}</span>
            </div>

            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full opacity-60"
                style={{
                  backgroundColor: tournament.sport.colorPrimary + '22',
                  color: tournament.sport.colorPrimary,
                }}
              >
                {tournament.sport.name}
              </span>

              {tournament.format && (
                <span className="flex items-center gap-1 text-[11px] text-[#52525B] bg-white/5 px-2 py-0.5 rounded-full">
                  <FormatIcon format={tournament.format} />
                  {TURNIER_FORMAT_LABELS[tournament.format]}
                </span>
              )}

              <span className="flex items-center gap-1 text-[11px] text-[#52525B] bg-white/5 px-2 py-0.5 rounded-full">
                <Trophy size={9} />
                {LEVEL_LABELS[tournament.level] ?? tournament.level}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <Link
            href={`/turniere/${tournament.slug}`}
            className="flex items-center h-8 px-3 rounded-lg border border-white/10 text-xs font-medium text-[#71717A] hover:text-white hover:border-white/25 transition-colors"
          >
            Details
          </Link>

          <button
            type="button"
            onClick={handleShare}
            disabled={shareLoading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/10 text-xs font-medium text-[#A1A1AA] hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
          >
            {shareLoading ? <Loader2 size={11} className="animate-spin" /> : <Share2 size={11} />}
            Teilen
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Empty State ───────────────────────────────────────────────────

function EmptyState({ tab }: { tab: 'upcoming' | 'vergangen' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Trophy size={28} className="text-[#52525B]" strokeWidth={1.5} />
      </div>
      <p className="text-[#A1A1AA] font-semibold text-base mb-1">
        {tab === 'upcoming' ? 'Noch keine Anmeldungen' : 'Keine vergangenen Turniere'}
      </p>
      <p className="text-[#52525B] text-sm max-w-xs leading-relaxed">
        {tab === 'upcoming'
          ? 'Entdecke Turniere in deiner Nähe und melde dich an.'
          : 'Hier erscheinen Turniere, an denen du bereits teilgenommen hast.'}
      </p>
      {tab === 'upcoming' && (
        <Link
          href="/turniere"
          className="mt-6 flex items-center gap-2 h-10 px-6 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #16A34A, #15803D)',
            boxShadow: '0 4px 20px rgba(22,163,74,0.25)',
          }}
        >
          <Trophy size={14} />
          Turniersuche
        </Link>
      )}
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────

interface Props {
  upcoming: MeinTurniereEntry[]
  vergangen: MeinTurniereEntry[]
}

export default function MeineTurniereClient({ upcoming: initialUpcoming, vergangen }: Props) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'vergangen'>('upcoming')
  const [upcoming, setUpcoming] = useState(initialUpcoming)
  const { toast, show: showToast } = useToast()

  function handleAbgemeldet(entryId: string) {
    setUpcoming((prev) => prev.filter((e) => e.entryId !== entryId))
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── Dark Header ── */}
      <div className="border-b border-white/8 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white tracking-tight">Meine Turniere.</h1>
          <p className="mt-2 text-[#71717A] text-sm">
            Deine aktuellen und vergangenen Turnier-Anmeldungen.
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-white/8 px-6">
        <div className="max-w-2xl mx-auto flex gap-0">
          {(
            [
              { id: 'upcoming', label: 'Angemeldet', count: upcoming.length },
              { id: 'vergangen', label: 'Vergangen', count: vergangen.length },
            ] as const
          ).map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors',
                activeTab === id ? 'text-white' : 'text-[#71717A] hover:text-[#A1A1AA]',
              )}
            >
              {label}
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors',
                  activeTab === id
                    ? 'bg-white/15 text-white'
                    : 'bg-white/5 text-[#52525B]',
                )}
              >
                {count}
              </span>
              {activeTab === id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'upcoming' ? (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              {upcoming.length === 0 ? (
                <EmptyState tab="upcoming" />
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {upcoming.map((entry) => (
                      <UpcomingCard
                        key={entry.entryId}
                        entry={entry}
                        onAbgemeldet={handleAbgemeldet}
                        showToast={showToast}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="vergangen"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
            >
              {vergangen.length === 0 ? (
                <EmptyState tab="vergangen" />
              ) : (
                <div className="space-y-3">
                  {vergangen.map((entry) => (
                    <PastCard key={entry.entryId} entry={entry} showToast={showToast} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KI-Hinweis */}
      <p className="text-center text-[10px] text-[#3F3F46] pb-10">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>

      <Toast toast={toast} />
    </div>
  )
}
