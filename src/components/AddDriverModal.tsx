'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AddDriverModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddDriverModal({ isOpen, onClose, onSuccess }: AddDriverModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    role: 'driver',
    licenseNumber: '',
    phone: '',
    address: '',
    licenseExpiry: '',
    status: 'active',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add driver')
      }

      // Reset form
      setFormData({
        name: '',
        role: 'driver',
        licenseNumber: '',
        phone: '',
        address: '',
        licenseExpiry: '',
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
          <h2 className="text-xl font-semibold text-gray-900">Add New Driver</h2>
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
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field"
              placeholder="e.g., John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
            >
              <option value="driver">Driver</option>
              <option value="conductor">Conductor</option>
            </select>
          </div>

          {formData.role === 'driver' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseNumber: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., DL123456789"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Expiry *
                </label>
                <input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseExpiry: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="input-field"
              placeholder="e.g., +1234567890"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="input-field"
              placeholder="Enter address"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Expiry *
            </label>
            <input
              type="date"
              value={formData.licenseExpiry}
              onChange={(e) =>
                setFormData({ ...formData, licenseExpiry: e.target.value })
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
              <option value="inactive">Inactive</option>
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
              {loading ? 'Adding...' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
