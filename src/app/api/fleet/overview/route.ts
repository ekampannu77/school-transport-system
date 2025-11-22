import { NextResponse } from 'next/server'
import { getFleetOverview } from '@/lib/services/fleet'

export async function GET() {
  try {
    const overview = await getFleetOverview()
    return NextResponse.json(overview)
  } catch (error) {
    console.error('Error fetching fleet overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fleet overview' },
      { status: 500 }
    )
  }
}
