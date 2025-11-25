'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Plus, Edit, Trash2, Phone, MapPin, AlertCircle } from 'lucide-react'
import AddDriverModal from './AddDriverModal'
import EditDriverModal from './EditDriverModal'

interface DriverData {
  id: string
  name: string
  role: string
  licenseNumber: string | null
  phone: string
  address: string | null
  licenseExpiry: string | null
  aadharNumber: string | null
  status: 'active' | 'inactive'
  _count: {
    busRoutes: number
  }
}

export default function DriversTable() {
  const router = useRouter()
  const [drivers, setDrivers] = useState<DriverData[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()
      setDrivers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleDriverAdded = () => {
    fetchDrivers()
  }

  const handleEdit = (driver: DriverData) => {
    setSelectedDriver(driver)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (driverId: string) => {
    try {
      const response = await fetch(`/api/drivers?id=${driverId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete driver')
      }

      fetchDrivers()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting driver:', error)
      alert('Failed to delete driver. Please try again.')
    }
  }

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: 'badge-success',
      inactive: 'badge-info',
    }
    return statusConfig[status as keyof typeof statusConfig] || 'badge-info'
  }

  return (
    <div>
      {/* Add New Driver Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New Driver
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name & Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr
                  key={driver.id}
                  onClick={() => router.push(`/drivers/${driver.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.name}
                        </div>
                        <div className="text-sm text-gray-500">{driver.licenseNumber || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${driver.role === 'driver' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {driver.role === 'driver' ? 'Driver' : 'Conductor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(driver.status)}`}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {driver.phone}
                      </div>
                      {driver.address && (
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                          <span className="text-xs text-gray-500">{driver.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {driver.licenseExpiry ? (
                      <div className="text-sm">
                        <div className={isLicenseExpiringSoon(driver.licenseExpiry) ? 'text-yellow-600 font-medium' : 'text-gray-900'}>
                          {new Date(driver.licenseExpiry).toLocaleDateString()}
                        </div>
                        {isLicenseExpiringSoon(driver.licenseExpiry) && (
                          <div className="flex items-center text-xs text-yellow-600 mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Expiring soon
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(driver)
                        }}
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                        title="Edit driver"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm(driver.id)
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete driver"
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

        {drivers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a driver.</p>
          </div>
        )}
      </div>

      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleDriverAdded}
      />

      {/* Edit Driver Modal */}
      <EditDriverModal
        isOpen={isEditModalOpen}
        driver={selectedDriver}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedDriver(null)
        }}
        onSuccess={handleDriverAdded}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Driver</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this driver? This action cannot be undone.
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
