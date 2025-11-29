'use client'

import { X, Car, User, Phone, Fuel, Gauge, MapPin, Calendar, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'

interface PersonalVehicle {
  id: string
  vehicleName: string
  vehicleNumber: string | null
  vehicleType: string | null
  ownerName: string
  ownerContact: string | null
  totalFuelDispensed: number
  mileage: number | null
  totalDistance: number | null
  lastOdometer: number | null
  firstOdometer: number | null
  odometerReadingsCount: number
  createdAt?: string
}

interface FuelDispense {
  id: string
  vehicleId: string
  date: string
  quantity: number
  odometerReading: number | null
  dispensedBy: string | null
  purpose: string | null
  notes: string | null
}

interface PersonalVehicleModalProps {
  vehicle: PersonalVehicle
  dispenses: FuelDispense[]
  onClose: () => void
}

export default function PersonalVehicleModal({ vehicle, dispenses, onClose }: PersonalVehicleModalProps) {
  // Filter dispenses for this vehicle
  const vehicleDispenses = dispenses.filter(d => d.vehicleId === vehicle.id)

  // Calculate average fuel per fill
  const avgFuelPerFill = vehicleDispenses.length > 0
    ? vehicle.totalFuelDispensed / vehicleDispenses.length
    : 0

  // Get last dispense date
  const lastDispense = vehicleDispenses.length > 0 ? vehicleDispenses[0] : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Car className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{vehicle.vehicleName}</h2>
                {vehicle.vehicleNumber && (
                  <p className="text-purple-200 text-lg">{vehicle.vehicleNumber}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Vehicle Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Owner</p>
                <p className="font-medium text-gray-900">{vehicle.ownerName}</p>
              </div>
            </div>
            {vehicle.ownerContact && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="font-medium text-gray-900">{vehicle.ownerContact}</p>
                </div>
              </div>
            )}
            {vehicle.vehicleType && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Car className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Vehicle Type</p>
                  <p className="font-medium text-gray-900">{vehicle.vehicleType}</p>
                </div>
              </div>
            )}
            {lastDispense && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Last Fueled</p>
                  <p className="font-medium text-gray-900">{formatDate(lastDispense.date)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Fuel Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <Fuel className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{vehicle.totalFuelDispensed.toFixed(1)}</p>
              <p className="text-xs text-purple-600">Total Litres</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">
                {vehicle.mileage !== null ? vehicle.mileage : '--'}
              </p>
              <p className="text-xs text-green-600">km/L Mileage</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">
                {vehicle.totalDistance !== null ? vehicle.totalDistance.toLocaleString() : '--'}
              </p>
              <p className="text-xs text-blue-600">km Tracked</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <Gauge className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-700">
                {vehicle.lastOdometer !== null ? vehicle.lastOdometer.toLocaleString() : '--'}
              </p>
              <p className="text-xs text-orange-600">km Odometer</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Additional Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Fill-ups:</span>
                <span className="font-medium">{vehicleDispenses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg. per Fill:</span>
                <span className="font-medium">{avgFuelPerFill.toFixed(2)} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Odometer Readings:</span>
                <span className="font-medium">{vehicle.odometerReadingsCount}</span>
              </div>
              {vehicle.firstOdometer && vehicle.lastOdometer && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Odometer Range:</span>
                  <span className="font-medium">
                    {vehicle.firstOdometer.toLocaleString()} - {vehicle.lastOdometer.toLocaleString()} km
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mileage Info */}
          {vehicle.mileage === null && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Mileage Calculation:</strong> To calculate mileage, at least 2 fuel dispenses with odometer readings are required.
                {vehicle.odometerReadingsCount < 2 && (
                  <span> You need {2 - vehicle.odometerReadingsCount} more odometer reading{2 - vehicle.odometerReadingsCount > 1 ? 's' : ''}.</span>
                )}
              </p>
            </div>
          )}

          {/* Recent Dispenses */}
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Fuel Dispenses</h3>
          {vehicleDispenses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Fuel className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No fuel dispenses recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicleDispenses.slice(0, 5).map((dispense) => (
                <div key={dispense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded">
                      <Fuel className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dispense.quantity.toFixed(2)} L</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(dispense.date)}
                        {dispense.purpose && ` - ${dispense.purpose}`}
                      </p>
                    </div>
                  </div>
                  {dispense.odometerReading && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {dispense.odometerReading.toLocaleString()} km
                      </p>
                      <p className="text-xs text-gray-400">Odometer</p>
                    </div>
                  )}
                </div>
              ))}
              {vehicleDispenses.length > 5 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  +{vehicleDispenses.length - 5} more dispenses
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
