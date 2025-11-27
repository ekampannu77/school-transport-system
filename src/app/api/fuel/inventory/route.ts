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

    // Get total fuel dispensed to buses
    const busDispenses = await prisma.fuelDispense.aggregate({
      _sum: {
        quantity: true,
      },
    })

    // Get total fuel dispensed to personal vehicles
    const personalDispenses = await prisma.personalVehicleFuelDispense.aggregate({
      _sum: {
        quantity: true,
      },
    })

    const totalPurchased = purchases._sum.quantity || 0
    const totalBusDispensed = busDispenses._sum.quantity || 0
    const totalPersonalDispensed = personalDispenses._sum.quantity || 0
    const totalDispensed = totalBusDispensed + totalPersonalDispensed
    const currentStock = totalPurchased - totalDispensed

    // Get recent purchases
    const recentPurchases = await prisma.fuelPurchase.findMany({
      orderBy: {
        date: 'desc',
      },
      take: 10,
    })

    // Get recent bus dispenses
    const recentBusDispenses = await prisma.fuelDispense.findMany({
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

    // Get recent personal vehicle dispenses
    const recentPersonalDispenses = await prisma.personalVehicleFuelDispense.findMany({
      include: {
        vehicle: {
          select: {
            vehicleName: true,
            vehicleNumber: true,
            ownerName: true,
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
      totalBusDispensed,
      totalPersonalDispensed,
      recentPurchases,
      recentDispenses: recentBusDispenses,
      recentPersonalDispenses,
    })
  } catch (error) {
    console.error('Error fetching fuel inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fuel inventory' },
      { status: 500 }
    )
  }
}
