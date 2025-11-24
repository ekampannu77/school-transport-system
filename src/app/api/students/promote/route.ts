import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Promote all active students to next class
export async function POST(request: NextRequest) {
  try {
    // Get all active students
    const students = await prisma.student.findMany({
      where: { isActive: true },
    })

    // Update each student's class by incrementing by 1
    const updatePromises = students.map(async (student) => {
      // Parse current class as integer
      const currentClass = parseInt(student.class)

      // Skip if class is not a valid number or is already 12 (max)
      if (isNaN(currentClass) || currentClass >= 12) {
        return null
      }

      // Increment class by 1
      return prisma.student.update({
        where: { id: student.id },
        data: { class: (currentClass + 1).toString() },
      })
    })

    const results = await Promise.all(updatePromises)
    const promotedCount = results.filter(r => r !== null).length

    return NextResponse.json({
      message: `Successfully promoted ${promotedCount} students`,
      promotedCount,
    })
  } catch (error) {
    console.error('Error promoting students:', error)
    return NextResponse.json(
      { error: 'Failed to promote students' },
      { status: 500 }
    )
  }
}
