import { NextRequest, NextResponse } from 'next/server'
import { calculateCostPerMile, getAllBusesCostPerMile } from '@/lib/services/analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')

    if (busId) {
      // Get cost per mile for specific bus
      const metrics = await calculateCostPerMile(busId)
      return NextResponse.json(metrics)
    } else {
      // Get cost per mile for all buses
      const allMetrics = await getAllBusesCostPerMile()
      return NextResponse.json(allMetrics)
    }
  } catch (error) {
    console.error('Error calculating cost per mile:', error)
    return NextResponse.json(
      { error: 'Failed to calculate cost per mile' },
      { status: 500 }
    )
  }
}
