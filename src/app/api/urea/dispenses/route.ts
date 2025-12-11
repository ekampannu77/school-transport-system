import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all urea dispenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')

    const where: any = {}
    if (busId) where.busId = busId

    const dispenses = await prisma.ureaDispense.findMany({
      where,
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(dispenses)
  } catch (error) {
    console.error('Error fetching urea dispenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch urea dispenses' },
      { status: 500 }
    )
  }
}

// POST create new urea dispense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { busId, date, quantity, dispensedBy, notes } = body

    // Validation
    if (!busId || !date || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if bus exists
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
    })

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    // Check if there's enough urea in stock
    const purchases = await prisma.ureaPurchase.aggregate({
      _sum: {
        quantity: true,
      },
    })

    const dispenses = await prisma.ureaDispense.aggregate({
      _sum: {
        quantity: true,
      },
    })

    const totalPurchased = purchases._sum.quantity || 0
    const totalDispensed = dispenses._sum.quantity || 0
    const currentStock = totalPurchased - totalDispensed

    if (parseFloat(quantity) > currentStock) {
      return NextResponse.json(
        { error: `Insufficient urea in stock. Available: ${currentStock} litres` },
        { status: 400 }
      )
    }

    const dispense = await prisma.ureaDispense.create({
      data: {
        busId,
        date: new Date(date),
        quantity: parseFloat(quantity),
        dispensedBy: dispensedBy || null,
        notes: notes || null,
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
    })

    return NextResponse.json(dispense, { status: 201 })
  } catch (error: any) {
    console.error('Error creating urea dispense:', error)
    return NextResponse.json(
      { error: 'Failed to create urea dispense', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE urea dispense
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

    await prisma.ureaDispense.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Dispense deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting urea dispense:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Dispense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete dispense' },
      { status: 500 }
    )
  }
}
