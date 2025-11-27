import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all personal vehicle fuel dispenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    const whereClause = vehicleId ? { vehicleId } : {}

    const dispenses = await prisma.personalVehicleFuelDispense.findMany({
      where: whereClause,
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
    })

    return NextResponse.json(dispenses)
  } catch (error) {
    console.error('Error fetching personal vehicle dispenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dispenses' },
      { status: 500 }
    )
  }
}

// POST - Dispense fuel to a personal vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, date, quantity, odometerReading, dispensedBy, purpose, notes } = body

    if (!vehicleId || !date || !quantity) {
      return NextResponse.json(
        { error: 'Vehicle ID, date, and quantity are required' },
        { status: 400 }
      )
    }

    const quantityNum = parseFloat(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    // Check if vehicle exists
    const vehicle = await prisma.personalVehicle.findUnique({
      where: { id: vehicleId },
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Check available fuel stock
    const purchases = await prisma.fuelPurchase.aggregate({
      _sum: { quantity: true },
    })
    const busDispenses = await prisma.fuelDispense.aggregate({
      _sum: { quantity: true },
    })
    const personalDispenses = await prisma.personalVehicleFuelDispense.aggregate({
      _sum: { quantity: true },
    })

    const totalPurchased = purchases._sum.quantity || 0
    const totalBusDispensed = busDispenses._sum.quantity || 0
    const totalPersonalDispensed = personalDispenses._sum.quantity || 0
    const availableStock = totalPurchased - totalBusDispensed - totalPersonalDispensed

    if (quantityNum > availableStock) {
      return NextResponse.json(
        { error: `Insufficient fuel stock. Available: ${availableStock.toFixed(2)} L, Requested: ${quantityNum.toFixed(2)} L` },
        { status: 400 }
      )
    }

    // Create the dispense record
    const dispense = await prisma.personalVehicleFuelDispense.create({
      data: {
        vehicleId,
        date: new Date(date),
        quantity: quantityNum,
        odometerReading: odometerReading ? parseInt(odometerReading) : null,
        dispensedBy: dispensedBy || null,
        purpose: purpose || null,
        notes: notes || null,
      },
      include: {
        vehicle: {
          select: {
            vehicleName: true,
            vehicleNumber: true,
          },
        },
      },
    })

    return NextResponse.json(dispense, { status: 201 })
  } catch (error) {
    console.error('Error dispensing fuel to personal vehicle:', error)
    return NextResponse.json(
      { error: 'Failed to dispense fuel' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a dispense record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Dispense ID is required' },
        { status: 400 }
      )
    }

    await prisma.personalVehicleFuelDispense.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Dispense record deleted successfully' })
  } catch (error) {
    console.error('Error deleting dispense record:', error)
    return NextResponse.json(
      { error: 'Failed to delete dispense record' },
      { status: 500 }
    )
  }
}
