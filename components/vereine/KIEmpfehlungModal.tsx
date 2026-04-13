'use client'

// ─────────────────────────────────────────────────────────────────
// components/vereine/KIEmpfehlungModal.tsx
//
// 3-Schritt-Modal: Präferenzen → Ladescreen → KI-Ergebnisse
//
// Schritt 1: Sport-spezifisches Formular + gemeinsame Filter
// Schritt 2: Animierter Ladescreen (SVG-Ringe + Fortschrittsbalken)
// Schritt 3: 3 Empfehlungskarten mit Match-Score + KI-Analyse
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import * as RadixSlider from '@radix-ui/react-slider'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  BrainCircuit,
  MapPin,
  Euro,
  ChevronRight,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type {
  KIEmpfehlungRequest,
  KIEmpfehlungResponse,
  KIVereinEmpfehlung,
  KIPriority,
} from '@/lib/types/verein'
import { KI_PRIORITY_LABELS } from '@/lib/types/verein'
import {
  FUSSBALL_LIGA_LABELS,
  FUSSBALL_ZIEL_LABELS,
  BASKETBALL_LIGA_LABELS,
  BASKETBALL_ZIEL_LABELS,
  TENNIS_ZIEL_LABELS,
  FUSSBALL_LIGA_NIVEAUS,
  FUSSBALL_ZIELE,
  BASKETBALL_LIGA_NIVEAUS,
  BASKETBALL_ZIELE,
  TENNIS_ZIELE,
  TENNIS_DISZIPLINEN,
  TENNIS_DISZIPLIN_LABELS,
} from '@/lib/sport-profiles'

// ── Typen ─────────────────────────────────────────────────────────

type ModalStep = 'form' | 'loading' | 'results' | 'error'
type SportSlug = 'fussball' | 'tennis' | 'basketball'

interface KIEmpfehlungModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSport?: SportSlug
  userLat: number | null
  userLon: number | null
}

interface FormState {
  sportSlug: SportSlug
  maxDistanceKm: number
  noBudgetLimit: boolean
  maxBudget: number
  priorities: KIPriority[]
  // Fußball
  fussballLiga: string
  fussballZiel: string
  // Tennis
  lkValue: string              // String für leeres Input
  tennisDisziplinen: string[]
  tennisZiel: string
  // Basketball
  basketballLiga: string
  basketballZiel: string
}

const DEFAULT_FORM: FormState = {
  sportSlug: 'fussball',
  maxDistanceKm: 25,
  noBudgetLimit: false,
  maxBudget: 40,
  priorities: [],
  fussballLiga: 'KREISLIGA_A',
  fussballZiel: 'NIVEAU_HALTEN',
  lkValue: '',
  tennisDisziplinen: ['EINZEL'],
  tennisZiel: 'LK_VERBESSERN',
  basketballLiga: 'KREISLIGA',
  basketballZiel: 'LEISTUNG_VERBESSERN',
}

const PRIORITIES: KIPriority[] = [
  'guenstig',
  'professionelles_training',
  'naehe',
  'jugendfoerderung',
  'flexible_zeiten',
]

const LOADING_MESSAGES = [
  'Analysiere deine Vorlieben...',
  'Suche passende Vereine...',
  'Berechne Entfernungen...',
  'Erstelle personalisierte Empfehlungen...',
  'Fast fertig...',
]

// ── Sport SVG Icons ───────────────────────────────────────────────

function FussballIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 4L12.5 7H7.5L10 4Z" fill="currentColor" fillOpacity={0.6} />
      <path d="M10 16L12.5 13H7.5L10 16Z" fill="currentColor" fillOpacity={0.6} />
      <path d="M4 10L7 7.5V12.5L4 10Z" fill="currentColor" fillOpacity={0.6} />
      <path d="M16 10L13 7.5V12.5L16 10Z" fill="currentColor" fillOpacity={0.6} />
      <circle cx="10" cy="10" r="2.5" fill="currentColor" />
    </svg>
  )
}

function TennisIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 6.5 Q10 10 3.5 13.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M16.5 6.5 Q10 10 16.5 13.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function BasketballIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="1" y1="10" x2="19" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="1" x2="10" y2="19" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 1 Q14 5 14 10 Q14 15 10 19" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M10 1 Q6 5 6 10 Q6 15 10 19" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

const SPORT_CONFIG: Record<
  SportSlug,
  { label: string; icon: React.ComponentType<{ size?: number }>; color: string; colorVar: string }
> = {
  fussball: { label: 'Fußball', icon: FussballIcon, color: '#16A34A', colorVar: 'fussball' },
  tennis: { label: 'Tennis', icon: TennisIcon, color: '#C2621A', colorVar: 'tennis' },
  basketball: { label: 'Basketball', icon: BasketballIcon, color: '#EA580C', colorVar: 'basketball' },
}

// ── Match-Score Badge ─────────────────────────────────────────────

function MatchScoreBadge({ score, color }: { score: number; color: string }) {
  const strokeDasharray = 2 * Math.PI * 22
  const strokeDashoffset = strokeDasharray - (score / 100) * strokeDasharray

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg width={64} height={64} viewBox="0 0 64 64">
        {/* Background ring */}
        <circle cx="32" cy="32" r="22" fill="none" stroke="#E4E4E7" strokeWidth="4" />
        {/* Score ring */}
        <circle
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-[#0A0A0A] leading-none">{score}</span>
        <span className="text-[9px] text-[#71717A] leading-none mt-0.5">Match</span>
      </div>
    </div>
  )
}

// ── Haupt-Komponente ──────────────────────────────────────────────

export function KIEmpfehlungModal({
  open,
  onOpenChange,
  defaultSport,
  userLat,
  userLon,
}: KIEmpfehlungModalProps) {
  const [step, setStep] = useState<ModalStep>('form')
  const [form, setForm] = useState<FormState>({
    ...DEFAULT_FORM,
    sportSlug: defaultSport ?? 'fussball',
  })
  const [progress, setProgress] = useState(0)
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
  const [recommendations, setRecommendations] = useState<KIVereinEmpfehlung[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset beim Schließen
  useEffect(() => {
    if (!open) {
      setStep('form')
      setProgress(0)
      setLoadingMsgIndex(0)
      setRecommendations([])
      setErrorMessage(null)
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current)
    }
  }, [open])

  // defaultSport synchronisieren wenn Modal öffnet
  useEffect(() => {
    if (open && defaultSport) {
      setForm((f) => ({ ...f, sportSlug: defaultSport }))
    }
  }, [open, defaultSport])

  const sportCfg = SPORT_CONFIG[form.sportSlug]

  const togglePriority = (p: KIPriority) => {
    setForm((f) => ({
      ...f,
      priorities: f.priorities.includes(p)
        ? f.priorities.filter((x) => x !== p)
        : [...f.priorities, p],
    }))
  }

  const toggleDisziplin = (d: string) => {
    setForm((f) => ({
      ...f,
      tennisDisziplinen: f.tennisDisziplinen.includes(d)
        ? f.tennisDisziplinen.filter((x) => x !== d)
        : [...f.tennisDisziplinen, d],
    }))
  }

  // ── Formular absenden ────────────────────────────────────────
  const handleSubmit = async () => {
    setStep('loading')
    setProgress(0)
    setLoadingMsgIndex(0)

    // Animierter Fortschritt über 3.5s
    const DURATION = 3500
    const TICK = 50
    let elapsed = 0
    loadingIntervalRef.current = setInterval(() => {
      elapsed += TICK
      setProgress(Math.min(Math.round((elapsed / DURATION) * 100), 100))
      setLoadingMsgIndex(
        Math.min(
          Math.floor((elapsed / DURATION) * LOADING_MESSAGES.length),
          LOADING_MESSAGES.length - 1,
        ),
      )
      if (elapsed >= DURATION && loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
      }
    }, TICK)

    const minDelay = new Promise<void>((res) => setTimeout(res, DURATION))

    const lkNum = form.lkValue !== '' ? parseFloat(form.lkValue) : undefined
    const body: KIEmpfehlungRequest = {
      sportSlug: form.sportSlug,
      userLat,
      userLon,
      maxDistanceKm: form.maxDistanceKm,
      maxBudget: form.noBudgetLimit ? null : form.maxBudget,
      priorities: form.priorities,
      ...(form.sportSlug === 'fussball'
        ? { fussballLiga: form.fussballLiga, fussballZiel: form.fussballZiel }
        : form.sportSlug === 'tennis'
          ? {
              lkValue: lkNum !== undefined && !isNaN(lkNum) ? lkNum : undefined,
              tennisDisziplinen: form.tennisDisziplinen,
              tennisZiel: form.tennisZiel,
            }
          : { basketballLiga: form.basketballLiga, basketballZiel: form.basketballZiel }),
    }

    try {
      const [, res] = await Promise.all([
        minDelay,
        fetch('/api/vereine/ki-empfehlung', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      ])

      if (res.status === 429) {
        if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current)
        setErrorMessage('Du hast dein monatliches Limit von 5 KI-Anfragen erreicht.')
        setStep('error')
        return
      }

      if (!res.ok) {
        throw new Error('Serverfehler')
      }

      const data = (await res.json()) as KIEmpfehlungResponse
      setRecommendations(data.recommendations)
      setRemaining(data.remainingMonthlyRequests)
      setStep('results')
    } catch {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current)
      setErrorMessage('Es ist ein Fehler aufgetreten. Bitte versuche es erneut.')
      setStep('error')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed z-50 bg-white outline-none',
            'inset-0 overflow-y-auto',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
            'sm:w-[620px] sm:max-h-[90dvh] sm:rounded-2xl sm:shadow-2xl sm:overflow-y-auto',
          )}
          data-sport={form.sportSlug}
          aria-describedby={undefined}
        >
          {/* ── Schritt 1: Formular ──────────────────────────── */}
          {step === 'form' && (
            <FormStep
              form={form}
              setForm={setForm}
              sportCfg={sportCfg}
              togglePriority={togglePriority}
              toggleDisziplin={toggleDisziplin}
              onClose={() => onOpenChange(false)}
              onSubmit={handleSubmit}
            />
          )}

          {/* ── Schritt 2: Laden ─────────────────────────────── */}
          {step === 'loading' && (
            <LoadingStep progress={progress} msgIndex={loadingMsgIndex} />
          )}

          {/* ── Schritt 3: Ergebnisse ────────────────────────── */}
          {step === 'results' && (
            <ResultsStep
              recommendations={recommendations}
              sport={form.sportSlug}
              remaining={remaining}
              color={sportCfg.color}
              onClose={() => onOpenChange(false)}
              onBack={() => setStep('form')}
            />
          )}

          {/* ── Fehler ───────────────────────────────────────── */}
          {step === 'error' && (
            <ErrorStep
              message={errorMessage ?? 'Unbekannter Fehler'}
              onClose={() => onOpenChange(false)}
              onBack={() => setStep('form')}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Schritt 1: Formular ───────────────────────────────────────────

interface FormStepProps {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  sportCfg: (typeof SPORT_CONFIG)[SportSlug]
  togglePriority: (p: KIPriority) => void
  toggleDisziplin: (d: string) => void
  onClose: () => void
  onSubmit: () => void
}

function FormStep({
  form,
  setForm,
  sportCfg,
  togglePriority,
  toggleDisziplin,
  onClose,
  onSubmit,
}: FormStepProps) {
  return (
    <div className="flex flex-col min-h-full sm:min-h-0">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-4 border-b border-[#E4E4E7]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: sportCfg.color }}
            >
              <Sparkles size={15} />
            </div>
            <div>
              <Dialog.Title className="text-base font-semibold text-[#0A0A0A] leading-none">
                KI-Vereinsempfehlung
              </Dialog.Title>
              <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                Eigene KI · DSGVO-konform · kein externer Bot
              </p>
            </div>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:bg-[#F4F4F5] transition-colors"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Sport-Auswahl */}
        <div>
          <p className="text-sm font-medium text-[#0A0A0A] mb-2">Welche Sportart?</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SPORT_CONFIG) as SportSlug[]).map((slug) => {
              const cfg = SPORT_CONFIG[slug]
              const Icon = cfg.icon
              const isSelected = form.sportSlug === slug
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, sportSlug: slug }))}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all duration-150',
                    isSelected
                      ? 'text-white border-transparent shadow-md'
                      : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                  )}
                  style={isSelected ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                >
                  <Icon size={20} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sport-spezifische Felder */}
        <AnimatePresence mode="wait">
          <motion.div
            key={form.sportSlug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {form.sportSlug === 'fussball' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#52525B] block mb-1.5">
                    Dein aktuelles Liga-Niveau
                  </label>
                  <select
                    value={form.fussballLiga}
                    onChange={(e) => setForm((f) => ({ ...f, fussballLiga: e.target.value }))}
                    className="w-full text-sm border border-[#E4E4E7] rounded-lg px-3 py-2 bg-white text-[#0A0A0A] outline-none focus:border-[var(--sport-primary,#16A34A)]"
                  >
                    {FUSSBALL_LIGA_NIVEAUS.map((l) => (
                      <option key={l} value={l}>{FUSSBALL_LIGA_LABELS[l]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#52525B] block mb-1.5">Dein Ziel</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FUSSBALL_ZIELE.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, fussballZiel: z }))}
                        className={cn(
                          'text-xs py-2 px-3 rounded-lg border text-left transition-colors',
                          form.fussballZiel === z
                            ? 'bg-[var(--sport-primary,#16A34A)] text-white border-[var(--sport-primary,#16A34A)]'
                            : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                        )}
                      >
                        {FUSSBALL_ZIEL_LABELS[z]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.sportSlug === 'tennis' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#52525B] block mb-1.5">
                    DTB-LK Wert{' '}
                    <span className="font-normal text-[#A1A1AA]">(optional, 1.0–25.0)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    step={0.5}
                    placeholder="z.B. 10.5"
                    value={form.lkValue}
                    onChange={(e) => setForm((f) => ({ ...f, lkValue: e.target.value }))}
                    className="w-full sm:w-40 text-sm border border-[#E4E4E7] rounded-lg px-3 py-2 bg-white text-[#0A0A0A] outline-none focus:border-[var(--sport-primary,#C2621A)] [appearance:textfield]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#52525B] block mb-1.5">
                    Disziplinen
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {TENNIS_DISZIPLINEN.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDisziplin(d)}
                        className={cn(
                          'text-xs py-1.5 px-3 rounded-full border transition-colors',
                          form.tennisDisziplinen.includes(d)
                            ? 'bg-[var(--sport-primary,#C2621A)] text-white border-[var(--sport-primary,#C2621A)]'
                            : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                        )}
                      >
                        {TENNIS_DISZIPLIN_LABELS[d]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#52525B] block mb-1.5">Dein Ziel</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TENNIS_ZIELE.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, tennisZiel: z }))}
                        className={cn(
                          'text-xs py-2 px-3 rounded-lg border text-left transition-colors',
                          form.tennisZiel === z
                            ? 'bg-[var(--sport-primary,#C2621A)] text-white border-[var(--sport-primary,#C2621A)]'
                            : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                        )}
                      >
                        {TENNIS_ZIEL_LABELS[z]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.sportSlug === 'basketball' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#52525B] block mb-1.5">
                    Dein aktuelles Liga-Niveau
                  </label>
                  <select
                    value={form.basketballLiga}
                    onChange={(e) => setForm((f) => ({ ...f, basketballLiga: e.target.value }))}
                    className="w-full text-sm border border-[#E4E4E7] rounded-lg px-3 py-2 bg-white text-[#0A0A0A] outline-none focus:border-[var(--sport-primary,#EA580C)]"
                  >
                    {BASKETBALL_LIGA_NIVEAUS.map((l) => (
                      <option key={l} value={l}>{BASKETBALL_LIGA_LABELS[l]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#52525B] block mb-1.5">Dein Ziel</label>
                  <div className="flex flex-col gap-1.5">
                    {BASKETBALL_ZIELE.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, basketballZiel: z }))}
                        className={cn(
                          'text-xs py-2 px-3 rounded-lg border text-left transition-colors',
                          form.basketballZiel === z
                            ? 'bg-[var(--sport-primary,#EA580C)] text-white border-[var(--sport-primary,#EA580C)]'
                            : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                        )}
                      >
                        {BASKETBALL_ZIEL_LABELS[z]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Maximale Entfernung */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[#52525B]">Maximale Entfernung</label>
            <span className="text-xs font-semibold text-[#0A0A0A]">{form.maxDistanceKm} km</span>
          </div>
          <RadixSlider.Root
            min={5}
            max={100}
            step={5}
            value={[form.maxDistanceKm]}
            onValueChange={([val]) => setForm((f) => ({ ...f, maxDistanceKm: val ?? 25 }))}
            className="relative flex items-center select-none w-full h-5"
          >
            <RadixSlider.Track className="bg-[#E4E4E7] relative grow rounded-full h-1.5">
              <RadixSlider.Range
                className="absolute rounded-full h-full"
                style={{ backgroundColor: sportCfg.color }}
              />
            </RadixSlider.Track>
            <RadixSlider.Thumb
              className="block w-4 h-4 bg-white rounded-full shadow border-2 focus:outline-none transition-shadow hover:shadow-md"
              style={{ borderColor: sportCfg.color }}
            />
          </RadixSlider.Root>
        </div>

        {/* Monatliches Budget */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[#52525B]">Monatliches Budget</label>
            <div className="flex items-center gap-2">
              {!form.noBudgetLimit && (
                <span className="text-xs font-semibold text-[#0A0A0A]">{form.maxBudget} €</span>
              )}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, noBudgetLimit: !f.noBudgetLimit }))}
                className={cn(
                  'text-[10px] font-medium px-2 py-1 rounded-full border transition-colors',
                  form.noBudgetLimit
                    ? 'text-white border-transparent'
                    : 'text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                )}
                style={form.noBudgetLimit ? { backgroundColor: sportCfg.color, borderColor: sportCfg.color } : {}}
              >
                Kein Limit
              </button>
            </div>
          </div>
          {!form.noBudgetLimit && (
            <RadixSlider.Root
              min={0}
              max={120}
              step={5}
              value={[form.maxBudget]}
              onValueChange={([val]) => setForm((f) => ({ ...f, maxBudget: val ?? 40 }))}
              className="relative flex items-center select-none w-full h-5"
            >
              <RadixSlider.Track className="bg-[#E4E4E7] relative grow rounded-full h-1.5">
                <RadixSlider.Range
                  className="absolute rounded-full h-full"
                  style={{ backgroundColor: sportCfg.color }}
                />
              </RadixSlider.Track>
              <RadixSlider.Thumb
                className="block w-4 h-4 bg-white rounded-full shadow border-2 focus:outline-none transition-shadow hover:shadow-md"
                style={{ borderColor: sportCfg.color }}
              />
            </RadixSlider.Root>
          )}
        </div>

        {/* Prioritäten */}
        <div>
          <p className="text-xs font-medium text-[#52525B] mb-2">Was ist dir wichtig?</p>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => {
              const isActive = form.priorities.includes(p)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                    isActive
                      ? 'text-white border-transparent'
                      : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                  )}
                  style={isActive ? { backgroundColor: sportCfg.color } : {}}
                >
                  {KI_PRIORITY_LABELS[p]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white px-5 pb-5 pt-3 border-t border-[#E4E4E7]">
        <button
          type="button"
          onClick={onSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white shadow-md transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: sportCfg.color }}
        >
          <Sparkles size={16} />
          KI-Empfehlungen anzeigen
          <ChevronRight size={16} />
        </button>
        <p className="text-center text-[10px] text-[#A1A1AA] mt-2">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </p>
      </div>
    </div>
  )
}

// ── Schritt 2: Ladescreen ─────────────────────────────────────────

function LoadingStep({ progress, msgIndex }: { progress: number; msgIndex: number }) {
  const msg = LOADING_MESSAGES[msgIndex] ?? LOADING_MESSAGES[0]!
  return (
    <div className="flex flex-col items-center justify-center min-h-screen sm:min-h-[480px] bg-[#0A0A0A] px-8 py-10">
      {/* SVG Ringe */}
      <div className="relative w-36 h-36 mb-8">
        {/* Äußerer Ring */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        >
          <svg width="144" height="144" viewBox="0 0 144 144">
            <circle
              cx="72" cy="72" r="66"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            <circle
              cx="72" cy="72" r="66"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="50 365"
            />
          </svg>
        </motion.div>

        {/* Mittlerer Ring */}
        <motion.div
          className="absolute inset-4"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'linear' }}
        >
          <svg width="112" height="112" viewBox="0 0 112 112">
            <circle
              cx="56" cy="56" r="50"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2"
            />
            <circle
              cx="56" cy="56" r="50"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="35 279"
            />
          </svg>
        </motion.div>

        {/* Innerer Ring */}
        <motion.div
          className="absolute inset-8"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="2"
            />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="22 192"
            />
          </svg>
        </motion.div>

        {/* Zentriertes Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BrainCircuit size={32} className="text-white opacity-90" />
        </div>
      </div>

      {/* Rotierender Text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-white/80 text-center mb-6 min-h-[20px]"
        >
          {msg}
        </motion.p>
      </AnimatePresence>

      {/* Fortschrittsbalken */}
      <div className="w-full max-w-xs">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut' }}
          />
        </div>
        <p className="text-[10px] text-white/30 text-center mt-2">
          Eigene KI · DSGVO-konform · kein externer Bot
        </p>
      </div>
    </div>
  )
}

// ── Schritt 3: Ergebnisse ─────────────────────────────────────────

interface ResultsStepProps {
  recommendations: KIVereinEmpfehlung[]
  sport: SportSlug
  remaining: number | null
  color: string
  onClose: () => void
  onBack: () => void
}

function ResultsStep({ recommendations, remaining, color, onClose, onBack }: ResultsStepProps) {
  return (
    <div className="flex flex-col min-h-full sm:min-h-0">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-4 border-b border-[#E4E4E7]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0A0A0A]">
              {recommendations.length > 0
                ? `${recommendations.length} Empfehlung${recommendations.length !== 1 ? 'en' : ''} für dich`
                : 'Keine Vereine gefunden'}
            </h2>
            {remaining !== null && (
              <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                Noch {remaining} KI-{remaining === 1 ? 'Anfrage' : 'Anfragen'} diesen Monat
              </p>
            )}
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:bg-[#F4F4F5] transition-colors"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F4F4F5] flex items-center justify-center mb-3">
              <BrainCircuit size={24} className="text-[#A1A1AA]" />
            </div>
            <p className="text-sm font-medium text-[#52525B]">Keine passenden Vereine</p>
            <p className="text-xs text-[#A1A1AA] mt-1 max-w-xs">
              In deinem Bereich wurden noch keine Vereine eingetragen. Bald verfügbar!
            </p>
          </div>
        ) : (
          recommendations.map((rec, i) => (
            <EmpfehlungsKarte key={rec.verein.id} rec={rec} rank={i + 1} color={color} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white px-5 pb-5 pt-3 border-t border-[#E4E4E7] flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 rounded-xl border border-[#E4E4E7] text-sm text-[#52525B] font-medium hover:border-[#D4D4D8] transition-colors"
        >
          Neue Suche
        </button>
        <Dialog.Close asChild>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            Schließen
          </button>
        </Dialog.Close>
      </div>
    </div>
  )
}

// ── Empfehlungs-Karte ─────────────────────────────────────────────

function EmpfehlungsKarte({
  rec,
  rank,
  color,
}: {
  rec: KIVereinEmpfehlung
  rank: number
  color: string
}) {
  const { verein } = rec

  const feeLabel =
    verein.monthlyFee === null
      ? 'Kostenlos / auf Anfrage'
      : verein.monthlyFee === 0
        ? 'Kostenlos'
        : `${verein.monthlyFee.toFixed(0)} €/Monat`

  const hasAIAnalysis =
    rec.personalizedReason !== null || rec.keyBenefit !== null || rec.nextStep !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: rank * 0.08 }}
      className="rounded-xl border border-[#E4E4E7] bg-white overflow-hidden"
    >
      {/* Rang-Streifen */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
        }}
      />

      <div className="p-4">
        {/* Header: Logo + Score + Info */}
        <div className="flex items-start gap-3">
          {/* Logo oder Initialen */}
          <div
            className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {verein.name
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? '')
              .join('')}
          </div>

          {/* Name + Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[14px] font-semibold text-[#0A0A0A] leading-tight">
                {verein.name}
              </h3>
              {verein.isVerified && (
                <ShieldCheck size={13} style={{ color }} className="flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-[#71717A]">
                <MapPin size={10} />
                {verein.city}
                {verein.distanceKm !== null ? ` · ${verein.distanceKm.toFixed(1)} km` : ''}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#71717A]">
                <Euro size={10} />
                {feeLabel}
              </span>
            </div>
          </div>

          {/* Match-Score */}
          <MatchScoreBadge score={rec.matchScore} color={color} />
        </div>

        {/* KI-Analyse Box */}
        {hasAIAnalysis && (
          <div
            className="mt-3 p-3 rounded-lg"
            style={{ backgroundColor: `${color}12` }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <BrainCircuit size={12} style={{ color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                KI-Analyse
              </span>
            </div>

            {rec.personalizedReason !== null && (
              <p className="text-xs text-[#0A0A0A] leading-relaxed mb-2">
                {rec.personalizedReason}
              </p>
            )}

            {rec.keyBenefit !== null && (
              <div className="flex items-start gap-1.5 mb-1">
                <Lightbulb size={11} className="flex-shrink-0 mt-0.5" style={{ color }} />
                <span className="text-[11px] text-[#52525B]">{rec.keyBenefit}</span>
              </div>
            )}

            {rec.nextStep !== null && (
              <div className="flex items-start gap-1.5">
                <ArrowRight size={11} className="flex-shrink-0 mt-0.5" style={{ color }} />
                <span className="text-[11px] text-[#52525B]">{rec.nextStep}</span>
              </div>
            )}
          </div>
        )}

        {/* Verein ansehen Link */}
        <Link
          href={`/vereine/${verein.slug}`}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors hover:opacity-90"
          style={{ borderColor: color, color }}
        >
          Verein ansehen
          <ChevronRight size={12} />
        </Link>
      </div>
    </motion.div>
  )
}

// ── Fehler-Schritt ────────────────────────────────────────────────

function ErrorStep({
  message,
  onClose,
  onBack,
}: {
  message: string
  onClose: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen sm:min-h-[380px] px-8 py-10">
      <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-4">
        <X size={24} className="text-red-500" />
      </div>
      <p className="text-sm font-medium text-[#0A0A0A] text-center mb-1">Fehler aufgetreten</p>
      <p className="text-xs text-[#71717A] text-center mb-6 max-w-xs">{message}</p>
      <div className="flex gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 rounded-xl border border-[#E4E4E7] text-sm text-[#52525B] font-medium hover:border-[#D4D4D8] transition-colors"
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl bg-[#0A0A0A] text-sm text-white font-medium hover:bg-[#1A1A1A] transition-colors"
        >
          Schließen
        </button>
      </div>
    </div>
  )
}
