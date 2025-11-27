import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExpenseCategory } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { busId, category, amount, date, description, odometerReading, receiptImageUrl, pricePerLitre, litresFilled } = body

    // Validation
    if (!busId || !category || !amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: busId, category, amount, date' },
        { status: 400 }
      )
    }

    // Validate category
    if (!Object.values(ExpenseCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid expense category' },
        { status: 400 }
      )
    }

    // Additional validation for fuel expenses
    if (category === 'Fuel') {
      if (!litresFilled || !pricePerLitre) {
        return NextResponse.json(
          { error: 'Fuel expenses require litresFilled and pricePerLitre' },
          { status: 400 }
        )
      }

      // Check fuel inventory stock
      const purchases = await prisma.fuelPurchase.aggregate({
        _sum: {
          quantity: true,
        },
      })

      const dispenses = await prisma.fuelDispense.aggregate({
        _sum: {
          quantity: true,
        },
      })

      const totalPurchased = purchases._sum.quantity || 0
      const totalDispensed = dispenses._sum.quantity || 0
      const currentStock = totalPurchased - totalDispensed

      if (parseFloat(litresFilled) > currentStock) {
        return NextResponse.json(
          { error: `Insufficient fuel in stock. Available: ${currentStock} litres` },
          { status: 400 }
        )
      }
    }

    // Use a transaction to create both expense and fuel dispense (if applicable)
    const result = await prisma.$transaction(async (tx) => {
      // Create expense
      const expense = await tx.expense.create({
        data: {
          busId,
          category,
          amount: parseFloat(amount),
          date: new Date(date),
          description,
          odometerReading: odometerReading ? parseInt(odometerReading) : null,
          receiptImageUrl,
          pricePerLitre: pricePerLitre ? parseFloat(pricePerLitre) : null,
          litresFilled: litresFilled ? parseFloat(litresFilled) : null,
        },
        include: {
          bus: {
            select: {
              registrationNumber: true,
            },
          },
        },
      })

      // If fuel expense, also create fuel dispense record
      if (category === 'Fuel' && litresFilled) {
        await tx.fuelDispense.create({
          data: {
            busId,
            date: new Date(date),
            quantity: parseFloat(litresFilled),
            odometerReading: odometerReading ? parseInt(odometerReading) : null,
            notes: description || null,
          },
        })
      }

      return expense
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (busId) {
      where.busId = busId
    }

    if (category && Object.values(ExpenseCategory).includes(category as ExpenseCategory)) {
      where.category = category
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const expenses = await prisma.expense.findMany({
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
      take: 100, // Limit to recent 100 expenses
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}
