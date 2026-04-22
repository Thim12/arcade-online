import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
    }

    const body = await req.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
    }

    // Insert all detected items
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 7) // +7 Days default

    const createdItems = await prisma.$transaction(
      items.map((item: any) => 
        prisma.userInventoryItem.create({
          data: {
            userId: session.user.id,
            name: item.name,
            category: 'LIVE_SCAN',
            quantity: 1, // Default 1 per bounding box
            expiryDate: defaultExpiry,
            addedVia: 'BATCH_SCAN'
          }
        })
      )
    )

    return NextResponse.json({ success: true, count: createdItems.length })

  } catch (error) {
    console.error('Inventory Batch Save Error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
