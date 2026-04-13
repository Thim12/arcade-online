'use client'

// ─────────────────────────────────────────────────────────────────
// app/profil/einstellungen/EinstellungenClient.tsx
// Profil-Einstellungen: 4 Tabs (Profil, Sportarten, Datenschutz, Account)
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Select from '@radix-ui/react-select'
import * as Switch from '@radix-ui/react-switch'
import * as Slider from '@radix-ui/react-slider'
import * as Label from '@radix-ui/react-label'
import * as Dialog from '@radix-ui/react-dialog'
import {
  User,
  Settings,
  Shield,
  Dumbbell,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Download,
  Plus,
  Pencil,
  X,
  ChevronDown,
  AlertTriangle,
  Star,
} from 'lucide-react'
import type { SportLevel, UserGoal, GermanState } from '@prisma/client'
import type { SportSlug } from '@/lib/sport-profiles'
import {
  FUSSBALL_POSITIONEN,
  FUSSBALL_LIGA_NIVEAUS,
  FUSSBALL_SPIELSTILE,
  FUSSBALL_STAERKEN,
  FUSSBALL_ZIELE,
  FUSSBALL_POSITION_LABELS,
  FUSSBALL_LIGA_LABELS,
  FUSSBALL_SPIELSTIL_LABELS,
  FUSSBALL_STAERKE_LABELS,
  FUSSBALL_ZIEL_LABELS,
  STARKERFUSS_LABELS,
  TENNIS_OBERFLAECHEN,
  TENNIS_SPIELSTILE,
  TENNIS_DISZIPLINEN,
  TENNIS_TURNIERERFAHRUNGEN,
  TENNIS_ZIELE,
  TENNIS_OBERFLAECHE_LABELS,
  TENNIS_SPIELSTIL_LABELS,
  TENNIS_DISZIPLIN_LABELS,
  TENNIS_TURNIERERFAHRUNG_LABELS,
  TENNIS_ZIEL_LABELS,
  SPIELHAND_LABELS,
  TENNIS_RUECKHAND_LABELS,
  BASKETBALL_POSITIONEN,
  BASKETBALL_LIGA_NIVEAUS,
  BASKETBALL_STAERKEN,
  BASKETBALL_SPIELSTILE,
  BASKETBALL_ZIELE,
  BASKETBALL_POSITION_LABELS,
  BASKETBALL_LIGA_LABELS,
  BASKETBALL_STAERKE_LABELS,
  BASKETBALL_SPIELSTIL_LABELS,
  BASKETBALL_ZIEL_LABELS,
  WURFHAND_LABELS,
} from '@/lib/sport-profiles'
import type {
  FussballPosition,
  FussballLigaNiveau,
  FussballSpielstil,
  FussballStaerke,
  FussballZiel,
  StarkerFuss,
  TennisOberflaeche,
  TennisSpielstil,
  TennisDisziplin,
  TennisTurniererfahrung,
  TennisZiel,
  Spielhand,
  TennisRueckhand,
  BasketballPosition,
  BasketballLigaNiveau,
  BasketballStaerke,
  BasketballSpielstil,
  BasketballZiel,
  Wurfhand,
} from '@/lib/sport-profiles'

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface SportInfo {
  id: string
  name: string
  slug: string
  colorPrimary: string
  iconName: string
}

interface UserSportData {
  id: string
  sportId: string
  level: SportLevel
  goals: UserGoal[]
  details: unknown
  sport: SportInfo
}

interface UserData {
  id: string
  name: string | null
  email: string
  username: string | null
  image: string | null
  bio: string | null
  birthYear: number | null
  city: string | null
  state: GermanState | null
  xp: number
  level: number
  isPublicProfile: boolean
  emailNotifications: boolean
}

interface InitialData {
  user: UserData
  sports: UserSportData[]
  allSports: SportInfo[]
  hasGoogle: boolean
  hasPassword: boolean
}

interface ToastItem {
  id: number
  type: 'success' | 'error'
  message: string
}

type TabKey = 'profil' | 'sportarten' | 'datenschutz' | 'account'

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const GERMAN_STATE_LABELS: Record<string, string> = {
  HESSEN: 'Hessen',
  BAYERN: 'Bayern',
  BERLIN: 'Berlin',
  BRANDENBURG: 'Brandenburg',
  BREMEN: 'Bremen',
  HAMBURG: 'Hamburg',
  MECKLENBURG_VORPOMMERN: 'Mecklenburg-Vorpommern',
  NIEDERSACHSEN: 'Niedersachsen',
  NORDRHEIN_WESTFALEN: 'Nordrhein-Westfalen',
  RHEINLAND_PFALZ: 'Rheinland-Pfalz',
  SAARLAND: 'Saarland',
  SACHSEN: 'Sachsen',
  SACHSEN_ANHALT: 'Sachsen-Anhalt',
  SCHLESWIG_HOLSTEIN: 'Schleswig-Holstein',
  THUERINGEN: 'Thüringen',
  BADEN_WUERTTEMBERG: 'Baden-Württemberg',
}

const GERMAN_STATE_OPTIONS = Object.entries(GERMAN_STATE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const SPORT_LEVEL_LABELS: Record<SportLevel, string> = {
  ANFAENGER: 'Anfänger',
  FORTGESCHRITTENE: 'Fortgeschrittene',
  WETTKAMPF: 'Wettkampf',
  PROFI: 'Profi',
}

const USER_GOAL_LABELS: Record<UserGoal, string> = {
  FITNESS: 'Fitness',
  WETTKAMPF: 'Wettkampf',
  FREIZEITSPORT: 'Freizeitsport',
  ABNEHMEN: 'Abnehmen',
  MUSKELAUFBAU: 'Muskelaufbau',
  TECHNIK_VERBESSERN: 'Technik verbessern',
}

const ALL_GOALS: UserGoal[] = [
  'FITNESS',
  'WETTKAMPF',
  'FREIZEITSPORT',
  'ABNEHMEN',
  'MUSKELAUFBAU',
  'TECHNIK_VERBESSERN',
]

const ALL_LEVELS: SportLevel[] = ['ANFAENGER', 'FORTGESCHRITTENE', 'WETTKAMPF', 'PROFI']

// ─────────────────────────────────────────────────────────────────
// Shared UI Components
// ─────────────────────────────────────────────────────────────────

interface StyledSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options: { value: string; label: string }[]
  accentColor?: string
}

function StyledSelect({
  value,
  onValueChange,
  placeholder = 'Auswählen…',
  options,
  accentColor = '#16A34A',
}: StyledSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className="flex h-10 w-full items-center justify-between rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none data-[placeholder]:text-[#A1A1AA] transition-colors"
        style={{ ['--tw-ring-color' as string]: `${accentColor}4D` }}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[#E4E4E7] bg-white shadow-lg"
        >
          <Select.ScrollUpButton className="flex h-7 cursor-default items-center justify-center bg-white text-[#71717A]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1 max-h-60">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-[#0A0A0A] outline-none hover:bg-[#F4F4F5] focus:bg-[#F4F4F5] data-[state=checked]:font-medium"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="flex h-7 cursor-default items-center justify-center bg-white text-[#71717A]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}

interface StyledSliderProps {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  accentColor?: string
}

function StyledSlider({ value, onChange, min, max, step = 1, accentColor = '#16A34A' }: StyledSliderProps) {
  return (
    <Slider.Root
      value={[value]}
      onValueChange={(values) => {
        const v = values[0]
        if (v !== undefined) onChange(v)
      }}
      min={min}
      max={max}
      step={step}
      className="relative flex items-center w-full h-5 select-none touch-none"
    >
      <Slider.Track className="relative h-1.5 flex-1 rounded-full bg-[#E4E4E7]">
        <Slider.Range className="absolute h-full rounded-full" style={{ background: accentColor }} />
      </Slider.Track>
      <Slider.Thumb
        className="block w-4 h-4 rounded-full bg-white shadow focus:outline-none focus-visible:ring-2"
        style={{ border: `2px solid ${accentColor}` }}
      />
    </Slider.Root>
  )
}

// ─────────────────────────────────────────────────────────────────
// Toast System
// ─────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium"
            style={{
              background: t.type === 'success' ? '#F0FDF4' : '#FEF2F2',
              borderColor: t.type === 'success' ? '#BBF7D0' : '#FECACA',
              color: t.type === 'success' ? '#15803D' : '#DC2626',
            }}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{t.message}</span>
            <button
              onClick={() => onRemove(t.id)}
              className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Schließen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++counterRef.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

// ─────────────────────────────────────────────────────────────────
// Sport Panels
// ─────────────────────────────────────────────────────────────────

interface FussballFormState {
  position: FussballPosition
  starkerFuss: StarkerFuss
  ligaNiveau: FussballLigaNiveau
  spielstil: FussballSpielstil
  staerken: FussballStaerke[]
  koerpergroesseCm: number
  gewichtKg: number
  trainingsEinheitenProWoche: number
  ziel: FussballZiel
  lieblingsspieler: string
}

interface TennisFormState {
  spielhand: Spielhand
  rueckhand: TennisRueckhand
  lieblingsoberflaeche: TennisOberflaeche
  spielstil: TennisSpielstil
  disziplinen: TennisDisziplin[]
  turniererfahrung: TennisTurniererfahrung
  sucheSparringpartner: boolean
  maxSparringDistanzKm: number
  trainingsEinheitenProWoche: number
  ziel: TennisZiel
  lieblingsspieler: string
}

interface BasketballFormState {
  position: BasketballPosition
  wurfhand: Wurfhand
  ligaNiveau: BasketballLigaNiveau
  staerken: BasketballStaerke[]
  spielstil: BasketballSpielstil
  koerpergroesseCm: number
  trainingsEinheitenProWoche: number
  ziel: BasketballZiel
  lieblingsspieler: string
}

function getFussballDefaults(details: unknown): FussballFormState {
  const d = details as Partial<FussballFormState> | null
  return {
    position: d?.position ?? 'ZENTRALES_MITTELFELD',
    starkerFuss: d?.starkerFuss ?? 'RECHTS',
    ligaNiveau: d?.ligaNiveau ?? ('KREISLIGA_A' as FussballLigaNiveau),
    spielstil: d?.spielstil ?? 'AUSGEWOGEN',
    staerken: d?.staerken ?? [],
    koerpergroesseCm: d?.koerpergroesseCm ?? 175,
    gewichtKg: d?.gewichtKg ?? 75,
    trainingsEinheitenProWoche: d?.trainingsEinheitenProWoche ?? 3,
    ziel: d?.ziel ?? 'NIVEAU_HALTEN',
    lieblingsspieler: d?.lieblingsspieler ?? '',
  }
}

function getTennisDefaults(details: unknown): TennisFormState {
  const d = details as Partial<TennisFormState> | null
  return {
    spielhand: d?.spielhand ?? 'RECHTS',
    rueckhand: d?.rueckhand ?? 'ZWEIHAENDIG',
    lieblingsoberflaeche: d?.lieblingsoberflaeche ?? 'SANDPLATZ',
    spielstil: d?.spielstil ?? 'BASELINER',
    disziplinen: d?.disziplinen ?? ['EINZEL'],
    turniererfahrung: d?.turniererfahrung ?? 'KEINE',
    sucheSparringpartner: d?.sucheSparringpartner ?? false,
    maxSparringDistanzKm: d?.maxSparringDistanzKm ?? 25,
    trainingsEinheitenProWoche: d?.trainingsEinheitenProWoche ?? 2,
    ziel: d?.ziel ?? 'LK_VERBESSERN',
    lieblingsspieler: d?.lieblingsspieler ?? '',
  }
}

function getBasketballDefaults(details: unknown): BasketballFormState {
  const d = details as Partial<BasketballFormState> | null
  return {
    position: d?.position ?? 'SMALL_FORWARD',
    wurfhand: d?.wurfhand ?? 'RECHTS',
    ligaNiveau: d?.ligaNiveau ?? 'KREISLIGA',
    staerken: d?.staerken ?? [],
    spielstil: d?.spielstil ?? 'ALLROUNDER',
    koerpergroesseCm: d?.koerpergroesseCm ?? 185,
    trainingsEinheitenProWoche: d?.trainingsEinheitenProWoche ?? 3,
    ziel: d?.ziel ?? 'LEISTUNG_VERBESSERN',
    lieblingsspieler: d?.lieblingsspieler ?? '',
  }
}

// ── Fußball Panel ─────────────────────────────────────────────────

function FussballPanel({
  state,
  onChange,
  accent,
}: {
  state: FussballFormState
  onChange: (patch: Partial<FussballFormState>) => void
  accent: string
}) {
  const ligaOptions = FUSSBALL_LIGA_NIVEAUS.map((v) => ({ value: v, label: FUSSBALL_LIGA_LABELS[v] }))
  const spielstilOptions = FUSSBALL_SPIELSTILE.map((v) => ({ value: v, label: FUSSBALL_SPIELSTIL_LABELS[v] }))
  const zielOptions = FUSSBALL_ZIELE.map((v) => ({ value: v, label: FUSSBALL_ZIEL_LABELS[v] }))

  return (
    <div className="flex flex-col gap-5">
      {/* Position */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Position</Label.Root>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FUSSBALL_POSITIONEN.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => onChange({ position: pos })}
              className="h-10 rounded-lg border text-xs font-medium transition-all px-2"
              style={{
                background: state.position === pos ? '#F0FDF4' : 'white',
                borderColor: state.position === pos ? accent : '#E4E4E7',
                borderWidth: state.position === pos ? '2px' : '1px',
                color: state.position === pos ? accent : '#52525B',
              }}
            >
              {FUSSBALL_POSITION_LABELS[pos]}
            </button>
          ))}
        </div>
      </div>

      {/* Starker Fuß */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Starker Fuß</Label.Root>
        <div className="grid grid-cols-3 gap-2">
          {(['RECHTS', 'LINKS', 'BEIDFUESSIG'] as StarkerFuss[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onChange({ starkerFuss: f })}
              className="h-10 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: state.starkerFuss === f ? '#F0FDF4' : 'white',
                borderColor: state.starkerFuss === f ? accent : '#E4E4E7',
                borderWidth: state.starkerFuss === f ? '2px' : '1px',
                color: state.starkerFuss === f ? accent : '#52525B',
              }}
            >
              {STARKERFUSS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Liga-Niveau */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Liga-Niveau</Label.Root>
        <StyledSelect
          value={state.ligaNiveau}
          onValueChange={(v) => onChange({ ligaNiveau: v as FussballLigaNiveau })}
          options={ligaOptions}
          accentColor={accent}
        />
      </div>

      {/* Spielstil */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielstil</Label.Root>
        <StyledSelect
          value={state.spielstil}
          onValueChange={(v) => onChange({ spielstil: v as FussballSpielstil })}
          options={spielstilOptions}
          accentColor={accent}
        />
      </div>

      {/* Stärken */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Stärken</Label.Root>
          <span className="text-xs text-[#71717A]">({state.staerken.length} / 4)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FUSSBALL_STAERKEN.map((s) => {
            const isSelected = state.staerken.includes(s)
            const isDisabled = !isSelected && state.staerken.length >= 4
            return (
              <button
                key={s}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isSelected) {
                    onChange({ staerken: state.staerken.filter((x) => x !== s) })
                  } else if (!isDisabled) {
                    onChange({ staerken: [...state.staerken, s] })
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
                style={
                  isSelected
                    ? { background: accent, color: 'white', borderColor: accent }
                    : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }
                }
              >
                {FUSSBALL_STAERKE_LABELS[s]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Trainingseinheiten */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Training / Woche</Label.Root>
          <span className="text-sm font-semibold" style={{ color: accent }}>{state.trainingsEinheitenProWoche}×</span>
        </div>
        <StyledSlider value={state.trainingsEinheitenProWoche} onChange={(v) => onChange({ trainingsEinheitenProWoche: v })} min={1} max={7} accentColor={accent} />
      </div>

      {/* Ziel */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Ziel</Label.Root>
        <StyledSelect
          value={state.ziel}
          onValueChange={(v) => onChange({ ziel: v as FussballZiel })}
          options={zielOptions}
          accentColor={accent}
        />
      </div>

      {/* Lieblingsspieler */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[#52525B]">Lieblingsspieler <span className="text-[#A1A1AA]">(optional)</span></label>
        <input
          type="text"
          value={state.lieblingsspieler}
          onChange={(e) => onChange({ lieblingsspieler: e.target.value })}
          placeholder="z.B. Özil"
          maxLength={100}
          className="h-10 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-colors bg-white"
        />
      </div>
    </div>
  )
}

// ── Tennis Panel ──────────────────────────────────────────────────

function TennisPanel({
  state,
  onChange,
  accent,
}: {
  state: TennisFormState
  onChange: (patch: Partial<TennisFormState>) => void
  accent: string
}) {
  const oberflaecheOptions = TENNIS_OBERFLAECHEN.map((v) => ({ value: v, label: TENNIS_OBERFLAECHE_LABELS[v] }))
  const spielstilOptions = TENNIS_SPIELSTILE.map((v) => ({ value: v, label: TENNIS_SPIELSTIL_LABELS[v] }))
  const turniererfahrungOptions = TENNIS_TURNIERERFAHRUNGEN.map((v) => ({ value: v, label: TENNIS_TURNIERERFAHRUNG_LABELS[v] }))
  const zielOptions = TENNIS_ZIELE.map((v) => ({ value: v, label: TENNIS_ZIEL_LABELS[v] }))

  return (
    <div className="flex flex-col gap-5">
      {/* Spielhand */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielhand</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(['RECHTS', 'LINKS'] as Spielhand[]).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChange({ spielhand: h })}
              className="h-10 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: state.spielhand === h ? '#FFFBEB' : 'white',
                borderColor: state.spielhand === h ? accent : '#E4E4E7',
                borderWidth: state.spielhand === h ? '2px' : '1px',
                color: state.spielhand === h ? accent : '#52525B',
              }}
            >
              {SPIELHAND_LABELS[h]}
            </button>
          ))}
        </div>
      </div>

      {/* Rückhand */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Rückhand</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(['EINHAENDIG', 'ZWEIHAENDIG'] as TennisRueckhand[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ rueckhand: r })}
              className="h-10 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: state.rueckhand === r ? '#FFFBEB' : 'white',
                borderColor: state.rueckhand === r ? accent : '#E4E4E7',
                borderWidth: state.rueckhand === r ? '2px' : '1px',
                color: state.rueckhand === r ? accent : '#52525B',
              }}
            >
              {TENNIS_RUECKHAND_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Lieblingsbelag */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Lieblingsbelag</Label.Root>
        <StyledSelect
          value={state.lieblingsoberflaeche}
          onValueChange={(v) => onChange({ lieblingsoberflaeche: v as TennisOberflaeche })}
          options={oberflaecheOptions}
          accentColor={accent}
        />
      </div>

      {/* Spielstil */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielstil</Label.Root>
        <StyledSelect
          value={state.spielstil}
          onValueChange={(v) => onChange({ spielstil: v as TennisSpielstil })}
          options={spielstilOptions}
          accentColor={accent}
        />
      </div>

      {/* Disziplinen */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Disziplinen</Label.Root>
        <div className="flex gap-2">
          {TENNIS_DISZIPLINEN.map((d) => {
            const isSelected = state.disziplinen.includes(d)
            return (
              <button
                key={d}
                type="button"
                disabled={isSelected && state.disziplinen.length <= 1}
                onClick={() => {
                  if (isSelected) {
                    if (state.disziplinen.length > 1) onChange({ disziplinen: state.disziplinen.filter((x) => x !== d) })
                  } else {
                    onChange({ disziplinen: [...state.disziplinen, d] })
                  }
                }}
                className="flex-1 h-10 rounded-lg border text-sm font-medium transition-all"
                style={{
                  background: isSelected ? '#FFFBEB' : 'white',
                  borderColor: isSelected ? accent : '#E4E4E7',
                  borderWidth: isSelected ? '2px' : '1px',
                  color: isSelected ? accent : '#52525B',
                }}
              >
                {TENNIS_DISZIPLIN_LABELS[d]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Turniererfahrung */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Turniererfahrung</Label.Root>
        <StyledSelect
          value={state.turniererfahrung}
          onValueChange={(v) => onChange({ turniererfahrung: v as TennisTurniererfahrung })}
          options={turniererfahrungOptions}
          accentColor={accent}
        />
      </div>

      {/* Sparring */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0A0A0A]">Sparringpartner suchen</p>
          <p className="text-xs text-[#71717A]">Andere Tennis-Spieler finden</p>
        </div>
        <Switch.Root
          checked={state.sucheSparringpartner}
          onCheckedChange={(v) => onChange({ sucheSparringpartner: v })}
          className="relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{ background: state.sucheSparringpartner ? accent : '#E4E4E7' }}
        >
          <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
        </Switch.Root>
      </div>

      {/* Trainingseinheiten */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Training / Woche</Label.Root>
          <span className="text-sm font-semibold" style={{ color: accent }}>{state.trainingsEinheitenProWoche}×</span>
        </div>
        <StyledSlider value={state.trainingsEinheitenProWoche} onChange={(v) => onChange({ trainingsEinheitenProWoche: v })} min={1} max={7} accentColor={accent} />
      </div>

      {/* Ziel */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Ziel</Label.Root>
        <StyledSelect
          value={state.ziel}
          onValueChange={(v) => onChange({ ziel: v as TennisZiel })}
          options={zielOptions}
          accentColor={accent}
        />
      </div>

      {/* Lieblingsspieler */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[#52525B]">Lieblingsspieler <span className="text-[#A1A1AA]">(optional)</span></label>
        <input
          type="text"
          value={state.lieblingsspieler}
          onChange={(e) => onChange({ lieblingsspieler: e.target.value })}
          placeholder="z.B. Federer"
          maxLength={100}
          className="h-10 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-colors bg-white"
        />
      </div>
    </div>
  )
}

// ── Basketball Panel ──────────────────────────────────────────────

function BasketballPanel({
  state,
  onChange,
  accent,
}: {
  state: BasketballFormState
  onChange: (patch: Partial<BasketballFormState>) => void
  accent: string
}) {
  const ligaOptions = BASKETBALL_LIGA_NIVEAUS.map((v) => ({ value: v, label: BASKETBALL_LIGA_LABELS[v] }))
  const spielstilOptions = BASKETBALL_SPIELSTILE.map((v) => ({ value: v, label: BASKETBALL_SPIELSTIL_LABELS[v] }))
  const zielOptions = BASKETBALL_ZIELE.map((v) => ({ value: v, label: BASKETBALL_ZIEL_LABELS[v] }))

  return (
    <div className="flex flex-col gap-5">
      {/* Position */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Position</Label.Root>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BASKETBALL_POSITIONEN.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => onChange({ position: pos })}
              className="h-10 rounded-lg border text-xs font-medium transition-all px-2"
              style={{
                background: state.position === pos ? '#FFF7ED' : 'white',
                borderColor: state.position === pos ? accent : '#E4E4E7',
                borderWidth: state.position === pos ? '2px' : '1px',
                color: state.position === pos ? accent : '#52525B',
              }}
            >
              {BASKETBALL_POSITION_LABELS[pos]}
            </button>
          ))}
        </div>
      </div>

      {/* Wurfhand */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Wurfhand</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(['RECHTS', 'LINKS'] as Wurfhand[]).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChange({ wurfhand: h })}
              className="h-10 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: state.wurfhand === h ? '#FFF7ED' : 'white',
                borderColor: state.wurfhand === h ? accent : '#E4E4E7',
                borderWidth: state.wurfhand === h ? '2px' : '1px',
                color: state.wurfhand === h ? accent : '#52525B',
              }}
            >
              {WURFHAND_LABELS[h]}
            </button>
          ))}
        </div>
      </div>

      {/* Körpergröße */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Körpergröße</Label.Root>
          <span className="text-sm font-semibold" style={{ color: accent }}>{state.koerpergroesseCm} cm</span>
        </div>
        <StyledSlider value={state.koerpergroesseCm} onChange={(v) => onChange({ koerpergroesseCm: v })} min={150} max={230} accentColor={accent} />
      </div>

      {/* Liga */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Liga-Niveau</Label.Root>
        <StyledSelect
          value={state.ligaNiveau}
          onValueChange={(v) => onChange({ ligaNiveau: v as BasketballLigaNiveau })}
          options={ligaOptions}
          accentColor={accent}
        />
      </div>

      {/* Stärken */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Stärken</Label.Root>
          <span className="text-xs text-[#71717A]">({state.staerken.length} / 4)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {BASKETBALL_STAERKEN.map((s) => {
            const isSelected = state.staerken.includes(s)
            const isDisabled = !isSelected && state.staerken.length >= 4
            return (
              <button
                key={s}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (isSelected) {
                    onChange({ staerken: state.staerken.filter((x) => x !== s) })
                  } else if (!isDisabled) {
                    onChange({ staerken: [...state.staerken, s] })
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
                style={
                  isSelected
                    ? { background: accent, color: 'white', borderColor: accent }
                    : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }
                }
              >
                {BASKETBALL_STAERKE_LABELS[s]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Spielstil */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielstil</Label.Root>
        <StyledSelect
          value={state.spielstil}
          onValueChange={(v) => onChange({ spielstil: v as BasketballSpielstil })}
          options={spielstilOptions}
          accentColor={accent}
        />
      </div>

      {/* Trainingseinheiten */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Training / Woche</Label.Root>
          <span className="text-sm font-semibold" style={{ color: accent }}>{state.trainingsEinheitenProWoche}×</span>
        </div>
        <StyledSlider value={state.trainingsEinheitenProWoche} onChange={(v) => onChange({ trainingsEinheitenProWoche: v })} min={1} max={7} accentColor={accent} />
      </div>

      {/* Ziel */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Ziel</Label.Root>
        <StyledSelect
          value={state.ziel}
          onValueChange={(v) => onChange({ ziel: v as BasketballZiel })}
          options={zielOptions}
          accentColor={accent}
        />
      </div>

      {/* Lieblingsspieler */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[#52525B]">Lieblingsspieler <span className="text-[#A1A1AA]">(optional)</span></label>
        <input
          type="text"
          value={state.lieblingsspieler}
          onChange={(e) => onChange({ lieblingsspieler: e.target.value })}
          placeholder="z.B. Nowitzki"
          maxLength={100}
          className="h-10 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-colors bg-white"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab: Profil
// ─────────────────────────────────────────────────────────────────

function TabProfil({
  user,
  onUpdate,
  addToast,
}: {
  user: UserData
  onUpdate: (updated: Partial<UserData>) => void
  addToast: (type: 'success' | 'error', message: string) => void
}) {
  const [name, setName] = useState(user.name ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [city, setCity] = useState(user.city ?? '')
  const [state, setState] = useState(user.state ?? '')
  const [isPublicProfile, setIsPublicProfile] = useState(user.isPublicProfile)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user.image ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Bitte lade ein Bild hoch.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'Bild darf maximal 5 MB groß sein.')
      return
    }
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/auth/upload-avatar', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload fehlgeschlagen')
      const data = (await res.json()) as { url: string }
      setAvatarUrl(data.url)

      // Update user image in profile
      const patchRes = await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: data.url }),
      })
      if (patchRes.ok) {
        onUpdate({ image: data.url })
        addToast('success', 'Profilbild aktualisiert.')
      }
    } catch {
      addToast('error', 'Upload fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setAvatarUploading(false)
    }
  }, [addToast, onUpdate])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) void handleAvatarUpload(file)
    },
    [handleAvatarUpload],
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          bio: bio || undefined,
          city: city || undefined,
          state: state || null,
          isPublicProfile,
        }),
      })
      if (!res.ok) throw new Error()
      onUpdate({ name, bio, city, state: state as GermanState | null, isPublicProfile })
      addToast('success', 'Profil gespeichert.')
    } catch {
      addToast('error', 'Fehler beim Speichern. Bitte versuche es erneut.')
    } finally {
      setSaving(false)
    }
  }

  const bioCharCount = bio.length

  return (
    <div className="flex flex-col gap-8">
      {/* Avatar */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-[#0A0A0A]">Profilbild</h3>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profilbild"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#E4E4E7]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center border-2 border-[#E4E4E7]">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          <div
            ref={dropZoneRef}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
            style={{
              borderColor: isDragging ? '#16A34A' : '#E4E4E7',
              background: isDragging ? '#F0FDF4' : '#FAFAFA',
            }}
          >
            <Upload className="w-5 h-5 text-[#71717A]" />
            <p className="text-xs text-[#71717A] text-center px-2">Ziehen oder klicken zum Hochladen · max. 5 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleAvatarUpload(file)
            }}
          />
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label.Root htmlFor="name" className="text-sm font-medium text-[#0A0A0A]">Name</Label.Root>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Dein Name"
          className="h-10 px-3 rounded-lg border border-[#E4E4E7] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 transition-colors"
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label.Root htmlFor="bio" className="text-sm font-medium text-[#0A0A0A]">Bio</Label.Root>
          <span className="text-xs text-[#A1A1AA]">{bioCharCount} / 300</span>
        </div>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Erzähle etwas über dich…"
          className="px-3 py-2.5 rounded-lg border border-[#E4E4E7] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 transition-colors resize-none"
        />
      </div>

      {/* Stadt + Bundesland */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label.Root htmlFor="city" className="text-sm font-medium text-[#0A0A0A]">Stadt</Label.Root>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={80}
            placeholder="z.B. Frankfurt"
            className="h-10 px-3 rounded-lg border border-[#E4E4E7] bg-white text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Bundesland</Label.Root>
          <StyledSelect
            value={state}
            onValueChange={setState}
            placeholder="Bundesland wählen…"
            options={GERMAN_STATE_OPTIONS}
            accentColor="#16A34A"
          />
        </div>
      </div>

      {/* Öffentliches Profil */}
      <div className="flex items-center justify-between py-4 border-t border-[#F4F4F5]">
        <div>
          <p className="text-sm font-medium text-[#0A0A0A]">Profil öffentlich</p>
          <p className="text-xs text-[#71717A] mt-0.5">Andere Nutzer können dein Profil sehen</p>
        </div>
        <Switch.Root
          checked={isPublicProfile}
          onCheckedChange={setIsPublicProfile}
          className="relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{ background: isPublicProfile ? '#16A34A' : '#E4E4E7' }}
        >
          <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
        </Switch.Root>
      </div>

      {/* Speichern */}
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
        style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {saving ? 'Wird gespeichert…' : 'Speichern'}
      </button>

      <p className="text-center text-xs text-[#A1A1AA]">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab: Sportarten
// ─────────────────────────────────────────────────────────────────

interface SportCardState {
  editOpen: boolean
  level: SportLevel
  goals: UserGoal[]
  fussball: FussballFormState
  tennis: TennisFormState
  basketball: BasketballFormState
  saving: boolean
}

function SportCard({
  userSport,
  isPrimary,
  isOnlyOne,
  onDelete,
  onUpdated,
  addToast,
}: {
  userSport: UserSportData
  isPrimary: boolean
  isOnlyOne: boolean
  onDelete: (id: string) => void
  onUpdated: (updated: UserSportData) => void
  addToast: (type: 'success' | 'error', message: string) => void
}) {
  const accent = userSport.sport.colorPrimary
  const slug = userSport.sport.slug as SportSlug

  const [editOpen, setEditOpen] = useState(false)
  const [level, setLevel] = useState<SportLevel>(userSport.level)
  const [goals, setGoals] = useState<UserGoal[]>(userSport.goals)
  const [fussball, setFussball] = useState<FussballFormState>(() => getFussballDefaults(userSport.details))
  const [tennis, setTennis] = useState<TennisFormState>(() => getTennisDefaults(userSport.details))
  const [basketball, setBasketball] = useState<BasketballFormState>(() => getBasketballDefaults(userSport.details))
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const getDetails = () => {
    if (slug === 'fussball') return fussball
    if (slug === 'tennis') return tennis
    if (slug === 'basketball') return basketball
    return null
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/sport-profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSportId: userSport.id,
          level,
          goals,
          details: getDetails(),
        }),
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { userSport: UserSportData }
      onUpdated(data.userSport)
      setEditOpen(false)
      addToast('success', `${userSport.sport.name}-Profil gespeichert.`)
    } catch {
      addToast('error', 'Fehler beim Speichern. Bitte versuche es erneut.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch('/api/user/sport-profil', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userSportId: userSport.id }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        addToast('error', data.error ?? 'Fehler beim Entfernen.')
        return
      }
      onDelete(userSport.id)
      addToast('success', `${userSport.sport.name} entfernt.`)
    } catch {
      addToast('error', 'Fehler beim Entfernen.')
    }
    setDeleteOpen(false)
  }

  return (
    <div className="rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
          >
            {userSport.sport.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0A0A0A] text-sm">{userSport.sport.name}</span>
              {isPrimary && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${accent}18`, color: accent }}>
                  <Star className="w-3 h-3" />
                  Hauptsport
                </span>
              )}
            </div>
            <p className="text-xs text-[#71717A] mt-0.5">{SPORT_LEVEL_LABELS[userSport.level]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-xs font-medium text-[#52525B] hover:bg-[#F4F4F5] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Bearbeiten
          </button>

          <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                disabled={isOnlyOne}
                title={isOnlyOne ? 'Du musst mindestens eine Sportart behalten.' : undefined}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#E4E4E7] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
              <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
                <Dialog.Title className="text-base font-semibold text-[#0A0A0A] mb-2">
                  {userSport.sport.name} entfernen?
                </Dialog.Title>
                <Dialog.Description className="text-sm text-[#71717A] mb-6">
                  Diese Sportart wird aus deinem Profil entfernt. Trainingspläne und Einträge bleiben erhalten.
                </Dialog.Description>
                <div className="flex gap-3">
                  <Dialog.Close asChild>
                    <button type="button" className="flex-1 h-10 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:bg-[#F4F4F5] transition-colors">
                      Abbrechen
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] transition-colors"
                  >
                    Entfernen
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* Edit Panel */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#F4F4F5] px-5 py-5 flex flex-col gap-5">
              {/* Level */}
              <div className="flex flex-col gap-2">
                <Label.Root className="text-sm font-medium text-[#0A0A0A]">Niveau</Label.Root>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className="h-10 rounded-lg border text-sm font-medium transition-all"
                      style={{
                        background: level === l ? `${accent}18` : 'white',
                        borderColor: level === l ? accent : '#E4E4E7',
                        borderWidth: level === l ? '2px' : '1px',
                        color: level === l ? accent : '#52525B',
                      }}
                    >
                      {SPORT_LEVEL_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goals */}
              <div className="flex flex-col gap-2">
                <Label.Root className="text-sm font-medium text-[#0A0A0A]">Ziele</Label.Root>
                <div className="flex flex-wrap gap-2">
                  {ALL_GOALS.map((g) => {
                    const isSelected = goals.includes(g)
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (goals.length > 1) setGoals(goals.filter((x) => x !== g))
                          } else {
                            setGoals([...goals, g])
                          }
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                        style={
                          isSelected
                            ? { background: accent, color: 'white', borderColor: accent }
                            : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }
                        }
                      >
                        {USER_GOAL_LABELS[g]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sport-spezifische Details */}
              {slug === 'fussball' && (
                <FussballPanel
                  state={fussball}
                  onChange={(patch) => setFussball((prev) => ({ ...prev, ...patch }))}
                  accent={accent}
                />
              )}
              {slug === 'tennis' && (
                <TennisPanel
                  state={tennis}
                  onChange={(patch) => setTennis((prev) => ({ ...prev, ...patch }))}
                  accent={accent}
                />
              )}
              {slug === 'basketball' && (
                <BasketballPanel
                  state={basketball}
                  onChange={(patch) => setBasketball((prev) => ({ ...prev, ...patch }))}
                  accent={accent}
                />
              )}

              {/* Speichern */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 h-10 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:bg-[#F4F4F5] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:scale-[1.02] disabled:scale-100"
                  style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? 'Speichert…' : 'Speichern'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Add Sport Panel ───────────────────────────────────────────────

function AddSportPanel({
  availableSports,
  onAdded,
  onCancel,
  addToast,
}: {
  availableSports: SportInfo[]
  onAdded: (userSport: UserSportData) => void
  onCancel: () => void
  addToast: (type: 'success' | 'error', message: string) => void
}) {
  const [selectedSport, setSelectedSport] = useState<SportInfo | null>(null)
  const [level, setLevel] = useState<SportLevel>('ANFAENGER')
  const [goals, setGoals] = useState<UserGoal[]>(['FITNESS'])
  const [fussball, setFussball] = useState<FussballFormState>(() => getFussballDefaults(null))
  const [tennis, setTennis] = useState<TennisFormState>(() => getTennisDefaults(null))
  const [basketball, setBasketball] = useState<BasketballFormState>(() => getBasketballDefaults(null))
  const [saving, setSaving] = useState(false)

  const slug = selectedSport?.slug as SportSlug | undefined

  const getDetails = () => {
    if (slug === 'fussball') return fussball
    if (slug === 'tennis') return tennis
    if (slug === 'basketball') return basketball
    return null
  }

  const handleAdd = async () => {
    if (!selectedSport) return
    setSaving(true)
    try {
      const res = await fetch('/api/user/sport-profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sportId: selectedSport.id,
          level,
          goals,
          details: getDetails(),
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        addToast('error', data.error ?? 'Fehler beim Hinzufügen.')
        return
      }
      const data = (await res.json()) as { userSport: UserSportData }
      onAdded(data.userSport)
      addToast('success', `${selectedSport.name} hinzugefügt.`)
    } catch {
      addToast('error', 'Fehler beim Hinzufügen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#E4E4E7] bg-[#FAFAFA] p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#0A0A0A]">Neue Sportart</h4>
        <button type="button" onClick={onCancel} className="text-[#71717A] hover:text-[#0A0A0A] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sport Selection */}
      {!selectedSport ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {availableSports.map((sport) => (
            <button
              key={sport.id}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-[#E4E4E7] bg-white hover:border-[#16A34A] hover:bg-[#F0FDF4] transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: `linear-gradient(135deg, ${sport.colorPrimary}, ${sport.colorPrimary}CC)` }}
              >
                {sport.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-[#0A0A0A]">{sport.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[#F4F4F5]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: selectedSport.colorPrimary }}
            >
              {selectedSport.name.charAt(0)}
            </div>
            <span className="font-semibold text-sm text-[#0A0A0A]">{selectedSport.name}</span>
            <button
              type="button"
              onClick={() => setSelectedSport(null)}
              className="ml-auto text-xs text-[#71717A] hover:text-[#0A0A0A] underline transition-colors"
            >
              Ändern
            </button>
          </div>

          {/* Level */}
          <div className="flex flex-col gap-2">
            <Label.Root className="text-sm font-medium text-[#0A0A0A]">Niveau</Label.Root>
            <div className="grid grid-cols-2 gap-2">
              {ALL_LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className="h-10 rounded-lg border text-sm font-medium transition-all"
                  style={{
                    background: level === l ? `${selectedSport.colorPrimary}18` : 'white',
                    borderColor: level === l ? selectedSport.colorPrimary : '#E4E4E7',
                    borderWidth: level === l ? '2px' : '1px',
                    color: level === l ? selectedSport.colorPrimary : '#52525B',
                  }}
                >
                  {SPORT_LEVEL_LABELS[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="flex flex-col gap-2">
            <Label.Root className="text-sm font-medium text-[#0A0A0A]">Ziele</Label.Root>
            <div className="flex flex-wrap gap-2">
              {ALL_GOALS.map((g) => {
                const isSelected = goals.includes(g)
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (goals.length > 1) setGoals(goals.filter((x) => x !== g))
                      } else {
                        setGoals([...goals, g])
                      }
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                    style={
                      isSelected
                        ? { background: selectedSport.colorPrimary, color: 'white', borderColor: selectedSport.colorPrimary }
                        : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }
                    }
                  >
                    {USER_GOAL_LABELS[g]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sport-spezifische Details */}
          {slug === 'fussball' && (
            <FussballPanel
              state={fussball}
              onChange={(patch) => setFussball((prev) => ({ ...prev, ...patch }))}
              accent={selectedSport.colorPrimary}
            />
          )}
          {slug === 'tennis' && (
            <TennisPanel
              state={tennis}
              onChange={(patch) => setTennis((prev) => ({ ...prev, ...patch }))}
              accent={selectedSport.colorPrimary}
            />
          )}
          {slug === 'basketball' && (
            <BasketballPanel
              state={basketball}
              onChange={(patch) => setBasketball((prev) => ({ ...prev, ...patch }))}
              accent={selectedSport.colorPrimary}
            />
          )}

          {/* Hinzufügen */}
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={saving}
            className="h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:scale-[1.02] disabled:scale-100"
            style={{ background: `linear-gradient(135deg, ${selectedSport.colorPrimary}, ${selectedSport.colorPrimary}CC)` }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Wird hinzugefügt…' : 'Hinzufügen'}
          </button>
        </div>
      )}
    </div>
  )
}

function TabSportarten({
  sports,
  allSports,
  onSportsChange,
  addToast,
}: {
  sports: UserSportData[]
  allSports: SportInfo[]
  onSportsChange: (sports: UserSportData[]) => void
  addToast: (type: 'success' | 'error', message: string) => void
}) {
  const [showAddPanel, setShowAddPanel] = useState(false)

  const availableSports = allSports.filter((s) => !sports.some((us) => us.sportId === s.id))
  const canAdd = sports.length < 3 && availableSports.length > 0

  const handleUpdated = (updated: UserSportData) => {
    onSportsChange(sports.map((s) => (s.id === updated.id ? updated : s)))
  }

  const handleDeleted = (id: string) => {
    onSportsChange(sports.filter((s) => s.id !== id))
  }

  const handleAdded = (userSport: UserSportData) => {
    onSportsChange([...sports, userSport])
    setShowAddPanel(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {sports.map((us, i) => (
        <SportCard
          key={us.id}
          userSport={us}
          isPrimary={i === 0}
          isOnlyOne={sports.length === 1}
          onDelete={handleDeleted}
          onUpdated={handleUpdated}
          addToast={addToast}
        />
      ))}

      {/* Add Panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
          >
            <AddSportPanel
              availableSports={availableSports}
              onAdded={handleAdded}
              onCancel={() => setShowAddPanel(false)}
              addToast={addToast}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hinzufügen Button */}
      {!showAddPanel && (
        <button
          type="button"
          onClick={() => setShowAddPanel(true)}
          disabled={!canAdd}
          title={!canAdd && sports.length >= 3 ? 'Maximal 3 Sportarten.' : undefined}
          className="h-11 rounded-xl border-2 border-dashed border-[#E4E4E7] text-sm font-medium text-[#71717A] flex items-center justify-center gap-2 hover:border-[#16A34A] hover:text-[#16A34A] hover:bg-[#F0FDF4] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#E4E4E7] disabled:hover:text-[#71717A] disabled:hover:bg-transparent"
        >
          <Plus className="w-4 h-4" />
          Neue Sportart hinzufügen
          {sports.length >= 3 && <span className="text-xs ml-1 opacity-60">(max. 3)</span>}
        </button>
      )}

      <p className="text-center text-xs text-[#A1A1AA]">
        Die erste Sportart in der Liste ist deine Hauptsportart.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab: Datenschutz
// ─────────────────────────────────────────────────────────────────

function TabDatenschutz({
  user,
  onUpdate,
  addToast,
}: {
  user: UserData
  onUpdate: (updated: Partial<UserData>) => void
  addToast: (type: 'success' | 'error', message: string) => void
}) {
  const [isPublicProfile, setIsPublicProfile] = useState(user.isPublicProfile)
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushChecked, setPushChecked] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Check Push permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPushEnabled(Notification.permission === 'granted')
      setPushChecked(true)
    } else {
      setPushChecked(true)
    }
  }, [])

  const handlePushToggle = async (checked: boolean) => {
    if (typeof Notification === 'undefined') return
    if (checked) {
      const perm = await Notification.requestPermission()
      setPushEnabled(perm === 'granted')
      if (perm !== 'granted') {
        addToast('error', 'Push-Benachrichtigungen wurden nicht erlaubt.')
      } else {
        addToast('success', 'Push-Benachrichtigungen aktiviert.')
      }
    } else {
      // Can't programmatically revoke, just inform
      setPushEnabled(false)
      addToast('error', 'Deaktiviere Push in deinen Browser-Einstellungen.')
    }
  }

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true)
    try {
      const res = await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublicProfile, emailNotifications }),
      })
      if (!res.ok) throw new Error()
      onUpdate({ isPublicProfile, emailNotifications })
      addToast('success', 'Datenschutz-Einstellungen gespeichert.')
    } catch {
      addToast('error', 'Fehler beim Speichern.')
    } finally {
      setSavingPrivacy(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadProgress(0)
    const interval = setInterval(() => {
      setDownloadProgress((p) => Math.min(p + 15, 90))
    }, 200)
    try {
      const res = await fetch('/api/user/download-data', { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as unknown
      clearInterval(interval)
      setDownloadProgress(100)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().split('T')[0]
      a.download = `${user.username ?? user.id}-daten-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      addToast('success', 'Daten erfolgreich heruntergeladen.')
    } catch {
      clearInterval(interval)
      addToast('error', 'Fehler beim Herunterladen.')
    } finally {
      setDownloading(false)
      setDownloadProgress(0)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Privacy Toggles */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-[#0A0A0A] mb-3">Sichtbarkeit</h3>

        {[
          {
            label: 'Profil öffentlich',
            desc: 'Andere Nutzer können dein Profil sehen',
            value: isPublicProfile,
            onChange: setIsPublicProfile,
          },
          {
            label: 'Im Feed sichtbar',
            desc: 'Deine Beiträge erscheinen im Community-Feed',
            value: isPublicProfile,
            onChange: setIsPublicProfile,
          },
          {
            label: 'In Entdecken angezeigt',
            desc: 'Dein Profil erscheint in Suche und Entdecken',
            value: isPublicProfile,
            onChange: setIsPublicProfile,
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-4 border-b border-[#F4F4F5]">
            <div>
              <p className="text-sm font-medium text-[#0A0A0A]">{item.label}</p>
              <p className="text-xs text-[#71717A] mt-0.5">{item.desc}</p>
            </div>
            <Switch.Root
              checked={item.value}
              onCheckedChange={item.onChange}
              className="relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none"
              style={{ background: item.value ? '#16A34A' : '#E4E4E7' }}
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>
        ))}
      </div>

      {/* Benachrichtigungen */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-[#0A0A0A] mb-3">Benachrichtigungen</h3>

        <div className="flex items-center justify-between py-4 border-b border-[#F4F4F5]">
          <div>
            <p className="text-sm font-medium text-[#0A0A0A]">E-Mail-Benachrichtigungen</p>
            <p className="text-xs text-[#71717A] mt-0.5">Updates, Erinnerungen und News per E-Mail</p>
          </div>
          <Switch.Root
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
            className="relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none"
            style={{ background: emailNotifications ? '#16A34A' : '#E4E4E7' }}
          >
            <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </div>

        {pushChecked && (
          <div className="flex items-center justify-between py-4 border-b border-[#F4F4F5]">
            <div>
              <p className="text-sm font-medium text-[#0A0A0A]">Push-Benachrichtigungen</p>
              <p className="text-xs text-[#71717A] mt-0.5">Browser-Benachrichtigungen für Echtzeit-Updates</p>
            </div>
            <Switch.Root
              checked={pushEnabled}
              onCheckedChange={(v) => void handlePushToggle(v)}
              className="relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none"
              style={{ background: pushEnabled ? '#16A34A' : '#E4E4E7' }}
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>
        )}
      </div>

      {/* Speichern */}
      <button
        type="button"
        onClick={() => void handleSavePrivacy()}
        disabled={savingPrivacy}
        className="h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
        style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
      >
        {savingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {savingPrivacy ? 'Wird gespeichert…' : 'Einstellungen speichern'}
      </button>

      {/* DSGVO Download */}
      <div className="rounded-2xl border border-[#E4E4E7] p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0A0A0A]">Meine Daten herunterladen</p>
            <p className="text-xs text-[#71717A] mt-0.5">
              DSGVO Art. 20 – Erhalte eine vollständige Kopie deiner persönlichen Daten als JSON-Datei.
            </p>
          </div>
        </div>

        {downloading && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#71717A]">Wird vorbereitet…</span>
              <span className="text-xs font-medium text-[#3B82F6]">{downloadProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#DBEAFE] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#3B82F6]"
                animate={{ width: `${downloadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="h-10 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] text-sm font-medium text-[#3B82F6] flex items-center justify-center gap-2 hover:bg-[#DBEAFE] transition-colors disabled:opacity-60"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? 'Wird vorbereitet…' : 'Daten herunterladen'}
        </button>
      </div>

      <p className="text-center text-xs text-[#A1A1AA]">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tab: Account
// ─────────────────────────────────────────────────────────────────

function TabAccount({
  user,
  hasGoogle,
  hasPassword,
  addToast,
}: {
  user: UserData
  hasGoogle: boolean
  hasPassword: boolean
  addToast: (type: 'success' | 'error', message: string) => void
}) {
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const deleteInputId = useId()

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'LÖSCHEN') return
    setDeleting(true)
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmToken: 'LÖSCHEN' }),
      })
      if (!res.ok) throw new Error()
      // Redirect to homepage after deletion
      window.location.href = '/'
    } catch {
      addToast('error', 'Fehler beim Löschen. Bitte kontaktiere den Support.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* E-Mail */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#0A0A0A]">E-Mail-Adresse</label>
        <div className="h-10 px-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] flex items-center text-sm text-[#71717A]">
          {user.email}
        </div>
        <p className="text-xs text-[#A1A1AA]">Deine E-Mail-Adresse kann nicht geändert werden.</p>
      </div>

      {/* Passwort */}
      {hasPassword && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0A0A0A]">Passwort</label>
          <button
            type="button"
            className="h-10 px-3 rounded-lg border border-[#E4E4E7] bg-white text-sm font-medium text-[#52525B] text-left hover:bg-[#F4F4F5] transition-colors flex items-center gap-2"
          >
            <span>Passwort ändern</span>
            <span className="ml-auto text-xs text-[#A1A1AA]">(bald verfügbar)</span>
          </button>
        </div>
      )}

      {/* Google Verbindung */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#0A0A0A]">Google-Konto</label>
        <div className="h-12 px-4 rounded-xl border border-[#E4E4E7] bg-white flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.252 17.64 11.944 17.64 9.2z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          {hasGoogle ? (
            <>
              <span className="text-sm text-[#52525B]">Verbunden mit Google</span>
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] ml-auto" />
            </>
          ) : (
            <>
              <span className="text-sm text-[#52525B]">Nicht verbunden</span>
              <button
                type="button"
                className="ml-auto text-xs font-medium px-3 py-1 rounded-lg border border-[#E4E4E7] text-[#52525B] hover:bg-[#F4F4F5] transition-colors"
              >
                Mit Google verknüpfen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Geburtsdatum */}
      {user.birthYear && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#0A0A0A]">Geburtsjahr</label>
          <div className="h-10 px-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] flex items-center text-sm text-[#71717A]">
            {user.birthYear}
          </div>
          <p className="text-xs text-[#A1A1AA]">Das Alter ist dauerhaft gesetzt für DSGVO und Altersschutz.</p>
        </div>
      )}

      {/* Account löschen */}
      <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#DC2626]">Account löschen</p>
            <p className="text-xs text-[#EF4444] mt-0.5">
              Diese Aktion ist unwiderruflich. Alle deine Daten werden permanent gelöscht.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={deleteInputId} className="text-xs font-medium text-[#DC2626]">
            Tippe <span className="font-mono bg-[#FEE2E2] px-1.5 py-0.5 rounded">LÖSCHEN</span> um zu bestätigen:
          </label>
          <input
            id={deleteInputId}
            type="text"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder="LÖSCHEN"
            className="h-10 px-3 rounded-lg border text-sm placeholder:text-[#FCA5A5] focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 transition-colors"
            style={{
              background: '#FFF1F2',
              borderColor: deleteInput === 'LÖSCHEN' ? '#EF4444' : '#FECACA',
              color: '#DC2626',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={deleteInput !== 'LÖSCHEN' || deleting}
          className="h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: deleteInput === 'LÖSCHEN' && !deleting ? '#EF4444' : '#F87171' }}
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {deleting ? 'Wird gelöscht…' : 'Account endgültig löschen'}
        </button>
      </div>

      <p className="text-center text-xs text-[#A1A1AA]">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'profil', label: 'Profil', Icon: User },
  { key: 'sportarten', label: 'Sportarten', Icon: Dumbbell },
  { key: 'datenschutz', label: 'Datenschutz', Icon: Shield },
  { key: 'account', label: 'Account', Icon: Settings },
]

export function EinstellungenClient({ initialData }: { initialData: InitialData }) {
  const [activeTab, setActiveTab] = useState<TabKey>('profil')
  const [user, setUser] = useState<UserData>(initialData.user)
  const [sports, setSports] = useState<UserSportData[]>(initialData.sports)
  const { toasts, addToast, removeToast } = useToasts()

  const handleUserUpdate = useCallback((updated: Partial<UserData>) => {
    setUser((prev) => ({ ...prev, ...updated }))
  }, [])

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0A0A0A 0%, #111827 50%, #0F2417 100%)' }}
    >
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Einstellungen</h1>
            <p className="text-xs text-white/50">{user.username ? `@${user.username}` : user.email}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex gap-1 p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-6">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className="relative flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all"
              style={{
                color: activeTab === key ? '#0A0A0A' : 'rgba(255,255,255,0.6)',
              }}
            >
              {activeTab === key && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl bg-white"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                />
              )}
              <span className="relative z-10">
                <Icon className="w-4 h-4" />
              </span>
              <span className="relative z-10 hidden sm:block">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-white/[0.08] backdrop-blur-md border border-white/20 p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profil' && (
              <motion.div
                key="profil"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* White card for form fields */}
                <div className="rounded-2xl bg-white p-5">
                  <TabProfil user={user} onUpdate={handleUserUpdate} addToast={addToast} />
                </div>
              </motion.div>
            )}

            {activeTab === 'sportarten' && (
              <motion.div
                key="sportarten"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <TabSportarten
                  sports={sports}
                  allSports={initialData.allSports}
                  onSportsChange={setSports}
                  addToast={addToast}
                />
              </motion.div>
            )}

            {activeTab === 'datenschutz' && (
              <motion.div
                key="datenschutz"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="rounded-2xl bg-white p-5">
                  <TabDatenschutz user={user} onUpdate={handleUserUpdate} addToast={addToast} />
                </div>
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="rounded-2xl bg-white p-5">
                  <TabAccount
                    user={user}
                    hasGoogle={initialData.hasGoogle}
                    hasPassword={initialData.hasPassword}
                    addToast={addToast}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
