'use client'

// ─────────────────────────────────────────────────────────────────
// components/vereine/VereinSucheClient.tsx
//
// Haupt-Client-Komponente für /vereine
// Enthält: Suche, Filter, Karte, Liste, Infinite Scroll
// ─────────────────────────────────────────────────────────────────

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useTransition,
} from 'react'
import {
  Search,
  LocateFixed,
  X,
  Sparkles,
  PlusCircle,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  ChevronDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import * as RadixSlider from '@radix-ui/react-slider'
import * as Switch from '@radix-ui/react-switch'
import * as Select from '@radix-ui/react-select'
import { cn } from '@/lib/utils/cn'
import type {
  VereinFilters,
  VereinListItem,
  VereinApiResponse,
  SportFilter,
  PriceCategory,
  SortOption,
} from '@/lib/types/verein'
import {
  DEFAULT_FILTERS,
  SPORT_FILTER_LABELS,
  PRICE_CATEGORY_LABELS,
  RADIUS_OPTIONS,
  SORT_OPTION_LABELS,
} from '@/lib/types/verein'
import { VereinCard, VereinCardSkeleton } from './VereinCard'
import { VereinMap } from './VereinMap'
import { KIEmpfehlungModal } from './KIEmpfehlungModal'
import Link from 'next/link'

// ── Konstanten ───────────────────────────────────────────────────

const INITIAL_LIMIT = 20
const MORE_LIMIT = 10
const SPORT_PILLS: SportFilter[] = ['alle', 'fussball', 'tennis', 'basketball']

// Leistungsniveau – reine UI, kein DB-Feld
const LEVEL_OPTIONS = ['ANFAENGER', 'FORTGESCHRITTENE', 'WETTKAMPF', 'PROFI'] as const
type LevelOption = (typeof LEVEL_OPTIONS)[number]
const LEVEL_LABELS: Record<LevelOption, string> = {
  ANFAENGER: 'Anfänger',
  FORTGESCHRITTENE: 'Fortgeschrittene',
  WETTKAMPF: 'Wettkampf',
  PROFI: 'Profi',
}

// ── Fetch-Helfer ─────────────────────────────────────────────────

async function fetchVereine(
  filters: VereinFilters,
  page: number,
  limit: number,
): Promise<VereinApiResponse> {
  const params = new URLSearchParams()
  params.set('sport', filters.sport)
  params.set('search', filters.search)
  params.set('radiusKm', String(filters.radiusKm))
  params.set('ageMin', String(filters.ageMin))
  params.set('ageMax', String(filters.ageMax))
  params.set('onlyVerified', String(filters.onlyVerified))
  params.set('sort', filters.sort)
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (filters.userLat !== null) params.set('userLat', String(filters.userLat))
  if (filters.userLon !== null) params.set('userLon', String(filters.userLon))
  if (filters.priceCategories.length > 0) {
    params.set('priceCategories', filters.priceCategories.join(','))
  }
  const res = await fetch(`/api/vereine?${params.toString()}`)
  if (!res.ok) throw new Error('Vereinssuche fehlgeschlagen')
  return res.json() as Promise<VereinApiResponse>
}

// ── Aktive-Filter-Chips ───────────────────────────────────────────

interface ActiveFilterChipsProps {
  filters: VereinFilters
  onRemove: (key: keyof VereinFilters | `priceCategory:${PriceCategory}`) => void
}

function ActiveFilterChips({ filters, onRemove }: ActiveFilterChipsProps) {
  const chips: { label: string; key: keyof VereinFilters | `priceCategory:${PriceCategory}` }[] = []

  if (filters.onlyVerified) chips.push({ label: 'Nur verifiziert', key: 'onlyVerified' })
  if (filters.radiusKm !== DEFAULT_FILTERS.radiusKm) {
    chips.push({ label: `${filters.radiusKm} km`, key: 'radiusKm' })
  }
  if (filters.ageMin !== DEFAULT_FILTERS.ageMin || filters.ageMax !== DEFAULT_FILTERS.ageMax) {
    chips.push({ label: `${filters.ageMin}–${filters.ageMax} Jahre`, key: 'ageMin' })
  }
  for (const cat of filters.priceCategories) {
    chips.push({ label: PRICE_CATEGORY_LABELS[cat], key: `priceCategory:${cat}` })
  }

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

// ── Haupt-Komponente ─────────────────────────────────────────────

interface VereinSucheClientProps {
  isLoggedIn: boolean
}

export function VereinSucheClient({ isLoggedIn }: VereinSucheClientProps) {
  // ── State ──────────────────────────────────────────────────────
  const [filters, setFilters] = useState<VereinFilters>(DEFAULT_FILTERS)
  const [vereine, setVereine] = useState<VereinListItem[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [selectedVerein, setSelectedVerein] = useState<VereinListItem | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [isLocating, setIsLocating] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [levelFilter, setLevelFilter] = useState<LevelOption | null>(null)
  const [kiModalOpen, setKiModalOpen] = useState(false)
  const [, startTransition] = useTransition()

  // Debounce-Ref für Suche
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Sentinel für Infinite Scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // ── data-sport Attribut ────────────────────────────────────────
  const dataSport = filters.sport !== 'alle' ? filters.sport : undefined

  // ── Lade-Funktion (Reset auf Seite 1) ─────────────────────────
  const loadVereine = useCallback(async (f: VereinFilters) => {
    setIsLoading(true)
    setCurrentPage(1)
    try {
      const data = await fetchVereine(f, 1, INITIAL_LIMIT)
      setVereine(data.vereine)
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch {
      setVereine([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Mehr laden ────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasMore) return
    setIsFetchingMore(true)
    const nextPage = currentPage + 1
    try {
      const data = await fetchVereine(filters, nextPage, MORE_LIMIT)
      setVereine((prev) => [...prev, ...data.vereine])
      setHasMore(data.hasMore)
      setCurrentPage(nextPage)
    } catch {
      // Still show existing results
    } finally {
      setIsFetchingMore(false)
    }
  }, [isFetchingMore, hasMore, currentPage, filters])

  // ── Effect: Filter-Änderung → Neu laden ───────────────────────
  useEffect(() => {
    startTransition(() => {
      void loadVereine(filters)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.sport,
    filters.radiusKm,
    filters.priceCategories,
    filters.ageMin,
    filters.ageMax,
    filters.onlyVerified,
    filters.sort,
    filters.userLat,
    filters.userLon,
  ])

  // ── Effect: Suche mit Debounce ─────────────────────────────────
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      void loadVereine(filters)
    }, 350)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search])

  // ── Effect: Infinite Scroll ────────────────────────────────────
  useEffect(() => {
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
  }, [hasMore, isFetchingMore, loadMore])

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
  const updateFilter = <K extends keyof VereinFilters>(key: K, value: VereinFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const togglePriceCategory = (cat: PriceCategory) => {
    setFilters((f) => ({
      ...f,
      priceCategories: f.priceCategories.includes(cat)
        ? f.priceCategories.filter((c) => c !== cat)
        : [...f.priceCategories, cat],
    }))
  }

  const removeActiveFilter = (key: keyof VereinFilters | `priceCategory:${PriceCategory}`) => {
    if (key.startsWith('priceCategory:')) {
      const cat = key.replace('priceCategory:', '') as PriceCategory
      setFilters((f) => ({ ...f, priceCategories: f.priceCategories.filter((c) => c !== cat) }))
    } else {
      switch (key) {
        case 'onlyVerified':
          updateFilter('onlyVerified', false)
          break
        case 'radiusKm':
          updateFilter('radiusKm', DEFAULT_FILTERS.radiusKm)
          break
        case 'ageMin':
          setFilters((f) => ({ ...f, ageMin: DEFAULT_FILTERS.ageMin, ageMax: DEFAULT_FILTERS.ageMax }))
          break
      }
    }
  }

  const hasActiveFilters =
    filters.onlyVerified ||
    filters.radiusKm !== DEFAULT_FILTERS.radiusKm ||
    filters.priceCategories.length > 0 ||
    filters.ageMin !== DEFAULT_FILTERS.ageMin ||
    filters.ageMax !== DEFAULT_FILTERS.ageMax

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="min-h-[100dvh] bg-[#FAFAFA]"
      {...(dataSport ? { 'data-sport': dataSport } : {})}
    >
      {/* ── Header-Bereich ───────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-sm border-b border-[#E4E4E7]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-5 pb-3">
          {/* Titel */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">
              Vereinssuche.
            </h1>
            <p className="text-xs text-[#71717A] mt-0.5">
              Jetzt in Hessen · Bald deutschlandweit verfügbar
            </p>
          </div>

          {/* Suchleiste */}
          <div className="max-w-2xl">
            <div className="relative flex items-center gap-2 bg-white border border-[#E4E4E7] rounded-2xl px-3 py-2.5 shadow-sm focus-within:border-[var(--sport-primary,#16A34A)] focus-within:ring-1 focus-within:ring-[var(--sport-primary,#16A34A)] transition-colors">
              <Search size={16} className="text-[#A1A1AA] flex-shrink-0" />
              <input
                type="text"
                placeholder="Verein, Stadt oder PLZ suchen..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#0A0A0A] placeholder:text-[#A1A1AA] outline-none min-w-0"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => updateFilter('search', '')}
                  className="text-[#A1A1AA] hover:text-[#52525B] transition-colors"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={handleLocate}
                disabled={isLocating}
                title="Meinen Standort verwenden"
                className={cn(
                  'flex-shrink-0 p-1.5 rounded-lg transition-colors',
                  filters.userLat !== null
                    ? 'text-[var(--sport-primary,#16A34A)] bg-[var(--sport-light,#DCFCE7)]'
                    : 'text-[#A1A1AA] hover:text-[#52525B] hover:bg-[#F4F4F5]',
                  isLocating && 'animate-pulse',
                )}
              >
                <LocateFixed size={15} />
              </button>
            </div>
          </div>

          {/* Sport-Pills + Aktionen */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Sport-Filter Pills */}
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
                  {SPORT_FILTER_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* Filter-Button */}
              <button
                type="button"
                onClick={() => setFilterOpen((p) => !p)}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
                  filterOpen || hasActiveFilters
                    ? 'bg-[var(--sport-primary,#16A34A)] text-white border-[var(--sport-primary,#16A34A)]'
                    : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                )}
              >
                <SlidersHorizontal size={13} />
                Filter
                {hasActiveFilters && (
                  <span className="ml-0.5 bg-white/30 rounded-full px-1 text-[10px] font-bold">
                    {[
                      filters.onlyVerified ? 1 : 0,
                      filters.radiusKm !== DEFAULT_FILTERS.radiusKm ? 1 : 0,
                      filters.priceCategories.length,
                      filters.ageMin !== DEFAULT_FILTERS.ageMin || filters.ageMax !== DEFAULT_FILTERS.ageMax ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </button>

              {/* KI-Empfehlung (nur eingeloggt) */}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => setKiModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#D4D4D8] transition-colors"
                >
                  <Sparkles size={13} />
                  KI-Empfehlung
                </button>
              )}

              {/* Verein eintragen */}
              <Link
                href="/vereine/eintragen"
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#D4D4D8] transition-colors"
              >
                <PlusCircle size={13} />
                Verein eintragen
              </Link>
            </div>
          </div>

          {/* DSGVO-Hinweis */}
          <p className="mt-2 text-[10px] text-[#A1A1AA]">
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
                  {/* Entfernung */}
                  <Accordion.Item value="entfernung" className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                    <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors [&[data-state=open]>svg]:rotate-180">
                      Entfernung
                      <ChevronDown size={14} className="text-[#71717A] transition-transform duration-200" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-3 pb-3 pt-1">
                      <Select.Root
                        value={String(filters.radiusKm)}
                        onValueChange={(v) => updateFilter('radiusKm', parseInt(v, 10))}
                      >
                        <Select.Trigger className="flex items-center justify-between w-40 text-sm border border-[#E4E4E7] rounded-lg px-3 py-2 bg-white text-[#0A0A0A] hover:border-[#D4D4D8] outline-none">
                          <Select.Value />
                          <Select.Icon>
                            <ChevronDown size={12} className="text-[#71717A]" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="bg-white border border-[#E4E4E7] rounded-lg shadow-lg z-50 overflow-hidden">
                            <Select.Viewport className="p-1">
                              {RADIUS_OPTIONS.map((r) => (
                                <Select.Item
                                  key={r}
                                  value={String(r)}
                                  className="flex items-center px-3 py-2 text-sm text-[#0A0A0A] rounded-md cursor-pointer hover:bg-[#F4F4F5] outline-none data-[highlighted]:bg-[#F4F4F5]"
                                >
                                  <Select.ItemText>{r} km</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </Accordion.Content>
                  </Accordion.Item>

                  {/* Leistungsniveau (UI-only, kein DB-Feld) */}
                  <Accordion.Item value="niveau" className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                    <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors [&[data-state=open]>svg]:rotate-180">
                      <span className="flex items-center gap-2">
                        Leistungsniveau
                        <span className="text-[10px] text-[#A1A1AA] font-normal">(nur zur Orientierung)</span>
                      </span>
                      <ChevronDown size={14} className="text-[#71717A] transition-transform duration-200" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-3 pb-3 pt-1">
                      <div className="flex flex-wrap gap-2">
                        {LEVEL_OPTIONS.map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
                            className={cn(
                              'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                              levelFilter === lvl
                                ? 'bg-[var(--sport-primary,#16A34A)] text-white border-[var(--sport-primary,#16A34A)]'
                                : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                            )}
                          >
                            {LEVEL_LABELS[lvl]}
                          </button>
                        ))}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  {/* Preisklasse */}
                  <Accordion.Item value="preis" className="border border-[#E4E4E7] rounded-lg overflow-hidden">
                    <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#0A0A0A] hover:bg-[#FAFAFA] transition-colors [&[data-state=open]>svg]:rotate-180">
                      Preisklasse
                      <ChevronDown size={14} className="text-[#71717A] transition-transform duration-200" />
                    </Accordion.Trigger>
                    <Accordion.Content className="px-3 pb-3 pt-1">
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(PRICE_CATEGORY_LABELS) as PriceCategory[]).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => togglePriceCategory(cat)}
                            className={cn(
                              'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                              filters.priceCategories.includes(cat)
                                ? 'bg-[var(--sport-primary,#16A34A)] text-white border-[var(--sport-primary,#16A34A)]'
                                : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#D4D4D8]',
                            )}
                          >
                            {PRICE_CATEGORY_LABELS[cat]}
                          </button>
                        ))}
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
                          <RadixSlider.Thumb className="block w-4 h-4 bg-white border-2 border-[var(--sport-primary,#16A34A)] rounded-full shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--sport-primary,#16A34A)] focus:ring-offset-1 transition-shadow" />
                          <RadixSlider.Thumb className="block w-4 h-4 bg-white border-2 border-[var(--sport-primary,#16A34A)] rounded-full shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--sport-primary,#16A34A)] focus:ring-offset-1 transition-shadow" />
                        </RadixSlider.Root>
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>

                  {/* Verifiziert + Sortierung in einer Zeile */}
                  <div className="flex flex-wrap gap-4 items-center px-1">
                    {/* Verifiziert Toggle */}
                    <div className="flex items-center gap-2">
                      <Switch.Root
                        checked={filters.onlyVerified}
                        onCheckedChange={(checked) => updateFilter('onlyVerified', checked)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                          filters.onlyVerified
                            ? 'bg-[var(--sport-primary,#16A34A)]'
                            : 'bg-[#D4D4D8]',
                        )}
                      >
                        <Switch.Thumb className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
                      </Switch.Root>
                      <label className="text-sm text-[#52525B] cursor-pointer" onClick={() => updateFilter('onlyVerified', !filters.onlyVerified)}>
                        Nur verifizierte Vereine
                      </label>
                    </div>

                    {/* Sortierung */}
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-[#52525B]">Sortierung:</span>
                      <Select.Root
                        value={filters.sort}
                        onValueChange={(v) => updateFilter('sort', v as SortOption)}
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
                              {(Object.keys(SORT_OPTION_LABELS) as SortOption[]).map((opt) => (
                                <Select.Item
                                  key={opt}
                                  value={opt}
                                  className="flex items-center px-3 py-2 text-sm text-[#0A0A0A] rounded-md cursor-pointer hover:bg-[#F4F4F5] outline-none data-[highlighted]:bg-[#F4F4F5]"
                                >
                                  <Select.ItemText>{SORT_OPTION_LABELS[opt]}</Select.ItemText>
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

      {/* ── Haupt-Layout ─────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
        {/* Ergebnis-Counter + aktive Filter-Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-sm text-[#71717A]">
            {isLoading ? (
              <span className="inline-block w-20 h-4 bg-[#E4E4E7] rounded animate-pulse" />
            ) : (
              <>
                <span className="font-semibold text-[#0A0A0A]">{total}</span>{' '}
                {total === 1 ? 'Verein' : 'Vereine'} gefunden
              </>
            )}
          </p>

          {/* Mobile: Karte/Liste Toggle entfernt – Tab-Bar am Seitenende */}
        </div>

        {/* Aktive Filter-Chips */}
        <ActiveFilterChips filters={filters} onRemove={removeActiveFilter} />

        {/* ── Desktop: Zwei-Spalten-Layout ─────────────────── */}
        <div className="hidden xl:flex gap-4 mt-3" style={{ height: 'calc(100dvh - 260px)' }}>
          {/* Liste (links 42%) */}
          <div className="w-[42%] flex-shrink-0 overflow-y-auto pr-1 space-y-2">
            <VereinListe
              vereine={vereine}
              isLoading={isLoading}
              isFetchingMore={isFetchingMore}
              selectedVerein={selectedVerein}
              onSelect={setSelectedVerein}
              sentinelRef={sentinelRef}
              total={total}
            />
          </div>

          {/* Karte (rechts 58%) */}
          <div className="flex-1 rounded-xl overflow-hidden border border-[#E4E4E7]">
            <VereinMap
              vereine={vereine}
              selectedVerein={selectedVerein}
              onSelectVerein={setSelectedVerein}
              userLat={filters.userLat}
              userLon={filters.userLon}
              sportFilter={filters.sport}
            />
          </div>
        </div>

        {/* ── Mobile/Tablet: Einzelne Ansicht ──────────────── */}
        <div className="xl:hidden mt-3 pb-20">
          {view === 'list' ? (
            <div className="space-y-2">
              <VereinListe
                vereine={vereine}
                isLoading={isLoading}
                isFetchingMore={isFetchingMore}
                selectedVerein={selectedVerein}
                onSelect={setSelectedVerein}
                sentinelRef={sentinelRef}
                total={total}
              />
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden border border-[#E4E4E7]"
              style={{ height: 'calc(100dvh - 320px)', minHeight: 400 }}
            >
              <VereinMap
                vereine={vereine}
                selectedVerein={selectedVerein}
                onSelectVerein={setSelectedVerein}
                userLat={filters.userLat}
                userLon={filters.userLon}
                sportFilter={filters.sport}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile fixed Tab-Bar ─────────────────────────── */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#E4E4E7]">
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors',
              view === 'list'
                ? 'text-[var(--sport-primary,#16A34A)]'
                : 'text-[#71717A]',
            )}
          >
            <List size={20} strokeWidth={view === 'list' ? 2.5 : 1.75} />
            Liste
          </button>
          <div className="w-px bg-[#E4E4E7] self-stretch" />
          <button
            type="button"
            onClick={() => setView('map')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors',
              view === 'map'
                ? 'text-[var(--sport-primary,#16A34A)]'
                : 'text-[#71717A]',
            )}
          >
            <MapIcon size={20} strokeWidth={view === 'map' ? 2.5 : 1.75} />
            Karte
          </button>
        </div>
      </div>

      {/* ── KI-Empfehlungs-Modal ──────────────────────────── */}
      <KIEmpfehlungModal
        open={kiModalOpen}
        onOpenChange={setKiModalOpen}
        defaultSport={filters.sport !== 'alle' ? filters.sport : undefined}
        userLat={filters.userLat}
        userLon={filters.userLon}
      />
    </div>
  )
}

// ── Verein-Liste Sub-Komponente ───────────────────────────────────

interface VereinListeProps {
  vereine: VereinListItem[]
  isLoading: boolean
  isFetchingMore: boolean
  selectedVerein: VereinListItem | null
  onSelect: (v: VereinListItem | null) => void
  sentinelRef: React.RefObject<HTMLDivElement>
  total: number
}

function VereinListe({
  vereine,
  isLoading,
  isFetchingMore,
  selectedVerein,
  onSelect,
  sentinelRef,
  total,
}: VereinListeProps) {
  if (isLoading) {
    return (
      <>
        <VereinCardSkeleton />
        <VereinCardSkeleton />
        <VereinCardSkeleton />
      </>
    )
  }

  if (vereine.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F4F4F5] flex items-center justify-center mb-3">
          <Search size={24} className="text-[#A1A1AA]" />
        </div>
        <p className="text-sm font-medium text-[#52525B]">Keine Vereine gefunden</p>
        <p className="text-xs text-[#A1A1AA] mt-1 max-w-xs">
          Versuche andere Suchbegriffe oder erweitere den Radius.
        </p>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence mode="popLayout">
        {vereine.map((v) => (
          <VereinCard
            key={v.id}
            verein={v}
            isSelected={selectedVerein?.id === v.id}
            onClick={() => onSelect(selectedVerein?.id === v.id ? null : v)}
          />
        ))}
      </AnimatePresence>

      {/* Sentinel für Infinite Scroll */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingMore && (
        <div className="space-y-2 mt-2">
          <VereinCardSkeleton />
          <VereinCardSkeleton />
        </div>
      )}

      {!isFetchingMore && vereine.length >= total && vereine.length > 0 && (
        <p className="text-xs text-center text-[#A1A1AA] py-4">
          Alle {total} Vereine geladen.
        </p>
      )}
    </>
  )
}
