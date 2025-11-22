'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AddBusModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddBusModal({ isOpen, onClose, onSuccess }: AddBusModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    registrationNumber: '',
    chassisNumber: '',
    seatingCapacity: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'active',
  })

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
        status: 'active',
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
      <div className="card max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Bus</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input-field"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
