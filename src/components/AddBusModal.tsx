'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Modal, { Button } from './Modal'
import { useToast } from './Toast'
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

interface AddBusModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface StaffMember {
  id: string
  name: string
  role: string
}

const initialFormData = {
  registrationNumber: '',
  chassisNumber: '',
  seatingCapacity: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  primaryDriverId: '',
  conductorId: '',
  fitnessExpiry: '',
  registrationExpiry: '',
  insuranceExpiry: '',
  ownershipType: 'SCHOOL_OWNED',
  privateOwnerName: '',
  privateOwnerContact: '',
  privateOwnerBank: '',
  schoolCommission: '0',
  advancePayment: '0',
  routeName: '',
  startPoint: '',
  endPoint: '',
  waypoints: '',
  totalDistanceKm: '0',
}

export default function AddBusModal({ isOpen, onClose, onSuccess }: AddBusModalProps) {
  const [loading, setLoading] = useState(false)
  const [drivers, setDrivers] = useState<StaffMember[]>([])
  const [conductors, setConductors] = useState<StaffMember[]>([])
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [routeWaypoints, setRouteWaypoints] = useState<Waypoint[]>([])
  const toast = useToast()

  // Handle waypoints change from map
  const handleWaypointsChange = (waypoints: Waypoint[], distance: number) => {
    setRouteWaypoints(waypoints)

    // Auto-generate route name from first and last waypoint
    let routeName = ''
    let startPoint = ''
    let endPoint = ''

    if (waypoints.length >= 1) {
      startPoint = `Stop 1`
      routeName = `Route ${waypoints.length} stops`
    }
    if (waypoints.length >= 2) {
      endPoint = `Stop ${waypoints.length}`
      routeName = `${startPoint} to ${endPoint}`
    }

    setFormData(prev => ({
      ...prev,
      waypoints: JSON.stringify(waypoints),
      totalDistanceKm: distance.toString(),
      routeName: routeName || prev.routeName,
      startPoint: startPoint || prev.startPoint,
      endPoint: endPoint || prev.endPoint,
    }))
  }

  useEffect(() => {
    if (isOpen) {
      fetchStaff()
      setFormData(initialFormData)
      setErrors({})
      setRouteWaypoints([])
    }
  }, [isOpen])

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.registrationNumber.trim()) {
      newErrors.registrationNumber = 'Registration number is required'
    }
    if (!formData.chassisNumber.trim()) {
      newErrors.chassisNumber = 'Chassis number is required'
    }
    if (!formData.seatingCapacity || parseInt(formData.seatingCapacity) < 1) {
      newErrors.seatingCapacity = 'Valid seating capacity is required'
    }
    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required'
    }
    if (formData.ownershipType === 'PRIVATE_OWNED' && !formData.privateOwnerName.trim()) {
      newErrors.privateOwnerName = 'Owner name is required for private buses'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

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

      toast.success('Bus added successfully!')
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add bus'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Bus">
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
            className={`input-field ${errors.registrationNumber ? 'border-red-500' : ''}`}
            placeholder="e.g., DL-01-AB-1234"
          />
          {errors.registrationNumber && (
            <p className="text-xs text-red-600 mt-1">{errors.registrationNumber}</p>
          )}
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
            className={`input-field ${errors.chassisNumber ? 'border-red-500' : ''}`}
            placeholder="e.g., CH123456789"
          />
          {errors.chassisNumber && (
            <p className="text-xs text-red-600 mt-1">{errors.chassisNumber}</p>
          )}
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
            className={`input-field ${errors.seatingCapacity ? 'border-red-500' : ''}`}
            placeholder="e.g., 40"
            min="1"
          />
          {errors.seatingCapacity && (
            <p className="text-xs text-red-600 mt-1">{errors.seatingCapacity}</p>
          )}
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
            className={`input-field ${errors.purchaseDate ? 'border-red-500' : ''}`}
          />
          {errors.purchaseDate && (
            <p className="text-xs text-red-600 mt-1">{errors.purchaseDate}</p>
          )}
        </div>

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

        {/* Route Assignment Section with Map */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Route Information</h3>
          <p className="text-xs text-gray-500 mb-3">Click on the map to add route stops (optional)</p>

          {/* Map Picker */}
          <RouteMapPicker
            waypoints={routeWaypoints}
            onChange={handleWaypointsChange}
          />

          {/* Route Name - can be auto-generated or manually entered */}
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
                placeholder="Auto-generated from map or enter manually"
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
                  className={`input-field ${errors.privateOwnerName ? 'border-red-500' : ''}`}
                  placeholder="Enter owner's name"
                />
                {errors.privateOwnerName && (
                  <p className="text-xs text-red-600 mt-1">{errors.privateOwnerName}</p>
                )}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Payment (Optional)
                </label>
                <input
                  type="number"
                  value={formData.advancePayment}
                  onChange={(e) =>
                    setFormData({ ...formData, advancePayment: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., 50000"
                  min="0"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Advance amount given to bus owner
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Bus
          </Button>
        </div>
      </form>
    </Modal>
  )
}
