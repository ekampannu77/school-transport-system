'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bus, FileText, Calendar, AlertCircle, DollarSign, Upload, Users, CheckCircle, XCircle, Gauge, TrendingUp } from 'lucide-react'
import BusDocumentUploader from './BusDocumentUploader'
import BusDocumentList from './BusDocumentList'
import BusStudentsList from './BusStudentsList'
import BusMonthlyExpenses from './BusMonthlyExpenses'
import { formatDate, calculateStudentCapacity } from '@/lib/dateUtils'

// Helper component to show expiry status with color coding
function ExpiryCard({ label, date }: { label: string; date: string | null }) {
  if (!date) {
    return (
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-400">Not set</p>
      </div>
    )
  }

  const expiryDate = new Date(date)
  const today = new Date()
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  let statusColor = 'bg-green-50 border-green-200'
  let textColor = 'text-green-800'
  let statusText = 'Valid'
  let Icon = CheckCircle
  let iconColor = 'text-green-500'

  if (daysUntilExpiry < 0) {
    statusColor = 'bg-red-50 border-red-200'
    textColor = 'text-red-800'
    statusText = 'Expired'
    Icon = XCircle
    iconColor = 'text-red-500'
  } else if (daysUntilExpiry <= 30) {
    statusColor = 'bg-yellow-50 border-yellow-200'
    textColor = 'text-yellow-800'
    statusText = `${daysUntilExpiry} days left`
    Icon = AlertCircle
    iconColor = 'text-yellow-500'
  }

  return (
    <div className={`rounded-lg p-3 border ${statusColor}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{label}</p>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <p className={`text-sm font-medium ${textColor}`}>
        {formatDate(expiryDate)}
      </p>
      <p className={`text-xs ${textColor}`}>{statusText}</p>
    </div>
  )
}

interface BusData {
  id: string
  registrationNumber: string
  chassisNumber: string
  seatingCapacity: number
  purchaseDate: string
  totalExpenses: number
  mileage: number
  mileageData: {
    kmPerLitre: number
    totalDistance: number
    totalLitres: number
    fuelRecordsCount: number
  }
  primaryDriver: {
    id: string
    name: string
    phone: string
    licenseNumber: string | null
  } | null
  insuranceExpiry: string | null
  insuranceReminder: string | null
  fitnessExpiry: string | null
  registrationExpiry: string | null
  _count: {
    expenses: number
    reminders: number
    documents: number
    students: number
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
  recentExpenses: Array<{
    id: string
    category: string
    amount: number
    date: string
    description: string | null
    odometerReading: number | null
  }>
  expensesByCategory: Record<string, number>
  reminders: Array<{
    id: string
    type: string
    dueDate: string
    notes: string | null
  }>
}

export default function BusDetailsContent({ busId }: { busId: string }) {
  const [bus, setBus] = useState<BusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'students' | 'documents' | 'expenses'>('students')

  const fetchBusDetails = useCallback(async () => {
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
  }, [busId])

  useEffect(() => {
    fetchBusDetails()
  }, [fetchBusDetails])

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
          The bus you&apos;re looking for doesn&apos;t exist or has been removed.
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Seating Capacity</p>
            <p className="text-lg font-semibold text-gray-900">{bus.seatingCapacity} seats</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Purchase Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(bus.purchaseDate)}
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

        {/* Document Expiry Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Document Expiry Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExpiryCard
              label="Fitness Certificate"
              date={bus.fitnessExpiry}
            />
            <ExpiryCard
              label="Registration"
              date={bus.registrationExpiry}
            />
            <ExpiryCard
              label="Insurance"
              date={bus.insuranceExpiry}
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Staff</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="text-sm">
                <p className="text-gray-500">Driver</p>
                <p className="font-medium text-gray-900">
                  {bus.primaryDriver?.name || bus.busRoutes[0]?.driver?.name || 'Not assigned'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-sm">
                <p className="text-gray-500">Conductor</p>
                <p className="font-medium text-gray-900">
                  {bus.busRoutes[0]?.conductor?.name || 'Not assigned'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{bus.totalExpenses.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">{bus._count.expenses} records</p>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Mileage</p>
              <p className="text-xl font-bold text-gray-900">
                {bus.mileage > 0 ? `${bus.mileage} km/L` : 'No data'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {bus.mileageData.fuelRecordsCount} fuel records
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <Gauge className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Students</p>
              <p className="text-xl font-bold text-gray-900">{bus._count.students}</p>
              <p className="text-xs text-gray-400 mt-1">
                of {calculateStudentCapacity(bus.seatingCapacity)} capacity
              </p>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pending Alerts</p>
              <p className="text-xl font-bold text-gray-900">{bus._count.reminders}</p>
              <p className="text-xs text-gray-400 mt-1">Requires attention</p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
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
            onClick={() => setActiveTab('expenses')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expenses'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Monthly Expenses
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
        <BusStudentsList busId={busId} seatingCapacity={bus.seatingCapacity} />
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <BusDocumentUploader busId={busId} onUploadSuccess={fetchBusDetails} />
          <BusDocumentList busId={busId} />
        </div>
      )}

      {activeTab === 'expenses' && (
        <BusMonthlyExpenses busId={busId} />
      )}
    </div>
  )
}
