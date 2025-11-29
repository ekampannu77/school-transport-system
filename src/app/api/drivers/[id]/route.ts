import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            busRoutes: true,
            busRoutesAsConductor: true,
            documents: true,
          },
        },
        busRoutes: {
          where: {
            endDate: null,
          },
          include: {
            bus: {
              select: {
                registrationNumber: true,
              },
            },
            route: {
              select: {
                routeName: true,
              },
            },
          },
        },
        busRoutesAsConductor: {
          where: {
            endDate: null,
          },
          include: {
            bus: {
              select: {
                registrationNumber: true,
              },
            },
            route: {
              select: {
                routeName: true,
              },
            },
          },
        },
      },
    })

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Normalize the response - combine routes for conductors
    const response = {
      ...driver,
      busRoutes: driver.role === 'conductor'
        ? driver.busRoutesAsConductor
        : driver.busRoutes,
      _count: {
        ...driver._count,
        busRoutes: driver.role === 'conductor'
          ? driver._count.busRoutesAsConductor
          : driver._count.busRoutes,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching driver details:', error)
    return NextResponse.json({ error: 'Failed to fetch driver details' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { licenseExpiry, licenseReminder } = body

    const driver = await prisma.driver.update({
      where: { id: params.id },
      data: {
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        licenseReminder: licenseReminder ? new Date(licenseReminder) : null,
      },
    })

    return NextResponse.json(driver)
  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}
