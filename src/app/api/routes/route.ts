import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      include: {
        busRoutes: {
          include: {
            bus: {
              select: {
                registrationNumber: true,
                primaryDriver: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            busRoutes: true,
          },
        },
      },
      orderBy: {
        routeName: 'asc',
      },
    })
    return NextResponse.json(routes)
  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeName, startPoint, endPoint, distance } = body

    // Validation
    if (!routeName || !startPoint || !endPoint || !distance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new route
    const route = await prisma.route.create({
      data: {
        routeName,
        startPoint,
        endPoint,
        totalDistanceKm: parseFloat(distance),
      },
    })

    return NextResponse.json(route, { status: 201 })
  } catch (error: any) {
    console.error('Error creating route:', error)

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Route with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create route' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, routeName, startPoint, endPoint, distance } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      )
    }

    // Update route
    const route = await prisma.route.update({
      where: { id },
      data: {
        routeName,
        startPoint,
        endPoint,
        totalDistanceKm: parseFloat(distance),
      },
    })

    return NextResponse.json(route)
  } catch (error: any) {
    console.error('Error updating route:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Route with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update route' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      )
    }

    await prisma.route.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Route deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting route:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    )
  }
}
