'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface AddRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddRouteModal({ isOpen, onClose, onSuccess }: AddRouteModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    routeName: '',
    startPoint: '',
    endPoint: '',
    distance: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add route')
      }

      // Reset form
      setFormData({
        routeName: '',
        startPoint: '',
        endPoint: '',
        distance: '',
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
          <h2 className="text-xl font-semibold text-gray-900">Add New Route</h2>
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
              Route Name *
            </label>
            <input
              type="text"
              value={formData.routeName}
              onChange={(e) =>
                setFormData({ ...formData, routeName: e.target.value })
              }
              className="input-field"
              placeholder="e.g., Route A - North"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Point *
            </label>
            <input
              type="text"
              value={formData.startPoint}
              onChange={(e) =>
                setFormData({ ...formData, startPoint: e.target.value })
              }
              className="input-field"
              placeholder="e.g., School Main Gate"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Point *
            </label>
            <input
              type="text"
              value={formData.endPoint}
              onChange={(e) =>
                setFormData({ ...formData, endPoint: e.target.value })
              }
              className="input-field"
              placeholder="e.g., North District"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distance (km) *
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.distance}
              onChange={(e) =>
                setFormData({ ...formData, distance: e.target.value })
              }
              className="input-field"
              placeholder="e.g., 15.5"
              min="0"
              required
            />
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
              {loading ? 'Adding...' : 'Add Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
