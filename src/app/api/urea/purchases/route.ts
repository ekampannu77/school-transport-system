import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all urea purchases
export async function GET() {
  try {
    const purchases = await prisma.ureaPurchase.findMany({
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('Error fetching urea purchases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch urea purchases' },
      { status: 500 }
    )
  }
}

// POST create new urea purchase
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

    const purchase = await prisma.ureaPurchase.create({
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
    console.error('Error creating urea purchase:', error)
    return NextResponse.json(
      { error: 'Failed to create urea purchase', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE urea purchase
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

    await prisma.ureaPurchase.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Purchase deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting urea purchase:', error)

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
