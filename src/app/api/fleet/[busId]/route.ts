import { NextResponse } from 'next/server'
import { getBusDetails } from '@/lib/services/fleet'

export async function GET(
  request: Request,
  { params }: { params: { busId: string } }
) {
  try {
    const bus = await getBusDetails(params.busId)

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(bus)
  } catch (error) {
    console.error('Error fetching bus details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bus details' },
      { status: 500 }
    )
  }
}
