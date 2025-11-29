import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRouteSchema, updateRouteSchema, validateRequest, idParamSchema } from '@/lib/validations'
import { withRateLimit, API_RATE_LIMIT } from '@/lib/rate-limit'

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
  // Rate limiting
  const rateLimitResponse = withRateLimit(request, API_RATE_LIMIT)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()

    // Validate input with Zod
    const validation = validateRequest(createRouteSchema, {
      ...body,
      totalDistanceKm: body.distance || body.totalDistanceKm,
    })
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { routeName, startPoint, endPoint, totalDistanceKm } = validation.data

    // Create new route
    const route = await prisma.route.create({
      data: {
        routeName,
        startPoint,
        endPoint,
        totalDistanceKm: totalDistanceKm || 0,
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
  // Rate limiting
  const rateLimitResponse = withRateLimit(request, API_RATE_LIMIT)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()

    // Validate input with Zod
    const validation = validateRequest(updateRouteSchema, {
      ...body,
      totalDistanceKm: body.distance || body.totalDistanceKm,
    })
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { id, routeName, startPoint, endPoint, totalDistanceKm } = validation.data

    // Update route
    const route = await prisma.route.update({
      where: { id },
      data: {
        ...(routeName && { routeName }),
        ...(startPoint && { startPoint }),
        ...(endPoint && { endPoint }),
        ...(totalDistanceKm !== undefined && { totalDistanceKm }),
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
  // Rate limiting
  const rateLimitResponse = withRateLimit(request, API_RATE_LIMIT)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Validate ID format
    const validation = validateRequest(idParamSchema, { id })
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    await prisma.route.delete({
      where: { id: validation.data.id },
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
