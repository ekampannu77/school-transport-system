'use client'

import { useEffect, useState } from 'react'
import AlertCard from './AlertCard'
import { ExpiryAlert } from '@/lib/services/alerts'

interface AlertsData {
  alerts: ExpiryAlert[]
  criticalCount: number
  warningCount: number
  infoCount: number
}

export default function AlertsList() {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await fetch('/api/alerts?days=60')
        const data = await response.json()
        setAlertsData(data)
      } catch (error) {
        console.error('Error fetching alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!alertsData || alertsData.alerts.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">No upcoming alerts</p>
      </div>
    )
  }

  // Group alerts by severity
  const criticalAlerts = alertsData.alerts.filter((a) => a.severity === 'critical')
  const warningAlerts = alertsData.alerts.filter((a) => a.severity === 'warning')
  const infoAlerts = alertsData.alerts.filter((a) => a.severity === 'info')

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4 border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600">Critical</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {alertsData.criticalCount}
          </div>
        </div>
        <div className="card p-4 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600">Warnings</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">
            {alertsData.warningCount}
          </div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Info</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">
            {alertsData.infoCount}
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">Critical Alerts</h2>
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-4">Warnings</h2>
          <div className="space-y-3">
            {warningAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Info Alerts */}
      {infoAlerts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Information</h2>
          <div className="space-y-3">
            {infoAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
