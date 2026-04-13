import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Gemeinsame Typen
// ─────────────────────────────────────────────────────────────────────────────

export type SportSlug = 'fussball' | 'tennis' | 'basketball'

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: z.ZodError }

export type SportProfilBySlug = {
  fussball: FussballProfil
  tennis: TennisProfil
  basketball: BasketballProfil
}

export type AnySportProfil = SportProfilBySlug[SportSlug]

// ─────────────────────────────────────────────────────────────────────────────
// Fußball – Konstanten
// ─────────────────────────────────────────────────────────────────────────────

export const FUSSBALL_POSITIONEN = [
  'TORWART',
  'INNENVERTEIDIGER',
  'LINKER_VERTEIDIGER',
  'RECHTER_VERTEIDIGER',
  'DEFENSIVES_MITTELFELD',
  'ZENTRALES_MITTELFELD',
  'LINKES_MITTELFELD',
  'RECHTES_MITTELFELD',
  'OFFENSIVES_MITTELFELD',
  'LINKER_FLUEGELSTUERMER',
  'RECHTER_FLUEGELSTUERMER',
  'HAENGENDE_SPITZE',
  'MITTELSTUERMER',
] as const

export const FUSSBALL_LIGA_NIVEAUS = [
  'KREISLIGA_C',
  'KREISLIGA_B',
  'KREISLIGA_A',
  'BEZIRKSLIGA',
  'LANDESLIGA',
  'VERBANDSLIGA',
  'OBERLIGA',
  'REGIONALLIGA',
  'DRITTE_LIGA',
  'ZWEITE_BUNDESLIGA',
  'BUNDESLIGA',
] as const

export const FUSSBALL_SPIELSTILE = [
  'DEFENSIV',
  'AUSGEWOGEN',
  'OFFENSIV',
  'PRESSING',
  'KONTERFUSSBALL',
] as const

export const FUSSBALL_STAERKEN = [
  'PASSEN',
  'DRIBBLING',
  'SCHUSS',
  'KOPFBALL',
  'ZWEIKAMPF',
  'TEMPO',
  'AUSDAUER',
  'TAKTIK',
  'FLANKEN',
  'FREISTOESSE',
  'ELFMETER',
  'STELLUNGSSPIEL',
  'TECHNIK',
  'FUEHRERQUALITAET',
] as const

export const FUSSBALL_ALTERSKLASSEN = [
  'BAMBINI',
  'F_JUGEND',
  'E_JUGEND',
  'D_JUGEND',
  'C_JUGEND',
  'B_JUGEND',
  'A_JUGEND',
  'JUNIOREN_U23',
  'SENIOREN',
  'AH',
] as const

export const FUSSBALL_ZIELE = [
  'NIVEAU_HALTEN',
  'AUFSTEIGEN',
  'STARK_AUFSTEIGEN',
  'PROFI_WERDEN',
] as const

export type FussballPosition = (typeof FUSSBALL_POSITIONEN)[number]
export type FussballLigaNiveau = (typeof FUSSBALL_LIGA_NIVEAUS)[number]
export type FussballSpielstil = (typeof FUSSBALL_SPIELSTILE)[number]
export type FussballStaerke = (typeof FUSSBALL_STAERKEN)[number]
export type FussballAltersklasse = (typeof FUSSBALL_ALTERSKLASSEN)[number]
export type FussballZiel = (typeof FUSSBALL_ZIELE)[number]
export type StarkerFuss = 'RECHTS' | 'LINKS' | 'BEIDFUESSIG'

// ─────────────────────────────────────────────────────────────────────────────
// Fußball – Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface FussballProfil {
  position: FussballPosition
  starkerFuss: StarkerFuss
  trikotNummer?: number
  aktuellesLigaNiveau: FussballLigaNiveau
  aktuellerVereinsname?: string
  spielstil: FussballSpielstil
  staerken: FussballStaerke[]
  koerpergroesseCm?: number
  gewichtKg?: number
  lieblingsspieler?: string
  trainingsEinheitenProWoche: number
  altersklasse?: FussballAltersklasse
  hatTrainer: boolean
  hatVerein: boolean
  ziel: FussballZiel
}

// ─────────────────────────────────────────────────────────────────────────────
// Fußball – Zod Schema
// ─────────────────────────────────────────────────────────────────────────────

export const fussballProfilSchema = z.object({
  position: z.enum(FUSSBALL_POSITIONEN, {
    errorMap: () => ({ message: 'Bitte wähle eine gültige Position.' }),
  }),
  starkerFuss: z.enum(['RECHTS', 'LINKS', 'BEIDFUESSIG'] as const, {
    errorMap: () => ({ message: 'Bitte wähle deinen starken Fuß.' }),
  }),
  trikotNummer: z
    .number({ invalid_type_error: 'Trikotnummer muss eine Zahl sein.' })
    .int('Trikotnummer muss eine ganze Zahl sein.')
    .min(1, 'Trikotnummer muss zwischen 1 und 99 liegen.')
    .max(99, 'Trikotnummer muss zwischen 1 und 99 liegen.')
    .optional(),
  aktuellesLigaNiveau: z.enum(FUSSBALL_LIGA_NIVEAUS, {
    errorMap: () => ({ message: 'Bitte wähle ein gültiges Liga-Niveau.' }),
  }),
  aktuellerVereinsname: z
    .string()
    .trim()
    .min(1, 'Vereinsname darf nicht leer sein.')
    .max(100, 'Vereinsname darf maximal 100 Zeichen haben.')
    .optional(),
  spielstil: z.enum(FUSSBALL_SPIELSTILE, {
    errorMap: () => ({ message: 'Bitte wähle einen gültigen Spielstil.' }),
  }),
  staerken: z
    .array(z.enum(FUSSBALL_STAERKEN))
    .max(4, 'Du kannst maximal 4 Stärken auswählen.'),
  koerpergroesseCm: z
    .number({ invalid_type_error: 'Körpergröße muss eine Zahl sein.' })
    .int()
    .min(140, 'Körpergröße muss mindestens 140 cm betragen.')
    .max(215, 'Körpergröße darf maximal 215 cm betragen.')
    .optional(),
  gewichtKg: z
    .number({ invalid_type_error: 'Gewicht muss eine Zahl sein.' })
    .min(40, 'Gewicht muss mindestens 40 kg betragen.')
    .max(150, 'Gewicht darf maximal 150 kg betragen.')
    .optional(),
  lieblingsspieler: z
    .string()
    .trim()
    .min(1, 'Name darf nicht leer sein.')
    .max(100, 'Name darf maximal 100 Zeichen haben.')
    .optional(),
  trainingsEinheitenProWoche: z
    .number({ invalid_type_error: 'Trainingseinheiten müssen eine Zahl sein.' })
    .int()
    .min(1, 'Mindestens 1 Trainingseinheit pro Woche.')
    .max(7, 'Maximal 7 Trainingseinheiten pro Woche.'),
  altersklasse: z.enum(FUSSBALL_ALTERSKLASSEN).optional(),
  hatTrainer: z.boolean({ required_error: 'Bitte angeben, ob du einen Trainer hast.' }),
  hatVerein: z.boolean({ required_error: 'Bitte angeben, ob du in einem Verein spielst.' }),
  ziel: z.enum(FUSSBALL_ZIELE, {
    errorMap: () => ({ message: 'Bitte wähle ein gültiges Ziel.' }),
  }),
})

// ─────────────────────────────────────────────────────────────────────────────
// Tennis – Konstanten
// ─────────────────────────────────────────────────────────────────────────────

export const TENNIS_OBERFLAECHEN = [
  'HARTPLATZ',
  'SANDPLATZ',
  'RASEN',
  'TEPPICH',
] as const

export const TENNIS_SPIELSTILE = [
  'BASELINER',
  'SERVE_AND_VOLLEY',
  'ALLROUNDER',
  'DEFENSIVE_BASELINER',
] as const

export const TENNIS_DISZIPLINEN = ['EINZEL', 'DOPPEL', 'MIXED'] as const

export const TENNIS_TURNIERERFAHRUNGEN = [
  'KEINE',
  'ANFAENGER',
  'FORTGESCHRITTEN',
  'ERFAHREN',
  'PROFI',
] as const

export const TENNIS_ZIELE = [
  'SPARRING_FINDEN',
  'LK_VERBESSERN',
  'TURNIERE_SPIELEN',
  'VERBANDSNIVEAU',
] as const

export type TennisOberflaeche = (typeof TENNIS_OBERFLAECHEN)[number]
export type TennisSpielstil = (typeof TENNIS_SPIELSTILE)[number]
export type TennisDisziplin = (typeof TENNIS_DISZIPLINEN)[number]
export type TennisTurniererfahrung = (typeof TENNIS_TURNIERERFAHRUNGEN)[number]
export type TennisZiel = (typeof TENNIS_ZIELE)[number]
export type Spielhand = 'RECHTS' | 'LINKS'
export type TennisRueckhand = 'EINHAENDIG' | 'ZWEIHAENDIG'

// ─────────────────────────────────────────────────────────────────────────────
// Tennis – Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface TennisProfil {
  spielhand: Spielhand
  rueckhand: TennisRueckhand
  dtbLk?: number
  dtbId?: string
  lieblingsoberflaeche: TennisOberflaeche
  spielstil: TennisSpielstil
  disziplinen: TennisDisziplin[]
  turniererfahrung: TennisTurniererfahrung
  aktuellerVereinsname?: string
  lieblingsspieler?: string
  sucheSparringpartner: boolean
  maxSparringDistanzKm?: number
  trainingsEinheitenProWoche: number
  hatTrainer: boolean
  hatVerein: boolean
  ziel: TennisZiel
}

// ─────────────────────────────────────────────────────────────────────────────
// Tennis – Zod Schema
// ─────────────────────────────────────────────────────────────────────────────

export const tennisProfilSchema = z.object({
  spielhand: z.enum(['RECHTS', 'LINKS'] as const, {
    errorMap: () => ({ message: 'Bitte wähle deine Spielhand.' }),
  }),
  rueckhand: z.enum(['EINHAENDIG', 'ZWEIHAENDIG'] as const, {
    errorMap: () => ({ message: 'Bitte wähle deinen Rückhandtyp.' }),
  }),
  dtbLk: z
    .number({ invalid_type_error: 'LK muss eine Zahl sein.' })
    .min(1.0, 'LK muss mindestens 1,0 betragen.')
    .max(25.0, 'LK darf maximal 25,0 betragen.')
    .optional(),
  dtbId: z
    .string()
    .trim()
    .min(1, 'DTB-ID darf nicht leer sein.')
    .max(20, 'DTB-ID darf maximal 20 Zeichen haben.')
    .optional(),
  lieblingsoberflaeche: z.enum(TENNIS_OBERFLAECHEN, {
    errorMap: () => ({ message: 'Bitte wähle eine gültige Spieloberfläche.' }),
  }),
  spielstil: z.enum(TENNIS_SPIELSTILE, {
    errorMap: () => ({ message: 'Bitte wähle einen gültigen Spielstil.' }),
  }),
  disziplinen: z
    .array(z.enum(TENNIS_DISZIPLINEN))
    .min(1, 'Bitte wähle mindestens eine Disziplin.'),
  turniererfahrung: z.enum(TENNIS_TURNIERERFAHRUNGEN, {
    errorMap: () => ({ message: 'Bitte wähle deine Turniererfahrung.' }),
  }),
  aktuellerVereinsname: z
    .string()
    .trim()
    .min(1, 'Vereinsname darf nicht leer sein.')
    .max(100, 'Vereinsname darf maximal 100 Zeichen haben.')
    .optional(),
  lieblingsspieler: z
    .string()
    .trim()
    .min(1, 'Name darf nicht leer sein.')
    .max(100, 'Name darf maximal 100 Zeichen haben.')
    .optional(),
  sucheSparringpartner: z.boolean({
    required_error: 'Bitte angeben, ob du einen Sparringpartner suchst.',
  }),
  maxSparringDistanzKm: z
    .number({ invalid_type_error: 'Distanz muss eine Zahl sein.' })
    .int()
    .min(1, 'Distanz muss mindestens 1 km betragen.')
    .max(500, 'Distanz darf maximal 500 km betragen.')
    .optional(),
  trainingsEinheitenProWoche: z
    .number({ invalid_type_error: 'Trainingseinheiten müssen eine Zahl sein.' })
    .int()
    .min(1, 'Mindestens 1 Trainingseinheit pro Woche.')
    .max(7, 'Maximal 7 Trainingseinheiten pro Woche.'),
  hatTrainer: z.boolean({ required_error: 'Bitte angeben, ob du einen Trainer hast.' }),
  hatVerein: z.boolean({ required_error: 'Bitte angeben, ob du in einem Verein spielst.' }),
  ziel: z.enum(TENNIS_ZIELE, {
    errorMap: () => ({ message: 'Bitte wähle ein gültiges Ziel.' }),
  }),
})

// ─────────────────────────────────────────────────────────────────────────────
// Basketball – Konstanten
// ─────────────────────────────────────────────────────────────────────────────

export const BASKETBALL_POSITIONEN = [
  'POINT_GUARD',
  'SHOOTING_GUARD',
  'SMALL_FORWARD',
  'POWER_FORWARD',
  'CENTER',
] as const

export const BASKETBALL_LIGA_NIVEAUS = [
  'KREISLIGA',
  'BEZIRKSLIGA',
  'LANDESLIGA',
  'VERBANDSLIGA',
  'OBERLIGA',
  'REGIONALLIGA',
  'DRITTE_LIGA',
  'PRO_B',
  'BEKO_BBL',
  'BUNDESLIGA',
] as const

export const BASKETBALL_STAERKEN = [
  'BALLHANDLING',
  'PASSEN',
  'DREIERWURF',
  'MITTELDISTANZ',
  'KORBLEGER',
  'VERTEIDIGUNG',
  'REBOUND',
  'ATHLETIK',
  'SPIELVERSTAENDNIS',
  'AUSDAUER',
  'FUEHRERQUALITAET',
] as const

export const BASKETBALL_SPIELSTILE = [
  'PLAYMAKER',
  'SCORER',
  'DEFENDER',
  'REBOUNDER',
  'ALLROUNDER',
] as const

export const BASKETBALL_ZIELE = [
  'FREIZEIT',
  'LEISTUNG_VERBESSERN',
  'HOEHERE_LIGA',
] as const

export type BasketballPosition = (typeof BASKETBALL_POSITIONEN)[number]
export type BasketballLigaNiveau = (typeof BASKETBALL_LIGA_NIVEAUS)[number]
export type BasketballStaerke = (typeof BASKETBALL_STAERKEN)[number]
export type BasketballSpielstil = (typeof BASKETBALL_SPIELSTILE)[number]
export type BasketballZiel = (typeof BASKETBALL_ZIELE)[number]
export type Wurfhand = 'RECHTS' | 'LINKS'

// ─────────────────────────────────────────────────────────────────────────────
// Basketball – Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface BasketballProfil {
  position: BasketballPosition
  positionNummer: number
  wurfhand: Wurfhand
  koerpergroesseCm?: number
  gewichtKg?: number
  aktuellesLigaNiveau: BasketballLigaNiveau
  aktuellerVereinsname?: string
  staerken: BasketballStaerke[]
  spielstil: BasketballSpielstil
  lieblingsspieler?: string
  trainingsEinheitenProWoche: number
  hatTrainer: boolean
  hatVerein: boolean
  ziel: BasketballZiel
}

// ─────────────────────────────────────────────────────────────────────────────
// Basketball – Zod Schema
// ─────────────────────────────────────────────────────────────────────────────

export const basketballProfilSchema = z.object({
  position: z.enum(BASKETBALL_POSITIONEN, {
    errorMap: () => ({ message: 'Bitte wähle eine gültige Position.' }),
  }),
  positionNummer: z
    .number({ invalid_type_error: 'Positionsnummer muss eine Zahl sein.' })
    .int()
    .min(1, 'Positionsnummer muss zwischen 1 und 5 liegen.')
    .max(5, 'Positionsnummer muss zwischen 1 und 5 liegen.'),
  wurfhand: z.enum(['RECHTS', 'LINKS'] as const, {
    errorMap: () => ({ message: 'Bitte wähle deine Wurfhand.' }),
  }),
  koerpergroesseCm: z
    .number({ invalid_type_error: 'Körpergröße muss eine Zahl sein.' })
    .int()
    .min(150, 'Körpergröße muss mindestens 150 cm betragen.')
    .max(230, 'Körpergröße darf maximal 230 cm betragen.')
    .optional(),
  gewichtKg: z
    .number({ invalid_type_error: 'Gewicht muss eine Zahl sein.' })
    .min(50, 'Gewicht muss mindestens 50 kg betragen.')
    .max(180, 'Gewicht darf maximal 180 kg betragen.')
    .optional(),
  aktuellesLigaNiveau: z.enum(BASKETBALL_LIGA_NIVEAUS, {
    errorMap: () => ({ message: 'Bitte wähle ein gültiges Liga-Niveau.' }),
  }),
  aktuellerVereinsname: z
    .string()
    .trim()
    .min(1, 'Vereinsname darf nicht leer sein.')
    .max(100, 'Vereinsname darf maximal 100 Zeichen haben.')
    .optional(),
  staerken: z
    .array(z.enum(BASKETBALL_STAERKEN))
    .max(4, 'Du kannst maximal 4 Stärken auswählen.'),
  spielstil: z.enum(BASKETBALL_SPIELSTILE, {
    errorMap: () => ({ message: 'Bitte wähle einen gültigen Spielstil.' }),
  }),
  lieblingsspieler: z
    .string()
    .trim()
    .min(1, 'Name darf nicht leer sein.')
    .max(100, 'Name darf maximal 100 Zeichen haben.')
    .optional(),
  trainingsEinheitenProWoche: z
    .number({ invalid_type_error: 'Trainingseinheiten müssen eine Zahl sein.' })
    .int()
    .min(1, 'Mindestens 1 Trainingseinheit pro Woche.')
    .max(7, 'Maximal 7 Trainingseinheiten pro Woche.'),
  hatTrainer: z.boolean({ required_error: 'Bitte angeben, ob du einen Trainer hast.' }),
  hatVerein: z.boolean({ required_error: 'Bitte angeben, ob du in einem Verein spielst.' }),
  ziel: z.enum(BASKETBALL_ZIELE, {
    errorMap: () => ({ message: 'Bitte wähle ein gültiges Ziel.' }),
  }),
})

// ─────────────────────────────────────────────────────────────────────────────
// Label-Maps für deutsche Anzeige (UI, E-Mails, Admin)
// ─────────────────────────────────────────────────────────────────────────────

export const FUSSBALL_POSITION_LABELS: Record<FussballPosition, string> = {
  TORWART: 'Torwart',
  INNENVERTEIDIGER: 'Innenverteidiger',
  LINKER_VERTEIDIGER: 'Linker Verteidiger',
  RECHTER_VERTEIDIGER: 'Rechter Verteidiger',
  DEFENSIVES_MITTELFELD: 'Defensives Mittelfeld',
  ZENTRALES_MITTELFELD: 'Zentrales Mittelfeld',
  LINKES_MITTELFELD: 'Linkes Mittelfeld',
  RECHTES_MITTELFELD: 'Rechtes Mittelfeld',
  OFFENSIVES_MITTELFELD: 'Offensives Mittelfeld',
  LINKER_FLUEGELSTUERMER: 'Linker Flügelstürmer',
  RECHTER_FLUEGELSTUERMER: 'Rechter Flügelstürmer',
  HAENGENDE_SPITZE: 'Hängende Spitze',
  MITTELSTUERMER: 'Mittelstürmer',
}

export const FUSSBALL_LIGA_LABELS: Record<FussballLigaNiveau, string> = {
  KREISLIGA_C: 'Kreisliga C',
  KREISLIGA_B: 'Kreisliga B',
  KREISLIGA_A: 'Kreisliga A',
  BEZIRKSLIGA: 'Bezirksliga',
  LANDESLIGA: 'Landesliga',
  VERBANDSLIGA: 'Verbandsliga',
  OBERLIGA: 'Oberliga',
  REGIONALLIGA: 'Regionalliga',
  DRITTE_LIGA: '3. Liga',
  ZWEITE_BUNDESLIGA: '2. Bundesliga',
  BUNDESLIGA: 'Bundesliga',
}

export const FUSSBALL_SPIELSTIL_LABELS: Record<FussballSpielstil, string> = {
  DEFENSIV: 'Defensiv',
  AUSGEWOGEN: 'Ausgewogen',
  OFFENSIV: 'Offensiv',
  PRESSING: 'Pressing',
  KONTERFUSSBALL: 'Konterfußball',
}

export const FUSSBALL_STAERKE_LABELS: Record<FussballStaerke, string> = {
  PASSEN: 'Passen',
  DRIBBLING: 'Dribbling',
  SCHUSS: 'Schuss',
  KOPFBALL: 'Kopfball',
  ZWEIKAMPF: 'Zweikampf',
  TEMPO: 'Tempo',
  AUSDAUER: 'Ausdauer',
  TAKTIK: 'Taktik',
  FLANKEN: 'Flanken',
  FREISTOESSE: 'Freistöße',
  ELFMETER: 'Elfmeter',
  STELLUNGSSPIEL: 'Stellungsspiel',
  TECHNIK: 'Technik',
  FUEHRERQUALITAET: 'Führungsqualität',
}

export const FUSSBALL_ALTERSKLASSE_LABELS: Record<FussballAltersklasse, string> = {
  BAMBINI: 'Bambini',
  F_JUGEND: 'F-Jugend',
  E_JUGEND: 'E-Jugend',
  D_JUGEND: 'D-Jugend',
  C_JUGEND: 'C-Jugend',
  B_JUGEND: 'B-Jugend',
  A_JUGEND: 'A-Jugend',
  JUNIOREN_U23: 'Junioren (U23)',
  SENIOREN: 'Senioren',
  AH: 'Alte Herren',
}

export const FUSSBALL_ZIEL_LABELS: Record<FussballZiel, string> = {
  NIVEAU_HALTEN: 'Niveau halten',
  AUFSTEIGEN: 'Aufsteigen',
  STARK_AUFSTEIGEN: 'Stark aufsteigen',
  PROFI_WERDEN: 'Profi werden',
}

export const STARKERFUSS_LABELS: Record<StarkerFuss, string> = {
  RECHTS: 'Rechts',
  LINKS: 'Links',
  BEIDFUESSIG: 'Beidfüßig',
}

export const TENNIS_OBERFLAECHE_LABELS: Record<TennisOberflaeche, string> = {
  HARTPLATZ: 'Hartplatz',
  SANDPLATZ: 'Sandplatz',
  RASEN: 'Rasen',
  TEPPICH: 'Teppich',
}

export const TENNIS_SPIELSTIL_LABELS: Record<TennisSpielstil, string> = {
  BASELINER: 'Baseliner',
  SERVE_AND_VOLLEY: 'Serve & Volley',
  ALLROUNDER: 'Allrounder',
  DEFENSIVE_BASELINER: 'Defensiver Baseliner',
}

export const TENNIS_DISZIPLIN_LABELS: Record<TennisDisziplin, string> = {
  EINZEL: 'Einzel',
  DOPPEL: 'Doppel',
  MIXED: 'Mixed',
}

export const TENNIS_TURNIERERFAHRUNG_LABELS: Record<TennisTurniererfahrung, string> = {
  KEINE: 'Keine',
  ANFAENGER: 'Anfänger',
  FORTGESCHRITTEN: 'Fortgeschritten',
  ERFAHREN: 'Erfahren',
  PROFI: 'Profi',
}

export const TENNIS_ZIEL_LABELS: Record<TennisZiel, string> = {
  SPARRING_FINDEN: 'Sparringpartner finden',
  LK_VERBESSERN: 'LK verbessern',
  TURNIERE_SPIELEN: 'Turniere spielen',
  VERBANDSNIVEAU: 'Verbandsniveau erreichen',
}

export const SPIELHAND_LABELS: Record<Spielhand, string> = {
  RECHTS: 'Rechts',
  LINKS: 'Links',
}

export const TENNIS_RUECKHAND_LABELS: Record<TennisRueckhand, string> = {
  EINHAENDIG: 'Einhändig',
  ZWEIHAENDIG: 'Zweihändig',
}

export const BASKETBALL_POSITION_LABELS: Record<BasketballPosition, string> = {
  POINT_GUARD: 'Point Guard',
  SHOOTING_GUARD: 'Shooting Guard',
  SMALL_FORWARD: 'Small Forward',
  POWER_FORWARD: 'Power Forward',
  CENTER: 'Center',
}

export const BASKETBALL_LIGA_LABELS: Record<BasketballLigaNiveau, string> = {
  KREISLIGA: 'Kreisliga',
  BEZIRKSLIGA: 'Bezirksliga',
  LANDESLIGA: 'Landesliga',
  VERBANDSLIGA: 'Verbandsliga',
  OBERLIGA: 'Oberliga',
  REGIONALLIGA: 'Regionalliga',
  DRITTE_LIGA: '3. Liga',
  PRO_B: 'Pro B',
  BEKO_BBL: 'Beko BBL',
  BUNDESLIGA: 'Bundesliga (BBL)',
}

export const BASKETBALL_STAERKE_LABELS: Record<BasketballStaerke, string> = {
  BALLHANDLING: 'Ballhandling',
  PASSEN: 'Passen',
  DREIERWURF: 'Dreierwurf',
  MITTELDISTANZ: 'Mitteldistanz',
  KORBLEGER: 'Korbleger',
  VERTEIDIGUNG: 'Verteidigung',
  REBOUND: 'Rebound',
  ATHLETIK: 'Athletik',
  SPIELVERSTAENDNIS: 'Spielverständnis',
  AUSDAUER: 'Ausdauer',
  FUEHRERQUALITAET: 'Führungsqualität',
}

export const BASKETBALL_SPIELSTIL_LABELS: Record<BasketballSpielstil, string> = {
  PLAYMAKER: 'Playmaker',
  SCORER: 'Scorer',
  DEFENDER: 'Defender',
  REBOUNDER: 'Rebounder',
  ALLROUNDER: 'Allrounder',
}

export const BASKETBALL_ZIEL_LABELS: Record<BasketballZiel, string> = {
  FREIZEIT: 'Freizeitsport',
  LEISTUNG_VERBESSERN: 'Leistung verbessern',
  HOEHERE_LIGA: 'Höhere Liga anstreben',
}

export const WURFHAND_LABELS: Record<Wurfhand, string> = {
  RECHTS: 'Rechts',
  LINKS: 'Links',
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema-Map (intern)
// ─────────────────────────────────────────────────────────────────────────────

type SportSchemaMap = {
  fussball: typeof fussballProfilSchema
  tennis: typeof tennisProfilSchema
  basketball: typeof basketballProfilSchema
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: getSportProfilSchema
// Gibt das korrekte Zod-Schema für den übergebenen Sport-Slug zurück.
// ─────────────────────────────────────────────────────────────────────────────

export function getSportProfilSchema<S extends SportSlug>(slug: S): SportSchemaMap[S] {
  const schemas: SportSchemaMap = {
    fussball: fussballProfilSchema,
    tennis: tennisProfilSchema,
    basketball: basketballProfilSchema,
  }
  return schemas[slug]
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: validateSportProfil
// Validiert unbekannte Daten gegen das Schema der Sportart.
// Wirft nie – gibt immer ein typsicheres Ergebnis zurück.
// ─────────────────────────────────────────────────────────────────────────────

export function validateSportProfil<S extends SportSlug>(
  slug: S,
  data: unknown,
): ValidationResult<SportProfilBySlug[S]> {
  const schema = getSportProfilSchema(slug)
  const result = schema.safeParse(data)
  if (result.success) {
    // Typsicher: Das Schema für Slug S gibt immer SportProfilBySlug[S] aus.
    return { success: true, data: result.data as SportProfilBySlug[S] }
  }
  return { success: false, errors: result.error }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: getDefaultSportProfil
// Gibt sinnvolle Standardwerte für das Onboarding-Formular zurück.
// ─────────────────────────────────────────────────────────────────────────────

export function getDefaultSportProfil(slug: 'fussball'): FussballProfil
export function getDefaultSportProfil(slug: 'tennis'): TennisProfil
export function getDefaultSportProfil(slug: 'basketball'): BasketballProfil
export function getDefaultSportProfil(slug: SportSlug): AnySportProfil {
  switch (slug) {
    case 'fussball':
      return {
        position: 'ZENTRALES_MITTELFELD',
        starkerFuss: 'RECHTS',
        aktuellesLigaNiveau: 'KREISLIGA_A',
        spielstil: 'AUSGEWOGEN',
        staerken: [],
        trainingsEinheitenProWoche: 2,
        hatTrainer: false,
        hatVerein: false,
        ziel: 'NIVEAU_HALTEN',
      } satisfies FussballProfil

    case 'tennis':
      return {
        spielhand: 'RECHTS',
        rueckhand: 'ZWEIHAENDIG',
        lieblingsoberflaeche: 'SANDPLATZ',
        spielstil: 'BASELINER',
        disziplinen: ['EINZEL'],
        turniererfahrung: 'KEINE',
        sucheSparringpartner: false,
        trainingsEinheitenProWoche: 2,
        hatTrainer: false,
        hatVerein: false,
        ziel: 'LK_VERBESSERN',
      } satisfies TennisProfil

    case 'basketball':
      return {
        position: 'SMALL_FORWARD',
        positionNummer: 3,
        wurfhand: 'RECHTS',
        aktuellesLigaNiveau: 'KREISLIGA',
        staerken: [],
        spielstil: 'ALLROUNDER',
        trainingsEinheitenProWoche: 2,
        hatTrainer: false,
        hatVerein: false,
        ziel: 'LEISTUNG_VERBESSERN',
      } satisfies BasketballProfil
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: formatSportProfilForDisplay
// Erzeugt eine lesbare deutsche Zusammenfassung für E-Mails und Admin-Ansichten.
// Optionale Felder werden nur angezeigt, wenn sie vorhanden sind.
// ─────────────────────────────────────────────────────────────────────────────

export function formatSportProfilForDisplay(profil: AnySportProfil, slug: SportSlug): string {
  const COL = 26
  const line = (label: string, value: string): string =>
    `${label.padEnd(COL)}${value}`
  const separator = '─'.repeat(42)

  const lines: string[] = []

  switch (slug) {
    case 'fussball': {
      const p = profil as FussballProfil
      lines.push('FUSSBALL-PROFIL', separator)
      lines.push(line('Position:', FUSSBALL_POSITION_LABELS[p.position]))
      lines.push(line('Starker Fuß:', STARKERFUSS_LABELS[p.starkerFuss]))
      lines.push(line('Liga-Niveau:', FUSSBALL_LIGA_LABELS[p.aktuellesLigaNiveau]))
      if (p.aktuellerVereinsname !== undefined) {
        lines.push(line('Verein:', p.aktuellerVereinsname))
      }
      lines.push(line('Spielstil:', FUSSBALL_SPIELSTIL_LABELS[p.spielstil]))
      lines.push(
        line(
          'Stärken:',
          p.staerken.length > 0
            ? p.staerken.map((s) => FUSSBALL_STAERKE_LABELS[s]).join(', ')
            : 'Keine Angabe',
        ),
      )
      if (p.trikotNummer !== undefined) {
        lines.push(line('Trikotnummer:', String(p.trikotNummer)))
      }
      if (p.koerpergroesseCm !== undefined) {
        lines.push(line('Körpergröße:', `${p.koerpergroesseCm} cm`))
      }
      if (p.gewichtKg !== undefined) {
        lines.push(line('Gewicht:', `${p.gewichtKg} kg`))
      }
      lines.push(line('Training/Woche:', `${p.trainingsEinheitenProWoche}×`))
      if (p.altersklasse !== undefined) {
        lines.push(line('Altersklasse:', FUSSBALL_ALTERSKLASSE_LABELS[p.altersklasse]))
      }
      if (p.lieblingsspieler !== undefined) {
        lines.push(line('Lieblingsspieler:', p.lieblingsspieler))
      }
      lines.push(line('Trainer:', p.hatTrainer ? 'Ja' : 'Nein'))
      lines.push(line('Vereinsspieler:', p.hatVerein ? 'Ja' : 'Nein'))
      lines.push(line('Ziel:', FUSSBALL_ZIEL_LABELS[p.ziel]))
      break
    }

    case 'tennis': {
      const p = profil as TennisProfil
      lines.push('TENNIS-PROFIL', separator)
      lines.push(line('Spielhand:', SPIELHAND_LABELS[p.spielhand]))
      lines.push(line('Rückhand:', TENNIS_RUECKHAND_LABELS[p.rueckhand]))
      if (p.dtbLk !== undefined) {
        lines.push(line('DTB-LK:', String(p.dtbLk)))
      }
      if (p.dtbId !== undefined) {
        lines.push(line('DTB-ID:', p.dtbId))
      }
      lines.push(line('Liebl. Oberfläche:', TENNIS_OBERFLAECHE_LABELS[p.lieblingsoberflaeche]))
      lines.push(line('Spielstil:', TENNIS_SPIELSTIL_LABELS[p.spielstil]))
      lines.push(
        line(
          'Disziplinen:',
          p.disziplinen.map((d) => TENNIS_DISZIPLIN_LABELS[d]).join(', '),
        ),
      )
      lines.push(line('Turniererfahrung:', TENNIS_TURNIERERFAHRUNG_LABELS[p.turniererfahrung]))
      if (p.aktuellerVereinsname !== undefined) {
        lines.push(line('Verein:', p.aktuellerVereinsname))
      }
      if (p.lieblingsspieler !== undefined) {
        lines.push(line('Lieblingsspieler:', p.lieblingsspieler))
      }
      lines.push(line('Sucht Sparring:', p.sucheSparringpartner ? 'Ja' : 'Nein'))
      if (p.sucheSparringpartner && p.maxSparringDistanzKm !== undefined) {
        lines.push(line('Max. Distanz:', `${p.maxSparringDistanzKm} km`))
      }
      lines.push(line('Training/Woche:', `${p.trainingsEinheitenProWoche}×`))
      lines.push(line('Trainer:', p.hatTrainer ? 'Ja' : 'Nein'))
      lines.push(line('Vereinsspieler:', p.hatVerein ? 'Ja' : 'Nein'))
      lines.push(line('Ziel:', TENNIS_ZIEL_LABELS[p.ziel]))
      break
    }

    case 'basketball': {
      const p = profil as BasketballProfil
      lines.push('BASKETBALL-PROFIL', separator)
      lines.push(line('Position:', BASKETBALL_POSITION_LABELS[p.position]))
      lines.push(line('Positionsnummer:', String(p.positionNummer)))
      lines.push(line('Wurfhand:', WURFHAND_LABELS[p.wurfhand]))
      if (p.koerpergroesseCm !== undefined) {
        lines.push(line('Körpergröße:', `${p.koerpergroesseCm} cm`))
      }
      if (p.gewichtKg !== undefined) {
        lines.push(line('Gewicht:', `${p.gewichtKg} kg`))
      }
      lines.push(line('Liga-Niveau:', BASKETBALL_LIGA_LABELS[p.aktuellesLigaNiveau]))
      if (p.aktuellerVereinsname !== undefined) {
        lines.push(line('Verein:', p.aktuellerVereinsname))
      }
      lines.push(
        line(
          'Stärken:',
          p.staerken.length > 0
            ? p.staerken.map((s) => BASKETBALL_STAERKE_LABELS[s]).join(', ')
            : 'Keine Angabe',
        ),
      )
      lines.push(line('Spielstil:', BASKETBALL_SPIELSTIL_LABELS[p.spielstil]))
      if (p.lieblingsspieler !== undefined) {
        lines.push(line('Lieblingsspieler:', p.lieblingsspieler))
      }
      lines.push(line('Training/Woche:', `${p.trainingsEinheitenProWoche}×`))
      lines.push(line('Trainer:', p.hatTrainer ? 'Ja' : 'Nein'))
      lines.push(line('Vereinsspieler:', p.hatVerein ? 'Ja' : 'Nein'))
      lines.push(line('Ziel:', BASKETBALL_ZIEL_LABELS[p.ziel]))
      break
    }

    default: {
      // Exhaustiveness-Check: TypeScript meldet Fehler wenn eine Sportart fehlt.
      const _exhaustive: never = slug
      return `Unbekannte Sportart: ${String(_exhaustive)}`
    }
  }

  return lines.join('\n')
}
