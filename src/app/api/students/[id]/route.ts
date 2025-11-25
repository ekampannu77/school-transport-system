import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Permanently remove student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Permanently delete the student
    const student = await prisma.student.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Student deleted successfully', student })
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

    // Whitelist of allowed fields that can be updated
    const allowedFields = [
      'name',
      'class',
      'section',
      'village',
      'parentName',
      'parentContact',
      'emergencyContact',
      'monthlyFee',
      'feePaid',
      'feeWaiverPercent',
      'busId',
      'endDate',
      'isActive',
    ]

    // Filter body to only include allowed fields
    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }

    // Validate that we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
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
