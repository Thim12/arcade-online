'use client'

// ─────────────────────────────────────────────────────────────────
// MakroRechner – Standalone TDEE + Makro-Rechner
//
// Nutzt inline calcTDEE (Mifflin-St Jeor) – kein Import aus
// nutrition-ai.ts, damit @google/generative-ai nicht ins
// Browser-Bundle gezogen wird.
//
// Einbettbar überall: <MakroRechner />
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Info } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

type Geschlecht  = 'MAENNLICH' | 'WEIBLICH'
type Aktivitaet  = 'SEDENTAER' | 'LEICHT_AKTIV' | 'MAESSIG_AKTIV' | 'AKTIV' | 'SEHR_AKTIV'

interface Eingabe {
  groesseCm:   string
  gewichtKg:   string
  alter:       string
  geschlecht:  Geschlecht
  aktivitaet:  Aktivitaet
}

interface Ergebnis {
  tdee:     number
  proteinG: number
  carbsG:   number
  fatG:     number
}

// ─────────────────────────────────────────────────────────────────
// Inline TDEE-Berechnung (Mifflin-St Jeor)
// Gleiches Modell wie NutritionAI – kein Server-Aufruf nötig
// ─────────────────────────────────────────────────────────────────

const AKTIVITAET_FAKTOREN: Record<Aktivitaet, number> = {
  SEDENTAER:     1.2,
  LEICHT_AKTIV:  1.375,
  MAESSIG_AKTIV: 1.55,
  AKTIV:         1.725,
  SEHR_AKTIV:    1.9,
}

function calcTDEE(
  groesseCm: number,
  gewichtKg: number,
  alter:     number,
  geschlecht: Geschlecht,
  aktivitaet: Aktivitaet,
): number {
  const bmr =
    geschlecht === 'MAENNLICH'
      ? 10 * gewichtKg + 6.25 * groesseCm - 5 * alter + 5
      : 10 * gewichtKg + 6.25 * groesseCm - 5 * alter - 161
  return Math.round(bmr * AKTIVITAET_FAKTOREN[aktivitaet])
}

// ─────────────────────────────────────────────────────────────────
// Konstanten für Labels
// ─────────────────────────────────────────────────────────────────

const AKTIVITAET_LABELS: Record<Aktivitaet, string> = {
  SEDENTAER:     'Wenig aktiv (Büroarbeit, kaum Sport)',
  LEICHT_AKTIV:  'Leicht aktiv (1–3× Sport/Woche)',
  MAESSIG_AKTIV: 'Mäßig aktiv (3–5× Sport/Woche)',
  AKTIV:         'Sehr aktiv (6–7× Sport/Woche)',
  SEHR_AKTIV:    'Extrem aktiv (2× täglich oder körperliche Arbeit)',
}

// ─────────────────────────────────────────────────────────────────
// Komponente
// ─────────────────────────────────────────────────────────────────

export function MakroRechner() {
  const [eingabe, setEingabe] = useState<Eingabe>({
    groesseCm:   '',
    gewichtKg:   '',
    alter:       '',
    geschlecht:  'MAENNLICH',
    aktivitaet:  'MAESSIG_AKTIV',
  })
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  const handleBerechnen = () => {
    setFehler(null)

    const groesse = parseInt(eingabe.groesseCm, 10)
    const gewicht = parseFloat(eingabe.gewichtKg)
    const alter   = parseInt(eingabe.alter, 10)

    if (isNaN(groesse) || groesse < 100 || groesse > 250) {
      setFehler('Bitte eine gültige Größe eingeben (100–250 cm).')
      return
    }
    if (isNaN(gewicht) || gewicht < 30 || gewicht > 300) {
      setFehler('Bitte ein gültiges Gewicht eingeben (30–300 kg).')
      return
    }
    if (isNaN(alter) || alter < 10 || alter > 100) {
      setFehler('Bitte ein gültiges Alter eingeben (10–100 Jahre).')
      return
    }

    const tdee = calcTDEE(groesse, gewicht, alter, eingabe.geschlecht, eingabe.aktivitaet)

    setErgebnis({
      tdee,
      proteinG: Math.round((tdee * 0.30) / 4),
      carbsG:   Math.round((tdee * 0.45) / 4),
      fatG:     Math.round((tdee * 0.25) / 9),
    })
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8">
        <Calculator size={18} className="text-[#16A34A]" />
        <div>
          <h3 className="text-sm font-semibold text-white">Makro-Rechner</h3>
          <p className="text-[10px] text-gray-500">
            Gleiches Berechnungsmodell wie unsere eigene NutritionAI.
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          {/* Größe */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Größe (cm)</label>
            <input
              type="number"
              value={eingabe.groesseCm}
              onChange={(e) => setEingabe((p) => ({ ...p, groesseCm: e.target.value }))}
              placeholder="175"
              min={100}
              max={250}
              className="w-full px-3 py-2 bg-white/8 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-600/60 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          </div>

          {/* Gewicht */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Gewicht (kg)</label>
            <input
              type="number"
              value={eingabe.gewichtKg}
              onChange={(e) => setEingabe((p) => ({ ...p, gewichtKg: e.target.value }))}
              placeholder="70"
              min={30}
              max={300}
              step={0.5}
              className="w-full px-3 py-2 bg-white/8 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-600/60 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          </div>

          {/* Alter */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Alter (Jahre)</label>
            <input
              type="number"
              value={eingabe.alter}
              onChange={(e) => setEingabe((p) => ({ ...p, alter: e.target.value }))}
              placeholder="25"
              min={10}
              max={100}
              className="w-full px-3 py-2 bg-white/8 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-600/60 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          </div>

          {/* Geschlecht */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Geschlecht</label>
            <div className="flex gap-1.5">
              {(['MAENNLICH', 'WEIBLICH'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setEingabe((p) => ({ ...p, geschlecht: g }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all
                    ${eingabe.geschlecht === g
                      ? 'bg-[#16A34A] border-[#16A34A] text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  {g === 'MAENNLICH' ? 'Männlich' : 'Weiblich'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aktivitätslevel */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Aktivitätslevel</label>
          <select
            value={eingabe.aktivitaet}
            onChange={(e) => setEingabe((p) => ({ ...p, aktivitaet: e.target.value as Aktivitaet }))}
            className="w-full px-3 py-2.5 bg-white/8 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-green-600/60 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', colorScheme: 'dark' }}
          >
            {(Object.entries(AKTIVITAET_LABELS) as [Aktivitaet, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Fehler */}
        {fehler && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <Info size={13} />
            {fehler}
          </p>
        )}

        {/* Berechnen-Button */}
        <button
          onClick={handleBerechnen}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#16A34A] hover:bg-[#15803D] rounded-xl text-white font-semibold text-sm transition-colors"
        >
          <Calculator size={15} />
          Berechnen
        </button>

        {/* Ergebnis */}
        <AnimatePresence>
          {ergebnis && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-3"
            >
              {/* TDEE */}
              <div className="p-4 bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border border-[#86EFAC] rounded-xl text-center">
                <p className="text-xs text-[#16A34A] font-medium mb-1">Täglicher Energiebedarf (TDEE)</p>
                <p className="text-3xl font-bold text-[#14532D]">{ergebnis.tdee} kcal</p>
              </div>

              {/* Makros */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Protein',       g: ergebnis.proteinG, pct: 30, color: '#3B82F6' },
                  { label: 'Kohlenhydrate', g: ergebnis.carbsG,   pct: 45, color: '#F97316' },
                  { label: 'Fett',          g: ergebnis.fatG,     pct: 25, color: '#EAB308' },
                ].map(({ label, g, pct, color }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 p-3 bg-white/5 border border-white/8 rounded-xl"
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-lg font-bold text-white tabular-nums">{g}g</span>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">{label}</span>
                    <span className="text-[9px] text-gray-600">{pct}%</span>
                  </div>
                ))}
              </div>

              {/* Hinweis */}
              <div className="flex items-start gap-2 p-3 bg-white/5 rounded-xl text-xs text-gray-400">
                <Info size={12} className="shrink-0 mt-0.5 text-gray-500" />
                <span>
                  Berechnung nach Mifflin-St Jeor (revidiertes Harris-Benedict).
                  Gleiches Modell wie unsere eigene NutritionAI.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
