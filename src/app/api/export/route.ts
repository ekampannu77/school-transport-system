import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateFuelEfficiencyForPeriod } from '@/lib/services/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startMonth = searchParams.get('startMonth')
    const startYear = searchParams.get('startYear')
    const endMonth = searchParams.get('endMonth')
    const endYear = searchParams.get('endYear')

    // Support both old API (single month) and new API (date range)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    let startDate: Date
    let endDate: Date

    if (month && year) {
      // Old API - single month
      const monthInt = parseInt(month)
      const yearInt = parseInt(year)
      startDate = new Date(yearInt, monthInt - 1, 1)
      endDate = new Date(yearInt, monthInt, 0, 23, 59, 59)
    } else if (startMonth && startYear && endMonth && endYear) {
      // New API - date range
      const startMonthInt = parseInt(startMonth)
      const startYearInt = parseInt(startYear)
      const endMonthInt = parseInt(endMonth)
      const endYearInt = parseInt(endYear)

      startDate = new Date(startYearInt, startMonthInt - 1, 1)
      endDate = new Date(endYearInt, endMonthInt, 0, 23, 59, 59)
    } else {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    // Fetch all buses with their details
    const buses = await prisma.bus.findMany({
      include: {
        primaryDriver: {
          select: {
            name: true,
          },
        },
        busRoutes: {
          where: {
            endDate: null,
          },
          include: {
            route: {
              select: {
                routeName: true,
              },
            },
            conductor: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        registrationNumber: 'asc',
      },
    })

    // Calculate mileage for each bus for the selected period
    const busesWithMileage = await Promise.all(
      buses.map(async (bus) => {
        const mileageData = await calculateFuelEfficiencyForPeriod(bus.id, startDate, endDate)
        return {
          ...bus,
          mileage: mileageData.kmPerLitre,
          mileageData: mileageData,
        }
      })
    )

    // Fetch expenses for the selected month
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Fetch all routes with assignments
    const routes = await prisma.route.findMany({
      include: {
        busRoutes: {
          where: {
            endDate: null,
          },
          include: {
            bus: {
              select: {
                registrationNumber: true,
                primaryDriver: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        routeName: 'asc',
      },
    })

    // Fetch all drivers
    const drivers = await prisma.driver.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    // Fetch pending alerts/reminders
    const alerts = await prisma.reminder.findMany({
      where: {
        status: 'Pending',
      },
      include: {
        bus: {
          select: {
            registrationNumber: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    // Calculate summary statistics
    const summary = {
      totalBuses: busesWithMileage.length,
      totalDrivers: drivers.filter(d => d.role === 'driver').length,
      totalConductors: drivers.filter(d => d.role === 'conductor').length,
      totalRoutes: routes.length,
      activeBuses: busesWithMileage.filter(b => b.busRoutes.length > 0).length,
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      pendingAlerts: alerts.length,
    }

    return NextResponse.json({
      summary,
      buses: busesWithMileage,
      expenses,
      routes,
      drivers,
      alerts,
    })
  } catch (error) {
    console.error('Error fetching export data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export data' },
      { status: 500 }
    )
  }
}
