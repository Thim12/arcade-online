'use client'

// ─────────────────────────────────────────────────────────────────
// components/vereine/VereinDetailContent.tsx
//
// Client-Komponente für die Vereins-Detailseite.
// Enthält: Stats-Leiste, Join-Button, Radix-Tabs, Radix-Toast.
//
// Tabs:
//   Übersicht    – Beschreibung, Kontakt, Konditionen, Turniere
//   Sport-Details – sport-spezifisches JSON-Blob
//   Community    – Mitgliederzähler + Join-CTA
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import Link from 'next/link'
import * as Tabs from '@radix-ui/react-tabs'
import * as Toast from '@radix-ui/react-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Phone,
  MapPin,
  Euro,
  Users,
  Trophy,
  UserPlus,
  Check,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { VereinDetailItem, VereinTournamentPreview } from '@/lib/types/verein'

// ── Typen ─────────────────────────────────────────────────────────

interface VereinDetailContentProps {
  verein: VereinDetailItem
  isLoggedIn: boolean
}

interface MitgliedResponse {
  alreadyMember: boolean
  leveledUp: boolean
  newLevel?: number
  newBadges: Array<{
    id: string
    name: string
    iconName: string
    xpReward: number
  }>
}

// ── Tab-Konfiguration ─────────────────────────────────────────────

const TABS = [
  { value: 'uebersicht', label: 'Übersicht' },
  { value: 'sport', label: 'Sport-Details' },
  { value: 'community', label: 'Community' },
] as const

type TabValue = (typeof TABS)[number]['value']

// ── Haupt-Komponente ──────────────────────────────────────────────

export function VereinDetailContent({ verein, isLoggedIn }: VereinDetailContentProps) {
  const [isMember, setIsMember] = useState(verein.isMember)
  const [followCount, setFollowCount] = useState(verein.followCount)
  const [isJoining, setIsJoining] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('uebersicht')
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastIsError, setToastIsError] = useState(false)

  const { sport } = verein

  const handleJoin = async () => {
    if (!isLoggedIn || isMember || isJoining) return
    setIsJoining(true)
    try {
      const res = await fetch(`/api/vereine/${verein.id}/mitglied`, { method: 'POST' })
      if (!res.ok) {
        setToastMessage('Fehler beim Beitreten. Bitte erneut versuchen.')
        setToastIsError(true)
        setToastOpen(true)
        return
      }
      const data = (await res.json()) as MitgliedResponse
      if (!data.alreadyMember) {
        setIsMember(true)
        setFollowCount((c) => c + 1)
        const badgeText = data.newBadges.length > 0 ? ` · Badge: ${data.newBadges[0]!.name}` : ''
        const levelText = data.leveledUp ? ` · Level ${data.newLevel ?? ''}!` : ''
        setToastMessage(`Beigetreten! +150 XP${badgeText}${levelText}`)
        setToastIsError(false)
        setToastOpen(true)
      } else {
        setIsMember(true)
      }
    } catch {
      setToastMessage('Netzwerkfehler. Bitte versuche es erneut.')
      setToastIsError(true)
      setToastOpen(true)
    } finally {
      setIsJoining(false)
    }
  }

  const feeLabel =
    verein.monthlyFee === null
      ? 'Auf Anfrage'
      : verein.monthlyFee === 0
        ? 'Kostenlos'
        : `${verein.monthlyFee.toFixed(0)} €/Monat`

  return (
    <Toast.Provider swipeDirection="right">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Stats + Join Row ──────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-[#E4E4E7]">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-sm text-[#52525B]">
              <Users size={15} style={{ color: sport.colorPrimary }} />
              <span>
                <span className="font-semibold text-[#0A0A0A]">{followCount}</span>
                {' '}
                {followCount === 1 ? 'Mitglied' : 'Mitglieder'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[#52525B]">
              <Euro size={15} style={{ color: sport.colorPrimary }} />
              <span>{feeLabel}</span>
            </div>
            {verein.hasYouthTeam && (
              <div className="flex items-center gap-1.5 text-sm text-[#52525B]">
                <Users size={15} style={{ color: sport.colorPrimary }} />
                <span>Jugendteam vorhanden</span>
              </div>
            )}
          </div>

          {/* Join-Button / Mitglied-Badge */}
          {isLoggedIn && (
            isMember ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: `${sport.colorPrimary}18`, color: sport.colorPrimary }}
              >
                <Check size={15} />
                Mitglied
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={() => void handleJoin()}
                disabled={isJoining}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
                style={{ backgroundColor: sport.colorPrimary }}
              >
                {isJoining ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus size={15} />
                )}
                Verein folgen · +150 XP
              </button>
            )
          )}
        </div>

        {/* ── Tabs ──────────────────────────────────────────── */}
        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
          <Tabs.List
            className="flex border-b border-[#E4E4E7] mb-6 gap-0"
            style={{ '--tab-color': sport.colorPrimary } as React.CSSProperties}
          >
            {TABS.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap outline-none',
                  'border-transparent hover:text-[#0A0A0A]',
                  activeTab === tab.value
                    ? 'text-[#0A0A0A] border-[var(--tab-color,#16A34A)]'
                    : 'text-[#71717A]',
                )}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* ── Tab 1: Übersicht ──────────────────────────── */}
          <Tabs.Content value="uebersicht" asChild>
            <AnimatePresence mode="wait">
              <motion.div
                key="uebersicht"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Beschreibung */}
                {verein.description && (
                  <div>
                    <h2 className="text-sm font-semibold text-[#0A0A0A] mb-2">Über den Verein</h2>
                    <p className="text-sm text-[#52525B] leading-relaxed">{verein.description}</p>
                  </div>
                )}

                {/* Kontakt */}
                <div>
                  <h2 className="text-sm font-semibold text-[#0A0A0A] mb-3">Kontakt &amp; Adresse</h2>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-2.5 text-sm text-[#52525B]">
                      <MapPin size={15} className="mt-0.5 flex-shrink-0" style={{ color: sport.colorPrimary }} />
                      <span>{verein.address}, {verein.postalCode} {verein.city}</span>
                    </div>
                    {verein.website && (
                      <a
                        href={verein.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm transition-opacity hover:opacity-80"
                        style={{ color: sport.colorPrimary }}
                      >
                        <Globe size={15} className="flex-shrink-0" />
                        {verein.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {verein.phone && (
                      <a
                        href={`tel:${verein.phone}`}
                        className="flex items-center gap-2.5 text-sm text-[#52525B] hover:text-[#0A0A0A] transition-colors"
                      >
                        <Phone size={15} className="flex-shrink-0" style={{ color: sport.colorPrimary }} />
                        {verein.phone}
                      </a>
                    )}
                    {!verein.website && !verein.phone && (
                      <p className="text-xs text-[#A1A1AA] italic">Keine Kontaktdaten eingetragen.</p>
                    )}
                  </div>
                </div>

                {/* Konditionen */}
                <div>
                  <h2 className="text-sm font-semibold text-[#0A0A0A] mb-3">Konditionen</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#E4E4E7] bg-white p-3">
                      <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1">Monatsbeitrag</p>
                      <p className="text-sm font-semibold text-[#0A0A0A]">{feeLabel}</p>
                    </div>
                    <div className="rounded-xl border border-[#E4E4E7] bg-white p-3">
                      <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1">Jugendteam</p>
                      <p className="text-sm font-semibold text-[#0A0A0A]">
                        {verein.hasYouthTeam ? 'Vorhanden' : 'Nicht vorhanden'}
                      </p>
                    </div>
                    {(verein.ageMin !== null || verein.ageMax !== null) && (
                      <div className="rounded-xl border border-[#E4E4E7] bg-white p-3">
                        <p className="text-[10px] text-[#A1A1AA] uppercase tracking-wider mb-1">Altersgruppe</p>
                        <p className="text-sm font-semibold text-[#0A0A0A]">
                          {verein.ageMin !== null && verein.ageMax !== null
                            ? `${verein.ageMin}–${verein.ageMax} Jahre`
                            : verein.ageMin !== null
                              ? `Ab ${verein.ageMin} Jahren`
                              : `Bis ${verein.ageMax!} Jahre`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kommende Turniere */}
                {verein.tournaments.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-[#0A0A0A] mb-3">Kommende Turniere</h2>
                    <div className="space-y-2">
                      {verein.tournaments.map((t) => (
                        <TurnierKarte key={t.id} tournament={t} color={sport.colorPrimary} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs.Content>

          {/* ── Tab 2: Sport-Details ──────────────────────── */}
          <Tabs.Content value="sport" asChild>
            <motion.div
              key="sport"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <SportDetailsTab
                details={verein.details}
                sportName={sport.name}
                color={sport.colorPrimary}
              />
            </motion.div>
          </Tabs.Content>

          {/* ── Tab 3: Community ─────────────────────────── */}
          <Tabs.Content value="community" asChild>
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <CommunityTab
                followCount={followCount}
                isMember={isMember}
                isLoggedIn={isLoggedIn}
                isJoining={isJoining}
                onJoin={() => void handleJoin()}
                color={sport.colorPrimary}
              />
            </motion.div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {/* ── Toast ─────────────────────────────────────────────── */}
      <Toast.Root
        open={toastOpen}
        onOpenChange={setToastOpen}
        duration={4500}
        className={cn(
          'fixed bottom-6 right-4 sm:right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border bg-white text-sm font-medium max-w-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-right-8 data-[state=closed]:fade-out',
          toastIsError ? 'border-red-100' : 'border-[#DCFCE7]',
        )}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: toastIsError ? '#FEF2F2' : '#DCFCE7' }}
        >
          {toastIsError
            ? <X size={15} className="text-red-500" />
            : <Check size={15} className="text-[#16A34A]" />
          }
        </div>
        <Toast.Description className={cn('flex-1', toastIsError ? 'text-red-700' : 'text-[#0A0A0A]')}>
          {toastMessage}
        </Toast.Description>
        <Toast.Close asChild>
          <button type="button" className="text-[#A1A1AA] hover:text-[#52525B] transition-colors ml-1">
            <X size={13} />
          </button>
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 right-0 p-6 z-[100] outline-none" />
    </Toast.Provider>
  )
}

// ── Turnier-Karte ─────────────────────────────────────────────────

function TurnierKarte({
  tournament,
  color,
}: {
  tournament: VereinTournamentPreview
  color: string
}) {
  const date = new Date(tournament.startDate).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const feeLabel =
    tournament.entryFee === null || tournament.entryFee === 0
      ? 'Kostenlos'
      : `${tournament.entryFee.toFixed(0)} €`

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-white p-3 hover:border-[#D4D4D8] transition-colors">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Trophy size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0A0A0A] truncate">{tournament.name}</p>
        <p className="text-xs text-[#71717A] mt-0.5">{date} · {tournament.city}</p>
      </div>
      <span className="text-xs font-semibold flex-shrink-0" style={{ color }}>{feeLabel}</span>
    </div>
  )
}

// ── Sport-Details Tab ─────────────────────────────────────────────

function SportDetailsTab({
  details,
  sportName,
  color,
}: {
  details: Record<string, unknown> | null
  sportName: string
  color: string
}) {
  if (!details || Object.keys(details).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{ backgroundColor: `${color}18` }}
        >
          <Sparkles size={20} style={{ color }} />
        </div>
        <p className="text-sm font-medium text-[#52525B]">Keine Sport-Details vorhanden</p>
        <p className="text-xs text-[#A1A1AA] mt-1 max-w-xs">
          Noch keine {sportName}-spezifischen Informationen eingetragen.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#F4F4F5] rounded-xl border border-[#E4E4E7] bg-white overflow-hidden">
      {Object.entries(details).map(([key, value]) => (
        <div key={key} className="flex items-start justify-between px-4 py-3">
          <span className="text-xs text-[#71717A] capitalize">
            {key.replace(/_/g, ' ')}
          </span>
          <span className="text-sm font-medium text-[#0A0A0A] text-right ml-4 max-w-[60%]">
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Community Tab ─────────────────────────────────────────────────

function CommunityTab({
  followCount,
  isMember,
  isLoggedIn,
  isJoining,
  onJoin,
  color,
}: {
  followCount: number
  isMember: boolean
  isLoggedIn: boolean
  isJoining: boolean
  onJoin: () => void
  color: string
}) {
  return (
    <div className="space-y-5">
      {/* Zähler */}
      <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 text-center">
        <p className="text-5xl font-bold text-[#0A0A0A]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {followCount}
        </p>
        <p className="text-sm text-[#71717A] mt-2">
          {followCount === 1 ? 'Person folgt' : 'Personen folgen'} diesem Verein
        </p>
      </div>

      {/* Membership-Status / CTA */}
      {isLoggedIn ? (
        isMember ? (
          <div
            className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: `${color}18`, color }}
          >
            <Check size={16} />
            Du folgst diesem Verein
          </div>
        ) : (
          <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 text-center">
            <p className="text-sm text-[#52525B] mb-4">
              Folge diesem Verein und erhalte <span className="font-semibold text-[#0A0A0A]">+150 XP</span>
            </p>
            <button
              type="button"
              onClick={onJoin}
              disabled={isJoining}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
              style={{ backgroundColor: color }}
            >
              {isJoining ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              Jetzt folgen
            </button>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-5 text-center">
          <p className="text-sm text-[#52525B] mb-4">
            Melde dich an, um diesem Verein zu folgen und XP zu verdienen.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            Anmelden
            <ChevronRight size={15} />
          </Link>
        </div>
      )}
    </div>
  )
}
