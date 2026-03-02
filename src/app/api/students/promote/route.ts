import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Promote all active students to next class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // Require explicit confirmation to prevent accidental mass updates
    if (!body.confirm) {
      return NextResponse.json(
        { error: 'Confirmation required. Send { "confirm": true } to proceed.' },
        { status: 400 }
      )
    }

    // Get all active students
    const students = await prisma.student.findMany({
      where: { isActive: true },
    })

    // Determine which students are eligible and their new class
    const updates: { id: string; newClass: string }[] = []
    for (const student of students) {
      const currentClass = parseInt(student.class)
      if (isNaN(currentClass) || currentClass >= 12) continue
      updates.push({ id: student.id, newClass: (currentClass + 1).toString() })
    }

    // Run all updates inside a single transaction so partial failures are rolled back
    await prisma.$transaction(
      updates.map(({ id, newClass }) =>
        prisma.student.update({ where: { id }, data: { class: newClass } })
      )
    )

    return NextResponse.json({
      message: `Successfully promoted ${updates.length} students`,
      promotedCount: updates.length,
    })
  } catch (error) {
    console.error('Error promoting students:', error)
    return NextResponse.json(
      { error: 'Failed to promote students' },
      { status: 500 }
    )
  }
}
