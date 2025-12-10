import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Create date range for the selected month
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    // Get total expenses for the selected month
    const monthlyExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get available months that have expenses (for the dropdown)
    const availableMonths = await prisma.$queryRaw<Array<{ year: number; month: number }>>`
      SELECT
        EXTRACT(YEAR FROM date)::int as year,
        EXTRACT(MONTH FROM date)::int as month
      FROM expenses
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year DESC, month DESC
    `

    return NextResponse.json({
      total: monthlyExpenses._sum.amount || 0,
      selectedMonth: { year, month },
      availableMonths,
    })
  } catch (error) {
    console.error('Error fetching monthly expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly expenses' },
      { status: 500 }
    )
  }
}
