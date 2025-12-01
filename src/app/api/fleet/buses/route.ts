import { NextRequest, NextResponse } from 'next/server'
import { getAllBuses } from '@/lib/services/fleet'
import { prisma } from '@/lib/prisma'
import { createBusSchema, updateBusSchema, validateRequest } from '@/lib/validations'
import { fleetLogger } from '@/lib/logger'

export async function GET() {
  try {
    const buses = await getAllBuses()
    fleetLogger.debug('Fetched all buses', { count: buses.length })
    return NextResponse.json(buses)
  } catch (error) {
    fleetLogger.error('Error fetching buses', error)
    return NextResponse.json(
      { error: 'Failed to fetch buses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateRequest(createBusSchema, body)
    if (!validation.success) {
      fleetLogger.info('Bus creation validation failed', { error: validation.error })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const {
      registrationNumber,
      chassisNumber,
      seatingCapacity,
      purchaseDate,
      primaryDriverId,
      conductorId,
      fitnessExpiry,
      registrationExpiry,
      insuranceExpiry,
      ownershipType,
      privateOwnerName,
      privateOwnerContact,
      privateOwnerBank,
      schoolCommission,
      routeName,
      startPoint,
      endPoint,
      waypoints,
      totalDistanceKm,
    } = validation.data

    // Check if driver is already assigned to another bus
    if (primaryDriverId) {
      const existingAssignment = await prisma.bus.findFirst({
        where: {
          primaryDriverId: primaryDriverId,
        },
        select: {
          registrationNumber: true,
        },
      })

      if (existingAssignment) {
        fleetLogger.info('Driver already assigned to another bus', {
          driverId: primaryDriverId,
          existingBus: existingAssignment.registrationNumber,
        })
        return NextResponse.json(
          { error: `This driver is already assigned to bus ${existingAssignment.registrationNumber}` },
          { status: 409 }
        )
      }
    }

    // Calculate fitness reminder (30 days before expiry)
    let fitnessReminderDate = null
    if (fitnessExpiry) {
      const expiryDate = new Date(fitnessExpiry)
      fitnessReminderDate = new Date(expiryDate)
      fitnessReminderDate.setDate(fitnessReminderDate.getDate() - 30)
    }

    // Calculate registration reminder (30 days before expiry)
    let registrationReminderDate = null
    if (registrationExpiry) {
      const expiryDate = new Date(registrationExpiry)
      registrationReminderDate = new Date(expiryDate)
      registrationReminderDate.setDate(registrationReminderDate.getDate() - 30)
    }

    // Calculate insurance reminder (30 days before expiry)
    let insuranceReminderDate = null
    if (insuranceExpiry) {
      const expiryDate = new Date(insuranceExpiry)
      insuranceReminderDate = new Date(expiryDate)
      insuranceReminderDate.setDate(insuranceReminderDate.getDate() - 30)
    }

    // Create new bus
    const bus = await prisma.bus.create({
      data: {
        registrationNumber,
        chassisNumber,
        seatingCapacity,
        purchaseDate: new Date(purchaseDate),
        ...(primaryDriverId && { primaryDriver: { connect: { id: primaryDriverId } } }),
        fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
        fitnessReminder: fitnessReminderDate,
        registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
        registrationReminder: registrationReminderDate,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        insuranceReminder: insuranceReminderDate,
        ownershipType,
        privateOwnerName: privateOwnerName || null,
        privateOwnerContact: privateOwnerContact || null,
        privateOwnerBank: privateOwnerBank || null,
        schoolCommission: schoolCommission || 0,
      },
    })

    // Create fitness expiry reminder if date is provided
    if (fitnessExpiry) {
      await prisma.reminder.create({
        data: {
          busId: bus.id,
          type: 'Fitness_Certificate',
          dueDate: new Date(fitnessExpiry),
          status: 'Pending',
          notes: 'Vehicle fitness certificate expiring soon',
        },
      })
    }

    // Create registration expiry reminder if date is provided
    if (registrationExpiry) {
      await prisma.reminder.create({
        data: {
          busId: bus.id,
          type: 'Permit',
          dueDate: new Date(registrationExpiry),
          status: 'Pending',
          notes: 'Vehicle registration expiring soon',
        },
      })
    }

    // Create insurance expiry reminder if date is provided
    if (insuranceExpiry) {
      await prisma.reminder.create({
        data: {
          busId: bus.id,
          type: 'Insurance_Renewal',
          dueDate: new Date(insuranceExpiry),
          status: 'Pending',
          notes: 'Vehicle insurance expiring soon',
        },
      })
    }

    // Create BusRoute if route name is provided or driver/conductor is assigned or waypoints exist
    if (routeName || primaryDriverId || conductorId || waypoints) {
      // Create or find the route
      let route = null

      if (routeName || waypoints) {
        // Create a new route with the provided info
        route = await prisma.route.create({
          data: {
            routeName: routeName || `Route for ${registrationNumber}`,
            startPoint: startPoint || routeName || 'Start',
            endPoint: endPoint || 'School',
            totalDistanceKm: totalDistanceKm || 0,
            waypoints: waypoints || null,
          },
        })
      } else {
        // Get or create a default route
        route = await prisma.route.findFirst()
        if (!route) {
          route = await prisma.route.create({
            data: {
              routeName: 'Default Route',
              startPoint: 'School',
              endPoint: 'Various',
              totalDistanceKm: 0,
            },
          })
        }
      }

      await prisma.busRoute.create({
        data: {
          busId: bus.id,
          driverId: primaryDriverId || null,
          conductorId: conductorId || null,
          routeId: route.id,
          academicTerm: '2024-25',
          startDate: new Date(),
        },
      })
    }

    fleetLogger.info('Bus created successfully', { busId: bus.id, registrationNumber })

    return NextResponse.json(bus, { status: 201 })
  } catch (error: any) {
    fleetLogger.error('Error creating bus', error, { code: error.code })

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Bus with this registration or chassis number already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create bus' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateRequest(updateBusSchema, body)
    if (!validation.success) {
      fleetLogger.info('Bus update validation failed', { error: validation.error })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const {
      id,
      registrationNumber,
      chassisNumber,
      seatingCapacity,
      purchaseDate,
      primaryDriverId,
      conductorId,
      fitnessExpiry,
      registrationExpiry,
      insuranceExpiry,
      ownershipType,
      privateOwnerName,
      privateOwnerContact,
      privateOwnerBank,
      schoolCommission,
      routeName,
      startPoint,
      endPoint,
      waypoints,
      totalDistanceKm,
    } = validation.data

    // Check if registration number or chassis number is already used by another bus
    const existingBusWithSameDetails = await prisma.bus.findFirst({
      where: {
        AND: [
          { id: { not: id } }, // Exclude the current bus
          {
            OR: [
              { registrationNumber },
              { chassisNumber },
            ],
          },
        ],
      },
      select: {
        registrationNumber: true,
        chassisNumber: true,
      },
    })

    if (existingBusWithSameDetails) {
      const conflictField = existingBusWithSameDetails.registrationNumber === registrationNumber
        ? 'registration number'
        : 'chassis number'
      fleetLogger.info('Bus with same details exists', {
        conflictField,
        registrationNumber,
        chassisNumber,
      })
      return NextResponse.json(
        { error: `Another bus with this ${conflictField} already exists` },
        { status: 409 }
      )
    }

    // Check if driver is already assigned to another bus
    if (primaryDriverId) {
      const existingAssignment = await prisma.bus.findFirst({
        where: {
          primaryDriverId: primaryDriverId,
          NOT: {
            id: id, // Exclude the current bus being updated
          },
        },
        select: {
          registrationNumber: true,
        },
      })

      if (existingAssignment) {
        fleetLogger.info('Driver already assigned to another bus', {
          driverId: primaryDriverId,
          existingBus: existingAssignment.registrationNumber,
        })
        return NextResponse.json(
          { error: `This driver is already assigned to bus ${existingAssignment.registrationNumber}` },
          { status: 409 }
        )
      }
    }

    // Calculate fitness reminder (30 days before expiry)
    let fitnessReminderDate = null
    if (fitnessExpiry) {
      const expiryDate = new Date(fitnessExpiry)
      fitnessReminderDate = new Date(expiryDate)
      fitnessReminderDate.setDate(fitnessReminderDate.getDate() - 30)
    }

    // Calculate registration reminder (30 days before expiry)
    let registrationReminderDate = null
    if (registrationExpiry) {
      const expiryDate = new Date(registrationExpiry)
      registrationReminderDate = new Date(expiryDate)
      registrationReminderDate.setDate(registrationReminderDate.getDate() - 30)
    }

    // Calculate insurance reminder (30 days before expiry)
    let insuranceReminderDate = null
    if (insuranceExpiry) {
      const expiryDate = new Date(insuranceExpiry)
      insuranceReminderDate = new Date(expiryDate)
      insuranceReminderDate.setDate(insuranceReminderDate.getDate() - 30)
    }

    // Update bus
    const bus = await prisma.bus.update({
      where: { id },
      data: {
        registrationNumber,
        chassisNumber,
        seatingCapacity,
        purchaseDate: new Date(purchaseDate),
        ...(primaryDriverId ? { primaryDriver: { connect: { id: primaryDriverId } } } : { primaryDriver: { disconnect: true } }),
        fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
        fitnessReminder: fitnessReminderDate,
        registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
        registrationReminder: registrationReminderDate,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        insuranceReminder: insuranceReminderDate,
        ownershipType,
        privateOwnerName: privateOwnerName || null,
        privateOwnerContact: privateOwnerContact || null,
        privateOwnerBank: privateOwnerBank || null,
        schoolCommission: schoolCommission || 0,
      },
    })

    // Update or create fitness expiry reminder
    if (fitnessExpiry) {
      const existingReminder = await prisma.reminder.findFirst({
        where: {
          busId: id,
          type: 'Fitness_Certificate',
        },
      })

      if (existingReminder) {
        await prisma.reminder.update({
          where: { id: existingReminder.id },
          data: {
            dueDate: new Date(fitnessExpiry),
            status: 'Pending',
          },
        })
      } else {
        await prisma.reminder.create({
          data: {
            busId: id,
            type: 'Fitness_Certificate',
            dueDate: new Date(fitnessExpiry),
            status: 'Pending',
            notes: 'Vehicle fitness certificate expiring soon',
          },
        })
      }
    }

    // Update or create registration expiry reminder
    if (registrationExpiry) {
      const existingReminder = await prisma.reminder.findFirst({
        where: {
          busId: id,
          type: 'Permit',
        },
      })

      if (existingReminder) {
        await prisma.reminder.update({
          where: { id: existingReminder.id },
          data: {
            dueDate: new Date(registrationExpiry),
            status: 'Pending',
          },
        })
      } else {
        await prisma.reminder.create({
          data: {
            busId: id,
            type: 'Permit',
            dueDate: new Date(registrationExpiry),
            status: 'Pending',
            notes: 'Vehicle registration expiring soon',
          },
        })
      }
    }

    // Update or create insurance expiry reminder
    if (insuranceExpiry) {
      const existingReminder = await prisma.reminder.findFirst({
        where: {
          busId: id,
          type: 'Insurance_Renewal',
        },
      })

      if (existingReminder) {
        await prisma.reminder.update({
          where: { id: existingReminder.id },
          data: {
            dueDate: new Date(insuranceExpiry),
            status: 'Pending',
          },
        })
      } else {
        await prisma.reminder.create({
          data: {
            busId: id,
            type: 'Insurance_Renewal',
            dueDate: new Date(insuranceExpiry),
            status: 'Pending',
            notes: 'Vehicle insurance expiring soon',
          },
        })
      }
    }

    // Update or create BusRoute if route name, driver/conductor, or waypoints are provided
    if (routeName || primaryDriverId || conductorId || waypoints) {
      const existingBusRoute = await prisma.busRoute.findFirst({
        where: { busId: id },
        include: { route: true },
      })

      if (existingBusRoute) {
        // Update existing route information
        await prisma.route.update({
          where: { id: existingBusRoute.route.id },
          data: {
            ...(routeName && { routeName }),
            ...(startPoint && { startPoint }),
            ...(endPoint && { endPoint }),
            ...(totalDistanceKm !== undefined && { totalDistanceKm }),
            ...(waypoints !== undefined && { waypoints }),
          },
        })

        // Update driver/conductor in BusRoute
        await prisma.busRoute.update({
          where: { id: existingBusRoute.id },
          data: {
            driverId: primaryDriverId || existingBusRoute.driverId,
            conductorId: conductorId || existingBusRoute.conductorId,
          },
        })
      } else {
        // Create a new route and bus route
        let route = null

        if (routeName || waypoints) {
          route = await prisma.route.create({
            data: {
              routeName: routeName || `Route for ${registrationNumber}`,
              startPoint: startPoint || routeName || 'Start',
              endPoint: endPoint || 'School',
              totalDistanceKm: totalDistanceKm || 0,
              waypoints: waypoints || null,
            },
          })
        } else {
          route = await prisma.route.findFirst()
          if (!route) {
            route = await prisma.route.create({
              data: {
                routeName: 'Default Route',
                startPoint: 'School',
                endPoint: 'Various',
                totalDistanceKm: 0,
              },
            })
          }
        }

        await prisma.busRoute.create({
          data: {
            busId: id,
            driverId: primaryDriverId || null,
            conductorId: conductorId || null,
            routeId: route.id,
            academicTerm: '2024-25',
            startDate: new Date(),
          },
        })
      }
    }

    fleetLogger.info('Bus updated successfully', { busId: id, registrationNumber })

    return NextResponse.json(bus)
  } catch (error: any) {
    fleetLogger.error('Error updating bus', error, { code: error.code })

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Bus with this registration or chassis number already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update bus' },
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
        { error: 'Bus ID is required' },
        { status: 400 }
      )
    }

    await prisma.bus.delete({
      where: { id },
    })

    fleetLogger.info('Bus deleted successfully', { busId: id })

    return NextResponse.json({ message: 'Bus deleted successfully' })
  } catch (error: any) {
    fleetLogger.error('Error deleting bus', error, { code: error.code })

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete bus' },
      { status: 500 }
    )
  }
}
