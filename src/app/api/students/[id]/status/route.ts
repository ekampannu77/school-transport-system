import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get student status history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const history = await prisma.studentStatusHistory.findMany({
      where: { studentId: id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching status history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch status history' },
      { status: 500 }
    )
  }
}

// POST - Update student status (active/inactive)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { isActive, date, reason } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive field is required and must be a boolean' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'date field is required' },
        { status: 400 }
      )
    }

    const statusDate = new Date(date)

    // Get current student status
    const student = await prisma.student.findUnique({
      where: { id },
      select: { isActive: true, name: true },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // If status is not changing, just return
    if (student.isActive === isActive) {
      return NextResponse.json({ message: 'Status unchanged', student })
    }

    // Use a transaction to update student and create history
    const result = await prisma.$transaction(async (tx) => {
      if (isActive) {
        // Reactivating student - close any open inactive period
        await tx.studentStatusHistory.updateMany({
          where: {
            studentId: id,
            status: 'inactive',
            endDate: null,
          },
          data: {
            endDate: statusDate,
          },
        })

        // Create an active status record
        await tx.studentStatusHistory.create({
          data: {
            studentId: id,
            status: 'active',
            startDate: statusDate,
          },
        })
      } else {
        // Marking inactive - close any open active period
        await tx.studentStatusHistory.updateMany({
          where: {
            studentId: id,
            status: 'active',
            endDate: null,
          },
          data: {
            endDate: statusDate,
          },
        })

        // Create an inactive status record
        await tx.studentStatusHistory.create({
          data: {
            studentId: id,
            status: 'inactive',
            startDate: statusDate,
            reason: reason || null,
          },
        })
      }

      // Update the student's isActive status
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          isActive,
          endDate: isActive ? null : statusDate,
        },
        include: {
          bus: {
            select: {
              registrationNumber: true,
            },
          },
          statusHistory: {
            orderBy: { startDate: 'desc' },
          },
        },
      })

      return updatedStudent
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating student status:', error)
    return NextResponse.json(
      { error: 'Failed to update student status' },
      { status: 500 }
    )
  }
}
