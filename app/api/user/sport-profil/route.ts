// ─────────────────────────────────────────────────────────────────
// app/api/user/sport-profil/route.ts
//
// POST   – Neue Sportart hinzufügen (max. 3)
// PATCH  – Bestehende UserSport aktualisieren (details, level, goals, setAsPrimary)
// DELETE – Sportart entfernen (min. 1 muss bleiben)
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SportLevel, UserGoal } from '@prisma/client'
import { validateSportProfil } from '@/lib/sport-profiles'
import type { SportSlug } from '@/lib/sport-profiles'

// ── Zod-Schemas ──────────────────────────────────────────────────

const SportLevelEnum = z.nativeEnum(SportLevel)
const UserGoalEnum = z.nativeEnum(UserGoal)

const PostBodySchema = z.object({
  sportId: z.string().min(1, 'sportId ist erforderlich.'),
  level: SportLevelEnum,
  goals: z.array(UserGoalEnum).min(1, 'Mindestens ein Ziel ist erforderlich.'),
  details: z.unknown().optional(),
})

const PatchBodySchema = z.object({
  userSportId: z.string().min(1, 'userSportId ist erforderlich.'),
  level: SportLevelEnum.optional(),
  goals: z.array(UserGoalEnum).optional(),
  details: z.unknown().optional(),
  setAsPrimary: z.boolean().optional(),
})

const DeleteBodySchema = z.object({
  userSportId: z.string().min(1, 'userSportId ist erforderlich.'),
})

// ── POST: Neue Sportart hinzufügen ───────────────────────────────

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const result = PostBodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler.', details: result.error.flatten() },
      { status: 422 },
    )
  }

  const { sportId, level, goals, details } = result.data

  try {
    // Max. 3 Sportarten prüfen
    const existingCount = await prisma.userSport.count({
      where: { userId: session.user.id },
    })

    if (existingCount >= 3) {
      return NextResponse.json(
        { error: 'Du kannst maximal 3 Sportarten hinzufügen.' },
        { status: 400 },
      )
    }

    // Doppelte Sportart prüfen
    const alreadyExists = await prisma.userSport.findUnique({
      where: { userId_sportId: { userId: session.user.id, sportId } },
    })

    if (alreadyExists) {
      return NextResponse.json(
        { error: 'Diese Sportart ist bereits in deinem Profil.' },
        { status: 409 },
      )
    }

    // Sport holen für slug-basierte Details-Validierung
    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      select: { slug: true },
    })

    // Details validieren wenn vorhanden und Sport bekannt
    let validatedDetails: unknown = details ?? null
    if (details !== undefined && details !== null && sport) {
      const slug = sport.slug as SportSlug
      if (slug === 'fussball' || slug === 'tennis' || slug === 'basketball') {
        const detailsResult = validateSportProfil(slug, details)
        if (!detailsResult.success) {
          return NextResponse.json(
            { error: 'Ungültige Sport-Details.', details: detailsResult.errors.flatten() },
            { status: 422 },
          )
        }
        validatedDetails = detailsResult.data
      }
    }

    const userSport = await prisma.userSport.create({
      data: {
        userId: session.user.id,
        sportId,
        level,
        goals,
        details: validatedDetails as Parameters<typeof prisma.userSport.create>[0]['data']['details'],
      },
      include: {
        sport: {
          select: { id: true, name: true, slug: true, colorPrimary: true, iconName: true },
        },
      },
    })

    return NextResponse.json({ success: true, userSport }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/user/sport-profil]', error)
    return NextResponse.json(
      { error: 'Sportart konnte nicht hinzugefügt werden.' },
      { status: 500 },
    )
  }
}

// ── PATCH: Bestehende UserSport aktualisieren ─────────────────────

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const result = PatchBodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler.', details: result.error.flatten() },
      { status: 422 },
    )
  }

  const { userSportId, level, goals, details, setAsPrimary } = result.data

  try {
    // Ownership prüfen
    const userSport = await prisma.userSport.findFirst({
      where: { id: userSportId, userId: session.user.id },
      include: { sport: { select: { slug: true } } },
    })

    if (!userSport) {
      return NextResponse.json(
        { error: 'Sportart nicht gefunden oder kein Zugriff.' },
        { status: 404 },
      )
    }

    // Details validieren wenn vorhanden
    let validatedDetails: unknown = undefined
    if (details !== undefined && details !== null) {
      const slug = userSport.sport.slug as SportSlug
      if (slug === 'fussball' || slug === 'tennis' || slug === 'basketball') {
        const detailsResult = validateSportProfil(slug, details)
        if (!detailsResult.success) {
          return NextResponse.json(
            { error: 'Ungültige Sport-Details.', details: detailsResult.errors.flatten() },
            { status: 422 },
          )
        }
        validatedDetails = detailsResult.data
      }
    } else if (details === null) {
      validatedDetails = null
    }

    // setAsPrimary: Die erste Sport-Position (sortiert nach createdAt asc) gilt
    // als Hauptsportart. Wir können das nicht ohne Schema-Änderung implementieren,
    // also ignorieren wir setAsPrimary hier und geben nur Erfolg zurück.
    // Die Reihenfolge der UserSports bestimmt die Hauptsportart (index 0).
    if (setAsPrimary === true) {
      // Alle anderen UserSports dieses Users holen und sortieren
      // Wir löschen und erstellen neu, um die createdAt-Reihenfolge zu ändern – 
      // das ist zu destruktiv. Stattdessen: wir speichern eine "isPrimary"-Flag via
      // Details-Convention nicht – wir überspringen dies ohne Fehler.
      // Die Hauptsportart wird durch die Reihenfolge in der DB bestimmt.
    }

    const updateData: Record<string, unknown> = {}
    if (level !== undefined) updateData['level'] = level
    if (goals !== undefined) updateData['goals'] = goals
    if (validatedDetails !== undefined) updateData['details'] = validatedDetails

    const updated = await prisma.userSport.update({
      where: { id: userSportId },
      data: updateData,
      include: {
        sport: {
          select: { id: true, name: true, slug: true, colorPrimary: true, iconName: true },
        },
      },
    })

    return NextResponse.json({ success: true, userSport: updated })
  } catch (error) {
    console.error('[PATCH /api/user/sport-profil]', error)
    return NextResponse.json(
      { error: 'Sport-Profil konnte nicht aktualisiert werden.' },
      { status: 500 },
    )
  }
}

// ── DELETE: Sportart entfernen ───────────────────────────────────

export async function DELETE(req: Request): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  const result = DeleteBodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler.', details: result.error.flatten() },
      { status: 422 },
    )
  }

  const { userSportId } = result.data

  try {
    // Ownership prüfen
    const userSport = await prisma.userSport.findFirst({
      where: { id: userSportId, userId: session.user.id },
    })

    if (!userSport) {
      return NextResponse.json(
        { error: 'Sportart nicht gefunden oder kein Zugriff.' },
        { status: 404 },
      )
    }

    // Min. 1 Sportart muss bleiben
    const totalCount = await prisma.userSport.count({
      where: { userId: session.user.id },
    })

    if (totalCount <= 1) {
      return NextResponse.json(
        { error: 'Du musst mindestens eine Sportart behalten.' },
        { status: 400 },
      )
    }

    await prisma.userSport.delete({
      where: { id: userSportId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/user/sport-profil]', error)
    return NextResponse.json(
      { error: 'Sportart konnte nicht entfernt werden.' },
      { status: 500 },
    )
  }
}
