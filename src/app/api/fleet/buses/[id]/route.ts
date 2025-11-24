import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateFuelEfficiency } from '@/lib/services/analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: params.id },
      include: {
        primaryDriver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
        _count: {
          select: {
            expenses: true,
            reminders: {
              where: {
                status: 'Pending',
              },
            },
            documents: true,
            students: {
              where: {
                isActive: true,
              },
            },
          },
        },
        busRoutes: {
          where: {
            endDate: null,
          },
          include: {
            driver: {
              select: {
                name: true,
              },
            },
            conductor: {
              select: {
                name: true,
              },
            },
            route: {
              select: {
                routeName: true,
              },
            },
          },
        },
      },
    })

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 })
    }

    // Get total expenses amount
    const expensesAggregate = await prisma.expense.aggregate({
      where: { busId: params.id },
      _sum: { amount: true },
    })

    // Get expense breakdown by category
    const expenses = await prisma.expense.findMany({
      where: { busId: params.id },
      orderBy: { date: 'desc' },
      take: 10,
    })

    // Calculate expense by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: { busId: params.id },
      _sum: { amount: true },
    })

    // Get pending reminders
    const reminders = await prisma.reminder.findMany({
      where: {
        busId: params.id,
        status: 'Pending',
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    // Calculate mileage
    const mileageData = await calculateFuelEfficiency(params.id)

    return NextResponse.json({
      ...bus,
      totalExpenses: expensesAggregate._sum.amount || 0,
      recentExpenses: expenses,
      expensesByCategory: expensesByCategory.reduce((acc, item) => {
        acc[item.category] = item._sum.amount || 0
        return acc
      }, {} as Record<string, number>),
      reminders,
      mileage: mileageData.kmPerLitre,
      mileageData,
    })
  } catch (error) {
    console.error('Error fetching bus details:', error)
    return NextResponse.json({ error: 'Failed to fetch bus details' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { insuranceExpiry, insuranceReminder } = body

    const bus = await prisma.bus.update({
      where: { id: params.id },
      data: {
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
        insuranceReminder: insuranceReminder ? new Date(insuranceReminder) : null,
      },
    })

    return NextResponse.json(bus)
  } catch (error) {
    console.error('Error updating bus:', error)
    return NextResponse.json({ error: 'Failed to update bus' }, { status: 500 })
  }
}
