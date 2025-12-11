import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUreaDispenseSchema, validateRequest } from '@/lib/validations'

// GET all urea dispenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')

    const where: { busId?: string } = {}
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

    // Validate with Zod
    const validation = validateRequest(createUreaDispenseSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { busId, date, quantity, dispensedBy, notes } = validation.data

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

    if (quantity > currentStock) {
      return NextResponse.json(
        { error: `Insufficient urea in stock. Available: ${currentStock} litres` },
        { status: 400 }
      )
    }

    const dispense = await prisma.ureaDispense.create({
      data: {
        busId,
        date: new Date(date),
        quantity,
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
  } catch (error) {
    console.error('Error creating urea dispense:', error)
    return NextResponse.json(
      { error: 'Failed to create urea dispense' },
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
  } catch (error: unknown) {
    console.error('Error deleting urea dispense:', error)

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
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
