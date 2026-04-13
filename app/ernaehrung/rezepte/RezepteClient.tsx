'use client'

// ─────────────────────────────────────────────────────────────────
// RezepteClient – Rezept-Bibliothek
//
// Features:
//  • 2–3 Spalten Masonry-ähnliches Grid
//  • Kategorie-Farbstreifen oben
//  • Nährwert-Chips, Dauer, Schwierigkeitsgrad
//  • Klick → Detailansicht (Radix Dialog)
//  • Filter: Mahlzeitentyp, Max-Zeit, Vegetarisch, Vegan
//  • Suche über Name
// ─────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import * as Switch from '@radix-ui/react-switch'
import {
  Search, X, Clock, ChefHat, Utensils,
  Sunrise, Sun, Sunset, Coffee, MapPin,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

export type MahlzeitTyp = 'FRUEHSTUECK' | 'MITTAGESSEN' | 'ABENDESSEN' | 'SNACK'

export interface Rezept {
  id:                 string
  name:               string
  mahlzeitTyp:        MahlzeitTyp
  kalorien:           number
  proteinG:           number
  kohlenhydrateG:     number
  fettG:              number
  zubereitungMin:     number
  schwierigkeitsgrad: 'Einfach' | 'Mittel' | 'Fortgeschritten'
  zubereitung:        string
  zutaten:            string[]
  planTitel:          string
  isVegetarisch:      boolean
  isVegan:            boolean
}

interface RezepteClientProps {
  rezepte: Rezept[]
}

// ─────────────────────────────────────────────────────────────────
// Konfig
// ─────────────────────────────────────────────────────────────────

const MEAL_COLORS: Record<MahlzeitTyp, string> = {
  FRUEHSTUECK: '#16A34A',
  MITTAGESSEN: '#F97316',
  ABENDESSEN:  '#3B82F6',
  SNACK:       '#EAB308',
}

const MEAL_LABELS: Record<MahlzeitTyp, string> = {
  FRUEHSTUECK: 'Frühstück',
  MITTAGESSEN: 'Mittagessen',
  ABENDESSEN:  'Abendessen',
  SNACK:       'Snack',
}

const MEAL_ICONS: Record<MahlzeitTyp, typeof Sunrise> = {
  FRUEHSTUECK: Sunrise,
  MITTAGESSEN: Sun,
  ABENDESSEN:  Sunset,
  SNACK:       Coffee,
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Einfach:         'text-green-400',
  Mittel:          'text-yellow-400',
  Fortgeschritten: 'text-orange-400',
}

const MAX_ZEITEN_OPTIONEN = [
  { label: 'Alle',    value: Infinity },
  { label: '≤ 15 min', value: 15 },
  { label: '≤ 30 min', value: 30 },
  { label: '≤ 45 min', value: 45 },
]

// ─────────────────────────────────────────────────────────────────
// Rezept-Karte
// ─────────────────────────────────────────────────────────────────

interface RezeptKarteProps {
  rezept:   Rezept
  onClick:  () => void
  index:    number
}

function RezeptKarte({ rezept, onClick, index }: RezeptKarteProps) {
  const color     = MEAL_COLORS[rezept.mahlzeitTyp]
  const Icon      = MEAL_ICONS[rezept.mahlzeitTyp]

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="w-full text-left bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#D1D5DB] transition-all group"
    >
      {/* Kategorie-Farbstreifen */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      <div className="p-4 flex flex-col gap-2.5">
        {/* Mahlzeit-Typ Badge */}
        <div className="flex items-center gap-1.5">
          <Icon size={12} style={{ color }} />
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
            {MEAL_LABELS[rezept.mahlzeitTyp]}
          </span>
        </div>

        {/* Rezeptname */}
        <p className="text-sm font-semibold text-[#111827] leading-tight line-clamp-2 group-hover:text-[#16A34A] transition-colors">
          {rezept.name}
        </p>

        {/* Nährwert-Chips */}
        <div className="flex flex-wrap gap-1">
          <span className="px-1.5 py-0.5 bg-[#F9FAFB] border border-[#E4E4E7] rounded-md text-[10px] text-[#374151] font-medium">
            {rezept.kalorien} kcal
          </span>
          <span className="px-1.5 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-md text-[10px] text-[#1D4ED8] font-medium">
            P {rezept.proteinG}g
          </span>
          <span className="px-1.5 py-0.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-md text-[10px] text-[#C2410C] font-medium">
            K {rezept.kohlenhydrateG}g
          </span>
          <span className="px-1.5 py-0.5 bg-[#FEFCE8] border border-[#FDE68A] rounded-md text-[10px] text-[#92400E] font-medium">
            F {rezept.fettG}g
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {rezept.zubereitungMin} Min
          </span>
          <span className={`flex items-center gap-1 ${DIFFICULTY_COLORS[rezept.schwierigkeitsgrad]}`}>
            <ChefHat size={11} />
            {rezept.schwierigkeitsgrad}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────────
// Rezept-Detail Dialog
// ─────────────────────────────────────────────────────────────────

function RezeptDetail({ rezept, onClose }: { rezept: Rezept; onClose: () => void }) {
  const color = MEAL_COLORS[rezept.mahlzeitTyp]
  const Icon  = MEAL_ICONS[rezept.mahlzeitTyp]

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
      <Dialog.Content
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[90vh] flex flex-col outline-none"
        onInteractOutside={onClose}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Kategorie-Streifen */}
        <div className="h-1 mx-4 rounded-full shrink-0" style={{ backgroundColor: color }} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={13} style={{ color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
                {MEAL_LABELS[rezept.mahlzeitTyp]}
              </span>
            </div>
            <Dialog.Title className="text-base font-bold text-[#111827] leading-tight">
              {rezept.name}
            </Dialog.Title>
            <p className="text-xs text-[#6B7280] mt-0.5">Aus: {rezept.planTitel}</p>
          </div>
          <Dialog.Close asChild>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
        </div>

        {/* Content scrollbar */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Nährwerte */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: 'Kalorien',    value: `${rezept.kalorien}`,       unit: 'kcal', bg: '#F9FAFB', border: '#E4E4E7', text: '#111827' },
              { label: 'Protein',     value: `${rezept.proteinG}`,        unit: 'g',    bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
              { label: 'Kohlenhydr.', value: `${rezept.kohlenhydrateG}`,  unit: 'g',    bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
              { label: 'Fett',        value: `${rezept.fettG}`,           unit: 'g',    bg: '#FEFCE8', border: '#FDE68A', text: '#92400E' },
            ].map(({ label, value, unit, bg, border, text }) => (
              <div
                key={label}
                className="flex flex-col items-center p-2.5 rounded-xl border text-center"
                style={{ backgroundColor: bg, borderColor: border }}
              >
                <span className="text-sm font-bold tabular-nums" style={{ color: text }}>{value}</span>
                <span className="text-[9px] text-gray-500">{unit}</span>
                <span className="text-[9px] text-gray-400 mt-0.5">{label}</span>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-5 text-sm text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {rezept.zubereitungMin} Minuten
            </span>
            <span className={`flex items-center gap-1.5 ${DIFFICULTY_COLORS[rezept.schwierigkeitsgrad]}`}>
              <ChefHat size={14} />
              {rezept.schwierigkeitsgrad}
            </span>
          </div>

          {/* Zubereitung */}
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-2">Zubereitung</h3>
            <p className="text-sm text-[#374151] leading-relaxed">{rezept.zubereitung}</p>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Komponente
// ─────────────────────────────────────────────────────────────────

export function RezepteClient({ rezepte }: RezepteClientProps) {
  const [query,           setQuery]           = useState('')
  const [filterTyp,       setFilterTyp]       = useState<MahlzeitTyp | 'ALLE'>('ALLE')
  const [maxZeit,         setMaxZeit]         = useState<number>(Infinity)
  const [nurVegetarisch,  setNurVegetarisch]  = useState(false)
  const [nurVegan,        setNurVegan]        = useState(false)
  const [selectedRezept,  setSelectedRezept]  = useState<Rezept | null>(null)

  // Filter + Suche
  const gefiltert = useMemo(() => {
    return rezepte.filter((r) => {
      if (filterTyp !== 'ALLE' && r.mahlzeitTyp !== filterTyp) return false
      if (r.zubereitungMin > maxZeit) return false
      if (query.trim() && !r.name.toLowerCase().includes(query.toLowerCase())) return false
      if (nurVegan        && !r.isVegan)        return false
      if (nurVegetarisch  && !r.isVegetarisch)  return false
      return true
    })
  }, [rezepte, filterTyp, maxZeit, nurVegetarisch, nurVegan, query])

  return (
    <div className="min-h-screen bg-[#F8F9FA]">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#0A0A0A]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80)',
            opacity: 0.08,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A2218] via-[#0A1810] to-[#0A0A0A]" />
        <div className="relative px-4 pt-8 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Utensils size={20} className="text-[#16A34A]" />
            <h1 className="text-2xl font-bold text-white">Rezept-Bibliothek</h1>
          </div>
          <p className="text-sm text-gray-400">
            {rezepte.length} Rezepte aus deinen KI-Ernährungsplänen
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <MapPin size={12} className="text-[#16A34A]" />
            <span className="text-[11px] text-gray-500">Jetzt in Hessen · Bald deutschlandweit</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-32 pt-4 flex flex-col gap-4">

        {/* ── SUCHZEILE ──────────────────────────────────────── */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rezepte durchsuchen …"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E4E4E7] rounded-xl text-sm text-[#111827] placeholder-gray-400 focus:outline-none focus:border-[#16A34A]/50 transition-all shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── FILTER ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Mahlzeitentyp-Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['ALLE', 'FRUEHSTUECK', 'MITTAGESSEN', 'ABENDESSEN', 'SNACK'] as const).map((typ) => {
              const isActive = filterTyp === typ
              const color    = typ === 'ALLE' ? '#6B7280' : MEAL_COLORS[typ]
              const label    = typ === 'ALLE' ? 'Alle' : MEAL_LABELS[typ]
              return (
                <button
                  key={typ}
                  onClick={() => setFilterTyp(typ)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isActive
                      ? 'text-white border-transparent'
                      : 'bg-white border-[#E4E4E7] text-[#374151] hover:border-gray-300'
                  }`}
                  style={isActive ? { backgroundColor: color, borderColor: color } : {}}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Zeit-Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {MAX_ZEITEN_OPTIONEN.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setMaxZeit(value)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  maxZeit === value
                    ? 'bg-[#111827] text-white border-[#111827]'
                    : 'bg-white border-[#E4E4E7] text-[#374151] hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Vegetarisch / Vegan Toggles */}
          <div className="flex gap-3 flex-wrap">
            {([
              {
                label:    'Vegetarisch',
                checked:  nurVegetarisch,
                onChange: (v: boolean) => {
                  setNurVegetarisch(v)
                  if (!v) setNurVegan(false)
                },
              },
              {
                label:    'Vegan',
                checked:  nurVegan,
                onChange: (v: boolean) => {
                  setNurVegan(v)
                  if (v) setNurVegetarisch(true)
                },
              },
            ]).map(({ label, checked, onChange }) => (
              <div key={label} className="flex items-center gap-2">
                <Switch.Root
                  checked={checked}
                  onCheckedChange={onChange}
                  className={`w-9 h-5 rounded-full transition-colors outline-none border ${
                    checked
                      ? 'bg-[#16A34A] border-[#16A34A]'
                      : 'bg-white border-[#D1D5DB]'
                  }`}
                >
                  <Switch.Thumb
                    className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
                      checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    }`}
                    style={checked ? {} : { backgroundColor: '#9CA3AF' }}
                  />
                </Switch.Root>
                <span className={`text-xs font-medium ${checked ? 'text-[#16A34A]' : 'text-[#6B7280]'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── REZEPT-GRID ────────────────────────────────────── */}
        {rezepte.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Utensils size={36} className="text-gray-300 mb-3" />
            <p className="text-base font-semibold text-[#374151]">Noch keine Rezepte</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Erstelle zuerst einen KI-Ernährungsplan, damit hier Rezepte erscheinen.
            </p>
          </div>
        ) : gefiltert.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search size={28} className="text-gray-300 mb-2" />
            <p className="text-sm text-[#374151]">Keine Rezepte für diese Filter.</p>
          </div>
        ) : (
          <div className="columns-2 gap-3">
            <AnimatePresence>
              {gefiltert.map((rezept, i) => (
                <div key={rezept.id} className="break-inside-avoid mb-3">
                  <RezeptKarte
                    rezept={rezept}
                    index={i}
                    onClick={() => setSelectedRezept(rezept)}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── BALD VERFÜGBAR ─────────────────────────────────── */}
        <div className="mt-4 p-4 bg-white border border-[#E4E4E7] rounded-2xl text-center">
          <p className="text-sm font-semibold text-[#374151]">Bald verfügbar</p>
          <p className="text-xs text-gray-400 mt-1">
            Wöchentlich neue Rezepte · Einkaufslisten-Export · Portionsrechner
          </p>
          <p className="text-[10px] text-gray-400 mt-2 flex items-center justify-center gap-1">
            <MapPin size={10} />
            Jetzt in Hessen · Bald deutschlandweit
          </p>
        </div>

        <p className="text-center text-[10px] text-gray-400">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </p>

      </div>

      {/* ── DETAIL DIALOG ────────────────────────────────────── */}
      <Dialog.Root
        open={selectedRezept !== null}
        onOpenChange={(v) => { if (!v) setSelectedRezept(null) }}
      >
        {selectedRezept && (
          <RezeptDetail
            rezept={selectedRezept}
            onClose={() => setSelectedRezept(null)}
          />
        )}
      </Dialog.Root>

    </div>
  )
}
