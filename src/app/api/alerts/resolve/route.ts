import { NextRequest, NextResponse } from 'next/server'
import { resolveReminder } from '@/lib/services/alerts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reminderId } = body

    if (!reminderId) {
      return NextResponse.json(
        { error: 'Missing required field: reminderId' },
        { status: 400 }
      )
    }

    const reminder = await resolveReminder(reminderId)

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error resolving reminder:', error)
    return NextResponse.json(
      { error: 'Failed to resolve reminder' },
      { status: 500 }
    )
  }
}
