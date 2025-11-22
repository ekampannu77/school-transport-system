import { NextRequest, NextResponse } from 'next/server'
import { getAllCriticalAlerts } from '@/lib/services/alerts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysThreshold = searchParams.get('days')

    const threshold = daysThreshold ? parseInt(daysThreshold) : 30

    const alerts = await getAllCriticalAlerts(threshold)

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}
