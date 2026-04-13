// ─────────────────────────────────────────────────────────────────
// app/dashboard/layout.tsx – Layout für alle Dashboard-Seiten
//
// Server Component.
// Guards:
//   - Nicht eingeloggt         → /registrieren
//   - Onboarding nicht fertig  → /onboarding
// Rendert die fixe Sidebar links, die globale TopBar oben
// und den Page-Content rechts davon.
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { KiFloatingButton } from '@/components/dashboard/KiFloatingButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/registrieren')
  }

  if (!session.user.onboardingDone) {
    redirect('/onboarding')
  }

  const userId = session.user.id
  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  })

  return (
    <div className="flex min-h-screen" style={{ background: '#FAFAFA' }}>
      {/* Fixe Sidebar (w-60 = 240px) */}
      <Sidebar
        primarySport={session.user.primarySport ?? null}
        userName={session.user.name ?? undefined}
        userEmail={session.user.email ?? undefined}
      />

      {/* Haupt-Content-Bereich – nach rechts verschoben */}
      <main className="flex-1 pl-60 min-h-screen flex flex-col">
        {/* Globale TopBar – auf jeder Dashboard-Seite sichtbar */}
        <DashboardTopBar
          userName={session.user.name ?? 'Sportler'}
          userImage={session.user.image ?? null}
          primarySport={session.user.primarySport ?? null}
          unreadCount={unreadCount}
        />

        {/* Seiteninhalt */}
        {children}
      </main>

      {/* Floating KI-Trainer Button (auf allen Dashboard-Seiten) */}
      <KiFloatingButton primarySport={session.user.primarySport ?? null} />
    </div>
  )
}
