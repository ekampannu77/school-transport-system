import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createStudentSchema, validateRequest } from '@/lib/validations'
import { studentLogger } from '@/lib/logger'
import { calculateStudentCapacity } from '@/lib/dateUtils'
import { withRateLimit, API_RATE_LIMIT } from '@/lib/rate-limit'

// Default pagination values
const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

// GET all students or filter by busId with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE)),
      MAX_PAGE_SIZE
    )
    const search = searchParams.get('search')
    const isActive = searchParams.get('isActive')

    // Build where clause
    const where: any = {}
    if (busId) where.busId = busId
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { village: { contains: search, mode: 'insensitive' } },
        { parentName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.student.count({ where })

    // Get paginated students
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    studentLogger.debug('Fetched students', { count: students.length, busId, page, pageSize })

    return NextResponse.json({
      data: students,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNext: page * pageSize < totalCount,
        hasPrev: page > 1,
      },
    })
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
  // Rate limiting
  const rateLimitResponse = withRateLimit(request, API_RATE_LIMIT)
  if (rateLimitResponse) return rateLimitResponse

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
    // 1.5 students are allowed per seat
    const maxStudentCapacity = calculateStudentCapacity(bus.seatingCapacity)
    if (bus.students.length >= maxStudentCapacity) {
      studentLogger.info('Bus at full capacity', { busId, seatingCapacity: bus.seatingCapacity, maxStudentCapacity })
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
