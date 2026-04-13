'use client'

// ─────────────────────────────────────────────────────────────────
// app/admin/AdminDashboardClient.tsx
//
// Admin-Dashboard – vollständige Client-Komponente.
// Alle Sektionen: Stats, Sport-Verteilung, Vereins-Warteschlange,
// Turnier-Warteschlange, Gemeldete Posts, User-Verwaltung.
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Building2,
  Trophy,
  AlertCircle,
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Shield,
  Ban,
  Search,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'

// ── Types ────────────────────────────────────────────────────────

interface SportStat {
  name: string
  count: number
  color: string
}

interface PendingVerein {
  id: string
  name: string
  slug: string
  city: string
  state: string
  submitterName: string | null
  submitterEmail: string | null
  createdAt: string
  description: string | null
  sport: { name: string; colorPrimary: string }
  details: unknown
}

interface PendingTurnier {
  id: string
  name: string
  slug: string
  city: string
  state: string
  submitterName: string | null
  submitterEmail: string | null
  createdAt: string
  description: string | null
  sport: { name: string; colorPrimary: string }
  startDate: string
  endDate: string
  level: string
}

interface ReportedPost {
  id: string
  content: string
  reportsCount: number
  createdAt: string
  user: { name: string | null; username: string | null }
  sport: { name: string }
}

interface AdminUser {
  id: string
  name: string | null
  username: string | null
  email: string
  image: string | null
  level: number
  xp: number
  role: string
  isActive: boolean
  createdAt: string
}

interface DashboardProps {
  totalUsers: number
  usersThisWeek: number
  usersLastWeek: number
  verifiedVereine: number
  pendingVereine: PendingVerein[]
  activeTurniere: number
  pendingTurniere: PendingTurnier[]
  reportedPosts: ReportedPost[]
  sportStats: SportStat[]
  activeUserCount: number
}

// ── Toast ────────────────────────────────────────────────────────

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  return { toasts, show }
}

function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium shadow-xl border ${
              t.type === 'success'
                ? 'bg-[#16A34A]/90 border-[#16A34A] text-white'
                : 'bg-[#EF4444]/90 border-[#EF4444] text-white'
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `vor ${mins} Min.`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `vor ${hrs} Std.`
  const days = Math.floor(hrs / 24)
  return `vor ${days} Tag${days === 1 ? '' : 'en'}`
}

function sportLabel(level: string): string {
  const map: Record<string, string> = {
    ANFAENGER: 'Anfänger',
    FORTGESCHRITTENE: 'Fortgeschrittene',
    WETTKAMPF: 'Wettkampf',
    PROFI: 'Profi',
  }
  return map[level] ?? level
}

function stateLabel(state: string): string {
  const map: Record<string, string> = {
    HESSEN: 'Hessen',
    BAYERN: 'Bayern',
    BERLIN: 'Berlin',
    NORDRHEIN_WESTFALEN: 'NRW',
    HAMBURG: 'Hamburg',
    SACHSEN: 'Sachsen',
    NIEDERSACHSEN: 'Niedersachsen',
    THUERINGEN: 'Thüringen',
    BRANDENBRUG: 'Brandenburg',
    BREMEN: 'Bremen',
    SAARLAND: 'Saarland',
    RHEINLAND_PFALZ: 'Rheinland-Pfalz',
    SACHSEN_ANHALT: 'Sachsen-Anhalt',
    SCHLESWIG_HOLSTEIN: 'Schleswig-Holstein',
    MECKLENBURG_VORPOMMERN: 'Mecklenburg-Vorpommern',
    BADEN_WUERTTEMBERG: 'Baden-Württemberg',
  }
  return map[state] ?? state
}

// ── Initials Avatar ──────────────────────────────────────────────

function Avatar({ image, name, size = 36 }: { image: string | null; name: string | null; size?: number }) {
  const initials = name
    ? name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  if (image) {
    return (
      <img
        src={image}
        alt={name ?? 'User'}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-[#2A2A2A] flex items-center justify-center text-xs font-bold text-white/60 flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

// ── Ablehnen-Modal ───────────────────────────────────────────────

function AblehnenModal({
  open,
  onClose,
  onConfirm,
  label,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  label: string
  loading: boolean
}) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) setReason('')
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 shadow-2xl">
          <Dialog.Title className="text-white font-bold text-lg mb-1">
            {label} ablehnen
          </Dialog.Title>
          <Dialog.Description className="text-white/40 text-sm mb-4">
            Bitte gib eine Begründung an. Diese wird per E-Mail an den Einreicher gesendet.
          </Dialog.Description>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Begründung für die Ablehnung…"
            rows={4}
            className="w-full bg-[#111111] border border-[#333333] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-[#EF4444]/60 transition-colors"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#2A2A2A] text-white/50 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
            >
              Abbrechen
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim() || loading}
              className="flex-1 py-2.5 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-medium hover:bg-[#EF4444]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <XCircle size={16} />
              {loading ? 'Wird abgelehnt…' : 'Ablehnen'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Bestätigen-Modal ─────────────────────────────────────────────

function BestaetigenModal({
  open,
  onClose,
  onConfirm,
  item,
  type,
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  item: PendingVerein | PendingTurnier | null
  type: 'verein' | 'turnier'
  loading: boolean
}) {
  if (!item) return null

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-white font-bold text-lg mb-1">
            {type === 'verein' ? 'Verein' : 'Turnier'} bestätigen
          </Dialog.Title>
          <Dialog.Description className="text-white/40 text-sm mb-5">
            Prüfe alle Angaben sorgfältig. Die Bestätigung ist sofort öffentlich sichtbar.
          </Dialog.Description>

          {/* Detail-Block */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: item.sport.colorPrimary }}
              >
                {item.sport.name}
              </span>
              <span className="text-white font-semibold">{item.name}</span>
            </div>
            <InfoRow label="Ort" value={`${item.city}, ${stateLabel(item.state)}`} />
            <InfoRow label="Einreicher" value={`${item.submitterName ?? '–'} · ${item.submitterEmail ?? '–'}`} />
            {type === 'turnier' && 'startDate' in item && (
              <>
                <InfoRow label="Start" value={new Date(item.startDate).toLocaleDateString('de-DE')} />
                <InfoRow label="Level" value={sportLabel(item.level)} />
              </>
            )}
            {item.description && (
              <div className="mt-3 p-3 bg-[#111111] rounded-xl">
                <p className="text-white/50 text-xs mb-1">Beschreibung</p>
                <p className="text-white/80 text-sm leading-relaxed">{item.description}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#2A2A2A] text-white/50 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
            >
              Abbrechen
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              {loading ? 'Wird bestätigt…' : 'Bestätigen'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-white/40 w-24 flex-shrink-0">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  )
}

// ── Stats Card ───────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  sub,
  subColor,
  trend,
}: {
  icon: React.ElementType
  iconColor: string
  label: string
  value: number | string
  sub?: string
  subColor?: string
  trend?: { up: boolean; value: number }
}) {
  return (
    <motion.div
      whileHover={{ translateY: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
      className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-5 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <Icon size={20} style={{ color: iconColor }} />
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.up ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
            {trend.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trend.value > 0 ? '+' : ''}{trend.value}
          </div>
        )}
      </div>
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: subColor ?? '#94a3b8' }}>{sub}</p>
      )}
    </motion.div>
  )
}

// ── Vereins-Einreichung-Karte ────────────────────────────────────

function VereinKarte({
  verein,
  onBestaetigen,
  onAblehnen,
}: {
  verein: PendingVerein
  onBestaetigen: (v: PendingVerein) => void
  onAblehnen: (v: PendingVerein) => void
}) {
  const details = verein.details as Record<string, unknown> | null

  return (
    <motion.div
      layout
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-3"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: verein.sport.colorPrimary }}
          >
            {verein.sport.name}
          </span>
          <span className="text-white font-semibold">{verein.name}</span>
        </div>
        <span className="text-white/30 text-xs flex-shrink-0">{relativeTime(verein.createdAt)}</span>
      </div>

      <p className="text-white/50 text-xs mb-1">
        {verein.city}, {stateLabel(verein.state)}
      </p>
      <p className="text-white/40 text-xs mb-3">
        {verein.submitterName ?? '–'} &middot; {verein.submitterEmail ?? '–'}
      </p>

      {verein.description && (
        <p className="text-white/60 text-sm leading-relaxed mb-3 line-clamp-2">{verein.description}</p>
      )}

      {/* Details-Chips */}
      {details && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {typeof details['ligaName'] === 'string' && (
            <Chip label={details['ligaName'] as string} />
          )}
          {Array.isArray(details['altersklassen']) && (details['altersklassen'] as string[]).slice(0, 2).map((a: string) => (
            <Chip key={a} label={a} />
          ))}
          {typeof details['anzahlSandplaetze'] === 'number' && (
            <Chip label={`${details['anzahlSandplaetze']}× Sand`} />
          )}
          {typeof details['anzahlHartplaetze'] === 'number' && (
            <Chip label={`${details['anzahlHartplaetze']}× Hart`} />
          )}
          {typeof details['anzahlHallenplaetze'] === 'number' && (
            <Chip label={`${details['anzahlHallenplaetze']}× Halle`} />
          )}
          {typeof details['hallenName'] === 'string' && (
            <Chip label={details['hallenName'] as string} />
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onBestaetigen(verein)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803D] transition-all"
        >
          <CheckCircle2 size={15} />
          Bestätigen
        </button>
        <button
          onClick={() => onAblehnen(verein)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-medium hover:bg-[#EF4444]/10 transition-all"
        >
          <XCircle size={15} />
          Ablehnen
        </button>
      </div>
    </motion.div>
  )
}

// ── Turnier-Einreichung-Karte ────────────────────────────────────

function TurnierKarte({
  turnier,
  onBestaetigen,
  onAblehnen,
}: {
  turnier: PendingTurnier
  onBestaetigen: (t: PendingTurnier) => void
  onAblehnen: (t: PendingTurnier) => void
}) {
  return (
    <motion.div
      layout
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-3"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: turnier.sport.colorPrimary }}
          >
            {turnier.sport.name}
          </span>
          <span className="text-white font-semibold">{turnier.name}</span>
        </div>
        <span className="text-white/30 text-xs flex-shrink-0">{relativeTime(turnier.createdAt)}</span>
      </div>

      <p className="text-white/50 text-xs mb-1">
        {turnier.city}, {stateLabel(turnier.state)}
      </p>
      <p className="text-white/40 text-xs mb-3">
        {turnier.submitterName ?? '–'} &middot; {turnier.submitterEmail ?? '–'}
      </p>

      {turnier.description && (
        <p className="text-white/60 text-sm leading-relaxed mb-3 line-clamp-2">{turnier.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        <Chip label={new Date(turnier.startDate).toLocaleDateString('de-DE')} />
        <Chip label={sportLabel(turnier.level)} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onBestaetigen(turnier)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803D] transition-all"
        >
          <CheckCircle2 size={15} />
          Bestätigen
        </button>
        <button
          onClick={() => onAblehnen(turnier)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#EF4444] text-[#EF4444] text-sm font-medium hover:bg-[#EF4444]/10 transition-all"
        >
          <XCircle size={15} />
          Ablehnen
        </button>
      </div>
    </motion.div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs">
      {label}
    </span>
  )
}

// ── Section Header ───────────────────────────────────────────────

function SectionHeader({ title, badge, badgeColor }: { title: string; badge?: number; badgeColor?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-white font-bold text-lg">{title}</h2>
      {badge !== undefined && badge > 0 && (
        <span
          className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: badgeColor ?? '#EAB308' }}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────

export default function AdminDashboardClient({
  totalUsers,
  usersThisWeek,
  usersLastWeek,
  verifiedVereine,
  pendingVereine: initialPendingVereine,
  activeTurniere,
  pendingTurniere: initialPendingTurniere,
  reportedPosts: initialReportedPosts,
  sportStats,
  activeUserCount,
}: DashboardProps) {
  const { toasts, show: showToast } = useToast()

  // ── State ───────────────────────────────────────────────────────
  const [pendingVereine, setPendingVereine] = useState(initialPendingVereine)
  const [pendingTurniere, setPendingTurniere] = useState(initialPendingTurniere)
  const [reportedPosts, setReportedPosts] = useState(initialReportedPosts)

  // Vereins-Modals
  const [vereinBestaetigenItem, setVereinBestaetigenItem] = useState<PendingVerein | null>(null)
  const [vereinAblehnenItem, setVereinAblehnenItem] = useState<PendingVerein | null>(null)
  const [vereinLoading, setVereinLoading] = useState(false)

  // Turnier-Modals
  const [turnierBestaetigenItem, setTurnierBestaetigenItem] = useState<PendingTurnier | null>(null)
  const [turnierAblehnenItem, setTurnierAblehnenItem] = useState<PendingTurnier | null>(null)
  const [turnierLoading, setTurnierLoading] = useState(false)

  // User-Verwaltung
  const [userSearch, setUserSearch] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Sport-Verteilung Max ─────────────────────────────────────────
  const maxSportCount = Math.max(...sportStats.map(s => s.count), 1)

  // ── Trend ───────────────────────────────────────────────────────
  const userTrend = usersThisWeek - usersLastWeek

  // ── Verein Bestätigen ────────────────────────────────────────────
  async function handleVereinBestaetigen() {
    if (!vereinBestaetigenItem) return
    setVereinLoading(true)
    try {
      const res = await fetch(`/api/admin/vereine/${vereinBestaetigenItem.id}/bestaetigen`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error()
      setPendingVereine(prev => prev.filter(v => v.id !== vereinBestaetigenItem.id))
      setVereinBestaetigenItem(null)
      showToast(`${vereinBestaetigenItem.name} wurde bestätigt`)
    } catch {
      showToast('Fehler beim Bestätigen', 'error')
    } finally {
      setVereinLoading(false)
    }
  }

  // ── Verein Ablehnen ──────────────────────────────────────────────
  async function handleVereinAblehnen(reason: string) {
    if (!vereinAblehnenItem) return
    setVereinLoading(true)
    try {
      const res = await fetch(`/api/admin/vereine/${vereinAblehnenItem.id}/ablehnen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error()
      setPendingVereine(prev => prev.filter(v => v.id !== vereinAblehnenItem.id))
      setVereinAblehnenItem(null)
      showToast(`${vereinAblehnenItem.name} wurde abgelehnt`)
    } catch {
      showToast('Fehler beim Ablehnen', 'error')
    } finally {
      setVereinLoading(false)
    }
  }

  // ── Turnier Bestätigen ───────────────────────────────────────────
  async function handleTurnierBestaetigen() {
    if (!turnierBestaetigenItem) return
    setTurnierLoading(true)
    try {
      const res = await fetch(`/api/admin/turniere/${turnierBestaetigenItem.id}/bestaetigen`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error()
      setPendingTurniere(prev => prev.filter(t => t.id !== turnierBestaetigenItem.id))
      setTurnierBestaetigenItem(null)
      showToast(`${turnierBestaetigenItem.name} wurde bestätigt`)
    } catch {
      showToast('Fehler beim Bestätigen', 'error')
    } finally {
      setTurnierLoading(false)
    }
  }

  // ── Turnier Ablehnen ─────────────────────────────────────────────
  async function handleTurnierAblehnen(reason: string) {
    if (!turnierAblehnenItem) return
    setTurnierLoading(true)
    try {
      const res = await fetch(`/api/admin/turniere/${turnierAblehnenItem.id}/ablehnen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error()
      setPendingTurniere(prev => prev.filter(t => t.id !== turnierAblehnenItem.id))
      setTurnierAblehnenItem(null)
      showToast(`${turnierAblehnenItem.name} wurde abgelehnt`)
    } catch {
      showToast('Fehler beim Ablehnen', 'error')
    } finally {
      setTurnierLoading(false)
    }
  }

  // ── Post-Aktionen ────────────────────────────────────────────────
  async function handlePostVerstecken(id: string) {
    try {
      const res = await fetch(`/api/admin/posts/${id}/verstecken`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setReportedPosts(prev => prev.filter(p => p.id !== id))
      showToast('Post versteckt')
    } catch {
      showToast('Fehler beim Verstecken', 'error')
    }
  }

  async function handlePostIgnorieren(id: string) {
    try {
      const res = await fetch(`/api/admin/posts/${id}/ignorieren`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setReportedPosts(prev => prev.filter(p => p.id !== id))
      showToast('Reports ignoriert')
    } catch {
      showToast('Fehler', 'error')
    }
  }

  // ── User-Suche mit Debounce ──────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!userSearch.trim()) {
      setUsers([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setUserLoading(true)
      try {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}`)
        if (res.ok) {
          const data = (await res.json()) as { users: AdminUser[] }
          setUsers(data.users)
        }
      } catch {
        // kein kritischer Fehler
      } finally {
        setUserLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [userSearch])

  // ── User Role ändern ─────────────────────────────────────────────
  async function handleRoleChange(userId: string, role: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { user: AdminUser }
      setUsers(prev => prev.map(u => (u.id === userId ? data.user : u)))
      showToast('Rolle aktualisiert')
    } catch {
      showToast('Fehler beim Ändern der Rolle', 'error')
    }
  }

  // ── User Bannen ──────────────────────────────────────────────────
  async function handleBan(userId: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ban: true }),
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { user: AdminUser }
      setUsers(prev => prev.map(u => (u.id === userId ? data.user : u)))
      showToast('User gebannt')
    } catch {
      showToast('Fehler beim Bannen', 'error')
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} />

      {/* Modals */}
      <BestaetigenModal
        open={!!vereinBestaetigenItem}
        onClose={() => setVereinBestaetigenItem(null)}
        onConfirm={handleVereinBestaetigen}
        item={vereinBestaetigenItem}
        type="verein"
        loading={vereinLoading}
      />
      <AblehnenModal
        open={!!vereinAblehnenItem}
        onClose={() => setVereinAblehnenItem(null)}
        onConfirm={handleVereinAblehnen}
        label={vereinAblehnenItem?.name ?? 'Verein'}
        loading={vereinLoading}
      />
      <BestaetigenModal
        open={!!turnierBestaetigenItem}
        onClose={() => setTurnierBestaetigenItem(null)}
        onConfirm={handleTurnierBestaetigen}
        item={turnierBestaetigenItem}
        type="turnier"
        loading={turnierLoading}
      />
      <AblehnenModal
        open={!!turnierAblehnenItem}
        onClose={() => setTurnierAblehnenItem(null)}
        onConfirm={handleTurnierAblehnen}
        label={turnierAblehnenItem?.name ?? 'Turnier'}
        loading={turnierLoading}
      />

      <div className="min-h-screen bg-[#0A0A0A] pb-20">
        {/* Header */}
        <div className="relative bg-[#0A0A0A] py-6 px-8 border-b border-[#1A1A1A] overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-white/30" />
              <p className="text-white/30 text-sm">SportRise.de</p>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin-Dashboard</h1>
            <p className="text-white/30 text-xs mt-1">
              Hessen-Phase &middot; {activeUserCount} aktive Nutzer
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 space-y-10">

          {/* Stats Grid */}
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={Users}
                iconColor="#16A34A"
                label="Registrierte User"
                value={totalUsers}
                trend={{ up: userTrend >= 0, value: userTrend }}
              />
              <StatCard
                icon={Building2}
                iconColor="#3B82F6"
                label="Verifizierte Vereine"
                value={verifiedVereine}
                sub={pendingVereine.length > 0 ? `${pendingVereine.length} ausstehend` : undefined}
                subColor={pendingVereine.length > 0 ? '#EAB308' : undefined}
              />
              <StatCard
                icon={Trophy}
                iconColor="#F97316"
                label="Aktive Turniere"
                value={activeTurniere}
                sub={pendingTurniere.length > 0 ? `${pendingTurniere.length} ausstehend` : undefined}
                subColor={pendingTurniere.length > 0 ? '#EAB308' : undefined}
              />
              <StatCard
                icon={AlertCircle}
                iconColor="#EF4444"
                label="Gemeldete Posts"
                value={reportedPosts.length}
                subColor="#EF4444"
              />
            </div>
          </section>

          {/* Sport-Verteilung */}
          {sportStats.length > 0 && (
            <section>
              <SectionHeader title="Sport-Verteilung" />
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-5 space-y-3">
                {sportStats.map(s => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-white/60 text-sm w-24 flex-shrink-0">{s.name}</span>
                    <div className="flex-1 bg-[#1A1A1A] rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((s.count / maxSportCount) * 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                    <span className="text-white/40 text-xs w-10 text-right">{s.count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Vereins-Warteschlange */}
          <section>
            <SectionHeader
              title="Vereins-Einreichungen"
              badge={pendingVereine.length}
            />
            {pendingVereine.length > 0 && (
              <p className="text-white/30 text-xs mb-4">
                Neue Einreichungen sollten innerhalb 24–48h bearbeitet werden.
              </p>
            )}
            <AnimatePresence mode="popLayout">
              {pendingVereine.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-[#16A34A] text-sm py-4"
                >
                  <CheckCircle2 size={16} />
                  Keine ausstehenden Einreichungen.
                </motion.div>
              ) : (
                pendingVereine.map(v => (
                  <VereinKarte
                    key={v.id}
                    verein={v}
                    onBestaetigen={setVereinBestaetigenItem}
                    onAblehnen={setVereinAblehnenItem}
                  />
                ))
              )}
            </AnimatePresence>
          </section>

          {/* Turnier-Warteschlange */}
          <section>
            <SectionHeader
              title="Turnier-Einreichungen"
              badge={pendingTurniere.length}
            />
            {pendingTurniere.length > 0 && (
              <p className="text-white/30 text-xs mb-4">
                Neue Einreichungen sollten innerhalb 24–48h bearbeitet werden.
              </p>
            )}
            <AnimatePresence mode="popLayout">
              {pendingTurniere.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-[#16A34A] text-sm py-4"
                >
                  <CheckCircle2 size={16} />
                  Keine ausstehenden Einreichungen.
                </motion.div>
              ) : (
                pendingTurniere.map(t => (
                  <TurnierKarte
                    key={t.id}
                    turnier={t}
                    onBestaetigen={setTurnierBestaetigenItem}
                    onAblehnen={setTurnierAblehnenItem}
                  />
                ))
              )}
            </AnimatePresence>
          </section>

          {/* Gemeldete Posts */}
          <section>
            <SectionHeader
              title="Gemeldete Posts"
              badge={reportedPosts.length}
              badgeColor="#EF4444"
            />
            <AnimatePresence mode="popLayout">
              {reportedPosts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-[#16A34A] text-sm py-4"
                >
                  <CheckCircle2 size={16} />
                  Keine gemeldeten Posts.
                </motion.div>
              ) : (
                reportedPosts.map(post => (
                  <motion.div
                    key={post.id}
                    layout
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 mb-3"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-white/60 text-sm font-medium">
                          {post.user.name ?? post.user.username ?? 'Unbekannt'}
                        </span>
                        <span className="text-white/30 text-xs ml-2">{post.sport.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#EF4444] text-xs font-bold flex-shrink-0">
                        {post.reportsCount}× gemeldet
                      </span>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed line-clamp-3 mb-4">
                      {post.content}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePostVerstecken(post.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-sm font-medium hover:bg-[#EF4444]/20 transition-all"
                      >
                        <EyeOff size={15} />
                        Verstecken
                      </button>
                      <button
                        onClick={() => handlePostIgnorieren(post.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#2A2A2A] text-white/40 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
                      >
                        <Eye size={15} />
                        Ignorieren
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </section>

          {/* User-Verwaltung */}
          <section>
            <SectionHeader title="User-Verwaltung" />
            <div className="relative mb-4">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Nach Name, @username oder E-Mail suchen…"
                className="w-full bg-[#111111] border border-[#1E1E1E] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            {userLoading && (
              <p className="text-white/30 text-sm py-4">Suche…</p>
            )}

            {!userLoading && userSearch && users.length === 0 && (
              <p className="text-white/30 text-sm py-4">Keine User gefunden.</p>
            )}

            {!userLoading && !userSearch && (
              <p className="text-white/20 text-xs py-4">Gib einen Suchbegriff ein um User zu finden.</p>
            )}

            <AnimatePresence>
              {users.map(user => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 py-3 border-b border-[#1A1A1A] last:border-0"
                >
                  <Avatar image={user.image} name={user.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user.name ?? '–'}</p>
                    <p className="text-white/40 text-xs truncate">
                      {user.username ? `@${user.username} · ` : ''}{user.email}
                    </p>
                    <p className="text-white/30 text-xs">
                      Level {user.level} &middot; {new Date(user.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>

                  {/* Role Select */}
                  <Select.Root
                    value={user.role}
                    onValueChange={role => handleRoleChange(user.id, role)}
                  >
                    <Select.Trigger className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white/60 text-xs hover:border-white/20 transition-colors focus:outline-none">
                      <Select.Value />
                      <ChevronRight size={12} className="rotate-90 text-white/30" />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="z-50 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-xl">
                        <Select.Viewport>
                          {['USER', 'MODERATOR', 'ADMIN', 'BANNED'].map(r => (
                            <Select.Item
                              key={r}
                              value={r}
                              className="px-4 py-2 text-xs text-white/70 hover:bg-white/5 cursor-pointer focus:outline-none focus:bg-white/5 data-[highlighted]:bg-white/5"
                            >
                              <Select.ItemText>{r}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>

                  {/* Ban Button */}
                  {user.role !== 'BANNED' && (
                    <button
                      onClick={() => handleBan(user.id)}
                      className="p-1.5 rounded-lg border border-[#2A2A2A] text-white/30 hover:border-[#EF4444]/40 hover:text-[#EF4444] transition-all"
                      title="Bannen"
                    >
                      <Ban size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </section>

          {/* KI-Hinweis */}
          <p className="text-center text-white/15 text-xs pb-4">
            Erstellt von unserer eigenen KI &middot; kein externer Bot &middot; DSGVO-konform
          </p>
        </div>
      </div>
    </>
  )
}
