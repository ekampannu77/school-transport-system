import { NextRequest, NextResponse } from 'next/server'
import { getAllCriticalAlerts } from '@/lib/services/alerts'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const alertsData = await getAllCriticalAlerts(days)

    return NextResponse.json(alertsData)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}
