// ─────────────────────────────────────────────────────────────────
// training-ai.ts – Self-programmed TrainingAI
//
// Vollständig algorithmische Plangenerierung ohne externe KI-API.
// Übungsdatenbank + Periodisierungsalgorithmus + Progressive Overload.
//
// Gemini wird NUR für generateSessionFeedback genutzt (via motivationAI).
// ─────────────────────────────────────────────────────────────────

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { BaseAI } from '@/lib/ai/base-ai'
import { motivationAI } from '@/lib/ai/motivation-ai'
import { validateSportProfil } from '@/lib/sport-profiles'
import type { SportLevel, UserGoal, TrainingSession } from '@/lib/types'
import type { SportSlug, AnySportProfil, FussballProfil, BasketballProfil } from '@/lib/sport-profiles'

// ─────────────────────────────────────────────────────────────────
// Öffentliche Typen (kompatibel mit generate/route.ts)
// ─────────────────────────────────────────────────────────────────

export interface TrainingFormData {
  sportSlug: SportSlug
  level: SportLevel
  durationWeeks: number
  sessionsPerWeek: number
  goals: UserGoal[]
  focusAreas?: string[]
}

export interface TrainingPlanSaveResult {
  planId: string
  planName: string
  description: string
  durationWeeks: number
  sessionsPerWeek: number
  isAiGenerated: true
}

// ─────────────────────────────────────────────────────────────────
// Interne Typen
// ─────────────────────────────────────────────────────────────────

type ExerciseCategory = 'warmup' | 'technik' | 'kondition' | 'kraft' | 'drill'
type ExerciseDifficulty = 'LEICHT' | 'MITTEL' | 'SCHWER'
type WeekPhase = 'GRUNDLAGE' | 'INTENSITAET' | 'PEAK' | 'DELOAD'
type SessionFocus = 'Technik' | 'Kondition' | 'Kraft & Drills'

interface ExerciseTemplate {
  id: string
  name: string
  category: ExerciseCategory
  sets: number
  reps?: number
  durationSeconds?: number
  restSeconds: number
  description: string
  instructions: string[]
  muscleGroups: string[]
  difficulty: ExerciseDifficulty
  equipment: string[]
  isSportDrill: boolean
  injuryModifications: string[]
  levelMin: SportLevel
  relevantGoals: UserGoal[]
  positions?: string[]
}

interface PlanExercise {
  name: string
  sets?: number
  reps?: number
  restSeconds?: number
  description: string
  instructions: string[]
  muscleGroups: string[]
  difficulty: ExerciseDifficulty
  equipment: string[]
  isSportDrill: boolean
  injuryModifications: string[]
}

interface PlanDay {
  dayName: string
  isRestDay: boolean
  focus?: string
  warmupMinutes?: number
  cooldownMinutes?: number
  totalMinutes: number
  notes?: string
  exercises: PlanExercise[]
}

interface PlanWeek {
  weekNumber: number
  focus: string
  weeklyGoal: string
  days: PlanDay[]
}

interface GeneratedPlan {
  planName: string
  description: string
  estimatedCaloriesBurnPerSession: number
  weeks: PlanWeek[]
  progressionTips: string[]
  safetyWarnings: string[]
}

interface TrainingExecuteInput {
  userId: string
  formData: TrainingFormData
  userContext: UserContext
}

interface UserContext {
  level: number
  sportLevel: SportLevel | null
  sportDetails: AnySportProfil | null
  recentSessions: Array<{
    title: string
    durationMin: number
    xpEarned: number
    completedAt: Date
  }>
}

// ─────────────────────────────────────────────────────────────────
// Hilfskonstanten
// ─────────────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<SportLevel, number> = {
  ANFAENGER: 0,
  FORTGESCHRITTENE: 1,
  WETTKAMPF: 2,
  PROFI: 3,
}

const DAY_NAMES = [
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
] as const

const TRAINING_DAY_INDICES: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
}

const SESSION_FOCUSES: SessionFocus[] = ['Technik', 'Kondition', 'Kraft & Drills']

// ─────────────────────────────────────────────────────────────────
// Übungsdatenbank – Fußball (25 Übungen)
// ─────────────────────────────────────────────────────────────────

const FUSSBALL_EXERCISES: ExerciseTemplate[] = [
  // Warmup
  {
    id: 'f-w1', name: 'Dynamisches Einlaufen', category: 'warmup',
    sets: 1, durationSeconds: 300, restSeconds: 0,
    description: 'Lockeres Einlaufen mit dynamischen Bewegungen zur Aufwärmung der Muskulatur.',
    instructions: ['5 Minuten locker ums Feld laufen.', 'Kniehebelauf auf der Stelle 30 Sekunden.', 'Anfersenlauf 30 Sekunden.', 'Armkreisen (10x vor, 10x zurück).', 'Hüftkreisen beidseits (10x je Seite).'],
    muscleGroups: ['Gesamtkörper', 'Beinmuskulatur', 'Hüftbeuger'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: false,
    injuryModifications: ['Bei Knieproblemen: kein Kniehebelauf, langsames Gehen.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'WETTKAMPF', 'FREIZEITSPORT', 'ABNEHMEN', 'MUSKELAUFBAU', 'TECHNIK_VERBESSERN'],
  },
  {
    id: 'f-w2', name: 'Laufschule & Koordination', category: 'warmup',
    sets: 2, reps: 10, restSeconds: 30,
    description: 'Koordinative Laufformen zur Aktivierung des neuromuskulären Systems.',
    instructions: ['2× Kniehebelauf über 20m.', '2× Anfersenlauf über 20m.', '2× Sidestep lateral (20m je Seite).', 'Abschluss: 2× Spurt 20m leicht beschleunigen.'],
    muscleGroups: ['Beinmuskulatur', 'Wade', 'Koordination'], difficulty: 'LEICHT',
    equipment: ['20m freie Fläche'], isSportDrill: false,
    injuryModifications: ['Knöchelproblem: Sidesteps weglassen.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'WETTKAMPF', 'FREIZEITSPORT', 'TECHNIK_VERBESSERN'],
  },
  {
    id: 'f-w3', name: 'Ballführungs-Warm-up', category: 'warmup',
    sets: 2, durationSeconds: 120, restSeconds: 30,
    description: 'Langsames Dribbling zur Ballgewöhnung und allgemeinen Erwärmung.',
    instructions: ['Ball locker mit dem Innenrist führen (30m hin und zurück).', 'Wechsel zum Außenrist, gleiche Distanz.', 'Richtungswechsel mit beiden Füßen üben.'],
    muscleGroups: ['Oberschenkel', 'Wade', 'Fuß'], difficulty: 'LEICHT',
    equipment: ['Fußball'], isSportDrill: true,
    injuryModifications: ['Fußverletzung: ohne Ball nur gehen.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'FITNESS'],
  },
  {
    id: 'f-w4', name: 'Dehnen & Mobilisation', category: 'warmup',
    sets: 1, durationSeconds: 300, restSeconds: 0,
    description: 'Dynamische Dehnung der wichtigsten Muskelgruppen für Fußballer.',
    instructions: ['Hüftbeuger-Ausfallschritte (10× je Seite).', 'Oberschenkel-Dehnung im Stehen (20 Sek je Seite).', 'Waden-Dehnung gegen Wand (20 Sek je Seite).', 'Rumpfrotation (10× je Seite).'],
    muscleGroups: ['Hüftbeuger', 'Oberschenkel', 'Wade', 'Rumpf'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: false,
    injuryModifications: ['Kein Bouncing – langsam halten.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'WETTKAMPF', 'FREIZEITSPORT', 'ABNEHMEN', 'MUSKELAUFBAU', 'TECHNIK_VERBESSERN'],
  },
  // Technik
  {
    id: 'f-t1', name: 'Dribbling-Parcours', category: 'technik',
    sets: 3, reps: 5, restSeconds: 60,
    description: 'Slalom-Dribbling durch Hütchen zur Verbesserung der Ballkontrolle.',
    instructions: ['8 Hütchen im 1,5m-Abstand aufstellen.', 'Ball im Slalom führen (Innen- und Außenrist wechseln).', 'Erste Runde: langsam und kontrolliert.', 'Folgende Runden: progressiv schneller.'],
    muscleGroups: ['Oberschenkel', 'Wade', 'Fuß', 'Koordination'], difficulty: 'LEICHT',
    equipment: ['Fußball', '8 Hütchen'], isSportDrill: true,
    injuryModifications: ['Knieproblem: ohne Richtungswechsel, nur geradeaus.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'FITNESS'],
    positions: ['LINKER_FLUEGELSTUERMER', 'RECHTER_FLUEGELSTUERMER', 'HAENGENDE_SPITZE', 'MITTELSTUERMER', 'OFFENSIVES_MITTELFELD'],
  },
  {
    id: 'f-t2', name: 'Passspiel (1-2-Kontakt)', category: 'technik',
    sets: 4, reps: 10, restSeconds: 45,
    description: 'Flaches Passspiel in Paaren mit Direktabnahme – Grundlage des Kombinationsspiels.',
    instructions: ['Zu zweit auf 8-12m Abstand.', 'Innenrist-Pass, flach, auf den Fuß.', 'Annahme: stoppen, kontrollieren, weiterleiten.', 'Variante ab Satz 3: Direktabnahme.'],
    muscleGroups: ['Beinmuskulatur', 'Hüftbeuger', 'Koordination'], difficulty: 'LEICHT',
    equipment: ['Fußball'], isSportDrill: true,
    injuryModifications: ['Stehend möglich, kein Sprint.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'WETTKAMPF'],
    positions: ['ZENTRALES_MITTELFELD', 'DEFENSIVES_MITTELFELD', 'OFFENSIVES_MITTELFELD', 'LINKES_MITTELFELD', 'RECHTES_MITTELFELD'],
  },
  {
    id: 'f-t3', name: 'Torschuss aus dem 16er', category: 'technik',
    sets: 3, reps: 8, restSeconds: 60,
    description: 'Torschusstraining aus verschiedenen Winkeln im Strafraum.',
    instructions: ['Drei Positionen: zentral, links, rechts (10-15m).', 'Ball kontrollieren, dann gezielt schießen.', 'Wechsel zwischen Vollspann und Innenristschuss.', 'Gezielt auf Torecken zielen.'],
    muscleGroups: ['Oberschenkel', 'Hüfte', 'Gesäß', 'Wade'], difficulty: 'LEICHT',
    equipment: ['Fußball', 'Tor'], isSportDrill: true,
    injuryModifications: ['Knieproblem: Schussgewalt reduzieren.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF', 'FREIZEITSPORT'],
    positions: ['MITTELSTUERMER', 'HAENGENDE_SPITZE', 'LINKER_FLUEGELSTUERMER', 'RECHTER_FLUEGELSTUERMER', 'OFFENSIVES_MITTELFELD'],
  },
  {
    id: 'f-t4', name: 'Flanken & Hereingaben', category: 'technik',
    sets: 3, reps: 8, restSeconds: 60,
    description: 'Flankentraining von links und rechts mit flachen und hohen Hereingaben.',
    instructions: ['Von der Seite (20-25m) flache Flanken in den Strafraum spielen.', 'Abwechselnd links und rechts flanken.', 'Variante: hohe Flanke auf den Fünfmeterraum.'],
    muscleGroups: ['Hüftbeuger', 'Oberschenkel', 'Rumpf'], difficulty: 'MITTEL',
    equipment: ['Fußball', 'Markierungen'], isSportDrill: true,
    injuryModifications: ['Hüftproblem: Schlagweite reduzieren.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
    positions: ['LINKER_VERTEIDIGER', 'RECHTER_VERTEIDIGER', 'LINKES_MITTELFELD', 'RECHTES_MITTELFELD', 'LINKER_FLUEGELSTUERMER', 'RECHTER_FLUEGELSTUERMER'],
  },
  {
    id: 'f-t5', name: '1-gegen-1 Zweikampftraining', category: 'technik',
    sets: 4, reps: 6, restSeconds: 45,
    description: 'Direktes Zweikampftraining mit Angriff und Verteidigung.',
    instructions: ['Zu zweit auf 10m: Angreifer startet mit Ball.', 'Angreifer versucht, am Verteidiger vorbeizukommen.', 'Verteidiger: Ball absichern, kein Foul.', 'Nach jeder Runde Rollenwechsel.'],
    muscleGroups: ['Gesamte Beinmuskulatur', 'Rumpf', 'Gleichgewicht'], difficulty: 'MITTEL',
    equipment: ['Fußball', 'Hütchen'], isSportDrill: true,
    injuryModifications: ['Knieproblem: nur Ballabsicherung, kein Sliding.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
    positions: ['INNENVERTEIDIGER', 'LINKER_VERTEIDIGER', 'RECHTER_VERTEIDIGER', 'DEFENSIVES_MITTELFELD'],
  },
  {
    id: 'f-t6', name: 'Steilpass & Tiefenlauf', category: 'technik',
    sets: 3, reps: 8, restSeconds: 60,
    description: 'Kombination aus getimtem Steilpass und Tiefenlauf hinter die Abwehrlinie.',
    instructions: ['Zu zweit: Passer auf 15m, Läufer seitlich.', 'Läufer: Scheinbewegung, dann Tiefenlauf.', 'Passer spielt Ball zeitgerecht in die Tiefe.', 'Läufer nimmt Ball auf und schließt ab.'],
    muscleGroups: ['Hüftbeuger', 'Oberschenkel', 'Sprintmuskulatur'], difficulty: 'MITTEL',
    equipment: ['Fußball', 'Hütchen'], isSportDrill: true,
    injuryModifications: ['Sprint nach Verletzung schrittweise erhöhen.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
    positions: ['MITTELSTUERMER', 'HAENGENDE_SPITZE', 'LINKER_FLUEGELSTUERMER', 'RECHTER_FLUEGELSTUERMER'],
  },
  {
    id: 'f-t7', name: 'Freistoß-Training', category: 'technik',
    sets: 3, reps: 8, restSeconds: 90,
    description: 'Direkte und indirekte Freistöße aus verschiedenen Distanzen und Winkeln.',
    instructions: ['Position 1: Zentraler Freistoß (20m) – direkter Schuss.', 'Position 2: Halblinks (23m) – Kurve mit Innenrist.', 'Betonung auf Anlauf, Schusshaltung und Präzision.'],
    muscleGroups: ['Oberschenkel', 'Hüfte', 'Rumpf'], difficulty: 'SCHWER',
    equipment: ['Fußball', 'Tor', 'Hütchen als Mauer'], isSportDrill: true,
    injuryModifications: ['Krafteinsatz bei Verletzungen anpassen.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
    positions: ['OFFENSIVES_MITTELFELD', 'HAENGENDE_SPITZE'],
  },
  {
    id: 'f-t8', name: 'Pressing & Gegenpressing', category: 'technik',
    sets: 4, reps: 5, restSeconds: 90,
    description: 'Strukturiertes Pressing nach Ballverlust und sofortiger Gegendruck.',
    instructions: ['2 vs 2 auf kleinem Feld (15×15m).', 'Bei Ballverlust: sofort aggressives Pressing.', 'Spieler ohne Ball blocken Passwege.', 'Wechsel nach Ballgewinn oder 5 Pässen.'],
    muscleGroups: ['Gesamtkörper', 'Kondition', 'Koordination'], difficulty: 'SCHWER',
    equipment: ['Fußball', 'Hütchen'], isSportDrill: true,
    injuryModifications: ['Intensität bei Erschöpfung reduzieren.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['WETTKAMPF', 'FITNESS', 'TECHNIK_VERBESSERN'],
  },
  // Kondition
  {
    id: 'f-k1', name: 'Intervall-Sprints', category: 'kondition',
    sets: 8, reps: 1, durationSeconds: 30, restSeconds: 45,
    description: 'Hochintensive Sprintintervalle zur Verbesserung der Schnellkraft.',
    instructions: ['30m Sprint in maximaler Geschwindigkeit.', '45 Sekunden aktive Erholung (Gehen).', '8 Wiederholungen gesamt.', 'Aufrechter Oberkörper, aktiver Armschwung.'],
    muscleGroups: ['Oberschenkel', 'Gesäß', 'Wade', 'Hüftbeuger'], difficulty: 'MITTEL',
    equipment: ['30m freie Fläche'], isSportDrill: false,
    injuryModifications: ['Muskelbeschwerden: Intensität und Distanz halbieren.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'ABNEHMEN', 'WETTKAMPF', 'MUSKELAUFBAU'],
  },
  {
    id: 'f-k2', name: 'Ausdauerlauf (Grundlage)', category: 'kondition',
    sets: 1, durationSeconds: 1200, restSeconds: 0,
    description: '20 Minuten kontinuierlicher Lauf im aeroben Bereich.',
    instructions: ['20 Minuten gleichmäßig laufen (kein Sprint).', 'Unterhaltungstempo – man kann sich unterhalten.', 'Herzfrequenz: ca. 70% Maximum.', 'Gleichmäßige Atmung durch Nase und Mund.'],
    muscleGroups: ['Beinmuskulatur', 'Herz-Kreislauf'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: false,
    injuryModifications: ['Schongang bei Beschwerden.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'ABNEHMEN', 'FREIZEITSPORT'],
  },
  {
    id: 'f-k3', name: 'Agility-Leiter-Drills', category: 'kondition',
    sets: 4, reps: 3, restSeconds: 60,
    description: 'Koordinationsleiter-Übungen für Schnelligkeit, Beweglichkeit und Schritttechnik.',
    instructions: ['Leiter auslegen (oder Hütchen markieren).', 'Drill 1: Einzeln in jedes Feld (vorwärts).', 'Drill 2: Beide Füße in jedes Feld.', 'Drill 3: Seitwärts durch die Leiter.'],
    muscleGroups: ['Beinmuskulatur', 'Koordination', 'Reaktion'], difficulty: 'MITTEL',
    equipment: ['Koordinationsleiter oder Hütchen'], isSportDrill: false,
    injuryModifications: ['Langsameres Tempo bei Gleichgewichtsproblemen.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['FITNESS', 'WETTKAMPF', 'TECHNIK_VERBESSERN'],
  },
  {
    id: 'f-k4', name: 'Reaktions-Sprints', category: 'kondition',
    sets: 6, reps: 4, restSeconds: 60,
    description: 'Sprintstart auf Signal zur Verbesserung der Reaktionszeit.',
    instructions: ['3m vor Sprintlinie warten.', 'Auf Signal (Klatschen): sofort 15-20m sprinten.', 'Variante: Signal aus unterschiedlichen Richtungen.'],
    muscleGroups: ['Reaktion', 'Oberschenkel', 'Gesäß'], difficulty: 'SCHWER',
    equipment: ['Partner für Signal'], isSportDrill: true,
    injuryModifications: ['Keine maximalen Starts bei Verletzungen.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['WETTKAMPF', 'FITNESS'],
  },
  // Kraft
  {
    id: 'f-s1', name: 'Einbeinige Kniebeugen (Split Squat)', category: 'kraft',
    sets: 3, reps: 10, restSeconds: 90,
    description: 'Einbeinige Kniebeugen für Stabilität und Kraftentwicklung je Bein.',
    instructions: ['Ausfallschrittposition einnehmen.', 'Vorderes Bein bis 90° beugen.', 'Oberkörper aufrecht halten.', '10 Wiederholungen je Seite.'],
    muscleGroups: ['Oberschenkel', 'Gesäß', 'Stabilisatoren'], difficulty: 'MITTEL',
    equipment: ['Kein Equipment'], isSportDrill: false,
    injuryModifications: ['Knieschmerz: Knie nicht über Zehenspitzen führen.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['FITNESS', 'MUSKELAUFBAU', 'WETTKAMPF'],
  },
  {
    id: 'f-s2', name: 'Nordic Hamstring Curls', category: 'kraft',
    sets: 3, reps: 8, restSeconds: 90,
    description: 'Hamstring-Exzentrik-Übung zur Verletzungsprävention.',
    instructions: ['Knien, Füße von Partner fixieren.', 'Oberkörper langsam nach vorne (4-5 Sek).', 'Spannung halten – so weit wie möglich.', 'Mit Armen abfangen, zurückschieben.'],
    muscleGroups: ['Oberschenkelrückseite', 'Kniestabilisatoren'], difficulty: 'MITTEL',
    equipment: ['Matte', 'Partner'], isSportDrill: false,
    injuryModifications: ['Bei Hamstring-Verletzung: erst nach Freigabe.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['FITNESS', 'WETTKAMPF', 'MUSKELAUFBAU'],
  },
  {
    id: 'f-s3', name: 'Glute Bridges', category: 'kraft',
    sets: 3, reps: 15, restSeconds: 60,
    description: 'Gesäßbrücke für Hüftstabilität – wichtig für Antritt und Zweikampf.',
    instructions: ['Rückenlage, Knie 90°, Füße hüftbreit.', 'Hüfte hochdrücken bis Körper gerade.', 'Oben: 2 Sek halten, Gesäß anspannen.', 'Langsam absenken.'],
    muscleGroups: ['Gesäß', 'Hüftbeuger', 'Unterer Rücken'], difficulty: 'LEICHT',
    equipment: ['Matte'], isSportDrill: false,
    injuryModifications: ['Rückenprob: Hüfte nicht zu hoch drücken.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'ABNEHMEN', 'MUSKELAUFBAU'],
  },
  {
    id: 'f-s4', name: 'Liegestütze (Zweikampfstabilität)', category: 'kraft',
    sets: 3, reps: 12, restSeconds: 60,
    description: 'Oberkörperkraft für Rumpfstabilität und Zweikampfhärte.',
    instructions: ['Liegestütz-Position: Körper gerade.', 'Brust bis 5cm zur Matte.', 'Explosiv hochdrücken.', 'Keine Hüftbewegung.'],
    muscleGroups: ['Brust', 'Trizeps', 'Schulter', 'Rumpf'], difficulty: 'LEICHT',
    equipment: ['Matte'], isSportDrill: false,
    injuryModifications: ['Kniegestützte Variante für Einsteiger.'],
    levelMin: 'ANFAENGER', relevantGoals: ['MUSKELAUFBAU', 'FITNESS', 'WETTKAMPF'],
  },
  // Drills
  {
    id: 'f-d1', name: 'Rondo 4:1 (Ballbesitz)', category: 'drill',
    sets: 4, durationSeconds: 120, restSeconds: 60,
    description: 'Klassisches Fußball-Rondo: 4 Spieler halten Ball gegen 1 Verteidiger.',
    instructions: ['5 Spieler auf Kreis (8m).', '4 außen halten Ball gegen 1 in der Mitte.', 'Ziel außen: 10 Pässe ohne Ballverlust.', 'Bei Ballverlust: Passgeber wechselt in Mitte.'],
    muscleGroups: ['Passspiel', 'Reaktion', 'Positionsspiel'], difficulty: 'MITTEL',
    equipment: ['Fußball', '5 Spieler'], isSportDrill: true,
    injuryModifications: ['Weniger intensive Variante: kein Pressing.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['WETTKAMPF', 'TECHNIK_VERBESSERN'],
  },
  {
    id: 'f-d2', name: 'Spielform auf kleines Tor', category: 'drill',
    sets: 3, durationSeconds: 300, restSeconds: 120,
    description: 'Kleinfeldspiel mit Schwerpunkt auf schnelles Umschaltspiel.',
    instructions: ['3 vs 3 auf 20×20m mit kleinen Toren.', 'Ziel: Tore erzielen, sofortiges Pressing.', 'Maximal 3 Ballkontakte erlaubt.'],
    muscleGroups: ['Gesamtkörper', 'Ausdauer', 'Reaktion'], difficulty: 'SCHWER',
    equipment: ['Fußball', 'Hütchen', 'Kleine Tore'], isSportDrill: true,
    injuryModifications: ['Bei Verletzung nur beobachten.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['WETTKAMPF', 'FITNESS'],
  },
  {
    id: 'f-d3', name: 'Positionsspiel 5:5', category: 'drill',
    sets: 2, durationSeconds: 480, restSeconds: 180,
    description: 'Taktisches Positionsspiel zur Automatisierung von Spielideen.',
    instructions: ['5 vs 5 auf Halbfeld, kein Torabschluss.', 'Ziel: 10 Pässe in Folge = 1 Punkt.', 'Spieler halten ihre Zonen.'],
    muscleGroups: ['Gesamtkörper', 'Taktik', 'Kommunikation'], difficulty: 'SCHWER',
    equipment: ['Fußball', 'Hütchen', '10 Spieler'], isSportDrill: true,
    injuryModifications: ['Tempo reduzieren, keine intensiven Zweikämpfe.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['WETTKAMPF', 'TECHNIK_VERBESSERN'],
  },
]

// ─────────────────────────────────────────────────────────────────
// Übungsdatenbank – Tennis (24 Übungen)
// ─────────────────────────────────────────────────────────────────

const TENNIS_EXERCISES: ExerciseTemplate[] = [
  // Warmup
  {
    id: 't-w1', name: 'Einlaufen um den Platz', category: 'warmup',
    sets: 1, durationSeconds: 240, restSeconds: 0,
    description: 'Lockeres Einlaufen um den Tennisplatz zur allgemeinen Erwärmung.',
    instructions: ['2 Runden leicht ums Feld.', 'Armkreisen: 10× vor, 10× zurück.', 'Seitwärtslauf entlang der Grundlinie (je 2×).'],
    muscleGroups: ['Gesamtkörper', 'Herz-Kreislauf'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: false,
    injuryModifications: ['Knieproblem: gehen statt laufen.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'FREIZEITSPORT', 'WETTKAMPF', 'TECHNIK_VERBESSERN', 'ABNEHMEN', 'MUSKELAUFBAU'],
  },
  {
    id: 't-w2', name: 'Mini-Tennis am Servicefield', category: 'warmup',
    sets: 1, durationSeconds: 300, restSeconds: 0,
    description: 'Rallying im Servicefeldbereich zur Ballgewöhnung und Handgelenkerwärmung.',
    instructions: ['Beide an der T-Linie.', 'Ball kontrolliert übers Netz, innerhalb Servicefeld.', 'Kein starker Schlag – Ball im Spiel halten.', 'Nach 3 Min auf Grundlinienspiel wechseln.'],
    muscleGroups: ['Unterarm', 'Schulter', 'Reaktion'], difficulty: 'LEICHT',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Schulterproblem: nur passive Schläge.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'WETTKAMPF'],
  },
  {
    id: 't-w3', name: 'Schultermobilisation', category: 'warmup',
    sets: 2, reps: 10, restSeconds: 30,
    description: 'Gezielte Schultererwärmung zur Vorbeugung von Verletzungen.',
    instructions: ['Armkreise vorwärts: 10×.', 'Armkreise rückwärts: 10×.', 'Schulterrotation (Dosenöffner): 10× je Seite.', 'Querdehnung: 20 Sek je Seite halten.'],
    muscleGroups: ['Schulter', 'Rotatorenmanschette'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: false,
    injuryModifications: ['Schulterverletzung: nur langsame Kreise.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'WETTKAMPF', 'TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'ABNEHMEN', 'MUSKELAUFBAU'],
  },
  {
    id: 't-w4', name: 'Split-Step & Footwork', category: 'warmup',
    sets: 3, reps: 10, restSeconds: 30,
    description: 'Aktivierung des Reaktions-Footworks durch Split-Step-Übungen.',
    instructions: ['Grundposition an der T-Linie.', 'Split-Step → seitlich 2-3 Schritte → zurück.', 'Split-Step → vorwärts → Split-Step → rückwärts.', 'Bewegung: leicht und reaktiv.'],
    muscleGroups: ['Beinmuskulatur', 'Reaktion', 'Koordination'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: true,
    injuryModifications: ['Knieproblem: Split-Step kleiner machen.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'WETTKAMPF', 'TECHNIK_VERBESSERN'],
  },
  // Technik
  {
    id: 't-t1', name: 'Vorhand Cross-Court Rally', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Kontrolliertes Vorhand-Rallying diagonal zur Stabilisierung des Grundschlags.',
    instructions: ['Beide spielen aus der Rückhand-Ecke diagonal.', 'Ziel: Ball im Cross-Court-Feld halten.', '10 Schläge am Stück ohne Fehler.', 'Gleichmäßige Ausholbewegung, Treffpunkt vor dem Körper.'],
    muscleGroups: ['Unterarm', 'Schulter', 'Rumpfrotation'], difficulty: 'LEICHT',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Ellenbogenproblem: Schlagkraft reduzieren.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'FITNESS'],
  },
  {
    id: 't-t2', name: 'Rückhand Longline', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Rückhand-Grundschlag in gerader Linie zur Kontrolle.',
    instructions: ['Einer schlägt longline Rückhand, der andere nimmt Cross zurück.', 'Zweihändig: Schulterdrehung betonen.', 'Einhändig: Ausholbewegung nach hinten-unten.'],
    muscleGroups: ['Schulter', 'Unterarm', 'Rumpf'], difficulty: 'LEICHT',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Schulterrotation bei Beschwerden reduzieren.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'WETTKAMPF'],
  },
  {
    id: 't-t3', name: 'Aufschlag-Training (2. Aufschlag)', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Sicherheitsaufschlag mit Spin für mehr Verlässlichkeit.',
    instructions: ['Hinter der Grundlinie (beide Seiten).', 'Slice-Aufschlag mit höherem Netzübergang.', 'Durchschwingen nach dem Aufschlag.', 'Ziel: 8 von 10 im Feld.'],
    muscleGroups: ['Schulter', 'Trizeps', 'Rumpf'], difficulty: 'MITTEL',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Schulterprobleme: Arm nicht zu hoch.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
  },
  {
    id: 't-t4', name: 'Vorhand Topspin (Heavy Ball)', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Topspin-Vorhand mit hohem Netzübergang und tiefem Aufprall.',
    instructions: ['Offener Stand, früh vorbereiten.', 'Schläger tief → Brushing-Bewegung nach oben.', 'Ball überquert Netz mit 2-3m Höhe.', 'Durchschwingen über die Schulter.'],
    muscleGroups: ['Schulter', 'Rumpfrotation', 'Unterarm'], difficulty: 'MITTEL',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Ellenbogen: vollständige Pronation bei Schmerzen vermeiden.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
  },
  {
    id: 't-t5', name: 'Rückhand Slice', category: 'technik',
    sets: 3, reps: 10, restSeconds: 60,
    description: 'Kontrollierter Slice-Grundschlag zur Variation.',
    instructions: ['Continental-Griffwechsel.', 'Schläger von oben nach unten durch den Ball.', 'Flach über das Netz mit Rückwärtsdrall.', 'Einsetzen: hohe Bälle, defensive Situationen.'],
    muscleGroups: ['Schulter', 'Unterarm', 'Handgelenk'], difficulty: 'MITTEL',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Handgelenkproblem: nur leichte Schnittbewegung.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
  },
  {
    id: 't-t6', name: 'Netz-Volley Grundübung', category: 'technik',
    sets: 3, reps: 10, restSeconds: 60,
    description: 'Vorhand- und Rückhand-Volleys am Netz.',
    instructions: ['Position: ca. 1m hinter dem Netz.', 'Partner spielt kontrollierte Bälle.', 'Volley: blocken, nicht ausholen.', 'Abwechselnd Vorhand und Rückhand.'],
    muscleGroups: ['Unterarm', 'Schulter', 'Reaktion'], difficulty: 'LEICHT',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Schulterproblem: Ausholen weglassen.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'WETTKAMPF'],
  },
  {
    id: 't-t7', name: 'Return-Training', category: 'technik',
    sets: 4, reps: 8, restSeconds: 60,
    description: 'Returntraining auf ersten und zweiten Aufschlag.',
    instructions: ['Partner schlägt Aufschläge (Ad- und Deuceside).', '1. Aufschlag: defensiver Return Cross.', '2. Aufschlag: aggressiver Return mit Druck.', 'Split-Step → Schulterdrehung → Return.'],
    muscleGroups: ['Reaktion', 'Schulter', 'Beinarbeit'], difficulty: 'MITTEL',
    equipment: ['Tennisschläger', 'Bälle', 'Partner'], isSportDrill: true,
    injuryModifications: ['Partner passt Tempo an.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
  },
  {
    id: 't-t8', name: 'Dropshot-Training', category: 'technik',
    sets: 3, reps: 8, restSeconds: 60,
    description: 'Dropshot als Variation – Slice kurz über das Netz.',
    instructions: ['Grundlinien-Rally einleiten (3-4 Schläge).', 'Unerwarteter Dropshot mit Täuschungsbewegung.', 'Kürzer und softer als normaler Slice.', 'Ball: nah am Netz mit Rückwärtsdrall aufkommen.'],
    muscleGroups: ['Handgelenk', 'Unterarm', 'Spielgefühl'], difficulty: 'SCHWER',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Handgelenkproblem: kein aggressives Cutting.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
  },
  {
    id: 't-t9', name: 'Serve & Volley Sequenz', category: 'technik',
    sets: 3, reps: 8, restSeconds: 90,
    description: 'Aufschlag mit sofortigem Netzangriff für aggressive Punkte.',
    instructions: ['Aufschlag spielen.', 'Sofort nach vorne (3-4 Schritte).', 'Split-Step vor dem Return des Gegners.', 'Volley → Punkt.'],
    muscleGroups: ['Schulter', 'Beinarbeit', 'Reaktion'], difficulty: 'SCHWER',
    equipment: ['Tennisschläger', 'Bälle', 'Partner'], isSportDrill: true,
    injuryModifications: ['Schulterproblem: Aufschlag schonend.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['WETTKAMPF', 'TECHNIK_VERBESSERN'],
  },
  // Kondition
  {
    id: 't-k1', name: 'Baseline-Sprints', category: 'kondition',
    sets: 5, reps: 6, restSeconds: 60,
    description: 'Grundlinien-zu-Netz-Sprints für tennisspecifische Kondition.',
    instructions: ['Start: Grundlinie Mitte.', 'Sprint zum Netz (6m) und zurück.', '6 Wdh. am Stück, dann Pause.'],
    muscleGroups: ['Oberschenkel', 'Wade', 'Herz-Kreislauf'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: false,
    injuryModifications: ['Knieschmerz: halbe Distanz.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'ABNEHMEN', 'WETTKAMPF'],
  },
  {
    id: 't-k2', name: 'T-Drill (Tennisplatz)', category: 'kondition',
    sets: 4, reps: 5, restSeconds: 90,
    description: 'Agility-Drill mit tennisspecifischen Laufwegen im T-Muster.',
    instructions: ['Start: Grundlinie Mitte.', 'Sprint zum T (6m), links (3m), zurück Mitte, rechts (3m), zurück.', 'Zeit messen für Verbesserungsfortschritt.'],
    muscleGroups: ['Beinmuskulatur', 'Koordination', 'Reaktion'], difficulty: 'MITTEL',
    equipment: ['Hütchen'], isSportDrill: false,
    injuryModifications: ['Tempo reduzieren bei Schwindel.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['FITNESS', 'WETTKAMPF'],
  },
  {
    id: 't-k3', name: 'Side-Step Grundlinientraining', category: 'kondition',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Seitwärtsbewegungen entlang der Grundlinie für tennisspecifisches Footwork.',
    instructions: ['Start: Grundlinie Mitte.', 'Seitwärts zur Außenlinie (3m) und zurück.', 'Kein Beinüberkreuzen (Side-Step-Technik).', 'Split-Step vor der Richtungsänderung.'],
    muscleGroups: ['Adduktoren', 'Abduktoren', 'Beinmuskulatur'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: true,
    injuryModifications: ['Hüftproblem: reduzierte Amplitude.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'TECHNIK_VERBESSERN', 'WETTKAMPF'],
  },
  {
    id: 't-k4', name: 'Seilspringen für Fußarbeit', category: 'kondition',
    sets: 4, durationSeconds: 60, restSeconds: 60,
    description: 'Seilspringen zur Verbesserung von Sprunggelenksstabilität und Koordination.',
    instructions: ['60 Sek beidbeinig springen.', 'Varianten: einbeinig, Doppelschlag.', 'Rhythmus gleichmäßig halten.', 'Aufprall: Fußballen, nicht Ferse.'],
    muscleGroups: ['Wade', 'Sprunggelenk', 'Koordination'], difficulty: 'LEICHT',
    equipment: ['Springseil'], isSportDrill: false,
    injuryModifications: ['Sprunggelenkproblem: auf der Stelle laufen ohne Seil.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'ABNEHMEN', 'MUSKELAUFBAU'],
  },
  // Kraft
  {
    id: 't-s1', name: 'Rotations-Core (Russian Twists)', category: 'kraft',
    sets: 3, reps: 20, restSeconds: 60,
    description: 'Rumpfrotations-Übung für Schlagkraft beim Tennis.',
    instructions: ['Sitzposition, Beine leicht angehoben.', 'Mit Armen seitlich rotieren (20× = 10 je Seite).', 'Rumpf stabil halten.'],
    muscleGroups: ['Seitliche Bauchmuskeln', 'Rumpf', 'Hüftbeuger'], difficulty: 'MITTEL',
    equipment: ['Matte', 'Medizinball (optional)'], isSportDrill: false,
    injuryModifications: ['Rückenproblem: Beine ablegen.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['FITNESS', 'MUSKELAUFBAU', 'WETTKAMPF'],
  },
  {
    id: 't-s2', name: 'Schlagbewegung mit Theraband', category: 'kraft',
    sets: 3, reps: 15, restSeconds: 60,
    description: 'Kräftigung der Schulter und Rotatorenmanschette mit Widerstandsband.',
    instructions: ['Band an fixem Punkt befestigen.', 'Vorhand-Schlagbewegung gegen Widerstand: 15×.', 'Rückhand-Schlagbewegung: 15× je Seite.', 'Langsam und kontrolliert.'],
    muscleGroups: ['Schulter', 'Rotatorenmanschette', 'Unterarm'], difficulty: 'LEICHT',
    equipment: ['Theraband'], isSportDrill: false,
    injuryModifications: ['Schulterproblem: geringerer Widerstand.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'MUSKELAUFBAU', 'TECHNIK_VERBESSERN'],
  },
  {
    id: 't-s3', name: 'Liegestütze & Schulterrotation', category: 'kraft',
    sets: 3, reps: 12, restSeconds: 60,
    description: 'Liegestütze mit Schulterrotation für Oberkörperkraft.',
    instructions: ['Standard-Liegestütz.', 'Oben: Körper drehen (T-Position), Arm zur Decke.', 'Kurz halten, zurück, andere Seite.'],
    muscleGroups: ['Brust', 'Schulter', 'Trizeps', 'Rumpf'], difficulty: 'LEICHT',
    equipment: ['Matte'], isSportDrill: false,
    injuryModifications: ['Knie abstützen bei Beschwerden.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'MUSKELAUFBAU'],
  },
  // Drills
  {
    id: 't-d1', name: 'Cross-Longline-Drill', category: 'drill',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Klassischer Taktik-Drill: Cross abwechselnd mit Down-the-Line.',
    instructions: ['Spieler A: immer Cross-Court.', 'Spieler B: immer Down-the-Line.', 'Beide: 10 Schläge in Folge.', 'Nach 5 Min: Rollen tauschen.'],
    muscleGroups: ['Schulter', 'Beinarbeit', 'Taktik'], difficulty: 'MITTEL',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Intensität und Tempo anpassen.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
  },
  {
    id: 't-d2', name: 'Rally-Konsistenz-Drill', category: 'drill',
    sets: 3, reps: 10, restSeconds: 60,
    description: 'Rally-Drill: 10 Bälle in Folge ins Feld spielen.',
    instructions: ['Beide von der Grundlinie.', 'Ziel: 10 Bälle konsistent (kein Winner, kein Fehler).', 'Bei 10: Reset und neu starten.', 'Fortschritt: Ziel auf 15, dann 20 erhöhen.'],
    muscleGroups: ['Schulter', 'Beinarbeit', 'Konzentration'], difficulty: 'LEICHT',
    equipment: ['Tennisschläger', 'Bälle'], isSportDrill: true,
    injuryModifications: ['Tempo bei Beschwerden reduzieren.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT'],
  },
  {
    id: 't-d3', name: 'Match-Tiebreak-Simulation', category: 'drill',
    sets: 3, durationSeconds: 600, restSeconds: 120,
    description: 'Drucksimulation: 10-Punkte-Tiebreak als wettkampfnahe Übung.',
    instructions: ['10-Punkte-Tiebreak spielen.', 'Bei 5:5: mindestens 2 Punkte Vorsprung.', 'Bewusst Druck-Situationen beachten.', 'Reflexion nach jedem Tiebreak.'],
    muscleGroups: ['Gesamtkörper', 'Konzentration', 'Wettkampfhärte'], difficulty: 'SCHWER',
    equipment: ['Tennisschläger', 'Bälle', 'Partner'], isSportDrill: true,
    injuryModifications: ['Nur bei guter körperlicher Verfassung.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['WETTKAMPF'],
  },
]

// ─────────────────────────────────────────────────────────────────
// Übungsdatenbank – Basketball (24 Übungen)
// ─────────────────────────────────────────────────────────────────

const BASKETBALL_EXERCISES: ExerciseTemplate[] = [
  // Warmup
  {
    id: 'b-w1', name: 'Dynamic Warm-up (Court-Laps)', category: 'warmup',
    sets: 1, durationSeconds: 300, restSeconds: 0,
    description: 'Dynamisches Aufwärmen mit Laufformen auf dem Basketballfeld.',
    instructions: ['2 Runden locker ums Feld.', 'Knieheben auf der Stelle (30 Sek).', 'Anfersenlauf (30 Sek).', 'Arm- und Hüftkreisen.'],
    muscleGroups: ['Gesamtkörper', 'Herz-Kreislauf'], difficulty: 'LEICHT',
    equipment: ['Basketballfeld'], isSportDrill: false,
    injuryModifications: ['Knieproblem: gehen statt laufen.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'FREIZEITSPORT', 'WETTKAMPF', 'TECHNIK_VERBESSERN', 'ABNEHMEN', 'MUSKELAUFBAU'],
  },
  {
    id: 'b-w2', name: 'Ball Handling Warm-up', category: 'warmup',
    sets: 2, durationSeconds: 120, restSeconds: 30,
    description: 'Lockeres Dribbling zur Handerwärmung und Ballgefühl-Aktivierung.',
    instructions: ['Dribbling rechts (30 Sek).', 'Dribbling links (30 Sek).', 'Abwechselnd (30 Sek).', 'In Bewegung über das Feld.'],
    muscleGroups: ['Handgelenk', 'Unterarm', 'Koordination'], difficulty: 'LEICHT',
    equipment: ['Basketball'], isSportDrill: true,
    injuryModifications: ['Handgelenkproblem: nur passive Ballkontrolle.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'FITNESS'],
  },
  {
    id: 'b-w3', name: 'Dynamic Stretching Basketball', category: 'warmup',
    sets: 1, durationSeconds: 300, restSeconds: 0,
    description: 'Dynamische Dehnung der wichtigsten Muskelgruppen für Basketball.',
    instructions: ['Hüftöffner-Ausfallschritte (10× je Seite).', 'Schulterquerdehnung (20 Sek je Seite).', 'Hüftbeuger-Stretch (20 Sek je Seite).', 'Kniekreisen (10× je Richtung).'],
    muscleGroups: ['Hüftbeuger', 'Schulter', 'Oberschenkel', 'Rumpf'], difficulty: 'LEICHT',
    equipment: ['Matte (optional)'], isSportDrill: false,
    injuryModifications: ['Bei Schmerzen: betroffene Dehnung weglassen.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'WETTKAMPF', 'FREIZEITSPORT', 'ABNEHMEN', 'MUSKELAUFBAU', 'TECHNIK_VERBESSERN'],
  },
  {
    id: 'b-w4', name: 'Einfache Layups beidseits', category: 'warmup',
    sets: 2, reps: 10, restSeconds: 30,
    description: 'Lockere Korbleger von beiden Seiten zur Aktivierung.',
    instructions: ['5× Korbleger von rechts.', '5× Korbleger von links.', 'Moderates Tempo, weiche Landung.'],
    muscleGroups: ['Beinmuskulatur', 'Handgelenk', 'Koordination'], difficulty: 'LEICHT',
    equipment: ['Basketball', 'Korb'], isSportDrill: true,
    injuryModifications: ['Knieproblem: Walking Layup ohne Sprung.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'FITNESS'],
  },
  // Technik
  {
    id: 'b-t1', name: 'Layup-Training beidseits', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Korbleger-Training mit zunehmendem Tempo und Varianten.',
    instructions: ['Von rechts: 2-Schritt-Korbleger (rechter Fuß zuerst).', 'Von links: 2-Schritt-Korbleger (linker Fuß zuerst).', 'Tempo schrittweise steigern.', 'Variante: Reverse Layup einbauen.'],
    muscleGroups: ['Oberschenkel', 'Wade', 'Handgelenk'], difficulty: 'LEICHT',
    equipment: ['Basketball', 'Korb'], isSportDrill: true,
    injuryModifications: ['Knieproblem: ohne Sprung, nur Aufleger.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'FITNESS'],
    positions: ['SMALL_FORWARD', 'POINT_GUARD', 'SHOOTING_GUARD'],
  },
  {
    id: 'b-t2', name: 'Freiwurf-Serien', category: 'technik',
    sets: 5, reps: 10, restSeconds: 60,
    description: 'Freiwurfserie zur Konsistenz und mentaler Stabilität.',
    instructions: ['10 Freiwürfe am Stück.', 'Routine: 2-3× dribbeln, ausrichten, werfen.', 'Kniebeuge einleiten, Follow-through.', 'Ziel: 7 von 10 treffen.'],
    muscleGroups: ['Schulter', 'Trizeps', 'Handgelenk'], difficulty: 'LEICHT',
    equipment: ['Basketball', 'Korb'], isSportDrill: true,
    injuryModifications: ['Schulterproblem: geringere Schusshöhe.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FREIZEITSPORT', 'WETTKAMPF'],
    positions: ['SHOOTING_GUARD', 'POINT_GUARD', 'SMALL_FORWARD'],
  },
  {
    id: 'b-t3', name: 'Catch-and-Shoot von der Ecke', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Einnahme-und-sofort-Schuss aus der Ecke für Off-Ball-Spieler.',
    instructions: ['Position: Ecke Dreierlinie.', 'Partner passt flach.', 'Sofort in Wurfposition (kein extra Dribbling).', 'Abwechselnd linke und rechte Ecke.'],
    muscleGroups: ['Schulter', 'Beinmuskulatur', 'Handgelenk'], difficulty: 'LEICHT',
    equipment: ['Basketball', 'Korb'], isSportDrill: true,
    injuryModifications: ['Schulterproblem: nahe am Korb starten.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
    positions: ['SHOOTING_GUARD', 'SMALL_FORWARD'],
  },
  {
    id: 'b-t4', name: 'Mid-Range Sprungwurf', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Sprungwurf aus Mitteldistanz mit Dribbling-Einleitung.',
    instructions: ['Position: Flügel oder Elbow (ca. 5m).', 'Ein oder zwei Dribbles, dann Schritt zum Schuss.', 'Sprung gerade hoch, Schuss auf dem Weg nach oben.', 'Follow-through: Handgelenk schnappen.'],
    muscleGroups: ['Schulter', 'Trizeps', 'Oberschenkel', 'Handgelenk'], difficulty: 'MITTEL',
    equipment: ['Basketball', 'Korb'], isSportDrill: true,
    injuryModifications: ['Knieproblem: Sprung reduzieren.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
    positions: ['SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD'],
  },
  {
    id: 'b-t5', name: 'Dribbling Crossover-Drill', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Crossover-Dribbling für Richtungswechsel und Ball-Security.',
    instructions: ['Langsam: Crossover auf der Stelle.', 'Mit Vorwärtsbewegung: Crossover in Bewegung.', 'Behind-the-Back und Between-the-Legs einbauen.', 'Abschluss mit Korbleger oder Sprungwurf.'],
    muscleGroups: ['Handgelenk', 'Unterarm', 'Koordination', 'Beinmuskulatur'], difficulty: 'MITTEL',
    equipment: ['Basketball'], isSportDrill: true,
    injuryModifications: ['Handgelenkproblem: einfaches Dribbling ohne Tricks.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
    positions: ['POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD'],
  },
  {
    id: 'b-t6', name: 'Post-Up Footwork (Hook Shot)', category: 'technik',
    sets: 3, reps: 10, restSeconds: 60,
    description: 'Post-Footwork mit Drop Step und Hook Shot für Big Men.',
    instructions: ['Position: Low Post (nahe der Zone).', 'Rücken zum Korb, Ball annehmen.', 'Drop Step: Fuß zur Seite, dann zum Korb drehen.', 'Hook Shot mit der Schusshand ausführen.'],
    muscleGroups: ['Oberschenkel', 'Gesäß', 'Schulter', 'Handgelenk'], difficulty: 'SCHWER',
    equipment: ['Basketball', 'Korb'], isSportDrill: true,
    injuryModifications: ['Knieproblem: Step ohne tiefen Bend.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['TECHNIK_VERBESSERN', 'WETTKAMPF'],
    positions: ['CENTER', 'POWER_FORWARD'],
  },
  {
    id: 'b-t7', name: 'Defensiv-Sliding', category: 'technik',
    sets: 4, reps: 10, restSeconds: 60,
    description: 'Defensive Footwork-Übung: Seitwärtsbewegung in tiefer Stance.',
    instructions: ['Defensive Stance einnehmen (tief, Gewicht auf Fußballen).', 'Seitwärts gleiten (Side-Step) 5m.', 'Keine Beinüberkreuzung.', 'Reaktiver Richtungswechsel auf Signal.'],
    muscleGroups: ['Oberschenkel', 'Adduktoren', 'Gesäß', 'Knöchel'], difficulty: 'LEICHT',
    equipment: ['Kein Equipment'], isSportDrill: true,
    injuryModifications: ['Knieproblem: Stance nicht so tief.'],
    levelMin: 'ANFAENGER', relevantGoals: ['TECHNIK_VERBESSERN', 'FITNESS', 'WETTKAMPF'],
    positions: ['POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD'],
  },
  {
    id: 'b-t8', name: 'Pick-and-Roll Read', category: 'technik',
    sets: 3, reps: 8, restSeconds: 90,
    description: 'Pick-and-Roll-Drill für Guard und Screener – Entscheidungsfindung.',
    instructions: ['Guard bringt Ball, Screener stellt Pick.', 'Guard: Entscheidung – Abroller annehmen, Pull-up oder Pass.', 'Screener: nach Pick sauber zum Korb rollen.', 'Ohne Verteidigung zunächst.'],
    muscleGroups: ['Beinarbeit', 'Spielverständnis', 'Kommunikation'], difficulty: 'SCHWER',
    equipment: ['Basketball', 'Korb', 'Partner'], isSportDrill: true,
    injuryModifications: ['Screener ohne Körperkontakt üben.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['WETTKAMPF', 'TECHNIK_VERBESSERN'],
    positions: ['POINT_GUARD', 'POWER_FORWARD', 'CENTER'],
  },
  // Kondition
  {
    id: 'b-k1', name: '17er-Lauf (Suicides)', category: 'kondition',
    sets: 3, reps: 3, restSeconds: 120,
    description: 'Klassisches Basketball-Konditionstraining: Baseline-Sprints.',
    instructions: ['Start: Baseline.', 'Sprinten zur Freiwurflinie (zurück), Halbfeld (zurück), gegenüberliegende Freiwurflinie (zurück), gegenüberliegende Baseline (zurück).', '3 Sätze mit 2 Min Pause.'],
    muscleGroups: ['Gesamte Beinmuskulatur', 'Herz-Kreislauf', 'Ausdauer'], difficulty: 'SCHWER',
    equipment: ['Basketballfeld'], isSportDrill: false,
    injuryModifications: ['Verletzung: nur Halbfeld-Variante.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['FITNESS', 'WETTKAMPF', 'ABNEHMEN'],
  },
  {
    id: 'b-k2', name: 'Full-Court-Sprints', category: 'kondition',
    sets: 5, reps: 4, restSeconds: 60,
    description: 'Vollfeldsprints für explosive Basketballkondition.',
    instructions: ['Sprint von Baseline zu Baseline (28m).', 'Kurze Pause, sofort zurück.', '4 Läufe am Stück = 1 Satz.', 'Armarbeit aktiv einsetzen.'],
    muscleGroups: ['Oberschenkel', 'Gesäß', 'Wade', 'Herz-Kreislauf'], difficulty: 'MITTEL',
    equipment: ['Basketballfeld'], isSportDrill: false,
    injuryModifications: ['Muskelprobleme: Distanz halbieren.'],
    levelMin: 'ANFAENGER', relevantGoals: ['FITNESS', 'ABNEHMEN', 'WETTKAMPF'],
  },
  {
    id: 'b-k3', name: 'Plyometrische Sprünge', category: 'kondition',
    sets: 4, reps: 10, restSeconds: 90,
    description: 'Explosivkraft-Sprünge für mehr Vertical und Basketball-Athletik.',
    instructions: ['Box Jumps oder Tuck Jumps: 10 Wdh.', 'Weiche Landung auf Fußballen.', 'Kurze Kontaktzeit am Boden (explosiv hoch).', 'Variante: einbeinige Sprünge.'],
    muscleGroups: ['Oberschenkel', 'Gesäß', 'Wade', 'Explosivkraft'], difficulty: 'MITTEL',
    equipment: ['Sprungkiste (optional)'], isSportDrill: false,
    injuryModifications: ['Knieproblem: kein Tuck Jump, nur Step-up.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['FITNESS', 'MUSKELAUFBAU', 'WETTKAMPF'],
  },
  {
    id: 'b-k4', name: 'Agility-Ladder Footwork', category: 'kondition',
    sets: 4, reps: 3, restSeconds: 60,
    description: 'Koordinationsleiter für basketballspecifisches Footwork.',
    instructions: ['Drill 1: Einzeln in jedes Feld (vorwärts).', 'Drill 2: Seitwärts durch die Leiter.', 'Drill 3: 2 Füße je Feld (vorwärts).', 'Tempo mit jeder Runde steigern.'],
    muscleGroups: ['Beinmuskulatur', 'Koordination', 'Reaktion'], difficulty: 'MITTEL',
    equipment: ['Koordinationsleiter'], isSportDrill: false,
    injuryModifications: ['Gleichgewichtsprobleme: langsamer.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['FITNESS', 'WETTKAMPF'],
  },
  // Kraft
  {
    id: 'b-s1', name: 'Kniebeugen für Explosivität', category: 'kraft',
    sets: 4, reps: 12, restSeconds: 90,
    description: 'Klassische Kniebeugen für Bein-Grundkraft und Sprungkraft.',
    instructions: ['Schulterbreiter Stand, Füße leicht auswärts.', 'Tief gehen (Oberschenkel parallel zum Boden).', 'Explosiv hochdrücken.', 'Knie in Verlängerung der Zehen.'],
    muscleGroups: ['Oberschenkel', 'Gesäß', 'Unterer Rücken', 'Wade'], difficulty: 'MITTEL',
    equipment: ['Kein Equipment (oder Kurzhanteln)'], isSportDrill: false,
    injuryModifications: ['Knieschmerz: halbe Tiefe.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['MUSKELAUFBAU', 'FITNESS', 'WETTKAMPF'],
  },
  {
    id: 'b-s2', name: 'Liegestütze & Abfangen', category: 'kraft',
    sets: 3, reps: 12, restSeconds: 60,
    description: 'Liegestütze zur Oberkörperstabilität beim Basketball.',
    instructions: ['Standard-Liegestütz.', 'Für fortgeschrittene Variante: Clap Push-ups.', 'Rumpf gerade halten, keine Hüftbewegung.'],
    muscleGroups: ['Brust', 'Schulter', 'Trizeps', 'Rumpf'], difficulty: 'LEICHT',
    equipment: ['Matte'], isSportDrill: false,
    injuryModifications: ['Knie abstützen für Einsteiger.'],
    levelMin: 'ANFAENGER', relevantGoals: ['MUSKELAUFBAU', 'FITNESS'],
  },
  {
    id: 'b-s3', name: 'Einbeinige Kniebeuge (Pistol-Prep)', category: 'kraft',
    sets: 3, reps: 8, restSeconds: 90,
    description: 'Einbeinige Kniebeugevariante für Standbein-Stabilität.',
    instructions: ['Auf einem Bein stehen.', 'Langsam auf Stuhl/Bank absetzen (kontrolliert).', 'Explosiv aufstehen (ohne Schwung).', '8 Wdh. je Seite.'],
    muscleGroups: ['Oberschenkel', 'Gesäß', 'Stabilisatoren'], difficulty: 'SCHWER',
    equipment: ['Stuhl oder Bank'], isSportDrill: false,
    injuryModifications: ['Knieproblem: nicht tiefer als 70°.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['MUSKELAUFBAU', 'FITNESS', 'WETTKAMPF'],
  },
  // Drills
  {
    id: 'b-d1', name: '3-Man-Weave Passdrill', category: 'drill',
    sets: 4, reps: 5, restSeconds: 60,
    description: 'Klassischer Dreier-Passzug zur Grundlinie für Teamkommunikation.',
    instructions: ['3 Spieler starten an der Baseline.', 'Spieler 1 passt zu Spieler 2 (läuft hinter ihm vorbei).', 'Fortsetzung bis zur anderen Baseline.', 'Letzter Spieler: Korbleger.'],
    muscleGroups: ['Beinarbeit', 'Passspiel', 'Kommunikation'], difficulty: 'MITTEL',
    equipment: ['Basketball', 'Korb', '3 Spieler'], isSportDrill: true,
    injuryModifications: ['Tempo reduzieren bei Verletzungen.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['WETTKAMPF', 'TECHNIK_VERBESSERN'],
  },
  {
    id: 'b-d2', name: 'Fast-Break-Drill', category: 'drill',
    sets: 4, reps: 5, restSeconds: 90,
    description: 'Konter nach Rebound für schnelles Transitionsspiel.',
    instructions: ['Spieler 1: nimmt Rebound (oder erhält Pass).', 'Outlet-Pass zu Spieler 2 auf der Seite.', 'Sprint Richtung gegnerischen Korb (2 vs 1).', 'Abschluss: Layup oder Pass.'],
    muscleGroups: ['Beinarbeit', 'Passspiel', 'Ausdauer'], difficulty: 'MITTEL',
    equipment: ['Basketball', 'Korb', 'Mitspieler'], isSportDrill: true,
    injuryModifications: ['Weniger Sprint-Intensität bei Beschwerden.'],
    levelMin: 'FORTGESCHRITTENE', relevantGoals: ['WETTKAMPF', 'FITNESS'],
  },
  {
    id: 'b-d3', name: '1-on-1 Defense Drill', category: 'drill',
    sets: 4, reps: 5, restSeconds: 90,
    description: 'Eins-gegen-Eins für Angriff und Verteidigung.',
    instructions: ['Angreifer startet an der Dreierlinie.', 'Verteidiger in tiefer Stance davor.', 'Angreifer: in den Korb dribbeln.', 'Verteidiger: Abschluss verhindern. Rollenwechsel nach je 5 Runden.'],
    muscleGroups: ['Gesamtkörper', 'Reaktion', 'Explosivität'], difficulty: 'SCHWER',
    equipment: ['Basketball', 'Korb', 'Partner'], isSportDrill: true,
    injuryModifications: ['Keine intensiven Körperkontakte.'],
    levelMin: 'WETTKAMPF', relevantGoals: ['WETTKAMPF', 'TECHNIK_VERBESSERN'],
  },
]

// ─────────────────────────────────────────────────────────────────
// Übungsdatenbank-Map
// ─────────────────────────────────────────────────────────────────

const EXERCISE_DB: Record<SportSlug, ExerciseTemplate[]> = {
  fussball: FUSSBALL_EXERCISES,
  tennis: TENNIS_EXERCISES,
  basketball: BASKETBALL_EXERCISES,
}

// ─────────────────────────────────────────────────────────────────
// Algorithmus-Hilfsfunktionen
// ─────────────────────────────────────────────────────────────────

function getWeekPhase(weekNumber: number, totalWeeks: number): WeekPhase {
  if (totalWeeks <= 2) return 'GRUNDLAGE'
  const ratio = (weekNumber - 1) / (totalWeeks - 1)
  if (ratio < 0.25) return 'GRUNDLAGE'
  if (ratio < 0.6) return 'INTENSITAET'
  if (ratio < 0.875) return 'PEAK'
  return 'DELOAD'
}

function getIntensityMultiplier(phase: WeekPhase): number {
  switch (phase) {
    case 'GRUNDLAGE':   return 0.85
    case 'INTENSITAET': return 1.0
    case 'PEAK':        return 1.15
    case 'DELOAD':      return 0.7
  }
}

function getPhaseLabels(phase: WeekPhase): { focus: string; weeklyGoal: string } {
  switch (phase) {
    case 'GRUNDLAGE':
      return { focus: 'Grundlagenaufbau', weeklyGoal: 'Technik und Bewegungsmuster einschleifen, kontrolliertes Tempo.' }
    case 'INTENSITAET':
      return { focus: 'Intensitätssteigerung', weeklyGoal: 'Volumen und Intensität erhöhen, Technik unter Belastung stabilisieren.' }
    case 'PEAK':
      return { focus: 'Leistungspeak', weeklyGoal: 'Maximale Leistung abrufen, wettkampfnahe Belastung.' }
    case 'DELOAD':
      return { focus: 'Regeneration & Konsolidierung', weeklyGoal: 'Intensität reduzieren, Technik festigen, Körper erholen.' }
  }
}

function getSessionFocusLabel(focus: SessionFocus): string {
  return focus
}

function applyOverload(template: ExerciseTemplate, multiplier: number): PlanExercise {
  const scaledSets = Math.max(1, Math.round(template.sets * multiplier))
  const scaledReps = template.reps !== undefined
    ? Math.max(1, Math.round(template.reps * multiplier))
    : undefined

  return {
    name: template.name,
    sets: scaledSets,
    reps: scaledReps,
    restSeconds: template.restSeconds,
    description: template.description,
    instructions: [...template.instructions],
    muscleGroups: [...template.muscleGroups],
    difficulty: template.difficulty,
    equipment: [...template.equipment],
    isSportDrill: template.isSportDrill,
    injuryModifications: [...template.injuryModifications],
  }
}

function scoreExercise(
  exercise: ExerciseTemplate,
  goals: UserGoal[],
  userLevelOrder: number,
  userPosition: string | null,
): number {
  let score = 0

  // Ziel-Relevanz
  for (const goal of goals) {
    if (exercise.relevantGoals.includes(goal)) score += 10
  }

  // Level-Bonus: ANFAENGER bevorzugt leichte Übungen, PROFI bevorzugt schwere
  const difficultyScore: Record<ExerciseDifficulty, number> = { LEICHT: 0, MITTEL: 5, SCHWER: 10 }
  const diff = difficultyScore[exercise.difficulty]
  score += Math.round(diff * (userLevelOrder / 3))

  // Positionsbonus
  if (userPosition !== null && exercise.positions !== undefined) {
    if (exercise.positions.includes(userPosition)) score += 15
  }

  // Kleiner Zufallsanteil für Variety (deterministisch via ID-Hash)
  const idSum = exercise.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  score += idSum % 8

  return score
}

function selectExercises(
  pool: ExerciseTemplate[],
  category: ExerciseCategory,
  count: number,
  userLevelOrder: number,
  goals: UserGoal[],
  usedInSession: Set<string>,
  userPosition: string | null,
): ExerciseTemplate[] {
  const candidates = pool.filter(
    (e) => e.category === category && !usedInSession.has(e.id) && LEVEL_ORDER[e.levelMin] <= userLevelOrder,
  )

  if (candidates.length === 0) {
    // Fallback: ignoriere usedInSession constraint
    const fallback = pool.filter(
      (e) => e.category === category && LEVEL_ORDER[e.levelMin] <= userLevelOrder,
    )
    return fallback
      .sort((a, b) => scoreExercise(b, goals, userLevelOrder, userPosition) - scoreExercise(a, goals, userLevelOrder, userPosition))
      .slice(0, count)
  }

  return candidates
    .sort((a, b) => scoreExercise(b, goals, userLevelOrder, userPosition) - scoreExercise(a, goals, userLevelOrder, userPosition))
    .slice(0, count)
}

function estimateSessionMinutes(exercises: PlanExercise[], warmupMin: number, cooldownMin: number): number {
  let minutes = warmupMin + cooldownMin
  for (const ex of exercises) {
    if (ex.sets !== undefined) {
      const repsTime = (ex.reps ?? 12) * 3 / 60
      const restTime = (ex.restSeconds ?? 60) / 60
      minutes += ex.sets * (repsTime + restTime) + 1.5
    } else {
      minutes += 10
    }
  }
  return Math.round(minutes)
}

function getExerciseCountForLevel(level: SportLevel): { warmup: number; main: number } {
  switch (level) {
    case 'ANFAENGER':       return { warmup: 1, main: 3 }
    case 'FORTGESCHRITTENE': return { warmup: 1, main: 4 }
    case 'WETTKAMPF':       return { warmup: 2, main: 5 }
    case 'PROFI':           return { warmup: 2, main: 6 }
  }
}

function buildSession(
  pool: ExerciseTemplate[],
  focus: SessionFocus,
  level: SportLevel,
  goals: UserGoal[],
  userPosition: string | null,
  usedInPlan: Set<string>,
  multiplier: number,
  dayName: string,
  weekNumber: number,
): PlanDay {
  const { warmup: warmupCount, main: mainCount } = getExerciseCountForLevel(level)
  const usedInSession = new Set(usedInPlan)

  const levelOrder = LEVEL_ORDER[level]

  // Warmup-Übungen
  const warmupExercises = selectExercises(pool, 'warmup', warmupCount, levelOrder, goals, usedInSession, userPosition)
  warmupExercises.forEach((e) => usedInSession.add(e.id))

  // Haupt-Übungen je nach Fokus
  const mainExercises: ExerciseTemplate[] = []

  if (focus === 'Technik') {
    const technik = selectExercises(pool, 'technik', Math.ceil(mainCount * 0.7), levelOrder, goals, usedInSession, userPosition)
    technik.forEach((e) => usedInSession.add(e.id))
    mainExercises.push(...technik)

    const remaining = mainCount - technik.length
    if (remaining > 0) {
      const drills = selectExercises(pool, 'drill', remaining, levelOrder, goals, usedInSession, userPosition)
      mainExercises.push(...drills)
    }
  } else if (focus === 'Kondition') {
    const kondition = selectExercises(pool, 'kondition', Math.ceil(mainCount * 0.65), levelOrder, goals, usedInSession, userPosition)
    kondition.forEach((e) => usedInSession.add(e.id))
    mainExercises.push(...kondition)

    const remaining = mainCount - kondition.length
    if (remaining > 0) {
      const kraft = selectExercises(pool, 'kraft', remaining, levelOrder, goals, usedInSession, userPosition)
      mainExercises.push(...kraft)
    }
  } else {
    // Kraft & Drills
    const kraft = selectExercises(pool, 'kraft', Math.ceil(mainCount * 0.6), levelOrder, goals, usedInSession, userPosition)
    kraft.forEach((e) => usedInSession.add(e.id))
    mainExercises.push(...kraft)

    const remaining = mainCount - kraft.length
    if (remaining > 0) {
      const drills = selectExercises(pool, 'drill', remaining, levelOrder, goals, usedInSession, userPosition)
      mainExercises.push(...drills)
    }
  }

  // Übungen in PlanExercise umwandeln mit Progressive Overload
  const allTemplates = [...warmupExercises, ...mainExercises]
  const planExercises: PlanExercise[] = allTemplates.map((t) => applyOverload(t, multiplier))

  // Warmup-Minuten aus Templates ableiten
  const warmupMinutes = warmupExercises.reduce((sum, e) => {
    return sum + (e.durationSeconds !== undefined ? Math.ceil(e.durationSeconds / 60) : 5)
  }, 0)
  const cooldownMinutes = 5

  const totalMinutes = estimateSessionMinutes(planExercises, warmupMinutes, cooldownMinutes)

  // usedInPlan aktualisieren (damit selbe Übung nicht zu oft vorkommt)
  // Nur Haupt-Übungen merken (Warmup-Varianten sind OK zu wiederholen)
  mainExercises.forEach((e) => usedInPlan.add(e.id))

  return {
    dayName,
    isRestDay: false,
    focus: getSessionFocusLabel(focus),
    warmupMinutes,
    cooldownMinutes,
    totalMinutes,
    notes: weekNumber <= 2 ? 'Fokus auf saubere Ausführung, nicht auf Tempo.' : undefined,
    exercises: planExercises,
  }
}

function getPlanTitle(sportSlug: SportSlug, level: SportLevel, durationWeeks: number): string {
  const sportLabels: Record<SportSlug, string> = { fussball: 'Fußball', tennis: 'Tennis', basketball: 'Basketball' }
  const levelLabels: Record<SportLevel, string> = {
    ANFAENGER: 'Einsteiger',
    FORTGESCHRITTENE: 'Fortgeschrittene',
    WETTKAMPF: 'Wettkampf',
    PROFI: 'Profi',
  }
  return `${sportLabels[sportSlug]}-Trainingsplan – ${levelLabels[level]} (${durationWeeks} Wochen)`
}

function getPlanDescription(sportSlug: SportSlug, level: SportLevel, goals: UserGoal[], sessionsPerWeek: number): string {
  const sportLabels: Record<SportSlug, string> = { fussball: 'Fußball', tennis: 'Tennis', basketball: 'Basketball' }
  const goalLabels: Record<UserGoal, string> = {
    FITNESS: 'Fitness', WETTKAMPF: 'Wettkampfvorbereitung', FREIZEITSPORT: 'Freizeitsport',
    ABNEHMEN: 'Abnehmen', MUSKELAUFBAU: 'Muskelaufbau', TECHNIK_VERBESSERN: 'Technikverbesserung',
  }
  const goalStr = goals.map((g) => goalLabels[g]).join(', ')
  const levelLabels: Record<SportLevel, string> = {
    ANFAENGER: 'Anfänger', FORTGESCHRITTENE: 'Fortgeschrittene', WETTKAMPF: 'Wettkampfspieler', PROFI: 'Profisportler',
  }
  return (
    `Algorithmisch generierter ${sportLabels[sportSlug]}-Trainingsplan für ${levelLabels[level]}. ` +
    `${sessionsPerWeek} Einheiten pro Woche mit progressiver Belastungssteigerung. ` +
    `Schwerpunkte: ${goalStr}. ` +
    `Der Plan nutzt Periodisierung (Grundlage → Intensität → Peak → Deload) für optimale Leistungsentwicklung.`
  )
}

function getCalorieEstimate(level: SportLevel): number {
  switch (level) {
    case 'ANFAENGER':       return 320
    case 'FORTGESCHRITTENE': return 420
    case 'WETTKAMPF':       return 520
    case 'PROFI':           return 650
  }
}

function getProgressionTips(sportSlug: SportSlug, level: SportLevel): string[] {
  const base = [
    'Starte jede Einheit mit dem vollständigen Aufwärmprogramm – niemals überspringen.',
    'Trinke mindestens 0,5l Wasser pro 30 Minuten Training.',
    'Führe ein kurzes Trainings-Log: Was geklappt hat, was noch nicht.',
  ]

  const sportTips: Record<SportSlug, string[]> = {
    fussball: [
      'Nutze die Ruhetage aktiv: 15-20 Min lockeres Joggen oder Radfahren.',
      'Ergänze das Programm mit regelmäßigem Mannschaftstraining.',
    ],
    tennis: [
      'Video-Analyse: Filme dich gelegentlich selbst – du siehst Fehler, die du nicht spürst.',
      'Übe Aufschläge auch 10 Min vor dem offiziellen Training.',
    ],
    basketball: [
      'Ball-Handling-Übungen täglich (auch nur 10 Min) beschleunigen deinen Fortschritt erheblich.',
      'Schau dir Profi-Spiele mit Fokus auf deine Position an.',
    ],
  }

  const levelTip: Record<SportLevel, string> = {
    ANFAENGER: 'Priorität: Bewegungsmuster, nicht Gewicht oder Intensität.',
    FORTGESCHRITTENE: 'Intensität nur steigern wenn die Technik stabil ist.',
    WETTKAMPF: 'Simuliere Drucksituationen im Training, um wettkampfhärter zu werden.',
    PROFI: 'Periodisierung strikt einhalten – Deload-Wochen sind kein Rückschritt, sondern Voraussetzung für den Peak.',
  }

  return [...base, ...sportTips[sportSlug], levelTip[level]]
}

function getSafetyWarnings(sportSlug: SportSlug): string[] {
  const base = [
    'Stets das vollständige Aufwärmprogramm absolvieren – Verletzungsrisiko ohne Aufwärmen ist deutlich erhöht.',
    'Bei starken Schmerzen (nicht zu verwechseln mit Muskelkater): Training sofort abbrechen, Arzt aufsuchen.',
    'Ausreichend schlafen (mind. 7-8 Std.) – Regeneration ist Teil des Trainings.',
    'Nach diesem Plan erst mit einem Arzt sprechen wenn du länger als 6 Monate pausiert hast.',
  ]

  const sportWarnings: Record<SportSlug, string[]> = {
    fussball: ['Stollenschuhe nur auf geeignetem Untergrund.', 'Kopfball nur nach ausreichend Aufwärmen der Nackenmuskulatur.'],
    tennis: ['Tennis-Ellenbogen: bei Schmerzen außen am Ellenbogen sofort pausieren.', 'Schulterpflege: Rotatorenmanschetten-Übungen dauerhaft einbauen.'],
    basketball: ['Knöchelprävention: Stabilisierungsübungen und passendes Schuhwerk wichtig.', 'Sprünge immer weich landen – nie auf der Ferse aufkommen.'],
  }

  return [...base, ...sportWarnings[sportSlug]]
}

function getUserPosition(sportSlug: SportSlug, sportDetails: AnySportProfil | null): string | null {
  if (sportDetails === null) return null
  if (sportSlug === 'fussball') {
    return (sportDetails as FussballProfil).position ?? null
  }
  if (sportSlug === 'basketball') {
    return (sportDetails as BasketballProfil).position ?? null
  }
  return null
}

// ─────────────────────────────────────────────────────────────────
// TrainingAI Klasse
// ─────────────────────────────────────────────────────────────────

export class TrainingAI extends BaseAI<TrainingExecuteInput, TrainingPlanSaveResult> {
  protected readonly aiType = 'training' as const

  // ── Öffentliche API ──────────────────────────────────────────

  async generatePlan(userId: string, formData: TrainingFormData): Promise<TrainingPlanSaveResult> {
    const userContext = await this.loadUserContext(userId, formData.sportSlug)
    const result = await this.execute({ userId, formData, userContext })
    await this.logUsage(userId)
    return result
  }

  async generateSessionFeedback(session: TrainingSession): Promise<string> {
    return motivationAI.generateFeedback(session)
  }

  // ── BaseAI Implementation ────────────────────────────────────

  protected async execute(input: TrainingExecuteInput): Promise<TrainingPlanSaveResult> {
    const plan = this.buildPlan(input.formData, input.userContext)

    const sport = await prisma.sport.findUnique({
      where: { slug: input.formData.sportSlug },
      select: { id: true },
    })
    if (sport === null) {
      throw new Error(`Sport '${input.formData.sportSlug}' nicht in der Datenbank gefunden.`)
    }

    const savedPlan = await prisma.trainingPlan.create({
      data: {
        userId: input.userId,
        sportId: sport.id,
        title: plan.planName,
        description: plan.description,
        level: input.formData.level,
        durationWeeks: plan.weeks.length,
        sessionsPerWeek: input.formData.sessionsPerWeek,
        isAiGenerated: true,
        isActive: true,
        planData: plan as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    })

    return {
      planId: savedPlan.id,
      planName: plan.planName,
      description: plan.description,
      durationWeeks: plan.weeks.length,
      sessionsPerWeek: input.formData.sessionsPerWeek,
      isAiGenerated: true,
    }
  }

  // ── Kern-Algorithmus ─────────────────────────────────────────

  private buildPlan(formData: TrainingFormData, userContext: UserContext): GeneratedPlan {
    const pool = EXERCISE_DB[formData.sportSlug]
    const trainingDayIndices = TRAINING_DAY_INDICES[Math.min(7, Math.max(1, formData.sessionsPerWeek))] ?? [0, 2, 4]
    const userPosition = getUserPosition(formData.sportSlug, userContext.sportDetails)
    const usedInPlan = new Set<string>()

    let globalSessionIndex = 0

    const weeks: PlanWeek[] = []

    for (let weekNum = 1; weekNum <= formData.durationWeeks; weekNum++) {
      const phase = getWeekPhase(weekNum, formData.durationWeeks)
      const multiplier = getIntensityMultiplier(phase)
      const { focus: weekFocus, weeklyGoal } = getPhaseLabels(phase)

      const days: PlanDay[] = []

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayName = DAY_NAMES[dayIndex]
        const isTrainingDay = trainingDayIndices.includes(dayIndex)

        if (!isTrainingDay) {
          days.push({
            dayName,
            isRestDay: true,
            totalMinutes: 0,
            exercises: [],
          })
          continue
        }

        const sessionFocus = SESSION_FOCUSES[globalSessionIndex % 3]
        globalSessionIndex++

        // Alle 3 Sessions usedInPlan zurücksetzen für Variety über Wochen
        if (globalSessionIndex % (formData.sessionsPerWeek * 3) === 0) {
          usedInPlan.clear()
        }

        const day = buildSession(
          pool,
          sessionFocus,
          formData.level,
          formData.goals,
          userPosition,
          usedInPlan,
          multiplier,
          dayName,
          weekNum,
        )
        days.push(day)
      }

      weeks.push({
        weekNumber: weekNum,
        focus: weekFocus,
        weeklyGoal,
        days,
      })
    }

    return {
      planName: getPlanTitle(formData.sportSlug, formData.level, formData.durationWeeks),
      description: getPlanDescription(formData.sportSlug, formData.level, formData.goals, formData.sessionsPerWeek),
      estimatedCaloriesBurnPerSession: getCalorieEstimate(formData.level),
      weeks,
      progressionTips: getProgressionTips(formData.sportSlug, formData.level),
      safetyWarnings: getSafetyWarnings(formData.sportSlug),
    }
  }

  // ── User Context ─────────────────────────────────────────────

  private async loadUserContext(userId: string, sportSlug: SportSlug): Promise<UserContext> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        sports: {
          where: { sport: { slug: sportSlug } },
          select: { level: true, details: true },
          take: 1,
        },
        trainingSessions: {
          orderBy: { completedAt: 'desc' },
          take: 10,
          select: { title: true, durationMin: true, xpEarned: true, completedAt: true },
        },
      },
    })

    if (user === null) {
      throw new Error(`User ${userId} nicht gefunden.`)
    }

    const userSport = user.sports[0] ?? null
    let sportDetails: AnySportProfil | null = null

    if (userSport?.details !== null && userSport?.details !== undefined) {
      const validation = validateSportProfil(sportSlug, userSport.details)
      if (validation.success) {
        sportDetails = validation.data
      }
    }

    return {
      level: user.level,
      sportLevel: userSport?.level ?? null,
      sportDetails,
      recentSessions: user.trainingSessions,
    }
  }
}

// Singleton-Export
export const trainingAI = new TrainingAI()
