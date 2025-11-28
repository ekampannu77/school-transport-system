'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Bus {
  id: string
  registrationNumber: string
  chassisNumber: string
  seatingCapacity: number
  purchaseDate: string
  primaryDriver?: {
    id: string
    name: string
  } | null
}

interface Driver {
  id: string
  name: string
}

interface EditBusModalProps {
  isOpen: boolean
  bus: Bus | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditBusModal({ isOpen, bus, onClose, onSuccess }: EditBusModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [formData, setFormData] = useState({
    registrationNumber: '',
    chassisNumber: '',
    seatingCapacity: '',
    purchaseDate: '',
    primaryDriverId: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchDrivers()
    }
  }, [isOpen])

  useEffect(() => {
    if (bus) {
      setFormData({
        registrationNumber: bus.registrationNumber,
        chassisNumber: bus.chassisNumber,
        seatingCapacity: bus.seatingCapacity.toString(),
        purchaseDate: new Date(bus.purchaseDate).toISOString().split('T')[0],
        primaryDriverId: bus.primaryDriver?.id || '',
      })
    }
  }, [bus])

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()
      setDrivers(Array.isArray(data) ? data.filter((d: any) => d.role === 'driver') : [])
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bus) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/fleet/buses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bus.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update bus')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !bus) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Bus</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" id="editBusForm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number *
            </label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData({ ...formData, registrationNumber: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chassis Number *
            </label>
            <input
              type="text"
              value={formData.chassisNumber}
              onChange={(e) =>
                setFormData({ ...formData, chassisNumber: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seating Capacity *
            </label>
            <input
              type="number"
              value={formData.seatingCapacity}
              onChange={(e) =>
                setFormData({ ...formData, seatingCapacity: e.target.value })
              }
              className="input-field"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date *
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({ ...formData, purchaseDate: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Driver (Optional)
            </label>
            <select
              value={formData.primaryDriverId}
              onChange={(e) => setFormData({ ...formData, primaryDriverId: e.target.value })}
              className="input-field"
            >
              <option value="">No driver assigned</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>

          </form>
        </div>

        {/* Buttons - Fixed at bottom */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" form="editBusForm" className="flex-1 btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
