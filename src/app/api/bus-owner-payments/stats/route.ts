import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busId = searchParams.get('busId')

    // Get all private buses
    const privateBuses = await prisma.bus.findMany({
      where: busId
        ? { id: busId, ownershipType: 'PRIVATE_OWNED' }
        : { ownershipType: 'PRIVATE_OWNED' },
      select: {
        id: true,
        registrationNumber: true,
        privateOwnerName: true,
        privateOwnerContact: true,
        privateOwnerBank: true,
        schoolCommission: true,
        advancePayment: true,
        students: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            monthlyFee: true,
            payments: {
              select: {
                amount: true,
                paymentDate: true,
                quarter: true,
                academicYear: true,
              },
            },
          },
        },
        ownerPayments: {
          select: {
            amount: true,
            paymentDate: true,
            status: true,
            periodStartDate: true,
            periodEndDate: true,
          },
        },
      },
    })

    // Calculate statistics for each bus
    const stats = privateBuses.map((bus) => {
      // Total revenue collected from students
      const totalRevenue = bus.students.reduce((sum, student) => {
        const studentPayments = student.payments.reduce((pSum, payment) => pSum + payment.amount, 0)
        return sum + studentPayments
      }, 0)

      // Total paid to owner
      const totalPaid = bus.ownerPayments
        .filter((p) => p.status === 'PAID')
        .reduce((sum, payment) => sum + payment.amount, 0)

      // Total pending payments
      const totalPending = bus.ownerPayments
        .filter((p) => p.status === 'PENDING')
        .reduce((sum, payment) => sum + payment.amount, 0)

      // Calculate commission
      const commission = (totalRevenue * (bus.schoolCommission || 0)) / 100
      const netRevenue = totalRevenue - commission

      // Advance payment given to owner
      const advancePayment = bus.advancePayment || 0

      // Amount owing = net revenue - total paid - total pending - advance payment
      // If negative, owner owes school (advance not yet covered by fees)
      const amountOwing = netRevenue - totalPaid - totalPending - advancePayment

      // Monthly expected revenue
      const monthlyExpected = bus.students.reduce((sum, student) => sum + student.monthlyFee, 0)

      return {
        busId: bus.id,
        registrationNumber: bus.registrationNumber,
        privateOwnerName: bus.privateOwnerName,
        privateOwnerContact: bus.privateOwnerContact,
        privateOwnerBank: bus.privateOwnerBank,
        schoolCommission: bus.schoolCommission || 0,
        advancePayment,
        studentCount: bus.students.length,
        totalRevenue,
        commission,
        netRevenue,
        totalPaid,
        totalPending,
        amountOwing,
        monthlyExpected,
        lastPaymentDate: bus.ownerPayments.length > 0
          ? bus.ownerPayments.sort((a, b) =>
              new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
            )[0].paymentDate
          : null,
      }
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching owner payment stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch owner payment stats' },
      { status: 500 }
    )
  }
}
