// ─────────────────────────────────────────────────────────────────
// /app/dashboard/fridge/page.tsx – Smart Fridge Manager (Server Component)
// ─────────────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FridgeClient } from './FridgeClient'

export const metadata = {
  title: 'Smart Kühlschrank | SportRise',
  description: 'Verwalte dein Lebensmittel-Inventar mit KI-gestütztem Scanning.',
}

export default async function FridgePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const items = await prisma.userInventoryItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      category: true,
      quantity: true,
      quantityG: true,
      unit: true,
      barcode: true,
      expiryDate: true,
      caloriesPer100: true,
      proteinGPer100: true,
      carbsGPer100: true,
      fatGPer100: true,
      addedVia: true,
      createdAt: true,
    },
  })

  const serialized = items.map((item) => ({
    ...item,
    expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
  }))

  return <FridgeClient initialItems={serialized} />
}
