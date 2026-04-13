// ─────────────────────────────────────────────────────────────────
// POST /api/user/download-data
//
// DSGVO Art. 20 – Datenportabilität
// Gibt alle gespeicherten Daten des eingeloggten Users als JSON zurück.
// Lädt alle Relationen parallel für beste Performance.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const [
      user,
      sports,
      trainingSessions,
      nutritionPlans,
      mealLogs,
      posts,
      badges,
      tournaments,
      followers,
      following,
      notifications,
      sparringSent,
      sparringReceived,
    ] = await Promise.all([
      // Userdaten (ohne Passwort-Hash)
      prisma.user.findUnique({
        where:  { id: userId },
        select: {
          id:                 true,
          name:               true,
          email:              true,
          username:           true,
          bio:                true,
          birthYear:          true,
          state:              true,
          city:               true,
          xp:                 true,
          level:              true,
          streakDays:         true,
          longestStreak:      true,
          isPublicProfile:    true,
          emailNotifications: true,
          role:               true,
          onboardingDone:     true,
          createdAt:          true,
          updatedAt:          true,
        },
      }),

      // Sportarten
      prisma.userSport.findMany({
        where: { userId },
        include: {
          sport: { select: { name: true, slug: true } },
        },
      }),

      // Trainingseinheiten
      prisma.trainingSession.findMany({
        where:   { userId },
        orderBy: { completedAt: 'desc' },
      }),

      // Ernährungspläne (ohne vollständige planData für Größe)
      prisma.nutritionPlan.findMany({
        where:   { userId },
        select: {
          id:           true,
          title:        true,
          isActive:     true,
          isAiGenerated: true,
          createdAt:    true,
        },
      }),

      // Mahlzeiten-Logs
      prisma.mealLog.findMany({
        where:   { userId },
        orderBy: { date: 'desc' },
      }),

      // Posts
      prisma.post.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id:        true,
          type:      true,
          title:     true,
          content:   true,
          createdAt: true,
          sport:     { select: { name: true, slug: true } },
          _count:    { select: { likes: true, comments: true } },
        },
      }),

      // Abzeichen
      prisma.userBadge.findMany({
        where:   { userId },
        include: {
          badge: {
            select: {
              name:        true,
              description: true,
              rarity:      true,
              xpReward:    true,
            },
          },
        },
        orderBy: { earnedAt: 'desc' },
      }),

      // Turnier-Teilnahmen
      prisma.tournamentEntry.findMany({
        where: { userId },
        include: {
          tournament: {
            select: {
              name:      true,
              startDate: true,
              city:      true,
              state:     true,
              sport:     { select: { name: true } },
            },
          },
        },
      }),

      // Follower
      prisma.userFollow.findMany({
        where: { followingId: userId },
        select: {
          follower: { select: { username: true, name: true } },
          createdAt: true,
        },
      }),

      // Following
      prisma.userFollow.findMany({
        where: { followerId: userId },
        select: {
          following: { select: { username: true, name: true } },
          createdAt: true,
        },
      }),

      // Benachrichtigungen (letzte 100)
      prisma.notification.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        take:    100,
        select: {
          id:        true,
          type:      true,
          title:     true,
          body:      true,
          isRead:    true,
          createdAt: true,
        },
      }),

      // Gesendete Sparring-Anfragen
      prisma.sparringRequest.findMany({
        where: { senderId: userId },
        select: {
          receiver: { select: { username: true } },
          message:  true,
          status:   true,
          createdAt: true,
        },
      }),

      // Empfangene Sparring-Anfragen
      prisma.sparringRequest.findMany({
        where: { receiverId: userId },
        select: {
          sender:    { select: { username: true } },
          message:   true,
          status:    true,
          createdAt: true,
        },
      }),
    ])

    const exportData = {
      exportedAt:     new Date().toISOString(),
      dsgvoArt:       'Datenauskunft gemäß Art. 15 DSGVO / Datenportabilität gemäß Art. 20 DSGVO',
      platform:       'SportRise.de',
      user,
      sports,
      trainingSessions,
      nutritionPlans,
      mealLogs,
      posts,
      badges,
      tournaments,
      social: {
        followers: followers.map((f) => ({
          user:      f.follower,
          followedAt: f.createdAt,
        })),
        following: following.map((f) => ({
          user:      f.following,
          followedAt: f.createdAt,
        })),
      },
      notifications,
      sparring: {
        sent:     sparringSent,
        received: sparringReceived,
      },
    }

    const json = JSON.stringify(exportData, null, 2)
    const filename = `${user?.username ?? 'user'}-daten-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type':        'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[POST /api/user/download-data]', error)
    return NextResponse.json(
      { error: 'Daten konnten nicht exportiert werden.' },
      { status: 500 },
    )
  }
}
