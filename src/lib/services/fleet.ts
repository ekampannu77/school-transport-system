import { prisma } from '@/lib/prisma'
import { calculateFuelEfficiency } from './analytics'

/**
 * Get fleet overview statistics
 */
export async function getFleetOverview() {
  try {
    const [totalBuses, totalDrivers, activeDrivers] =
      await Promise.all([
        prisma.bus.count(),
        prisma.driver.count(),
        prisma.driver.count({ where: { status: 'active' } }),
      ])

    // Get total routes
    const totalRoutes = await prisma.route.count()

    // Get current month expenses
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    const monthlyExpenses = await prisma.expense.aggregate({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    })

    return {
      buses: {
        total: totalBuses,
      },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
      },
      routes: {
        total: totalRoutes,
      },
      expenses: {
        thisMonth: monthlyExpenses._sum.amount || 0,
      },
    }
  } catch (error) {
    console.error('Error in fleet overview:', error)
    // Return default values if any query fails
    return {
      buses: { total: 0 },
      drivers: { total: 0, active: 0 },
      routes: { total: 0 },
      expenses: { thisMonth: 0 },
    }
  }
}

/**
 * Get detailed bus information with latest stats
 */
export async function getBusDetails(busId: string) {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: {
      primaryDriver: {
        select: {
          id: true,
          name: true,
          phone: true,
          licenseNumber: true,
        },
      },
      expenses: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      busRoutes: {
        include: {
          driver: true,
          route: true,
        },
        where: {
          endDate: null, // Current assignments
        },
      },
      reminders: {
        where: {
          status: 'Pending',
        },
        orderBy: {
          dueDate: 'asc',
        },
      },
    },
  })

  if (!bus) {
    return null
  }

  // Calculate total expenses
  const totalExpenses = await prisma.expense.aggregate({
    where: { busId },
    _sum: { amount: true },
  })

  return {
    ...bus,
    totalExpenses: totalExpenses._sum.amount || 0,
  }
}

/**
 * Get all buses with summary information including mileage
 */
export async function getAllBuses() {
  const buses = await prisma.bus.findMany({
    include: {
      primaryDriver: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          expenses: true,
          reminders: {
            where: {
              status: 'Pending',
            },
          },
          students: {
            where: {
              isActive: true,
            },
          },
        },
      },
      busRoutes: {
        where: {
          endDate: null,
        },
        include: {
          driver: {
            select: {
              name: true,
            },
          },
          conductor: {
            select: {
              name: true,
            },
          },
          route: {
            select: {
              routeName: true,
            },
          },
        },
      },
    },
    orderBy: {
      registrationNumber: 'asc',
    },
  })

  // Calculate mileage for each bus
  const busesWithMileage = await Promise.allSettled(
    buses.map(async (bus) => {
      const mileageData = await calculateFuelEfficiency(bus.id)
      return {
        ...bus,
        mileage: mileageData.kmPerLitre,
        mileageData: mileageData,
      }
    })
  )

  // Filter out failed promises and extract successful values
  return busesWithMileage
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value)
}
