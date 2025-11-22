import { NextRequest, NextResponse } from 'next/server'
import { getAllBuses } from '@/lib/services/fleet'
import { prisma } from '@/lib/prisma'
import { BusStatus } from '@prisma/client'

export async function GET() {
  try {
    const buses = await getAllBuses()
    return NextResponse.json(buses)
  } catch (error) {
    console.error('Error fetching buses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationNumber, chassisNumber, seatingCapacity, purchaseDate, status } = body

    // Validation
    if (!registrationNumber || !chassisNumber || !seatingCapacity || !purchaseDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate status
    if (status && !Object.values(BusStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid bus status' },
        { status: 400 }
      )
    }

    // Create new bus
    const bus = await prisma.bus.create({
      data: {
        registrationNumber,
        chassisNumber,
        seatingCapacity: parseInt(seatingCapacity),
        purchaseDate: new Date(purchaseDate),
        status: status || BusStatus.active,
      },
    })

    return NextResponse.json(bus, { status: 201 })
  } catch (error: any) {
    console.error('Error creating bus:', error)

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
    const { id, registrationNumber, chassisNumber, seatingCapacity, purchaseDate, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Bus ID is required' },
        { status: 400 }
      )
    }

    // Update bus
    const bus = await prisma.bus.update({
      where: { id },
      data: {
        registrationNumber,
        chassisNumber,
        seatingCapacity: parseInt(seatingCapacity),
        purchaseDate: new Date(purchaseDate),
        status,
      },
    })

    return NextResponse.json(bus)
  } catch (error: any) {
    console.error('Error updating bus:', error)

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

    return NextResponse.json({ message: 'Bus deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting bus:', error)

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
