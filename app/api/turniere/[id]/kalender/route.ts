// ─────────────────────────────────────────────────────────────────
// app/api/turniere/[id]/kalender/route.ts
//
// GET – ICS-Datei zum Kalender-Download
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function toIcsDate(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params

  const tournament = await prisma.tournament.findFirst({
    where: { OR: [{ id }, { slug: id }], isPublished: true },
    select: {
      name: true,
      slug: true,
      description: true,
      city: true,
      address: true,
      startDate: true,
      endDate: true,
    },
  })

  if (!tournament) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 })
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportrise.de'
  const now = toIcsDate(new Date())
  const dtstart = toIcsDate(tournament.startDate)
  const dtend = toIcsDate(tournament.endDate)
  const location = [tournament.address, tournament.city].filter(Boolean).join(', ')
  const url = `${APP_URL}/turniere/${tournament.slug}`
  const summary = escapeIcs(tournament.name)
  const desc = tournament.description
    ? escapeIcs(tournament.description)
    : escapeIcs(`Turnier auf SportRise.de – ${url}`)

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SportRise.de//Turnierkalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${tournament.slug}@sportrise.de`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    location ? `LOCATION:${escapeIcs(location)}` : '',
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter((line) => line !== '')
    .join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${tournament.slug}.ics"`,
    },
  })
}
