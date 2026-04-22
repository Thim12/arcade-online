'use client'

// ─────────────────────────────────────────────────────────────────
// app/vereine/eintragen/VereinEintragenClient.tsx
// 4-Schritt-Formular: Verein bei SportRise eintragen
// ─────────────────────────────────────────────────────────────────

import { useReducer, useRef, useState, type Dispatch, type ComponentType, type ReactNode, type ChangeEvent, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Info,
  Upload,
  X,
  Send,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react'
import * as Select from '@radix-ui/react-select'
import * as Switch from '@radix-ui/react-switch'
import * as Checkbox from '@radix-ui/react-checkbox'
import * as Slider from '@radix-ui/react-slider'
import * as Label from '@radix-ui/react-label'
import { cn } from '@/lib/utils/cn'
import { VereinCard } from '@/components/vereine/VereinCard'
import type { VereinListItem } from '@/lib/types/verein'

// ── Types ──────────────────────────────────────────────────────────

type SportSlug = 'fussball' | 'tennis' | 'basketball'
type Niveau = 'ANFAENGER' | 'FORTGESCHRITTENE' | 'WETTKAMPF' | 'PROFI'
type PriceCat = 'kostenlos' | 'guenstig' | 'mittel' | 'premium'

interface FussballVereinDetails {
  ligaName: string
  staffel: string
  altersklassen: string[]
  trainingszeiten: string
  naturrasen: boolean
  kunstrasen: boolean
  halle: boolean
  jugendfoerderung: boolean
  trainerInfo: string
  besonderheit: string
}

interface TennisVereinDetails {
  anzahlSandplaetze: number
  anzahlHartplaetze: number
  anzahlHallenplaetze: number
  platzBeschreibung: string
  doppel: boolean
  vereinsmeisterschaften: boolean
  lkTurniere: boolean
  medenspiel: boolean
  trainerstunden: boolean
  trainerInfo: string
  altersgruppen: string[]
  besonderheit: string
}

interface BasketballVereinDetails {
  ligaName: string
  trainingszeiten: string
  hallenName: string
  hallenAdresse: string
  anzahlKoerbe: number
  teamJugend: boolean
  teamDamen: boolean
  teamHerren: boolean
  teamDreiXdrei: boolean
  trainerInfo: string
  besonderheit: string
}

interface FormState {
  step: 1 | 2 | 3 | 4
  // Step 1
  vereinsname: string
  sportSlug: SportSlug | ''
  strasse: string
  hausnummer: string
  plz: string
  stadt: string
  bundesland: string
  website: string
  vereinEmail: string
  telefon: string
  // Step 2
  beschreibung: string
  niveau: Niveau | ''
  priceCategory: PriceCat | ''
  ageMin: number
  ageMax: number
  fussball: FussballVereinDetails
  tennis: TennisVereinDetails
  basketball: BasketballVereinDetails
  // Step 3
  logoBase64: string | null
  logoMimeType: string | null
  einreicherVorname: string
  einreicherNachname: string
  einreicherEmail: string
  einreicherTel: string
  korrektheitscheck: boolean
  datenschutzcheck: boolean
  // Submit
  submitStatus: 'idle' | 'loading' | 'error'
  submitError: string | null
}

type Action =
  | { type: 'PATCH'; payload: Partial<Omit<FormState, 'fussball' | 'tennis' | 'basketball'>> }
  | { type: 'PATCH_FUSSBALL'; payload: Partial<FussballVereinDetails> }
  | { type: 'PATCH_TENNIS'; payload: Partial<TennisVereinDetails> }
  | { type: 'PATCH_BASKETBALL'; payload: Partial<BasketballVereinDetails> }
  | { type: 'TOGGLE_ALTERSKLASSE'; payload: string }
  | { type: 'TOGGLE_ALTERSGRUPPE'; payload: string }

// ── Reducer ────────────────────────────────────────────────────────

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
    case 'TOGGLE_ALTERSKLASSE': {
      const ak = action.payload
      const cur = state.fussball.altersklassen
      return {
        ...state,
        fussball: {
          ...state.fussball,
          altersklassen: cur.includes(ak) ? cur.filter((x) => x !== ak) : [...cur, ak],
        },
      }
    }
    case 'TOGGLE_ALTERSGRUPPE': {
      const ag = action.payload
      const cur = state.tennis.altersgruppen
      return {
        ...state,
        tennis: {
          ...state.tennis,
          altersgruppen: cur.includes(ag) ? cur.filter((x) => x !== ag) : [...cur, ag],
        },
      }
    }
  }
}

// ── Constants ──────────────────────────────────────────────────────

const SPORT_CONFIG: Record<SportSlug, { label: string; primary: string; light: string; glow: string }> = {
  fussball: { label: 'Fußball', primary: '#16A34A', light: '#DCFCE7', glow: 'rgba(22,163,74,0.35)' },
  tennis:   { label: 'Tennis',  primary: '#C2621A', light: '#FFEDD5', glow: 'rgba(194,98,26,0.35)' },
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

const NIVEAU_OPTIONS: { value: Niveau; label: string; desc: string }[] = [
  { value: 'ANFAENGER',       label: 'Anfänger',       desc: 'Einsteiger willkommen' },
  { value: 'FORTGESCHRITTENE', label: 'Fortgeschrittene', desc: 'Grundkenntnisse erwünscht' },
  { value: 'WETTKAMPF',       label: 'Wettkampf',      desc: 'Regelmäßige Ligaspiele' },
  { value: 'PROFI',           label: 'Profi',          desc: 'Höchstes Niveau' },
]

const PRICE_OPTIONS: { value: PriceCat; label: string; desc: string }[] = [
  { value: 'kostenlos', label: 'Kostenlos', desc: '0 €/Monat' },
  { value: 'guenstig',  label: 'Günstig',   desc: '< 30 €/Monat' },
  { value: 'mittel',    label: 'Mittel',    desc: '30 – 60 €/Monat' },
  { value: 'premium',   label: 'Premium',   desc: '> 60 €/Monat' },
]

const FUSSBALL_ALTERSKLASSEN = [
  'U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','U21',
  'Herren','Damen','Senioren',
]

const TENNIS_ALTERSGRUPPEN = ['Jugend', 'Erwachsene', 'Senioren']

const BESCHREIBUNG_PLACEHOLDER: Record<SportSlug, string> = {
  fussball:   'z.B.: Der TSV Musterstadt wurde 1923 gegründet. Wir bieten Fußball für alle Altersklassen von der U7 bis zu den Senioren. Trainiert wird dienstags und donnerstags...',
  tennis:     'z.B.: Der TC Musterstadt verfügt über 6 Sandplätze und 2 Hallenplätze. Mit über 200 Mitgliedern sind wir einer der größten Tennisvereine der Region...',
  basketball: 'z.B.: Der Basketball-Club Musterstadt spielt seit 1985 in Hessen. Mit unseren Herren-, Damen- und Jugend-Teams bieten wir Basketball auf allen Niveaus...',
}

const PRICE_TO_FEE: Record<PriceCat, number> = {
  kostenlos: 0,
  guenstig:  20,
  mittel:    45,
  premium:   80,
}

const INITIAL_FUSSBALL: FussballVereinDetails = {
  ligaName: '', staffel: '', altersklassen: [], trainingszeiten: '',
  naturrasen: false, kunstrasen: false, halle: false,
  jugendfoerderung: false, trainerInfo: '', besonderheit: '',
}

const INITIAL_TENNIS: TennisVereinDetails = {
  anzahlSandplaetze: 0, anzahlHartplaetze: 0, anzahlHallenplaetze: 0,
  platzBeschreibung: '', doppel: false, vereinsmeisterschaften: false,
  lkTurniere: false, medenspiel: false, trainerstunden: false,
  trainerInfo: '', altersgruppen: [], besonderheit: '',
}

const INITIAL_BASKETBALL: BasketballVereinDetails = {
  ligaName: '', trainingszeiten: '', hallenName: '', hallenAdresse: '',
  anzahlKoerbe: 2, teamJugend: false, teamDamen: false,
  teamHerren: false, teamDreiXdrei: false, trainerInfo: '', besonderheit: '',
}

const INITIAL_STATE: FormState = {
  step: 1,
  vereinsname: '', sportSlug: '', strasse: '', hausnummer: '',
  plz: '', stadt: '', bundesland: '', website: '', vereinEmail: '', telefon: '',
  beschreibung: '', niveau: '', priceCategory: '', ageMin: 6, ageMax: 60,
  fussball: INITIAL_FUSSBALL, tennis: INITIAL_TENNIS, basketball: INITIAL_BASKETBALL,
  logoBase64: null, logoMimeType: null,
  einreicherVorname: '', einreicherNachname: '', einreicherEmail: '', einreicherTel: '',
  korrektheitscheck: false, datenschutzcheck: false,
  submitStatus: 'idle', submitError: null,
}

// ── Sport SVGs ─────────────────────────────────────────────────────

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

const SPORT_ICONS: Record<SportSlug, ComponentType<{ size?: number }>> = {
  fussball: FussballSVG,
  tennis: TennisSVG,
  basketball: BasketballSVG,
}

// ── Helper Components ──────────────────────────────────────────────

function FieldInput({
  label,
  optional,
  children,
}: {
  label: string
  optional?: boolean
  children: ReactNode
}) {
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

function SportSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
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
function BundeslandSelect({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (v: string) => void
}) {
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
            {/* Hessen – hervorgehoben */}
            <Select.Item
              value="HESSEN"
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-[#F0FDF4] focus:bg-[#F0FDF4] data-[state=checked]:font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] flex-shrink-0" />
              <Select.ItemText>Hessen (aktuell verfügbar)</Select.ItemText>
            </Select.Item>
            <Select.Separator className="h-px bg-[#E4E4E7] my-1" />
            {BUNDESLAENDER.filter((b) => !b.available).map((bl) => (
              <Select.Item
                key={bl.value}
                value={bl.value}
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-[#71717A] outline-none hover:bg-[#F4F4F5] focus:bg-[#F4F4F5]"
              >
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

// ── Step Validation ─────────────────────────────────────────────────

function isStep1Valid(s: FormState): boolean {
  return (
    s.vereinsname.trim().length > 0 &&
    s.sportSlug !== '' &&
    s.strasse.trim().length > 0 &&
    s.hausnummer.trim().length > 0 &&
    s.plz.trim().length === 5 &&
    s.stadt.trim().length > 0 &&
    s.bundesland !== ''
  )
}

function isStep2Valid(s: FormState): boolean {
  return (
    s.beschreibung.length >= 50 &&
    s.beschreibung.length <= 1500 &&
    s.niveau !== '' &&
    s.priceCategory !== ''
  )
}

function isStep3Valid(s: FormState): boolean {
  return (
    s.einreicherVorname.trim().length > 0 &&
    s.einreicherNachname.trim().length > 0 &&
    s.einreicherEmail.trim().length > 0 &&
    s.korrektheitscheck &&
    s.datenschutzcheck
  )
}

// ── Build preview VereinListItem ────────────────────────────────────

function buildPreviewItem(state: FormState): VereinListItem {
  const slug = state.sportSlug || 'fussball'
  const cfg = SPORT_CONFIG[slug as SportSlug]

  const hasYouthTeam =
    slug === 'fussball'
      ? state.fussball.altersklassen.some((k) => k.startsWith('U'))
      : slug === 'tennis'
        ? state.tennis.altersgruppen.includes('Jugend')
        : state.basketball.teamJugend

  return {
    id: 'preview',
    name: state.vereinsname || 'Vereinsname',
    slug: 'preview',
    description: state.beschreibung || null,
    address: `${state.strasse} ${state.hausnummer}`.trim() || 'Musterstraße 1',
    city: state.stadt || 'Musterstadt',
    postalCode: state.plz || '00000',
    latitude: null,
    longitude: null,
    website: state.website || null,
    phone: state.telefon || null,
    logoUrl: null,
    monthlyFee: state.priceCategory !== '' ? (PRICE_TO_FEE[state.priceCategory] ?? null) : null,
    hasYouthTeam,
    ageMin: state.ageMin,
    ageMax: state.ageMax,
    isVerified: false,
    verifiedAt: null,
    details: null,
    sport: {
      id: slug,
      name: cfg.label,
      slug,
      colorPrimary: cfg.primary,
      colorLight: cfg.light,
      colorGlow: cfg.glow,
      iconName: 'Trophy',
    },
    _followCount: 0,
    distanceKm: null,
  }
}

// ── Fußball Details Panel ───────────────────────────────────────────

function FussballDetailsPanel({
  state,
  dispatch,
  accentColor,
}: {
  state: FormState
  dispatch: Dispatch<Action>
  accentColor: string
}) {
  const fb = state.fussball
  const patch = (p: Partial<FussballVereinDetails>) => dispatch({ type: 'PATCH_FUSSBALL', payload: p })

  return (
    <div className="space-y-5 pt-4 border-t border-[#E4E4E7] mt-4">
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Liga-Name" optional>
          <input
            type="text"
            value={fb.ligaName}
            onChange={(e) => patch({ ligaName: e.target.value })}
            placeholder="z.B. Kreisliga A"
            className={inputCls()}
          />
        </FieldInput>
        <FieldInput label="Staffel" optional>
          <input
            type="text"
            value={fb.staffel}
            onChange={(e) => patch({ staffel: e.target.value })}
            placeholder="z.B. Gruppe 3"
            className={inputCls()}
          />
        </FieldInput>
      </div>

      {/* Altersklassen */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">
          Altersklassen <span className="text-[#A1A1AA] font-normal">(optional)</span>
        </Label.Root>
        <div className="flex flex-wrap gap-1.5">
          {FUSSBALL_ALTERSKLASSEN.map((ak) => {
            const sel = fb.altersklassen.includes(ak)
            return (
              <button
                key={ak}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_ALTERSKLASSE', payload: ak })}
                className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                style={
                  sel
                    ? { background: accentColor, color: 'white', borderColor: accentColor }
                    : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }
                }
              >
                {ak}
              </button>
            )
          })}
        </div>
      </div>

      {/* Trainingszeiten */}
      <FieldInput label="Trainingszeiten" optional>
        <textarea
          value={fb.trainingszeiten}
          onChange={(e) => patch({ trainingszeiten: e.target.value })}
          placeholder="z.B. Di. 18–20 Uhr, Do. 18–20 Uhr, Sa. 10–12 Uhr"
          rows={2}
          className="px-3 py-2 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[var(--sport-primary,#16A34A)]/30 focus:border-[var(--sport-primary,#16A34A)] transition-colors w-full resize-none"
        />
      </FieldInput>

      {/* Spielflächen */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Spielflächen</Label.Root>
        {(
          [
            { key: 'naturrasen', label: 'Naturrasen' },
            { key: 'kunstrasen', label: 'Kunstrasen' },
            { key: 'halle', label: 'Halle' },
          ] as { key: keyof Pick<FussballVereinDetails, 'naturrasen' | 'kunstrasen' | 'halle'>; label: string }[]
        ).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-[#52525B]">{label}</span>
            <SportSwitch checked={fb[key]} onCheckedChange={(v) => patch({ [key]: v })} />
          </div>
        ))}
      </div>

      {/* Jugendförderung */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0A0A0A]">Jugendförderung</p>
          <p className="text-xs text-[#71717A]">Aktive Förderung von Nachwuchsspielern</p>
        </div>
        <SportSwitch checked={fb.jugendfoerderung} onCheckedChange={(v) => patch({ jugendfoerderung: v })} />
      </div>

      <FieldInput label="Trainer-Info" optional>
        <input
          type="text"
          value={fb.trainerInfo}
          onChange={(e) => patch({ trainerInfo: e.target.value })}
          placeholder="z.B. Lizenzierter DFB-Trainer, Thomas Müller"
          className={inputCls()}
        />
      </FieldInput>

      <FieldInput label="Vereins-Besonderheit" optional>
        <input
          type="text"
          value={fb.besonderheit}
          onChange={(e) => patch({ besonderheit: e.target.value })}
          placeholder="z.B. Eigene Geschäftsstelle, Sportzentrum mit Umkleideräumen"
          className={inputCls()}
        />
      </FieldInput>
    </div>
  )
}

// ── Tennis Details Panel ────────────────────────────────────────────

function TennisDetailsPanel({
  state,
  dispatch,
  accentColor,
}: {
  state: FormState
  dispatch: Dispatch<Action>
  accentColor: string
}) {
  const tn = state.tennis
  const patch = (p: Partial<TennisVereinDetails>) => dispatch({ type: 'PATCH_TENNIS', payload: p })

  return (
    <div className="space-y-5 pt-4 border-t border-[#E4E4E7] mt-4">
      {/* Platzanzahl */}
      <div className="flex flex-col gap-1.5">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Anzahl Plätze</Label.Root>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: 'anzahlSandplaetze', label: 'Sand' },
              { key: 'anzahlHartplaetze', label: 'Hart' },
              { key: 'anzahlHallenplaetze', label: 'Halle' },
            ] as {
              key: keyof Pick<TennisVereinDetails, 'anzahlSandplaetze' | 'anzahlHartplaetze' | 'anzahlHallenplaetze'>
              label: string
            }[]
          ).map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-xs text-[#71717A] text-center">{label}</span>
              <input
                type="number"
                min={0}
                max={99}
                value={tn[key]}
                onChange={(e) => patch({ [key]: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className={cn(inputCls(), 'text-center')}
              />
            </div>
          ))}
        </div>
      </div>

      <FieldInput label="Platz-Beschreibung" optional>
        <input
          type="text"
          value={tn.platzBeschreibung}
          onChange={(e) => patch({ platzBeschreibung: e.target.value })}
          placeholder="z.B. 4 beleuchete Sandplätze, wettkampftauglich"
          className={inputCls()}
        />
      </FieldInput>

      {/* Feature-Switches */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Angebote & Aktivitäten</Label.Root>
        {(
          [
            { key: 'doppel', label: 'Doppel-Spielbetrieb' },
            { key: 'vereinsmeisterschaften', label: 'Vereinsmeisterschaften' },
            { key: 'lkTurniere', label: 'LK-Turniere' },
            { key: 'medenspiel', label: 'Medenspiel' },
            { key: 'trainerstunden', label: 'Trainerstunden buchbar' },
          ] as { key: keyof Pick<TennisVereinDetails, 'doppel' | 'vereinsmeisterschaften' | 'lkTurniere' | 'medenspiel' | 'trainerstunden'>; label: string }[]
        ).map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#52525B]">{label}</span>
              <SportSwitch checked={tn[key]} onCheckedChange={(v) => patch({ [key]: v })} />
            </div>
            {key === 'trainerstunden' && tn.trainerstunden && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2"
              >
                <input
                  type="text"
                  value={tn.trainerInfo}
                  onChange={(e) => patch({ trainerInfo: e.target.value })}
                  placeholder="Trainer-Info z.B. DTB-Lizenz, Max Mustermann"
                  className={cn(inputCls(), 'mt-1')}
                />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Altersgruppen */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">
          Altersgruppen <span className="text-[#A1A1AA] font-normal">(optional)</span>
        </Label.Root>
        <div className="flex gap-2">
          {TENNIS_ALTERSGRUPPEN.map((ag) => {
            const sel = tn.altersgruppen.includes(ag)
            return (
              <button
                key={ag}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_ALTERSGRUPPE', payload: ag })}
                className="flex-1 h-9 rounded-full border text-sm font-medium transition-all"
                style={
                  sel
                    ? { background: accentColor, color: 'white', borderColor: accentColor }
                    : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }
                }
              >
                {ag}
              </button>
            )
          })}
        </div>
      </div>

      <FieldInput label="Vereins-Besonderheit" optional>
        <input
          type="text"
          value={tn.besonderheit}
          onChange={(e) => patch({ besonderheit: e.target.value })}
          placeholder="z.B. Gepflegte Clubanlage mit Restaurant"
          className={inputCls()}
        />
      </FieldInput>
    </div>
  )
}

// ── Basketball Details Panel ────────────────────────────────────────

function BasketballDetailsPanel({
  state,
  dispatch,
  accentColor,
}: {
  state: FormState
  dispatch: Dispatch<Action>
  accentColor: string
}) {
  const bb = state.basketball
  const patch = (p: Partial<BasketballVereinDetails>) =>
    dispatch({ type: 'PATCH_BASKETBALL', payload: p })

  return (
    <div className="space-y-5 pt-4 border-t border-[#E4E4E7] mt-4">
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Liga-Name" optional>
          <input
            type="text"
            value={bb.ligaName}
            onChange={(e) => patch({ ligaName: e.target.value })}
            placeholder="z.B. Regionalliga"
            className={inputCls()}
          />
        </FieldInput>
        <FieldInput label="Anzahl Körbe">
          <input
            type="number"
            min={1}
            max={50}
            value={bb.anzahlKoerbe}
            onChange={(e) => patch({ anzahlKoerbe: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            className={inputCls()}
          />
        </FieldInput>
      </div>

      <FieldInput label="Trainingszeiten" optional>
        <textarea
          value={bb.trainingszeiten}
          onChange={(e) => patch({ trainingszeiten: e.target.value })}
          placeholder="z.B. Mo. + Mi. 19–21 Uhr"
          rows={2}
          className="px-3 py-2 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[var(--sport-primary,#16A34A)]/30 focus:border-[var(--sport-primary,#16A34A)] transition-colors w-full resize-none"
        />
      </FieldInput>

      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Hallen-Name" optional>
          <input
            type="text"
            value={bb.hallenName}
            onChange={(e) => patch({ hallenName: e.target.value })}
            placeholder="z.B. Sporthalle West"
            className={inputCls()}
          />
        </FieldInput>
        <FieldInput label="Hallen-Adresse" optional>
          <input
            type="text"
            value={bb.hallenAdresse}
            onChange={(e) => patch({ hallenAdresse: e.target.value })}
            placeholder="z.B. Musterstr. 12, 60313 Frankfurt"
            className={inputCls()}
          />
        </FieldInput>
      </div>

      {/* Teams */}
      <div className="flex flex-col gap-2">
        <Label.Root className="text-sm font-medium text-[#0A0A0A]">Teams</Label.Root>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { key: 'teamHerren', label: 'Herren' },
              { key: 'teamDamen', label: 'Damen' },
              { key: 'teamJugend', label: 'Jugend' },
              { key: 'teamDreiXdrei', label: '3×3' },
            ] as { key: keyof Pick<BasketballVereinDetails, 'teamHerren' | 'teamDamen' | 'teamJugend' | 'teamDreiXdrei'>; label: string }[]
          ).map(({ key, label }) => {
            const active = bb[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => patch({ [key]: !active })}
                className="h-10 rounded-lg border text-sm font-medium transition-all"
                style={
                  active
                    ? { background: accentColor, color: 'white', borderColor: accentColor }
                    : { background: 'white', color: '#52525B', borderColor: '#E4E4E7' }
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <FieldInput label="Trainer-Info" optional>
        <input
          type="text"
          value={bb.trainerInfo}
          onChange={(e) => patch({ trainerInfo: e.target.value })}
          placeholder="z.B. Lizenzierter DBB-Trainer"
          className={inputCls()}
        />
      </FieldInput>

      <FieldInput label="Vereins-Besonderheit" optional>
        <input
          type="text"
          value={bb.besonderheit}
          onChange={(e) => patch({ besonderheit: e.target.value })}
          placeholder="z.B. Modernes Trainingszentrum mit Videotechnik"
          className={inputCls()}
        />
      </FieldInput>
    </div>
  )
}

// ── Progress Stepper ────────────────────────────────────────────────

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
              <span
                className="text-[10px] font-medium whitespace-nowrap"
                style={{ color: isActive ? accentColor : isCompleted ? accentColor : '#A1A1AA' }}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 mb-4 transition-colors"
                style={{ background: num < step ? accentColor : '#E4E4E7' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Logo Upload ─────────────────────────────────────────────────────

function LogoUpload({
  base64,
  onUpload,
  onRemove,
}: {
  base64: string | null
  onUpload: (base64: string, mimeType: string) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // result is "data:image/png;base64,..."
      const [header, data] = result.split(',')
      const mime = header?.split(':')[1]?.split(';')[0] ?? 'image/png'
      onUpload(data ?? result, mime)
    }
    reader.readAsDataURL(file)
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <Label.Root className="text-sm font-medium text-[#0A0A0A]">
        Vereinslogo <span className="text-[#A1A1AA] font-normal">(optional)</span>
      </Label.Root>
      {base64 ? (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#E4E4E7]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${base64}`}
            alt="Logo Vorschau"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#0A0A0A]/70 flex items-center justify-center text-white"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
            dragging
              ? 'border-[var(--sport-primary,#16A34A)] bg-[var(--sport-primary,#16A34A)]/5'
              : 'border-[#E4E4E7] hover:border-[#A1A1AA] bg-[#FAFAFA]',
          )}
        >
          <Upload size={20} className="text-[#A1A1AA]" />
          <span className="text-xs text-[#71717A]">Bild hierher ziehen oder klicken</span>
          <span className="text-[10px] text-[#A1A1AA]">JPG, PNG, WebP · max. 5 MB</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────

export default function VereinEintragenClient() {
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
        vereinsname: state.vereinsname,
        sportSlug: state.sportSlug,
        strasse: state.strasse,
        hausnummer: state.hausnummer,
        plz: state.plz,
        stadt: state.stadt,
        bundesland: state.bundesland,
        website: state.website || undefined,
        vereinEmail: state.vereinEmail || undefined,
        telefon: state.telefon || undefined,
        beschreibung: state.beschreibung,
        niveau: state.niveau,
        priceCategory: state.priceCategory,
        ageMin: state.ageMin,
        ageMax: state.ageMax,
        sportDetails:
          state.sportSlug === 'fussball'
            ? state.fussball
            : state.sportSlug === 'tennis'
              ? state.tennis
              : state.basketball,
        logoBase64: state.logoBase64 || undefined,
        logoMimeType: state.logoMimeType || undefined,
        einreicherVorname: state.einreicherVorname,
        einreicherNachname: state.einreicherNachname,
        einreicherEmail: state.einreicherEmail,
        einreicherTel: state.einreicherTel || undefined,
      }
      const res = await fetch('/api/vereine/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Unbekannter Fehler')
      }
      router.push('/vereine/eintragen/success')
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

  return (
    <div data-sport={state.sportSlug || 'fussball'}>
      {/* ── Hero Header ── */}
      <div className="bg-white py-12 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=60)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.05,
          }}
        />
        <div className="absolute inset-0 bg-white/80 z-0" />
        <div className="max-w-xl mx-auto relative z-10">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Verein eintragen.</h1>
          <p className="mt-2 text-zinc-500 text-sm">
            Kostenlos · Geprüft innerhalb 24–48 Stunden · Für immer sichtbar.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Kostenlos', 'Kein Abo', 'Community-geprüft'].map((chip) => (
              <span
                key={chip}
                className="flex items-center gap-1 px-3 py-1 rounded-full border border-zinc-200 text-zinc-500 text-xs font-medium bg-white shadow-sm"
              >
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

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              {/* ══ STEP 1 ══════════════════════════════════════ */}
              {state.step === 1 && (
                <div className="space-y-6">
                  <FieldInput label="Vereinsname">
                    <input
                      type="text"
                      value={state.vereinsname}
                      onChange={(e) => patch({ vereinsname: e.target.value })}
                      placeholder="z.B. TSV Musterstadt 1923 e.V."
                      maxLength={120}
                      className={inputCls(!state.vereinsname.trim())}
                    />
                  </FieldInput>

                  {/* Sport-Wahl */}
                  <div className="flex flex-col gap-2">
                    <Label.Root className="text-sm font-medium text-[#0A0A0A]">Sportart</Label.Root>
                    <div className="grid grid-cols-3 gap-3">
                      {(['fussball', 'tennis', 'basketball'] as SportSlug[]).map((slug) => {
                        const cfg = SPORT_CONFIG[slug]
                        const Icon = SPORT_ICONS[slug]
                        const isSelected = state.sportSlug === slug
                        return (
                          <button
                            key={slug}
                            type="button"
                            onClick={() => patch({ sportSlug: slug })}
                            className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 transition-all"
                            style={
                              isSelected
                                ? {
                                    background: `linear-gradient(135deg, ${cfg.light}, white)`,
                                    borderColor: cfg.primary,
                                    color: cfg.primary,
                                    boxShadow: `0 0 0 3px ${cfg.glow}`,
                                  }
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
                        <input
                          type="text"
                          value={state.strasse}
                          onChange={(e) => patch({ strasse: e.target.value })}
                          placeholder="Musterstraße"
                          className={inputCls()}
                        />
                      </FieldInput>
                    </div>
                    <FieldInput label="Nr.">
                      <input
                        type="text"
                        value={state.hausnummer}
                        onChange={(e) => patch({ hausnummer: e.target.value })}
                        placeholder="12"
                        className={inputCls()}
                      />
                    </FieldInput>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput label="PLZ">
                      <input
                        type="text"
                        value={state.plz}
                        onChange={(e) => patch({ plz: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        placeholder="60313"
                        maxLength={5}
                        className={inputCls()}
                      />
                    </FieldInput>
                    <FieldInput label="Stadt">
                      <input
                        type="text"
                        value={state.stadt}
                        onChange={(e) => patch({ stadt: e.target.value })}
                        placeholder="Frankfurt"
                        className={inputCls()}
                      />
                    </FieldInput>
                  </div>

                  <FieldInput label="Bundesland">
                    <BundeslandSelect
                      value={state.bundesland}
                      onValueChange={(v) => patch({ bundesland: v })}
                    />
                    {state.bundesland && state.bundesland !== 'HESSEN' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 flex items-start gap-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-3"
                      >
                        <Info size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[#92400E] leading-relaxed">
                          Aktuell nur Hessen verfügbar. Wir expandieren bald bundesweit — trag deinen Verein schon jetzt ein!
                        </p>
                      </motion.div>
                    )}
                    {(!state.bundesland || state.bundesland === 'HESSEN') && (
                      <div className="mt-2 flex items-start gap-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-3">
                        <Info size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[#92400E] leading-relaxed">
                          Aktuell nur Hessen verfügbar. Wir expandieren bald bundesweit — trag deinen Verein schon jetzt ein!
                        </p>
                      </div>
                    )}
                  </FieldInput>

                  <div className="space-y-4 pt-2 border-t border-[#E4E4E7]">
                    <p className="text-xs font-medium text-[#71717A] uppercase tracking-wide">Kontaktdaten (optional)</p>
                    <FieldInput label="Website" optional>
                      <input
                        type="url"
                        value={state.website}
                        onChange={(e) => patch({ website: e.target.value })}
                        placeholder="https://www.meinverein.de"
                        className={inputCls()}
                      />
                    </FieldInput>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldInput label="E-Mail" optional>
                        <input
                          type="email"
                          value={state.vereinEmail}
                          onChange={(e) => patch({ vereinEmail: e.target.value })}
                          placeholder="info@meinverein.de"
                          className={inputCls()}
                        />
                      </FieldInput>
                      <FieldInput label="Telefon" optional>
                        <input
                          type="tel"
                          value={state.telefon}
                          onChange={(e) => patch({ telefon: e.target.value })}
                          placeholder="+49 69 …"
                          className={inputCls()}
                        />
                      </FieldInput>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ STEP 2 ══════════════════════════════════════ */}
              {state.step === 2 && (
                <div className="space-y-6">
                  {/* Beschreibung */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label.Root className="text-sm font-medium text-[#0A0A0A]">Beschreibung</Label.Root>
                      <span
                        className={cn(
                          'text-xs',
                          state.beschreibung.length < 50
                            ? 'text-[#EF4444]'
                            : state.beschreibung.length > 1400
                              ? 'text-[#F59E0B]'
                              : 'text-[#71717A]',
                        )}
                      >
                        {state.beschreibung.length} / 1500
                      </span>
                    </div>
                    <textarea
                      value={state.beschreibung}
                      onChange={(e) => patch({ beschreibung: e.target.value.slice(0, 1500) })}
                      placeholder={
                        state.sportSlug !== ''
                          ? BESCHREIBUNG_PLACEHOLDER[state.sportSlug]
                          : 'Beschreibe deinen Verein…'
                      }
                      rows={5}
                      className="px-3 py-2 rounded-lg border border-[#E4E4E7] text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[var(--sport-primary,#16A34A)]/30 focus:border-[var(--sport-primary,#16A34A)] transition-colors w-full resize-none"
                    />
                    {state.beschreibung.length > 0 && state.beschreibung.length < 50 && (
                      <p className="text-xs text-[#EF4444]">Mindestens 50 Zeichen erforderlich</p>
                    )}
                  </div>

                  {/* Leistungsniveau */}
                  <div className="flex flex-col gap-2">
                    <Label.Root className="text-sm font-medium text-[#0A0A0A]">Leistungsniveau</Label.Root>
                    <div className="grid grid-cols-2 gap-2">
                      {NIVEAU_OPTIONS.map((opt) => {
                        const sel = state.niveau === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => patch({ niveau: opt.value })}
                            className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border-2 text-left transition-all"
                            style={
                              sel
                                ? { borderColor: accentColor, background: `${sport.light}80` }
                                : { borderColor: '#E4E4E7', background: 'white' }
                            }
                          >
                            <span
                              className="text-sm font-semibold"
                              style={{ color: sel ? accentColor : '#0A0A0A' }}
                            >
                              {opt.label}
                            </span>
                            <span className="text-xs text-[#71717A]">{opt.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Monatsbeitrag */}
                  <div className="flex flex-col gap-2">
                    <Label.Root className="text-sm font-medium text-[#0A0A0A]">Monatsbeitrag</Label.Root>
                    <div className="grid grid-cols-2 gap-2">
                      {PRICE_OPTIONS.map((opt) => {
                        const sel = state.priceCategory === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => patch({ priceCategory: opt.value })}
                            className="flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border-2 text-left transition-all"
                            style={
                              sel
                                ? { borderColor: accentColor, background: `${sport.light}80` }
                                : { borderColor: '#E4E4E7', background: 'white' }
                            }
                          >
                            <span
                              className="text-sm font-semibold"
                              style={{ color: sel ? accentColor : '#0A0A0A' }}
                            >
                              {opt.label}
                            </span>
                            <span className="text-xs text-[#71717A]">{opt.desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Altersklasse Slider */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label.Root className="text-sm font-medium text-[#0A0A0A]">Altersklasse</Label.Root>
                      <span className="text-sm font-semibold" style={{ color: accentColor }}>
                        {state.ageMin}–{state.ageMax} Jahre
                      </span>
                    </div>
                    <Slider.Root
                      value={[state.ageMin, state.ageMax]}
                      onValueChange={([min, max]) => {
                        if (min !== undefined) patch({ ageMin: min })
                        if (max !== undefined) patch({ ageMax: max })
                      }}
                      min={0}
                      max={80}
                      step={1}
                      minStepsBetweenThumbs={2}
                      className="relative flex items-center w-full h-5 select-none touch-none"
                    >
                      <Slider.Track className="relative h-1.5 flex-1 rounded-full bg-[#E4E4E7]">
                        <Slider.Range className="absolute h-full rounded-full" style={{ background: accentColor }} />
                      </Slider.Track>
                      <Slider.Thumb
                        className="block w-4 h-4 rounded-full bg-white shadow focus:outline-none"
                        style={{ border: `2px solid ${accentColor}` }}
                        aria-label="Mindestalter"
                      />
                      <Slider.Thumb
                        className="block w-4 h-4 rounded-full bg-white shadow focus:outline-none"
                        style={{ border: `2px solid ${accentColor}` }}
                        aria-label="Höchstalter"
                      />
                    </Slider.Root>
                    <div className="flex justify-between text-xs text-[#A1A1AA]">
                      <span>0 Jahre</span>
                      <span>80 Jahre</span>
                    </div>
                  </div>

                  {/* Sport-spezifische Details */}
                  {state.sportSlug === 'fussball' && (
                    <FussballDetailsPanel state={state} dispatch={dispatch} accentColor={accentColor} />
                  )}
                  {state.sportSlug === 'tennis' && (
                    <TennisDetailsPanel state={state} dispatch={dispatch} accentColor={accentColor} />
                  )}
                  {state.sportSlug === 'basketball' && (
                    <BasketballDetailsPanel state={state} dispatch={dispatch} accentColor={accentColor} />
                  )}
                </div>
              )}

              {/* ══ STEP 3 ══════════════════════════════════════ */}
              {state.step === 3 && (
                <div className="space-y-6">
                  <LogoUpload
                    base64={state.logoBase64}
                    onUpload={(b64, mime) => patch({ logoBase64: b64, logoMimeType: mime })}
                    onRemove={() => patch({ logoBase64: null, logoMimeType: null })}
                  />

                  <div className="space-y-4 pt-4 border-t border-[#E4E4E7]">
                    <p className="text-sm font-semibold text-[#0A0A0A]">Einreicher</p>
                    <div className="grid grid-cols-2 gap-3">
                      <FieldInput label="Vorname">
                        <input
                          type="text"
                          value={state.einreicherVorname}
                          onChange={(e) => patch({ einreicherVorname: e.target.value })}
                          placeholder="Max"
                          className={inputCls()}
                        />
                      </FieldInput>
                      <FieldInput label="Nachname">
                        <input
                          type="text"
                          value={state.einreicherNachname}
                          onChange={(e) => patch({ einreicherNachname: e.target.value })}
                          placeholder="Mustermann"
                          className={inputCls()}
                        />
                      </FieldInput>
                    </div>
                    <FieldInput label="E-Mail">
                      <input
                        type="email"
                        value={state.einreicherEmail}
                        onChange={(e) => patch({ einreicherEmail: e.target.value })}
                        placeholder="max@muster.de"
                        className={inputCls()}
                      />
                    </FieldInput>
                    <FieldInput label="Telefon" optional>
                      <input
                        type="tel"
                        value={state.einreicherTel}
                        onChange={(e) => patch({ einreicherTel: e.target.value })}
                        placeholder="+49 171 …"
                        className={inputCls()}
                      />
                    </FieldInput>
                  </div>

                  {/* Checkboxen */}
                  <div className="space-y-3 pt-4 border-t border-[#E4E4E7]">
                    {[
                      {
                        key: 'korrektheitscheck' as const,
                        label: 'Ich bestätige, dass alle Angaben korrekt und vollständig sind und ich berechtigt bin, diesen Verein einzutragen.',
                      },
                      {
                        key: 'datenschutzcheck' as const,
                        label: 'Ich stimme der Verarbeitung der eingetragenen Daten gemäß DSGVO zu. Die Daten werden ausschließlich für das Vereinsverzeichnis auf SportRise.de genutzt.',
                      },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-start gap-3">
                        <Checkbox.Root
                          id={key}
                          checked={state[key]}
                          onCheckedChange={(checked) => patch({ [key]: checked === true })}
                          className="mt-0.5 w-5 h-5 rounded border border-[#E4E4E7] bg-white data-[state=checked]:bg-[var(--sport-primary,#16A34A)] data-[state=checked]:border-[var(--sport-primary,#16A34A)] transition-colors focus:outline-none flex-shrink-0"
                        >
                          <Checkbox.Indicator className="flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <Label.Root htmlFor={key} className="text-xs text-[#52525B] leading-relaxed cursor-pointer">
                          {label}
                        </Label.Root>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ STEP 4 ══════════════════════════════════════ */}
              {state.step === 4 && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-[#0A0A0A] mb-3">Vorschau deines Vereins</p>
                    <VereinCard verein={buildPreviewItem(state)} />
                  </div>

                  {/* Info-Box */}
                  <div className="flex items-start gap-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-4">
                    <Info size={16} className="text-[#D97706] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#92400E]">Prüfung in 24–48 Stunden</p>
                      <p className="text-xs text-[#B45309] mt-0.5">
                        Du bekommst eine Bestätigungs-E-Mail an{' '}
                        <strong>{state.einreicherEmail}</strong>, sobald der Verein freigeschaltet wurde.
                      </p>
                    </div>
                  </div>

                  {/* Submit error */}
                  {state.submitStatus === 'error' && state.submitError && (
                    <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{state.submitError}</p>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={state.submitStatus === 'loading'}
                    className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                      boxShadow: `0 4px 20px ${sport.glow}`,
                    }}
                  >
                    {state.submitStatus === 'loading' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Wird eingereicht…
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Verein einreichen
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          {state.step < 4 && (
            <div className={cn('mt-8 flex gap-3', state.step > 1 ? 'justify-between' : 'justify-end')}>
              {state.step > 1 && (
                <button
                  type="button"
                  onClick={() => goToStep((state.step - 1) as 1 | 2 | 3 | 4)}
                  className="flex items-center gap-1.5 px-5 h-11 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:border-[#A1A1AA] transition-colors"
                >
                  Zurück
                </button>
              )}
              <button
                type="button"
                disabled={
                  (state.step === 1 && !isStep1Valid(state)) ||
                  (state.step === 2 && !isStep2Valid(state)) ||
                  (state.step === 3 && !isStep3Valid(state))
                }
                onClick={() => goToStep((state.step + 1) as 1 | 2 | 3 | 4)}
                className="flex items-center gap-1.5 px-6 h-11 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{
                  background: accentColor,
                  boxShadow: `0 4px 16px ${sport.glow}`,
                }}
              >
                {state.step === 3 ? 'Zur Vorschau' : 'Weiter'}
              </button>
            </div>
          )}

          {state.step === 4 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="flex items-center gap-1.5 px-5 h-11 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:border-[#A1A1AA] transition-colors"
              >
                Zurück
              </button>
            </div>
          )}

          {/* KI-Hinweis */}
          <p className="mt-8 text-center text-[10px] text-[#A1A1AA]">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </p>
        </div>
      </div>
    </div>
  )
}
