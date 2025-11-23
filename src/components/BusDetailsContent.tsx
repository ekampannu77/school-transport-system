'use client'

import { useEffect, useState } from 'react'
import { Bus, FileText, Calendar, AlertCircle, DollarSign, Upload, Users } from 'lucide-react'
import BusDocumentUploader from './BusDocumentUploader'
import BusDocumentList from './BusDocumentList'
import InsuranceTracker from './InsuranceTracker'
import BusStudentsList from './BusStudentsList'

interface BusData {
  id: string
  registrationNumber: string
  chassisNumber: string
  seatingCapacity: number
  purchaseDate: string
  primaryDriver: {
    id: string
    name: string
    phone: string
    licenseNumber: string | null
  } | null
  insuranceExpiry: string | null
  insuranceReminder: string | null
  _count: {
    expenses: number
    reminders: number
    documents: number
  }
  busRoutes: Array<{
    driver: {
      name: string
    }
    conductor: {
      name: string
    } | null
    route: {
      routeName: string
    }
  }>
}

export default function BusDetailsContent({ busId }: { busId: string }) {
  const [bus, setBus] = useState<BusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'documents' | 'insurance'>('overview')

  useEffect(() => {
    fetchBusDetails()
  }, [busId])

  const fetchBusDetails = async () => {
    try {
      const response = await fetch(`/api/fleet/buses/${busId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch bus details')
      }
      const data = await response.json()
      setBus(data)
    } catch (error) {
      console.error('Error fetching bus details:', error)
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

  if (!bus) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Bus not found</h3>
        <p className="text-sm text-gray-500 mt-2">
          The bus you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bus Overview Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Bus className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">{bus.registrationNumber}</h2>
              <p className="text-sm text-gray-500">Chassis: {bus.chassisNumber}</p>
            </div>
          </div>
          {bus.primaryDriver && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Primary Driver</p>
              <p className="font-medium text-gray-900">{bus.primaryDriver.name}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Seating Capacity</p>
            <p className="text-lg font-semibold text-gray-900">{bus.seatingCapacity} seats</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Purchase Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(bus.purchaseDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Assignment</p>
            <p className="text-lg font-semibold text-gray-900">
              {bus.busRoutes.length > 0
                ? bus.busRoutes[0].route.routeName
                : 'Not assigned'}
            </p>
          </div>
        </div>

        {bus.busRoutes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Staff</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bus.busRoutes[0].driver && (
                <div className="flex items-center">
                  <div className="text-sm">
                    <p className="text-gray-500">Driver</p>
                    <p className="font-medium text-gray-900">{bus.busRoutes[0].driver.name}</p>
                  </div>
                </div>
              )}
              {bus.busRoutes[0].conductor && (
                <div className="flex items-center">
                  <div className="text-sm">
                    <p className="text-gray-500">Conductor</p>
                    <p className="font-medium text-gray-900">{bus.busRoutes[0].conductor.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
              <div className="text-sm">
                <p className="text-gray-500">Total Expenses</p>
                <p className="font-medium text-gray-900">{bus._count.expenses} records</p>
              </div>
            </div>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <div className="text-sm">
                <p className="text-gray-500">Documents</p>
                <p className="font-medium text-gray-900">{bus._count.documents} files</p>
              </div>
            </div>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-gray-400 mr-2" />
              <div className="text-sm">
                <p className="text-gray-500">Pending Reminders</p>
                <p className="font-medium text-gray-900">{bus._count.reminders}</p>
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
            onClick={() => setActiveTab('students')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Students
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
          <button
            onClick={() => setActiveTab('insurance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insurance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Insurance
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Overview</h3>
          <p className="text-gray-600">
            Detailed statistics and expense history will be displayed here.
          </p>
        </div>
      )}

      {activeTab === 'students' && (
        <BusStudentsList busId={busId} seatingCapacity={bus.seatingCapacity} />
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <BusDocumentUploader busId={busId} onUploadSuccess={fetchBusDetails} />
          <BusDocumentList busId={busId} />
        </div>
      )}

      {activeTab === 'insurance' && (
        <InsuranceTracker
          busId={busId}
          insuranceExpiry={bus.insuranceExpiry}
          insuranceReminder={bus.insuranceReminder}
          onUpdate={fetchBusDetails}
        />
      )}
    </div>
  )
}
