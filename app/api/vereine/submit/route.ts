// ─────────────────────────────────────────────────────────────────
// app/api/vereine/submit/route.ts
//
// POST /api/vereine/submit
// Nimmt ein Vereins-Einreichungs-Formular entgegen, speichert den
// Verein als PENDING in der Datenbank und sendet eine Admin-E-Mail
// via EmailJS sowie eine Bestätigungs-E-Mail an den Einreicher via
// Resend.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { init, send } from '@emailjs/nodejs'
import { prisma } from '@/lib/prisma'
import { sendVereinEinreichungBestaetigung } from '@/lib/resend'

// ── Zod Schema ───────────────────────────────────────────────────

const FussballDetailsSchema = z.object({
  ligaName: z.string(),
  staffel: z.string(),
  altersklassen: z.array(z.string()),
  trainingszeiten: z.string(),
  naturrasen: z.boolean(),
  kunstrasen: z.boolean(),
  halle: z.boolean(),
  jugendfoerderung: z.boolean(),
  trainerInfo: z.string(),
  besonderheit: z.string(),
})

const TennisDetailsSchema = z.object({
  anzahlSandplaetze: z.number().int().min(0),
  anzahlHartplaetze: z.number().int().min(0),
  anzahlHallenplaetze: z.number().int().min(0),
  platzBeschreibung: z.string(),
  doppel: z.boolean(),
  vereinsmeisterschaften: z.boolean(),
  lkTurniere: z.boolean(),
  medenspiel: z.boolean(),
  trainerstunden: z.boolean(),
  trainerInfo: z.string(),
  altersgruppen: z.array(z.string()),
  besonderheit: z.string(),
})

const BasketballDetailsSchema = z.object({
  ligaName: z.string(),
  trainingszeiten: z.string(),
  hallenName: z.string(),
  hallenAdresse: z.string(),
  anzahlKoerbe: z.number().int().min(1),
  teamJugend: z.boolean(),
  teamDamen: z.boolean(),
  teamHerren: z.boolean(),
  teamDreiXdrei: z.boolean(),
  trainerInfo: z.string(),
  besonderheit: z.string(),
})

const SubmitSchema = z.object({
  vereinsname: z.string().min(2).max(120),
  sportSlug: z.enum(['fussball', 'tennis', 'basketball']),
  strasse: z.string().min(1),
  hausnummer: z.string().min(1),
  plz: z.string().length(5),
  stadt: z.string().min(1),
  bundesland: z.string().min(1),
  website: z.string().url().optional(),
  vereinEmail: z.string().email().optional(),
  telefon: z.string().optional(),
  beschreibung: z.string().min(50).max(1500),
  niveau: z.enum(['ANFAENGER', 'FORTGESCHRITTENE', 'WETTKAMPF', 'PROFI']),
  priceCategory: z.enum(['kostenlos', 'guenstig', 'mittel', 'premium']),
  ageMin: z.number().int().min(0).max(80),
  ageMax: z.number().int().min(0).max(80),
  sportDetails: z.union([FussballDetailsSchema, TennisDetailsSchema, BasketballDetailsSchema]),
  logoBase64: z.string().optional(),
  logoMimeType: z.string().optional(),
  einreicherVorname: z.string().min(1),
  einreicherNachname: z.string().min(1),
  einreicherEmail: z.string().email(),
  einreicherTel: z.string().optional(),
})

type SubmitBody = z.infer<typeof SubmitSchema>

// ── Konstanten ───────────────────────────────────────────────────

const PRICE_TO_FEE: Record<string, number> = {
  kostenlos: 0,
  guenstig: 20,
  mittel: 45,
  premium: 80,
}

const NIVEAU_LABEL: Record<string, string> = {
  ANFAENGER: 'Anfänger',
  FORTGESCHRITTENE: 'Fortgeschrittene',
  WETTKAMPF: 'Wettkampf',
  PROFI: 'Profi',
}

const PRICE_LABEL: Record<string, string> = {
  kostenlos: 'Kostenlos (0 €/Monat)',
  guenstig: 'Günstig (< 30 €/Monat)',
  mittel: 'Mittel (30–60 €/Monat)',
  premium: 'Premium (> 60 €/Monat)',
}

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

// ── Logo Upload zu Supabase Storage ─────────────────────────────

async function uploadLogoToSupabase(
  base64: string,
  mimeType: string,
  vereinId: string,
): Promise<string | null> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) return null

  try {
    const ext = mimeType.split('/')[1] ?? 'png'
    const path = `vereine/${vereinId}/logo.${ext}`
    const buffer = Buffer.from(base64, 'base64')

    const res = await fetch(`${supabaseUrl}/storage/v1/object/logos/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: buffer,
    })
    if (!res.ok) return null
    return `${supabaseUrl}/storage/v1/object/public/logos/${path}`
  } catch {
    return null
  }
}

// ── Sport-Details formatieren ────────────────────────────────────

function formatSportDetailsForEmail(
  details: SubmitBody['sportDetails'],
  sportSlug: string,
): string {
  const lines: string[] = []

  if (sportSlug === 'fussball') {
    const d = details as z.infer<typeof FussballDetailsSchema>
    if (d.ligaName) lines.push(`Liga: ${d.ligaName}${d.staffel ? ` (${d.staffel})` : ''}`)
    if (d.altersklassen.length > 0) lines.push(`Altersklassen: ${d.altersklassen.join(', ')}`)
    if (d.trainingszeiten) lines.push(`Trainingszeiten: ${d.trainingszeiten}`)
    const flaechen = [d.naturrasen && 'Naturrasen', d.kunstrasen && 'Kunstrasen', d.halle && 'Halle'].filter(Boolean)
    if (flaechen.length > 0) lines.push(`Spielflächen: ${flaechen.join(', ')}`)
    if (d.jugendfoerderung) lines.push('Jugendförderung: Ja')
    if (d.trainerInfo) lines.push(`Trainer: ${d.trainerInfo}`)
    if (d.besonderheit) lines.push(`Besonderheit: ${d.besonderheit}`)
  } else if (sportSlug === 'tennis') {
    const d = details as z.infer<typeof TennisDetailsSchema>
    const plaetze = [
      d.anzahlSandplaetze > 0 && `${d.anzahlSandplaetze}x Sand`,
      d.anzahlHartplaetze > 0 && `${d.anzahlHartplaetze}x Hart`,
      d.anzahlHallenplaetze > 0 && `${d.anzahlHallenplaetze}x Halle`,
    ].filter(Boolean)
    if (plaetze.length > 0) lines.push(`Plätze: ${plaetze.join(', ')}`)
    if (d.platzBeschreibung) lines.push(`Platzbeschreibung: ${d.platzBeschreibung}`)
    const features = [
      d.doppel && 'Doppel',
      d.vereinsmeisterschaften && 'Vereinsmeisterschaften',
      d.lkTurniere && 'LK-Turniere',
      d.medenspiel && 'Medenspiel',
      d.trainerstunden && 'Trainerstunden',
    ].filter(Boolean)
    if (features.length > 0) lines.push(`Angebote: ${features.join(', ')}`)
    if (d.altersgruppen.length > 0) lines.push(`Altersgruppen: ${d.altersgruppen.join(', ')}`)
    if (d.trainerInfo) lines.push(`Trainer: ${d.trainerInfo}`)
    if (d.besonderheit) lines.push(`Besonderheit: ${d.besonderheit}`)
  } else if (sportSlug === 'basketball') {
    const d = details as z.infer<typeof BasketballDetailsSchema>
    if (d.ligaName) lines.push(`Liga: ${d.ligaName}`)
    if (d.trainingszeiten) lines.push(`Trainingszeiten: ${d.trainingszeiten}`)
    if (d.hallenName) lines.push(`Halle: ${d.hallenName}${d.hallenAdresse ? ` — ${d.hallenAdresse}` : ''}`)
    lines.push(`Körbe: ${d.anzahlKoerbe}`)
    const teams = [
      d.teamHerren && 'Herren',
      d.teamDamen && 'Damen',
      d.teamJugend && 'Jugend',
      d.teamDreiXdrei && '3×3',
    ].filter(Boolean)
    if (teams.length > 0) lines.push(`Teams: ${teams.join(', ')}`)
    if (d.trainerInfo) lines.push(`Trainer: ${d.trainerInfo}`)
    if (d.besonderheit) lines.push(`Besonderheit: ${d.besonderheit}`)
  }

  return lines.join('\n') || '(keine weiteren Angaben)'
}

// ── hasYouthTeam ─────────────────────────────────────────────────

function computeHasYouthTeam(details: SubmitBody['sportDetails'], sportSlug: string): boolean {
  if (sportSlug === 'fussball') {
    return (details as z.infer<typeof FussballDetailsSchema>).altersklassen.some((k) =>
      k.startsWith('U'),
    )
  }
  if (sportSlug === 'tennis') {
    return (details as z.infer<typeof TennisDetailsSchema>).altersgruppen.includes('Jugend')
  }
  if (sportSlug === 'basketball') {
    return (details as z.infer<typeof BasketballDetailsSchema>).teamJugend
  }
  return false
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

  // 5. Verein in DB anlegen (PENDING)
  const slug = generateSlug(body.vereinsname)
  const confirmToken = crypto.randomUUID()
  const monthlyFee = PRICE_TO_FEE[body.priceCategory] ?? null
  const hasYouthTeam = computeHasYouthTeam(body.sportDetails, body.sportSlug)
  const einreicherName = `${body.einreicherVorname} ${body.einreicherNachname}`

  const verein = await prisma.verein.create({
    data: {
      sportId: sport.id,
      name: body.vereinsname,
      slug,
      description: body.beschreibung,
      address: `${body.strasse} ${body.hausnummer}`,
      city: body.stadt,
      state: body.bundesland as Parameters<typeof prisma.verein.create>[0]['data']['state'],
      postalCode: body.plz,
      latitude: lat,
      longitude: lng,
      website: body.website ?? null,
      phone: body.telefon ?? null,
      email: body.vereinEmail ?? null,
      logoUrl: null,
      monthlyFee,
      hasYouthTeam,
      ageMin: body.ageMin,
      ageMax: body.ageMax,
      status: 'PENDING',
      isVerified: false,
      confirmToken,
      submitterEmail: body.einreicherEmail,
      submitterName: einreicherName,
      details: body.sportDetails,
    },
  })

  // 6. Logo-Upload (async, non-blocking für Response)
  let logoUrl: string | null = null
  if (body.logoBase64 && body.logoMimeType) {
    logoUrl = await uploadLogoToSupabase(body.logoBase64, body.logoMimeType, verein.id)
    if (logoUrl) {
      await prisma.verein.update({ where: { id: verein.id }, data: { logoUrl } })
    }
  }

  // 7. Admin-E-Mail via EmailJS
  const appUrl = process.env.NEXTAUTH_URL ?? 'https://sportrise.de'
  const serviceId = process.env.EMAILJS_SERVICE_ID ?? ''
  const templateId = process.env.EMAILJS_TEMPLATE_VEREIN ?? ''
  const publicKey = process.env.EMAILJS_PUBLIC_KEY ?? ''
  const privateKey = process.env.EMAILJS_PRIVATE_KEY ?? ''
  const adminEmail = process.env.ADMIN_EMAIL ?? ''

  if (serviceId && templateId && publicKey && adminEmail) {
    try {
      init({ publicKey, privateKey: privateKey || undefined })
      await send(
        serviceId,
        templateId,
        {
          to_email: adminEmail,
          vereinsname: body.vereinsname,
          sportart: sport.name,
          adresse: `${body.strasse} ${body.hausnummer}, ${body.plz} ${body.stadt}`,
          bundesland: body.bundesland,
          niveau: NIVEAU_LABEL[body.niveau] ?? body.niveau,
          preis: PRICE_LABEL[body.priceCategory] ?? body.priceCategory,
          altersklasse: `${body.ageMin}–${body.ageMax} Jahre`,
          beschreibung: body.beschreibung,
          sport_details: formatSportDetailsForEmail(body.sportDetails, body.sportSlug),
          einreicher_name: einreicherName,
          einreicher_email: body.einreicherEmail,
          einreicher_tel: body.einreicherTel ?? '(keine Angabe)',
          alle_angaben: [
            `Vereinsname: ${body.vereinsname}`,
            `Sportart: ${sport.name}`,
            `Adresse: ${body.strasse} ${body.hausnummer}, ${body.plz} ${body.stadt}`,
            `Bundesland: ${body.bundesland}`,
            `Niveau: ${NIVEAU_LABEL[body.niveau] ?? body.niveau}`,
            `Preis: ${PRICE_LABEL[body.priceCategory] ?? body.priceCategory}`,
            `Alter: ${body.ageMin}–${body.ageMax} Jahre`,
            `Website: ${body.website ?? '(keine)'}`,
            `Vereins-E-Mail: ${body.vereinEmail ?? '(keine)'}`,
            `Telefon: ${body.telefon ?? '(keine)'}`,
            '',
            'Sport-Details:',
            formatSportDetailsForEmail(body.sportDetails, body.sportSlug),
          ].join('\n'),
          confirm_link: `${appUrl}/api/vereine/${verein.id}/bestaetigen?token=${confirmToken}`,
          reject_link: `${appUrl}/api/vereine/${verein.id}/ablehnen?token=${confirmToken}`,
          submitted_at: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
        },
        { publicKey },
      )
    } catch {
      // Email-Fehler sind nicht kritisch – Verein ist bereits gespeichert
    }
  }

  // 8. Einreicher-Bestätigungs-E-Mail via Resend
  await sendVereinEinreichungBestaetigung({
    toEmail: body.einreicherEmail,
    einreicherVorname: body.einreicherVorname,
    vereinName: body.vereinsname,
  })

  return NextResponse.json({ success: true, vereinId: verein.id }, { status: 201 })
}
