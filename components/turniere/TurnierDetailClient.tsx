'use client'

// ─────────────────────────────────────────────────────────────────
// components/turniere/TurnierDetailClient.tsx
//
// Haupt-Client-Komponente für Turnier-Detailseite.
// Hero + Sticky-Anmelde-Box + Inhalt + Anmelde-Modal.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Bell,
  Calendar,
  Phone,
  Trophy,
  Building2,
  ShieldCheck,
  GitBranch,
  Award,
  ChevronRight,
  X,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TurnierDetail } from '@/app/api/turniere/[id]/route'
import { LEVEL_LABELS, TURNIER_FORMAT_LABELS } from '@/lib/types/turnier'

// ── Sport-Konfig ─────────────────────────────────────────────────

const SPORT_HERO_PHOTOS: Record<string, string> = {
  fussball: 'photo-1529900748604-07564a03e7a6',
  tennis: 'photo-1554068865-24cecd4e34b8',
  basketball: 'photo-1559692048-79a3f837883d',
}

// ── Toast ────────────────────────────────────────────────────────

interface ToastState {
  message: string
  type: 'success' | 'error'
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]',
        'px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2.5',
        toast.type === 'success'
          ? 'bg-[#16A34A] text-white'
          : 'bg-[#EF4444] text-white',
      )}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 size={16} />
      ) : (
        <XCircle size={16} />
      )}
      {toast.message}
    </motion.div>
  )
}

// ── Fortschrittsbalken ───────────────────────────────────────────

function PlatzBalken({
  current,
  max,
}: {
  current: number
  max: number | null
}) {
  if (max === null) return null
  const pct = Math.min(100, Math.round((current / max) * 100))
  const color =
    pct >= 80 ? '#EF4444' : pct >= 50 ? '#F59E0B' : '#16A34A'
  const frei = max - current

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-[#71717A] mb-1.5">
        <span>{current} angemeldet</span>
        <span>{frei} Plätze frei</span>
      </div>
      <div className="h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Anmelde-Modal ────────────────────────────────────────────────

interface AnmeldeModalProps {
  open: boolean
  onClose: () => void
  turnier: TurnierDetail
  onConfirm: () => Promise<void>
  loading: boolean
}

function AnmeldeModal({
  open,
  onClose,
  turnier,
  onConfirm,
  loading,
}: AnmeldeModalProps) {
  const [accepted, setAccepted] = useState(false)

  const startFormatted = new Date(turnier.startDate).toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]',
            'w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 focus:outline-none',
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-xl font-bold text-[#09090B]">
              Anmeldung bestätigen
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors"
                aria-label="Schließen"
              >
                <X size={18} className="text-[#71717A]" />
              </button>
            </Dialog.Close>
          </div>

          {/* Zusammenfassung */}
          <div className="bg-[#F9FAFB] border border-[#E4E4E7] rounded-xl p-4 mb-4 space-y-2">
            <p className="font-semibold text-[#09090B]">{turnier.name}</p>
            <div className="flex items-center gap-2 text-sm text-[#52525B]">
              <Calendar size={14} />
              <span>{startFormatted}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#52525B]">
              <MapPin size={14} />
              <span>{turnier.city}</span>
            </div>
            {turnier.entryFee !== null && turnier.entryFee > 0 && (
              <div className="flex items-center gap-2 text-sm font-semibold text-[#09090B]">
                <Trophy size={14} />
                <span>Startgebühr: {turnier.entryFee.toFixed(2)} €</span>
              </div>
            )}
          </div>

          {/* Kostenpflichtiger Hinweis */}
          {turnier.entryFee !== null && turnier.entryFee > 0 && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3 mb-4 text-sm text-[#92400E]">
              <AlertCircle size={14} className="inline mr-1.5 mb-0.5" />
              Die Startgebühr von{' '}
              <strong>{turnier.entryFee.toFixed(2)} €</strong> wird
              direkt mit dem Veranstalter abgerechnet.
            </div>
          )}

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-5">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 accent-[#16A34A]"
            />
            <span className="text-sm text-[#52525B]">
              Ich akzeptiere die{' '}
              <Link
                href="/agb"
                target="_blank"
                className="text-[#16A34A] underline underline-offset-2"
              >
                Teilnahmebedingungen
              </Link>{' '}
              und melde mich verbindlich an.
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <button
                className="flex-1 h-11 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:bg-[#F4F4F5] transition-colors"
                disabled={loading}
              >
                Abbrechen
              </button>
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={!accepted || loading}
              className={cn(
                'flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all',
                accepted && !loading
                  ? 'bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98]'
                  : 'bg-[#A1A1AA] cursor-not-allowed',
              )}
            >
              {loading ? 'Wird angemeldet…' : 'Verbindlich anmelden'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────

interface Props {
  turnier: TurnierDetail
  isLoggedIn: boolean
}

export default function TurnierDetailClient({ turnier, isLoggedIn }: Props) {
  const [isRegistered, setIsRegistered] = useState(turnier.isRegistered)
  const [myEntry, setMyEntry] = useState(turnier.myEntry)
  const [currentParticipants, setCurrentParticipants] = useState(
    turnier.currentParticipants,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [loadingAnmelden, setLoadingAnmelden] = useState(false)
  const [loadingAbmelden, setLoadingAbmelden] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [xpAnim, setXpAnim] = useState(false)

  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setToast({ message, type })
  }, [])

  const sportSlug = turnier.sport.slug
  const sportColor = turnier.sport.colorPrimary
  const heroPhoto = SPORT_HERO_PHOTOS[sportSlug] ?? SPORT_HERO_PHOTOS['fussball']

  // ── Anmelden ────────────────────────────────────────────────────
  const handleAnmelden = async () => {
    setLoadingAnmelden(true)
    try {
      const res = await fetch(`/api/turniere/${turnier.slug}/anmelden`, {
        method: 'POST',
      })
      const data = (await res.json()) as {
        success?: boolean
        error?: string
        registeredAt?: string
        teamName?: string | null
        notes?: string | null
      }
      if (!res.ok) {
        showToast(data.error ?? 'Anmeldung fehlgeschlagen', 'error')
        return
      }
      setIsRegistered(true)
      setMyEntry({
        registeredAt: data.registeredAt ?? new Date().toISOString(),
        teamName: data.teamName ?? null,
        notes: data.notes ?? null,
      })
      setCurrentParticipants((p) => p + 1)
      setModalOpen(false)
      showToast('Erfolgreich angemeldet! +200 XP', 'success')
      setXpAnim(true)
      setTimeout(() => setXpAnim(false), 1500)
    } finally {
      setLoadingAnmelden(false)
    }
  }

  // ── Abmelden ────────────────────────────────────────────────────
  const handleAbmelden = async () => {
    setLoadingAbmelden(true)
    try {
      const res = await fetch(`/api/turniere/${turnier.slug}/abmelden`, {
        method: 'DELETE',
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok) {
        showToast(data.error ?? 'Abmeldung fehlgeschlagen', 'error')
        return
      }
      setIsRegistered(false)
      setMyEntry(null)
      setCurrentParticipants((p) => Math.max(0, p - 1))
      showToast('Erfolgreich abgemeldet', 'success')
    } finally {
      setLoadingAbmelden(false)
    }
  }

  // ── Abmeldung erlaubt? ───────────────────────────────────────────
  const canUnregister = (() => {
    const cutoff = new Date(turnier.startDate).getTime() - 24 * 60 * 60 * 1000
    return Date.now() < cutoff
  })()

  // ── Status-Checks ────────────────────────────────────────────────
  const isOpen = turnier.status === 'REGISTRATION_OPEN'
  const isFull =
    turnier.maxParticipants !== null &&
    currentParticipants >= turnier.maxParticipants
  const deadlinePassed =
    turnier.registrationDeadline !== null &&
    new Date(turnier.registrationDeadline) < new Date()
  const spotsLeft =
    turnier.maxParticipants !== null
      ? turnier.maxParticipants - currentParticipants
      : null

  // Deadline-Farbe
  const deadlineIsUrgent = (() => {
    if (!turnier.registrationDeadline) return false
    const diff = new Date(turnier.registrationDeadline).getTime() - Date.now()
    return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000
  })()

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      {/* XP-Animation */}
      <AnimatePresence>
        {xpAnim && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -60 }}
            exit={{}}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="fixed top-24 right-8 z-[300] text-2xl font-black text-[#16A34A] pointer-events-none select-none"
          >
            +200 XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Anmelde-Modal */}
      <AnmeldeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        turnier={turnier}
        onConfirm={handleAnmelden}
        loading={loadingAnmelden}
      />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ height: 260 }}
        data-sport={sportSlug}
      >
        {/* Layer 1 – Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${sportColor}dd 0%, ${sportColor}88 100%)`,
          }}
        />
        {/* Layer 2 – Unsplash-Foto (12% Opacity) */}
        <Image
          src={`https://images.unsplash.com/${heroPhoto}?w=1400&q=80`}
          alt=""
          fill
          className="object-cover"
          style={{ opacity: 0.12 }}
          aria-hidden
          priority
        />
        {/* Layer 3 – Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end px-6 pb-7 max-w-6xl mx-auto">
          {/* Datum-Chip */}
          <div className="inline-flex items-center gap-1.5 mb-3">
            <span className="bg-white/15 text-white text-sm font-medium rounded-full px-4 py-1.5">
              {new Date(turnier.startDate).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Name */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-0 leading-tight">
            {turnier.name}
          </h1>

          {/* Stadt */}
          <div className="flex items-center gap-1.5 mt-2">
            <MapPin size={16} className="text-white/60" />
            <span className="text-white/80 text-sm">{turnier.city}</span>
          </div>

          {/* Badge-Reihe */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full px-3 py-1">
              {turnier.sport.name}
            </span>
            {turnier.format && (
              <span className="bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full px-3 py-1">
                {TURNIER_FORMAT_LABELS[turnier.format]}
              </span>
            )}
            {(turnier.ageMin !== null || turnier.ageMax !== null) && (
              <span className="bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full px-3 py-1">
                {turnier.ageMin ?? 0}–{turnier.ageMax ?? 99} Jahre
              </span>
            )}
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full px-3 py-1">
              {LEVEL_LABELS[turnier.level] ?? turnier.level}
            </span>
            {turnier.status === 'REGISTRATION_OPEN' && (
              <span className="flex items-center gap-1 bg-[#16A34A]/80 backdrop-blur-sm text-white text-xs font-medium rounded-full px-3 py-1">
                <ShieldCheck size={12} />
                Anmeldung offen
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Hauptbereich ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Linker Content ──────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Beschreibung */}
            {turnier.description && (
              <section className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
                <h2 className="text-base font-semibold text-[#09090B] mb-3">
                  Über das Turnier
                </h2>
                <p className="text-sm text-[#52525B] leading-relaxed whitespace-pre-line">
                  {turnier.description}
                </p>
              </section>
            )}

            {/* Sport-spezifische Details */}
            <SportDetails turnier={turnier} />

            {/* Teilnehmer */}
            {turnier.participants.length > 0 && (
              <section className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[#09090B]">
                    Angemeldete Teilnehmer
                  </h2>
                  <span className="text-xs text-[#71717A]">
                    {currentParticipants}{' '}
                    {turnier.maxParticipants ? `/ ${turnier.maxParticipants}` : ''} angemeldet
                  </span>
                </div>
                <div className="space-y-2">
                  {turnier.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 py-2"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#F4F4F5] overflow-hidden flex-shrink-0">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name ?? ''}
                            width={36}
                            height={36}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#71717A]">
                            {(p.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#09090B] truncate">
                          {p.name ?? 'Anonym'}
                        </p>
                        {p.username && (
                          <p className="text-xs text-[#71717A] truncate">
                            @{p.username}
                          </p>
                        )}
                      </div>
                      {p.sportSlug && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${sportColor}18`,
                            color: sportColor,
                          }}
                        >
                          {p.sportSlug}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* KI-Hinweis */}
            <p className="text-xs text-[#A1A1AA] text-center py-2">
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </div>

          {/* ── Sticky Anmelde-Box ──────────────────────────────── */}
          <aside className="lg:w-80 xl:w-88 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <AnmeldeBox
                turnier={turnier}
                isLoggedIn={isLoggedIn}
                isRegistered={isRegistered}
                myEntry={myEntry}
                currentParticipants={currentParticipants}
                isOpen={isOpen}
                isFull={isFull}
                deadlinePassed={deadlinePassed}
                spotsLeft={spotsLeft}
                deadlineIsUrgent={deadlineIsUrgent}
                canUnregister={canUnregister}
                loadingAnmelden={loadingAnmelden}
                loadingAbmelden={loadingAbmelden}
                onAnmelden={() => setModalOpen(true)}
                onAbmelden={handleAbmelden}
                sportColor={sportColor}
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

// ── Sport-spezifische Details ────────────────────────────────────

function SportDetails({ turnier }: { turnier: TurnierDetail }) {
  const slug = turnier.sport.slug
  const details = {} as Record<string, string>

  // Details aus JSON extrahieren
  // (turnier.rules, format, ageMin/ageMax kommen als Top-Level-Felder)

  if (slug === 'fussball') {
    return (
      <section className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-[#09090B] mb-4">
          Turnier-Details
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {turnier.format && (
            <DetailCard
              icon={<GitBranch size={16} />}
              label="Spielmodus"
              value={TURNIER_FORMAT_LABELS[turnier.format]}
            />
          )}
          <DetailCard
            icon={<CheckCircle2 size={16} />}
            label="Niveau"
            value={LEVEL_LABELS[turnier.level] ?? turnier.level}
          />
          {turnier.rules && (
            <DetailCard
              icon={<Award size={16} />}
              label="Regeln"
              value={turnier.rules}
              className="col-span-2"
            />
          )}
        </div>
        {Object.keys(details).length > 0 && null}
      </section>
    )
  }

  if (slug === 'tennis') {
    const belagColors: Record<string, { bg: string; text: string; label: string }> = {
      sand: { bg: '#FEF3C7', text: '#B45309', label: 'Sand' },
      hart: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Hart' },
      rasen: { bg: '#DCFCE7', text: '#15803D', label: 'Rasen' },
      halle: { bg: '#F3F4F6', text: '#374151', label: 'Halle' },
    }
    const belagRaw = (turnier.rules ?? '').toLowerCase()
    const belagMatch = Object.entries(belagColors).find(([k]) =>
      belagRaw.includes(k),
    )
    const belag = belagMatch ? belagMatch[1] : null

    return (
      <section className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-[#09090B] mb-4">
          Turnier-Details
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {belag && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#71717A]">Belag</span>
              <span
                className="text-sm font-semibold px-3 py-1 rounded-lg inline-block"
                style={{ backgroundColor: belag.bg, color: belag.text }}
              >
                {belag.label}
              </span>
            </div>
          )}
          {turnier.format && (
            <DetailCard
              icon={<Award size={16} />}
              label="Format"
              value={TURNIER_FORMAT_LABELS[turnier.format]}
            />
          )}
          <DetailCard
            icon={<Award size={16} />}
            label="Niveau"
            value={LEVEL_LABELS[turnier.level] ?? turnier.level}
          />
        </div>
      </section>
    )
  }

  if (slug === 'basketball') {
    return (
      <section className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-[#09090B] mb-4">
          Turnier-Details
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {turnier.format && (
            <DetailCard
              icon={<GitBranch size={16} />}
              label="Spielformat"
              value={TURNIER_FORMAT_LABELS[turnier.format]}
            />
          )}
          <DetailCard
            icon={<CheckCircle2 size={16} />}
            label="Niveau"
            value={LEVEL_LABELS[turnier.level] ?? turnier.level}
          />
        </div>
      </section>
    )
  }

  // Fallback
  if (!turnier.rules && !turnier.format) return null

  return (
    <section className="bg-white border border-[#E4E4E7] rounded-2xl p-6">
      <h2 className="text-base font-semibold text-[#09090B] mb-4">
        Turnier-Details
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {turnier.format && (
          <DetailCard
            icon={<GitBranch size={16} />}
            label="Format"
            value={TURNIER_FORMAT_LABELS[turnier.format]}
          />
        )}
        <DetailCard
          icon={<Award size={16} />}
          label="Niveau"
          value={LEVEL_LABELS[turnier.level] ?? turnier.level}
        />
      </div>
    </section>
  )
}

function DetailCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
        <span className="text-[#A1A1AA]">{icon}</span>
        {label}
      </div>
      <p className="text-sm font-medium text-[#09090B]">{value}</p>
    </div>
  )
}

// ── Anmelde-Box ──────────────────────────────────────────────────

interface AnmeldeBoxProps {
  turnier: TurnierDetail
  isLoggedIn: boolean
  isRegistered: boolean
  myEntry: TurnierDetail['myEntry']
  currentParticipants: number
  isOpen: boolean
  isFull: boolean
  deadlinePassed: boolean
  spotsLeft: number | null
  deadlineIsUrgent: boolean
  canUnregister: boolean
  loadingAnmelden: boolean
  loadingAbmelden: boolean
  onAnmelden: () => void
  onAbmelden: () => void
  sportColor: string
}

function AnmeldeBox({
  turnier,
  isLoggedIn,
  isRegistered,
  myEntry,
  currentParticipants,
  isOpen,
  isFull,
  deadlinePassed,
  spotsLeft,
  deadlineIsUrgent,
  canUnregister,
  loadingAnmelden,
  loadingAbmelden,
  onAnmelden,
  onAbmelden,
  sportColor,
}: AnmeldeBoxProps) {
  return (
    <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-lg">
      {/* Preis */}
      <div className="mb-4">
        {turnier.entryFee === null || turnier.entryFee === 0 ? (
          <p className="text-3xl font-black text-[#16A34A]">Kostenlos</p>
        ) : (
          <p className="text-3xl font-black text-[#09090B]">
            {turnier.entryFee.toFixed(2)} €
          </p>
        )}
        <p className="text-xs text-[#71717A] mt-0.5">Startgebühr</p>
      </div>

      {/* Plätze-Balken */}
      <PlatzBalken
        current={currentParticipants}
        max={turnier.maxParticipants}
      />

      {/* Warnung wenig Plätze */}
      {spotsLeft !== null && spotsLeft > 0 && spotsLeft < 5 && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-[#EF4444]">
          <AlertCircle size={13} />
          Nur noch {spotsLeft} Plätze verfügbar!
        </div>
      )}

      {/* Anmeldefrist */}
      {turnier.registrationDeadline && !deadlinePassed && (
        <div
          className={cn(
            'flex items-center gap-1.5 mt-3 text-xs',
            deadlineIsUrgent ? 'text-[#F59E0B] font-medium' : 'text-[#71717A]',
          )}
        >
          <Clock size={13} />
          Anmeldung bis{' '}
          {new Date(turnier.registrationDeadline).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-5">
        {isRegistered ? (
          <RegisteredState
            myEntry={myEntry}
            turnier={turnier}
            canUnregister={canUnregister}
            loadingAbmelden={loadingAbmelden}
            onAbmelden={onAbmelden}
          />
        ) : !isLoggedIn ? (
          <Link
            href={`/login?callbackUrl=/turniere/${turnier.slug}`}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-white text-sm font-semibold transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${sportColor}, ${sportColor}cc)` }}
          >
            <ClipboardList size={16} />
            Einloggen &amp; anmelden
          </Link>
        ) : !isOpen || deadlinePassed ? (
          <div className="text-center py-3">
            <XCircle size={20} className="mx-auto text-[#A1A1AA] mb-1" />
            <p className="text-sm text-[#71717A]">
              {deadlinePassed
                ? 'Anmeldefrist abgelaufen'
                : 'Anmeldung nicht geöffnet'}
            </p>
          </div>
        ) : isFull ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-[#71717A] py-2">
              <XCircle size={16} className="text-[#EF4444]" />
              Ausgebucht
            </div>
            <button className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:bg-[#F4F4F5] transition-colors">
              <Bell size={15} />
              Auf Warteliste
            </button>
          </div>
        ) : (
          <button
            onClick={onAnmelden}
            disabled={loadingAnmelden}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-white text-sm font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${sportColor}, ${sportColor}cc)` }}
          >
            <ClipboardList size={16} />
            {loadingAnmelden ? 'Wird angemeldet…' : 'Jetzt anmelden'}
          </button>
        )}
      </div>

      {/* Info-Grid */}
      <div className="mt-5 pt-5 border-t border-[#F4F4F5] grid grid-cols-2 gap-3">
        {turnier.address && (
          <InfoField icon={<MapPin size={14} />} label="Adresse" value={turnier.address} />
        )}
        {turnier.contactInfo && (
          <InfoField icon={<Phone size={14} />} label="Kontakt" value={turnier.contactInfo} />
        )}
        {turnier.prizePool !== null && turnier.prizePool > 0 && (
          <InfoField
            icon={<Trophy size={14} />}
            label="Preisgeld"
            value={`${turnier.prizePool.toFixed(0)} €`}
          />
        )}
        <InfoField
          icon={<Building2 size={14} />}
          label="Sportart"
          value={turnier.sport.name}
        />
      </div>
    </div>
  )
}

function RegisteredState({
  myEntry,
  turnier,
  canUnregister,
  loadingAbmelden,
  onAbmelden,
}: {
  myEntry: TurnierDetail['myEntry']
  turnier: TurnierDetail
  canUnregister: boolean
  loadingAbmelden: boolean
  onAbmelden: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3 flex items-start gap-2.5">
        <CheckCircle2 size={18} className="text-[#16A34A] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#15803D]">
            Du bist angemeldet!
          </p>
          {myEntry && (
            <p className="text-xs text-[#166534] mt-0.5">
              Seit{' '}
              {new Date(myEntry.registeredAt).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: 'long',
              })}
            </p>
          )}
        </div>
      </div>

      {/* ICS Download */}
      <a
        href={`/api/turniere/${turnier.slug}/kalender`}
        download
        className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:bg-[#F4F4F5] transition-colors"
      >
        <Download size={14} />
        Zum Kalender hinzufügen
      </a>

      {canUnregister && (
        <button
          onClick={onAbmelden}
          disabled={loadingAbmelden}
          className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl text-xs font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors disabled:opacity-60"
        >
          <XCircle size={13} />
          {loadingAbmelden ? 'Wird abgemeldet…' : 'Abmelden'}
        </button>
      )}
    </div>
  )
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-xs text-[#A1A1AA]">
        {icon}
        {label}
      </div>
      <p className="text-xs font-medium text-[#09090B] leading-snug">{value}</p>
    </div>
  )
}
