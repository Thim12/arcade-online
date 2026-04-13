'use client'
// ─────────────────────────────────────────────────────────────────
// EinstellungenClient.tsx – Interaktive Einstellungsseite
//
// Sektionen:
//   1. Account-Informationen (Name, E-Mail, Username, Bundesland, Mitglied seit)
//   2. Statistiken (Sessions, Badges, Posts)
//   3. Sitzung beenden (Abmelden)
//   4. Gefahrenzone (Account löschen – Bestätigungs-Modal)
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  AtSign,
  MapPin,
  Calendar,
  Dumbbell,
  Medal,
  FileText,
  LogOut,
  Trash2,
  AlertTriangle,
  X,
  Shield,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import type { EinstellungenData } from './page'

// ── Sport-Farbsystem ───────────────────────────────────────────────

const SPORT_COLORS: Record<string, string> = {
  fussball:   '#16A34A',
  tennis:     '#C2621A',
  basketball: '#EA580C',
}
const DEFAULT_COLOR = '#16A34A'

// ── Hilfsfunktionen ────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })
}

function sportLabel(slug: string | null): string {
  if (!slug) return '—'
  const labels: Record<string, string> = {
    fussball:   'Fußball',
    tennis:     'Tennis',
    basketball: 'Basketball',
  }
  return labels[slug] ?? slug
}

// ── Info-Zeile ────────────────────────────────────────────────────

function InfoRow({
  Icon,
  label,
  value,
  accent,
}: {
  Icon: React.ElementType
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: '1px solid #F4F4F5' }}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: '#F4F4F5' }}
      >
        <Icon size={15} style={{ color: '#71717A' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: '#A1A1AA' }}>{label}</p>
        <p
          className="text-sm font-medium mt-0.5 truncate"
          style={{ color: accent ?? '#0A0A0A' }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ── Stats-Karte ────────────────────────────────────────────────────

function StatCard({
  Icon,
  value,
  label,
  color,
}: {
  Icon: React.ElementType
  value: number
  label: string
  color: string
}) {
  return (
    <div
      className="flex-1 rounded-xl p-4 flex flex-col gap-1"
      style={{ background: '#F9FAFB', border: '1px solid #F0F0F0' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
        style={{ background: `${color}15` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-xl font-bold" style={{ color: '#0A0A0A' }}>{value}</p>
      <p className="text-xs" style={{ color: '#A1A1AA' }}>{label}</p>
    </div>
  )
}

// ── Abschnitt-Wrapper ──────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
  danger,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{
        background: '#FFFFFF',
        border: danger ? '1px solid #FECACA' : '1px solid #E4E4E7',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div className="mb-5">
        <h2
          className="text-base font-bold"
          style={{ color: danger ? '#EF4444' : '#0A0A0A' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: '#71717A' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </motion.div>
  )
}

// ── Bestätigungs-Modal (Account löschen) ──────────────────────────

interface DeleteModalProps {
  username: string | null
  onClose:  () => void
  onDelete: () => Promise<void>
  loading:  boolean
  error:    string | null
}

function DeleteModal({ username, onClose, onDelete, loading, error }: DeleteModalProps) {
  const [input, setInput]     = useState('')
  const inputRef              = useRef<HTMLInputElement>(null)
  const confirmValue          = username ?? 'löschen'
  const isConfirmed           = input.trim() === confirmValue

  // Focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // ESC zum Schließen
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.55)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
      >
        <motion.div
          className="w-full max-w-md rounded-2xl p-6 relative"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          }}
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          {/* Schließen-Button */}
          {!loading && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: '#F4F4F5', color: '#71717A' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#E4E4E7' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F4F5' }}
            >
              <X size={15} />
            </button>
          )}

          {/* Warn-Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#FEF2F2' }}
          >
            <AlertTriangle size={24} style={{ color: '#EF4444' }} />
          </div>

          {/* Titel */}
          <h3 className="text-lg font-bold mb-2" style={{ color: '#0A0A0A' }}>
            Account endgültig löschen
          </h3>

          {/* Warnung */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: '#EF4444' }}>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <ul className="text-xs space-y-1" style={{ color: '#B91C1C' }}>
              <li style={{ display: 'flex', gap: '6px' }}>
                <span>·</span><span>Alle Trainingspläne und Sitzungen werden gelöscht</span>
              </li>
              <li style={{ display: 'flex', gap: '6px' }}>
                <span>·</span><span>Deine Abzeichen und XP werden gelöscht</span>
              </li>
              <li style={{ display: 'flex', gap: '6px' }}>
                <span>·</span><span>Deine Community-Posts werden gelöscht</span>
              </li>
              <li style={{ display: 'flex', gap: '6px' }}>
                <span>·</span><span>Dein Profil wird sofort aus Supabase entfernt</span>
              </li>
            </ul>
          </div>

          {/* Bestätigung via Username */}
          <label className="block mb-4">
            <p className="text-sm font-medium mb-2" style={{ color: '#52525B' }}>
              Gib zur Bestätigung deinen Benutzernamen ein:
              <span className="font-bold ml-1" style={{ color: '#0A0A0A' }}>
                {confirmValue}
              </span>
            </p>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={confirmValue}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                border: input.length > 0
                  ? (isConfirmed ? '2px solid #EF4444' : '2px solid #FECACA')
                  : '2px solid #E4E4E7',
                background: '#FAFAFA',
                color: '#0A0A0A',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isConfirmed && !loading) void onDelete()
              }}
            />
          </label>

          {/* API-Fehler */}
          {error && (
            <p
              className="text-xs mb-4 px-3 py-2 rounded-lg"
              style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
            >
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: '#F4F4F5',
                color: '#52525B',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#E4E4E7' }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#F4F4F5' }}
            >
              Abbrechen
            </button>
            <button
              onClick={() => { if (isConfirmed && !loading) void onDelete() }}
              disabled={!isConfirmed || loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: isConfirmed && !loading ? '#EF4444' : '#FCA5A5',
                color: '#FFFFFF',
                cursor: isConfirmed && !loading ? 'pointer' : 'not-allowed',
                boxShadow: isConfirmed && !loading ? '0 4px 16px rgba(239,68,68,0.30)' : 'none',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Endgültig löschen
                </>
              )}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Haupt-Komponente ──────────────────────────────────────────────

export function EinstellungenClient({ data }: { data: EinstellungenData }) {
  const router   = useRouter()
  const color    = SPORT_COLORS[data.primarySport ?? ''] ?? DEFAULT_COLOR

  // Modal-State
  const [modalOpen,  setModalOpen]  = useState(false)
  const [delLoading, setDelLoading] = useState(false)
  const [delError,   setDelError]   = useState<string | null>(null)

  // Logout-Loading
  const [logoutLoading, setLogoutLoading] = useState(false)

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true)
    await signOut({ callbackUrl: '/' })
  }, [])

  const handleDelete = useCallback(async () => {
    setDelLoading(true)
    setDelError(null)

    try {
      const res = await fetch('/api/user/delete-account', { method: 'DELETE' })

      if (!res.ok) {
        let msg = 'Fehler beim Löschen des Accounts.'
        try {
          const json = (await res.json()) as { error?: string }
          msg = json.error ?? msg
        } catch { /* ignore */ }
        setDelError(msg)
        setDelLoading(false)
        return
      }

      // Account erfolgreich gelöscht → ausloggen + zur Startseite
      await signOut({ callbackUrl: '/' })
    } catch {
      setDelError('Netzwerkfehler. Bitte erneut versuchen.')
      setDelLoading(false)
    }
  }, [])

  // Prevent background scroll when modal open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  // Unused var suppressed
  void router

  return (
    <>
      {/* Delete-Modal */}
      {modalOpen && (
        <DeleteModal
          username={data.username}
          onClose={() => { if (!delLoading) { setModalOpen(false); setDelError(null) } }}
          onDelete={handleDelete}
          loading={delLoading}
          error={delError}
        />
      )}

      <div className="w-full px-8 py-8">

        {/* ── Header-Banner mit Sport-Farbakzent ─────────────────── */}
        <motion.div
          className="mb-8 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: `linear-gradient(135deg, ${color}14 0%, ${color}06 100%)`,
            border:     `1px solid ${color}20`,
          }}
        >
          {/* Farbiger Akzent-Streifen oben */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(to right, ${color}, ${color}60)`,
            }}
          />

          <div className="px-6 py-5 flex items-center gap-5">
            {/* Avatar / Initials */}
            <div className="flex-shrink-0">
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.name}
                  className="w-14 h-14 rounded-2xl object-cover"
                  style={{ border: `2px solid ${color}30` }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{
                    background: `${color}18`,
                    color,
                    border: `2px solid ${color}28`,
                  }}
                >
                  {data.name[0]?.toUpperCase() ?? 'S'}
                </div>
              )}
            </div>

            {/* Name + Meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: '#0A0A0A' }}>
                {data.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {data.username && (
                  <span className="text-sm" style={{ color: '#71717A' }}>
                    @{data.username}
                  </span>
                )}
                {data.primarySport && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: `${color}15`, color }}
                  >
                    {sportLabel(data.primarySport)}
                  </span>
                )}
              </div>
            </div>

            {/* Rechts: KI-Disclaimer klein */}
            <div className="hidden lg:block flex-shrink-0 text-right">
              <p className="text-xs leading-relaxed" style={{ color: '#A1A1AA', maxWidth: 160 }}>
                Einstellungen
              </p>
              <p style={{ fontSize: 10, color: '#C4C4C4', marginTop: 2 }}>
                Account-Informationen & Datenverwaltung
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── 2-Spalten-Grid: links Account+Statistiken · rechts Sitzung+Gefahrenzone ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* ── LINKE SPALTE ──────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Account-Informationen */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl p-6"
              style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <h2 className="text-sm font-bold mb-4" style={{ color: '#0A0A0A' }}>
                Account-Informationen
              </h2>

              {/* Info-Zeilen */}
              <div className="divide-y-0">
                <InfoRow Icon={User}     label="Name"              value={data.name} />
                <InfoRow Icon={Mail}     label="E-Mail-Adresse"    value={data.email} />
                {data.username && (
                  <InfoRow Icon={AtSign} label="Benutzername"      value={`@${data.username}`} accent={color} />
                )}
                {data.state && (
                  <InfoRow Icon={MapPin} label="Bundesland"        value={data.state} />
                )}
                <InfoRow
                  Icon={Calendar}
                  label="Mitglied seit"
                  value={formatDate(data.createdAt)}
                />
                <div className="py-3.5 flex items-center gap-3" style={{ borderBottom: 'none' }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F4F4F5' }}
                  >
                    <Shield size={15} style={{ color: '#71717A' }} />
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: '#A1A1AA' }}>Datenspeicherung</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: '#16A34A' }}>
                      DSGVO-konform · EU Frankfurt (Supabase)
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Statistiken */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6"
              style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <h2 className="text-base font-bold mb-4" style={{ color: '#0A0A0A' }}>
                Statistiken
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <StatCard Icon={Dumbbell} value={data.sessionsCount} label="Trainingseinheiten" color={color} />
                <StatCard Icon={Medal}    value={data.badgesCount}   label="Abzeichen"          color={color} />
                <StatCard Icon={FileText} value={data.postsCount}    label="Beiträge"           color={color} />
              </div>
            </motion.div>

          </div>

          {/* ── RECHTE SPALTE ─────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Sitzung beenden */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-6"
              style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <h2 className="text-base font-bold mb-1" style={{ color: '#0A0A0A' }}>
                Sitzung beenden
              </h2>
              <p className="text-sm mb-5" style={{ color: '#71717A' }}>
                Du bleibst registriert und kannst dich jederzeit wieder einloggen.
              </p>
              <button
                onClick={() => void handleLogout()}
                disabled={logoutLoading}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: '#F4F4F5',
                  color: '#52525B',
                  border: '1px solid #E4E4E7',
                  opacity: logoutLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!logoutLoading) {
                    const btn = e.currentTarget as HTMLButtonElement
                    btn.style.background = '#0A0A0A'
                    btn.style.color = '#FFFFFF'
                    btn.style.borderColor = '#0A0A0A'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!logoutLoading) {
                    const btn = e.currentTarget as HTMLButtonElement
                    btn.style.background = '#F4F4F5'
                    btn.style.color = '#52525B'
                    btn.style.borderColor = '#E4E4E7'
                  }
                }}
              >
                {logoutLoading ? (
                  <Loader2 size={16} className="animate-spin flex-shrink-0" />
                ) : (
                  <LogOut size={16} className="flex-shrink-0" />
                )}
                <span className="flex-1 text-left">
                  {logoutLoading ? 'Abmelden...' : 'Abmelden'}
                </span>
                <ChevronRight size={16} style={{ color: '#A1A1AA', flexShrink: 0 }} />
              </button>
            </motion.div>

            {/* Gefahrenzone */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.20 }}
              className="rounded-2xl p-6"
              style={{
                background: '#FFFAFA',
                border: '1px solid #FECACA',
                boxShadow: '0 1px 4px rgba(239,68,68,0.06)',
              }}
            >
              <h2 className="text-base font-bold mb-1" style={{ color: '#EF4444' }}>
                Gefahrenzone
              </h2>
              <p className="text-sm mb-5" style={{ color: '#71717A' }}>
                Diese Aktionen sind dauerhaft und können nicht rückgängig gemacht werden.
              </p>

              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: '#FEF2F2',
                  color: '#EF4444',
                  border: '1px solid #FECACA',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement
                  btn.style.background = '#EF4444'
                  btn.style.color = '#FFFFFF'
                  btn.style.borderColor = '#EF4444'
                  btn.style.boxShadow = '0 4px 16px rgba(239,68,68,0.25)'
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement
                  btn.style.background = '#FEF2F2'
                  btn.style.color = '#EF4444'
                  btn.style.borderColor = '#FECACA'
                  btn.style.boxShadow = 'none'
                }}
              >
                <Trash2 size={16} className="flex-shrink-0" />
                <span className="flex-1 text-left">Account löschen</span>
                <ChevronRight size={16} style={{ color: 'currentColor', flexShrink: 0 }} />
              </button>

              <p className="text-xs mt-3" style={{ color: '#A1A1AA' }}>
                Alle deine Daten werden sofort und dauerhaft aus unserer Datenbank (Supabase EU Frankfurt) entfernt.
                Diese Aktion entspricht dem DSGVO-Recht auf Vergessenwerden.
              </p>
            </motion.div>

          </div>

        </div>
      </div>
    </>
  )
}
