// ─────────────────────────────────────────────────────────────────
// /app/profil/[username]/page.tsx – Öffentliches Profil (Server Component)
// Lädt alle Profildaten serverseitig, übergibt an ProfilClient.
// notFound() wenn Username nicht existiert oder Profil privat ist.
// ─────────────────────────────────────────────────────────────────

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfilClient } from '@/components/profil/ProfilClient'
import type { ProfilBadge, ProfilPost, ProfilUser } from '@/lib/types/profil'

interface ProfilPageProps {
  params: { username: string }
}

export async function generateMetadata(
  { params }: ProfilPageProps,
): Promise<Metadata> {
  const { username } = params
  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, username: true, bio: true },
  })

  if (!user) return { title: 'Profil nicht gefunden – SportRise' }

  return {
    title: `${user.name ?? user.username} – SportRise`,
    description: user.bio ?? `Sportler-Profil von @${user.username} auf SportRise`,
  }
}

export default async function ProfilPage({ params }: ProfilPageProps) {
  const session = await auth()
  const currentUserId = session?.user?.id ?? null

  const { username } = params

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

  if (!user) notFound()

  const isOwnProfile = currentUserId === user.id

  // Privates Profil für fremde User nicht zugänglich
  if (!user.isPublicProfile && !isOwnProfile) notFound()

  // Follow-Status prüfen
  let isFollowingThisUser = false
  if (currentUserId && !isOwnProfile) {
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

  // Posts für Grid
  const postsRaw = await prisma.post.findMany({
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

  // Typen serialisieren
  const topBadges: ProfilBadge[] = user.userBadges.map((ub) => ({
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

  const posts: ProfilPost[] = postsRaw.map((p) => ({
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

  const profilUser: ProfilUser = {
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
  }

  return (
    <ProfilClient
      user={profilUser}
      posts={posts}
      isOwnProfile={isOwnProfile}
      isFollowingThisUser={isFollowingThisUser}
      currentUserId={currentUserId}
    />
  )
}
