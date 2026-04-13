'use client'

// ─────────────────────────────────────────────────────────────────
// app/registrieren/RegistrierenClient.tsx
// Registrierung Schritte 1–3 (von 6)
// ─────────────────────────────────────────────────────────────────

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Cake,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  MapPin,
  Minus,
  TrendingUp,
  Rocket,
  Star,
  Navigation,
  Crosshair,
  Wind,
  Shield,
  Target,
  Hash,
  Hand,
  Smile,
  Apple,
  Users,
  Medal,
  Home,
  Package,
  Warehouse,
  Building2,
  Upload,
  X,
} from 'lucide-react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import * as Select from '@radix-ui/react-select'
import * as Slider from '@radix-ui/react-slider'
import * as Switch from '@radix-ui/react-switch'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Label from '@radix-ui/react-label'
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

type EmailStatus = 'idle' | 'checking' | 'available' | 'taken'
type Geschlecht = '' | 'MAENNLICH' | 'WEIBLICH' | 'DIVERS' | 'KEINE_ANGABE'
type ZielSlug = 'SPASS' | 'VERBESSERN' | 'PROFI' | 'GESUNDHEIT' | 'COMMUNITY' | 'TURNIERE'
type EquipmentOption = '' | 'KOERPERGEWICHT' | 'EINIGE_GERAETE' | 'HEIMGYM' | 'FITNESSSTUDIO'
type HeimbedarfItem = 'KURZHANTELN_LEICHT' | 'KURZHANTELN_SCHWER' | 'LANGHANTEL_RACK' | 'KETTLEBELL' | 'WIEDERSTANDSBAENDER' | 'SPRINGSEIL' | 'KLIMMZUGSTANGE' | 'YOGAMATTE' | 'FAHRRAD' | 'PULL_UP_BAR' | 'TRX' | 'SCHAUMSTOFFROLLE'
type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

interface FussballFormState {
  position: FussballPosition
  starkerFuss: StarkerFuss
  ligaNiveau: FussballLigaNiveau
  spielstil: FussballSpielstil
  staerken: FussballStaerke[]
  koerpergroesseCm: number
  gewichtKg: number
  lieblingsspieler: string
  trikotNummer: string
  trainingsEinheitenProWoche: number
  ziel: FussballZiel
}

interface TennisFormState {
  spielhand: Spielhand
  rueckhand: TennisRueckhand
  dtbLkAktiv: boolean
  dtbLk: number
  dtbId: string
  lieblingsoberflaeche: TennisOberflaeche
  spielstil: TennisSpielstil
  disziplinen: TennisDisziplin[]
  turniererfahrung: TennisTurniererfahrung
  sucheSparringpartner: boolean
  maxSparringDistanzKm: number
  lieblingsspieler: string
  trainingsEinheitenProWoche: number
  ziel: TennisZiel
}

interface BasketballFormState {
  position: BasketballPosition
  wurfhand: Wurfhand
  koerpergroesseCm: number
  ligaNiveau: BasketballLigaNiveau
  staerken: BasketballStaerke[]
  spielstil: BasketballSpielstil
  lieblingsspieler: string
  trainingsEinheitenProWoche: number
  ziel: BasketballZiel
}

interface RegistrationState {
  step: number
  // Schritt 1
  vorname: string
  nachname: string
  email: string
  emailStatus: EmailStatus
  passwort: string
  passwortBestaetigen: string
  showPasswort: boolean
  showPasswortBestaetigen: boolean
  // Schritt 2
  geburtsdatum: string
  parentEmail: string
  city: string
  plz: string
  bundesland: string
  geschlecht: Geschlecht
  // Schritt 3
  selectedSports: SportSlug[]
  primarySport: SportSlug | null
  fussball: FussballFormState
  tennis: TennisFormState
  basketball: BasketballFormState
  // Schritt 4 – Ziele
  selectedZiele: ZielSlug[]
  // Schritt 5 – Equipment
  equipment: EquipmentOption
  heimbedarf: HeimbedarfItem[]
  // Schritt 6 – Profil & Abschluss
  username: string
  usernameStatus: 'idle' | 'checking' | 'available' | 'taken'
  agbAccepted: boolean
  datenschutzAccepted: boolean
  elternEinverstanden: boolean
  // Submit
  submitStatus: SubmitStatus
  submitError: string | null
  // UI
  toastMessage: string | null
  sportShake: boolean
  progressGlow: boolean
}

type RegistrationAction =
  | { type: 'PATCH'; payload: Partial<Omit<RegistrationState, 'fussball' | 'tennis' | 'basketball'>> }
  | { type: 'PATCH_FUSSBALL'; payload: Partial<FussballFormState> }
  | { type: 'PATCH_TENNIS'; payload: Partial<TennisFormState> }
  | { type: 'PATCH_BASKETBALL'; payload: Partial<BasketballFormState> }
  | { type: 'TOGGLE_SPORT'; payload: SportSlug }
  | { type: 'SET_PRIMARY_SPORT'; payload: SportSlug }
  | { type: 'TOGGLE_FUSSBALL_STAERKE'; payload: FussballStaerke }
  | { type: 'TOGGLE_TENNIS_DISZIPLIN'; payload: TennisDisziplin }
  | { type: 'TOGGLE_BASKETBALL_STAERKE'; payload: BasketballStaerke }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'TOGGLE_ZIEL'; payload: ZielSlug }
  | { type: 'TOGGLE_HEIMBEDARF'; payload: HeimbedarfItem }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'CLEAR_TOAST' }
  | { type: 'SPORT_SHAKE' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'PROGRESS_GLOW' }
  | { type: 'CLEAR_GLOW' }
  | { type: 'SET_SUBMIT_STATUS'; payload: SubmitStatus }
  | { type: 'SET_SUBMIT_ERROR'; payload: string | null }

// ─────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────

const initialState: RegistrationState = {
  step: 1,
  vorname: '',
  nachname: '',
  email: '',
  emailStatus: 'idle',
  passwort: '',
  passwortBestaetigen: '',
  showPasswort: false,
  showPasswortBestaetigen: false,
  geburtsdatum: '',
  parentEmail: '',
  city: '',
  plz: '',
  bundesland: '',
  geschlecht: '',
  selectedSports: [],
  primarySport: null,
  fussball: {
    position: 'ZENTRALES_MITTELFELD',
    starkerFuss: 'RECHTS',
    ligaNiveau: 'KREISLIGA_A',
    spielstil: 'AUSGEWOGEN',
    staerken: [],
    koerpergroesseCm: 175,
    gewichtKg: 75,
    lieblingsspieler: '',
    trikotNummer: '',
    trainingsEinheitenProWoche: 3,
    ziel: 'NIVEAU_HALTEN',
  },
  tennis: {
    spielhand: 'RECHTS',
    rueckhand: 'ZWEIHAENDIG',
    dtbLkAktiv: false,
    dtbLk: 25,
    dtbId: '',
    lieblingsoberflaeche: 'SANDPLATZ',
    spielstil: 'BASELINER',
    disziplinen: ['EINZEL'],
    turniererfahrung: 'KEINE',
    sucheSparringpartner: false,
    maxSparringDistanzKm: 25,
    lieblingsspieler: '',
    trainingsEinheitenProWoche: 3,
    ziel: 'LK_VERBESSERN',
  },
  basketball: {
    position: 'SMALL_FORWARD',
    wurfhand: 'RECHTS',
    koerpergroesseCm: 185,
    ligaNiveau: 'KREISLIGA',
    staerken: [],
    spielstil: 'ALLROUNDER',
    lieblingsspieler: '',
    trainingsEinheitenProWoche: 3,
    ziel: 'LEISTUNG_VERBESSERN',
  },
  toastMessage: null,
  sportShake: false,
  progressGlow: false,
  // Schritt 4
  selectedZiele: [],
  // Schritt 5
  equipment: '',
  heimbedarf: [],
  // Schritt 6
  username: '',
  usernameStatus: 'idle',
  agbAccepted: false,
  datenschutzAccepted: false,
  elternEinverstanden: false,
  // Submit
  submitStatus: 'idle',
  submitError: null,
}

// ─────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────

function reducer(state: RegistrationState, action: RegistrationAction): RegistrationState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.payload }
    case 'PATCH_FUSSBALL':
      return { ...state, fussball: { ...state.fussball, ...action.payload } }
    case 'PATCH_TENNIS':
      return { ...state, tennis: { ...state.tennis, ...action.payload } }
    case 'PATCH_BASKETBALL':
      return { ...state, basketball: { ...state.basketball, ...action.payload } }
    case 'TOGGLE_SPORT': {
      const slug = action.payload
      if (state.selectedSports.includes(slug)) {
        const next = state.selectedSports.filter((s) => s !== slug)
        return {
          ...state,
          selectedSports: next,
          primarySport: state.primarySport === slug ? (next[0] ?? null) : state.primarySport,
        }
      }
      if (state.selectedSports.length >= 3) return state
      const next = [...state.selectedSports, slug]
      return {
        ...state,
        selectedSports: next,
        primarySport: state.primarySport ?? slug,
      }
    }
    case 'SET_PRIMARY_SPORT':
      return { ...state, primarySport: action.payload }
    case 'TOGGLE_FUSSBALL_STAERKE': {
      const s = action.payload
      const cur = state.fussball.staerken
      if (cur.includes(s)) {
        return { ...state, fussball: { ...state.fussball, staerken: cur.filter((x) => x !== s) } }
      }
      if (cur.length >= 4) return state
      return { ...state, fussball: { ...state.fussball, staerken: [...cur, s] } }
    }
    case 'TOGGLE_TENNIS_DISZIPLIN': {
      const d = action.payload
      const cur = state.tennis.disziplinen
      if (cur.includes(d)) {
        if (cur.length <= 1) return state
        return { ...state, tennis: { ...state.tennis, disziplinen: cur.filter((x) => x !== d) } }
      }
      return { ...state, tennis: { ...state.tennis, disziplinen: [...cur, d] } }
    }
    case 'TOGGLE_BASKETBALL_STAERKE': {
      const s = action.payload
      const cur = state.basketball.staerken
      if (cur.includes(s)) {
        return { ...state, basketball: { ...state.basketball, staerken: cur.filter((x) => x !== s) } }
      }
      if (cur.length >= 4) return state
      return { ...state, basketball: { ...state.basketball, staerken: [...cur, s] } }
    }
    case 'SET_STEP':
      return { ...state, step: action.payload }
    case 'TOGGLE_ZIEL': {
      const z = action.payload
      if (state.selectedZiele.includes(z)) {
        return { ...state, selectedZiele: state.selectedZiele.filter((x) => x !== z) }
      }
      return { ...state, selectedZiele: [...state.selectedZiele, z] }
    }
    case 'TOGGLE_HEIMBEDARF': {
      const h = action.payload
      if (state.heimbedarf.includes(h)) {
        return { ...state, heimbedarf: state.heimbedarf.filter((x) => x !== h) }
      }
      return { ...state, heimbedarf: [...state.heimbedarf, h] }
    }
    case 'SHOW_TOAST':
      return { ...state, toastMessage: action.payload }
    case 'CLEAR_TOAST':
      return { ...state, toastMessage: null }
    case 'SPORT_SHAKE':
      return { ...state, sportShake: true }
    case 'CLEAR_SHAKE':
      return { ...state, sportShake: false }
    case 'PROGRESS_GLOW':
      return { ...state, progressGlow: true }
    case 'CLEAR_GLOW':
      return { ...state, progressGlow: false }
    case 'SET_SUBMIT_STATUS':
      return { ...state, submitStatus: action.payload }
    case 'SET_SUBMIT_ERROR':
      return { ...state, submitError: action.payload }
    default:
      return state
  }
}

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const BUNDESLAENDER = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
] as const

const GESCHLECHT_OPTIONS: { value: Exclude<Geschlecht, ''>; label: string }[] = [
  { value: 'MAENNLICH', label: 'Männlich' },
  { value: 'WEIBLICH', label: 'Weiblich' },
  { value: 'DIVERS', label: 'Divers' },
  { value: 'KEINE_ANGABE', label: 'Keine Angabe' },
]

// ─────────────────────────────────────────────────────────────────
// Password helpers
// ─────────────────────────────────────────────────────────────────

interface PasswordCheck {
  label: string
  met: boolean
}

function getPasswordChecks(pw: string): PasswordCheck[] {
  return [
    { label: 'Mindestens 8 Zeichen', met: pw.length >= 8 },
    { label: 'Enthält eine Zahl', met: /\d/.test(pw) },
    { label: 'Enthält Großbuchstaben', met: /[A-Z]/.test(pw) },
    { label: 'Enthält Sonderzeichen', met: /[^A-Za-z0-9]/.test(pw) },
  ]
}

function getPasswordStrength(pw: string): number {
  return getPasswordChecks(pw).filter((c) => c.met).length
}

// ─────────────────────────────────────────────────────────────────
// Shared UI: StyledSelect
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
  const ringColor = `${accentColor}4D`
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className="flex h-10 w-full items-center justify-between rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none data-[placeholder]:text-[#A1A1AA] transition-colors"
        style={{ ['--tw-ring-color' as string]: ringColor }}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 4l4 4 4-4" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
                style={{ color: undefined }}
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

// ─────────────────────────────────────────────────────────────────
// Shared UI: StyledSlider
// ─────────────────────────────────────────────────────────────────

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
// Sport SVGs (inline JSX)
// ─────────────────────────────────────────────────────────────────

function FussballSVG({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="2" />
      <polygon points="28,10 34,20 28,25 22,20" fill="currentColor" opacity="0.9" />
      <polygon points="43,21 38,30 31,28 31,20" fill="currentColor" opacity="0.9" />
      <polygon points="40,39 31,39 28,32 34,26" fill="currentColor" opacity="0.9" />
      <polygon points="16,39 25,39 28,32 22,26" fill="currentColor" opacity="0.9" />
      <polygon points="13,21 18,30 25,28 25,20" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function TennisSVG({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="2" />
      <path d="M8 28 Q18 12 28 28 Q38 44 48 28" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 28 Q18 44 28 28 Q38 12 48 28" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  )
}

function BasketballSVG({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="2" />
      <line x1="8" y1="28" x2="48" y2="28" stroke="currentColor" strokeWidth="2" />
      <line x1="28" y1="8" x2="28" y2="48" stroke="currentColor" strokeWidth="2" />
      <path d="M15 12 Q28 28 15 44" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M41 12 Q28 28 41 44" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────
// Fußball Panel
// ─────────────────────────────────────────────────────────────────

interface FussballPanelProps {
  state: FussballFormState
  dispatch: React.Dispatch<RegistrationAction>
}

const FUSSBALL_SPIELSTIL_DESC: Record<FussballSpielstil, string> = {
  DEFENSIV: 'Sicherheit & Ordnung zuerst',
  AUSGEWOGEN: 'Balance zwischen Angriff und Abwehr',
  OFFENSIV: 'Angriff ist die beste Verteidigung',
  PRESSING: 'Hoher Druck und intensives Anlaufen',
  KONTERFUSSBALL: 'Schnell umschalten und gezielt kontern',
}

const FUSSBALL_ZIEL_DESC: Record<FussballZiel, string> = {
  NIVEAU_HALTEN: 'Fit bleiben und Spaß haben',
  AUFSTEIGEN: 'In die nächste Liga aufsteigen',
  STARK_AUFSTEIGEN: 'Mehrere Ligen überspringen',
  PROFI_WERDEN: 'Den Profifußball anstreben',
}

function FussballPanel({ state, dispatch }: FussballPanelProps) {
  const patch = useCallback(
    (payload: Partial<FussballFormState>) => dispatch({ type: 'PATCH_FUSSBALL', payload }),
    [dispatch],
  )

  const positionOptions = FUSSBALL_POSITIONEN.map((p) => ({ value: p, label: FUSSBALL_POSITION_LABELS[p] }))
  const ligaOptions = [...FUSSBALL_LIGA_NIVEAUS]
    .reverse()
    .map((l) => ({ value: l, label: FUSSBALL_LIGA_LABELS[l] }))

  return (
    <div className="mt-4 space-y-6 border-t border-[#E4E4E7] pt-5">
      {/* Position */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Position</Label.Root>
        <StyledSelect
          value={state.position}
          onValueChange={(v) => patch({ position: v as FussballPosition })}
          options={positionOptions}
        />
      </div>

      {/* Liga-Niveau */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Aktuelles Liga-Niveau</Label.Root>
        <StyledSelect
          value={state.ligaNiveau}
          onValueChange={(v) => patch({ ligaNiveau: v as FussballLigaNiveau })}
          options={ligaOptions}
        />
      </div>

      {/* Starker Fuß */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Starker Fuß</Label.Root>
        <div className="flex gap-2">
          {(['RECHTS', 'LINKS', 'BEIDFUESSIG'] as StarkerFuss[]).map((fuss) => (
            <button
              key={fuss}
              type="button"
              onClick={() => patch({ starkerFuss: fuss })}
              className="flex-1 h-10 rounded-lg border text-sm font-medium transition-all"
              style={
                state.starkerFuss === fuss
                  ? { background: '#0A0A0A', color: 'white', border: '1px solid #0A0A0A', boxShadow: '0 0 0 2px #16A34A' }
                  : { background: 'white', color: '#52525B', border: '1px solid #E4E4E7' }
              }
            >
              {STARKERFUSS_LABELS[fuss]}
            </button>
          ))}
        </div>
      </div>

      {/* Spielstil */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielstil</Label.Root>
        <div className="flex flex-col gap-2">
          {FUSSBALL_SPIELSTILE.map((stil) => (
            <button
              key={stil}
              type="button"
              onClick={() => patch({ spielstil: stil })}
              className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all ${
                state.spielstil === stil
                  ? 'border-[#16A34A] bg-[#F0FDF4]'
                  : 'border-[#E4E4E7] hover:border-[#A1A1AA]'
              }`}
            >
              <span className={`text-sm font-medium ${state.spielstil === stil ? 'text-[#16A34A]' : 'text-[#0A0A0A]'}`}>
                {FUSSBALL_SPIELSTIL_LABELS[stil]}
              </span>
              <span className="text-xs text-[#71717A] mt-0.5">{FUSSBALL_SPIELSTIL_DESC[stil]}</span>
            </button>
          ))}
        </div>
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
                onClick={() => dispatch({ type: 'TOGGLE_FUSSBALL_STAERKE', payload: s })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-[#16A34A] text-white border-[#16A34A]'
                    : isDisabled
                    ? 'bg-[#F4F4F5] text-[#A1A1AA] border-[#E4E4E7] cursor-not-allowed'
                    : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#16A34A] hover:text-[#16A34A]'
                }`}
              >
                {FUSSBALL_STAERKE_LABELS[s]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Körpergröße */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Körpergröße</Label.Root>
          <span className="text-sm font-semibold text-[#16A34A]">{state.koerpergroesseCm} cm</span>
        </div>
        <StyledSlider value={state.koerpergroesseCm} onChange={(v) => patch({ koerpergroesseCm: v })} min={140} max={215} />
        <div className="flex justify-between text-xs text-[#71717A]">
          <span>140 cm</span><span>215 cm</span>
        </div>
      </div>

      {/* Trainingseinheiten */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Trainingseinheiten / Woche</Label.Root>
          <span className="text-sm font-semibold text-[#16A34A]">{state.trainingsEinheitenProWoche}×</span>
        </div>
        <StyledSlider value={state.trainingsEinheitenProWoche} onChange={(v) => patch({ trainingsEinheitenProWoche: v })} min={1} max={7} />
        <div className="flex justify-between text-xs text-[#71717A]">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <span key={n} className={state.trainingsEinheitenProWoche === n ? 'text-[#16A34A] font-medium' : ''}>{n}</span>
          ))}
        </div>
      </div>

      {/* Lieblingsspieler + Trikotnummer */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#52525B]">Lieblingsspieler <span className="text-[#A1A1AA]">(optional)</span></label>
          <input
            type="text"
            value={state.lieblingsspieler}
            onChange={(e) => patch({ lieblingsspieler: e.target.value })}
            placeholder="z.B. Müller"
            maxLength={100}
            className="h-10 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#52525B]">Trikotnummer <span className="text-[#A1A1AA]">(optional)</span></label>
          <input
            type="number"
            value={state.trikotNummer}
            onChange={(e) => patch({ trikotNummer: e.target.value })}
            placeholder="1 – 99"
            min={1}
            max={99}
            className="h-10 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
          />
        </div>
      </div>

      {/* Ziel */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Dein Ziel</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {FUSSBALL_ZIELE.map((ziel) => {
            const Icon = ziel === 'NIVEAU_HALTEN' ? Minus : ziel === 'AUFSTEIGEN' ? TrendingUp : ziel === 'STARK_AUFSTEIGEN' ? Rocket : Star
            return (
              <button
                key={ziel}
                type="button"
                onClick={() => patch({ ziel })}
                className={`flex flex-col items-start gap-1 px-4 py-3 rounded-lg border text-left transition-all ${
                  state.ziel === ziel ? 'border-[#16A34A] bg-[#F0FDF4]' : 'border-[#E4E4E7] hover:border-[#A1A1AA]'
                }`}
              >
                <Icon className={`w-4 h-4 ${state.ziel === ziel ? 'text-[#16A34A]' : 'text-[#71717A]'}`} />
                <span className={`text-sm font-medium leading-tight ${state.ziel === ziel ? 'text-[#16A34A]' : 'text-[#0A0A0A]'}`}>
                  {FUSSBALL_ZIEL_LABELS[ziel]}
                </span>
                <span className="text-xs text-[#71717A] leading-tight">{FUSSBALL_ZIEL_DESC[ziel]}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tennis Panel
// ─────────────────────────────────────────────────────────────────

interface TennisPanelProps {
  state: TennisFormState
  dispatch: React.Dispatch<RegistrationAction>
}

const LK_BEREICH_LABEL = (lk: number): string => {
  if (lk <= 6) return 'Spitzen-Amateurspieler'
  if (lk <= 12) return 'Fortgeschrittener Leistungsspieler'
  if (lk <= 18) return 'Ambitionierter Vereinsspieler'
  return 'Einsteiger / Freizeitspieler'
}

function TennisPanel({ state, dispatch }: TennisPanelProps) {
  const patch = useCallback(
    (payload: Partial<TennisFormState>) => dispatch({ type: 'PATCH_TENNIS', payload }),
    [dispatch],
  )

  const ACCENT = '#C2621A'

  const turniererfahrungOptions = TENNIS_TURNIERERFAHRUNGEN.map((t) => ({
    value: t,
    label: TENNIS_TURNIERERFAHRUNG_LABELS[t],
  }))

  return (
    <div className="mt-4 space-y-6 border-t border-[#E4E4E7] pt-5">
      {/* Spielhand */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielhand</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(['RECHTS', 'LINKS'] as Spielhand[]).map((hand) => (
            <button
              key={hand}
              type="button"
              onClick={() => patch({ spielhand: hand })}
              className={`flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-medium transition-all ${
                state.spielhand === hand
                  ? 'border-[#C2621A] bg-[#FFF7ED] text-[#C2621A]'
                  : 'border-[#E4E4E7] text-[#52525B] hover:border-[#A1A1AA]'
              }`}
            >
              <Hand className="w-4 h-4" />
              {SPIELHAND_LABELS[hand]}
            </button>
          ))}
        </div>
      </div>

      {/* Rückhand */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Rückhand</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(['EINHAENDIG', 'ZWEIHAENDIG'] as TennisRueckhand[]).map((rh) => (
            <button
              key={rh}
              type="button"
              onClick={() => patch({ rueckhand: rh })}
              className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                state.rueckhand === rh
                  ? 'border-[#C2621A] bg-[#FFF7ED] text-[#C2621A]'
                  : 'border-[#E4E4E7] text-[#52525B] hover:border-[#A1A1AA]'
              }`}
            >
              {TENNIS_RUECKHAND_LABELS[rh]}
            </button>
          ))}
        </div>
      </div>

      {/* DTB LK */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">DTB Leistungsklasse (LK)</Label.Root>
          <Switch.Root
            checked={state.dtbLkAktiv}
            onCheckedChange={(v) => patch({ dtbLkAktiv: v })}
            className="relative h-5 w-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2 data-[state=checked]:bg-[#C2621A] data-[state=unchecked]:bg-[#E4E4E7]"
          >
            <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
          </Switch.Root>
        </div>

        <AnimatePresence>
          {state.dtbLkAktiv && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-[#FFFBEB] border-l-4 border-[#C2621A]">
                  <p className="text-xs text-[#92400E] leading-relaxed">
                    Die LK 1 ist am besten, LK 25 am schlechtesten. Amateurspieler liegen meist zwischen LK 9 und 23.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#52525B]">Deine LK</span>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold" style={{ color: ACCENT }}>LK {state.dtbLk}</span>
                      <span className="text-xs text-[#71717A]">{LK_BEREICH_LABEL(state.dtbLk)}</span>
                    </div>
                  </div>
                  <StyledSlider
                    value={state.dtbLk}
                    onChange={(v) => patch({ dtbLk: v })}
                    min={1}
                    max={25}
                    accentColor={ACCENT}
                  />
                  <div className="flex justify-between text-xs text-[#71717A]">
                    <span>LK 1 (Beste)</span><span>LK 25 (Einsteiger)</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-[#52525B] flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    DTB-ID <span className="text-[#A1A1AA]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={state.dtbId}
                    onChange={(e) => patch({ dtbId: e.target.value })}
                    placeholder="z.B. DE-12345678"
                    maxLength={20}
                    className="h-10 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:border-[#C2621A] transition-colors"
                    style={{ ['--tw-ring-color' as string]: `${ACCENT}4D` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lieblingsuntergrund */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Lieblingsuntergrund</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {TENNIS_OBERFLAECHEN.map((o) => {
            const bgMap: Record<TennisOberflaeche, string> = {
              SANDPLATZ: '#FEF3C7',
              HARTPLATZ: '#DBEAFE',
              RASEN: '#DCFCE7',
              TEPPICH: '#F3E8FF',
            }
            const borderMap: Record<TennisOberflaeche, string> = {
              SANDPLATZ: '#F59E0B',
              HARTPLATZ: '#3B82F6',
              RASEN: '#16A34A',
              TEPPICH: '#9333EA',
            }
            return (
              <button
                key={o}
                type="button"
                onClick={() => patch({ lieblingsoberflaeche: o })}
                className="h-11 rounded-lg border text-sm font-medium transition-all"
                style={{
                  background: state.lieblingsoberflaeche === o ? bgMap[o] : 'white',
                  borderColor: state.lieblingsoberflaeche === o ? borderMap[o] : '#E4E4E7',
                  borderWidth: state.lieblingsoberflaeche === o ? '2px' : '1px',
                  color: state.lieblingsoberflaeche === o ? borderMap[o] : '#52525B',
                }}
              >
                {TENNIS_OBERFLAECHE_LABELS[o]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Spielstil */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielstil</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {TENNIS_SPIELSTILE.map((stil) => (
            <button
              key={stil}
              type="button"
              onClick={() => patch({ spielstil: stil })}
              className="h-11 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: state.spielstil === stil ? '#FFF7ED' : 'white',
                borderColor: state.spielstil === stil ? ACCENT : '#E4E4E7',
                borderWidth: state.spielstil === stil ? '2px' : '1px',
                color: state.spielstil === stil ? ACCENT : '#52525B',
              }}
            >
              {TENNIS_SPIELSTIL_LABELS[stil]}
            </button>
          ))}
        </div>
      </div>

      {/* Disziplinen */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Disziplinen</Label.Root>
        <div className="flex gap-2">
          {TENNIS_DISZIPLINEN.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_TENNIS_DISZIPLIN', payload: d })}
              className="flex-1 h-10 rounded-full border text-sm font-medium transition-all"
              style={{
                background: state.disziplinen.includes(d) ? ACCENT : 'white',
                borderColor: state.disziplinen.includes(d) ? ACCENT : '#E4E4E7',
                color: state.disziplinen.includes(d) ? 'white' : '#52525B',
              }}
            >
              {TENNIS_DISZIPLIN_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Turniererfahrung */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Turniererfahrung</Label.Root>
        <StyledSelect
          value={state.turniererfahrung}
          onValueChange={(v) => patch({ turniererfahrung: v as TennisTurniererfahrung })}
          options={turniererfahrungOptions}
          accentColor={ACCENT}
        />
      </div>

      {/* Sparringspartner */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Sparringspartner gesucht</Label.Root>
          <Switch.Root
            checked={state.sucheSparringpartner}
            onCheckedChange={(v) => patch({ sucheSparringpartner: v })}
            className="relative h-5 w-9 rounded-full transition-colors focus:outline-none focus-visible:ring-2 data-[state=checked]:bg-[#C2621A] data-[state=unchecked]:bg-[#E4E4E7]"
          >
            <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
          </Switch.Root>
        </div>

        <AnimatePresence>
          {state.sucheSparringpartner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#52525B]">Maximale Entfernung</span>
                  <span className="text-sm font-semibold" style={{ color: ACCENT }}>{state.maxSparringDistanzKm} km</span>
                </div>
                <StyledSlider
                  value={state.maxSparringDistanzKm}
                  onChange={(v) => patch({ maxSparringDistanzKm: v })}
                  min={5}
                  max={100}
                  step={5}
                  accentColor={ACCENT}
                />
                <div className="flex justify-between text-xs text-[#71717A]">
                  <span>5 km</span><span>100 km</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trainingseinheiten */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Trainingseinheiten / Woche</Label.Root>
          <span className="text-sm font-semibold" style={{ color: ACCENT }}>{state.trainingsEinheitenProWoche}×</span>
        </div>
        <StyledSlider value={state.trainingsEinheitenProWoche} onChange={(v) => patch({ trainingsEinheitenProWoche: v })} min={1} max={7} accentColor={ACCENT} />
        <div className="flex justify-between text-xs text-[#71717A]">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <span key={n} className={state.trainingsEinheitenProWoche === n ? 'font-medium' : ''} style={state.trainingsEinheitenProWoche === n ? { color: ACCENT } : {}}>{n}</span>
          ))}
        </div>
      </div>

      {/* Ziel */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Dein Ziel</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {TENNIS_ZIELE.map((ziel) => (
            <button
              key={ziel}
              type="button"
              onClick={() => patch({ ziel })}
              className="h-11 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: state.ziel === ziel ? '#FFF7ED' : 'white',
                borderColor: state.ziel === ziel ? ACCENT : '#E4E4E7',
                borderWidth: state.ziel === ziel ? '2px' : '1px',
                color: state.ziel === ziel ? ACCENT : '#52525B',
              }}
            >
              {TENNIS_ZIEL_LABELS[ziel]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Basketball Panel
// ─────────────────────────────────────────────────────────────────

interface BasketballPanelProps {
  state: BasketballFormState
  dispatch: React.Dispatch<RegistrationAction>
}

const BASKETBALL_POSITION_ICONS: Record<BasketballPosition, React.ComponentType<{ className?: string }>> = {
  POINT_GUARD: Navigation,
  SHOOTING_GUARD: Crosshair,
  SMALL_FORWARD: Wind,
  POWER_FORWARD: Shield,
  CENTER: Target,
}

const BASKETBALL_POSITION_NUMS: Record<BasketballPosition, number> = {
  POINT_GUARD: 1,
  SHOOTING_GUARD: 2,
  SMALL_FORWARD: 3,
  POWER_FORWARD: 4,
  CENTER: 5,
}

function BasketballPanel({ state, dispatch }: BasketballPanelProps) {
  const patch = useCallback(
    (payload: Partial<BasketballFormState>) => dispatch({ type: 'PATCH_BASKETBALL', payload }),
    [dispatch],
  )

  const ACCENT = '#EA580C'

  const ligaOptions = BASKETBALL_LIGA_NIVEAUS.map((l) => ({ value: l, label: BASKETBALL_LIGA_LABELS[l] }))

  const ZIEL_DESC: Record<BasketballZiel, string> = {
    FREIZEIT: 'Spaß am Spiel & fit bleiben',
    LEISTUNG_VERBESSERN: 'Skills und Spielverständnis steigern',
    HOEHERE_LIGA: 'In eine höhere Liga aufsteigen',
  }

  return (
    <div className="mt-4 space-y-6 border-t border-[#E4E4E7] pt-5">
      {/* Info-Box */}
      <div className="p-3 rounded-lg bg-[#FFF7ED] border-l-4 border-[#EA580C]">
        <p className="text-xs text-[#9A3412] leading-relaxed">
          Körpergröße ist wichtig — ein Center sucht andere Vereine als ein Point Guard.
        </p>
      </div>

      {/* Position – 2+3 Grid */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Position</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(['POINT_GUARD', 'SHOOTING_GUARD'] as BasketballPosition[]).map((pos) => {
            const Icon = BASKETBALL_POSITION_ICONS[pos]
            return (
              <button
                key={pos}
                type="button"
                onClick={() => patch({ position: pos, wurfhand: state.wurfhand })}
                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border text-sm font-medium transition-all"
                style={{
                  background: state.position === pos ? 'linear-gradient(135deg, #FFF7ED, #FFEDD5)' : 'white',
                  borderWidth: state.position === pos ? '2px' : '1px',
                  borderColor: state.position === pos ? ACCENT : '#E4E4E7',
                  color: state.position === pos ? ACCENT : '#52525B',
                }}
              >
                <Icon className="w-5 h-5" />
                <span>{BASKETBALL_POSITION_LABELS[pos]}</span>
                <span className="text-xs opacity-60">#{BASKETBALL_POSITION_NUMS[pos]}</span>
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['SMALL_FORWARD', 'POWER_FORWARD', 'CENTER'] as BasketballPosition[]).map((pos) => {
            const Icon = BASKETBALL_POSITION_ICONS[pos]
            return (
              <button
                key={pos}
                type="button"
                onClick={() => patch({ position: pos, wurfhand: state.wurfhand })}
                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border text-sm font-medium transition-all"
                style={{
                  background: state.position === pos ? 'linear-gradient(135deg, #FFF7ED, #FFEDD5)' : 'white',
                  borderWidth: state.position === pos ? '2px' : '1px',
                  borderColor: state.position === pos ? ACCENT : '#E4E4E7',
                  color: state.position === pos ? ACCENT : '#52525B',
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{BASKETBALL_POSITION_LABELS[pos]}</span>
                <span className="text-xs opacity-60">#{BASKETBALL_POSITION_NUMS[pos]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Wurfhand */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Wurfhand</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(['RECHTS', 'LINKS'] as Wurfhand[]).map((hand) => (
            <button
              key={hand}
              type="button"
              onClick={() => patch({ wurfhand: hand })}
              className="h-11 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: state.wurfhand === hand ? '#FFF7ED' : 'white',
                borderColor: state.wurfhand === hand ? ACCENT : '#E4E4E7',
                borderWidth: state.wurfhand === hand ? '2px' : '1px',
                color: state.wurfhand === hand ? ACCENT : '#52525B',
              }}
            >
              {WURFHAND_LABELS[hand]}
            </button>
          ))}
        </div>
      </div>

      {/* Körpergröße */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Körpergröße</Label.Root>
          <span className="text-sm font-semibold" style={{ color: ACCENT }}>{state.koerpergroesseCm} cm</span>
        </div>
        <StyledSlider value={state.koerpergroesseCm} onChange={(v) => patch({ koerpergroesseCm: v })} min={150} max={230} accentColor={ACCENT} />
        <div className="flex justify-between text-xs text-[#71717A]">
          <span>150 cm</span><span>230 cm</span>
        </div>
      </div>

      {/* Liga */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Liga-Niveau</Label.Root>
        <StyledSelect
          value={state.ligaNiveau}
          onValueChange={(v) => patch({ ligaNiveau: v as BasketballLigaNiveau })}
          options={ligaOptions}
          accentColor={ACCENT}
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
                onClick={() => dispatch({ type: 'TOGGLE_BASKETBALL_STAERKE', payload: s })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isDisabled ? 'bg-[#F4F4F5] text-[#A1A1AA] border-[#E4E4E7] cursor-not-allowed' : ''
                }`}
                style={
                  isSelected
                    ? { background: ACCENT, color: 'white', borderColor: ACCENT }
                    : isDisabled
                    ? {}
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
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielstil</Label.Root>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BASKETBALL_SPIELSTILE.map((stil) => (
            <button
              key={stil}
              type="button"
              onClick={() => patch({ spielstil: stil })}
              className="h-11 rounded-lg border text-sm font-medium transition-all"
              style={{
                background: state.spielstil === stil ? '#FFF7ED' : 'white',
                borderColor: state.spielstil === stil ? ACCENT : '#E4E4E7',
                borderWidth: state.spielstil === stil ? '2px' : '1px',
                color: state.spielstil === stil ? ACCENT : '#52525B',
              }}
            >
              {BASKETBALL_SPIELSTIL_LABELS[stil]}
            </button>
          ))}
        </div>
      </div>

      {/* Trainingseinheiten */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Trainingseinheiten / Woche</Label.Root>
          <span className="text-sm font-semibold" style={{ color: ACCENT }}>{state.trainingsEinheitenProWoche}×</span>
        </div>
        <StyledSlider value={state.trainingsEinheitenProWoche} onChange={(v) => patch({ trainingsEinheitenProWoche: v })} min={1} max={7} accentColor={ACCENT} />
        <div className="flex justify-between text-xs text-[#71717A]">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <span key={n} className={state.trainingsEinheitenProWoche === n ? 'font-medium' : ''} style={state.trainingsEinheitenProWoche === n ? { color: ACCENT } : {}}>{n}</span>
          ))}
        </div>
      </div>

      {/* Lieblingsspieler */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-[#52525B]">Lieblingsspieler <span className="text-[#A1A1AA]">(optional)</span></label>
        <input
          type="text"
          value={state.lieblingsspieler}
          onChange={(e) => patch({ lieblingsspieler: e.target.value })}
          placeholder="z.B. Nowitzki"
          maxLength={100}
          className="h-10 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-colors"
          style={{ ['--tw-ring-color' as string]: `${ACCENT}4D` }}
        />
      </div>

      {/* Ziel */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Dein Ziel</Label.Root>
        <div className="flex flex-col gap-2">
          {BASKETBALL_ZIELE.map((ziel) => (
            <button
              key={ziel}
              type="button"
              onClick={() => patch({ ziel })}
              className="flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all"
              style={{
                background: state.ziel === ziel ? '#FFF7ED' : 'white',
                borderColor: state.ziel === ziel ? ACCENT : '#E4E4E7',
                borderWidth: state.ziel === ziel ? '2px' : '1px',
              }}
            >
              <span className="text-sm font-medium" style={{ color: state.ziel === ziel ? ACCENT : '#0A0A0A' }}>
                {BASKETBALL_ZIEL_LABELS[ziel]}
              </span>
              <span className="text-xs text-[#71717A] mt-0.5">{ZIEL_DESC[ziel]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 1 – "Lass uns beginnen"
// ─────────────────────────────────────────────────────────────────

interface Step1Props {
  state: RegistrationState
  dispatch: React.Dispatch<RegistrationAction>
  onEmailChange: (value: string) => void
  onGoogleSignIn: () => Promise<void>
}

function Step1({ state, dispatch, onEmailChange, onGoogleSignIn }: Step1Props) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    tooltipTimerRef.current = setTimeout(() => setShowTooltip(true), 600)
  }
  const handleMouseLeave = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    setShowTooltip(false)
  }

  const pwChecks = getPasswordChecks(state.passwort)
  const pwStrength = getPasswordStrength(state.passwort)
  const pwMatch = state.passwort !== '' && state.passwort === state.passwortBestaetigen

  const segmentColor = (i: number): string => {
    if (i >= pwStrength) return '#E4E4E7'
    if (pwStrength === 1) return '#EF4444'
    if (pwStrength === 2) return '#F97316'
    if (pwStrength === 3) return '#EAB308'
    return '#16A34A'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A0A0A] mb-1">Lass uns beginnen</h1>
      <p className="text-sm text-[#71717A] mb-7">
        Bereits registriert?{' '}
        <Link href="/login" className="text-[#16A34A] font-medium hover:text-[#15803D] transition-colors">
          Anmelden
        </Link>
      </p>

      {/* Google Button */}
      <div className="relative mb-5">
        <button
          type="button"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={onGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#FAFAFA] transition-colors text-[#0A0A0A] text-sm font-medium"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.252 17.64 11.944 17.64 9.2z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          Mit Google registrieren
        </button>

        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 px-3 py-2 rounded-lg bg-[#0A0A0A] text-white text-xs whitespace-nowrap shadow-lg"
            >
              Überspringt Schritt 1 und 2 automatisch.
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0A0A0A] rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#E4E4E7]" />
        <span className="text-[#71717A] text-xs">— oder mit E-Mail —</span>
        <div className="flex-1 h-px bg-[#E4E4E7]" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Vorname + Nachname */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label.Root htmlFor="vorname" className="text-sm font-medium text-[#0A0A0A]">Vorname</Label.Root>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
              <input
                id="vorname"
                type="text"
                value={state.vorname}
                onChange={(e) => dispatch({ type: 'PATCH', payload: { vorname: e.target.value } })}
                placeholder="Max"
                autoComplete="given-name"
                maxLength={50}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E4E4E7] bg-white text-[#0A0A0A] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
              />
            </div>
            {state.vorname.length > 0 && state.vorname.trim().length < 2 && (
              <p className="text-xs text-[#EF4444]">Mindestens 2 Zeichen</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label.Root htmlFor="nachname" className="text-sm font-medium text-[#0A0A0A]">Nachname</Label.Root>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
              <input
                id="nachname"
                type="text"
                value={state.nachname}
                onChange={(e) => dispatch({ type: 'PATCH', payload: { nachname: e.target.value } })}
                placeholder="Mustermann"
                autoComplete="family-name"
                maxLength={50}
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E4E4E7] bg-white text-[#0A0A0A] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
              />
            </div>
            {state.nachname.length > 0 && state.nachname.trim().length < 2 && (
              <p className="text-xs text-[#EF4444]">Mindestens 2 Zeichen</p>
            )}
          </div>
        </div>

        {/* E-Mail */}
        <div className="flex flex-col gap-1.5">
          <Label.Root htmlFor="reg-email" className="text-sm font-medium text-[#0A0A0A]">E-Mail</Label.Root>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
            <input
              id="reg-email"
              type="email"
              value={state.email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="name@email.de"
              autoComplete="email"
              className="w-full h-11 pl-10 pr-10 rounded-lg border border-[#E4E4E7] bg-white text-[#0A0A0A] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {state.emailStatus === 'checking' && <Loader2 className="w-4 h-4 text-[#71717A] animate-spin" />}
              {state.emailStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
              {state.emailStatus === 'taken' && <XCircle className="w-4 h-4 text-[#EF4444]" />}
            </div>
          </div>
          {state.emailStatus === 'available' && (
            <p className="text-xs text-[#16A34A]">E-Mail ist verfügbar</p>
          )}
          {state.emailStatus === 'taken' && (
            <p className="text-xs text-[#EF4444]">
              Diese E-Mail ist bereits registriert.{' '}
              <Link href="/login" className="underline underline-offset-2">Anmelden</Link>
            </p>
          )}
        </div>

        {/* Passwort */}
        <div className="flex flex-col gap-1.5">
          <Label.Root htmlFor="reg-passwort" className="text-sm font-medium text-[#0A0A0A]">Passwort</Label.Root>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
            <input
              id="reg-passwort"
              type={state.showPasswort ? 'text' : 'password'}
              value={state.passwort}
              onChange={(e) => dispatch({ type: 'PATCH', payload: { passwort: e.target.value } })}
              placeholder="Sicheres Passwort"
              autoComplete="new-password"
              className="w-full h-11 pl-10 pr-11 rounded-lg border border-[#E4E4E7] bg-white text-[#0A0A0A] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
            />
            <button
              type="button"
              onClick={() => dispatch({ type: 'PATCH', payload: { showPasswort: !state.showPasswort } })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#52525B] transition-colors"
              aria-label={state.showPasswort ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {state.showPasswort ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {state.passwort.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1 h-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: i < pwStrength
                        ? (pwStrength === 1 ? '#EF4444' : pwStrength === 2 ? '#F97316' : pwStrength === 3 ? '#EAB308' : 'linear-gradient(90deg, #16A34A, #4ADE80)')
                        : '#E4E4E7',
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {pwChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5">
                    {check.met
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border border-[#D4D4D8] flex-shrink-0" />
                    }
                    <span className={`text-xs ${check.met ? 'text-[#16A34A]' : 'text-[#71717A]'}`}>{check.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Passwort bestätigen */}
        <div className="flex flex-col gap-1.5">
          <Label.Root htmlFor="reg-passwort2" className="text-sm font-medium text-[#0A0A0A]">Passwort bestätigen</Label.Root>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
            <input
              id="reg-passwort2"
              type={state.showPasswortBestaetigen ? 'text' : 'password'}
              value={state.passwortBestaetigen}
              onChange={(e) => dispatch({ type: 'PATCH', payload: { passwortBestaetigen: e.target.value } })}
              placeholder="Passwort wiederholen"
              autoComplete="new-password"
              className={`w-full h-11 pl-10 pr-11 rounded-lg border bg-white text-[#0A0A0A] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-colors ${
                state.passwortBestaetigen.length > 0 && !pwMatch
                  ? 'border-[#EF4444] focus:ring-[#EF4444]/30 focus:border-[#EF4444]'
                  : 'border-[#E4E4E7] focus:ring-[#16A34A]/30 focus:border-[#16A34A]'
              }`}
            />
            <button
              type="button"
              onClick={() => dispatch({ type: 'PATCH', payload: { showPasswortBestaetigen: !state.showPasswortBestaetigen } })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#52525B] transition-colors"
              aria-label={state.showPasswortBestaetigen ? 'Passwort verbergen' : 'Passwort anzeigen'}
            >
              {state.showPasswortBestaetigen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {state.passwortBestaetigen.length > 0 && (
            <p className={`text-xs ${pwMatch ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
              {pwMatch ? 'Passwörter stimmen überein' : 'Passwörter stimmen nicht überein'}
            </p>
          )}
        </div>
      </div>

      {/* Suppress unused var */}
      <span className="sr-only">{segmentColor(0)}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 2 – "Wer bist du?"
// ─────────────────────────────────────────────────────────────────

interface Step2Props {
  state: RegistrationState
  dispatch: React.Dispatch<RegistrationAction>
  age: number | null
}

function Step2({ state, dispatch, age }: Step2Props) {
  const today = new Date().toISOString().split('T')[0] ?? ''

  const bundeslandOptions = BUNDESLAENDER.map((b) => ({ value: b, label: b }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A0A0A] mb-1">Wer bist du?</h1>
      <p className="text-sm text-[#71717A] mb-7">Deine Infos bleiben privat und helfen uns, passende Inhalte zu zeigen.</p>

      <div className="flex flex-col gap-5">
        {/* Geburtsdatum */}
        <div className="flex flex-col gap-1.5">
          <Label.Root htmlFor="geburtsdatum" className="text-sm font-medium text-[#0A0A0A] flex items-center gap-1.5">
            <Cake className="w-4 h-4 text-[#71717A]" />
            Geburtsdatum
          </Label.Root>
          <input
            id="geburtsdatum"
            type="date"
            value={state.geburtsdatum}
            onChange={(e) => dispatch({ type: 'PATCH', payload: { geburtsdatum: e.target.value } })}
            max={today}
            min="1930-01-01"
            className="h-11 px-3 rounded-lg border border-[#E4E4E7] bg-white text-[#0A0A0A] text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
          />
        </div>

        {/* Alters-Anzeige */}
        <AnimatePresence>
          {age !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              {age < 6 ? (
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#991B1B]">
                    Du bist <strong>{age} Jahre alt</strong> — SportRise ist ab 6 Jahren verfügbar.
                  </p>
                </div>
              ) : age < 14 ? (
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
                  <ShieldCheck className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#92400E]">
                    Du bist <strong>{age} Jahre alt</strong> — für Kinder unter 14 Jahren benötigen wir die Zustimmung eines Erziehungsberechtigten.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#F4F4F5] w-fit">
                  <Cake className="w-3.5 h-3.5 text-[#71717A]" />
                  <span className="text-sm text-[#52525B]">Du bist {age} Jahre alt.</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* E-Mail Erziehungsberechtigter */}
        <AnimatePresence>
          {age !== null && age >= 6 && age < 14 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1.5">
                <Label.Root htmlFor="parentEmail" className="text-sm font-medium text-[#0A0A0A]">
                  E-Mail Erziehungsberechtigte/r
                </Label.Root>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] pointer-events-none" />
                  <input
                    id="parentEmail"
                    type="email"
                    value={state.parentEmail}
                    onChange={(e) => dispatch({ type: 'PATCH', payload: { parentEmail: e.target.value } })}
                    placeholder="eltern@email.de"
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] text-[#0A0A0A] text-sm placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stadt + PLZ */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label.Root htmlFor="city" className="text-sm font-medium text-[#0A0A0A] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#71717A]" />
              Stadt
            </Label.Root>
            <input
              id="city"
              type="text"
              value={state.city}
              onChange={(e) => dispatch({ type: 'PATCH', payload: { city: e.target.value } })}
              placeholder="Frankfurt"
              autoComplete="address-level2"
              className="h-11 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label.Root htmlFor="plz" className="text-sm font-medium text-[#0A0A0A]">Postleitzahl</Label.Root>
            <input
              id="plz"
              type="text"
              value={state.plz}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                dispatch({ type: 'PATCH', payload: { plz: val } })
              }}
              placeholder="60311"
              inputMode="numeric"
              maxLength={5}
              autoComplete="postal-code"
              className="h-11 px-3 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-colors"
            />
          </div>
        </div>

        {/* Bundesland */}
        <div className="flex flex-col gap-1.5">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Bundesland</Label.Root>
          <StyledSelect
            value={state.bundesland}
            onValueChange={(v) => dispatch({ type: 'PATCH', payload: { bundesland: v } })}
            placeholder="Bundesland auswählen…"
            options={bundeslandOptions}
          />
        </div>

        {/* Geschlecht */}
        <div className="flex flex-col gap-2">
          <Label.Root className="text-sm font-medium text-[#0A0A0A]">Geschlecht</Label.Root>
          <div className="grid grid-cols-2 gap-2">
            {GESCHLECHT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => dispatch({ type: 'PATCH', payload: { geschlecht: value } })}
                className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                  state.geschlecht === value
                    ? 'border-2 border-[#16A34A] bg-[#F0FDF4] text-[#16A34A]'
                    : 'border border-[#E4E4E7] text-[#52525B] hover:border-[#A1A1AA]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 3 – "Deine Sportarten"
// ─────────────────────────────────────────────────────────────────

interface Step3Props {
  state: RegistrationState
  dispatch: React.Dispatch<RegistrationAction>
  dataSport: SportSlug | null
  onSportToggle: (slug: SportSlug) => void
}

function Step3({ state, dispatch, onSportToggle }: Step3Props) {
  const SPORT_CONFIG: {
    slug: SportSlug
    name: string
    desc: string
    SVG: React.ComponentType<{ size?: number }>
    accent: string
    selectedBg: string
    selectedBorder: string
  }[] = [
    {
      slug: 'fussball',
      name: 'Fußball',
      desc: 'Training, Taktik, Verein',
      SVG: FussballSVG,
      accent: '#16A34A',
      selectedBg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
      selectedBorder: '#16A34A',
    },
    {
      slug: 'tennis',
      name: 'Tennis',
      desc: 'LK, Drills, Sparring',
      SVG: TennisSVG,
      accent: '#C2621A',
      selectedBg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
      selectedBorder: '#C2621A',
    },
    {
      slug: 'basketball',
      name: 'Basketball',
      desc: 'Drills, Positionen, Liga',
      SVG: BasketballSVG,
      accent: '#EA580C',
      selectedBg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
      selectedBorder: '#EA580C',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A0A0A] mb-1">Deine Sportarten</h1>
      <p className="text-sm text-[#71717A] mb-7">
        Wähle bis zu 3. Du kannst später weitere hinzufügen.
      </p>

      {/* Sport-Karten */}
      <motion.div
        animate={state.sportShake ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {SPORT_CONFIG.map(({ slug, name, desc, SVG, accent, selectedBg, selectedBorder }) => {
          const isSelected = state.selectedSports.includes(slug)
          return (
            <button
              key={slug}
              type="button"
              onClick={() => onSportToggle(slug)}
              className="flex flex-col items-center gap-3 py-6 px-4 rounded-xl border-2 transition-all duration-200"
              style={
                isSelected
                  ? {
                      background: selectedBg,
                      borderColor: selectedBorder,
                      color: accent,
                      transform: 'translateY(0)',
                    }
                  : {
                      background: 'white',
                      borderColor: '#E4E4E7',
                      color: '#52525B',
                    }
              }
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#A1A1AA'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#E4E4E7'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              <SVG size={48} />
              <div className="text-center">
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-[#71717A] mt-0.5">{desc}</p>
              </div>
              {isSelected && (
                <CheckCircle2 className="w-4 h-4" style={{ color: accent }} />
              )}
            </button>
          )
        })}
      </motion.div>

      {/* Sport-Profil-Panels */}
      <AnimatePresence>
        {state.selectedSports.includes('fussball') && (
          <motion.div
            key="fussball-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-6">
              <h3 className="text-base font-semibold text-[#16A34A] mb-1">Fußball-Profil</h3>
              <FussballPanel state={state.fussball} dispatch={dispatch} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.selectedSports.includes('tennis') && (
          <motion.div
            key="tennis-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-6">
              <h3 className="text-base font-semibold text-[#C2621A] mb-1">Tennis-Profil</h3>
              <TennisPanel state={state.tennis} dispatch={dispatch} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.selectedSports.includes('basketball') && (
          <motion.div
            key="basketball-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-6">
              <h3 className="text-base font-semibold text-[#EA580C] mb-1">Basketball-Profil</h3>
              <BasketballPanel state={state.basketball} dispatch={dispatch} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hauptsportart (wenn >1 Sport gewählt) */}
      <AnimatePresence>
        {state.selectedSports.length > 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-6"
          >
            <div className="p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA]">
              <p className="text-sm font-medium text-[#0A0A0A] mb-3">Welcher ist dein Hauptsport?</p>
              <div className="flex flex-col gap-2">
                {state.selectedSports.map((slug) => {
                  const labels: Record<SportSlug, string> = { fussball: 'Fußball', tennis: 'Tennis', basketball: 'Basketball' }
                  return (
                    <label key={slug} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox.Root
                        checked={state.primarySport === slug}
                        onCheckedChange={(checked) => {
                          if (checked === true) dispatch({ type: 'SET_PRIMARY_SPORT', payload: slug })
                        }}
                        className="w-4 h-4 rounded border border-[#E4E4E7] bg-white data-[state=checked]:bg-[#16A34A] data-[state=checked]:border-[#16A34A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/30 transition-colors flex-shrink-0 flex items-center justify-center"
                      >
                        <Checkbox.Indicator>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <span className="text-sm text-[#0A0A0A]">{labels[slug]}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 4 – "Deine Ziele"
// ─────────────────────────────────────────────────────────────────

const ZIEL_CONFIG: { value: ZielSlug; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'SPASS',      label: 'Spaß & Ausgleich',   desc: 'Sport ohne Druck, Freude am Spiel.',          icon: <Smile    size={28} /> },
  { value: 'VERBESSERN', label: 'Mich verbessern',     desc: 'Schritt für Schritt aufsteigen.',             icon: <TrendingUp size={28} /> },
  { value: 'PROFI',      label: 'Profi werden',        desc: 'Den Sport zur Karriere machen.',              icon: <Target   size={28} /> },
  { value: 'GESUNDHEIT', label: 'Gesünder leben',      desc: 'Fitness und Ernährung verbessern.',           icon: <Apple    size={28} /> },
  { value: 'COMMUNITY',  label: 'Community',           desc: 'Sportler kennenlernen, motiviert bleiben.',  icon: <Users    size={28} /> },
  { value: 'TURNIERE',   label: 'Turniere spielen',    desc: 'An Wettkämpfen in Hessen teilnehmen.',       icon: <Medal    size={28} /> },
]

interface Step4Props {
  state: RegistrationState
  dispatch: React.Dispatch<RegistrationAction>
}

function Step4({ state, dispatch }: Step4Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A0A0A] mb-1">Deine Ziele</h1>
      <p className="text-sm text-[#71717A] mb-7">
        Was motiviert dich? Wähle alles, was passt.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {ZIEL_CONFIG.map(({ value, label, desc, icon }) => {
          const selected = state.selectedZiele.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_ZIEL', payload: value })}
              className={[
                'relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all duration-200',
                selected
                  ? 'border-[#16A34A] bg-[#F0FDF4] shadow-md hover:-translate-y-1'
                  : 'border-[#E4E4E7] bg-white hover:-translate-y-0.5 hover:border-[#A1A1AA]',
              ].join(' ')}
            >
              {selected && (
                <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-[#16A34A]" />
              )}
              <div
                className="w-[52px] h-[52px] rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: selected ? '#DCFCE7' : '#F4F4F5', color: selected ? '#16A34A' : '#71717A' }}
              >
                {icon}
              </div>
              <div>
                <p className={`text-sm font-semibold leading-tight ${selected ? 'text-[#16A34A]' : 'text-[#0A0A0A]'}`}>
                  {label}
                </p>
                <p className="text-xs text-[#71717A] leading-snug mt-0.5">{desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-center text-xs text-[#A1A1AA] mt-6">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 5 – "Dein Equipment"
// ─────────────────────────────────────────────────────────────────

const HEIMBEDARF_OPTIONS: { value: HeimbedarfItem; label: string }[] = [
  { value: 'KURZHANTELN_LEICHT', label: 'Kurzhanteln 2–10 kg' },
  { value: 'KURZHANTELN_SCHWER',  label: 'Kurzhanteln 10 kg+' },
  { value: 'LANGHANTEL_RACK',     label: 'Langhantel + Rack' },
  { value: 'KETTLEBELL',          label: 'Kettlebell' },
  { value: 'WIEDERSTANDSBAENDER', label: 'Widerstandsbänder' },
  { value: 'SPRINGSEIL',          label: 'Springseil' },
  { value: 'KLIMMZUGSTANGE',      label: 'Klimmzugstange' },
  { value: 'YOGAMATTE',           label: 'Yogamatte' },
  { value: 'FAHRRAD',             label: 'Fahrrad / Ergometer' },
  { value: 'PULL_UP_BAR',         label: 'Pull-Up-Bar' },
  { value: 'TRX',                 label: 'TRX' },
  { value: 'SCHAUMSTOFFROLLE',    label: 'Schaumstoffrolle' },
]

interface EquipmentCard {
  value: EquipmentOption
  label: string
  desc: string
  icon: React.ReactNode
}

const EQUIPMENT_CARDS: EquipmentCard[] = [
  { value: 'KOERPERGEWICHT', label: 'Nur Körpergewicht',         desc: 'Ohne Geräte trainieren',              icon: <Home      size={24} /> },
  { value: 'EINIGE_GERAETE', label: 'Einige Geräte zuhause',    desc: 'Kleine Heimausstattung vorhanden',    icon: <Package   size={24} /> },
  { value: 'HEIMGYM',        label: 'Vollständiges Home-Gym',   desc: 'Gut ausgestattetes Heimstudio',       icon: <Warehouse size={24} /> },
  { value: 'FITNESSSTUDIO',  label: 'Fitnessstudio',             desc: 'Mitglied in einem Gym',               icon: <Building2 size={24} /> },
]

interface Step5Props {
  state: RegistrationState
  dispatch: React.Dispatch<RegistrationAction>
  gymAccessEnabled: boolean
}

function Step5({ state, dispatch, gymAccessEnabled }: Step5Props) {
  const visibleCards = EQUIPMENT_CARDS.filter(
    (c) => c.value !== 'FITNESSSTUDIO' || gymAccessEnabled,
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A0A0A] mb-1">Dein Equipment</h1>
      <p className="text-sm text-[#71717A] mb-7">
        Was steht dir fürs Training zur Verfügung?
      </p>

      <div className="flex flex-col gap-3">
        {visibleCards.map(({ value, label, desc, icon }) => {
          const selected = state.equipment === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => dispatch({ type: 'PATCH', payload: { equipment: value, heimbedarf: value !== 'EINIGE_GERAETE' ? [] : state.heimbedarf } })}
              className={[
                'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
                selected
                  ? 'border-[#16A34A] bg-[#F0FDF4]'
                  : 'border-[#E4E4E7] bg-white hover:border-[#A1A1AA]',
              ].join(' ')}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: selected ? '#DCFCE7' : '#F4F4F5', color: selected ? '#16A34A' : '#71717A' }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${selected ? 'text-[#16A34A]' : 'text-[#0A0A0A]'}`}>{label}</p>
                <p className="text-xs text-[#71717A]">{desc}</p>
              </div>
              <div
                className={[
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                  selected ? 'border-[#16A34A] bg-[#16A34A]' : 'border-[#D4D4D8]',
                ].join(' ')}
              >
                {selected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}

        {/* Fitnessstudio-Banner wenn unter 14 */}
        {!gymAccessEnabled && (
          <div className="bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] border border-[#86EFAC] rounded-2xl p-5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#15803D]">Fitnessstudio ab 14 Jahren</p>
              <p className="text-xs text-[#16A34A] mt-1 leading-relaxed">
                Die Fitnessstudio-Option ist ab 14 Jahren verfügbar. Du kannst sie später in deinem Profil aktivieren.
              </p>
            </div>
          </div>
        )}

        {/* Heimbedarf-Grid (Framer Motion) */}
        <AnimatePresence>
          {state.equipment === 'EINIGE_GERAETE' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pt-1 pb-1">
                <p className="text-sm font-medium text-[#0A0A0A] mb-3">Was hast du zuhause?</p>
                <div className="grid grid-cols-2 gap-2">
                  {HEIMBEDARF_OPTIONS.map(({ value, label }) => {
                    const checked = state.heimbedarf.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => dispatch({ type: 'TOGGLE_HEIMBEDARF', payload: value })}
                        className={[
                          'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all',
                          checked
                            ? 'border-[#16A34A] bg-[#F0FDF4] text-[#16A34A]'
                            : 'border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#A1A1AA]',
                        ].join(' ')}
                      >
                        <div
                          className={[
                            'w-4 h-4 rounded flex items-center justify-center flex-shrink-0',
                            checked ? 'bg-[#16A34A]' : 'border border-[#D4D4D8]',
                          ].join(' ')}
                        >
                          {checked && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
                              <path d="M1 3l1.8 2L7 1" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-xs text-[#A1A1AA] mt-6">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 6 – "Fast fertig!"
// ─────────────────────────────────────────────────────────────────

interface Step6Props {
  state: RegistrationState
  dispatch: React.Dispatch<RegistrationAction>
  onUsernameChange: (value: string) => void
  onSubmit: (avatarBlob: Blob | null) => Promise<void>
  age: number | null
}

function Step6({ state, dispatch, onUsernameChange, onSubmit, age }: Step6Props) {
  // ── Crop state ───────────────────────────────────────────────────
  const [imgSrc, setImgSrc] = useState<string>('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileExt, setFileExt] = useState<string>('jpg')

  // ── Drag-drop handlers ───────────────────────────────────────────
  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    setFileExt(ext)
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() ?? '')
      setCompletedCrop(undefined)
    })
    reader.readAsDataURL(file)
  }

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file) processFile(file)
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }

  // ── Initial crop on image load ───────────────────────────────────
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height,
    )
    setCrop(initCrop)
  }

  // ── Preview canvas update ────────────────────────────────────────
  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return
    const img = imgRef.current
    const canvas = previewCanvasRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    const size = 80
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, size, size,
    )
    ctx.restore()
  }, [completedCrop])

  // ── Cropped blob ────────────────────────────────────────────────
  const getCroppedBlob = async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current) return null
    const img = imgRef.current
    const canvas = document.createElement('canvas')
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    const size = Math.min(completedCrop.width * scaleX, completedCrop.height * scaleY)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, size, size,
    )
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), fileExt === 'png' ? 'image/png' : 'image/jpeg', 0.9)
    })
  }

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmitClick = async () => {
    const blob = imgSrc && completedCrop ? await getCroppedBlob() : null
    await onSubmit(blob)
  }

  // ── Validation ───────────────────────────────────────────────────
  const usernameValid =
    state.username.length >= 3 &&
    state.username.length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(state.username) &&
    state.usernameStatus === 'available'

  const checkboxValid =
    state.agbAccepted &&
    state.datenschutzAccepted &&
    (age === null || age >= 14 || state.elternEinverstanden)

  const canSubmit = usernameValid && checkboxValid && state.submitStatus !== 'loading' && state.submitStatus !== 'success'

  // ── Username icon ─────────────────────────────────────────────────
  const usernameIcon = () => {
    if (state.usernameStatus === 'checking') return <Loader2 className="w-4 h-4 text-[#A1A1AA] animate-spin" />
    if (state.usernameStatus === 'available') return <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
    if (state.usernameStatus === 'taken') return <XCircle className="w-4 h-4 text-[#EF4444]" />
    return null
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A0A0A] mb-1">Fast fertig!</h1>
      <p className="text-sm text-[#71717A] mb-7">
        Wähle deinen Benutzernamen und lade optional ein Profilbild hoch.
      </p>

      {/* Username */}
      <div className="flex flex-col gap-1.5 mb-6">
        <label htmlFor="username" className="text-sm font-medium text-[#0A0A0A] flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-[#71717A]" />
          Benutzername
        </label>
        <div className="flex">
          <span className="flex items-center px-3 bg-[#F4F4F5] border border-r-0 border-[#E4E4E7] rounded-l-xl text-sm text-[#71717A] select-none">
            @
          </span>
          <div className="relative flex-1">
            <input
              id="username"
              type="text"
              value={state.username}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20)
                onUsernameChange(val)
              }}
              placeholder="dein_name"
              autoComplete="username"
              className={[
                'h-11 w-full pr-10 pl-3 rounded-l-none rounded-r-xl border text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 transition-colors',
                state.usernameStatus === 'taken'
                  ? 'border-[#EF4444] focus:ring-[#EF4444]/20 focus:border-[#EF4444]'
                  : state.usernameStatus === 'available'
                    ? 'border-[#16A34A] focus:ring-[#16A34A]/20 focus:border-[#16A34A]'
                    : 'border-[#E4E4E7] focus:ring-[#16A34A]/20 focus:border-[#16A34A]',
              ].join(' ')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">{usernameIcon()}</span>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {state.usernameStatus === 'taken' && (
            <motion.p key="taken" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-[#EF4444]">
              Dieser Benutzername ist bereits vergeben.
            </motion.p>
          )}
          {state.usernameStatus === 'available' && (
            <motion.p key="available" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-[#16A34A]">
              Verfügbar!
            </motion.p>
          )}
        </AnimatePresence>
        <p className="text-xs text-[#A1A1AA]">Nur Buchstaben, Zahlen und Unterstriche. 3–20 Zeichen.</p>
      </div>

      {/* Profilbild */}
      <div className="flex flex-col gap-3 mb-6">
        <p className="text-sm font-medium text-[#0A0A0A]">
          Profilbild <span className="text-[#A1A1AA] font-normal">(optional)</span>
        </p>

        {imgSrc === '' ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
              isDragging ? 'border-[#16A34A] bg-[#F0FDF4]' : 'border-[#E4E4E7] bg-[#FAFAFA] hover:border-[#16A34A] hover:bg-[#F0FDF4]',
            ].join(' ')}
          >
            <Upload className="w-8 h-8 text-[#71717A]" />
            <p className="text-sm text-[#71717A] text-center leading-relaxed">
              Bild hier ablegen oder <span className="text-[#16A34A] font-medium">klicken zum Auswählen</span>
            </p>
            <p className="text-xs text-[#A1A1AA]">JPG, PNG, max. 5 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectFile}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Crop area */}
            <div className="relative rounded-xl overflow-hidden border border-[#E4E4E7]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Zuschneiden"
                  onLoad={onImageLoad}
                  style={{ maxHeight: 280, width: '100%', objectFit: 'contain' }}
                />
              </ReactCrop>
              <button
                type="button"
                onClick={() => { setImgSrc(''); setCompletedCrop(undefined); setCrop(undefined) }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-[#52525B] hover:text-[#0A0A0A] transition-colors"
                aria-label="Bild entfernen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 80px circular preview */}
            {completedCrop && (
              <div className="flex items-center gap-3">
                <canvas
                  ref={previewCanvasRef}
                  className="rounded-full border-2 border-[#E4E4E7]"
                  style={{ width: 80, height: 80 }}
                />
                <p className="text-xs text-[#71717A]">Vorschau deines Profilbilds</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pflicht-Checkboxen */}
      <div className="flex flex-col gap-3 mb-6">
        {/* AGB */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <button
            type="button"
            role="checkbox"
            aria-checked={state.agbAccepted}
            onClick={() => dispatch({ type: 'PATCH', payload: { agbAccepted: !state.agbAccepted } })}
            className={[
              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
              state.agbAccepted ? 'bg-[#16A34A] border-[#16A34A]' : 'border-[#D4D4D8] bg-white hover:border-[#16A34A]',
            ].join(' ')}
          >
            {state.agbAccepted && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-sm text-[#52525B]">
            Ich akzeptiere die{' '}
            <Link href="/nutzungsbedingungen" className="text-[#16A34A] underline hover:text-[#15803D]" target="_blank">
              Nutzungsbedingungen
            </Link>
          </span>
        </label>

        {/* Datenschutz */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <button
            type="button"
            role="checkbox"
            aria-checked={state.datenschutzAccepted}
            onClick={() => dispatch({ type: 'PATCH', payload: { datenschutzAccepted: !state.datenschutzAccepted } })}
            className={[
              'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
              state.datenschutzAccepted ? 'bg-[#16A34A] border-[#16A34A]' : 'border-[#D4D4D8] bg-white hover:border-[#16A34A]',
            ].join(' ')}
          >
            {state.datenschutzAccepted && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-sm text-[#52525B]">
            Ich habe die{' '}
            <Link href="/datenschutz" className="text-[#16A34A] underline hover:text-[#15803D]" target="_blank">
              Datenschutzerklärung
            </Link>{' '}
            gelesen und stimme zu
          </span>
        </label>

        {/* Eltern (nur unter 14) */}
        {age !== null && age < 14 && (
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={state.elternEinverstanden}
              onClick={() => dispatch({ type: 'PATCH', payload: { elternEinverstanden: !state.elternEinverstanden } })}
              className={[
                'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                state.elternEinverstanden ? 'bg-[#16A34A] border-[#16A34A]' : 'border-[#D4D4D8] bg-white hover:border-[#16A34A]',
              ].join(' ')}
            >
              {state.elternEinverstanden && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="text-sm text-[#52525B]">
              Mein Erziehungsberechtigter ist einverstanden
            </span>
          </label>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {state.submitError !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] mb-4"
          >
            <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#EF4444]">{state.submitError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <button
        type="button"
        onClick={() => { void handleSubmitClick() }}
        disabled={!canSubmit}
        className="w-full h-12 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        style={{
          background: 'linear-gradient(90deg, #16A34A, #15803D)',
          boxShadow: canSubmit ? '0 4px 24px rgba(22,163,74,0.35)' : 'none',
        }}
      >
        {state.submitStatus === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Konto wird erstellt…
          </>
        ) : state.submitStatus === 'success' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Registriert!
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            Jetzt starten
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#A1A1AA] mt-4">
        Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main: RegistrierenClient
// ─────────────────────────────────────────────────────────────────

export default function RegistrierenClient() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL sync: lesen (einmalig beim Mount)
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam !== null) {
      const n = parseInt(stepParam, 10)
      if (!isNaN(n) && n >= 1 && n <= 6) {
        dispatch({ type: 'SET_STEP', payload: n })
      }
    }
    // Bewusst: nur beim Mount, daher kein searchParams in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // URL sync: schreiben (bei step-Änderung)
  useEffect(() => {
    router.replace(`/registrieren?step=${state.step}`, { scroll: false })
  }, [state.step, router])

  // E-Mail Debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkEmail = useCallback(async (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      dispatch({ type: 'PATCH', payload: { emailStatus: 'idle' } })
      return
    }
    dispatch({ type: 'PATCH', payload: { emailStatus: 'checking' } })
    try {
      const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
      if (!res.ok) {
        dispatch({ type: 'PATCH', payload: { emailStatus: 'idle' } })
        return
      }
      const data = (await res.json()) as { available: boolean }
      dispatch({ type: 'PATCH', payload: { emailStatus: data.available ? 'available' : 'taken' } })
    } catch {
      dispatch({ type: 'PATCH', payload: { emailStatus: 'idle' } })
    }
  }, [])

  const handleEmailChange = (value: string) => {
    dispatch({ type: 'PATCH', payload: { email: value, emailStatus: 'idle' } })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void checkEmail(value)
    }, 500)
  }

  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      dispatch({ type: 'PATCH', payload: { usernameStatus: 'idle' } })
      return
    }
    dispatch({ type: 'PATCH', payload: { usernameStatus: 'checking' } })
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
      if (!res.ok) {
        dispatch({ type: 'PATCH', payload: { usernameStatus: 'idle' } })
        return
      }
      const data = (await res.json()) as { available: boolean }
      dispatch({ type: 'PATCH', payload: { usernameStatus: data.available ? 'available' : 'taken' } })
    } catch {
      dispatch({ type: 'PATCH', payload: { usernameStatus: 'idle' } })
    }
  }, [])

  const handleUsernameChange = (value: string) => {
    dispatch({ type: 'PATCH', payload: { username: value, usernameStatus: 'idle' } })
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current)
    usernameDebounceRef.current = setTimeout(() => {
      void checkUsername(value)
    }, 500)
  }

  // Toast auto-dismiss
  useEffect(() => {
    if (state.toastMessage === null) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3000)
    return () => clearTimeout(t)
  }, [state.toastMessage])

  // Shake auto-clear
  useEffect(() => {
    if (!state.sportShake) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_SHAKE' }), 600)
    return () => clearTimeout(t)
  }, [state.sportShake])

  // Glow auto-clear
  useEffect(() => {
    if (!state.progressGlow) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_GLOW' }), 2000)
    return () => clearTimeout(t)
  }, [state.progressGlow])

  // Altersberechnung (manuell, ohne date-fns)
  const age: number | null =
    state.geburtsdatum !== ''
      ? Math.floor((Date.now() - new Date(state.geburtsdatum).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

  const gymAccessEnabled = age !== null && age >= 14

  // Schritt-Validierung
  const pwStrength = getPasswordStrength(state.passwort)
  const pwMatch = state.passwort !== '' && state.passwort === state.passwortBestaetigen

  const step1Valid =
    state.vorname.trim().length >= 2 &&
    state.nachname.trim().length >= 2 &&
    state.emailStatus === 'available' &&
    pwStrength === 4 &&
    pwMatch

  const parentEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.parentEmail)
  const step2Valid =
    state.geburtsdatum !== '' &&
    age !== null &&
    age >= 6 &&
    (age >= 14 || parentEmailValid) &&
    state.city.trim().length >= 2 &&
    /^\d{5}$/.test(state.plz) &&
    state.bundesland !== '' &&
    state.geschlecht !== ''

  const step3Valid =
    state.selectedSports.length >= 1 &&
    (state.selectedSports.length <= 1 || state.primarySport !== null)

  const step4Valid = state.selectedZiele.length >= 1

  const step5Valid = state.equipment !== ''

  const isStepValid =
    state.step === 1 ? step1Valid
    : state.step === 2 ? step2Valid
    : state.step === 3 ? step3Valid
    : state.step === 4 ? step4Valid
    : state.step === 5 ? step5Valid
    : true

  // data-sport Attribut
  const dataSport = state.primarySport ?? state.selectedSports[0] ?? null

  // Handlers
  const handleSportToggle = (slug: SportSlug) => {
    if (!state.selectedSports.includes(slug) && state.selectedSports.length >= 3) {
      dispatch({ type: 'SPORT_SHAKE' })
      dispatch({ type: 'SHOW_TOAST', payload: 'Maximal 3 Sportarten.' })
      return
    }
    dispatch({ type: 'TOGGLE_SPORT', payload: slug })
  }

  const handleNext = () => {
    if (state.step === 3) {
      dispatch({ type: 'PROGRESS_GLOW' })
      dispatch({ type: 'SHOW_TOAST', payload: 'Halbzeit — noch 3 Schritte!' })
    }
    dispatch({ type: 'SET_STEP', payload: state.step + 1 })
  }

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: state.step - 1 })
  }

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/onboarding' })
  }

  const handleSubmit = async (avatarBlob: Blob | null) => {
    dispatch({ type: 'SET_SUBMIT_STATUS', payload: 'loading' })
    dispatch({ type: 'SET_SUBMIT_ERROR', payload: null })
    try {
      // 1. Avatar hochladen (falls vorhanden)
      let avatarUrl: string | null = null
      if (avatarBlob !== null) {
        const formData = new FormData()
        formData.append('file', avatarBlob, `avatar.jpg`)
        const uploadRes = await fetch('/api/auth/upload-avatar', {
          method: 'POST',
          body: formData,
        })
        if (uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as { url: string }
          avatarUrl = uploadData.url
        }
      }

      // 2. Registrierung
      const body = {
        vorname: state.vorname,
        nachname: state.nachname,
        email: state.email,
        passwort: state.passwort,
        geburtsdatum: state.geburtsdatum,
        parentEmail: state.parentEmail || null,
        city: state.city,
        plz: state.plz,
        bundesland: state.bundesland,
        geschlecht: state.geschlecht,
        username: state.username,
        selectedZiele: state.selectedZiele,
        equipment: state.equipment,
        heimbedarf: state.heimbedarf,
        selectedSports: state.selectedSports,
        primarySport: state.primarySport,
        fussball: state.selectedSports.includes('fussball') ? state.fussball : null,
        tennis: state.selectedSports.includes('tennis') ? state.tennis : null,
        basketball: state.selectedSports.includes('basketball') ? state.basketball : null,
        avatarUrl,
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        let errorMessage = 'Ein Fehler ist aufgetreten.'
        try {
          const err = (await res.json()) as { error?: string }
          errorMessage = err.error ?? errorMessage
        } catch {
          // Response ist kein JSON (z.B. Next.js HTML-Fehlerseite bei 500)
          errorMessage = res.status === 409
            ? 'Diese E-Mail ist bereits registriert.'
            : `Serverfehler (${res.status}). Bitte versuche es erneut.`
        }
        dispatch({ type: 'SET_SUBMIT_STATUS', payload: 'error' })
        dispatch({ type: 'SET_SUBMIT_ERROR', payload: errorMessage })
        return
      }

      dispatch({ type: 'SET_SUBMIT_STATUS', payload: 'success' })
      dispatch({ type: 'SHOW_TOAST', payload: 'Willkommen bei SportRise!' })

      // 3. Auto-Login (redirect: false verhindert Redirect-Throw durch next-auth)
      //    Email in lowercase übergeben, genau wie in der DB gespeichert.
      let signInResult: { error?: string | null; ok?: boolean } | undefined
      try {
        signInResult = await signIn('credentials', {
          email: state.email.toLowerCase().trim(),
          password: state.passwort,
          redirect: false,
        })
      } catch (signInErr) {
        // signIn kann in next-auth beta einen internen Fehler werfen.
        // Wir loggen ihn und fahren direkt zum Onboarding – der User
        // ist bereits registriert und kann sich manuell einloggen.
        console.error('[signIn nach Registrierung]', signInErr)
        router.push('/onboarding')
        return
      }

      if (signInResult?.error) {
        // Fehlercode loggen für Debugging
        console.error('[signIn Fehler]', signInResult.error)
        dispatch({ type: 'SET_SUBMIT_STATUS', payload: 'error' })
        dispatch({
          type: 'SET_SUBMIT_ERROR',
          payload: 'Registrierung erfolgreich, aber Auto-Login fehlgeschlagen. Bitte manuell einloggen.',
        })
        return
      }

      router.push('/onboarding')
    } catch (err) {
      // Unerwarteter Fehler – echte Ursache in der Konsole sichtbar machen
      console.error('[handleSubmit Fehler]', err)
      dispatch({ type: 'SET_SUBMIT_STATUS', payload: 'error' })
      dispatch({ type: 'SET_SUBMIT_ERROR', payload: 'Netzwerkfehler. Bitte versuche es erneut.' })
    }
  }

  return (
    <div
      className="min-h-screen bg-[#FAFAFA]"
      {...(dataSport !== null ? { 'data-sport': dataSport } : {})}
    >
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-[#E4E4E7]">
        <motion.div
          className="h-full rounded-r-full"
          animate={{
            width: `${(state.step / 6) * 100}%`,
            boxShadow: state.progressGlow
              ? '0 0 12px 2px rgba(22,163,74,0.55)'
              : 'none',
          }}
          style={{
            background: 'linear-gradient(90deg, #16A34A, #4ADE80)',
          }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {state.toastMessage !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#0A0A0A] text-white rounded-2xl px-5 py-4 shadow-xl pointer-events-none"
          >
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
            <span className="text-sm font-medium">{state.toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout */}
      <div className="max-w-lg mx-auto px-4 pt-14 pb-20">
        {/* Schritt-Anzeige */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm text-[#71717A]">Schritt {state.step} von 6</span>
          {state.step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={state.submitStatus === 'loading' || state.submitStatus === 'success'}
              className="flex items-center gap-1.5 text-sm text-[#71717A] hover:text-[#0A0A0A] transition-colors disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Zurück
            </button>
          )}
        </div>

        {/* Schritt-Inhalt */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {state.step === 1 && (
              <Step1
                state={state}
                dispatch={dispatch}
                onEmailChange={handleEmailChange}
                onGoogleSignIn={handleGoogleSignIn}
              />
            )}
            {state.step === 2 && <Step2 state={state} dispatch={dispatch} age={age} />}
            {state.step === 3 && (
              <Step3
                state={state}
                dispatch={dispatch}
                dataSport={dataSport}
                onSportToggle={handleSportToggle}
              />
            )}
            {state.step === 4 && <Step4 state={state} dispatch={dispatch} />}
            {state.step === 5 && (
              <Step5
                state={state}
                dispatch={dispatch}
                gymAccessEnabled={gymAccessEnabled}
              />
            )}
            {state.step === 6 && (
              <Step6
                state={state}
                dispatch={dispatch}
                onUsernameChange={handleUsernameChange}
                onSubmit={handleSubmit}
                age={age}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation (nur Schritte 1–5) */}
        {state.step <= 5 && (
          <div className="mt-8 flex flex-col gap-4">
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid}
              className="w-full h-11 rounded-lg bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803D] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              style={{ boxShadow: isStepValid ? '0 4px 24px rgba(22,163,74,0.35)' : 'none' }}
            >
              Weiter
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            {state.step === 1 && (
              <p className="text-center text-sm text-[#71717A]">
                Bereits registriert?{' '}
                <Link href="/login" className="text-[#16A34A] font-medium hover:text-[#15803D] transition-colors">
                  Jetzt anmelden
                </Link>
              </p>
            )}

            <p className="text-center text-xs text-[#A1A1AA]">
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
