'use client'

// ─────────────────────────────────────────────────────────────────
// app/ernaehrung/plan-erstellen/ErnaehrungPlanClient.tsx
//
// 4-Schritt-Wizard zur Ernährungsplan-Erstellung.
// Kein externer KI-Bot – vollständig eigene TypeScript-KI.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Cake,
  User,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  Heart,
  Activity,
  Dumbbell,
  Trophy,
  BrainCircuit,
  PiggyBank,
  ShoppingCart,
  Wallet,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Printer,
  Share2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import type { ErnaehrungPlanPageProps } from './page'

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

type ActivityLevel = 'SEDENTAER' | 'LEICHT_AKTIV' | 'MAESSIG_AKTIV' | 'AKTIV' | 'SEHR_AKTIV'
type Gender = 'MAENNLICH' | 'WEIBLICH'
type WizardGoal = 'HALTEN' | 'ABNEHMEN' | 'ZUNEHMEN' | 'LEISTUNG' | 'GESUND'
type WizardBudget = 'SEHR_GUENSTIG' | 'GUENSTIG' | 'MITTEL' | 'KEIN_LIMIT'
type WizardSportSlug = 'fussball' | 'tennis' | 'basketball' | 'none'
type WizardErnaehrungsweise = 'ALLES' | 'VEGETARISCH' | 'VEGAN' | 'LAKTOSEFREI' | 'GLUTENFREI'
type Step = 1 | 2 | 3 | 4

interface WizardFormData {
  heightCm: number
  weightKg: number
  gender: Gender | null
  goal: WizardGoal | null
  activityLevel: ActivityLevel | null
  sportSlug: WizardSportSlug | null
  trainingsPerWeek: number
  sessionDurationMin: number
  budget: WizardBudget | null
  ernaehrungsweise: WizardErnaehrungsweise[]
  ausschluesse: string
}

interface EinkaufsProdukt {
  name: string
  menge: string
  preisEur: number
}

interface EinkaufsKategorie {
  kategorie: string
  produkte: EinkaufsProdukt[]
}

interface Mahlzeit {
  name: string
  gericht: string
  kalorien: number
  proteinG: number
  kohlenhydrateG: number
  fettG: number
  zubereitung: string
}

interface Tagesplan {
  wochentag: string
  gesamtKalorien: number
  istTrainingsTag: boolean
  mahlzeiten: Mahlzeit[]
}

interface NutritionPlanData {
  title: string
  beschreibung: string
  tagesKalorienZiel: number
  wochenplan: Tagesplan[]
  einkaufsliste: EinkaufsKategorie[]
  gesamtpreisEur: number
  tipps: string[]
}

interface GenerateResult {
  planId: string
  title: string
  tagesKalorienZiel: number
  planData: NutritionPlanData
  usedThisMonth: number
}

// ─────────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────────────────────────

// TDEE inline – sicher für Client-Bundle (kein @google/generative-ai Import)
function calcTDEE(
  h: number,
  w: number,
  age: number,
  gender: Gender,
  activity: ActivityLevel,
): number {
  const bmr =
    gender === 'MAENNLICH'
      ? 10 * w + 6.25 * h - 5 * age + 5
      : 10 * w + 6.25 * h - 5 * age - 161
  const multipliers: Record<ActivityLevel, number> = {
    SEDENTAER:     1.2,
    LEICHT_AKTIV:  1.375,
    MAESSIG_AKTIV: 1.55,
    AKTIV:         1.725,
    SEHR_AKTIV:    1.9,
  }
  return Math.round(bmr * (multipliers[activity] ?? 1.55))
}

function formatPrice(eur: number): string {
  return eur.toFixed(2).replace('.', ',') + ' €'
}

// ─────────────────────────────────────────────────────────────────
// Animations-Varianten
// ─────────────────────────────────────────────────────────────────

const stepVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir > 0 ? -40 : 40,
    transition: { duration: 0.25 },
  }),
}

const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' },
  }),
}

// ─────────────────────────────────────────────────────────────────
// Konstanten
// ─────────────────────────────────────────────────────────────────

const AI_LOADING_TEXTS = [
  'Körperdaten analysieren...',
  'Trainingsintensität berechnen...',
  'Speiseplan erstellen...',
  'Rezepte auswählen...',
  'Einkaufsliste generieren...',
  'Fertig!',
]

const DAY_TABS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// ─────────────────────────────────────────────────────────────────
// Fortschrittsbalken
// ─────────────────────────────────────────────────────────────────

function WizardProgress({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: 'Körper & Ziel' },
    { n: 2, label: 'Aktivität' },
    { n: 3, label: 'Budget' },
    { n: 4, label: 'Generierung' },
  ]

  return (
    <div className="flex items-center gap-1">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-1 flex-1">
          <div className="flex flex-col items-center">
            <div
              className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                step >= n ? 'text-white' : 'bg-white/10 text-white/30',
              ].join(' ')}
              style={step >= n ? { background: '#16A34A' } : {}}
            >
              {step > n ? (
                <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M2 6l3 3 5-5" />
                </svg>
              ) : (
                n
              )}
            </div>
            <span
              className={[
                'text-xs mt-1 whitespace-nowrap hidden sm:block',
                step === n ? 'text-white/70' : 'text-white/25',
              ].join(' ')}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px bg-white/10 relative -mt-4 sm:-mt-5">
              {step > n && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 origin-left"
                  style={{ background: '#16A34A' }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 1 – Körper & Ziel
// ─────────────────────────────────────────────────────────────────

function Step1KoerperZiel({
  formData,
  setFormData,
  age,
}: {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
  age: number | null
}) {
  const tdee =
    formData.gender !== null && age !== null
      ? calcTDEE(
          formData.heightCm,
          formData.weightKg,
          age,
          formData.gender,
          formData.activityLevel ?? 'MAESSIG_AKTIV',
        )
      : null

  const goalCards: Array<{
    value: WizardGoal
    label: string
    description: string
    icon: React.ReactNode
  }> = [
    { value: 'HALTEN',   label: 'Gewicht halten',        description: 'Stabil bleiben, Energie aufrechterhalten', icon: <Target size={20} /> },
    { value: 'ABNEHMEN', label: 'Abnehmen',               description: 'Kaloriendefizit, Körperfett reduzieren',   icon: <TrendingDown size={20} /> },
    { value: 'ZUNEHMEN', label: 'Zunehmen / Muskeln',     description: 'Kalorienüberschuss, Muskelaufbau',         icon: <TrendingUp size={20} /> },
    { value: 'LEISTUNG', label: 'Sportliche Leistung',    description: 'Optimale Energie fürs Training',           icon: <Zap size={20} /> },
    { value: 'GESUND',   label: 'Gesünder essen',         description: 'Ausgewogen, nährstoffreich, vollwertig',   icon: <Heart size={20} /> },
  ]

  const heightPct = ((formData.heightCm - 150) / (215 - 150)) * 100
  const weightPct = ((formData.weightKg - 40) / (130 - 40)) * 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-white">Dein Körper</h2>
        <Lock size={14} className="text-white/40" />
        <span className="text-sm text-white/40">Daten werden lokal berechnet</span>
      </div>

      {/* Körpergröße */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Körpergröße
          </span>
          <span className="text-2xl font-bold tabular-nums text-[#16A34A]">
            {formData.heightCm} cm
          </span>
        </div>
        <input
          type="range"
          min={150}
          max={215}
          step={1}
          value={formData.heightCm}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, heightCm: Number(e.target.value) }))
          }
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #16A34A 0%, #16A34A ${heightPct}%, rgba(255,255,255,0.1) ${heightPct}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>150 cm</span>
          <span>215 cm</span>
        </div>
      </div>

      {/* Körpergewicht */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Körpergewicht
          </span>
          <span className="text-2xl font-bold tabular-nums text-[#16A34A]">
            {formData.weightKg} kg
          </span>
        </div>
        <input
          type="range"
          min={40}
          max={130}
          step={1}
          value={formData.weightKg}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, weightKg: Number(e.target.value) }))
          }
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #16A34A 0%, #16A34A ${weightPct}%, rgba(255,255,255,0.1) ${weightPct}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>40 kg</span>
          <span>130 kg</span>
        </div>
      </div>

      {/* Alter (read-only) */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
        <Cake size={14} className="text-white/40 shrink-0" />
        <span className="text-sm text-white/60">Alter (aus Profil):</span>
        <span className="text-sm font-semibold text-white ml-auto">
          {age !== null ? `${age} Jahre` : 'Nicht angegeben'}
        </span>
      </div>

      {/* Geschlecht */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Geschlecht
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'MAENNLICH' as const, label: 'Männlich' },
            { value: 'WEIBLICH' as const, label: 'Weiblich' },
          ] as const).map((g, i) => {
            const isSelected = formData.gender === g.value
            return (
              <motion.button
                key={g.value}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => setFormData((prev) => ({ ...prev, gender: g.value }))}
                className={[
                  'flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[#16A34A] bg-[#16A34A]/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20',
                ].join(' ')}
              >
                <User size={18} style={{ color: isSelected ? '#16A34A' : undefined }} />
                <span className="font-semibold text-sm">{g.label}</span>
                {isSelected && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#16A34A]" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Ziel-Cards */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Dein Ziel
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          {goalCards.map((card, i) => {
            const isSelected = formData.goal === card.value
            return (
              <motion.button
                key={card.value}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() => setFormData((prev) => ({ ...prev, goal: card.value }))}
                className={[
                  'flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[#16A34A] bg-[#16A34A]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                ].join(' ')}
              >
                <span style={{ color: isSelected ? '#16A34A' : 'rgba(255,255,255,0.4)' }}>
                  {card.icon}
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{card.label}</div>
                  <div className="text-xs text-white/50 mt-0.5">{card.description}</div>
                </div>
                {isSelected && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* TDEE Vorschau (nur wenn gender gesetzt) */}
      {formData.gender !== null && tdee !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-[#86EFAC] bg-[#F0FDF4]"
        >
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={16} className="text-[#16A34A]" />
            <span className="text-sm font-semibold text-[#15803D]">
              Kalorienbedarf-Vorschau
            </span>
          </div>
          <div className="text-2xl font-bold text-[#15803D] tabular-nums">
            {tdee.toLocaleString('de-DE')} kcal / Tag
          </div>
          <p className="text-xs text-[#16A34A]/70 mt-1">
            Harris-Benedict-Formel · wird von unserer NutritionAI verfeinert
          </p>
        </motion.div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 2 – Aktivität & Sport
// ─────────────────────────────────────────────────────────────────

function Step2AktivitaetSport({
  formData,
  setFormData,
}: {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
}) {
  const activityCards: Array<{
    value: ActivityLevel
    label: string
    description: string
    icon: React.ReactNode
  }> = [
    { value: 'SEDENTAER',     label: 'Sitzend',        description: 'Bürojob, wenig Bewegung',         icon: <Activity size={20} /> },
    { value: 'LEICHT_AKTIV',  label: 'Leicht aktiv',   description: '1–3 Tage Sport pro Woche',        icon: <Activity size={20} /> },
    { value: 'MAESSIG_AKTIV', label: 'Mäßig aktiv',    description: '3–5 Tage Sport pro Woche',        icon: <Activity size={20} /> },
    { value: 'AKTIV',         label: 'Sehr aktiv',      description: '6–7 Tage Sport pro Woche',       icon: <Dumbbell size={20} /> },
    { value: 'SEHR_AKTIV',   label: 'Hochaktiv',       description: 'Intensiv täglich oder körperlich', icon: <Trophy size={20} /> },
  ]

  const sportCards: Array<{
    value: WizardSportSlug
    label: string
    emoji: string
  }> = [
    { value: 'fussball',   label: 'Fußball',    emoji: '⚽' },
    { value: 'tennis',     label: 'Tennis',     emoji: '🎾' },
    { value: 'basketball', label: 'Basketball', emoji: '🏀' },
    { value: 'none',       label: 'Keine Sportart', emoji: '—' },
  ]

  const trainingPct = ((formData.trainingsPerWeek - 1) / (7 - 1)) * 100
  const sessionPct  = ((formData.sessionDurationMin - 20) / (120 - 20)) * 100

  return (
    <div className="space-y-8">
      {/* Aktivitätslevel */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Aktivitätslevel
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {activityCards.map((card, i) => {
            const isSelected = formData.activityLevel === card.value
            return (
              <motion.button
                key={card.value}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, activityLevel: card.value }))
                }
                className={[
                  'flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[#16A34A] bg-[#16A34A]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                ].join(' ')}
              >
                <span style={{ color: isSelected ? '#16A34A' : 'rgba(255,255,255,0.4)' }}>
                  {card.icon}
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{card.label}</div>
                  <div className="text-xs text-white/50">{card.description}</div>
                </div>
                {isSelected && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Sportart */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Sportart
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {sportCards.map((card, i) => {
            const isSelected = formData.sportSlug === card.value
            return (
              <motion.button
                key={card.value}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, sportSlug: card.value }))
                }
                className={[
                  'p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[#16A34A] bg-[#16A34A]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                ].join(' ')}
              >
                <div className="text-xl mb-1">{card.emoji}</div>
                <div className="text-sm font-semibold text-white">{card.label}</div>
                {isSelected && (
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#16A34A]" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Trainingstage Slider (nur wenn Sport gewählt, nicht 'none') */}
      <AnimatePresence>
        {formData.sportSlug !== null && formData.sportSlug !== 'none' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                Trainingstage pro Woche
              </span>
              <span className="text-2xl font-bold tabular-nums text-[#16A34A]">
                {formData.trainingsPerWeek}×
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={7}
              step={1}
              value={formData.trainingsPerWeek}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  trainingsPerWeek: Number(e.target.value),
                }))
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #16A34A 0%, #16A34A ${trainingPct}%, rgba(255,255,255,0.1) ${trainingPct}%, rgba(255,255,255,0.1) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session-Dauer Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Dauer pro Einheit
          </span>
          <span className="text-2xl font-bold tabular-nums text-[#16A34A]">
            {formData.sessionDurationMin} min
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={120}
          step={5}
          value={formData.sessionDurationMin}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              sessionDurationMin: Number(e.target.value),
            }))
          }
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #16A34A 0%, #16A34A ${sessionPct}%, rgba(255,255,255,0.1) ${sessionPct}%, rgba(255,255,255,0.1) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>20 min</span>
          <span>120 min</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 3 – Budget & Präferenzen
// ─────────────────────────────────────────────────────────────────

function Step3BudgetPraeferenzen({
  formData,
  setFormData,
}: {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
}) {
  const budgetCards: Array<{
    value: WizardBudget
    label: string
    sublabel: string
    icon: React.ReactNode
  }> = [
    { value: 'SEHR_GUENSTIG', label: 'Sehr günstig', sublabel: 'unter 30 €/Woche', icon: <PiggyBank size={20} /> },
    { value: 'GUENSTIG',      label: 'Günstig',       sublabel: '30–50 €/Woche',     icon: <ShoppingCart size={20} /> },
    { value: 'MITTEL',        label: 'Mittel',         sublabel: '50–80 €/Woche',     icon: <Wallet size={20} /> },
    { value: 'KEIN_LIMIT',   label: 'Kein Limit',     sublabel: 'Qualitätsfokus',    icon: <CreditCard size={20} /> },
  ]

  const ernChips: Array<{ value: WizardErnaehrungsweise; label: string }> = [
    { value: 'ALLES',       label: 'Alles' },
    { value: 'VEGETARISCH', label: 'Vegetarisch' },
    { value: 'VEGAN',       label: 'Vegan' },
    { value: 'LAKTOSEFREI', label: 'Laktosefrei' },
    { value: 'GLUTENFREI',  label: 'Glutenfrei' },
  ]

  const toggleErnaehrungsweise = (val: WizardErnaehrungsweise) => {
    setFormData((prev) => {
      if (val === 'ALLES') return { ...prev, ernaehrungsweise: ['ALLES'] }
      const current = prev.ernaehrungsweise.filter((v) => v !== 'ALLES')
      const updated = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val]
      return { ...prev, ernaehrungsweise: updated.length > 0 ? updated : ['ALLES'] }
    })
  }

  return (
    <div className="space-y-8">
      {/* Budget */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Wochenbudget
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {budgetCards.map((card, i) => {
            const isSelected = formData.budget === card.value
            return (
              <motion.button
                key={card.value}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, budget: card.value }))
                }
                className={[
                  'flex flex-col gap-2 p-4 rounded-xl border text-left transition-all duration-200',
                  isSelected
                    ? 'border-[#16A34A] bg-[#16A34A]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                ].join(' ')}
              >
                <span style={{ color: isSelected ? '#16A34A' : 'rgba(255,255,255,0.4)' }}>
                  {card.icon}
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{card.label}</div>
                  <div className="text-xs text-white/50">{card.sublabel}</div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Kein-Limit Info-Box */}
      <AnimatePresence>
        {formData.budget === 'KEIN_LIMIT' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 rounded-xl border border-[#86EFAC] bg-[#F0FDF4]"
          >
            <BrainCircuit size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#15803D] leading-relaxed">
              Auch ohne Budget-Limit werden ausschließlich deutsche Alltagsprodukte
              verwendet. Kein Superfood, keine exotischen Zutaten.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ernährungsweise */}
      <div>
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Ernährungsweise
        </h3>
        <div className="flex flex-wrap gap-2">
          {ernChips.map((chip) => {
            const isSelected = formData.ernaehrungsweise.includes(chip.value)
            return (
              <button
                key={chip.value}
                onClick={() => toggleErnaehrungsweise(chip.value)}
                className={[
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200',
                  isSelected
                    ? 'border-[#16A34A] bg-[#16A34A]/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20',
                ].join(' ')}
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ausschlüsse */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Ausschlüsse{' '}
            <span className="text-white/30 normal-case font-normal">(optional)</span>
          </h3>
          <span className="text-xs text-white/30">
            {formData.ausschluesse.length}/300
          </span>
        </div>
        <textarea
          value={formData.ausschluesse}
          onChange={(e) => {
            if (e.target.value.length <= 300) {
              setFormData((prev) => ({ ...prev, ausschluesse: e.target.value }))
            }
          }}
          placeholder="z.B. Fisch, Nüsse, bestimmte Gemüsesorten..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#16A34A] resize-none"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Schritt 4 – Generierung & Preview
// ─────────────────────────────────────────────────────────────────

function MahlzeitKarte({
  mahlzeit,
  expanded,
  onToggle,
}: {
  mahlzeit: Mahlzeit
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/40 font-medium uppercase tracking-wide">
            {mahlzeit.name}
          </div>
          <div className="text-sm font-semibold text-white mt-0.5 truncate">
            {mahlzeit.gericht}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-[#16A34A] font-semibold">
              {mahlzeit.kalorien} kcal
            </span>
            <span className="text-xs text-white/40">
              P {mahlzeit.proteinG}g · K {mahlzeit.kohlenhydrateG}g · F {mahlzeit.fettG}g
            </span>
          </div>
        </div>
        <div className="ml-3 text-white/40 shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5">
              <p className="text-xs text-white/60 leading-relaxed pt-3">
                {mahlzeit.zubereitung}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Step4Generierung({
  result,
  isGenerating,
  error,
  onRetry,
  onActivate,
  onRegenerate,
  isActivating,
  canRegenerate,
  copied,
  onShare,
  onPrint,
}: {
  result: GenerateResult | null
  isGenerating: boolean
  error: string | null
  onRetry: () => void
  onActivate: () => void
  onRegenerate: () => void
  isActivating: boolean
  canRegenerate: boolean
  copied: boolean
  onShare: () => void
  onPrint: () => void
}) {
  const [textIndex, setTextIndex] = useState(0)
  const [activeTab, setActiveTab] = useState(0)  // 0-6 = days, 7 = Einkauf
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isGenerating) return
    intervalRef.current = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % AI_LOADING_TEXTS.length)
    }, 1500)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [isGenerating])

  // Tabs zurücksetzen wenn neues Ergebnis
  useEffect(() => {
    if (result !== null) {
      setActiveTab(0)
      setExpandedMeals(new Set())
      setCheckedItems(new Set())
    }
  }, [result])

  const toggleMeal = (key: string) => {
    setExpandedMeals((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const activeDay = result?.planData.wochenplan[activeTab] ?? null

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Laden */}
        {isGenerating && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-12 gap-8"
          >
            {/* Rotierende Ringe */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {[60, 84, 108].map((size, i) => (
                <motion.div
                  key={size}
                  className="absolute rounded-full border"
                  style={{
                    width: size,
                    height: size,
                    borderColor: '#16A34A',
                    opacity: 0.2 + i * 0.25,
                  }}
                  animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }}
                />
              ))}
              <BrainCircuit size={28} style={{ color: '#16A34A' }} />
            </div>

            {/* Rotierender Text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={textIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-white/60 text-center"
              >
                {AI_LOADING_TEXTS[textIndex]}
              </motion.p>
            </AnimatePresence>

            <p className="text-xs text-white/30 text-center">
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </p>
          </motion.div>
        )}

        {/* Fehler */}
        {!isGenerating && error !== null && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-12 gap-6 text-center"
          >
            <AlertTriangle size={40} className="text-red-400" />
            <p className="text-red-300 text-sm max-w-sm">{error}</p>
            <button
              onClick={onRetry}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors"
            >
              Erneut versuchen
            </button>
          </motion.div>
        )}

        {/* Ergebnis */}
        {!isGenerating && result !== null && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Plan-Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-2xl border border-[#16A34A]/30 bg-[#16A34A]/5"
            >
              <div className="flex items-start gap-3">
                <CheckCircle size={22} className="text-[#16A34A] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white leading-snug">{result.title}</h3>
                  <p className="text-sm text-white/50 mt-1">
                    {result.tagesKalorienZiel.toLocaleString('de-DE')} kcal / Tag · 7 Tage
                  </p>
                  {result.planData.beschreibung.length > 0 && (
                    <p className="text-xs text-white/40 mt-2 leading-relaxed">
                      {result.planData.beschreibung}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                <p className="text-xs text-white/30">
                  Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onPrint}
                    className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-all"
                    title="Drucken"
                  >
                    <Printer size={15} />
                  </button>
                  <button
                    onClick={onShare}
                    className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-all"
                    title={copied ? 'Kopiert!' : 'Teilen'}
                  >
                    {copied ? <CheckCircle size={15} className="text-[#16A34A]" /> : <Share2 size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 7-Tage Tabs + Einkaufsliste */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Tab-Leiste */}
              <div className="flex overflow-x-auto gap-1 pb-2 scrollbar-none">
                {DAY_TABS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => setActiveTab(i)}
                    className={[
                      'flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200',
                      activeTab === i
                        ? 'border-[#16A34A] bg-[#16A34A]/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20',
                    ].join(' ')}
                  >
                    {day}
                    {result.planData.wochenplan[i]?.istTrainingsTag === true && (
                      <span className="ml-1 text-[#16A34A]">·</span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setActiveTab(7)}
                  className={[
                    'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200',
                    activeTab === 7
                      ? 'border-[#16A34A] bg-[#16A34A]/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20',
                  ].join(' ')}
                >
                  <ShoppingCart size={12} />
                  Einkauf
                </button>
              </div>

              {/* Tab-Inhalt */}
              <AnimatePresence mode="wait">
                {activeTab < 7 && activeDay !== null && (
                  <motion.div
                    key={`day-${activeTab}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/40">
                        {activeDay.wochentag}
                        {activeDay.istTrainingsTag && (
                          <span className="ml-2 text-[#16A34A]">Trainingstag</span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-[#16A34A]">
                        {activeDay.gesamtKalorien} kcal
                      </span>
                    </div>
                    {activeDay.mahlzeiten.map((m, mi) => (
                      <MahlzeitKarte
                        key={`${activeTab}-${mi}`}
                        mahlzeit={m}
                        expanded={expandedMeals.has(`${activeTab}-${mi}`)}
                        onToggle={() => toggleMeal(`${activeTab}-${mi}`)}
                      />
                    ))}
                  </motion.div>
                )}

                {activeTab === 7 && (
                  <motion.div
                    key="einkauf"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 space-y-4"
                  >
                    {result.planData.einkaufsliste.map((kat, ki) => (
                      <div key={ki}>
                        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                          {kat.kategorie}
                        </h4>
                        <div className="space-y-1">
                          {kat.produkte.map((prod, pi) => {
                            const key = `${ki}-${pi}`
                            const isChecked = checkedItems.has(key)
                            return (
                              <button
                                key={key}
                                onClick={() => toggleCheck(key)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/3 hover:bg-white/5 text-left transition-colors"
                              >
                                <div
                                  className={[
                                    'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all',
                                    isChecked ? 'bg-[#16A34A] border-[#16A34A]' : 'border-white/20',
                                  ].join(' ')}
                                >
                                  {isChecked && (
                                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                      <path d="M2 6l3 3 5-5" />
                                    </svg>
                                  )}
                                </div>
                                <span
                                  className={[
                                    'text-sm font-medium flex-1 min-w-0',
                                    isChecked ? 'line-through text-white/30' : 'text-white',
                                  ].join(' ')}
                                >
                                  {prod.name}
                                </span>
                                <span className="text-xs text-white/40 shrink-0">{prod.menge}</span>
                                <span className="text-xs text-white/60 tabular-nums shrink-0 w-14 text-right">
                                  {formatPrice(prod.preisEur)}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Gesamtpreis */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-[#16A34A]/30 bg-[#16A34A]/5">
                      <span className="text-sm font-semibold text-white">Gesamt</span>
                      <span className="text-lg font-bold text-[#16A34A] tabular-nums">
                        {formatPrice(result.planData.gesamtpreisEur)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Tipps */}
            {result.planData.tipps.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-xl border border-white/5 bg-white/3"
              >
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                  Ernährungstipps
                </h4>
                <ul className="space-y-1">
                  {result.planData.tipps.map((tip, i) => (
                    <li key={i} className="text-xs text-white/50 leading-relaxed flex gap-2">
                      <span className="text-[#16A34A] shrink-0">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col gap-3"
            >
              <button
                onClick={onActivate}
                disabled={isActivating}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <CheckCircle size={18} />
                {isActivating ? 'Wird aktiviert...' : 'Plan aktivieren'}
              </button>

              {canRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="w-full py-3 rounded-xl font-semibold text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-all duration-200 text-sm"
                >
                  Nochmals generieren
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Component
// ─────────────────────────────────────────────────────────────────

export function ErnaehrungPlanClient({
  birthYear,
  usedThisMonth: initialUsed,
}: ErnaehrungPlanPageProps) {
  const router = useRouter()

  const currentYear = new Date().getFullYear()
  const age = birthYear !== null ? currentYear - birthYear : null

  const [step, setStep]           = useState<Step>(1)
  const [direction, setDirection] = useState(1)

  const [formData, setFormData] = useState<WizardFormData>({
    heightCm:          175,
    weightKg:          75,
    gender:            null,
    goal:              null,
    activityLevel:     null,
    sportSlug:         null,
    trainingsPerWeek:  3,
    sessionDurationMin: 60,
    budget:            null,
    ernaehrungsweise:  ['ALLES'],
    ausschluesse:      '',
  })

  const [isGenerating,    setIsGenerating]    = useState(false)
  const [generateResult,  setGenerateResult]  = useState<GenerateResult | null>(null)
  const [generateError,   setGenerateError]   = useState<string | null>(null)
  const [isActivating,    setIsActivating]    = useState(false)
  const [activateError,   setActivateError]   = useState<string | null>(null)
  const [copied,          setCopied]          = useState(false)

  const isAtLimit = initialUsed >= 3

  // ── Navigations-Logik ────────────────────────────────────────

  const canProceed = (): boolean => {
    if (step === 1) return formData.gender !== null && formData.goal !== null
    if (step === 2) return formData.activityLevel !== null && formData.sportSlug !== null
    if (step === 3) return formData.budget !== null
    if (step === 4) return !isGenerating && generateResult !== null
    return false
  }

  const goNext = () => {
    if (!canProceed()) return
    if (step === 3) {
      setDirection(1)
      setStep(4)
      setTimeout(() => void handleGenerate(), 200)
      return
    }
    setDirection(1)
    setStep((prev) => Math.min(prev + 1, 4) as Step)
  }

  const goBack = () => {
    if (step === 1) {
      router.push('/ernaehrung')
      return
    }
    if (step === 4 && (isGenerating || generateResult !== null)) return
    setDirection(-1)
    setStep((prev) => Math.max(prev - 1, 1) as Step)
  }

  // ── Plan generieren ──────────────────────────────────────────

  const handleGenerate = async () => {
    if (
      formData.gender === null ||
      formData.goal === null ||
      formData.activityLevel === null ||
      formData.sportSlug === null ||
      formData.budget === null
    ) return

    setIsGenerating(true)
    setGenerateError(null)
    setGenerateResult(null)
    setActivateError(null)

    try {
      const body = {
        heightCm:           formData.heightCm,
        weightKg:           formData.weightKg,
        gender:             formData.gender,
        goal:               formData.goal,
        activityLevel:      formData.activityLevel,
        sportSlug:          formData.sportSlug,
        trainingsPerWeek:   formData.trainingsPerWeek,
        sessionDurationMin: formData.sessionDurationMin,
        budget:             formData.budget,
        isVegetarian:
          formData.ernaehrungsweise.includes('VEGETARISCH') ||
          formData.ernaehrungsweise.includes('VEGAN'),
        isVegan:       formData.ernaehrungsweise.includes('VEGAN'),
        isLaktosefrei: formData.ernaehrungsweise.includes('LAKTOSEFREI'),
        isGlutenfrei:  formData.ernaehrungsweise.includes('GLUTENFREI'),
        ausschluesse:  formData.ausschluesse,
      }

      const response = await fetch('/api/ernaehrung/plan/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      const json = (await response.json()) as {
        success?: boolean
        data?: GenerateResult
        error?: string
        code?: string
      }

      if (!response.ok || json.success !== true || json.data === undefined) {
        setGenerateError(json.error ?? 'Unbekannter Fehler beim Generieren.')
        return
      }

      setGenerateResult(json.data)
    } catch {
      setGenerateError('Netzwerkfehler. Bitte überprüfe deine Verbindung.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Plan aktivieren ──────────────────────────────────────────

  const handleActivate = async () => {
    if (generateResult === null || isActivating) return
    setIsActivating(true)
    setActivateError(null)

    try {
      const res = await fetch(
        `/api/ernaehrung/plan/${generateResult.planId}/activate`,
        { method: 'POST' },
      )

      if (!res.ok) {
        setActivateError('Plan konnte nicht aktiviert werden.')
        return
      }

      router.push('/dashboard/ernaehrung')
    } catch {
      setActivateError('Netzwerkfehler beim Aktivieren.')
    } finally {
      setIsActivating(false)
    }
  }

  // ── Teilen / Drucken ─────────────────────────────────────────

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    if (typeof navigator.share !== 'undefined') {
      await navigator.share({
        title: generateResult?.title ?? 'Mein Ernährungsplan',
        text:  'Mein persönlicher Ernährungsplan von SportRise',
        url,
      }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  // ── Schritt-Titel ─────────────────────────────────────────────

  const STEP_TITLES: Record<Step, string> = {
    1: 'Körper & Ziel',
    2: 'Aktivität & Sport',
    3: 'Budget & Präferenzen',
    4: 'KI erstellt deinen Plan',
  }

  const canRegenerate =
    generateResult !== null && generateResult.usedThisMonth < 3

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Atmosphärischer Hintergrund für Schritt 4 */}
      {step === 4 && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.08 }}
            loading="lazy"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-gray-950 via-green-950 to-gray-950"
            style={{ opacity: 0.88 }}
          />
        </div>
      )}

      <div className="relative z-10 max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            {step === 4 ? 'Dein Ernährungsplan' : 'Plan erstellen'}
          </h1>
          <p className="text-sm text-white/50 mt-1">{STEP_TITLES[step]}</p>
        </div>

        {/* Rate-Limit-Banner */}
        {isAtLimit && step < 4 && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              Du hast diesen Monat bereits 3 Pläne erstellt. Nächsten Monat kannst
              du neue Pläne generieren.
            </p>
          </div>
        )}

        {/* Aktivierungs-Fehler */}
        {activateError !== null && (
          <div className="mb-4 flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{activateError}</p>
          </div>
        )}

        {/* Fortschrittsbalken */}
        <div className="mb-8">
          <WizardProgress step={step} />
        </div>

        {/* Schritt-Inhalt */}
        <div className="min-h-[420px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {step === 1 && (
                <Step1KoerperZiel
                  formData={formData}
                  setFormData={setFormData}
                  age={age}
                />
              )}
              {step === 2 && (
                <Step2AktivitaetSport
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {step === 3 && (
                <Step3BudgetPraeferenzen
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
              {step === 4 && (
                <Step4Generierung
                  result={generateResult}
                  isGenerating={isGenerating}
                  error={generateError}
                  onRetry={() => void handleGenerate()}
                  onActivate={() => void handleActivate()}
                  onRegenerate={() => {
                    setGenerateResult(null)
                    setTimeout(() => void handleGenerate(), 100)
                  }}
                  isActivating={isActivating}
                  canRegenerate={canRegenerate}
                  copied={copied}
                  onShare={() => void handleShare()}
                  onPrint={handlePrint}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {!(step === 4 && generateResult !== null) && (
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={goBack}
              disabled={step === 4 && (isGenerating || generateResult !== null)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft size={18} />
              <span className="text-sm font-medium">Zurück</span>
            </button>

            {step < 4 && (
              <button
                onClick={goNext}
                disabled={!canProceed() || (isAtLimit && step === 3)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="text-sm">
                  {step === 3 ? 'Plan generieren' : 'Weiter'}
                </span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
