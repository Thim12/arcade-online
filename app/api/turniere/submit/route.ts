// ─────────────────────────────────────────────────────────────────
// app/api/turniere/submit/route.ts
//
// POST /api/turniere/submit
// Nimmt ein Turnier-Einreichungsformular entgegen, speichert das
// Turnier als DRAFT in der Datenbank und sendet eine Admin-E-Mail
// via EmailJS sowie eine Bestätigungs-E-Mail an den Einreicher via
// Resend.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { init, send } from '@emailjs/nodejs'
import { prisma } from '@/lib/prisma'
import { sendTurnierEinreichungBestaetigung } from '@/lib/resend'

// ── Zod Schema ───────────────────────────────────────────────────

const FussballTurnierDetailsSchema = z.object({
  spielmodus: z.string(),
  schiedsrichter: z.boolean(),
})

const TennisTurnierDetailsSchema = z.object({
  belag: z.enum(['SAND', 'HART', 'KUNSTRASEN', 'HALLE', '']),
  lkWertung: z.boolean(),
})

const BasketballTurnierDetailsSchema = z.object({
  modus: z.enum(['5V5', '3X3', '']),
  halbzeitMinuten: z.number().int().min(5).max(60),
})

const SubmitSchema = z.object({
  turniername: z.string().min(2).max(120),
  sportSlug: z.enum(['fussball', 'tennis', 'basketball']),
  strasse: z.string().min(1),
  hausnummer: z.string().min(1),
  plz: z.string().length(5),
  stadt: z.string().min(1),
  bundesland: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  registrationDeadline: z.string().optional(),
  startzeit: z.string().optional(),
  format: z.enum(['EINZEL', 'DOPPEL', 'MANNSCHAFT', 'GEMISCHT']),
  beschreibung: z.string().min(50).max(2000),
  maxParticipants: z.number().int().min(2).optional(),
  entryFee: z.number().min(0).optional(),
  preisgeld: z.string().optional(),
  ageMin: z.number().int().min(0).max(80),
  ageMax: z.number().int().min(0).max(80),
  niveau: z.enum(['ANFAENGER', 'FORTGESCHRITTENE', 'WETTKAMPF', 'PROFI']).default('ANFAENGER'),
  sportDetails: z.union([
    FussballTurnierDetailsSchema,
    TennisTurnierDetailsSchema,
    BasketballTurnierDetailsSchema,
  ]),
  veranstalterName: z.string().min(1),
  veranstalterEmail: z.string().email(),
  veranstalterTelefon: z.string().optional(),
  veranstalterWebsite: z.preprocess(
    (val) => {
      if (typeof val !== 'string' || val.trim() === '') return undefined
      const url = val.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) return `https://${url}`
      return url
    },
    z.string().url().optional(),
  ),
  einreicherVorname: z.string().min(1),
  einreicherNachname: z.string().min(1),
  einreicherEmail: z.string().email(),
})

type SubmitBody = z.infer<typeof SubmitSchema>

// ── Slug-Generierung ─────────────────────────────────────────────

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  return `${base}-${suffix}`
}

// ── Geocoding ────────────────────────────────────────────────────

async function geocode(
  strasse: string,
  hausnummer: string,
  plz: string,
  stadt: string,
): Promise<{ lat: number | null; lng: number | null }> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!apiKey) return { lat: null, lng: null }

  try {
    const address = encodeURIComponent(`${strasse} ${hausnummer}, ${plz} ${stadt}, Deutschland`)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return { lat: null, lng: null }
    const data = (await res.json()) as { results: { geometry: { location: { lat: number; lng: number } } }[] }
    const loc = data.results?.[0]?.geometry?.location
    if (!loc) return { lat: null, lng: null }
    return { lat: loc.lat, lng: loc.lng }
  } catch {
    return { lat: null, lng: null }
  }
}

// ── Sport-Details formatieren ────────────────────────────────────

function formatTurnierDetailsForEmail(
  details: SubmitBody['sportDetails'],
  sportSlug: string,
): string {
  const lines: string[] = []

  if (sportSlug === 'fussball') {
    const d = details as z.infer<typeof FussballTurnierDetailsSchema>
    if (d.spielmodus) lines.push(`Spielmodus: ${d.spielmodus}`)
    lines.push(`Schiedsrichter: ${d.schiedsrichter ? 'Ja' : 'Nein'}`)
  } else if (sportSlug === 'tennis') {
    const d = details as z.infer<typeof TennisTurnierDetailsSchema>
    if (d.belag) {
      const belagLabels: Record<string, string> = {
        SAND: 'Sand', HART: 'Hart', KUNSTRASEN: 'Kunstrasen', HALLE: 'Halle',
      }
      lines.push(`Belag: ${belagLabels[d.belag] ?? d.belag}`)
    }
    lines.push(`LK-Wertung: ${d.lkWertung ? 'Ja' : 'Nein'}`)
  } else if (sportSlug === 'basketball') {
    const d = details as z.infer<typeof BasketballTurnierDetailsSchema>
    if (d.modus) lines.push(`Modus: ${d.modus === '5V5' ? '5v5' : '3×3'}`)
    lines.push(`Halbzeit: ${d.halbzeitMinuten} Minuten`)
  }

  return lines.join('\n') || '(keine weiteren Angaben)'
}

// ── POST Handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Body parsen
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  // 2. Validierung
  const parsed = SubmitSchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Validierungsfehler'
    return NextResponse.json({ error: message }, { status: 422 })
  }

  const body = parsed.data

  // 3. Sportart aus DB laden
  const sport = await prisma.sport.findUnique({ where: { slug: body.sportSlug } })
  if (!sport) {
    return NextResponse.json({ error: `Sportart "${body.sportSlug}" nicht gefunden.` }, { status: 400 })
  }

  // 4. Geocoding (graceful)
  const { lat, lng } = await geocode(body.strasse, body.hausnummer, body.plz, body.stadt)

  // 5. Turnier in DB anlegen
  const slug = generateSlug(body.turniername)
  const confirmToken = crypto.randomUUID()
  const einreicherName = `${body.einreicherVorname} ${body.einreicherNachname}`

  const tournament = await prisma.tournament.create({
    data: {
      sportId: sport.id,
      name: body.turniername,
      slug,
      description: body.beschreibung,
      city: body.stadt,
      state: body.bundesland as Parameters<typeof prisma.tournament.create>[0]['data']['state'],
      address: `${body.strasse} ${body.hausnummer}, ${body.plz} ${body.stadt}`,
      latitude: lat,
      longitude: lng,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null,
      maxParticipants: body.maxParticipants ?? null,
      entryFee: body.entryFee ?? null,
      prizePool: null,
      level: body.niveau,
      status: 'DRAFT',
      isPublished: false,
      isVerified: false,
      confirmToken,
      submitterName: einreicherName,
      submitterEmail: body.einreicherEmail,
      details: {
        format: body.format,
        startzeit: body.startzeit ?? null,
        preisgeld: body.preisgeld ?? null,
        veranstalterName: body.veranstalterName,
        veranstalterEmail: body.veranstalterEmail,
        veranstalterTelefon: body.veranstalterTelefon ?? null,
        veranstalterWebsite: body.veranstalterWebsite ?? null,
        sportDetails: body.sportDetails,
      },
    },
  })

  // 6. Admin-E-Mail via EmailJS
  const appUrl = process.env.NEXTAUTH_URL ?? 'https://sportrise.de'
  const serviceId = process.env.EMAILJS_SERVICE_ID ?? ''
  const templateId = process.env.EMAILJS_TEMPLATE_TURNIER ?? ''
  const publicKey = process.env.EMAILJS_PUBLIC_KEY ?? ''
  const privateKey = process.env.EMAILJS_PRIVATE_KEY ?? ''
  const adminEmail = process.env.ADMIN_EMAIL ?? ''

  const startFormatted = new Date(body.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' })
  const endFormatted = new Date(body.endDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Berlin' })

  if (serviceId && templateId && publicKey && adminEmail) {
    try {
      init({ publicKey, privateKey: privateKey || undefined })
      await send(
        serviceId,
        templateId,
        {
          to_email: adminEmail,
          turniername: body.turniername,
          sportart: sport.name,
          datum_start: startFormatted,
          datum_ende: endFormatted,
          adresse: `${body.strasse} ${body.hausnummer}, ${body.plz} ${body.stadt}`,
          bundesland: body.bundesland,
          format: body.format,
          altersklasse: `${body.ageMin}–${body.ageMax} Jahre`,
          startgeld: body.entryFee ? `${body.entryFee} €` : 'Kostenlos',
          max_teilnehmer: body.maxParticipants ? String(body.maxParticipants) : 'Unbegrenzt',
          beschreibung: body.beschreibung,
          sport_details: formatTurnierDetailsForEmail(body.sportDetails, body.sportSlug),
          veranstalter_name: body.veranstalterName,
          veranstalter_email: body.veranstalterEmail,
          einreicher_name: einreicherName,
          einreicher_email: body.einreicherEmail,
          alle_angaben: [
            `Turniername: ${body.turniername}`,
            `Sportart: ${sport.name}`,
            `Datum: ${startFormatted} – ${endFormatted}`,
            `Adresse: ${body.strasse} ${body.hausnummer}, ${body.plz} ${body.stadt}`,
            `Bundesland: ${body.bundesland}`,
            `Format: ${body.format}`,
            `Altersklasse: ${body.ageMin}–${body.ageMax} Jahre`,
            `Startgeld: ${body.entryFee ? `${body.entryFee} €` : 'Kostenlos'}`,
            `Max. Teilnehmer: ${body.maxParticipants ?? 'Unbegrenzt'}`,
            `Preisgeld: ${body.preisgeld ?? '(keines)'}`,
            `Veranstalter: ${body.veranstalterName} <${body.veranstalterEmail}>`,
            '',
            'Sport-Details:',
            formatTurnierDetailsForEmail(body.sportDetails, body.sportSlug),
          ].join('\n'),
          confirm_link: `${appUrl}/api/turniere/${tournament.id}/bestaetigen?token=${confirmToken}`,
          reject_link: `${appUrl}/api/turniere/${tournament.id}/ablehnen?token=${confirmToken}`,
          submitted_at: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
        },
        { publicKey },
      )
    } catch {
      // E-Mail-Fehler sind nicht kritisch – Turnier ist bereits gespeichert
    }
  }

  // 7. Einreicher-Bestätigungs-E-Mail via Resend
  await sendTurnierEinreichungBestaetigung({
    toEmail: body.einreicherEmail,
    einreicherVorname: body.einreicherVorname,
    turnierName: body.turniername,
  })

  return NextResponse.json({ success: true, tournamentId: tournament.id }, { status: 201 })
}
