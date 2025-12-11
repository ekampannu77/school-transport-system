import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createUreaPurchaseSchema, validateRequest } from '@/lib/validations'

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

    // Validate with Zod
    const validation = validateRequest(createUreaPurchaseSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { date, quantity, pricePerLitre, vendor, invoiceNumber, notes } = validation.data
    const totalCost = quantity * pricePerLitre

    const purchase = await prisma.ureaPurchase.create({
      data: {
        date: new Date(date),
        quantity,
        pricePerLitre,
        totalCost,
        vendor: vendor || null,
        invoiceNumber: invoiceNumber || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Error creating urea purchase:', error)
    return NextResponse.json(
      { error: 'Failed to create urea purchase' },
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
  } catch (error: unknown) {
    console.error('Error deleting urea purchase:', error)

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
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
