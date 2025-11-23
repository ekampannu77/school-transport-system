import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Remove student (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Soft delete - mark as inactive instead of actually deleting
    const student = await prisma.student.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Student removed successfully', student })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}

// PATCH - Update student
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const student = await prisma.student.update({
      where: { id },
      data: body,
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}
