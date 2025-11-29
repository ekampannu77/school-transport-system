import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createStudentSchema, validateRequest } from '@/lib/validations'
import { studentLogger } from '@/lib/logger'

// GET all students or filter by busId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')

    const where = busId ? { busId } : {}

    const students = await prisma.student.findMany({
      where,
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    studentLogger.debug('Fetched students', { count: students.length, busId })
    return NextResponse.json(students)
  } catch (error) {
    studentLogger.error('Error fetching students', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// POST - Add new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateRequest(createStudentSchema, body)
    if (!validation.success) {
      studentLogger.info('Student creation validation failed', { error: validation.error })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const {
      name,
      class: studentClass,
      section,
      village,
      monthlyFee,
      parentName,
      parentContact,
      emergencyContact,
      startDate,
      endDate,
      busId,
      feeWaiverPercent,
      isActive,
    } = validation.data

    // Check if bus exists and count only active students
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      select: {
        seatingCapacity: true,
        students: {
          where: { isActive: true },
          select: { id: true }
        }
      },
    })

    if (!bus) {
      studentLogger.info('Bus not found for student creation', { busId })
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    // Check if bus has capacity (only count active students)
    if (bus.students.length >= bus.seatingCapacity) {
      studentLogger.info('Bus at full capacity', { busId, capacity: bus.seatingCapacity })
      return NextResponse.json(
        { error: 'Bus is at full capacity' },
        { status: 400 }
      )
    }

    const student = await prisma.student.create({
      data: {
        name,
        class: studentClass,
        section: section || null,
        village,
        monthlyFee,
        parentName,
        parentContact,
        emergencyContact: emergencyContact || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        busId,
        feeWaiverPercent: feeWaiverPercent || 0,
        isActive: isActive ?? true,
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
    })

    studentLogger.info('Student created successfully', { studentId: student.id, name, busId })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    studentLogger.error('Error creating student', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
