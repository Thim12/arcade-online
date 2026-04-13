// ─────────────────────────────────────────────────────────────────
// app/dashboard/einstellungen/page.tsx – Einstellungen (Server Component)
//
// Lädt User-Daten aus der DB (inkl. Username, Erstelldatum, Counts).
// Gibt alles an EinstellungenClient weiter — kein Client-seitiger API-Call nötig.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EinstellungenClient } from './EinstellungenClient'

export const metadata = { title: 'Einstellungen – SportRise' }

// ── GermanState → Anzeigename ─────────────────────────────────────

const STATE_LABELS: Record<string, string> = {
  HESSEN:                  'Hessen',
  BAYERN:                  'Bayern',
  BERLIN:                  'Berlin',
  BRANDENBURG:             'Brandenburg',
  BREMEN:                  'Bremen',
  HAMBURG:                 'Hamburg',
  MECKLENBURG_VORPOMMERN:  'Mecklenburg-Vorpommern',
  NIEDERSACHSEN:           'Niedersachsen',
  NORDRHEIN_WESTFALEN:     'Nordrhein-Westfalen',
  RHEINLAND_PFALZ:         'Rheinland-Pfalz',
  SAARLAND:                'Saarland',
  SACHSEN:                 'Sachsen',
  SACHSEN_ANHALT:          'Sachsen-Anhalt',
  SCHLESWIG_HOLSTEIN:      'Schleswig-Holstein',
  THUERINGEN:              'Thüringen',
  BADEN_WUERTTEMBERG:      'Baden-Württemberg',
}

// ── Exportierter Typ für EinstellungenClient ──────────────────────

export interface EinstellungenData {
  id:               string
  name:             string
  email:            string
  username:         string | null
  image:            string | null
  state:            string | null   // Anzeigename, z.B. "Hessen"
  createdAt:        string          // ISO-String
  primarySport:     string | null
  sessionsCount:    number
  badgesCount:      number
  postsCount:       number
}

// ── Page Component ────────────────────────────────────────────────

export default async function EinstellungenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/registrieren')

  const userId = session.user.id

  const userData = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      id:        true,
      name:      true,
      email:     true,
      username:  true,
      image:     true,
      state:     true,
      createdAt: true,
      _count: {
        select: {
          trainingSessions: true,
          userBadges:       true,
          posts:            true,
        },
      },
    },
  })

  if (!userData) redirect('/registrieren')

  const data: EinstellungenData = {
    id:            userData.id,
    name:          userData.name ?? 'Sportler',
    email:         userData.email,
    username:      userData.username,
    image:         userData.image,
    state:         userData.state ? (STATE_LABELS[userData.state] ?? userData.state) : null,
    createdAt:     userData.createdAt.toISOString(),
    primarySport:  session.user.primarySport ?? null,
    sessionsCount: userData._count.trainingSessions,
    badgesCount:   userData._count.userBadges,
    postsCount:    userData._count.posts,
  }

  return <EinstellungenClient data={data} />
}
