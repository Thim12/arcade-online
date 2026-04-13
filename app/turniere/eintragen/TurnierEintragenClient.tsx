'use client'

// ─────────────────────────────────────────────────────────────────
// app/turniere/eintragen/TurnierEintragenClient.tsx
// 4-Schritt-Formular: Turnier bei SportRise eintragen
// ─────────────────────────────────────────────────────────────────

import { useReducer, type Dispatch, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Info,
  Send,
  AlertCircle,
  Loader2,
  User,
  Users,
  Shield,
  Shuffle,
  CalendarDays,
} from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import * as Switch from '@radix-ui/react-switch'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Slider from '@radix-ui/react-slider'
import * as Label from '@radix-ui/react-label'
import { cn } from '@/lib/utils/cn'
import { TurnierCard } from '@/components/turniere/TurnierCard'
import type { TurnierListItem, TurnierFormat } from '@/lib/types/turnier'
import { LEVEL_LABELS } from '@/lib/types/turnier'

// ── Types ─────────────────────────────────────────────────────────

type SportSlug = 'fussball' | 'tennis' | 'basketball'
type Niveau = 'ANFAENGER' | 'FORTGESCHRITTENE' | 'WETTKAMPF' | 'PROFI'
type TennisBelag = 'SAND' | 'HART' | 'KUNSTRASEN' | 'HALLE' | ''
type BasketballModus = '5V5' | '3X3' | ''

interface FussballTurnierDetails {
  spielmodus: string
  schiedsrichter: boolean
}

interface TennisTurnierDetails {
  belag: TennisBelag
  lkWertung: boolean
}

interface BasketballTurnierDetails {
  modus: BasketballModus
  halbzeitMinuten: number
}

interface FormState {
  step: 1 | 2 | 3 | 4
  // Step 1
  turniername: string
  sportSlug: SportSlug | ''
  strasse: string
  hausnummer: string
  plz: string
  stadt: string
  bundesland: string
  startDate: string
  endDate: string
  registrationDeadline: string
  startzeit: string
  format: TurnierFormat | ''
  // Step 2
  beschreibung: string
  maxParticipants: string
  entryFee: string
  preisgeld: string
  ageMin: number
  ageMax: number
  niveau: Niveau | ''
  fussball: FussballTurnierDetails
  tennis: TennisTurnierDetails
  basketball: BasketballTurnierDetails
  // Step 3
  veranstalterName: string
  veranstalterEmail: string
  veranstalterTelefon: string
  veranstalterWebsite: string
  einreicherVorname: string
  einreicherNachname: string
  einreicherEmail: string
  korrektheitscheck: boolean
  datenschutzcheck: boolean
  veranstalterCheck: boolean
  // Submit
  submitStatus: 'idle' | 'loading' | 'error'
  submitError: string | null
}

type Action =
  | { type: 'PATCH'; payload: Partial<Omit<FormState, 'fussball' | 'tennis' | 'basketball'>> }
  | { type: 'PATCH_FUSSBALL'; payload: Partial<FussballTurnierDetails> }
  | { type: 'PATCH_TENNIS'; payload: Partial<TennisTurnierDetails> }
  | { type: 'PATCH_BASKETBALL'; payload: Partial<BasketballTurnierDetails> }

// ── Reducer ───────────────────────────────────────────────────────

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'PATCH':
      return { ...state, ...action.payload }
    case 'PATCH_FUSSBALL':
      return { ...state, fussball: { ...state.fussball, ...action.payload } }
    case 'PATCH_TENNIS':
      return { ...state, tennis: { ...state.tennis, ...action.payload } }
    case 'PATCH_BASKETBALL':
      return { ...state, basketball: { ...state.basketball, ...action.payload } }
  }
}

// ── Constants ─────────────────────────────────────────────────────

const SPORT_CONFIG: Record<SportSlug, { label: string; primary: string; light: string; glow: string }> = {
  fussball:   { label: 'Fußball',    primary: '#16A34A', light: '#DCFCE7', glow: 'rgba(22,163,74,0.35)' },
  tennis:     { label: 'Tennis',     primary: '#C2621A', light: '#FFEDD5', glow: 'rgba(194,98,26,0.35)' },
  basketball: { label: 'Basketball', primary: '#EA580C', light: '#FFEDD5', glow: 'rgba(234,88,12,0.35)' },
}

const BUNDESLAENDER = [
  { value: 'HESSEN',                 label: 'Hessen', available: true },
  { value: 'BADEN_WUERTTEMBERG',     label: 'Baden-Württemberg', available: false },
  { value: 'BAYERN',                 label: 'Bayern', available: false },
  { value: 'BERLIN',                 label: 'Berlin', available: false },
  { value: 'BRANDENBURG',            label: 'Brandenburg', available: false },
  { value: 'BREMEN',                 label: 'Bremen', available: false },
  { value: 'HAMBURG',                label: 'Hamburg', available: false },
  { value: 'MECKLENBURG_VORPOMMERN', label: 'Mecklenburg-Vorpommern', available: false },
  { value: 'NIEDERSACHSEN',          label: 'Niedersachsen', available: false },
  { value: 'NORDRHEIN_WESTFALEN',    label: 'Nordrhein-Westfalen', available: false },
  { value: 'RHEINLAND_PFALZ',        label: 'Rheinland-Pfalz', available: false },
  { value: 'SAARLAND',               label: 'Saarland', available: false },
  { value: 'SACHSEN',                label: 'Sachsen', available: false },
  { value: 'SACHSEN_ANHALT',         label: 'Sachsen-Anhalt', available: false },
  { value: 'SCHLESWIG_HOLSTEIN',     label: 'Schleswig-Holstein', available: false },
  { value: 'THUERINGEN',             label: 'Thüringen', available: false },
]

const FORMAT_OPTIONS: { value: TurnierFormat; label: string; Icon: typeof User }[] = [
  { value: 'EINZEL',     label: 'Einzel',      Icon: User },
  { value: 'DOPPEL',     label: 'Doppel',      Icon: Users },
  { value: 'MANNSCHAFT', label: 'Mannschaft',  Icon: Shield },
  { value: 'GEMISCHT',   label: 'Gemischt',    Icon: Shuffle },
]

const NIVEAU_OPTIONS: { value: Niveau; label: string; desc: string }[] = [
  { value: 'ANFAENGER',        label: 'Anfänger',        desc: 'Einsteiger willkommen' },
  { value: 'FORTGESCHRITTENE', label: 'Fortgeschrittene', desc: 'Grundkenntnisse erwünscht' },
  { value: 'WETTKAMPF',        label: 'Wettkampf',       desc: 'Regelmäßiger Spielbetrieb' },
  { value: 'PROFI',            label: 'Profi',           desc: 'Höchstes Niveau' },
]

const TENNIS_BELAG_OPTIONS: { value: TennisBelag; label: string }[] = [
  { value: 'SAND',      label: 'Sand' },
  { value: 'HART',      label: 'Hart' },
  { value: 'KUNSTRASEN', label: 'Kunstrasen' },
  { value: 'HALLE',     label: 'Halle' },
]

const INITIAL_STATE: FormState = {
  step: 1,
  turniername: '', sportSlug: '', strasse: '', hausnummer: '',
  plz: '', stadt: '', bundesland: '',
  startDate: '', endDate: '', registrationDeadline: '', startzeit: '',
  format: '',
  beschreibung: '', maxParticipants: '', entryFee: '', preisgeld: '',
  ageMin: 8, ageMax: 60, niveau: '',
  fussball: { spielmodus: '', schiedsrichter: false },
  tennis: { belag: '', lkWertung: false },
  basketball: { modus: '', halbzeitMinuten: 10 },
  veranstalterName: '', veranstalterEmail: '',
  veranstalterTelefon: '', veranstalterWebsite: '',
  einreicherVorname: '', einreicherNachname: '', einreicherEmail: '',
  korrektheitscheck: false, datenschutzcheck: false, veranstalterCheck: false,
  submitStatus: 'idle', submitError: null,
}

// ── Sport SVGs ────────────────────────────────────────────────────

function FussballSVG({ size = 40 }: { size?: number }) {
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

function TennisSVG({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="2" />
      <path d="M8 28 Q18 12 28 28 Q38 44 48 28" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 28 Q18 44 28 28 Q38 12 48 28" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  )
}

function BasketballSVG({ size = 40 }: { size?: number }) {
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

// ── Helper Components ─────────────────────────────────────────────

function FieldInput({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label.Root className="text-sm font-medium text-[#0A0A0A]">
        {label}
        {optional && <span className="text-[#A1A1AA] font-normal ml-1">(optional)</span>}
      </Label.Root>
      {children}
    </div>
  )
}

function SportSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="relative h-5 w-9 rounded-full transition-colors focus:outline-none data-[state=checked]:bg-[var(--sport-primary,#16A34A)] data-[state=unchecked]:bg-[#E4E4E7]"
    >
      <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
    </Switch.Root>
  )
}

function inputCls(hasError = false) {
  return cn(
    'h-10 px-3 rounded-lg border text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--sport-primary,#16A34A)]/30 focus:border-[var(--sport-primary,#16A34A)] transition-colors w-full',
    hasError ? 'border-red-400' : 'border-[#E4E4E7]',
  )
}

// Bundesland Select
function BundeslandSelect({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  const selected = BUNDESLAENDER.find((b) => b.value === value)
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#0A0A0A] focus:outline-none data-[placeholder]:text-[#A1A1AA] transition-colors">
        <Select.Value placeholder="Bundesland wählen…">
          {selected ? (
            <span className="flex items-center gap-1.5">
              {selected.available && <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] flex-shrink-0" />}
              {selected.available ? 'Hessen (aktuell verfügbar)' : selected.label}
            </span>
          ) : null}
        </Select.Value>
        <Select.Icon>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 4l4 4 4-4" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" sideOffset={4} className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[#E4E4E7] bg-white shadow-lg">
          <Select.ScrollUpButton className="flex h-7 cursor-default items-center justify-center bg-white text-[#71717A]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Select.ScrollUpButton>
          <Select.Viewport className="p-1 max-h-60">
            <Select.Item value="HESSEN" className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-[#F0FDF4] focus:bg-[#F0FDF4] data-[state=checked]:font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] flex-shrink-0" />
              <Select.ItemText>Hessen (aktuell verfügbar)</Select.ItemText>
            </Select.Item>
            <Select.Separator className="h-px bg-[#E4E4E7] my-1" />
            {BUNDESLAENDER.filter((b) => !b.available).map((bl) => (
              <Select.Item key={bl.value} value={bl.value} className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-[#71717A] outline-none hover:bg-[#F4F4F5] focus:bg-[#F4F4F5]">
                <Select.ItemText>{bl.label}</Select.ItemText>
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

// ── Progress Stepper ──────────────────────────────────────────────

const STEP_LABELS = ['Grunddaten', 'Details', 'Kontakt', 'Vorschau']

function ProgressStepper({ step, accentColor }: { step: number; accentColor: string }) {
  return (
    <div className="flex items-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1
        const isCompleted = num < step
        const isActive = num === step
        return (
          <div key={num} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2"
                style={
                  isCompleted
                    ? { background: accentColor, borderColor: accentColor, color: 'white' }
                    : isActive
                      ? { background: 'white', borderColor: accentColor, color: accentColor }
                      : { background: 'white', borderColor: '#E4E4E7', color: '#A1A1AA' }
                }
              >
                {isCompleted ? <CheckCircle2 size={14} /> : num}
              </div>
              <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: isActive ? accentColor : isCompleted ? accentColor : '#A1A1AA' }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mb-4 transition-colors" style={{ background: num < step ? accentColor : '#E4E4E7' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step Validation ───────────────────────────────────────────────

function isStep1Valid(s: FormState): boolean {
  return (
    s.turniername.trim().length >= 2 &&
    s.sportSlug !== '' &&
    s.strasse.trim().length > 0 &&
    s.hausnummer.trim().length > 0 &&
    s.plz.trim().length === 5 &&
    s.stadt.trim().length > 0 &&
    s.bundesland !== '' &&
    s.startDate !== '' &&
    s.endDate !== '' &&
    s.format !== ''
  )
}

function isStep2Valid(s: FormState): boolean {
  return (
    s.beschreibung.length >= 50 &&
    s.beschreibung.length <= 2000 &&
    s.niveau !== ''
  )
}

function isStep3Valid(s: FormState): boolean {
  return (
    s.veranstalterName.trim().length > 0 &&
    s.veranstalterEmail.trim().length > 0 &&
    s.einreicherVorname.trim().length > 0 &&
    s.einreicherNachname.trim().length > 0 &&
    s.einreicherEmail.trim().length > 0 &&
    s.korrektheitscheck &&
    s.datenschutzcheck &&
    s.veranstalterCheck
  )
}

// ── Build preview TurnierListItem ─────────────────────────────────

function buildPreviewItem(state: FormState): TurnierListItem {
  const slug = state.sportSlug || 'fussball'
  const cfg = SPORT_CONFIG[slug as SportSlug]

  return {
    id: 'preview',
    name: state.turniername || 'Turniername',
    slug: 'preview',
    description: state.beschreibung || null,
    city: state.stadt || 'Musterstadt',
    state: state.bundesland || 'HESSEN',
    address: `${state.strasse} ${state.hausnummer}`.trim() || null,
    latitude: null,
    longitude: null,
    startDate: state.startDate || new Date().toISOString(),
    endDate: state.endDate || new Date().toISOString(),
    registrationDeadline: state.registrationDeadline || null,
    maxParticipants: state.maxParticipants ? parseInt(state.maxParticipants, 10) : null,
    currentParticipants: 0,
    entryFee: state.entryFee ? parseFloat(state.entryFee) : null,
    prizePool: null,
    level: state.niveau || 'ANFAENGER',
    status: 'DRAFT',
    coverUrl: null,
    format: state.format !== '' ? state.format : null,
    ageMin: state.ageMin,
    ageMax: state.ageMax,
    sport: {
      id: slug,
      name: cfg.label,
      slug,
      colorPrimary: cfg.primary,
      colorLight: cfg.light,
      colorGlow: cfg.glow,
      iconName: 'Trophy',
    },
    isRegistered: false,
    distanceKm: null,
  }
}

// ── Sport-Details Panels ──────────────────────────────────────────

function FussballDetailsPanel({ state, dispatch, accentColor }: { state: FormState; dispatch: Dispatch<Action>; accentColor: string }) {
  const fb = state.fussball
  const patch = (p: Partial<FussballTurnierDetails>) => dispatch({ type: 'PATCH_FUSSBALL', payload: p })

  const SPIELMODUS_OPTIONS = ['KO-System', 'Ligasystem', 'Gruppenphase + KO', 'Jeder gegen jeden', 'Sonstiges']

  return (
    <div className="space-y-4 pt-4 border-t border-[#E4E4E7] mt-4">
      <FieldInput label="Spielmodus" optional>
        <div className="flex flex-wrap gap-2">
          {SPIELMODUS_OPTIONS.map((opt) => {
            const sel = fb.spielmodus === opt
            return (
              <button key={opt} type="button" onClick={() => patch({ spielmodus: opt })}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={sel ? { background: accentColor, color: 'white', borderColor: accentColor } : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </FieldInput>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0A0A0A]">Schiedsrichter gestellt</p>
          <p className="text-xs text-[#71717A]">Offizielle Schiedsrichter vorhanden</p>
        </div>
        <SportSwitch checked={fb.schiedsrichter} onCheckedChange={(v) => patch({ schiedsrichter: v })} />
      </div>
    </div>
  )
}

function TennisDetailsPanel({ state, dispatch, accentColor }: { state: FormState; dispatch: Dispatch<Action>; accentColor: string }) {
  const tn = state.tennis
  const patch = (p: Partial<TennisTurnierDetails>) => dispatch({ type: 'PATCH_TENNIS', payload: p })

  return (
    <div className="space-y-4 pt-4 border-t border-[#E4E4E7] mt-4">
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Belag <span className="text-[#A1A1AA] font-normal">(optional)</span></Label.Root>
        <div className="grid grid-cols-4 gap-2">
          {TENNIS_BELAG_OPTIONS.map((opt) => {
            const sel = tn.belag === opt.value
            return (
              <button key={opt.value} type="button" onClick={() => patch({ belag: sel ? '' : opt.value })}
                className="h-10 rounded-lg border text-sm font-medium transition-all"
                style={sel ? { background: accentColor, color: 'white', borderColor: accentColor } : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0A0A0A]">LK-Wertung</p>
          <p className="text-xs text-[#71717A]">Turnier zählt für die Leistungsklasse</p>
        </div>
        <SportSwitch checked={tn.lkWertung} onCheckedChange={(v) => patch({ lkWertung: v })} />
      </div>
    </div>
  )
}

function BasketballDetailsPanel({ state, dispatch, accentColor }: { state: FormState; dispatch: Dispatch<Action>; accentColor: string }) {
  const bb = state.basketball
  const patch = (p: Partial<BasketballTurnierDetails>) => dispatch({ type: 'PATCH_BASKETBALL', payload: p })

  return (
    <div className="space-y-4 pt-4 border-t border-[#E4E4E7] mt-4">
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielmodus</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(['5V5', '3X3'] as BasketballModus[]).map((opt) => {
            const sel = bb.modus === opt
            return (
              <button key={opt} type="button" onClick={() => patch({ modus: sel ? '' : opt })}
                className="h-10 rounded-lg border text-sm font-medium transition-all"
                style={sel ? { background: accentColor, color: 'white', borderColor: accentColor } : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }}
              >
                {opt === '5V5' ? '5v5' : '3×3'}
              </button>
            )
          })}
        </div>
      </div>

      <FieldInput label="Halbzeit-Minuten">
        <input
          type="number" min={5} max={60}
          value={bb.halbzeitMinuten}
          onChange={(e) => patch({ halbzeitMinuten: Math.max(5, Math.min(60, parseInt(e.target.value, 10) || 10)) })}
          className={inputCls()}
        />
      </FieldInput>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────

export default function TurnierEintragenClient() {
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const sport = state.sportSlug !== '' ? SPORT_CONFIG[state.sportSlug] : SPORT_CONFIG.fussball
  const accentColor = sport.primary

  function patch(payload: Partial<Omit<FormState, 'fussball' | 'tennis' | 'basketball'>>) {
    dispatch({ type: 'PATCH', payload })
  }

  function goToStep(n: 1 | 2 | 3 | 4) {
    dispatch({ type: 'PATCH', payload: { step: n } })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    dispatch({ type: 'PATCH', payload: { submitStatus: 'loading', submitError: null } })
    try {
      const body = {
        turniername: state.turniername,
        sportSlug: state.sportSlug,
        strasse: state.strasse,
        hausnummer: state.hausnummer,
        plz: state.plz,
        stadt: state.stadt,
        bundesland: state.bundesland,
        startDate: state.startDate,
        endDate: state.endDate,
        registrationDeadline: state.registrationDeadline || undefined,
        startzeit: state.startzeit || undefined,
        format: state.format,
        beschreibung: state.beschreibung,
        maxParticipants: state.maxParticipants ? parseInt(state.maxParticipants, 10) : undefined,
        entryFee: state.entryFee ? parseFloat(state.entryFee) : undefined,
        preisgeld: state.preisgeld || undefined,
        ageMin: state.ageMin,
        ageMax: state.ageMax,
        niveau: state.niveau,
        sportDetails:
          state.sportSlug === 'fussball'
            ? state.fussball
            : state.sportSlug === 'tennis'
              ? state.tennis
              : state.basketball,
        veranstalterName: state.veranstalterName,
        veranstalterEmail: state.veranstalterEmail,
        veranstalterTelefon: state.veranstalterTelefon || undefined,
        veranstalterWebsite: state.veranstalterWebsite || undefined,
        einreicherVorname: state.einreicherVorname,
        einreicherNachname: state.einreicherNachname,
        einreicherEmail: state.einreicherEmail,
      }
      const res = await fetch('/api/turniere/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Unbekannter Fehler')
      }
      router.push('/turniere/eintragen/success')
    } catch (err) {
      dispatch({
        type: 'PATCH',
        payload: {
          submitStatus: 'error',
          submitError: err instanceof Error ? err.message : 'Unbekannter Fehler',
        },
      })
    }
  }

  const today = new Date().toISOString().split('T')[0] ?? ''

  return (
    <div data-sport={state.sportSlug || 'fussball'} style={{ '--sport-primary': accentColor } as React.CSSProperties}>
      {/* ── Dark Header ── */}
      <div className="bg-[#0A0A0A] py-12 px-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-white tracking-tight">Turnier eintragen.</h1>
          <p className="mt-2 text-[#A1A1AA] text-sm">
            Kostenlos · Geprüft innerhalb 24–48 Stunden
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Kostenlos', 'Kein Abo', 'Community-geprüft'].map((chip) => (
              <span key={chip} className="flex items-center gap-1 px-3 py-1 rounded-full border border-white/20 text-white/80 text-xs font-medium">
                <CheckCircle2 size={11} className="text-[#16A34A]" />
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form body ── */}
      <div className="bg-[#FAFAFA] min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-8">
          {/* Progress */}
          <div className="mb-8">
            <ProgressStepper step={state.step} accentColor={accentColor} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              {/* ══ STEP 1 ══════════════════════════════════════════ */}
              {state.step === 1 && (
                <div className="space-y-6">
                  <FieldInput label="Turniername">
                    <input
                      type="text"
                      value={state.turniername}
                      onChange={(e) => patch({ turniername: e.target.value })}
                      placeholder="z.B. Hessische Jugendmeisterschaft 2026"
                      maxLength={120}
                      className={inputCls(!state.turniername.trim())}
                    />
                  </FieldInput>

                  {/* Sport-Wahl */}
                  <div className="flex flex-col gap-2">
                    <Label.Root className="text-sm font-medium text-[#0A0A0A]">Sportart</Label.Root>
                    <div className="grid grid-cols-3 gap-3">
                      {(['fussball', 'tennis', 'basketball'] as SportSlug[]).map((slug) => {
                        const cfg = SPORT_CONFIG[slug]
                        const isSelected = state.sportSlug === slug
                        const Icon = slug === 'fussball' ? FussballSVG : slug === 'tennis' ? TennisSVG : BasketballSVG
                        return (
                          <button key={slug} type="button" onClick={() => patch({ sportSlug: slug })}
                            className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 transition-all"
                            style={
                              isSelected
                                ? { background: `linear-gradient(135deg, ${cfg.light}, white)`, borderColor: cfg.primary, color: cfg.primary, boxShadow: `0 0 0 3px ${cfg.glow}` }
                                : { background: 'white', borderColor: '#E4E4E7', color: '#71717A' }
                            }
                          >
                            <Icon size={32} />
                            <span className="text-xs font-semibold">{cfg.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <FieldInput label="Straße">
                        <input type="text" value={state.strasse} onChange={(e) => patch({ strasse: e.target.value })} placeholder="Musterstraße" className={inputCls()} />
                      </FieldInput>
                    </div>
                    <FieldInput label="Nr.">
                      <input type="text" value={state.hausnummer} onChange={(e) => patch({ hausnummer: e.target.value })} placeholder="12" className={inputCls()} />
                    </FieldInput>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput label="PLZ">
                      <input type="text" value={state.plz} onChange={(e) => patch({ plz: e.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="60313" maxLength={5} className={inputCls()} />
                    </FieldInput>
                    <FieldInput label="Stadt">
                      <input type="text" value={state.stadt} onChange={(e) => patch({ stadt: e.target.value })} placeholder="Frankfurt" className={inputCls()} />
                    </FieldInput>
                  </div>

                  <FieldInput label="Bundesland">
                    <BundeslandSelect value={state.bundesland} onValueChange={(v) => patch({ bundesland: v })} />
                    <div className="mt-2 flex items-start gap-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-3">
                      <Info size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#92400E] leading-relaxed">
                        Aktuell nur Hessen verfügbar. Wir expandieren bald bundesweit — trag dein Turnier schon jetzt ein!
                      </p>
                    </div>
                  </FieldInput>

                  {/* Datum */}
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput label="Startdatum">
                      <input type="date" min={today} value={state.startDate} onChange={(e) => patch({ startDate: e.target.value })} className={inputCls()} />
                    </FieldInput>
                    <FieldInput label="Enddatum">
                      <input type="date" min={state.startDate || today} value={state.endDate} onChange={(e) => patch({ endDate: e.target.value })} className={inputCls()} />
                    </FieldInput>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput label="Anmeldefrist" optional>
                      <input type="date" max={state.startDate || undefined} value={state.registrationDeadline} onChange={(e) => patch({ registrationDeadline: e.target.value })} className={inputCls()} />
                    </FieldInput>
                    <FieldInput label="Uhrzeit (Start)" optional>
                      <input type="time" value={state.startzeit} onChange={(e) => patch({ startzeit: e.target.value })} className={inputCls()} />
                    </FieldInput>
                  </div>

                  {/* Format */}
                  <div className="flex flex-col gap-2">
                    <Label.Root className="text-sm font-medium text-[#0A0A0A]">Format</Label.Root>
                    <div className="grid grid-cols-4 gap-2">
                      {FORMAT_OPTIONS.map(({ value, label, Icon }) => {
                        const sel = state.format === value
                        return (
                          <button key={value} type="button" onClick={() => patch({ format: value })}
                            className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all"
                            style={sel ? { background: `linear-gradient(135deg, ${sport.light}, white)`, borderColor: accentColor, color: accentColor } : { background: 'white', borderColor: '#E4E4E7', color: '#71717A' }}
                          >
                            <Icon size={18} />
                            <span className="text-[11px] font-semibold">{label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ STEP 2 ══════════════════════════════════════════ */}
              {state.step === 2 && (
                <div className="space-y-6">
                  {/* Beschreibung */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label.Root className="text-sm font-medium text-[#0A0A0A]">Beschreibung</Label.Root>
                      <span className={cn('text-xs', state.beschreibung.length < 50 ? 'text-[#A1A1AA]' : state.beschreibung.length > 2000 ? 'text-red-500' : 'text-[#16A34A]')}>
                        {state.beschreibung.length}/2000
                      </span>
                    </div>
                    <textarea
                      value={state.beschreibung}
                      onChange={(e) => patch({ beschreibung: e.target.value })}
                      placeholder="Beschreibe das Turnier: Zielgruppe, Ablauf, Besonderheiten..."
                      rows={5}
                      maxLength={2000}
                      className="px-3 py-2 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[var(--sport-primary,#16A34A)]/30 focus:border-[var(--sport-primary,#16A34A)] transition-colors w-full resize-none"
                    />
                    {state.beschreibung.length > 0 && state.beschreibung.length < 50 && (
                      <p className="text-xs text-[#F59E0B]">Mindestens {50 - state.beschreibung.length} Zeichen fehlen noch.</p>
                    )}
                  </div>

                  {/* Teilnehmerzahl + Eintrittsgeld */}
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput label="Max. Teilnehmer" optional>
                      <input type="number" min={2} max={9999} value={state.maxParticipants} onChange={(e) => patch({ maxParticipants: e.target.value })} placeholder="z.B. 32" className={inputCls()} />
                    </FieldInput>
                    <FieldInput label="Startgeld (€)" optional>
                      <input type="number" min={0} step={0.5} value={state.entryFee} onChange={(e) => patch({ entryFee: e.target.value })} placeholder="0 = kostenlos" className={inputCls()} />
                    </FieldInput>
                  </div>

                  <FieldInput label="Preisgeld / Preise" optional>
                    <textarea
                      value={state.preisgeld}
                      onChange={(e) => patch({ preisgeld: e.target.value })}
                      placeholder="z.B. 1. Platz: 500 €, 2. Platz: 250 €, Pokale für die Top 3"
                      rows={2}
                      className="px-3 py-2 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[var(--sport-primary,#16A34A)]/30 focus:border-[var(--sport-primary,#16A34A)] transition-colors w-full resize-none"
                    />
                  </FieldInput>

                  {/* Altersbereich-Slider */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label.Root className="text-sm font-medium text-[#0A0A0A]">Altersbereich</Label.Root>
                      <span className="text-sm font-semibold" style={{ color: accentColor }}>
                        {state.ageMin}–{state.ageMax} Jahre
                      </span>
                    </div>
                    <Slider.Root
                      min={0} max={80} step={1}
                      value={[state.ageMin, state.ageMax]}
                      onValueChange={([min, max]) => {
                        if (min !== undefined && max !== undefined) patch({ ageMin: min, ageMax: max })
                      }}
                      className="relative flex items-center h-5 w-full"
                    >
                      <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-[#E4E4E7]">
                        <Slider.Range className="absolute h-full rounded-full" style={{ background: accentColor }} />
                      </Slider.Track>
                      <Slider.Thumb className="block h-4 w-4 rounded-full border-2 bg-white shadow focus:outline-none" style={{ borderColor: accentColor }} />
                      <Slider.Thumb className="block h-4 w-4 rounded-full border-2 bg-white shadow focus:outline-none" style={{ borderColor: accentColor }} />
                    </Slider.Root>
                  </div>

                  {/* Niveau */}
                  <div className="flex flex-col gap-2">
                    <Label.Root className="text-sm font-medium text-[#0A0A0A]">Niveau</Label.Root>
                    <div className="grid grid-cols-2 gap-2">
                      {NIVEAU_OPTIONS.map((opt) => {
                        const sel = state.niveau === opt.value
                        return (
                          <button key={opt.value} type="button" onClick={() => patch({ niveau: opt.value })}
                            className="flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all"
                            style={sel ? { borderColor: accentColor, background: `linear-gradient(135deg, ${sport.light}, white)` } : { borderColor: '#E4E4E7', background: 'white' }}
                          >
                            <span className="text-sm font-semibold" style={{ color: sel ? accentColor : '#0A0A0A' }}>{opt.label}</span>
                            <span className="text-xs text-[#71717A] mt-0.5">{opt.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sport-spezifische Details */}
                  {state.sportSlug !== '' && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">{SPORT_CONFIG[state.sportSlug].label}-Details</p>
                      {state.sportSlug === 'fussball' && <FussballDetailsPanel state={state} dispatch={dispatch} accentColor={accentColor} />}
                      {state.sportSlug === 'tennis' && <TennisDetailsPanel state={state} dispatch={dispatch} accentColor={accentColor} />}
                      {state.sportSlug === 'basketball' && <BasketballDetailsPanel state={state} dispatch={dispatch} accentColor={accentColor} />}
                    </>
                  )}
                </div>
              )}

              {/* ══ STEP 3 ══════════════════════════════════════════ */}
              {state.step === 3 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-4">Veranstalter</p>
                    <div className="space-y-4">
                      <FieldInput label="Name des Veranstalters / Vereins">
                        <input type="text" value={state.veranstalterName} onChange={(e) => patch({ veranstalterName: e.target.value })} placeholder="z.B. TSV Musterstadt e.V." className={inputCls()} />
                      </FieldInput>
                      <FieldInput label="E-Mail des Veranstalters">
                        <input type="email" value={state.veranstalterEmail} onChange={(e) => patch({ veranstalterEmail: e.target.value })} placeholder="info@veranstalter.de" className={inputCls()} />
                      </FieldInput>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Telefon" optional>
                          <input type="tel" value={state.veranstalterTelefon} onChange={(e) => patch({ veranstalterTelefon: e.target.value })} placeholder="+49 69 …" className={inputCls()} />
                        </FieldInput>
                        <FieldInput label="Website" optional>
                          <input type="url" value={state.veranstalterWebsite} onChange={(e) => patch({ veranstalterWebsite: e.target.value })} placeholder="https://..." className={inputCls()} />
                        </FieldInput>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E4E4E7]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-4">Einreicher (du)</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Vorname">
                          <input type="text" value={state.einreicherVorname} onChange={(e) => patch({ einreicherVorname: e.target.value })} placeholder="Max" className={inputCls()} />
                        </FieldInput>
                        <FieldInput label="Nachname">
                          <input type="text" value={state.einreicherNachname} onChange={(e) => patch({ einreicherNachname: e.target.value })} placeholder="Mustermann" className={inputCls()} />
                        </FieldInput>
                      </div>
                      <FieldInput label="Deine E-Mail (für Bestätigung)">
                        <input type="email" value={state.einreicherEmail} onChange={(e) => patch({ einreicherEmail: e.target.value })} placeholder="deine@email.de" className={inputCls()} />
                      </FieldInput>
                    </div>
                  </div>

                  {/* Checkboxen */}
                  <div className="space-y-3 pt-2 border-t border-[#E4E4E7]">
                    {[
                      { key: 'korrektheitscheck' as const, label: 'Die eingetragenen Informationen sind nach meinem besten Wissen korrekt.' },
                      { key: 'datenschutzcheck' as const, label: 'Ich habe die Datenschutzerklärung gelesen und stimme der Verarbeitung meiner Daten zu.' },
                      { key: 'veranstalterCheck' as const, label: 'Ich bin berechtigt, dieses Turnier im Namen des Veranstalters einzutragen.' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-start gap-3">
                        <Checkbox.Root
                          checked={state[key]}
                          onCheckedChange={(v) => patch({ [key]: v === true })}
                          className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-[#E4E4E7] bg-white focus:outline-none data-[state=checked]:border-transparent"
                          style={{ '--sport-primary': accentColor } as React.CSSProperties}
                          id={key}
                        >
                          <Checkbox.Indicator>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                              <path d="M2 5l2.5 2.5L8 2.5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <label htmlFor={key} className="text-sm text-[#52525B] leading-snug cursor-pointer">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ STEP 4 ══════════════════════════════════════════ */}
              {state.step === 4 && (
                <div className="space-y-6">
                  {/* Turnier-Preview */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-3">Vorschau</p>
                    <TurnierCard turnier={buildPreviewItem(state)} />
                  </div>

                  {/* Datum-Details Summary */}
                  <div className="p-4 rounded-xl bg-white border border-[#E4E4E7] space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">Details</p>
                    {[
                      { label: 'Datum', value: state.startDate && state.endDate ? `${new Date(state.startDate).toLocaleDateString('de-DE')} – ${new Date(state.endDate).toLocaleDateString('de-DE')}` : '–' },
                      { label: 'Format', value: state.format || '–' },
                      { label: 'Teilnehmer', value: state.maxParticipants ? `Max. ${state.maxParticipants}` : 'Unbegrenzt' },
                      { label: 'Startgeld', value: state.entryFee ? `${state.entryFee} €` : 'Kostenlos' },
                      { label: 'Altersklasse', value: `${state.ageMin}–${state.ageMax} Jahre` },
                      { label: 'Veranstalter', value: state.veranstalterName || '–' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-[#71717A]">{label}</span>
                        <span className="font-medium text-[#0A0A0A]">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Info-Box */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
                    <CalendarDays size={16} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#92400E]">Prüfung innerhalb 24–48 Stunden</p>
                      <p className="text-xs text-[#92400E] mt-0.5 leading-relaxed">
                        Wir prüfen alle Angaben manuell. Du erhältst eine Bestätigungs-E-Mail sobald dein Turnier live ist.
                      </p>
                    </div>
                  </div>

                  {/* KI-Hinweis */}
                  <p className="text-[10px] text-center text-[#A1A1AA]">
                    Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
                  </p>

                  {/* Error */}
                  {state.submitError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{state.submitError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={state.submitStatus === 'loading'}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
                  >
                    {state.submitStatus === 'loading' ? (
                      <><Loader2 size={16} className="animate-spin" /> Wird eingereicht…</>
                    ) : (
                      <><Send size={16} /> Turnier einreichen</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          <div className="mt-8 flex items-center justify-between gap-4">
            {state.step > 1 ? (
              <button type="button" onClick={() => goToStep((state.step - 1) as 1 | 2 | 3 | 4)} className="flex items-center gap-2 h-10 px-5 rounded-lg border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:border-[#A1A1AA] transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Zurück
              </button>
            ) : (
              <div />
            )}

            {state.step < 4 && (
              <button
                type="button"
                onClick={() => goToStep((state.step + 1) as 2 | 3 | 4)}
                disabled={
                  (state.step === 1 && !isStep1Valid(state)) ||
                  (state.step === 2 && !isStep2Valid(state)) ||
                  (state.step === 3 && !isStep3Valid(state))
                }
                className="flex items-center gap-2 h-10 px-6 rounded-lg text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: accentColor }}
              >
                Weiter
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
