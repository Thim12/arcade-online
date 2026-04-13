// ─────────────────────────────────────────────────────────────────
// lib/types/turnier.ts – Shared Types für Turniersuche
// ─────────────────────────────────────────────────────────────────

// ── Filter-Typen ─────────────────────────────────────────────────

export type TurnierSportFilter = 'alle' | 'fussball' | 'tennis' | 'basketball'

export type TurnierFormat = 'EINZEL' | 'DOPPEL' | 'MANNSCHAFT' | 'GEMISCHT'

export type TurnierFeeFilter = 'kostenlos' | 'unter_10' | 'unter_25' | 'beliebig'

export type TurnierSortOption = 'datum' | 'name' | 'entfernung' | 'neu'

export interface TurnierFilters {
  sport: TurnierSportFilter
  dateFrom: string | null      // ISO date string (YYYY-MM-DD)
  dateTo: string | null        // ISO date string (YYYY-MM-DD)
  ageMin: number
  ageMax: number
  formats: TurnierFormat[]
  fee: TurnierFeeFilter
  radius: number
  onlyVerified: boolean
  onlyFreeSpots: boolean
  sort: TurnierSortOption
  userLat: number | null
  userLon: number | null
}

export const DEFAULT_TURNIER_FILTERS: TurnierFilters = {
  sport: 'alle',
  dateFrom: null,
  dateTo: null,
  ageMin: 0,
  ageMax: 99,
  formats: [],
  fee: 'beliebig',
  radius: 50,
  onlyVerified: false,
  onlyFreeSpots: false,
  sort: 'datum',
  userLat: null,
  userLon: null,
}

// ── API Response Typen ───────────────────────────────────────────

export interface TurnierSportInfo {
  id: string
  name: string
  slug: string
  colorPrimary: string
  colorLight: string
  colorGlow: string
  iconName: string
}

export interface TurnierDetails {
  format?: TurnierFormat
  ageMin?: number
  ageMax?: number
  rules?: string
  contactInfo?: string
}

export interface TurnierListItem {
  id: string
  name: string
  slug: string
  description: string | null
  city: string
  state: string
  address: string | null
  latitude: number | null
  longitude: number | null
  startDate: string            // ISO string
  endDate: string              // ISO string
  registrationDeadline: string | null  // ISO string
  maxParticipants: number | null
  currentParticipants: number
  entryFee: number | null
  prizePool: number | null
  level: string
  status: string
  coverUrl: string | null
  format: TurnierFormat | null
  ageMin: number | null
  ageMax: number | null
  sport: TurnierSportInfo
  isRegistered: boolean
  distanceKm: number | null
}

export interface TurnierApiResponse {
  turniere: TurnierListItem[]
  total: number
  hasMore: boolean
}

// ── Label-Maps ───────────────────────────────────────────────────

export const TURNIER_SPORT_FILTER_LABELS: Record<TurnierSportFilter, string> = {
  alle: 'Alle Sportarten',
  fussball: 'Fußball',
  tennis: 'Tennis',
  basketball: 'Basketball',
}

export const TURNIER_FORMAT_LABELS: Record<TurnierFormat, string> = {
  EINZEL: 'Einzel',
  DOPPEL: 'Doppel',
  MANNSCHAFT: 'Mannschaft',
  GEMISCHT: 'Gemischt',
}

export const TURNIER_FEE_LABELS: Record<TurnierFeeFilter, string> = {
  kostenlos: 'Kostenlos',
  unter_10: 'Unter 10 €',
  unter_25: 'Unter 25 €',
  beliebig: 'Beliebig',
}

export const TURNIER_SORT_LABELS: Record<TurnierSortOption, string> = {
  datum: 'Datum',
  name: 'Name A–Z',
  entfernung: 'Entfernung',
  neu: 'Neueste zuerst',
}

export const SPORT_COLORS: Record<TurnierSportFilter, { primary: string; light: string; glow: string }> = {
  alle: { primary: '#16A34A', light: '#DCFCE7', glow: '#4ADE80' },
  fussball: { primary: '#16A34A', light: '#DCFCE7', glow: '#4ADE80' },
  tennis: { primary: '#C2621A', light: '#FEF3C7', glow: '#F59E0B' },
  basketball: { primary: '#EA580C', light: '#FFEDD5', glow: '#FB923C' },
}

export const LEVEL_LABELS: Record<string, string> = {
  ANFAENGER: 'Anfänger',
  FORTGESCHRITTENE: 'Fortgeschrittene',
  WETTKAMPF: 'Wettkampf',
  PROFI: 'Profi',
}
