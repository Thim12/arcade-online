// ─────────────────────────────────────────────────────────────────
// GET /api/users/[username] – Öffentliches Profil laden
// Gibt Profildaten, Top-Badges, Post-Grid und Stats zurück.
// Nicht-öffentliche Profile: 404 für fremde User.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } },
) {
  const session = await auth()
  const currentUserId = session?.user?.id ?? null

  const { username } = params

  // User suchen
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      level: true,
      xp: true,
      streakDays: true,
      state: true,
      city: true,
      isPublicProfile: true,
      createdAt: true,
      sports: {
        include: {
          sport: {
            select: {
              id: true,
              name: true,
              slug: true,
              colorPrimary: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      userBadges: {
        orderBy: { earnedAt: 'desc' },
        take: 6,
        include: {
          badge: {
            include: {
              sport: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  colorPrimary: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })
  }

  // Privates Profil: nur der eigene User darf es sehen
  const isOwnProfile = currentUserId === user.id
  if (!user.isPublicProfile && !isOwnProfile) {
    return NextResponse.json({ error: 'Dieses Profil ist privat' }, { status: 403 })
  }

  // Prüfen ob eingeloggter User diesem Profil bereits folgt
  let isFollowingThisUser = false
  if (currentUserId && currentUserId !== user.id) {
    const follow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id,
        },
      },
      select: { id: true },
    })
    isFollowingThisUser = follow !== null
  }

  // Posts für Grid laden (max 12)
  const posts = await prisma.post.findMany({
    where: { userId: user.id, isHidden: false },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      id: true,
      type: true,
      content: true,
      title: true,
      mediaUrl: true,
      mediaType: true,
      createdAt: true,
      sport: {
        select: {
          id: true,
          name: true,
          slug: true,
          colorPrimary: true,
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  })

  const topBadges = user.userBadges.map((ub) => ({
    id: ub.badge.id,
    name: ub.badge.name,
    description: ub.badge.description,
    iconName: ub.badge.iconName,
    rarity: ub.badge.rarity,
    xpReward: ub.badge.xpReward,
    isSecret: ub.badge.isSecret,
    requirement: ub.badge.requirement as Record<string, unknown>,
    sportId: ub.badge.sportId,
    sport: ub.badge.sport,
    earnedAt: ub.earnedAt.toISOString(),
    isEarned: true,
  }))

  const profilePosts = posts.map((p) => ({
    id: p.id,
    type: p.type,
    content: p.content,
    title: p.title,
    mediaUrl: p.mediaUrl,
    mediaType: p.mediaType,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    createdAt: p.createdAt.toISOString(),
    sport: p.sport,
  }))

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      level: user.level,
      xp: user.xp,
      streakDays: user.streakDays,
      state: user.state,
      city: user.city,
      isPublicProfile: user.isPublicProfile,
      createdAt: user.createdAt.toISOString(),
      sports: user.sports.map((us) => ({
        id: us.id,
        level: us.level,
        details: us.details as Record<string, unknown> | null,
        sport: us.sport,
      })),
      topBadges,
      postCount: user._count.posts,
      followerCount: user._count.followers,
      followingCount: user._count.following,
    },
    isOwnProfile,
    isFollowingThisUser,
    posts: profilePosts,
  })
}
