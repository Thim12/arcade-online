// ─────────────────────────────────────────────────────────────────
// Sportart-spezifische Profil-Typen für UserSport.details (JSON)
// Sowie Verein-spezifische Detail-Typen für Verein.details (JSON)
// ─────────────────────────────────────────────────────────────────

// ── Fußball ───────────────────────────────────────────────────────

export type FussballPosition =
  | 'TORWART'
  | 'INNENVERTEIDIGER'
  | 'AUSSENVERTEIDIGER'
  | 'DEFENSIVES_MITTELFELD'
  | 'ZENTRALES_MITTELFELD'
  | 'OFFENSIVES_MITTELFELD'
  | 'LINKSAUSSEN'
  | 'RECHTSAUSSEN'
  | 'HAENGENDE_SPITZE'
  | 'MITTELSTUERMER'

export type FussballStarkerFuss = 'LINKS' | 'RECHTS' | 'BEIDFUSS'

export interface FussballProfile {
  position: FussballPosition | null
  starkerFuss: FussballStarkerFuss | null
  // Selbsteinschätzung 1–10
  technik: number | null
  schnelligkeit: number | null
  ausdauer: number | null
  zweikampf: number | null
  // Spielsystem-Präferenz
  lieblingsSystem: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '5-3-2' | null
}

export interface FussballVereinDetails {
  ligaKlasse: 'KREISLIGA' | 'BEZIRKSLIGA' | 'LANDESLIGA' | 'OBERLIGA' | 'FREIZEITLIGA' | null
  hatKunstrasen: boolean
  hatNaturrasen: boolean
  anzahlMannschaften: number | null
  jugendAbteilungen: string[] // z.B. ["U7", "U9", "U11", "U13"]
  hatFrauenMannschaft: boolean
}

// ── Tennis ────────────────────────────────────────────────────────

export type TennisSpielfläche = 'SAND' | 'HARTPLATZ' | 'GRAS' | 'HALLE' | 'TEPPICH'
export type TennisHand = 'RECHTS' | 'LINKS'
export type TennisRueckhand = 'EINHÄNDIG' | 'ZWEIHÄNDIG'
export type TennisSpielstil = 'BASELINE' | 'SERVE_VOLLEY' | 'ALLROUNDER' | 'DEFENSIVE'

export interface TennisProfile {
  spielhand: TennisHand | null
  rueckhand: TennisRueckhand | null
  spielstil: TennisSpielstil | null
  lieblingsbelag: TennisSpielfläche | null
  // DTB-Spielstärke (z.B. "LK 10", "LK 5", "LK 23")
  ltbSpielstaerke: string | null
  // Selbsteinschätzung 1–10
  aufschlag: number | null
  grundlinie: number | null
  netz: number | null
  returnspiel: number | null
}

export interface TennisVereinDetails {
  anzahlSandplaetze: number | null
  anzahlHartplaetze: number | null
  anzahlHallenplaetze: number | null
  hatFlutlicht: boolean
  hatTenniswand: boolean
  hatJugendtraining: boolean
  hatDamenMannschaft: boolean
  hatHerrenMannschaft: boolean
  verbandszugehoerigkeit: string | null // z.B. "HTV" (Hessischer Tennis-Verband)
}

// ── Basketball ────────────────────────────────────────────────────

export type BasketballPosition =
  | 'POINT_GUARD'
  | 'SHOOTING_GUARD'
  | 'SMALL_FORWARD'
  | 'POWER_FORWARD'
  | 'CENTER'

export type BasketballHand = 'RECHTS' | 'LINKS'

export interface BasketballProfile {
  position: BasketballPosition | null
  wurfhand: BasketballHand | null
  // Selbsteinschätzung 1–10
  dribbling: number | null
  passen: number | null
  werfen: number | null
  verteidigung: number | null
  athletik: number | null
  // Bevorzugtes Format
  bevorzugtFormat: '5V5' | '3X3' | 'BEIDES' | null
  koerpergroesseCm: number | null
}

export interface BasketballVereinDetails {
  anzahlHallenplaetze: number | null
  hatOutdoorCourt: boolean
  spieltInLiga: boolean
  ligaName: string | null  // z.B. "Hessenliga", "Kreisliga Frankfurt"
  hatJugendmannschaft: boolean
  hatDamenMannschaft: boolean
  verbandszugehoerigkeit: string | null // z.B. "BBH" (Basketball-Bund Hessen)
}

// ── Discriminated Union für alle Sport-Profile ────────────────────

export type SportProfile =
  | { sport: 'fussball'; details: FussballProfile }
  | { sport: 'tennis'; details: TennisProfile }
  | { sport: 'basketball'; details: BasketballProfile }

export type VereinSportDetails =
  | { sport: 'fussball'; details: FussballVereinDetails }
  | { sport: 'tennis'; details: TennisVereinDetails }
  | { sport: 'basketball'; details: BasketballVereinDetails }
