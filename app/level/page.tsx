// ─────────────────────────────────────────────────────────────────
// app/level/page.tsx – Level-System-Erklärung (Server Component)
//
// Informationsseite: XP-Tabelle (Lv.1–25) + XP-Quellen-Grid.
// Wenn eingeloggt, wird das aktuelle Level des Users hervorgehoben.
// ─────────────────────────────────────────────────────────────────

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { totalXpAtLevel, xpRequiredForNextLevel, MAX_LEVEL } from '@/lib/utils/xp'
import { LevelPageClient } from './LevelPageClient'

export const revalidate = 3600

export interface LevelRow {
  level: number
  totalXpNeeded: number
  xpThisLevel: number
  tier: 'common' | 'rare' | 'epic' | 'legendary'
  isCurrentLevel: boolean
}

export interface XpSource {
  label: string
  xpRange: string
  iconName: string
  description: string
}

function getLevelTier(level: number): LevelRow['tier'] {
  if (level >= 21) return 'legendary'
  if (level >= 11) return 'epic'
  if (level >= 6) return 'rare'
  return 'common'
}

const XP_SOURCES: XpSource[] = [
  {
    label: 'Training',
    xpRange: '+50–200 XP',
    iconName: 'Dumbbell',
    description: 'Pro abgeschlossene Trainingseinheit',
  },
  {
    label: 'Mahlzeit',
    xpRange: '+10 XP',
    iconName: 'Utensils',
    description: 'Pro protokollierte Mahlzeit',
  },
  {
    label: 'Community-Post',
    xpRange: '+50 XP',
    iconName: 'PenSquare',
    description: 'Beitrag im Community-Feed',
  },
  {
    label: 'Abzeichen',
    xpRange: '+50–10.000 XP',
    iconName: 'Award',
    description: 'Je nach Seltenheit des Abzeichens',
  },
  {
    label: 'Verein',
    xpRange: '+150 XP',
    iconName: 'Building2',
    description: 'Verein beitreten oder einreichen',
  },
  {
    label: 'Turnier',
    xpRange: '+200 XP',
    iconName: 'Trophy',
    description: 'Turnieranmeldung abschließen',
  },
  {
    label: 'Streak-Bonus',
    xpRange: '+25 XP/Tag',
    iconName: 'Flame',
    description: 'Täglicher Streak-Bonus beim Training',
  },
  {
    label: 'Follower',
    xpRange: '+10 XP',
    iconName: 'Users',
    description: 'Pro neuem Follower',
  },
]

export default async function LevelPage() {
  const session = await auth()
  let currentLevel = 0

  if (session?.user?.id) {
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { level: true },
    })
    currentLevel = userData?.level ?? 0
  }

  const levels: LevelRow[] = Array.from({ length: MAX_LEVEL }, (_, i) => {
    const level = i + 1
    const xpForThis = level < MAX_LEVEL ? xpRequiredForNextLevel(level) : 0
    return {
      level,
      totalXpNeeded: totalXpAtLevel(level),
      xpThisLevel: xpForThis,
      tier: getLevelTier(level),
      isCurrentLevel: level === currentLevel,
    }
  })

  return <LevelPageClient levels={levels} xpSources={XP_SOURCES} currentLevel={currentLevel} />
}
