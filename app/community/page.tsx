// ─────────────────────────────────────────────────────────────────
// /app/community/page.tsx – Community-Feed (Server Component)
// Auth-Check → redirect /login
// Lädt: User-Profil, initiale Posts, Turniere, aktive Sports
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Feed } from '@/components/community/Feed'

export const metadata = {
  title: 'Community – SportRise',
  description: 'Tausche dich mit anderen Sportlerinnen und Sportlern aus',
}

export default async function CommunityPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // Alle Queries parallel ausführen
  const [user, initialPostsRaw, sports, tournaments] = await Promise.all([
    // User-Profil mit Sport + Follow-Stats
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        level: true,
        xp: true,
        state: true,
        city: true,
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
          take: 3,
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    }),

    // Initiale 15 Posts (neueste, nicht versteckt)
    prisma.post.findMany({
      where: { isHidden: false },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 16,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            level: true,
          },
        },
        sport: {
          select: {
            id: true,
            name: true,
            slug: true,
            colorPrimary: true,
          },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    }),

    // Aktive Sportarten
    prisma.sport.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        colorPrimary: true,
      },
    }),

    // Bevorstehende Turniere (nächste 5)
    prisma.tournament.findMany({
      where: {
        isPublished: true,
        startDate: { gte: new Date() },
        status: { in: ['PUBLISHED', 'REGISTRATION_OPEN'] },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        startDate: true,
        level: true,
        sport: {
          select: {
            name: true,
            slug: true,
            colorPrimary: true,
          },
        },
      },
    }),
  ])

  if (!user) redirect('/login')

  // Posts serialisieren (Dates → ISO-Strings)
  const hasMore = initialPostsRaw.length > 15
  const rawPosts = hasMore ? initialPostsRaw.slice(0, 15) : initialPostsRaw
  const nextCursor = hasMore ? rawPosts[rawPosts.length - 1]?.id ?? null : null

  const initialPosts = rawPosts.map((post) => ({
    id: post.id,
    content: post.content,
    title: post.title,
    type: post.type,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    isPinned: post.isPinned,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    user: post.user,
    sport: post.sport,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    isLikedByMe: post.likes.length > 0,
  }))

  const serializedTournaments = tournaments.map((t) => ({
    ...t,
    startDate: t.startDate.toISOString(),
  }))

  return (
    <Feed
      currentUser={{
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        level: user.level,
        xp: user.xp,
        state: user.state,
        city: user.city,
        postCount: user._count.posts,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        sports: user.sports.map((us) => us.sport),
      }}
      initialPosts={initialPosts}
      initialNextCursor={nextCursor}
      initialHasMore={hasMore}
      sports={sports}
      tournaments={serializedTournaments}
    />
  )
}
