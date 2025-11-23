'use client'

import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import AlertCard from './AlertCard'
import { Bus, Users, DollarSign, AlertTriangle } from 'lucide-react'
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

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, alertsRes] = await Promise.all([
          fetch('/api/fleet/overview'),
          fetch('/api/alerts?days=30'),
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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Expenses (This Month)"
          value={`₹${overview?.expenses.thisMonth.toLocaleString() || 0}`}
          icon={DollarSign}
          subtitle="All categories combined"
        />
        <StatCard
          title="Buses on Road"
          value={overview?.buses.total || 0}
          icon={Bus}
          subtitle="Fleet vehicles"
        />
        <StatCard
          title="Active Drivers/Conductors"
          value={overview?.drivers.active || 0}
          icon={Users}
          subtitle={`${overview?.drivers.total || 0} total drivers/conductors`}
        />
        <StatCard
          title="Critical Alerts"
          value={alerts?.criticalCount || 0}
          icon={AlertTriangle}
          subtitle={`${alerts?.warningCount || 0} warnings`}
          href="/alerts"
        />
      </div>

      {/* Alerts Section */}
      {alerts && alerts.alerts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Alerts</h2>
          <div className="space-y-3">
            {alerts.alerts.slice(0, 5).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
          {alerts.alerts.length > 5 && (
            <div className="mt-4 text-center">
              <a
                href="/alerts"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all {alerts.alerts.length} alerts →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
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
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Routes</span>
              <span className="badge badge-info">{overview?.routes.total || 0}</span>
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
