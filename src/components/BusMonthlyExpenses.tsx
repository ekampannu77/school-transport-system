'use client'

import { useEffect, useState } from 'react'
import { Calendar, DollarSign, Fuel, Wrench, Shield, MoreHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'

interface Expense {
  id: string
  category: string
  amount: number
  date: string
  description: string | null
  odometerReading: number | null
  litresFilled: number | null
  pricePerLitre: number | null
}

interface MonthOption {
  year: number
  month: number
}

interface MonthlyExpensesData {
  expenses: Expense[]
  total: number
  selectedMonth: { year: number; month: number }
  availableMonths: MonthOption[]
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Fuel: Fuel,
  Maintenance: Wrench,
  Insurance: Shield,
  Other: MoreHorizontal,
  Salary: DollarSign,
}

const CATEGORY_COLORS: Record<string, string> = {
  Fuel: 'bg-blue-100 text-blue-700',
  Maintenance: 'bg-orange-100 text-orange-700',
  Insurance: 'bg-green-100 text-green-700',
  Other: 'bg-gray-100 text-gray-700',
  Salary: 'bg-purple-100 text-purple-700',
}

export default function BusMonthlyExpenses({ busId }: { busId: string }) {
  const [data, setData] = useState<MonthlyExpensesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Initial fetch to get available months
  useEffect(() => {
    if (!initialized) {
      fetchAvailableMonths()
    }
  }, [busId, initialized])

  // Fetch expenses when month selection changes
  useEffect(() => {
    if (initialized && selectedYear && selectedMonth) {
      fetchMonthlyExpenses()
    }
  }, [busId, selectedYear, selectedMonth, initialized])

  const fetchAvailableMonths = async () => {
    try {
      // Fetch with current month first to get available months list
      const now = new Date()
      const response = await fetch(
        `/api/fleet/buses/${busId}/expenses?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }
      const result = await response.json()
      setData(result)

      // Set initial selection to the most recent month with data
      if (result.availableMonths && result.availableMonths.length > 0) {
        setSelectedYear(result.availableMonths[0].year)
        setSelectedMonth(result.availableMonths[0].month)
      } else {
        // Fallback to current month if no data
        setSelectedYear(now.getFullYear())
        setSelectedMonth(now.getMonth() + 1)
      }
      setInitialized(true)
    } catch (error) {
      console.error('Error fetching available months:', error)
      setInitialized(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyExpenses = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/fleet/buses/${busId}/expenses?year=${selectedYear}&month=${selectedMonth}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching monthly expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = e.target.value.split('-').map(Number)
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  // Use available months from API data (months that have expense records)
  const monthOptions = data?.availableMonths || []

  const formatMonthLabel = (year: number, month: number) => {
    return `${MONTH_NAMES[month - 1]} ${year}`
  }

  if (loading && !data) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Monthly Expenses</h3>
          </div>
          {monthOptions.length > 0 ? (
            <select
              value={selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth}` : ''}
              onChange={handleMonthChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {monthOptions.map((option) => (
                <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
                  {formatMonthLabel(option.year, option.month)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-400">No expense data</span>
          )}
        </div>
      </div>

      {/* Total for selected month */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Total Expenses for {selectedMonth ? MONTH_NAMES[selectedMonth - 1] : ''} {selectedYear || ''}
            </p>
            <p className="text-2xl font-bold text-gray-900">₹{(data?.total || 0).toLocaleString()}</p>
          </div>
          <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : data?.expenses && data.expenses.length > 0 ? (
          data.expenses.map((expense) => {
            const Icon = CATEGORY_ICONS[expense.category] || MoreHorizontal
            const colorClass = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other

            return (
              <div key={expense.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                          {expense.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {expense.description || 'No description'}
                      </p>
                      {expense.category === 'Fuel' && expense.litresFilled && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {expense.litresFilled}L @ ₹{expense.pricePerLitre}/L
                          {expense.odometerReading && ` • Odo: ${expense.odometerReading.toLocaleString()} km`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{expense.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No expenses recorded for this month</p>
            <p className="text-sm text-gray-400 mt-1">
              Select a different month or add expenses from the Expenses page
            </p>
          </div>
        )}
      </div>

      {/* Summary by category if there are expenses */}
      {data?.expenses && data.expenses.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Summary by Category</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(
              data.expenses.reduce((acc, exp) => {
                acc[exp.category] = (acc[exp.category] || 0) + exp.amount
                return acc
              }, {} as Record<string, number>)
            ).map(([category, total]) => (
              <span
                key={category}
                className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[category] || CATEGORY_COLORS.Other}`}
              >
                {category}: ₹{total.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
