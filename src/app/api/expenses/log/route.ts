import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ExpenseCategory } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { busId, category, amount, date, description, odometerReading, receiptImageUrl } = body

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

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        busId,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        odometerReading: odometerReading ? parseInt(odometerReading) : null,
        receiptImageUrl,
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
    })

    return NextResponse.json(expense, { status: 201 })
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
