import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Create date range for the selected month (1st to last day)
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    // Get all expenses for this bus in the selected month
    const expenses = await prisma.expense.findMany({
      where: {
        busId: params.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { date: 'desc' },
    })

    // Calculate total for the month
    const totalAggregate = await prisma.expense.aggregate({
      where: {
        busId: params.id,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: { amount: true },
    })

    // Get available months that have expenses for this bus (for the dropdown)
    const availableMonths = await prisma.$queryRaw<Array<{ year: number; month: number }>>`
      SELECT
        EXTRACT(YEAR FROM date)::int as year,
        EXTRACT(MONTH FROM date)::int as month
      FROM expenses
      WHERE bus_id = ${params.id}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year DESC, month DESC
    `

    return NextResponse.json({
      expenses,
      total: totalAggregate._sum.amount || 0,
      selectedMonth: { year, month },
      availableMonths,
    })
  } catch (error) {
    console.error('Error fetching bus monthly expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly expenses' },
      { status: 500 }
    )
  }
}
