// ─────────────────────────────────────────────────────────────────
// app/api/auth/register/route.ts
//
// POST /api/auth/register
// Erstellt einen neuen User-Account mit vollständigem Sportprofil.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Prisma, type GermanState } from '@prisma/client'
import { sendElternVerificationEmail, sendWelcomeEmail } from '@/lib/resend'
import { getSupabaseAdmin } from '@/lib/supabase'

// Prisma unique-constraint Fehlercode
const PRISMA_UNIQUE_VIOLATION = 'P2002'

// ─── Zod Schema ───────────────────────────────────────────────────

const RegisterSchema = z.object({
  vorname:       z.string().min(1).max(50).trim(),
  nachname:      z.string().min(1).max(50).trim(),
  email:         z.string().email(),
  passwort:      z.string().min(8).max(128),
  geburtsdatum:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum.'),
  parentEmail:   z.string().email().nullable(),
  city:          z.string().min(1).max(100).trim(),
  plz:           z.string().regex(/^\d{5}$/, 'Ungültige PLZ.'),
  bundesland:    z.string().min(1),
  geschlecht:    z.string().min(1),
  username:      z
    .string()
    .min(3, 'Mindestens 3 Zeichen.')
    .max(20, 'Maximal 20 Zeichen.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nur Buchstaben, Zahlen und Unterstriche.'),
  selectedZiele: z.array(z.string()).min(1, 'Wähle mindestens ein Ziel.'),
  equipment:     z.enum(['KOERPERGEWICHT', 'EINIGE_GERAETE', 'HEIMGYM', 'FITNESSSTUDIO']),
  heimbedarf:    z.array(z.string()),
  selectedSports: z.array(z.string()).min(1, 'Wähle mindestens eine Sportart.'),
  primarySport:  z.string().nullable(),
  fussball:      z.record(z.unknown()).nullable(),
  tennis:        z.record(z.unknown()).nullable(),
  basketball:    z.record(z.unknown()).nullable(),
  avatarUrl:     z.string().url().nullable(),
})

// ─── Bundesland Mapping ───────────────────────────────────────────

function normalizeBundesland(bl: string): GermanState | null {
  const map: Record<string, GermanState> = {
    'Baden-Württemberg':   'BADEN_WUERTTEMBERG',
    Bayern:                'BAYERN',
    Berlin:                'BERLIN',
    Brandenburg:           'BRANDENBURG',
    Bremen:                'BREMEN',
    Hamburg:               'HAMBURG',
    Hessen:                'HESSEN',
    'Mecklenburg-Vorpommern': 'MECKLENBURG_VORPOMMERN',
    Niedersachsen:         'NIEDERSACHSEN',
    'Nordrhein-Westfalen': 'NORDRHEIN_WESTFALEN',
    'Rheinland-Pfalz':     'RHEINLAND_PFALZ',
    Saarland:              'SAARLAND',
    Sachsen:               'SACHSEN',
    'Sachsen-Anhalt':      'SACHSEN_ANHALT',
    'Schleswig-Holstein':  'SCHLESWIG_HOLSTEIN',
    Thüringen:             'THUERINGEN',
  }
  return map[bl] ?? null
}

// ─── POST Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Parse & Zod-Validierung ───────────────────────────────────
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request.' }, { status: 400 })
  }

  const parsed = RegisterSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return NextResponse.json(
      { error: firstError?.message ?? 'Ungültige Eingabe.' },
      { status: 400 },
    )
  }

  const {
    vorname,
    nachname,
    email,
    passwort,
    geburtsdatum,
    parentEmail,
    city,
    plz,
    bundesland,
    geschlecht,
    username,
    selectedZiele,
    equipment,
    heimbedarf,
    selectedSports,
    primarySport,
    fussball,
    tennis,
    basketball,
    avatarUrl,
  } = parsed.data

  // ── Altersberechnung (kein date-fns) ──────────────────────────
  const ageInYears = Math.floor(
    (Date.now() - new Date(geburtsdatum).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  )

  if (ageInYears < 5 || ageInYears > 120) {
    return NextResponse.json({ error: 'Ungültiges Geburtsdatum.' }, { status: 400 })
  }

  if (ageInYears < 14 && (parentEmail === null || parentEmail.trim() === '')) {
    return NextResponse.json(
      { error: 'Für Unter-14-Jährige ist eine Eltern-E-Mail erforderlich.' },
      { status: 400 },
    )
  }

  // ── Bundesland normalisieren ──────────────────────────────────
  const state = normalizeBundesland(bundesland)
  if (state === null) {
    return NextResponse.json({ error: 'Ungültiges Bundesland.' }, { status: 400 })
  }

  // ── Duplicate Check ───────────────────────────────────────────
  let existingEmail: { id: string } | null
  let existingUsername: { id: string } | null
  try {
    ;[existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
        select: { id: true },
      }),
    ])
  } catch (dbErr) {
    console.error('[register/route] Duplicate-Check fehlgeschlagen:', dbErr)
    return NextResponse.json({ error: 'Datenbankfehler. Bitte versuche es erneut.' }, { status: 500 })
  }

  if (existingEmail !== null) {
    return NextResponse.json(
      { error: 'Diese E-Mail ist bereits registriert.' },
      { status: 409 },
    )
  }

  if (existingUsername !== null) {
    return NextResponse.json(
      { error: 'Dieser Benutzername ist bereits vergeben.' },
      { status: 409 },
    )
  }

  // ── Passwort hashen ───────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(passwort, 12)

  // ── Sportarten und Badges vorab laden ─────────────────────────
  const sportSlugs = selectedSports.filter((s): s is string => typeof s === 'string')

  let sports: { id: string; slug: string }[]
  let ersterSchrittBadge: { id: string; xpReward: number } | null
  let ersteWahlBadge: { id: string; xpReward: number } | null
  try {
    ;[sports, ersterSchrittBadge, ersteWahlBadge] = await Promise.all([
      prisma.sport.findMany({
        where: { slug: { in: sportSlugs } },
        select: { id: true, slug: true },
      }),
      prisma.badge.findUnique({
        where: { name: 'Erster Schritt' },
        select: { id: true, xpReward: true },
      }),
      prisma.badge.findUnique({
        where: { name: 'Erste Wahl' },
        select: { id: true, xpReward: true },
      }),
    ])
  } catch (dbErr) {
    console.error('[register/route] Vorab-Datenbankabfrage fehlgeschlagen:', dbErr)
    return NextResponse.json({ error: 'Datenbankfehler. Bitte versuche es erneut.' }, { status: 500 })
  }

  // ── Unter-14: parentVerifyToken generieren ────────────────────
  const isUnder14 = ageInYears < 14
  const parentVerifyToken = isUnder14 ? crypto.randomUUID() : null

  // ── Prisma Transaction ────────────────────────────────────────
  let user: { id: string }
  try {
    user = await prisma.$transaction(async (tx) => {
      // 1. User erstellen
      const newUser = await tx.user.create({
        data: {
          name:              `${vorname} ${nachname}`,
          email:             email.toLowerCase().trim(),
          password:          hashedPassword,
          username:          username.toLowerCase().trim(),
          image:             avatarUrl ?? null,
          birthYear:         new Date(geburtsdatum).getFullYear(),
          city:              city.trim(),
          state,
          gymAccessEnabled:  !isUnder14,
          isActive:          !isUnder14,
          parentVerifyToken,
          isParentVerified:  false,
          onboardingDone:    false,
        },
        select: { id: true },
      })

      // 2. UserSports anlegen mit sportProfile-JSON
      if (sports.length > 0) {
        const sportData = sports.map((sport) => {
          let sportSpecific: Record<string, unknown> | null = null
          if (sport.slug === 'fussball' && fussball !== null) sportSpecific = fussball
          if (sport.slug === 'tennis' && tennis !== null)     sportSpecific = tennis
          if (sport.slug === 'basketball' && basketball !== null) sportSpecific = basketball

          const profileJson: Record<string, unknown> = {
            isPrimary:     sport.slug === primarySport,
            selectedZiele,
            equipment,
            heimbedarf,
            ...(sportSpecific !== null ? { details: sportSpecific } : {}),
          }

          return {
            userId:  newUser.id,
            sportId: sport.id,
            details: profileJson as Prisma.InputJsonValue,
          }
        })

        await tx.userSport.createMany({ data: sportData })
      }

      // 3. Badge "Erster Schritt" vergeben
      let totalXp = 0
      const badgesToCreate: { userId: string; badgeId: string }[] = []

      if (ersterSchrittBadge !== null) {
        badgesToCreate.push({ userId: newUser.id, badgeId: ersterSchrittBadge.id })
        totalXp += ersterSchrittBadge.xpReward
      }

      // 4. Hessen Easter-Egg-Badge "Erste Wahl"
      if (state === 'HESSEN' && ersteWahlBadge !== null) {
        badgesToCreate.push({ userId: newUser.id, badgeId: ersteWahlBadge.id })
        totalXp += ersteWahlBadge.xpReward
      }

      if (badgesToCreate.length > 0) {
        await tx.userBadge.createMany({ data: badgesToCreate, skipDuplicates: true })
        await tx.user.update({
          where: { id: newUser.id },
          data: { xp: { increment: totalXp } },
        })
      }

      // 5. Willkommens-Benachrichtigung
      await tx.notification.create({
        data: {
          userId: newUser.id,
          type:   'SYSTEM',
          title:  'Willkommen bei SportRise!',
          body:   `Hallo ${vorname}! Dein Account ist ${isUnder14 ? 'fast' : ''} bereit.${isUnder14 ? ' Bitte warte auf die Bestätigung deiner Eltern.' : ' Viel Spaß beim Training.'}`,
        },
      })

      return newUser
    })
  } catch (txErr) {
    // Prisma P2002 = Unique constraint violation (race condition oder fehlende manuelle Prüfung)
    if (txErr instanceof Prisma.PrismaClientKnownRequestError && txErr.code === PRISMA_UNIQUE_VIOLATION) {
      const field = (txErr.meta?.target as string[] | undefined)?.[0] ?? ''
      if (field.includes('email') || field === '') {
        return NextResponse.json(
          { error: 'Diese E-Mail ist bereits registriert.' },
          { status: 409 },
        )
      }
      return NextResponse.json(
        { error: 'Dieser Benutzername ist bereits vergeben.' },
        { status: 409 },
      )
    }
    console.error('[register/route] Transaction-Fehler:', txErr)
    return NextResponse.json({ error: 'Interner Serverfehler. Bitte versuche es erneut.' }, { status: 500 })
  }

  // ── E-Mails senden ────────────────────────────────────────────
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportrise.de'

  if (isUnder14 && parentEmail !== null && parentVerifyToken !== null) {
    void sendElternVerificationEmail({
      elternEmail:      parentEmail,
      kindName:         vorname,
      verificationLink: `${APP_URL}/api/auth/parent-verify?token=${parentVerifyToken}`,
      denyLink:         `${APP_URL}/api/auth/parent-deny?token=${parentVerifyToken}`,
    })
  } else {
    void sendWelcomeEmail({
      toEmail: email,
      vorname,
    })
  }

  // ── Unused variable suppressed ────────────────────────────────
  void geschlecht
  void plz

  // ── Supabase Auth User anlegen ────────────────────────────────
  // Damit der User auch in auth.users erscheint und RLS funktioniert.
  // Fehler hier dürfen die Registrierung NICHT blockieren (graceful).
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: passwort,
      email_confirm: true,
      user_metadata: {
        name: `${vorname} ${nachname}`,
        prisma_id: user.id,
      },
    })
    if (supabaseError) {
      console.error('[register/route] Supabase Auth sync fehlgeschlagen:', supabaseError.message)
    }
  } catch (supabaseErr) {
    console.error('[register/route] Supabase Admin Fehler:', supabaseErr)
  }

  return NextResponse.json({ success: true, redirectTo: '/onboarding' }, { status: 201 })
}
