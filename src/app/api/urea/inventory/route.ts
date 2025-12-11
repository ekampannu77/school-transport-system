import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all purchases
    const purchases = await prisma.ureaPurchase.findMany({
      orderBy: {
        date: 'desc',
      },
    })

    // Get all dispenses with bus info
    const dispenses = await prisma.ureaDispense.findMany({
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
    })

    // Calculate totals
    const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0)
    const totalDispensed = dispenses.reduce((sum, d) => sum + d.quantity, 0)
    const currentStock = totalPurchased - totalDispensed

    // Calculate total spent on urea
    const totalSpent = purchases.reduce((sum, p) => sum + p.totalCost, 0)

    // Get average price per litre
    const averagePrice = totalPurchased > 0 ? totalSpent / totalPurchased : 0

    // Get dispense stats by bus
    const busDispenseMap = new Map<string, { busId: string; registrationNumber: string; totalDispensed: number }>()
    dispenses.forEach((d) => {
      const existing = busDispenseMap.get(d.busId)
      if (existing) {
        existing.totalDispensed += d.quantity
      } else {
        busDispenseMap.set(d.busId, {
          busId: d.busId,
          registrationNumber: d.bus.registrationNumber,
          totalDispensed: d.quantity,
        })
      }
    })

    const busSummary = Array.from(busDispenseMap.values()).sort((a, b) => b.totalDispensed - a.totalDispensed)

    return NextResponse.json({
      currentStock,
      totalPurchased,
      totalDispensed,
      totalSpent,
      averagePrice,
      purchaseCount: purchases.length,
      dispenseCount: dispenses.length,
      recentPurchases: purchases.slice(0, 5),
      recentDispenses: dispenses.slice(0, 10),
      busSummary,
    })
  } catch (error) {
    console.error('Error fetching urea inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch urea inventory' },
      { status: 500 }
    )
  }
}
