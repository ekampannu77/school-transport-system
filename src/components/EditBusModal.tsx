'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'
import type { Waypoint } from './RouteMapPicker'

// Dynamic import to avoid SSR issues with Google Maps
const RouteMapPicker = dynamic(() => import('./RouteMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-lg p-4 h-[300px] flex items-center justify-center">
      <p className="text-gray-500 text-sm">Loading map...</p>
    </div>
  ),
})

interface Bus {
  id: string
  registrationNumber: string
  chassisNumber: string
  seatingCapacity: number
  purchaseDate: string
  fitnessExpiry?: string | null
  registrationExpiry?: string | null
  insuranceExpiry?: string | null
  ownershipType?: 'SCHOOL_OWNED' | 'PRIVATE_OWNED'
  privateOwnerName?: string | null
  privateOwnerContact?: string | null
  privateOwnerBank?: string | null
  schoolCommission?: number | null
  advancePayment?: number | null
  primaryDriver?: {
    id: string
    name: string
  } | null
  busRoutes?: Array<{
    route: {
      id: string
      routeName: string
      startPoint: string
      endPoint: string
      totalDistanceKm?: number
      waypoints?: string | null
    }
    conductor?: {
      id: string
      name: string
    } | null
  }>
}

interface StaffMember {
  id: string
  name: string
  role: string
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
  const [drivers, setDrivers] = useState<StaffMember[]>([])
  const [conductors, setConductors] = useState<StaffMember[]>([])
  const [routeWaypoints, setRouteWaypoints] = useState<Waypoint[]>([])
  const [formData, setFormData] = useState({
    registrationNumber: '',
    chassisNumber: '',
    seatingCapacity: '',
    purchaseDate: '',
    primaryDriverId: '',
    conductorId: '',
    fitnessExpiry: '',
    registrationExpiry: '',
    insuranceExpiry: '',
    ownershipType: 'SCHOOL_OWNED' as 'SCHOOL_OWNED' | 'PRIVATE_OWNED',
    privateOwnerName: '',
    privateOwnerContact: '',
    privateOwnerBank: '',
    schoolCommission: '',
    advancePayment: '',
    routeName: '',
    startPoint: '',
    endPoint: '',
    waypoints: '',
    totalDistanceKm: '0',
  })

  // Handle waypoints change from map
  const handleWaypointsChange = (waypoints: Waypoint[], distance: number) => {
    setRouteWaypoints(waypoints)
    setFormData(prev => ({
      ...prev,
      waypoints: JSON.stringify(waypoints),
      totalDistanceKm: distance.toString(),
    }))
  }

  useEffect(() => {
    if (isOpen) {
      fetchStaff()
    }
  }, [isOpen])

  useEffect(() => {
    if (bus) {
      const currentRoute = bus.busRoutes?.[0]?.route
      const currentConductor = bus.busRoutes?.[0]?.conductor

      // Parse existing waypoints if available
      let existingWaypoints: Waypoint[] = []
      if (currentRoute?.waypoints) {
        try {
          existingWaypoints = JSON.parse(currentRoute.waypoints)
        } catch (e) {
          console.error('Error parsing waypoints:', e)
        }
      }
      setRouteWaypoints(existingWaypoints)

      setFormData({
        registrationNumber: bus.registrationNumber,
        chassisNumber: bus.chassisNumber,
        seatingCapacity: bus.seatingCapacity.toString(),
        purchaseDate: new Date(bus.purchaseDate).toISOString().split('T')[0],
        primaryDriverId: bus.primaryDriver?.id || '',
        conductorId: currentConductor?.id || '',
        fitnessExpiry: bus.fitnessExpiry ? new Date(bus.fitnessExpiry).toISOString().split('T')[0] : '',
        registrationExpiry: bus.registrationExpiry ? new Date(bus.registrationExpiry).toISOString().split('T')[0] : '',
        insuranceExpiry: bus.insuranceExpiry ? new Date(bus.insuranceExpiry).toISOString().split('T')[0] : '',
        ownershipType: bus.ownershipType || 'SCHOOL_OWNED',
        privateOwnerName: bus.privateOwnerName || '',
        privateOwnerContact: bus.privateOwnerContact || '',
        privateOwnerBank: bus.privateOwnerBank || '',
        schoolCommission: bus.schoolCommission?.toString() || '',
        advancePayment: bus.advancePayment?.toString() || '',
        routeName: currentRoute?.routeName || '',
        startPoint: currentRoute?.startPoint || '',
        endPoint: currentRoute?.endPoint || '',
        waypoints: currentRoute?.waypoints || '',
        totalDistanceKm: currentRoute?.totalDistanceKm?.toString() || '0',
      })
    }
  }, [bus])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()
      if (Array.isArray(data)) {
        setDrivers(data.filter((d: StaffMember) => d.role === 'driver'))
        setConductors(data.filter((d: StaffMember) => d.role === 'conductor'))
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
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
              Ownership Type *
            </label>
            <select
              value={formData.ownershipType}
              onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value as 'SCHOOL_OWNED' | 'PRIVATE_OWNED' })}
              className="input-field"
              required
            >
              <option value="SCHOOL_OWNED">School Owned</option>
              <option value="PRIVATE_OWNED">Private Owned</option>
            </select>
          </div>

          {/* Private Owner Fields - Only show when Private Owned is selected */}
          {formData.ownershipType === 'PRIVATE_OWNED' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-medium text-blue-900">Private Owner Information</h3>

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
                    required
                    placeholder="Enter owner's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Contact
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
                    Bank Account Details
                  </label>
                  <input
                    type="text"
                    value={formData.privateOwnerBank}
                    onChange={(e) =>
                      setFormData({ ...formData, privateOwnerBank: e.target.value })
                    }
                    className="input-field"
                    placeholder="Bank name and account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Commission (%)
                  </label>
                  <input
                    type="number"
                    value={formData.schoolCommission}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolCommission: e.target.value })
                    }
                    className="input-field"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Commission percentage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advance Payment (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) =>
                      setFormData({ ...formData, advancePayment: e.target.value })
                    }
                    className="input-field"
                    min="0"
                    step="1"
                    placeholder="Advance amount given to owner"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Advance amount given to bus owner
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Staff Assignment Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Staff Assignment</h3>

            <div className="grid grid-cols-2 gap-4">
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
                  Assign Conductor (Optional)
                </label>
                <select
                  value={formData.conductorId}
                  onChange={(e) => setFormData({ ...formData, conductorId: e.target.value })}
                  className="input-field"
                >
                  <option value="">No conductor assigned</option>
                  {conductors.map((conductor) => (
                    <option key={conductor.id} value={conductor.id}>
                      {conductor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Route Information Section with Map */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Route Information</h3>
            <p className="text-xs text-gray-500 mb-3">Click on the map to add/edit route stops</p>

            {/* Map Picker */}
            <RouteMapPicker
              waypoints={routeWaypoints}
              onChange={handleWaypointsChange}
            />

            {/* Route Name and Points */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Name
                </label>
                <input
                  type="text"
                  value={formData.routeName}
                  onChange={(e) =>
                    setFormData({ ...formData, routeName: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., 1 BB, Chanana Dham"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Point
                  </label>
                  <input
                    type="text"
                    value={formData.startPoint}
                    onChange={(e) =>
                      setFormData({ ...formData, startPoint: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., Village Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Point
                  </label>
                  <input
                    type="text"
                    value={formData.endPoint}
                    onChange={(e) =>
                      setFormData({ ...formData, endPoint: e.target.value })
                    }
                    className="input-field"
                    placeholder="e.g., School"
                  />
                </div>
              </div>

              {/* Distance display */}
              {parseFloat(formData.totalDistanceKm) > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Total Distance:</span> {formData.totalDistanceKm} km
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Document Expiry Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Document Expiry Dates</h3>
            <p className="text-xs text-gray-500 mb-3">Alerts will be created 30 days before expiry</p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fitness Expiry
                </label>
                <input
                  type="date"
                  value={formData.fitnessExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, fitnessExpiry: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Expiry
                </label>
                <input
                  type="date"
                  value={formData.registrationExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationExpiry: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Expiry
                </label>
                <input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, insuranceExpiry: e.target.value })
                  }
                  className="input-field"
                />
              </div>
            </div>
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
