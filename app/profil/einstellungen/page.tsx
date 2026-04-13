// ─────────────────────────────────────────────────────────────────
// app/profil/einstellungen/page.tsx
// Profil-Einstellungen – Server Component
// Lädt User-Daten + OAuth-Accounts, rendert EinstellungenClient
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EinstellungenClient } from './EinstellungenClient'

export const metadata = {
  title: 'Einstellungen · SportRise',
  description: 'Verwalte dein Profil, Sportarten, Datenschutz und Account-Einstellungen.',
}

export default async function EinstellungenPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/anmelden')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      bio: true,
      birthYear: true,
      city: true,
      state: true,
      xp: true,
      level: true,
      isPublicProfile: true,
      emailNotifications: true,
      password: true,
    },
  })

  if (!user) {
    redirect('/anmelden')
  }

  const sports = await prisma.userSport.findMany({
    where: { userId: session.user.id },
    include: {
      sport: {
        select: {
          id: true,
          name: true,
          slug: true,
          colorPrimary: true,
          iconName: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true },
  })

  const allSports = await prisma.sport.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, colorPrimary: true, iconName: true },
    orderBy: { sortOrder: 'asc' },
  })

  const hasGoogle = accounts.some((a) => a.provider === 'google')
  const hasPassword = user.password !== null

  return (
    <EinstellungenClient
      initialData={{
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.image,
          bio: user.bio,
          birthYear: user.birthYear,
          city: user.city,
          state: user.state,
          xp: user.xp,
          level: user.level,
          isPublicProfile: user.isPublicProfile,
          emailNotifications: user.emailNotifications,
        },
        sports: sports.map((us) => ({
          id: us.id,
          sportId: us.sportId,
          level: us.level,
          goals: us.goals,
          details: us.details,
          sport: us.sport,
        })),
        allSports,
        hasGoogle,
        hasPassword,
      }}
    />
  )
}
