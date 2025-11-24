import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')
    const year = searchParams.get('year')

    if (!busId || !year) {
      return NextResponse.json(
        { error: 'Bus ID and year are required' },
        { status: 400 }
      )
    }

    // Get bus details
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      select: {
        registrationNumber: true,
      },
    })

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      )
    }

    // Define the year range
    const yearInt = parseInt(year)
    const startDate = new Date(yearInt, 0, 1) // January 1st of the year
    const endDate = new Date(yearInt, 11, 31, 23, 59, 59) // December 31st of the year

    // Fetch all students for this bus who were active during the year
    // This includes students who started before/during the year and either:
    // - are still active (endDate is null)
    // - or stopped during/after the year (endDate >= startDate)
    const students = await prisma.student.findMany({
      where: {
        busId: busId,
        startDate: {
          lte: endDate, // Started on or before the end of the year
        },
        OR: [
          { endDate: null }, // Still active
          { endDate: { gte: startDate } }, // Stopped during or after the year
        ],
      },
      orderBy: [
        { isActive: 'desc' }, // Active students first
        { class: 'asc' },
        { name: 'asc' },
      ],
    })

    // Calculate summary
    const totalFee = students.reduce((sum, student) => sum + (student.monthlyFee || 0), 0)
    const totalPaid = students.reduce((sum, student) => sum + (student.feePaid || 0), 0)
    const totalPending = totalFee - totalPaid

    return NextResponse.json({
      busRegistrationNumber: bus.registrationNumber,
      students: students.map(student => ({
        id: student.id,
        name: student.name,
        class: student.class,
        village: student.village,
        parentName: student.parentName,
        parentContact: student.parentContact,
        emergencyContact: student.emergencyContact,
        monthlyFee: student.monthlyFee || 0,
        feePaid: student.feePaid || 0,
        startDate: student.startDate,
        endDate: student.endDate,
        isActive: student.isActive,
      })),
      summary: {
        totalFee,
        totalPaid,
        totalPending,
      },
    })
  } catch (error) {
    console.error('Error fetching student export data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student data' },
      { status: 500 }
    )
  }
}
