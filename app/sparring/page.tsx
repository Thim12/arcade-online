// ─────────────────────────────────────────────────────────────────
// /sparring – Server Component
//
// Tennis-only Seite zum Finden von Sparringspartnern.
// - Prüft Tennis-Sportprofil des eingeloggten Users
// - Lädt Tennis-Partner (alle User mit Tennis, max 50)
// - Lädt eigene SparringRequests (sent + received)
// - Übergibt alles an SparringClient
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SparringClient } from '@/components/sparring/SparringClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sparring finden · SportRise Tennis',
  description: 'Finde Tennis-Sparringspartner in deiner Nähe.',
}

interface TennisDetails {
  lk?: string
  spielstil?: string
  lieblingsbelag?: string
  sucheSparringpartner?: boolean
  spielhand?: string
}

export default async function SparringPage(): Promise<React.JSX.Element> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/anmelden')
  }

  const currentUserId = session.user.id

  // Tennis-Sport des eingeloggten Users laden
  const tennisSport = await prisma.sport.findFirst({
    where: { slug: 'tennis' },
    select: { id: true },
  })

  const myTennisProfile =
    tennisSport
      ? await prisma.userSport.findFirst({
          where: { userId: currentUserId, sportId: tennisSport.id },
          select: { details: true },
        })
      : null

  const hasTennis = myTennisProfile !== null

  // Eigene SparringRequests laden
  const [sparringSent, sparringReceived] = await Promise.all([
    prisma.sparringRequest.findMany({
      where: { senderId: currentUserId },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sparringRequest.findMany({
      where: { receiverId: currentUserId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Tennis-Partner laden (max 50, ohne den eigenen User)
  const tennisPartners = tennisSport
    ? await prisma.userSport.findMany({
        where: {
          sportId: tennisSport.id,
          userId: { not: currentUserId },
          user: { isPublicProfile: true, isActive: true },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              city: true,
              state: true,
            },
          },
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
      })
    : []

  // Serialisieren
  const serializedPartners = tennisPartners.map((up) => ({
    id: up.user.id,
    name: up.user.name,
    username: up.user.username,
    image: up.user.image,
    city: up.user.city,
    state: up.user.state,
    details: (up.details ?? {}) as TennisDetails,
  }))

  const serializedSent = sparringSent.map((r) => ({
    id: r.id,
    status: r.status as string,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    receiver: r.receiver,
  }))

  const serializedReceived = sparringReceived.map((r) => ({
    id: r.id,
    status: r.status as string,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    sender: r.sender,
  }))

  const myDetails = hasTennis
    ? ((myTennisProfile.details ?? {}) as TennisDetails)
    : null

  return (
    <SparringClient
      hasTennis={hasTennis}
      myDetails={myDetails}
      partners={serializedPartners}
      sparringSent={serializedSent}
      sparringReceived={serializedReceived}
      currentUserId={currentUserId}
    />
  )
}
