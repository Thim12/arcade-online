// ─────────────────────────────────────────────────────────────────
// sport-icons.ts – Lucide-Icon-Mapping für Sportarten und Badges
//
// Zwei Funktionen:
//   getSportIcon(slug)    → LucideIcon + Farb-Infos der Sportart
//   getBadgeIcon(name)    → LucideIcon nach Badge-iconName aus DB
//
// Da Lucide React Tree-Shaking verwendet, müssen alle benötigten
// Icons explizit importiert werden – kein dynamischer Import.
// ─────────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react'
import {
  // Sportarten
  CircleDot,
  Circle,
  Trophy,
  Zap,
  Waves,
  CircleDashed,
  Hand,
  Wind,
  // Training-Badges
  Footprints,
  Dumbbell,
  Flame,
  Target,
  Shield,
  Sunrise,
  Moon,
  Repeat,
  // Streak-Badges
  Calendar,
  CalendarDays,
  Crown,
  // Recovery-Badges
  BedDouble,
  Activity,
  // Ernährungs-Badges
  Utensils,
  Droplets,
  Apple,
  ChefHat,
  Calculator,
  // Sozial-Badges
  PenSquare,
  Heart,
  Users,
  Star,
  MessageSquare,
  BookOpen,
  // Sport-Badges
  Building2,
  Medal,
  Award,
  Landmark,
  Swords,
  // Easter-Egg-Badges
  Clock,
  MousePointerClick,
  // Fallback
  HelpCircle,
} from 'lucide-react'

// ── Sport-Icon Konfiguration ─────────────────────────────────────

export interface SportIconConfig {
  icon: LucideIcon
  color: string       // Primärfarbe (hex)
  colorLight: string  // Helle Akzentfarbe (hex)
  colorGlow: string   // Glow-Schatten (rgba)
  bgColor: string     // Hintergrundfarbe für Chips (8% Opacity)
}

const SPORT_ICON_MAP: Record<string, SportIconConfig> = {
  fussball: {
    icon: CircleDot,
    color: '#16A34A',
    colorLight: '#BBF7D0',
    colorGlow: 'rgba(22, 163, 74, 0.35)',
    bgColor: 'rgba(22, 163, 74, 0.08)',
  },
  tennis: {
    icon: Circle,
    color: '#C2621A',
    colorLight: '#FDE68A',
    colorGlow: 'rgba(194, 98, 26, 0.35)',
    bgColor: 'rgba(194, 98, 26, 0.08)',
  },
  basketball: {
    icon: Trophy,
    color: '#EA580C',
    colorLight: '#FFEDD5',
    colorGlow: 'rgba(234, 88, 12, 0.35)',
    bgColor: 'rgba(234, 88, 12, 0.08)',
  },
  leichtathletik: {
    icon: Zap,
    color: '#7C3AED',
    colorLight: '#EDE9FE',
    colorGlow: 'rgba(124, 58, 237, 0.35)',
    bgColor: 'rgba(124, 58, 237, 0.08)',
  },
  schwimmen: {
    icon: Waves,
    color: '#0284C7',
    colorLight: '#E0F2FE',
    colorGlow: 'rgba(2, 132, 199, 0.35)',
    bgColor: 'rgba(2, 132, 199, 0.08)',
  },
  volleyball: {
    icon: CircleDashed,
    color: '#D97706',
    colorLight: '#FEF3C7',
    colorGlow: 'rgba(217, 119, 6, 0.35)',
    bgColor: 'rgba(217, 119, 6, 0.08)',
  },
  handball: {
    icon: Hand,
    color: '#DC2626',
    colorLight: '#FEE2E2',
    colorGlow: 'rgba(220, 38, 38, 0.35)',
    bgColor: 'rgba(220, 38, 38, 0.08)',
  },
  badminton: {
    icon: Wind,
    color: '#0891B2',
    colorLight: '#CFFAFE',
    colorGlow: 'rgba(8, 145, 178, 0.35)',
    bgColor: 'rgba(8, 145, 178, 0.08)',
  },
}

/**
 * Gibt Icon und Farb-Konfiguration für einen Sport-Slug zurück.
 * Gibt bei unbekanntem Slug den Fallback (HelpCircle + Grau) zurück.
 */
export function getSportIcon(slug: string): SportIconConfig {
  return (
    SPORT_ICON_MAP[slug] ?? {
      icon: HelpCircle,
      color: '#64748b',
      colorLight: '#e2e8f0',
      colorGlow: 'rgba(100, 116, 139, 0.35)',
      bgColor: 'rgba(100, 116, 139, 0.08)',
    }
  )
}

// ── Badge-Icon Mapping ───────────────────────────────────────────

// Vollständige Map aller Badge-iconNames aus prisma/seed.ts
const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  // Training
  Footprints,
  Dumbbell,
  Flame,
  Target,
  Shield,
  Sunrise,
  Moon,
  Repeat,
  // Streak
  Calendar,
  CalendarDays,
  Zap,
  Crown,
  // Recovery
  BedDouble,
  Activity,
  // Ernährung
  Utensils,
  Droplets,
  Apple,
  ChefHat,
  Calculator,
  // Sozial
  PenSquare,
  Heart,
  Users,
  Star,
  Trophy,
  MessageSquare,
  BookOpen,
  // Sport
  Building2,
  Medal,
  Award,
  Landmark,
  Swords,
  // Easter Eggs
  Clock,
  MousePointerClick,
  CircleDot,
  // Weitere Sport-Icons die auch als Badge-Icons verwendet werden
  Circle,
  CircleDashed,
  Hand,
  Waves,
  Wind,
}

/**
 * Gibt das LucideIcon für einen Badge-iconName zurück.
 * Gibt HelpCircle zurück wenn der Name nicht bekannt ist.
 *
 * Wichtig: Diese Funktion gibt den ICON-TYP zurück, kein React-Element.
 * Verwendung: const Icon = getBadgeIcon(badge.iconName); <Icon />
 */
export function getBadgeIcon(iconName: string): LucideIcon {
  return BADGE_ICON_MAP[iconName] ?? HelpCircle
}
