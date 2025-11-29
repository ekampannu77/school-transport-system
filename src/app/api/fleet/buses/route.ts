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
      fitnessExpiry,
      ownershipType,
      privateOwnerName,
      privateOwnerContact,
      privateOwnerBank,
      schoolCommission,
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
      fitnessExpiry,
      ownershipType,
      privateOwnerName,
      privateOwnerContact,
      privateOwnerBank,
      schoolCommission,
    } = validation.data

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
        ownershipType,
        privateOwnerName: privateOwnerName || null,
        privateOwnerContact: privateOwnerContact || null,
        privateOwnerBank: privateOwnerBank || null,
        schoolCommission: schoolCommission || 0,
      },
    })

    // Update or create fitness expiry reminder
    if (fitnessExpiry) {
      // Try to find existing fitness reminder
      const existingReminder = await prisma.reminder.findFirst({
        where: {
          busId: id,
          type: 'Fitness_Certificate',
        },
      })

      if (existingReminder) {
        // Update existing reminder
        await prisma.reminder.update({
          where: { id: existingReminder.id },
          data: {
            dueDate: new Date(fitnessExpiry),
            status: 'Pending',
          },
        })
      } else {
        // Create new reminder
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
