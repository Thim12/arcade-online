// ─────────────────────────────────────────────────────────────────
// app/api/turniere/[id]/teilnehmer/route.ts
//
// GET – Teilnehmerliste (öffentlich)
// Gibt alle Teilnehmer zurück wenn isPublicParticipants true ist.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params

  const tournament = await prisma.tournament.findFirst({
    where: { OR: [{ id }, { slug: id }], isPublished: true },
    select: {
      id: true,
      entries: {
        orderBy: { registeredAt: 'asc' },
        select: {
          registeredAt: true,
          teamName: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              sports: {
                take: 1,
                orderBy: { createdAt: 'asc' },
                select: {
                  sport: { select: { slug: true, colorPrimary: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!tournament) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 })
  }

  const participants = tournament.entries.map((e) => ({
    id: e.user.id,
    name: e.user.name,
    username: e.user.username,
    image: e.user.image,
    teamName: e.teamName,
    registeredAt: e.registeredAt.toISOString(),
    sportSlug: e.user.sports[0]?.sport.slug ?? null,
    sportColor: e.user.sports[0]?.sport.colorPrimary ?? null,
  }))

  return NextResponse.json({ participants, total: participants.length })
}
