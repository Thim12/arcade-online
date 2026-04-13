// ─────────────────────────────────────────────────────────────────
// /benachrichtigungen – Server Component
// Lädt Notifications und gibt sie an BenachrichtigungenClient weiter.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BenachrichtigungenClient } from '@/components/benachrichtigungen/BenachrichtigungenClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Benachrichtigungen · SportRise',
  description: 'Alle deine Benachrichtigungen auf einen Blick.',
}

export default async function BenachrichtigungenPage(): Promise<React.JSX.Element> {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/anmelden')
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Serialisierbar machen (Dates zu ISO-Strings)
  const serialized = notifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.createdAt.toISOString(), // Notification hat kein updatedAt
    data: n.data as Record<string, unknown> | null,
  }))

  return <BenachrichtigungenClient initialNotifications={serialized} />
}
