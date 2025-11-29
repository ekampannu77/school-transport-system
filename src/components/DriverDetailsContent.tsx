'use client'

import { useEffect, useState } from 'react'
import { User, FileText, CreditCard, AlertCircle, Phone, MapPin } from 'lucide-react'
import DriverDocumentUploader from './DriverDocumentUploader'
import DriverDocumentList from './DriverDocumentList'
import LicenseTracker from './LicenseTracker'

interface DriverData {
  id: string
  name: string
  role: string
  licenseNumber: string | null
  licenseExpiry: string | null
  licenseReminder: string | null
  aadharNumber: string | null
  phone: string
  address: string | null
  status: string
  createdAt: string
  _count: {
    busRoutes: number
    documents: number
  }
  busRoutes: Array<{
    bus: {
      registrationNumber: string
    }
    route: {
      routeName: string
    }
  }>
}

export default function DriverDetailsContent({ driverId }: { driverId: string }) {
  const [driver, setDriver] = useState<DriverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'license'>('overview')

  useEffect(() => {
    fetchDriverDetails()
  }, [driverId])

  const fetchDriverDetails = async () => {
    try {
      const response = await fetch(`/api/drivers/${driverId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch driver details')
      }
      const data = await response.json()
      setDriver(data)
    } catch (error) {
      console.error('Error fetching driver details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Driver not found</h3>
        <p className="text-sm text-gray-500 mt-2">
          The driver you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      active: 'badge-success',
      inactive: 'badge-info',
      suspended: 'badge-warning',
    }
    return statusConfig[status] || 'badge-info'
  }

  const getRoleBadge = (role: string) => {
    return role === 'driver' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
  }

  return (
    <div className="space-y-6">
      {/* Driver Overview Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{driver.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge ${getRoleBadge(driver.role)}`}>
                  {driver.role === 'driver' ? 'Driver' : 'Conductor'}
                </span>
                <span className={`badge ${getStatusBadge(driver.status)}`}>
                  {driver.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {driver.role === 'driver' ? (
            <>
              <div>
                <p className="text-sm text-gray-500 mb-1">License Number</p>
                <p className="text-lg font-semibold text-gray-900">{driver.licenseNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">License Expiry</p>
                <p className="text-lg font-semibold text-gray-900">
                  {driver.licenseExpiry
                    ? new Date(driver.licenseExpiry).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-1">Aadhar Number</p>
              <p className="text-lg font-semibold text-gray-900">
                {driver.aadharNumber
                  ? driver.aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
                  : 'N/A'}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Assignment</p>
            <p className="text-lg font-semibold text-gray-900">
              {driver.busRoutes.length > 0
                ? `${driver.busRoutes[0].route.routeName} (${driver.busRoutes[0].bus.registrationNumber})`
                : 'Not assigned'}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-400 mr-2" />
              <div className="text-sm">
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{driver.phone}</p>
              </div>
            </div>
            {driver.address && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{driver.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {driver.busRoutes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Assignment</h3>
            <div className="flex items-center">
              <div className="text-sm">
                <p className="text-gray-500">Route</p>
                <p className="font-medium text-gray-900">{driver.busRoutes[0].route.routeName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Bus: {driver.busRoutes[0].bus.registrationNumber}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <div className="text-sm">
                <p className="text-gray-500">Documents</p>
                <p className="font-medium text-gray-900">{driver._count.documents} files</p>
              </div>
            </div>
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
              <div className="text-sm">
                <p className="text-gray-500">Total Routes Driven</p>
                <p className="font-medium text-gray-900">{driver._count.busRoutes}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Documents
          </button>
          {driver.role === 'driver' && (
            <button
              onClick={() => setActiveTab('license')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'license'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              License
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Routes</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{driver._count.busRoutes}</p>
                  </div>
                  <CreditCard className="h-10 w-10 text-blue-400" />
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Documents</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{driver._count.documents}</p>
                  </div>
                  <FileText className="h-10 w-10 text-green-400" />
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Status</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1 capitalize">{driver.status}</p>
                  </div>
                  <User className="h-10 w-10 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Current Assignment */}
          {driver.busRoutes.length > 0 ? (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Route Assignment</h3>
              <div className="space-y-4">
                {driver.busRoutes.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Route</p>
                      <p className="text-lg font-semibold text-gray-900">{assignment.route.routeName}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Bus Registration</p>
                      <p className="text-lg font-semibold text-gray-900">{assignment.bus.registrationNumber}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{driver.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-6">
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Active Assignment</h3>
                <p className="text-sm text-gray-500 mt-2">
                  This driver is not currently assigned to any route.
                </p>
              </div>
            </div>
          )}

          {/* License Information */}
          {driver.role === 'driver' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">License Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">License Number</p>
                  <p className="text-lg font-semibold text-gray-900">{driver.licenseNumber || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Expiry Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {driver.licenseExpiry
                      ? new Date(driver.licenseExpiry).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not provided'}
                  </p>
                  {driver.licenseExpiry && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(driver.licenseExpiry) > new Date()
                        ? `Expires in ${Math.ceil((new Date(driver.licenseExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                        : 'Expired'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Identification Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Identification Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Aadhar Card Number</p>
                <p className="text-lg font-semibold text-gray-900">
                  {driver.aadharNumber || 'Not provided'}
                </p>
                {driver.aadharNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    {driver.aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ')}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Role</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{driver.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <DriverDocumentUploader driverId={driverId} onUploadSuccess={fetchDriverDetails} />
          <DriverDocumentList driverId={driverId} />
        </div>
      )}

      {activeTab === 'license' && driver.role === 'driver' && (
        <LicenseTracker
          driverId={driverId}
          licenseExpiry={driver.licenseExpiry}
          licenseReminder={driver.licenseReminder}
          onUpdate={fetchDriverDetails}
        />
      )}
    </div>
  )
}
