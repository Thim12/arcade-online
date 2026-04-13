'use client'

// ─────────────────────────────────────────────────────────────────
// EinstellungenClient – Ernährungs-Einstellungen
//
// Features:
//  • Kalorienziel-Slider (1200–5000 kcal)
//  • Makro-Split Slider (P/K/F immer = 100 %, Auto-Balance)
//  • Live-Vorschau Gramm-Werte
//  • Wasser-Tagesziel Slider (1000–4000 ml, 250er-Schritte)
//  • 4 Mahlzeiten-Zeiten (HH:MM Inputs, keine externe Lib)
//  • Vegetarisch/Vegan Radix Switch
//  • Aktiver Plan mit Links
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Switch from '@radix-ui/react-switch'
import { Save, Loader2, Leaf, Utensils, Droplets, Clock, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { NutritionEinstellungen } from '@/lib/ernaehrung-settings'
import { MakroRechner } from '@/components/ernaehrung/MakroRechner'

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

interface ActivePlan {
  id:        string
  title:     string
  createdAt: string
}

interface EinstellungenClientProps {
  initialSettings: NutritionEinstellungen
  activePlan:      ActivePlan | null
}

interface Toast {
  id:      number
  type:    'success' | 'error'
  message: string
}

// ─────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onClick={() => onDismiss(t.id)}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl border max-w-xs cursor-pointer
              ${t.type === 'error'
                ? 'bg-red-900/90 border-red-700 text-red-200'
                : 'bg-green-900/90 border-green-700 text-green-200'
              }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Slider Komponente
// ─────────────────────────────────────────────────────────────────

interface SliderProps {
  value:    number
  min:      number
  max:      number
  step:     number
  onChange: (v: number) => void
  color?:   string
}

function Slider({ value, min, max, step, onChange, color = '#16A34A' }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="relative h-5 flex items-center">
      <div className="w-full h-1.5 bg-white/10 rounded-full relative">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
      />
      {/* Thumb */}
      <div
        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none transition-all"
        style={{
          left: `calc(${pct}% - 8px)`,
          backgroundColor: color,
        }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Komponente
// ─────────────────────────────────────────────────────────────────

export function EinstellungenClient({ initialSettings, activePlan }: EinstellungenClientProps) {
  const [settings, setSettings] = useState<NutritionEinstellungen>(initialSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingPlan, setIsDeletingPlan] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastCounter = useRef(0)

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  // ── Makro-Balance ─────────────────────────────────────────────
  // Wenn ein Slider geändert wird, passen die anderen 2 sich
  // proportional an, sodass die Summe immer 100 bleibt.
  const handleMacroPctChange = useCallback(
    (field: 'proteinPct' | 'carbsPct' | 'fatPct', newVal: number) => {
      setSettings((prev) => {
        const other1: 'proteinPct' | 'carbsPct' | 'fatPct' =
          field === 'proteinPct' ? 'carbsPct' :
          field === 'carbsPct'   ? 'proteinPct' : 'proteinPct'
        const other2: 'proteinPct' | 'carbsPct' | 'fatPct' =
          field === 'proteinPct' ? 'fatPct' :
          field === 'carbsPct'   ? 'fatPct'    : 'carbsPct'

        const remaining = 100 - newVal
        const currentSum = prev[other1] + prev[other2]

        let v1: number
        let v2: number
        if (currentSum === 0) {
          v1 = Math.round(remaining / 2)
          v2 = remaining - v1
        } else {
          const ratio1 = prev[other1] / currentSum
          v1 = Math.max(10, Math.round(remaining * ratio1))
          v2 = Math.max(10, remaining - v1)
          // Korrektur wenn beide zusammen > remaining
          if (v1 + v2 !== remaining) {
            v2 = remaining - v1
          }
        }

        return {
          ...prev,
          [field]: newVal,
          [other1]: v1,
          [other2]: v2,
        }
      })
    },
    [],
  )

  // ── Speichern ────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/ernaehrung/einstellungen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      addToast('success', 'Einstellungen gespeichert.')
    } catch {
      addToast('error', 'Einstellungen konnten nicht gespeichert werden.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Plan löschen ─────────────────────────────────────────────
  const handleDeletePlan = async () => {
    if (!activePlan) return
    setIsDeletingPlan(true)
    try {
      const res = await fetch(`/api/ernaehrung/plan/${activePlan.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      addToast('success', 'Plan gelöscht.')
      window.location.reload()
    } catch {
      addToast('error', 'Plan konnte nicht gelöscht werden.')
      setIsDeletingPlan(false)
    }
  }

  // ── Live-Vorschau Gramm ───────────────────────────────────────
  const proteinG = Math.round((settings.kalorienZiel * (settings.proteinPct / 100)) / 4)
  const carbsG   = Math.round((settings.kalorienZiel * (settings.carbsPct   / 100)) / 4)
  const fatG     = Math.round((settings.kalorienZiel * (settings.fatPct     / 100)) / 9)

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="min-h-screen bg-[#0A0C10]">

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80)',
              opacity: 0.08,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A2218] via-[#0A1810] to-[#0A0C10]" />
          <div className="relative px-4 pt-8 pb-6">
            <h1 className="text-2xl font-bold text-white">Ernährungs-Einstellungen</h1>
            <p className="text-sm text-gray-400 mt-1">Passe deine Ziele und Präferenzen an.</p>
          </div>
        </div>

        <div className="px-4 pb-32 flex flex-col gap-5">

          {/* ── MAKRO-ZIELE ──────────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target16 />
              <h2 className="text-sm font-semibold text-white">Makro-Ziele anpassen</h2>
            </div>

            {/* Kalorienziel */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-300">Kalorienziel</label>
                <span className="text-sm font-bold text-white tabular-nums">{settings.kalorienZiel} kcal</span>
              </div>
              <Slider
                value={settings.kalorienZiel}
                min={1200}
                max={5000}
                step={50}
                onChange={(v) => setSettings((p) => ({ ...p, kalorienZiel: v }))}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>1200</span>
                <span>5000 kcal</span>
              </div>
            </div>

            {/* Makro-Sliders */}
            {([
              { field: 'proteinPct' as const,     label: 'Protein',         color: '#3B82F6' },
              { field: 'carbsPct'   as const,     label: 'Kohlenhydrate',   color: '#F97316' },
              { field: 'fatPct'     as const,     label: 'Fett',            color: '#EAB308' },
            ] as const).map(({ field, label, color }) => (
              <div key={field} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-300">
                    {label}
                    <span className="ml-2 text-[11px] text-gray-500">(Auto-Balance)</span>
                  </label>
                  <span className="text-sm font-bold text-white tabular-nums">{settings[field]}%</span>
                </div>
                <Slider
                  value={settings[field]}
                  min={10}
                  max={70}
                  step={1}
                  onChange={(v) => handleMacroPctChange(field, v)}
                  color={color}
                />
              </div>
            ))}

            {/* Summen-Check */}
            <div className={`flex items-center gap-2 text-xs mt-1 ${settings.proteinPct + settings.carbsPct + settings.fatPct === 100 ? 'text-green-400' : 'text-red-400'}`}>
              <span>
                Summe: {settings.proteinPct + settings.carbsPct + settings.fatPct}%
              </span>
              {settings.proteinPct + settings.carbsPct + settings.fatPct !== 100 && (
                <span>(muss 100 % sein)</span>
              )}
            </div>

            {/* Live-Vorschau */}
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/8">
              <p className="text-xs text-gray-400 mb-2">Vorschau bei {settings.kalorienZiel} kcal:</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Protein',       g: proteinG, color: '#3B82F6' },
                  { label: 'Kohlenhydrate', g: carbsG,   color: '#F97316' },
                  { label: 'Fett',          g: fatG,     color: '#EAB308' },
                ].map(({ label, g, color }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-base font-bold tabular-nums" style={{ color }}>{g}g</span>
                    <span className="text-[10px] text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── MAKRO-RECHNER ────────────────────────────────── */}
          <MakroRechner />

          {/* ── WASSER-TAGESZIEL ─────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Droplets size={16} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Wasser-Tagesziel</h2>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Ziel pro Tag</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {settings.wasserMlZiel} ml ({(settings.wasserMlZiel / 1000).toFixed(1)} L)
              </span>
            </div>
            <Slider
              value={settings.wasserMlZiel}
              min={1000}
              max={4000}
              step={250}
              onChange={(v) => setSettings((p) => ({ ...p, wasserMlZiel: v }))}
              color="#3B82F6"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1 L</span>
              <span>4 L</span>
            </div>
          </div>

          {/* ── MAHLZEITEN-ZEITEN ────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-orange-400" />
              <h2 className="text-sm font-semibold text-white">Mahlzeiten-Zeiten</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: 'fruehstueck' as const, label: 'Frühstück' },
                { key: 'mittag'      as const, label: 'Mittagessen' },
                { key: 'abend'       as const, label: 'Abendessen' },
                { key: 'snack'       as const, label: 'Snack' },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
                  <input
                    type="time"
                    value={settings.mahlzeitenZeiten[key]}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        mahlzeitenZeiten: { ...p.mahlzeitenZeiten, [key]: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 bg-white/8 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-green-600/60 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── ERNÄHRUNGSWEISE ──────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={16} className="text-green-400" />
              <h2 className="text-sm font-semibold text-white">Ernährungsweise</h2>
            </div>
            <div className="flex flex-col gap-4">
              {([
                { key: 'isVegetarisch' as const, label: 'Vegetarisch', sub: 'Kein Fleisch, kein Fisch' },
                { key: 'isVegan'       as const, label: 'Vegan',       sub: 'Keine tierischen Produkte' },
              ] as const).map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                  <Switch.Root
                    checked={settings[key]}
                    onCheckedChange={(checked) =>
                      setSettings((p) => {
                        const next = { ...p, [key]: checked }
                        // Wenn Vegan aktiviert → Vegetarisch auch
                        if (key === 'isVegan' && checked) next.isVegetarisch = true
                        // Wenn Vegetarisch deaktiviert → Vegan auch
                        if (key === 'isVegetarisch' && !checked) next.isVegan = false
                        return next
                      })
                    }
                    className={`w-11 h-6 rounded-full transition-colors outline-none
                      ${settings[key] ? 'bg-[#16A34A]' : 'bg-white/15'}`}
                  >
                    <Switch.Thumb
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform
                        ${settings[key] ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
                    />
                  </Switch.Root>
                </div>
              ))}
            </div>
          </div>

          {/* ── AKTIVER PLAN ─────────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Utensils size={16} className="text-[#16A34A]" />
              <h2 className="text-sm font-semibold text-white">Aktiver Ernährungsplan</h2>
            </div>

            {activePlan !== null ? (
              <div className="flex flex-col gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm font-medium text-white">{activePlan.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Erstellt: {new Date(activePlan.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/ernaehrung/plan-erstellen"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#16A34A]/20 border border-[#16A34A]/30 rounded-xl text-green-400 text-sm font-medium hover:bg-[#16A34A]/30 transition-colors"
                  >
                    Neuen Plan erstellen
                    <ChevronRight size={14} />
                  </Link>
                  <button
                    onClick={() => { void handleDeletePlan() }}
                    disabled={isDeletingPlan}
                    className="flex items-center gap-1.5 px-3 py-2.5 border border-red-800/40 rounded-xl text-red-400 text-sm hover:bg-red-900/20 hover:border-red-700/50 disabled:opacity-50 transition-all"
                  >
                    {isDeletingPlan ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Löschen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-400">Kein aktiver Plan vorhanden.</p>
                <Link
                  href="/ernaehrung/plan-erstellen"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] rounded-xl text-white text-sm font-semibold transition-colors w-fit"
                >
                  Plan erstellen
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* ── SPEICHERN-BUTTON ─────────────────────────────── */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { void handleSave() }}
            disabled={isSaving || settings.proteinPct + settings.carbsPct + settings.fatPct !== 100}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#16A34A] hover:bg-[#15803D] disabled:bg-gray-700 disabled:cursor-not-allowed rounded-2xl text-white font-semibold text-base shadow-lg shadow-green-900/30 transition-colors"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Einstellungen speichern
          </motion.button>

          <p className="text-center text-[10px] text-gray-600">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </p>

        </div>
      </div>
    </>
  )
}

// Kleines inline Icon um Lucide Target 16px zu umgehen (korrekt importiert)
function Target16() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
