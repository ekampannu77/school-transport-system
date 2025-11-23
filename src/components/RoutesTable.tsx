'use client'

import { useEffect, useState } from 'react'
import { MapPin, Plus, Edit, Trash2, Navigation, Bus, User, Link2 } from 'lucide-react'
import AddRouteModal from './AddRouteModal'
import EditRouteModal from './EditRouteModal'
import AssignBusToRouteModal from './AssignBusToRouteModal'

interface RouteData {
  id: string
  routeName: string
  startPoint: string
  endPoint: string
  distance: number
  busRoutes: Array<{
    bus: {
      registrationNumber: string
      primaryDriver: {
        name: string
      } | null
    }
  }>
  _count: {
    busRoutes: number
  }
}

export default function RoutesTable() {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAssignBusModalOpen, setIsAssignBusModalOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes')
      const data = await response.json()
      setRoutes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching routes:', error)
      setRoutes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoutes()
  }, [])

  const handleRouteAdded = () => {
    fetchRoutes()
  }

  const handleEdit = (route: RouteData) => {
    setSelectedRoute(route)
    setIsEditModalOpen(true)
  }

  const handleAssignBus = (route: RouteData) => {
    setSelectedRoute(route)
    setIsAssignBusModalOpen(true)
  }

  const handleDelete = async (routeId: string) => {
    try {
      const response = await fetch(`/api/routes?id=${routeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete route')
      }

      fetchRoutes()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('Failed to delete route. Please try again.')
    }
  }

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

  return (
    <div>
      {/* Add New Route Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New Route
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {route.routeName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Navigation className="h-3 w-3 mr-1" />
                          {route.distance} km
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.startPoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.endPoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {route.distance} km
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {route.busRoutes.length > 0 ? (
                      <div className="text-sm">
                        <div className="flex items-center text-gray-900 mb-1">
                          <Bus className="h-4 w-4 mr-2 text-gray-400" />
                          {route.busRoutes[0].bus.registrationNumber}
                        </div>
                        {route.busRoutes[0].bus.primaryDriver && (
                          <div className="flex items-center text-gray-500 text-xs">
                            <User className="h-3 w-3 mr-2 text-gray-400" />
                            {route.busRoutes[0].bus.primaryDriver.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAssignBus(route)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Assign bus to route"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(route)}
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                        title="Edit route"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(route.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete route"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {routes.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No routes</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a route.</p>
          </div>
        )}
      </div>

      {/* Add Route Modal */}
      <AddRouteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRouteAdded}
      />

      {/* Edit Route Modal */}
      <EditRouteModal
        isOpen={isEditModalOpen}
        route={selectedRoute}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedRoute(null)
        }}
        onSuccess={handleRouteAdded}
      />

      {/* Assign Bus Modal */}
      <AssignBusToRouteModal
        isOpen={isAssignBusModalOpen}
        route={selectedRoute}
        onClose={() => {
          setIsAssignBusModalOpen(false)
          setSelectedRoute(null)
        }}
        onSuccess={handleRouteAdded}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Route</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this route? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
