'use client'

// ─────────────────────────────────────────────────────────────────
// SparringClient – Tennis Sparring-Partner-Finder
//
// Features:
//   • NoTennisState wenn kein Tennis-Profil
//   • Filter: LK-Toleranz, Belag, Spielhand, Sucht Sparring
//   • Partner-Cards mit LK, Spielstil, Ort
//   • Request-Modal mit optionaler Nachricht (max 300 Zeichen)
//   • Tabs: Partner / Gesendet / Erhalten / Aktive
//   • Annehmen/Ablehnen für eingegangene Anfragen
//   • Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
// ─────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords,
  Settings,
  X,
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  Users,
  ChevronRight,
  SlidersHorizontal,
  MapPin,
} from 'lucide-react'

// ── Typen ─────────────────────────────────────────────────────────

interface TennisDetails {
  lk?: string
  spielstil?: string
  lieblingsbelag?: string
  sucheSparringpartner?: boolean
  spielhand?: string
}

interface PartnerUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  city: string | null
  state: string | null
  details: TennisDetails
}

interface SentRequest {
  id: string
  status: string
  message: string | null
  createdAt: string
  updatedAt: string
  receiver: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    city: string | null
    state: string | null
  }
}

interface ReceivedRequest {
  id: string
  status: string
  message: string | null
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    city: string | null
    state: string | null
  }
}

interface Props {
  hasTennis: boolean
  myDetails: TennisDetails | null
  partners: PartnerUser[]
  sparringSent: SentRequest[]
  sparringReceived: ReceivedRequest[]
  currentUserId: string
}

type ActiveTab = 'partner' | 'gesendet' | 'erhalten' | 'aktiv'

type ToleranzLevel = 'alle' | '±1' | '±2' | '±3' | '±5'
type BelagFilter = 'alle' | 'sand' | 'hart' | 'rasen' | 'halle'
type SpielhandFilter = 'alle' | 'rechts' | 'links'

// ── LK-Hilfsfunktionen ────────────────────────────────────────────

function parseLK(lk: string | undefined): number | null {
  if (!lk) return null
  const num = parseFloat(lk)
  return isNaN(num) ? null : num
}

function lkInRange(
  partnerLK: number,
  myLK: number,
  toleranz: ToleranzLevel,
): boolean {
  if (toleranz === 'alle') return true
  const diff = parseInt(toleranz.replace('±', ''), 10)
  return Math.abs(partnerLK - myLK) <= diff
}

function formatLK(lk: string | undefined): string {
  if (!lk) return '?'
  return `LK ${lk}`
}

function formatState(state: string | null): string {
  if (!state) return ''
  // GermanState enum → lesbar
  return state
    .replace('_', '-')
    .split('_')
    .map((s) => s[0]?.toUpperCase() + s.slice(1).toLowerCase())
    .join(' ')
}

function getUserDisplayName(name: string | null, username: string | null): string {
  return name ?? username ?? 'Unbekannt'
}

function getInitials(name: string | null, username: string | null): string {
  const display = getUserDisplayName(name, username)
  const parts = display.trim().split(/\s+/)
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
  }
  return display[0]?.toUpperCase() ?? '?'
}

// ── Status-Badge ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Ausstehend', className: 'text-amber-600 bg-amber-50' },
    ACCEPTED: { label: 'Angenommen', className: 'text-[#16A34A] bg-[#DCFCE7]' },
    DECLINED: { label: 'Abgelehnt', className: 'text-red-600 bg-red-50' },
    BLOCKED: { label: 'Blockiert', className: 'text-gray-500 bg-gray-100' },
  }
  const cfg = map[status] ?? map['PENDING']
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

// ── Avatar ───────────────────────────────────────────────────────

function Avatar({
  image,
  name,
  username,
  size = 'md',
}: {
  image: string | null
  name: string | null
  username: string | null
  size?: 'sm' | 'md' | 'lg'
}): React.JSX.Element {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-[#C2621A]/20 to-[#C2621A]/10 flex items-center justify-center flex-shrink-0 border border-[#C2621A]/20`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={getUserDisplayName(name, username)} className="h-full w-full object-cover" />
      ) : (
        <span className="font-bold text-[#C2621A]">
          {getInitials(name, username)}
        </span>
      )}
    </div>
  )
}

// ── NoTennisState ─────────────────────────────────────────────────

function NoTennisState(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1208] via-[#2D1E0A] to-[#1A1208] flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 mb-6">
          <Swords className="h-8 w-8 text-[#C2621A]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Kein Tennis-Profil
        </h1>
        <p className="text-white/60 text-sm leading-relaxed mb-8">
          Um Sparringspartner zu finden, musst du zuerst Tennis als Sportart in deinen Einstellungen aktivieren und dein Profil ausfüllen.
        </p>
        <Link
          href="/einstellungen"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C2621A] hover:bg-[#A8531A] text-white font-semibold rounded-xl transition-colors"
        >
          <Settings className="h-4 w-4" />
          Zu den Einstellungen
        </Link>
        <p className="mt-10 text-[11px] text-white/20">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </p>
      </motion.div>
    </div>
  )
}

// ── RequestModal ──────────────────────────────────────────────────

function RequestModal({
  partner,
  onClose,
  onSend,
  sending,
}: {
  partner: PartnerUser
  onClose: () => void
  onSend: (message: string) => Promise<void>
  sending: boolean
}): React.JSX.Element {
  const [message, setMessage] = useState('')
  const maxLen = 300

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Sparring anfragen</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Partner-Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF7F0] border border-[#C2621A]/20 mb-5">
          <Avatar image={partner.image} name={partner.name} username={partner.username} />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {getUserDisplayName(partner.name, partner.username)}
            </p>
            <p className="text-xs text-[#C2621A] font-medium">
              {formatLK(partner.details.lk)}
            </p>
          </div>
        </div>

        {/* Nachricht */}
        <div className="mb-5">
          <label htmlFor="sparring-message" className="block text-sm font-medium text-gray-700 mb-1.5">
            Persönliche Nachricht{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="sparring-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLen))}
            placeholder="Hey, ich würde gerne mit dir ein Match spielen..."
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#C2621A]/30 focus:border-[#C2621A] transition-colors placeholder:text-gray-400"
          />
          <p className="text-right text-[11px] text-gray-400 mt-1">
            {message.length}/{maxLen}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => void onSend(message)}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#C2621A] hover:bg-[#A8531A] rounded-xl transition-colors disabled:opacity-50"
          >
            {sending ? (
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Anfrage senden
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Haupt-Komponente ──────────────────────────────────────────────

export function SparringClient({
  hasTennis,
  myDetails,
  partners,
  sparringSent: initialSent,
  sparringReceived: initialReceived,
  currentUserId,
}: Props): React.JSX.Element {
  if (!hasTennis) return <NoTennisState />

  const myLK = parseLK(myDetails?.lk ?? undefined)

  // ── State ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('partner')
  const [toleranz, setToleranz] = useState<ToleranzLevel>('alle')
  const [belag, setBelag] = useState<BelagFilter>('alle')
  const [spielhand, setSpielhand] = useState<SpielhandFilter>('alle')
  const [nurSucht, setNurSucht] = useState(false)
  const [showFilter, setShowFilter] = useState(false)

  // Modal
  const [selectedPartner, setSelectedPartner] = useState<PartnerUser | null>(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(
    new Set(initialSent.filter((r) => r.status === 'PENDING').map((r) => r.receiver.id)),
  )

  // Requests (für Tab-Interaktion)
  const [sentRequests, setSentRequests] = useState<SentRequest[]>(initialSent)
  const [receivedRequests, setReceivedRequests] = useState<ReceivedRequest[]>(initialReceived)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ── Gefilterte Partner ───────────────────────────────────────────
  const filteredPartners = useMemo<PartnerUser[]>(() => {
    return partners.filter((p) => {
      // LK-Toleranz
      if (toleranz !== 'alle' && myLK !== null) {
        const pLK = parseLK(p.details.lk)
        if (pLK === null) return false
        if (!lkInRange(pLK, myLK, toleranz)) return false
      }
      // Belag
      if (belag !== 'alle' && p.details.lieblingsbelag) {
        if (p.details.lieblingsbelag.toLowerCase() !== belag) return false
      }
      // Spielhand
      if (spielhand !== 'alle' && p.details.spielhand) {
        if (p.details.spielhand.toLowerCase() !== spielhand) return false
      }
      // Nur "sucht Sparring"
      if (nurSucht && !p.details.sucheSparringpartner) return false
      return true
    })
  }, [partners, toleranz, belag, spielhand, nurSucht, myLK])

  // Aktive Partner (ACCEPTED auf beiden Seiten)
  const activePartners = useMemo(() => {
    const acceptedSent = sentRequests
      .filter((r) => r.status === 'ACCEPTED')
      .map((r) => ({ user: r.receiver, since: r.updatedAt }))
    const acceptedReceived = receivedRequests
      .filter((r) => r.status === 'ACCEPTED')
      .map((r) => ({ user: r.sender, since: r.updatedAt }))
    return [...acceptedSent, ...acceptedReceived]
  }, [sentRequests, receivedRequests])

  // ── Request senden ───────────────────────────────────────────────
  const sendRequest = useCallback(
    async (message: string): Promise<void> => {
      if (!selectedPartner) return
      setSendingRequest(true)
      setErrorMsg(null)
      try {
        const res = await fetch('/api/sparring/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUserId: selectedPartner.id,
            message: message.trim() || undefined,
          }),
        })

        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          setErrorMsg(data.error ?? 'Fehler beim Senden der Anfrage')
          return
        }

        const data = (await res.json()) as { id: string }
        // Optimistisch als gesendet markieren
        setSentIds((prev) => {
          const next = new Set(prev)
          next.add(selectedPartner.id)
          return next
        })
        setSentRequests((prev) => [
          {
            id: data.id,
            status: 'PENDING',
            message: message.trim() || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            receiver: {
              id: selectedPartner.id,
              name: selectedPartner.name,
              username: selectedPartner.username,
              image: selectedPartner.image,
              city: selectedPartner.city,
              state: selectedPartner.state,
            },
          },
          ...prev,
        ])
        setSuccessMsg(`Anfrage an ${getUserDisplayName(selectedPartner.name, selectedPartner.username)} gesendet.`)
        setSelectedPartner(null)
        setTimeout(() => setSuccessMsg(null), 4000)
      } catch {
        setErrorMsg('Netzwerkfehler. Bitte erneut versuchen.')
      } finally {
        setSendingRequest(false)
      }
    },
    [selectedPartner],
  )

  // ── Anfrage beantworten ──────────────────────────────────────────
  const respondToRequest = useCallback(
    async (requestId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<void> => {
      setProcessingId(requestId)
      setErrorMsg(null)
      try {
        const res = await fetch(`/api/sparring/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          setErrorMsg(data.error ?? 'Fehler beim Verarbeiten der Anfrage')
          return
        }
        // Optimistisch aktualisieren
        setReceivedRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, status, updatedAt: new Date().toISOString() } : r,
          ),
        )
      } catch {
        setErrorMsg('Netzwerkfehler. Bitte erneut versuchen.')
      } finally {
        setProcessingId(null)
      }
    },
    [],
  )

  const pendingReceived = receivedRequests.filter((r) => r.status === 'PENDING').length

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Seiten-Layout ─────────────────────────────────────────── */}
      <div className="min-h-screen bg-[#F8F9FA]">

        {/* ── Hero-Header ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1A1208] via-[#2D1E0A] to-[#1A1208] pt-16">
          {/* Unsplash Hintergrundbild – Tennisplatz, 12% Opacity */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=60&auto=format&fit=crop"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-[0.12] pointer-events-none select-none"
          />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-[#C2621A]/20 border border-[#C2621A]/30 flex items-center justify-center">
                <Swords className="h-5 w-5 text-[#C2621A]" />
              </div>
              <span className="text-[#C2621A] text-sm font-semibold uppercase tracking-wider">
                Tennis
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Sparring finden
            </h1>
            <p className="text-white/60 text-sm">
              Finde passende Trainingspartner nach deinem LK und Spielstil.
            </p>
            {myDetails?.lk && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                <span className="text-xs text-white/70">Dein LK:</span>
                <span className="text-sm font-bold text-white">{myDetails.lk}</span>
              </div>
            )}
          </div>

          {/* ── Tabs ─────────────────────────────────────────────── */}
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {(
                [
                  { key: 'partner', label: 'Partner', count: null },
                  { key: 'gesendet', label: 'Gesendet', count: sentRequests.length },
                  { key: 'erhalten', label: 'Erhalten', count: pendingReceived },
                  { key: 'aktiv', label: 'Aktive', count: activePartners.length },
                ] as { key: ActiveTab; label: string; count: number | null }[]
              ).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    activeTab === key
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {label}
                  {count !== null && count > 0 && (
                    <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-[#C2621A] text-[10px] font-bold text-white leading-none">
                      {count}
                    </span>
                  )}
                  {activeTab === key && (
                    <motion.div
                      layoutId="sparring-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C2621A] rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Inhaltsbereich ─────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

          {/* Toast-Nachrichten */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-center gap-2.5 px-4 py-3 bg-[#DCFCE7] border border-[#16A34A]/30 rounded-xl text-sm text-[#16A34A] font-medium"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {successMsg}
              </motion.div>
            )}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium"
              >
                <XCircle className="h-4 w-4 flex-shrink-0" />
                {errorMsg}
                <button
                  onClick={() => setErrorMsg(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TAB: Partner ─────────────────────────────────────── */}
          {activeTab === 'partner' && (
            <div>
              {/* Filter-Toggle */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{filteredPartners.length}</span> Partner gefunden
                </p>
                <button
                  onClick={() => setShowFilter((v) => !v)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border transition-colors ${
                    showFilter
                      ? 'bg-[#C2621A] text-white border-[#C2621A]'
                      : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter
                </button>
              </div>

              {/* Filter-Panel */}
              <AnimatePresence>
                {showFilter && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* LK-Toleranz */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          LK-Toleranz
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(['alle', '±1', '±2', '±3', '±5'] as ToleranzLevel[]).map((t) => (
                            <button
                              key={t}
                              onClick={() => setToleranz(t)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                                toleranz === t
                                  ? 'bg-[#C2621A] text-white border-[#C2621A]'
                                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {t === 'alle' ? 'Alle' : t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Belag */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Belag
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(['alle', 'sand', 'hart', 'rasen', 'halle'] as BelagFilter[]).map((b) => (
                            <button
                              key={b}
                              onClick={() => setBelag(b)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors capitalize ${
                                belag === b
                                  ? 'bg-[#C2621A] text-white border-[#C2621A]'
                                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {b === 'alle' ? 'Alle' : b.charAt(0).toUpperCase() + b.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Spielhand */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Spielhand
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(['alle', 'rechts', 'links'] as SpielhandFilter[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => setSpielhand(s)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                                spielhand === s
                                  ? 'bg-[#C2621A] text-white border-[#C2621A]'
                                  : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {s === 'alle' ? 'Alle' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sucht Sparring */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Verfügbarkeit
                        </p>
                        <button
                          onClick={() => setNurSucht((v) => !v)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                            nurSucht
                              ? 'bg-[#C2621A] text-white border-[#C2621A]'
                              : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Sucht ebenfalls
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Partner-Grid */}
              {filteredPartners.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
                  <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Users className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Keine Partner gefunden</p>
                  <p className="text-xs text-gray-400">Versuche die Filter anzupassen.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPartners.map((partner) => {
                    const alreadySent = sentIds.has(partner.id)
                    return (
                      <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar
                              image={partner.image}
                              name={partner.name}
                              username={partner.username}
                              size="lg"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {getUserDisplayName(partner.name, partner.username)}
                              </p>
                              {partner.username && (
                                <p className="text-xs text-gray-400 truncate">
                                  @{partner.username}
                                </p>
                              )}
                              {/* LK prominent */}
                              <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-lg bg-[#FFF7F0] border border-[#C2621A]/20">
                                <span className="text-sm font-bold text-[#C2621A]">
                                  {formatLK(partner.details.lk)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {partner.details.spielhand && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {partner.details.spielhand.charAt(0).toUpperCase() + partner.details.spielhand.slice(1)}hand
                              </span>
                            )}
                            {partner.details.lieblingsbelag && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {partner.details.lieblingsbelag.charAt(0).toUpperCase() + partner.details.lieblingsbelag.slice(1)}
                              </span>
                            )}
                            {partner.details.spielstil && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {partner.details.spielstil}
                              </span>
                            )}
                          </div>

                          {/* Ort */}
                          {(partner.city ?? partner.state) && (
                            <div className="flex items-center gap-1 mb-3">
                              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-500 truncate">
                                {[partner.city, partner.state ? formatState(partner.state) : null]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            </div>
                          )}

                          {/* "Sucht Sparring" Badge */}
                          {partner.details.sucheSparringpartner && (
                            <div className="flex items-center gap-1.5 mb-3 text-[#16A34A]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Sucht ebenfalls.</span>
                            </div>
                          )}
                        </div>

                        {/* Aktion */}
                        <div className="px-4 pb-4">
                          {alreadySent ? (
                            <div className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-medium text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                              <Clock className="h-4 w-4" />
                              Anfrage gesendet
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedPartner(partner)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-[#C2621A] hover:bg-[#A8531A] rounded-xl transition-colors"
                            >
                              <Swords className="h-4 w-4" />
                              Sparring anfragen
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Gesendet ────────────────────────────────────── */}
          {activeTab === 'gesendet' && (
            <div className="flex flex-col gap-3">
              {sentRequests.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
                  <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Send className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Keine gesendeten Anfragen</p>
                </div>
              ) : (
                sentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <Avatar
                      image={req.receiver.image}
                      name={req.receiver.name}
                      username={req.receiver.username}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getUserDisplayName(req.receiver.name, req.receiver.username)}
                      </p>
                      {req.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {req.message}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB: Erhalten ────────────────────────────────────── */}
          {activeTab === 'erhalten' && (
            <div className="flex flex-col gap-3">
              {receivedRequests.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
                  <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Swords className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Keine eingegangenen Anfragen</p>
                </div>
              ) : (
                receivedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <Avatar
                        image={req.sender.image}
                        name={req.sender.name}
                        username={req.sender.username}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {getUserDisplayName(req.sender.name, req.sender.username)}
                        </p>
                        {req.message && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {req.message}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => void respondToRequest(req.id, 'ACCEPTED')}
                          disabled={processingId === req.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-xl transition-colors disabled:opacity-50"
                        >
                          {processingId === req.id ? (
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Annehmen
                        </button>
                        <button
                          onClick={() => void respondToRequest(req.id, 'DECLINED')}
                          disabled={processingId === req.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Ablehnen
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB: Aktive Partner ──────────────────────────────── */}
          {activeTab === 'aktiv' && (
            <div className="flex flex-col gap-3">
              {activePartners.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
                  <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Users className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Noch keine aktiven Partner</p>
                  <p className="text-xs text-gray-400">
                    Angenommene Anfragen erscheinen hier.
                  </p>
                </div>
              ) : (
                activePartners.map(({ user }) => (
                  <Link
                    key={user.id}
                    href={`/profil/${user.username ?? user.id}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Avatar image={user.image} name={user.name} username={user.username} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getUserDisplayName(user.name, user.username)}
                      </p>
                      {(user.city ?? user.state) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {[user.city, user.state ? formatState(user.state) : null]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  </Link>
                ))
              )}
            </div>
          )}

          {/* ── KI-Hinweis ───────────────────────────────────────── */}
          <p className="mt-10 text-center text-[11px] text-gray-300">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </p>
        </div>
      </div>

      {/* ── Request-Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedPartner && (
          <RequestModal
            partner={selectedPartner}
            onClose={() => setSelectedPartner(null)}
            onSend={sendRequest}
            sending={sendingRequest}
          />
        )}
      </AnimatePresence>
    </>
  )
}
