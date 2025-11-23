'use client'

import { useState, useEffect } from 'react'
import { X, Bus, User } from 'lucide-react'

interface AssignBusToRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  route: {
    id: string
    routeName: string
  } | null
}

interface BusOption {
  id: string
  registrationNumber: string
  primaryDriver: {
    name: string
  } | null
}

export default function AssignBusToRouteModal({ isOpen, onClose, onSuccess, route }: AssignBusToRouteModalProps) {
  const [buses, setBuses] = useState<BusOption[]>([])
  const [selectedBusId, setSelectedBusId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchBuses()
    }
  }, [isOpen])

  const fetchBuses = async () => {
    try {
      const response = await fetch('/api/fleet/buses')
      const data = await response.json()
      setBuses(data)
    } catch (error) {
      console.error('Error fetching buses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBusId || !route) {
      alert('Please select a bus')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/routes/assign-bus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: route.id,
          busId: selectedBusId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign bus')
      }

      onSuccess()
      onClose()
      setSelectedBusId('')
    } catch (error: any) {
      console.error('Error assigning bus:', error)
      alert(error.message || 'Failed to assign bus. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Assign Bus to Route</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route
            </label>
            <div className="text-base font-medium text-gray-900 p-3 bg-gray-50 rounded-lg">
              {route?.routeName}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bus
            </label>
            <select
              value={selectedBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Choose a bus</option>
              {buses.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.registrationNumber}
                  {bus.primaryDriver ? ` - ${bus.primaryDriver.name}` : ' - No driver assigned'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Assigning...' : 'Assign Bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
