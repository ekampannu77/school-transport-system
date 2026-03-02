import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAcademicYear } from '@/lib/dateUtils'
import { assignBusToRouteSchema, validateRequest } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = validateRequest(assignBusToRouteSchema, {
      ...body,
      // academicTerm is optional from client; default to current academic year
      academicTerm: body.academicTerm || getCurrentAcademicYear(),
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { routeId, busId } = validation.data

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
        academicTerm: getCurrentAcademicYear(),
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
