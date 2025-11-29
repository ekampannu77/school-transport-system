'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bus, User, Plus, Edit, Trash2, IndianRupee } from 'lucide-react'
import AddBusModal from './AddBusModal'
import EditBusModal from './EditBusModal'
import { ConfirmModal } from './Modal'
import { useToast } from './Toast'

interface BusData {
  id: string
  registrationNumber: string
  chassisNumber: string
  seatingCapacity: number
  purchaseDate: string
  mileage: number
  fitnessExpiry?: string | null
  registrationExpiry?: string | null
  insuranceExpiry?: string | null
  ownershipType?: 'SCHOOL_OWNED' | 'PRIVATE_OWNED'
  privateOwnerName?: string | null
  privateOwnerContact?: string | null
  privateOwnerBank?: string | null
  schoolCommission?: number | null
  totalExpensesThisYear: number
  primaryDriver: {
    id: string
    name: string
  } | null
  _count: {
    expenses: number
    reminders: number
    students: number
  }
  busRoutes: Array<{
    driver: {
      name: string
    }
    conductor: {
      id: string
      name: string
    } | null
    route: {
      id: string
      routeName: string
      startPoint: string
      endPoint: string
      totalDistanceKm?: number
      waypoints?: string | null
    }
  }>
}

export default function FleetTable() {
  const router = useRouter()
  const [buses, setBuses] = useState<BusData[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  const fetchBuses = async () => {
    try {
      const response = await fetch('/api/fleet/buses')
      const data = await response.json()
      setBuses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching buses:', error)
      setBuses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuses()
  }, [])

  const handleBusAdded = () => {
    fetchBuses()
  }

  const handleEdit = (bus: BusData) => {
    setSelectedBus(bus)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (busId: string) => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/fleet/buses?id=${busId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete bus')
      }

      toast.success('Bus deleted successfully')
      fetchBuses()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting bus:', error)
      toast.error('Failed to delete bus. Please try again.')
    } finally {
      setDeleting(false)
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
      {/* Add New Bus Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New Bus
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus Details
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seats
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mileage
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expenses (Year)
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {buses.map((bus) => (
              <tr
                key={bus.id}
                onClick={() => router.push(`/fleet/${bus.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-9 w-9 bg-primary-100 rounded-full flex items-center justify-center">
                      <Bus className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {bus.registrationNumber}
                      </div>
                      <div className="text-xs text-gray-500">{bus.chassisNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {bus.ownershipType === 'PRIVATE_OWNED' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      School
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {bus.primaryDriver ? (
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      {bus.primaryDriver.name}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  {bus.busRoutes && bus.busRoutes.length > 0 ? (
                    bus.busRoutes.length === 1 ? (
                      bus.busRoutes[0].route.routeName
                    ) : (
                      <span className="text-gray-700">{bus.busRoutes.length} routes</span>
                    )
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  {bus.seatingCapacity}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  {bus.mileage > 0 ? (
                    <span className="font-medium text-gray-900">{bus.mileage} km/L</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                  {bus._count.students > 0 ? (
                    <span className="font-medium">{bus._count.students}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-right">
                  {bus.totalExpensesThisYear > 0 ? (
                    <div className="flex items-center justify-end text-sm text-gray-900">
                      <IndianRupee className="h-3 w-3 mr-0.5 text-gray-500" />
                      <span className="font-medium">{bus.totalExpensesThisYear.toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(bus)
                      }}
                      className="text-primary-600 hover:text-primary-800 transition-colors"
                      title="Edit bus"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(bus.id)
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete bus"
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

        {buses.length === 0 && (
          <div className="text-center py-12">
            <Bus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No buses</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a bus to your fleet.</p>
          </div>
        )}
      </div>

      {/* Add Bus Modal */}
      <AddBusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBusAdded}
      />

      {/* Edit Bus Modal */}
      <EditBusModal
        isOpen={isEditModalOpen}
        bus={selectedBus}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBus(null)
        }}
        onSuccess={handleBusAdded}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Bus"
        message="Are you sure you want to delete this bus? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  )
}
