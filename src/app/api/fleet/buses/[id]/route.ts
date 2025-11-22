import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            expenses: true,
            reminders: {
              where: {
                status: 'Pending',
              },
            },
            documents: true,
          },
        },
        busRoutes: {
          where: {
            endDate: null,
          },
          include: {
            driver: {
              select: {
                name: true,
              },
            },
            conductor: {
              select: {
                name: true,
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

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 })
    }

    return NextResponse.json(bus)
  } catch (error) {
    console.error('Error fetching bus details:', error)
    return NextResponse.json({ error: 'Failed to fetch bus details' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { insuranceExpiry, insuranceReminder } = body

    const bus = await prisma.bus.update({
      where: { id: params.id },
      data: {
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        insuranceReminder: insuranceReminder ? new Date(insuranceReminder) : null,
      },
    })

    return NextResponse.json(bus)
  } catch (error) {
    console.error('Error updating bus:', error)
    return NextResponse.json({ error: 'Failed to update bus' }, { status: 500 })
  }
}
