// ─────────────────────────────────────────────────────────────────
// app/dashboard/profil/page.tsx – Profilseite (Server Component)
//
// Lädt User-Daten, Sport-Details, Badges und Training-Aggregate
// aus der DB und übergibt alles an ProfilClient.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSportProfil } from '@/lib/sport-profiles'
import { ProfilClient } from './ProfilClient'
import type { SportDetailsPayload } from './ProfilClient'

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/registrieren')

  const userId = session.user.id

  const [dbUser, sessionCount, minutesAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        bio: true,
        birthYear: true,
        city: true,
        state: true,
        xp: true,
        level: true,
        streakDays: true,
        longestStreak: true,
        createdAt: true,
        sports: {
          include: { sport: { select: { slug: true } } },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
        userBadges: {
          include: {
            badge: {
              select: {
                id: true,
                name: true,
                description: true,
                iconName: true,
                rarity: true,
                xpReward: true,
              },
            },
          },
          orderBy: { earnedAt: 'desc' },
        },
      },
    }),
    prisma.trainingSession.count({ where: { userId } }),
    prisma.trainingSession.aggregate({
      where: { userId },
      _sum: { durationMin: true },
    }),
  ])

  if (!dbUser) redirect('/registrieren')

  const primarySport =
    session.user.primarySport ?? dbUser.sports[0]?.sport.slug ?? null
  const level = dbUser.level
  const xp = dbUser.xp

  // XP-Schwellenwert: jedes Level = 150 XP
  const xpLevelStart = (level - 1) * 150
  const xpLevelEnd = level * 150
  const xpInCurrentLevel = Math.max(0, xp - xpLevelStart)
  const xpNeededInCurrentLevel = xpLevelEnd - xpLevelStart
  const levelProgressPercent = Math.min(
    100,
    Math.round((xpInCurrentLevel / xpNeededInCurrentLevel) * 100),
  )

  // Sport-Details parsen
  const userSport = dbUser.sports[0]
  let sportPayload: SportDetailsPayload = null

  if (userSport !== undefined && primarySport !== null) {
    if (primarySport === 'fussball') {
      const r = validateSportProfil('fussball', userSport.details)
      if (r.success) sportPayload = { sport: 'fussball', data: r.data }
    } else if (primarySport === 'tennis') {
      const r = validateSportProfil('tennis', userSport.details)
      if (r.success) sportPayload = { sport: 'tennis', data: r.data }
    } else if (primarySport === 'basketball') {
      const r = validateSportProfil('basketball', userSport.details)
      if (r.success) sportPayload = { sport: 'basketball', data: r.data }
    }
  }

  return (
    <ProfilClient
      name={dbUser.name ?? session.user.name ?? 'Sportler'}
      email={dbUser.email}
      image={dbUser.image ?? session.user.image ?? null}
      level={level}
      xp={xp}
      streakDays={dbUser.streakDays}
      longestStreak={dbUser.longestStreak}
      primarySport={primarySport}
      city={dbUser.city ?? null}
      state={dbUser.state as string | null}
      bio={dbUser.bio ?? null}
      createdAt={dbUser.createdAt.toISOString()}
      birthYear={dbUser.birthYear ?? null}
      totalSessions={sessionCount}
      totalMinutes={minutesAgg._sum.durationMin ?? 0}
      totalBadges={dbUser.userBadges.length}
      sportPayload={sportPayload}
      badges={dbUser.userBadges.map((ub) => ({
        id: ub.id,
        earnedAt: ub.earnedAt.toISOString(),
        badge: ub.badge,
      }))}
      xpInCurrentLevel={xpInCurrentLevel}
      xpNeededInCurrentLevel={xpNeededInCurrentLevel}
      levelProgressPercent={levelProgressPercent}
    />
  )
}
