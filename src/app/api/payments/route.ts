import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Helper function to generate unique receipt number
async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear()

  // Get the latest payment to determine next sequential number
  const latestPayment = await prisma.payment.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { receiptNumber: true },
  })

  let nextNumber = 1
  if (latestPayment && latestPayment.receiptNumber) {
    // Extract number from format RCPT-2025-00001
    const match = latestPayment.receiptNumber.match(/RCPT-\d+-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1]) + 1
    }
  }

  // Format: RCPT-2025-00001
  return `RCPT-${year}-${String(nextNumber).padStart(5, '0')}`
}

// POST - Collect payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      amount,
      quarter,
      academicYear,
      paymentMethod,
      transactionId,
      checkNumber,
      bankName,
      collectedBy,
      remarks,
      paymentDate,
    } = body

    // Validate required fields
    if (!studentId || !amount || !quarter || !academicYear || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate quarter (must be 1, 2, 3, or 4)
    if (![1, 2, 3, 4].includes(quarter)) {
      return NextResponse.json(
        { error: 'Quarter must be 1, 2, 3, or 4' },
        { status: 400 }
      )
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check for duplicate payment (same student, quarter, academic year)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId,
        quarter,
        academicYear,
      },
    })

    if (existingPayment) {
      return NextResponse.json(
        {
          error: `Payment already exists for Q${quarter} ${academicYear}`,
          existingPayment
        },
        { status: 400 }
      )
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber()

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        quarter,
        academicYear,
        paymentMethod,
        transactionId,
        checkNumber,
        bankName,
        collectedBy,
        remarks,
        receiptNumber,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      },
      include: {
        student: {
          select: {
            name: true,
            class: true,
            section: true,
          },
        },
      },
    })

    // Update student's feePaid
    const totalPaid = await prisma.payment.aggregate({
      where: { studentId },
      _sum: { amount: true },
    })

    await prisma.student.update({
      where: { id: studentId },
      data: { feePaid: totalPaid._sum.amount || 0 },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error collecting payment:', error)
    return NextResponse.json(
      { error: 'Failed to collect payment' },
      { status: 500 }
    )
  }
}

// GET all payments or filter by parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const quarter = searchParams.get('quarter')
    const academicYear = searchParams.get('academicYear')
    const busId = searchParams.get('busId')

    const where: any = {}

    if (studentId) where.studentId = studentId
    if (quarter) where.quarter = parseInt(quarter)
    if (academicYear) where.academicYear = academicYear
    if (busId) {
      where.student = {
        busId,
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            name: true,
            class: true,
            section: true,
            bus: {
              select: {
                registrationNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
