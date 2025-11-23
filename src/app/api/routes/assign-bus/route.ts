import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeId, busId } = body

    if (!routeId || !busId) {
      return NextResponse.json(
        { error: 'Route ID and Bus ID are required' },
        { status: 400 }
      )
    }

    // Check if there's already an active assignment for this route
    const existingAssignment = await prisma.busRoute.findFirst({
      where: {
        routeId: routeId,
        endDate: null, // Active assignment
      },
    })

    // If there's an existing assignment, end it
    if (existingAssignment) {
      await prisma.busRoute.update({
        where: { id: existingAssignment.id },
        data: { endDate: new Date() },
      })
    }

    // Check if this bus is already assigned to another route
    const busAlreadyAssigned = await prisma.busRoute.findFirst({
      where: {
        busId: busId,
        endDate: null,
        NOT: {
          routeId: routeId,
        },
      },
      include: {
        route: {
          select: {
            routeName: true,
          },
        },
      },
    })

    if (busAlreadyAssigned) {
      return NextResponse.json(
        { error: `This bus is already assigned to route: ${busAlreadyAssigned.route.routeName}` },
        { status: 409 }
      )
    }

    // Create new assignment
    const assignment = await prisma.busRoute.create({
      data: {
        busId: busId,
        routeId: routeId,
        academicTerm: new Date().getFullYear().toString(),
        startDate: new Date(),
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    console.error('Error assigning bus to route:', error)
    return NextResponse.json(
      { error: 'Failed to assign bus to route' },
      { status: 500 }
    )
  }
}
