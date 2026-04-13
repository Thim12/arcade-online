'use client'

// ─────────────────────────────────────────────────────────────────
// components/turniere/TurnierSucheClient.tsx
//
// Haupt-Client-Komponente für /turniere
// Enthält: Hero, Filter, Infinite Scroll Liste, Kalender-Ansicht
// ─────────────────────────────────────────────────────────────────

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from 'react'
import {
  SlidersHorizontal,
  Sparkles,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LocateFixed,
  List,
  CalendarDays,
  User,
  Users,
  Shield,
  Shuffle,
  Search,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import * as RadixSlider from '@radix-ui/react-slider'
import * as Switch from '@radix-ui/react-switch'
import * as Select from '@radix-ui/react-select'
import { cn } from '@/lib/utils/cn'
import type {
  TurnierFilters,
  TurnierListItem,
  TurnierApiResponse,
  TurnierSportFilter,
  TurnierFormat,
  TurnierFeeFilter,
  TurnierSortOption,
} from '@/lib/types/turnier'
import {
  DEFAULT_TURNIER_FILTERS,
  TURNIER_SPORT_FILTER_LABELS,
  TURNIER_FORMAT_LABELS,
  TURNIER_FEE_LABELS,
  TURNIER_SORT_LABELS,
} from '@/lib/types/turnier'
import { TurnierCard, TurnierCardSkeleton } from './TurnierCard'

// ── Konstanten ───────────────────────────────────────────────────

const INITIAL_LIMIT = 20
const MORE_LIMIT = 10
const SPORT_PILLS: TurnierSportFilter[] = ['alle', 'fussball', 'tennis', 'basketball']

// ── Fetch-Helfer ─────────────────────────────────────────────────

async function fetchTurniere(
  filters: TurnierFilters,
  page: number,
  limit: number,
): Promise<TurnierApiResponse> {
  const params = new URLSearchParams()
  params.set('sport', filters.sport)
  params.set('ageMin', String(filters.ageMin))
  params.set('ageMax', String(filters.ageMax))
  params.set('maxFee', filters.fee)
  params.set('radius', String(filters.radius))
  params.set('verified', String(filters.onlyVerified))
  params.set('freeSpots', String(filters.onlyFreeSpots))
  params.set('sort', filters.sort)
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.userLat !== null) params.set('userLat', String(filters.userLat))
  if (filters.userLon !== null) params.set('userLon', String(filters.userLon))
  if (filters.formats.length > 0) params.set('format', filters.formats.join(','))

  const res = await fetch(`/api/turniere?${params.toString()}`)
  if (!res.ok) throw new Error('Turniersuche fehlgeschlagen')
  return res.json() as Promise<TurnierApiResponse>
}

async function fetchTurniereForCalendar(
  filters: TurnierFilters,
  year: number,
  month: number,
): Promise<TurnierApiResponse> {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const calFilters: TurnierFilters = {
    ...filters,
    dateFrom: firstDay.toISOString().split('T')[0] ?? null,
    dateTo: lastDay.toISOString().split('T')[0] ?? null,
  }
  return fetchTurniere(calFilters, 1, 200)
}

// ── Quick-Date-Buttons ────────────────────────────────────────────

function getQuickDateRange(preset: 'woche' | 'monat' | 'drei_monate'): { from: string; to: string } {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const from = fmt(now)
  let to: Date
  switch (preset) {
    case 'woche':
      to = new Date(now)
      to.setDate(now.getDate() + 7)
      break
    case 'monat':
      to = new Date(now)
      to.setMonth(now.getMonth() + 1)
      break
    case 'drei_monate':
      to = new Date(now)
      to.setMonth(now.getMonth() + 3)
      break
  }
  return { from, to: fmt(to) }
}

// ── Aktive-Filter-Chips ───────────────────────────────────────────

type ChipKey =
  | 'dateFrom'
  | 'dateTo'
  | 'ageRange'
  | `format:${TurnierFormat}`
  | `fee:${TurnierFeeFilter}`
  | 'onlyVerified'
  | 'onlyFreeSpots'
  | 'radius'

interface ActiveFilterChipsProps {
  filters: TurnierFilters
  onRemove: (key: ChipKey) => void
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function fmtDateLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}. ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function ActiveFilterChips({ filters, onRemove }: ActiveFilterChipsProps) {
  const chips: { label: string; key: ChipKey }[] = []
  if (filters.dateFrom) chips.push({ label: `Ab ${fmtDateLabel(filters.dateFrom)}`, key: 'dateFrom' })
  if (filters.dateTo) chips.push({ label: `Bis ${fmtDateLabel(filters.dateTo)}`, key: 'dateTo' })
  if (filters.ageMin !== DEFAULT_TURNIER_FILTERS.ageMin || filters.ageMax !== DEFAULT_TURNIER_FILTERS.ageMax) {
    chips.push({ label: `${filters.ageMin}–${filters.ageMax} Jahre`, key: 'ageRange' })
  }
  for (const fmt of filters.formats) {
    chips.push({ label: TURNIER_FORMAT_LABELS[fmt], key: `format:${fmt}` })
  }
  if (filters.fee !== 'beliebig') chips.push({ label: TURNIER_FEE_LABELS[filters.fee], key: `fee:${filters.fee}` })
  if (filters.onlyVerified) chips.push({ label: 'Nur offen', key: 'onlyVerified' })
  if (filters.onlyFreeSpots) chips.push({ label: 'Freie Plätze', key: 'onlyFreeSpots' })
  if (filters.radius !== DEFAULT_TURNIER_FILTERS.radius) chips.push({ label: `${filters.radius} km`, key: 'radius' })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className="flex items-center gap-1 text-xs bg-[#DCFCE7] text-[#16A34A] px-2.5 py-1 rounded-full hover:bg-[#BBF7D0] transition-colors"
        >
          {chip.label}
          <X size={11} />
        </button>
      ))}
    </div>
  )
}

// ── Kalender-Ansicht ──────────────────────────────────────────────

interface KalenderAnsichtProps {
  turniere: TurnierListItem[]
  year: number
  month: number
  isLoading: boolean
  onPrev: () => void
  onNext: () => void
}

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONAT_LANG = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function KalenderAnsicht({ turniere, year, month, isLoading, onPrev, onNext }: KalenderAnsichtProps) {
  const [popoverDay, setPopoverDay] = useState<number | null>(null)

  const firstDay = new Date(year, month, 1)
  // Montag = 0, Sonntag = 6
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Turniere pro Tag gruppieren
  const byDay: Record<number, TurnierListItem[]> = {}
  for (const t of turniere) {
    const start = new Date(t.startDate)
    const end = new Date(t.endDate)
    // Alle Tage im Monat die dieses Turnier berührt
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(year, month, d)
      if (cur >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
          cur <= new Date(end.getFullYear(), end.getMonth(), end.getDate())) {
        if (!byDay[d]) byDay[d] = []
        byDay[d].push(t)
      }
    }
  }

  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      {/* Monat-Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 rounded-lg border border-[#E4E4E7] hover:bg-[#F4F4F5] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-sm font-semibold text-[#0A0A0A]">
          {MONAT_LANG[month]} {year}
        </h2>
        <button
          type="button"
          onClick={onNext}
          className="p-1.5 rounded-lg border border-[#E4E4E7] hover:bg-[#F4F4F5] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Wochentage-Header */}
      <div className="grid grid-cols-7 mb-1">
        {WOCHENTAGE.map((wd) => (
          <div key={wd} className="text-center text-[11px] font-medium text-[#A1A1AA] py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Kalender-Grid */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-[#E4E4E7] border border-[#E4E4E7] rounded-lg overflow-hidden">
          {cells.map((day, idx) => {
            const dayTurniere = day !== null ? (byDay[day] ?? []) : []
            const isToday =
              day !== null &&
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === day

            return (
              <div
                key={idx}
                className={cn(
                  'bg-white min-h-[64px] p-1.5 relative',
                  day === null && 'bg-[#FAFAFA]',
                  day !== null && dayTurniere.length > 0 && 'cursor-pointer hover:bg-[#F4F4F5]',
                )}
                onClick={() => {
                  if (day !== null && dayTurniere.length > 0) {
                    setPopoverDay(popoverDay === day ? null : day)
                  }
                }}
              >
                {day !== null && (
                  <>
                    <span
                      className={cn(
                        'text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full',
                        isToday
                          ? 'bg-[#16A34A] text-white'
                          : 'text-[#52525B]',
                      )}
                    >
                      {day}
                    </span>
                    {/* Dots */}
                    {dayTurniere.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {dayTurniere.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: t.sport.colorPrimary }}
                          />
                        ))}
                        {dayTurniere.length > 3 && (
                          <span className="text-[9px] text-[#A1A1AA]">+{dayTurniere.length - 3}</span>
                        )}
                      </div>
                    )}
                    {/* Mini-Popover */}
                    {popoverDay === day && dayTurniere.length > 0 && (
                      <div
                        className="absolute z-20 top-full left-0 mt-1 w-56 bg-white border border-[#E4E4E7] rounded-lg shadow-lg p-2 space-y-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {dayTurniere.slice(0, 5).map((t) => (
                          <a
                            key={t.id}
                            href={`/turniere/${t.slug}`}
                            className="block text-[11px] text-[#0A0A0A] hover:text-[#16A34A] truncate py-0.5 px-1 rounded hover:bg-[#F4F4F5]"
                          >
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                              style={{ backgroundColor: t.sport.colorPrimary }}
                            />
                            {t.name}
                          </a>
                        ))}
                        {dayTurniere.length > 5 && (
                          <p className="text-[10px] text-[#A1A1AA] px-1">
                            +{dayTurniere.length - 5} weitere
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────────

interface TurnierSucheClientProps {
  isLoggedIn: boolean
  primarySport: string | null
  userBirthYear: number | null
}

export function TurnierSucheClient({ isLoggedIn, primarySport, userBirthYear }: TurnierSucheClientProps) {
  // ── State ──────────────────────────────────────────────────────
  const defaultFilters = userBirthYear
    ? {
        ...DEFAULT_TURNIER_FILTERS,
        ageMin: Math.max(0, new Date().getFullYear() - userBirthYear - 2),
        ageMax: Math.min(99, new Date().getFullYear() - userBirthYear + 2),
      }
    : DEFAULT_TURNIER_FILTERS

  const [filters, setFilters] = useState<TurnierFilters>(defaultFilters)
  const [turniere, setTurniere] = useState<TurnierListItem[]>([])
  const [calendarTurniere, setCalendarTurniere] = useState<TurnierListItem[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false)
  const [view, setView] = useState<'list' | 'kalender'>('list')
  const [filterOpen, setFilterOpen] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const now = new Date()
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth())
  const [, startTransition] = useTransition()

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // ── Anzahl aktiver Filter ──────────────────────────────────────
  const activeFilterCount = [
    filters.dateFrom ? 1 : 0,
    filters.dateTo ? 1 : 0,
    filters.ageMin !== DEFAULT_TURNIER_FILTERS.ageMin || filters.ageMax !== DEFAULT_TURNIER_FILTERS.ageMax ? 1 : 0,
    filters.formats.length,
    filters.fee !== 'beliebig' ? 1 : 0,
    filters.onlyVerified ? 1 : 0,
    filters.onlyFreeSpots ? 1 : 0,
    filters.radius !== DEFAULT_TURNIER_FILTERS.radius ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  // ── Lade-Funktion ─────────────────────────────────────────────
  const loadTurniere = useCallback(async (f: TurnierFilters) => {
    setIsLoading(true)
    setCurrentPage(1)
    try {
      const data = await fetchTurniere(f, 1, INITIAL_LIMIT)
      setTurniere(data.turniere)
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch {
      setTurniere([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Mehr laden ─────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return
    setIsFetchingMore(true)
    const nextPage = currentPage + 1
    try {
      const data = await fetchTurniere(filters, nextPage, MORE_LIMIT)
      setTurniere((prev) => [...prev, ...data.turniere])
      setHasMore(data.hasMore)
      setCurrentPage(nextPage)
    } catch {
      // Bestehende Ergebnisse behalten
    } finally {
      setIsFetchingMore(false)
    }
  }, [isFetchingMore, hasMore, currentPage, filters])

  // ── Kalender laden ─────────────────────────────────────────────
  const loadCalendar = useCallback(async (f: TurnierFilters, y: number, m: number) => {
    setIsLoadingCalendar(true)
    try {
      const data = await fetchTurniereForCalendar(f, y, m)
      setCalendarTurniere(data.turniere)
    } catch {
      setCalendarTurniere([])
    } finally {
      setIsLoadingCalendar(false)
    }
  }, [])

  // ── Effect: Filter-Änderung ────────────────────────────────────
  useEffect(() => {
    startTransition(() => {
      void loadTurniere(filters)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.sport,
    filters.dateFrom,
    filters.dateTo,
    filters.ageMin,
    filters.ageMax,
    filters.formats,
    filters.fee,
    filters.radius,
    filters.onlyVerified,
    filters.onlyFreeSpots,
    filters.sort,
    filters.userLat,
    filters.userLon,
  ])

  // ── Effect: Kalender-Änderung ──────────────────────────────────
  useEffect(() => {
    if (view === 'kalender') {
      void loadCalendar(filters, calendarYear, calendarMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, calendarYear, calendarMonth, filters.sport, filters.userLat, filters.userLon])

  // ── Effect: Infinite Scroll ────────────────────────────────────
  useEffect(() => {
    if (view !== 'list') return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetchingMore) {
          void loadMore()
        }
      },
      { threshold: 0.1 },
    )
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }
    return () => observerRef.current?.disconnect()
  }, [hasMore, isFetchingMore, loadMore, view])

  // ── Geolocation ───────────────────────────────────────────────
  const handleLocate = () => {
    if (!navigator.geolocation) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFilters((f) => ({
          ...f,
          userLat: pos.coords.latitude,
          userLon: pos.coords.longitude,
        }))
        setIsLocating(false)
      },
      () => setIsLocating(false),
      { timeout: 8000 },
    )
  }

  // ── Filter-Helfer ─────────────────────────────────────────────
  const updateFilter = <K extends keyof TurnierFilters>(key: K, value: TurnierFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const toggleFormat = (fmt: TurnierFormat) => {
    setFilters((f) => ({
      ...f,
      formats: f.formats.includes(fmt)
        ? f.formats.filter((x) => x !== fmt)
        : [...f.formats, fmt],
    }))
  }

  const removeActiveFilter = (key: ChipKey) => {
    if (key.startsWith('format:')) {
      const fmt = key.replace('format:', '') as TurnierFormat
      setFilters((f) => ({ ...f, formats: f.formats.filter((x) => x !== fmt) }))
    } else if (key.startsWith('fee:')) {
      updateFilter('fee', 'beliebig')
    } else {
      switch (key) {
        case 'dateFrom':
          updateFilter('dateFrom', null)
          break
        case 'dateTo':
          updateFilter('dateTo', null)
          break
        case 'ageRange':
          setFilters((f) => ({ ...f, ageMin: 0, ageMax: 99 }))
          break
        case 'onlyVerified':
          updateFilter('onlyVerified', false)
          break
        case 'onlyFreeSpots':
          updateFilter('onlyFreeSpots', false)
          break
        case 'radius':
          updateFilter('radius', DEFAULT_TURNIER_FILTERS.radius)
          break
      }
    }
  }

  // ── data-sport Attribut ────────────────────────────────────────
  const dataSport = filters.sport !== 'alle' ? filters.sport : undefined

  // ── KI-Match-Banner anzeigen ───────────────────────────────────
  const showKiBanner = isLoggedIn && !isLoading && turniere.length > 0 && primarySport !== null

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="min-h-[100dvh] bg-[#FAFAFA]"
      {...(dataSport ? { 'data-sport': dataSport } : {})}
    >
      {/* ── Hero-Header ───────────────────────────────────────── */}
      <div
        className="relative h-[200px] overflow-hidden"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dunkles Overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Blob-Animationen */}
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#16A34A]/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-10 right-10 w-48 h-48 rounded-full bg-[#4ADE80]/15 blur-2xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Inhalt */}
        <div className="relative z-10 h-full flex flex-col justify-center px-4 sm:px-6 max-w-screen-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Turniersuche.
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Finde Turniere in deiner Nähe
          </p>
          {/* Trust-Banner */}
          <div className="mt-3 flex items-center gap-1.5 text-white/60 text-[11px]">
            <Clock size={12} />
            Täglich aktualisiert von unserer eigenen TurnierKI — kein externer Bot
          </div>
        </div>
      </div>

      {/* ── Sticky Filter-Bar ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-sm border-b border-[#E4E4E7]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-3 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sport-Pills */}
            <div className="flex gap-1.5 flex-wrap">
              {SPORT_PILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateFilter('sport', s)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150',
                    filters.sport === s
                      ? 'bg-[var(--sport-primary,#16A34A)] text-white border-[var(--sport-primary,#16A34A)] shadow-sm'
                      : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8] hover:text-[#0A0A0A]',
                  )}
                >
                  {TURNIER_SPORT_FILTER_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* View-Toggle */}
              <div className="flex rounded-lg border border-[#E4E4E7] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors',
                    view === 'list'
                      ? 'bg-[var(--sport-primary,#16A34A)] text-white'
                      : 'bg-white text-[#52525B] hover:bg-[#F4F4F5]',
                  )}
                >
                  <List size={13} />
                  Liste
                </button>
                <div className="w-px bg-[#E4E4E7]" />
                <button
                  type="button"
                  onClick={() => setView('kalender')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors',
                    view === 'kalender'
                      ? 'bg-[var(--sport-primary,#16A34A)] text-white'
                      : 'bg-white text-[#52525B] hover:bg-[#F4F4F5]',
                  )}
                >
                  <CalendarDays size={13} />
                  Kalender
                </button>
              </div>

              {/* Filter-Button */}
              <button
                type="button"
                onClick={() => setFilterOpen((p) => !p)}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
                  filterOpen || activeFilterCount > 0
                    ? 'bg-[var(--sport-primary,#16A34A)] text-white border-[var(--sport-primary,#16A34A)]'
                    : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                )}
              >
                <SlidersHorizontal size={13} />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 bg-white/30 rounded-full px-1 text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Standort-Button */}
              <button
                type="button"
                onClick={handleLocate}
                disabled={isLocating}
                title="Meinen Standort verwenden"
                className={cn(
                  'p-1.5 rounded-lg border transition-colors',
                  filters.userLat !== null
                    ? 'text-[var(--sport-primary,#16A34A)] bg-[var(--sport-light,#DCFCE7)] border-[var(--sport-primary,#16A34A)]'
                    : 'text-[#52525B] bg-white border-[#E4E4E7] hover:border-[#D4D4D8]',
                  isLocating && 'animate-pulse',
                )}
              >
                <LocateFixed size={14} />
              </button>
            </div>
          </div>

          {/* DSGVO-Hinweis */}
          <p className="mt-1.5 text-[10px] text-[#A1A1AA]">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </p>
        </div>

        {/* Filter-Accordion */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-[#E4E4E7] bg-white"
            >
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
                <Accordion.Root type="multiple" className="space-y-3">

                  {/* Datumsbereich */}
                  <Accordion.Item value="datum" className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                    <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors [&[data-state=open]>svg]:rotate-180">
                      Datumsbereich
                      <ChevronDown size={14} className="text-[#71717A] transition-transform duration-200" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-3 pb-3 pt-2">
                      <div className="flex flex-wrap gap-3 items-end">
                        <div>
                          <label className="text-xs text-[#71717A] mb-1 block">Von</label>
                          <input
                            type="date"
                            value={filters.dateFrom ?? ''}
                            onChange={(e) => updateFilter('dateFrom', e.target.value || null)}
                            className="text-sm border border-[#E4E4E7] rounded-lg px-3 py-1.5 bg-white text-[#0A0A0A] outline-none focus:border-[#16A34A]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#71717A] mb-1 block">Bis</label>
                          <input
                            type="date"
                            value={filters.dateTo ?? ''}
                            onChange={(e) => updateFilter('dateTo', e.target.value || null)}
                            className="text-sm border border-[#E4E4E7] rounded-lg px-3 py-1.5 bg-white text-[#0A0A0A] outline-none focus:border-[#16A34A]"
                          />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {(
                            [
                              { label: 'Diese Woche', preset: 'woche' },
                              { label: 'Dieser Monat', preset: 'monat' },
                              { label: 'Nächste 3 Monate', preset: 'drei_monate' },
                            ] as const
                          ).map(({ label, preset }) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                const { from, to } = getQuickDateRange(preset)
                                setFilters((f) => ({ ...f, dateFrom: from, dateTo: to }))
                              }}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#D4D4D8] transition-colors"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  {/* Altersklasse */}
                  <Accordion.Item value="alter" className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                    <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors [&[data-state=open]>svg]:rotate-180">
                      Altersklasse
                      <ChevronDown size={14} className="text-[#71717A] transition-transform duration-200" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-3 pb-4 pt-2">
                      <div className="px-1">
                        <div className="flex justify-between text-xs text-[#52525B] mb-3">
                          <span>{filters.ageMin} Jahre</span>
                          <span>{filters.ageMax} Jahre</span>
                        </div>
                        <RadixSlider.Root
                          min={0}
                          max={99}
                          step={1}
                          value={[filters.ageMin, filters.ageMax]}
                          onValueChange={([min, max]) => {
                            setFilters((f) => ({ ...f, ageMin: min ?? 0, ageMax: max ?? 99 }))
                          }}
                          className="relative flex items-center select-none w-full h-5"
                        >
                          <RadixSlider.Track className="bg-[#E4E4E7] relative grow rounded-full h-1.5">
                            <RadixSlider.Range className="absolute bg-[var(--sport-primary,#16A34A)] rounded-full h-full" />
                          </RadixSlider.Track>
                          <RadixSlider.Thumb className="block w-4 h-4 bg-white border-2 border-[var(--sport-primary,#16A34A)] rounded-full shadow hover:shadow-md focus:outline-none" />
                          <RadixSlider.Thumb className="block w-4 h-4 bg-white border-2 border-[var(--sport-primary,#16A34A)] rounded-full shadow hover:shadow-md focus:outline-none" />
                        </RadixSlider.Root>
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  {/* Format */}
                  <Accordion.Item value="format" className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                    <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors [&[data-state=open]>svg]:rotate-180">
                      Format
                      <ChevronDown size={14} className="text-[#71717A] transition-transform duration-200" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-3 pb-3 pt-2">
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            { fmt: 'EINZEL' as TurnierFormat, icon: <User size={12} /> },
                            { fmt: 'DOPPEL' as TurnierFormat, icon: <Users size={12} /> },
                            { fmt: 'MANNSCHAFT' as TurnierFormat, icon: <Shield size={12} /> },
                            { fmt: 'GEMISCHT' as TurnierFormat, icon: <Shuffle size={12} /> },
                          ]
                        ).map(({ fmt, icon }) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => toggleFormat(fmt)}
                            className={cn(
                              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                              filters.formats.includes(fmt)
                                ? 'bg-[var(--sport-primary,#16A34A)] text-white border-[var(--sport-primary,#16A34A)]'
                                : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                            )}
                          >
                            {icon}
                            {TURNIER_FORMAT_LABELS[fmt]}
                          </button>
                        ))}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  {/* Eintrittsgeld */}
                  <Accordion.Item value="geld" className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                    <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors [&[data-state=open]>svg]:rotate-180">
                      Eintrittsgeld
                      <ChevronDown size={14} className="text-[#71717A] transition-transform duration-200" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-3 pb-3 pt-2">
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(TURNIER_FEE_LABELS) as TurnierFeeFilter[]).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => updateFilter('fee', f)}
                            className={cn(
                              'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                              filters.fee === f
                                ? 'bg-[var(--sport-primary,#16A34A)] text-white border-[var(--sport-primary,#16A34A)]'
                                : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                            )}
                          >
                            {TURNIER_FEE_LABELS[f]}
                          </button>
                        ))}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  {/* Entfernung */}
                  <Accordion.Item value="entfernung" className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                    <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors [&[data-state=open]>svg]:rotate-180">
                      Entfernung
                      <ChevronDown size={14} className="text-[#71717A] transition-transform duration-200" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-3 pb-4 pt-2">
                      <div
                        className={cn(
                          'px-1',
                          filters.userLat === null && 'opacity-50 pointer-events-none',
                        )}
                      >
                        <div className="flex justify-between text-xs text-[#52525B] mb-3">
                          <span>10 km</span>
                          <span className="font-medium">{filters.radius} km</span>
                          <span>200 km</span>
                        </div>
                        <RadixSlider.Root
                          min={10}
                          max={200}
                          step={5}
                          value={[filters.radius]}
                          onValueChange={([val]) => updateFilter('radius', val ?? 50)}
                          disabled={filters.userLat === null}
                          className="relative flex items-center select-none w-full h-5"
                        >
                          <RadixSlider.Track className="bg-[#E4E4E7] relative grow rounded-full h-1.5">
                            <RadixSlider.Range className="absolute bg-[var(--sport-primary,#16A34A)] rounded-full h-full" />
                          </RadixSlider.Track>
                          <RadixSlider.Thumb className="block w-4 h-4 bg-white border-2 border-[var(--sport-primary,#16A34A)] rounded-full shadow hover:shadow-md focus:outline-none" />
                        </RadixSlider.Root>
                        {filters.userLat === null && (
                          <p className="text-xs text-[#A1A1AA] mt-2">
                            Standort aktivieren um Entfernung zu filtern
                          </p>
                        )}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  {/* Toggles + Sortierung */}
                  <div className="flex flex-wrap gap-4 items-center px-1">
                    {/* Nur freie Plätze */}
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={filters.onlyFreeSpots}
                        onCheckedChange={(v) => updateFilter('onlyFreeSpots', v)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                          filters.onlyFreeSpots ? 'bg-[var(--sport-primary,#16A34A)]' : 'bg-[#D4D4D8]',
                        )}
                      >
                        <Switch.Thumb className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
                      </Switch.Root>
                      <span
                        className="text-sm text-[#52525B] cursor-pointer"
                        onClick={() => updateFilter('onlyFreeSpots', !filters.onlyFreeSpots)}
                      >
                        Nur freie Plätze
                      </span>
                    </div>

                    {/* Nur verifizierte */}
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={filters.onlyVerified}
                        onCheckedChange={(v) => updateFilter('onlyVerified', v)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                          filters.onlyVerified ? 'bg-[var(--sport-primary,#16A34A)]' : 'bg-[#D4D4D8]',
                        )}
                      >
                        <Switch.Thumb className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
                      </Switch.Root>
                      <span
                        className="text-sm text-[#52525B] cursor-pointer"
                        onClick={() => updateFilter('onlyVerified', !filters.onlyVerified)}
                      >
                        Nur verifizierte Turniere
                      </span>
                    </div>

                    {/* Sortierung */}
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-[#52525B]">Sortierung:</span>
                      <Select.Root
                        value={filters.sort}
                        onValueChange={(v) => updateFilter('sort', v as TurnierSortOption)}
                      >
                        <Select.Trigger className="flex items-center gap-1.5 text-sm border border-[#E4E4E7] rounded-lg px-3 py-1.5 bg-white text-[#0A0A0A] hover:border-[#D4D4D8] outline-none">
                          <Select.Value />
                          <Select.Icon>
                            <ChevronDown size={12} className="text-[#71717A]" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="bg-white border border-[#E4E4E7] rounded-lg shadow-lg z-50 overflow-hidden">
                            <Select.Viewport className="p-1">
                              {(Object.keys(TURNIER_SORT_LABELS) as TurnierSortOption[]).map((opt) => (
                                <Select.Item
                                  key={opt}
                                  value={opt}
                                  className="flex items-center px-3 py-2 text-sm text-[#0A0A0A] rounded-md cursor-pointer hover:bg-[#F4F4F5] outline-none data-[highlighted]:bg-[#F4F4F5]"
                                >
                                  <Select.ItemText>{TURNIER_SORT_LABELS[opt]}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  </div>
                </Accordion.Root>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Haupt-Content ─────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">

        {/* KI-Match-Banner */}
        <AnimatePresence>
          {showKiBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -8 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#DCFCE7] to-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-2.5 text-sm text-[#15803D]">
                <Sparkles size={15} className="flex-shrink-0" />
                <span className="font-medium">
                  Turniere passend zu deinem Sport ({primarySport}) — Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ergebnis-Counter + aktive Filter-Chips */}
        {view === 'list' && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-sm text-[#71717A]">
              {isLoading ? (
                <span className="inline-block w-24 h-4 bg-[#E4E4E7] rounded animate-pulse" />
              ) : (
                <>
                  <span className="font-semibold text-[#0A0A0A]">{total}</span>{' '}
                  {total === 1 ? 'Turnier' : 'Turniere'} gefunden
                </>
              )}
            </p>
          </div>
        )}

        <ActiveFilterChips filters={filters} onRemove={removeActiveFilter} />

        {/* ── Listen-Ansicht ──────────────────────────────────── */}
        {view === 'list' && (
          <div className="mt-3 space-y-2 pb-10">
            {isLoading ? (
              <>
                <TurnierCardSkeleton />
                <TurnierCardSkeleton />
                <TurnierCardSkeleton />
                <TurnierCardSkeleton />
              </>
            ) : turniere.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F4F5] flex items-center justify-center mb-3">
                  <Search size={24} className="text-[#A1A1AA]" />
                </div>
                <p className="text-sm font-medium text-[#52525B]">Keine Turniere gefunden</p>
                <p className="text-xs text-[#A1A1AA] mt-1 max-w-xs">
                  Versuche andere Filter oder erweitere den Zeitraum.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {turniere.map((t) => (
                  <TurnierCard key={t.id} turnier={t} />
                ))}
              </AnimatePresence>
            )}

            {/* Sentinel für Infinite Scroll */}
            <div ref={sentinelRef} className="h-4" />

            {isFetchingMore && (
              <div className="space-y-2 mt-2">
                <TurnierCardSkeleton />
                <TurnierCardSkeleton />
              </div>
            )}

            {!isLoading && !isFetchingMore && turniere.length >= total && turniere.length > 0 && (
              <p className="text-xs text-center text-[#A1A1AA] py-4">
                Alle {total} Turniere geladen.
              </p>
            )}
          </div>
        )}

        {/* ── Kalender-Ansicht ────────────────────────────────── */}
        {view === 'kalender' && (
          <div className="mt-3 pb-10">
            <KalenderAnsicht
              turniere={calendarTurniere}
              year={calendarYear}
              month={calendarMonth}
              isLoading={isLoadingCalendar}
              onPrev={() => {
                if (calendarMonth === 0) {
                  setCalendarYear((y) => y - 1)
                  setCalendarMonth(11)
                } else {
                  setCalendarMonth((m) => m - 1)
                }
              }}
              onNext={() => {
                if (calendarMonth === 11) {
                  setCalendarYear((y) => y + 1)
                  setCalendarMonth(0)
                } else {
                  setCalendarMonth((m) => m + 1)
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
