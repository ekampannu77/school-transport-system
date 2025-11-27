import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all fuel purchases
export async function GET() {
  try {
    const purchases = await prisma.fuelPurchase.findMany({
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Error fetching fuel purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fuel purchases' },
      { status: 500 }
    )
  }
}

// POST create new fuel purchase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, quantity, pricePerLitre, vendor, invoiceNumber, notes } = body

    // Validation
    if (!date || !quantity || !pricePerLitre) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const totalCost = parseFloat(quantity) * parseFloat(pricePerLitre)

    const purchase = await prisma.fuelPurchase.create({
      data: {
        date: new Date(date),
        quantity: parseFloat(quantity),
        pricePerLitre: parseFloat(pricePerLitre),
        totalCost,
        vendor: vendor || null,
        invoiceNumber: invoiceNumber || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error: any) {
    console.error('Error creating fuel purchase:', error)
    return NextResponse.json(
      { error: 'Failed to create fuel purchase', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE fuel purchase
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      )
    }

    await prisma.fuelPurchase.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Purchase deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting fuel purchase:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete purchase' },
      { status: 500 }
    )
  }
}
