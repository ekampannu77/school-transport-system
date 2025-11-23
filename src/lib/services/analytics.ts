import { prisma } from '@/lib/prisma'
import { ExpenseCategory } from '@prisma/client'

/**
 * Calculate Cost Per Mile (Cost Per Kilometer) for a specific bus
 * Formula: Total Fuel Cost / Total Distance Traveled (based on odometer readings)
 */
export async function calculateCostPerMile(busId: string): Promise<{
  costPerKm: number
  totalFuelCost: number
  totalDistanceTraveled: number
  calculationPeriod: { start: Date | null; end: Date | null }
}> {
  // Get all fuel expenses with odometer readings for the bus
  const fuelExpenses = await prisma.expense.findMany({
    where: {
      busId,
      category: ExpenseCategory.Fuel,
      odometerReading: { not: null },
    },
    orderBy: {
      date: 'asc',
    },
  })

  if (fuelExpenses.length < 2) {
    return {
      costPerKm: 0,
      totalFuelCost: 0,
      totalDistanceTraveled: 0,
      calculationPeriod: { start: null, end: null },
    }
  }

  // Calculate total fuel cost
  const totalFuelCost = fuelExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate total distance traveled (difference between first and last odometer reading)
  const firstReading = fuelExpenses[0].odometerReading!
  const lastReading = fuelExpenses[fuelExpenses.length - 1].odometerReading!
  const totalDistanceTraveled = lastReading - firstReading

  // Calculate cost per km
  const costPerKm = totalDistanceTraveled > 0 ? totalFuelCost / totalDistanceTraveled : 0

  return {
    costPerKm: parseFloat(costPerKm.toFixed(2)),
    totalFuelCost,
    totalDistanceTraveled,
    calculationPeriod: {
      start: fuelExpenses[0].date,
      end: fuelExpenses[fuelExpenses.length - 1].date,
    },
  }
}

/**
 * Get cost per mile for all active buses
 */
export async function getAllBusesCostPerMile() {
  const buses = await prisma.bus.findMany({
    select: { id: true, registrationNumber: true },
  })

  const results = await Promise.all(
    buses.map(async (bus) => {
      const metrics = await calculateCostPerMile(bus.id)
      return {
        busId: bus.id,
        registrationNumber: bus.registrationNumber,
        ...metrics,
      }
    })
  )

  return results
}

/**
 * Aggregate expenses by category for a specific period
 */
export async function aggregateExpensesByCategory(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number
  byCategory: Record<ExpenseCategory, number>
  count: number
}> {
  const where = {
    ...(startDate && endDate
      ? {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }
      : {}),
  }

  const expenses = await prisma.expense.findMany({ where })

  const byCategory = expenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    },
    {} as Record<ExpenseCategory, number>
  )

  // Ensure all categories are present
  const allCategories: Record<ExpenseCategory, number> = {
    Fuel: byCategory.Fuel || 0,
    Maintenance: byCategory.Maintenance || 0,
    Salary: byCategory.Salary || 0,
    Insurance: byCategory.Insurance || 0,
    Other: byCategory.Other || 0,
  }

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return {
    total,
    byCategory: allCategories,
    count: expenses.length,
  }
}

/**
 * Get monthly expense comparison
 */
export async function getMonthlyExpenseComparison(year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const currentMonth = await aggregateExpensesByCategory(startOfMonth, endOfMonth)

  // Get previous month for comparison
  const prevMonthStart = new Date(year, month - 2, 1)
  const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59)
  const previousMonth = await aggregateExpensesByCategory(prevMonthStart, prevMonthEnd)

  const percentageChange =
    previousMonth.total > 0
      ? ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100
      : 0

  return {
    current: currentMonth,
    previous: previousMonth,
    percentageChange: parseFloat(percentageChange.toFixed(2)),
  }
}
