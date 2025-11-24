import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
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
    const {
      name,
      class: studentClass,
      village,
      monthlyFee,
      parentName,
      parentContact,
      emergencyContact,
      startDate,
      busId,
    } = body

    // Validate required fields
    if (!name || !studentClass || !village || !parentName || !parentContact || !busId || monthlyFee === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    // Check if bus has capacity (only count active students)
    if (bus.students.length >= bus.seatingCapacity) {
      return NextResponse.json(
        { error: 'Bus is at full capacity' },
        { status: 400 }
      )
    }

    const student = await prisma.student.create({
      data: {
        name,
        class: studentClass,
        village,
        monthlyFee: parseFloat(monthlyFee),
        parentName,
        parentContact,
        emergencyContact,
        startDate: startDate ? new Date(startDate) : new Date(),
        busId,
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
