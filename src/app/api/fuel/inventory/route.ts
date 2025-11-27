import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total fuel purchased
    const purchases = await prisma.fuelPurchase.aggregate({
      _sum: {
        quantity: true,
      },
    })

    // Get total fuel dispensed
    const dispenses = await prisma.fuelDispense.aggregate({
      _sum: {
        quantity: true,
      },
    })

    const totalPurchased = purchases._sum.quantity || 0
    const totalDispensed = dispenses._sum.quantity || 0
    const currentStock = totalPurchased - totalDispensed

    // Get recent purchases
    const recentPurchases = await prisma.fuelPurchase.findMany({
      orderBy: {
        date: 'desc',
      },
      take: 10,
    })

    // Get recent dispenses
    const recentDispenses = await prisma.fuelDispense.findMany({
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({
      currentStock,
      totalPurchased,
      totalDispensed,
      recentPurchases,
      recentDispenses,
    })
  } catch (error) {
    console.error('Error fetching fuel inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fuel inventory' },
      { status: 500 }
    )
  }
}
