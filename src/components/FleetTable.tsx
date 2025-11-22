'use client'

import { useEffect, useState } from 'react'
import { Bus, User, AlertCircle } from 'lucide-react'

interface BusData {
  id: string
  registrationNumber: string
  chassisNumber: string
  seatingCapacity: number
  status: 'active' | 'maintenance' | 'retired'
  purchaseDate: string
  _count: {
    expenses: number
    reminders: number
  }
  busRoutes: Array<{
    driver: {
      name: string
    }
    route: {
      routeName: string
    }
  }>
}

export default function FleetTable() {
  const [buses, setBuses] = useState<BusData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBuses() {
      try {
        const response = await fetch('/api/fleet/buses')
        const data = await response.json()
        setBuses(data)
      } catch (error) {
        console.error('Error fetching buses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBuses()
  }, [])

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: 'badge-success',
      maintenance: 'badge-warning',
      retired: 'badge-info',
    }
    return statusConfig[status as keyof typeof statusConfig] || 'badge-info'
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alerts
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {buses.map((bus) => (
              <tr key={bus.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Bus className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {bus.registrationNumber}
                      </div>
                      <div className="text-sm text-gray-500">{bus.chassisNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`badge ${getStatusBadge(bus.status)}`}>
                    {bus.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {bus.seatingCapacity} seats
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {bus.busRoutes.length > 0
                    ? bus.busRoutes[0].route.routeName
                    : 'Not assigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {bus.busRoutes.length > 0 ? (
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {bus.busRoutes[0].driver.name}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No driver</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {bus._count.reminders > 0 ? (
                    <div className="flex items-center text-sm text-yellow-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {bus._count.reminders}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {buses.length === 0 && (
        <div className="text-center py-12">
          <Bus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No buses</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a bus to your fleet.</p>
        </div>
      )}
    </div>
  )
}
