import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all owner payments or filter by busId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')
    const status = searchParams.get('status')

    const where: any = {}
    if (busId) where.busId = busId
    if (status) where.status = status

    const payments = await prisma.busOwnerPayment.findMany({
      where,
      include: {
        bus: {
          select: {
            registrationNumber: true,
            privateOwnerName: true,
            privateOwnerContact: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching owner payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch owner payments' },
      { status: 500 }
    )
  }
}

// POST create new owner payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      busId,
      amount,
      paymentDate,
      periodStartDate,
      periodEndDate,
      paymentMethod,
      transactionRef,
      notes,
      status,
    } = body

    // Validation
    if (!busId || !amount || !paymentDate || !periodStartDate || !periodEndDate || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify bus is private owned
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      select: { ownershipType: true },
    })

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    if (bus.ownershipType !== 'PRIVATE_OWNED') {
      return NextResponse.json(
        { error: 'Can only create payments for private owned buses' },
        { status: 400 }
      )
    }

    // Create payment
    const payment = await prisma.busOwnerPayment.create({
      data: {
        busId,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        periodStartDate: new Date(periodStartDate),
        periodEndDate: new Date(periodEndDate),
        paymentMethod,
        transactionRef: transactionRef || null,
        notes: notes || null,
        status: status || 'PAID',
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
            privateOwnerName: true,
          },
        },
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating owner payment:', error)
    return NextResponse.json(
      { error: 'Failed to create owner payment', details: error.message },
      { status: 500 }
    )
  }
}

// PUT update owner payment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      amount,
      paymentDate,
      periodStartDate,
      periodEndDate,
      paymentMethod,
      transactionRef,
      notes,
      status,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    const payment = await prisma.busOwnerPayment.update({
      where: { id },
      data: {
        ...(amount && { amount: parseFloat(amount) }),
        ...(paymentDate && { paymentDate: new Date(paymentDate) }),
        ...(periodStartDate && { periodStartDate: new Date(periodStartDate) }),
        ...(periodEndDate && { periodEndDate: new Date(periodEndDate) }),
        ...(paymentMethod && { paymentMethod }),
        transactionRef: transactionRef || null,
        notes: notes || null,
        ...(status && { status }),
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
            privateOwnerName: true,
          },
        },
      },
    })

    return NextResponse.json(payment)
  } catch (error: any) {
    console.error('Error updating owner payment:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update owner payment', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE owner payment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    await prisma.busOwnerPayment.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting owner payment:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}
