import { NextRequest, NextResponse } from 'next/server'
import { aggregateExpensesByCategory, getMonthlyExpenseComparison } from '@/lib/services/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // If year and month are provided, get monthly comparison
    if (year && month) {
      const comparison = await getMonthlyExpenseComparison(
        parseInt(year),
        parseInt(month)
      )
      return NextResponse.json(comparison)
    }

    // Otherwise, get aggregation for date range
    const aggregation = await aggregateExpensesByCategory(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    return NextResponse.json(aggregation)
  } catch (error) {
    console.error('Error aggregating expenses:', error)
    return NextResponse.json(
      { error: 'Failed to aggregate expenses' },
      { status: 500 }
    )
  }
}
