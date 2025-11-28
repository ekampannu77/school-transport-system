'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface AddBusModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Driver {
  id: string
  name: string
}

export default function AddBusModal({ isOpen, onClose, onSuccess }: AddBusModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [formData, setFormData] = useState({
    registrationNumber: '',
    chassisNumber: '',
    seatingCapacity: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    primaryDriverId: '',
    fitnessExpiry: '',
    ownershipType: 'SCHOOL_OWNED',
    privateOwnerName: '',
    privateOwnerContact: '',
    privateOwnerBank: '',
    schoolCommission: '0',
  })

  useEffect(() => {
    if (isOpen) {
      fetchDrivers()
    }
  }, [isOpen])

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
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/fleet/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add bus')
      }

      // Reset form
      setFormData({
        registrationNumber: '',
        chassisNumber: '',
        seatingCapacity: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        primaryDriverId: '',
        fitnessExpiry: '',
        ownershipType: 'SCHOOL_OWNED',
        privateOwnerName: '',
        privateOwnerContact: '',
        privateOwnerBank: '',
        schoolCommission: '0',
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Bus</h2>
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
          <form onSubmit={handleSubmit} className="space-y-4" id="addBusForm">
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
              placeholder="e.g., DL-01-AB-1234"
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
              placeholder="e.g., CH123456789"
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
              placeholder="e.g., 40"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Fitness Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={formData.fitnessExpiry}
              onChange={(e) =>
                setFormData({ ...formData, fitnessExpiry: e.target.value })
              }
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              An alert will be created 30 days before expiry
            </p>
          </div>

          {/* Ownership Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Bus Ownership</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ownership Type *
              </label>
              <select
                value={formData.ownershipType}
                onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                className="input-field"
                required
              >
                <option value="SCHOOL_OWNED">School Owned</option>
                <option value="PRIVATE_OWNED">Private Owned</option>
              </select>
            </div>

            {/* Private Owner Fields - Only show if private owned */}
            {formData.ownershipType === 'PRIVATE_OWNED' && (
              <div className="mt-4 space-y-4 bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-blue-800 mb-2">Private Bus Owner Information</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    value={formData.privateOwnerName}
                    onChange={(e) =>
                      setFormData({ ...formData, privateOwnerName: e.target.value })
                    }
                    className="input-field"
                    placeholder="Enter owner's name"
                    required={formData.ownershipType === 'PRIVATE_OWNED'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Contact (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.privateOwnerContact}
                    onChange={(e) =>
                      setFormData({ ...formData, privateOwnerContact: e.target.value })
                    }
                    className="input-field"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Details (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.privateOwnerBank}
                    onChange={(e) =>
                      setFormData({ ...formData, privateOwnerBank: e.target.value })
                    }
                    className="input-field"
                    placeholder="Account number / IFSC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Commission % (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.schoolCommission}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolCommission: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., 10"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of revenue the school keeps
                  </p>
                </div>
              </div>
            )}
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
          <button type="submit" form="addBusForm" className="flex-1 btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Bus'}
          </button>
        </div>
      </div>
    </div>
  )
}
