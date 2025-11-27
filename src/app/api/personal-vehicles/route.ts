import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - List all personal vehicles
export async function GET() {
  try {
    const vehicles = await prisma.personalVehicle.findMany({
      where: {
        isActive: true,
      },
      include: {
        fuelDispenses: {
          orderBy: {
            date: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            fuelDispenses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate total fuel dispensed and mileage per vehicle
    const vehiclesWithStats = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Get total fuel dispensed
        const totalDispensed = await prisma.personalVehicleFuelDispense.aggregate({
          where: {
            vehicleId: vehicle.id,
          },
          _sum: {
            quantity: true,
          },
        })

        // Get dispenses with odometer readings for mileage calculation
        const dispensesWithOdometer = await prisma.personalVehicleFuelDispense.findMany({
          where: {
            vehicleId: vehicle.id,
            odometerReading: {
              not: null,
            },
          },
          orderBy: {
            date: 'asc',
          },
          select: {
            odometerReading: true,
            quantity: true,
            date: true,
          },
        })

        // Calculate mileage (km per litre)
        let mileage = null
        let totalDistance = null
        let lastOdometer = null
        let firstOdometer = null

        if (dispensesWithOdometer.length >= 2) {
          // Get first and last odometer readings
          firstOdometer = dispensesWithOdometer[0].odometerReading
          lastOdometer = dispensesWithOdometer[dispensesWithOdometer.length - 1].odometerReading

          if (firstOdometer !== null && lastOdometer !== null) {
            totalDistance = lastOdometer - firstOdometer

            // Calculate total fuel used between first and last reading
            // (exclude first dispense as that fuel was used before first reading)
            const fuelUsedForDistance = dispensesWithOdometer
              .slice(1)
              .reduce((sum, d) => sum + (d.quantity || 0), 0)

            if (fuelUsedForDistance > 0 && totalDistance > 0) {
              mileage = totalDistance / fuelUsedForDistance
            }
          }
        }

        return {
          ...vehicle,
          totalFuelDispensed: totalDispensed._sum.quantity || 0,
          mileage: mileage ? parseFloat(mileage.toFixed(2)) : null,
          totalDistance,
          lastOdometer,
          firstOdometer,
          odometerReadingsCount: dispensesWithOdometer.length,
        }
      })
    )

    return NextResponse.json(vehiclesWithStats)
  } catch (error) {
    console.error('Error fetching personal vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personal vehicles' },
      { status: 500 }
    )
  }
}

// POST - Create a new personal vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleName, vehicleNumber, vehicleType, ownerName, ownerContact } = body

    if (!vehicleName || !ownerName) {
      return NextResponse.json(
        { error: 'Vehicle name and owner name are required' },
        { status: 400 }
      )
    }

    const vehicle = await prisma.personalVehicle.create({
      data: {
        vehicleName,
        vehicleNumber: vehicleNumber || null,
        vehicleType: vehicleType || null,
        ownerName,
        ownerContact: ownerContact || null,
      },
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Error creating personal vehicle:', error)
    return NextResponse.json(
      { error: 'Failed to create personal vehicle' },
      { status: 500 }
    )
  }
}

// DELETE - Deactivate a personal vehicle
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    await prisma.personalVehicle.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Vehicle deactivated successfully' })
  } catch (error) {
    console.error('Error deactivating personal vehicle:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate personal vehicle' },
      { status: 500 }
    )
  }
}
