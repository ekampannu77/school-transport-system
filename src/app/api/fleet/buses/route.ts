import { NextResponse } from 'next/server'
import { getAllBuses } from '@/lib/services/fleet'

export async function GET() {
  try {
    const buses = await getAllBuses()
    return NextResponse.json(buses)
  } catch (error) {
    console.error('Error fetching buses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buses' },
      { status: 500 }
    )
  }
}
