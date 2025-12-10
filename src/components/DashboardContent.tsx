'use client'

import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import AlertCard from './AlertCard'
import { Bus, Users, DollarSign, AlertTriangle, AlertCircle, Info, Calendar, ChevronDown } from 'lucide-react'
import { ExpiryAlert } from '@/lib/services/alerts'

interface FleetOverview {
  buses: {
    total: number
  }
  drivers: {
    total: number
    active: number
  }
  routes: {
    total: number
  }
  expenses: {
    thisMonth: number
  }
}

interface MonthOption {
  year: number
  month: number
}

interface MonthlyExpensesData {
  total: number
  selectedMonth: { year: number; month: number }
  availableMonths: MonthOption[]
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface AlertsData {
  alerts: ExpiryAlert[]
  criticalCount: number
  warningCount: number
  infoCount: number
}

export default function DashboardContent() {
  const [overview, setOverview] = useState<FleetOverview | null>(null)
  const [alerts, setAlerts] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpensesData | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [expensesInitialized, setExpensesInitialized] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, alertsRes] = await Promise.all([
          fetch('/api/fleet/overview'),
          fetch('/api/alerts?days=90'),
        ])

        const overviewData = await overviewRes.json()
        const alertsData = await alertsRes.json()

        setOverview(overviewData)
        setAlerts(alertsData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch monthly expenses data
  useEffect(() => {
    async function fetchMonthlyExpenses() {
      try {
        const now = new Date()
        const response = await fetch(
          `/api/fleet/expenses/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
        )
        const data = await response.json()
        setMonthlyExpenses(data)

        // Set initial selection to most recent month with data
        if (data.availableMonths && data.availableMonths.length > 0) {
          setSelectedYear(data.availableMonths[0].year)
          setSelectedMonth(data.availableMonths[0].month)
        } else {
          setSelectedYear(now.getFullYear())
          setSelectedMonth(now.getMonth() + 1)
        }
        setExpensesInitialized(true)
      } catch (error) {
        console.error('Error fetching monthly expenses:', error)
        setExpensesInitialized(true)
      }
    }

    if (!expensesInitialized) {
      fetchMonthlyExpenses()
    }
  }, [expensesInitialized])

  // Fetch expenses when month selection changes
  useEffect(() => {
    async function fetchSelectedMonthExpenses() {
      if (!expensesInitialized || !selectedYear || !selectedMonth) return

      try {
        const response = await fetch(
          `/api/fleet/expenses/monthly?year=${selectedYear}&month=${selectedMonth}`
        )
        const data = await response.json()
        setMonthlyExpenses(data)
      } catch (error) {
        console.error('Error fetching monthly expenses:', error)
      }
    }

    fetchSelectedMonthExpenses()
  }, [selectedYear, selectedMonth, expensesInitialized])

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = e.target.value.split('-').map(Number)
    setSelectedYear(year)
    setSelectedMonth(month)
  }

  const formatMonthLabel = (year: number, month: number) => {
    return `${MONTH_NAMES[month - 1]} ${year}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Group alerts by severity
  const criticalAlerts = alerts?.alerts.filter(a => a.severity === 'critical') || []
  const warningAlerts = alerts?.alerts.filter(a => a.severity === 'warning') || []
  const infoAlerts = alerts?.alerts.filter(a => a.severity === 'info') || []

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Expenses Card with Month Selector */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              </div>
              {monthlyExpenses?.availableMonths && monthlyExpenses.availableMonths.length > 0 ? (
                <select
                  value={selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth}` : ''}
                  onChange={handleMonthChange}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-md bg-gray-50 text-gray-600 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 mb-2"
                >
                  {monthlyExpenses.availableMonths.map((option) => (
                    <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
                      {formatMonthLabel(option.year, option.month)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-gray-400 mb-2">No expense data</p>
              )}
              <p className="text-2xl font-bold text-gray-900">
                ₹{(monthlyExpenses?.total || 0).toLocaleString()}
              </p>
              <a href="/expenses" className="text-xs text-primary-600 hover:text-primary-700 mt-1 inline-block">
                View all expenses →
              </a>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <StatCard
          title="Buses on Road"
          value={overview?.buses.total || 0}
          icon={Bus}
          subtitle="Fleet vehicles"
          href="/fleet"
        />
        <StatCard
          title="Active Drivers/Conductors"
          value={overview?.drivers.active || 0}
          icon={Users}
          subtitle={`${overview?.drivers.total || 0} total drivers/conductors`}
          href="/drivers"
        />
        <StatCard
          title="Pending Alerts"
          value={(alerts?.criticalCount || 0) + (alerts?.warningCount || 0)}
          icon={AlertTriangle}
          subtitle={`${alerts?.criticalCount || 0} critical, ${alerts?.warningCount || 0} warnings`}
          href="/"
        />
      </div>

      {/* Alerts & Reminders Section */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Alerts & Reminders</h2>
          <p className="text-sm text-gray-500 mt-1">Track expiring licenses, insurance, and maintenance schedules</p>
        </div>

        {/* Alert Summary */}
        <div className="grid grid-cols-3 divide-x divide-gray-200 bg-gray-50">
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-gray-600">Critical</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{alerts?.criticalCount || 0}</p>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">Warnings</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{alerts?.warningCount || 0}</p>
          </div>
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Info</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{alerts?.infoCount || 0}</p>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-6">
          {alerts && alerts.alerts.length > 0 ? (
            <div className="space-y-6">
              {/* Critical Alerts */}
              {criticalAlerts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Critical - Action Required Immediately
                  </h3>
                  <div className="space-y-2">
                    {criticalAlerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Alerts */}
              {warningAlerts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Warnings - Action Required Soon
                  </h3>
                  <div className="space-y-2">
                    {warningAlerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
                </div>
              )}

              {/* Info Alerts */}
              {infoAlerts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Information - Upcoming Reminders
                  </h3>
                  <div className="space-y-2">
                    {infoAlerts.map((alert) => (
                      <AlertCard key={alert.id} alert={alert} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-2">No alerts or reminders</p>
              <p className="text-sm text-gray-400">All documents and licenses are up to date</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats and Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Buses</span>
              <span className="badge badge-success">{overview?.buses.total || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Drivers/Conductors</span>
              <span className="badge badge-info">{overview?.drivers.active || 0}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/expenses"
              className="block w-full btn-primary text-center"
            >
              Log New Expense
            </a>
            <a
              href="/fleet"
              className="block w-full btn-secondary text-center"
            >
              View Fleet
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
