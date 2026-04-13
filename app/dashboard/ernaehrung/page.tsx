// ─────────────────────────────────────────────────────────────────
// /app/dashboard/ernaehrung/page.tsx  (Server Component)
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ErnaehrungClient } from './ErnaehrungClient'

export const metadata = {
  title: 'Ernährung | SportRise',
  description: 'Dein tägliches Ernährungs-Tracking – Mahlzeiten, Makros und Wasserzufuhr.',
}

export default async function ErnaehrungPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const today = new Date()
  const dateStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  return <ErnaehrungClient initialDate={dateStr} />
}
