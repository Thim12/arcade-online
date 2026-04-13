// ─────────────────────────────────────────────────────────────────
// lib/types/verein.ts – Shared Types für Vereinssuche
// ─────────────────────────────────────────────────────────────────

// ── Filter-Typen ─────────────────────────────────────────────────

export type SportFilter = 'alle' | 'fussball' | 'tennis' | 'basketball'

export type PriceCategory = 'kostenlos' | 'guenstig' | 'mittel' | 'premium'

export type SortOption = 'relevanz' | 'entfernung' | 'name' | 'neu'

export interface VereinFilters {
  sport: SportFilter
  search: string
  radiusKm: number
  priceCategories: PriceCategory[]
  ageMin: number
  ageMax: number
  onlyVerified: boolean
  sort: SortOption
  userLat: number | null
  userLon: number | null
}

export const DEFAULT_FILTERS: VereinFilters = {
  sport: 'alle',
  search: '',
  radiusKm: 25,
  priceCategories: [],
  ageMin: 0,
  ageMax: 99,
  onlyVerified: false,
  sort: 'relevanz',
  userLat: null,
  userLon: null,
}

// ── API Response Typen ───────────────────────────────────────────

export interface VereinSportInfo {
  id: string
  name: string
  slug: string
  colorPrimary: string
  colorLight: string
  colorGlow: string
  iconName: string
}

export interface VereinListItem {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  city: string
  postalCode: string
  latitude: number | null
  longitude: number | null
  website: string | null
  phone: string | null
  logoUrl: string | null
  monthlyFee: number | null
  hasYouthTeam: boolean
  ageMin: number | null
  ageMax: number | null
  isVerified: boolean
  verifiedAt: string | null
  details: Record<string, unknown> | null
  sport: VereinSportInfo
  _followCount: number
  distanceKm: number | null
}

export interface VereinApiResponse {
  vereine: VereinListItem[]
  total: number
  hasMore: boolean
}

// ── Label-Maps ───────────────────────────────────────────────────

export const PRICE_CATEGORY_LABELS: Record<PriceCategory, string> = {
  kostenlos: 'Kostenlos',
  guenstig: 'Günstig (< 30 €)',
  mittel: 'Mittel (30–60 €)',
  premium: 'Premium (> 60 €)',
}

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const
export type RadiusOption = (typeof RADIUS_OPTIONS)[number]

export const SPORT_FILTER_LABELS: Record<SportFilter, string> = {
  alle: 'Alle Sportarten',
  fussball: 'Fußball',
  tennis: 'Tennis',
  basketball: 'Basketball',
}

export const SORT_OPTION_LABELS: Record<SortOption, string> = {
  relevanz: 'Relevanz',
  entfernung: 'Entfernung',
  name: 'Name A–Z',
  neu: 'Neueste zuerst',
}

// ── KI-Empfehlung Typen ──────────────────────────────────────────

export type KIPriority =
  | 'guenstig'
  | 'professionelles_training'
  | 'naehe'
  | 'jugendfoerderung'
  | 'flexible_zeiten'

export interface KIEmpfehlungRequest {
  sportSlug: 'fussball' | 'tennis' | 'basketball'
  userLat: number | null
  userLon: number | null
  maxDistanceKm: number
  maxBudget: number | null    // null = kein Limit
  priorities: KIPriority[]
  // Fußball
  fussballLiga?: string
  fussballZiel?: string
  // Tennis
  lkValue?: number
  tennisDisziplinen?: string[]
  tennisZiel?: string
  // Basketball
  basketballLiga?: string
  basketballZiel?: string
}

export interface KIVereinEmpfehlung {
  verein: VereinListItem
  matchScore: number          // 0–100
  personalizedReason: string | null
  keyBenefit: string | null
  nextStep: string | null
}

export interface KIEmpfehlungResponse {
  recommendations: KIVereinEmpfehlung[]
  remainingMonthlyRequests: number
}

// ── Verein-Detail Typen ──────────────────────────────────────────

export interface VereinTournamentPreview {
  id: string
  name: string
  startDate: string           // ISO string
  city: string
  level: string
  entryFee: number | null
}

export interface VereinDetailItem extends VereinListItem {
  coverUrl: string | null
  followCount: number
  isMember: boolean
  tournaments: VereinTournamentPreview[]
}

// ── KI-Prioritäten Label-Map ─────────────────────────────────────

export const KI_PRIORITY_LABELS: Record<KIPriority, string> = {
  guenstig: 'Günstiger Beitrag',
  professionelles_training: 'Prof. Training',
  naehe: 'Kurze Entfernung',
  jugendfoerderung: 'Jugendförderung',
  flexible_zeiten: 'Flexible Zeiten',
}
