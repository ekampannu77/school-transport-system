'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Droplet, AlertTriangle, Car, Fuel, User, Eye, Bus, Edit2, X, Calendar, Filter } from 'lucide-react'
import PersonalVehicleModal from '@/components/PersonalVehicleModal'

interface FuelPurchase {
  id: string
  date: string
  quantity: number
  pricePerLitre: number
  totalCost: number
  vendor: string | null
  invoiceNumber: string | null
  notes: string | null
}

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

interface PersonalVehicleDispense {
  id: string
  vehicleId: string
  date: string
  quantity: number
  odometerReading: number | null
  dispensedBy: string | null
  purpose: string | null
  notes: string | null
  vehicle: {
    vehicleName: string
    vehicleNumber: string | null
    ownerName: string
  }
}

interface BusInfo {
  id: string
  registrationNumber: string
}

interface BusDispense {
  id: string
  busId: string
  date: string
  quantity: number
  odometerReading: number | null
  dispensedBy: string | null
  notes: string | null
  bus: {
    registrationNumber: string
  }
}

interface InventorySummary {
  currentStock: number
  totalPurchased: number
  totalDispensed: number
  totalBusDispensed: number
  totalPersonalDispensed: number
}

const LOW_STOCK_THRESHOLD = 100
const CRITICAL_STOCK_THRESHOLD = 50

export default function FuelInventoryPage() {
  const [inventory, setInventory] = useState<InventorySummary | null>(null)
  const [purchases, setPurchases] = useState<FuelPurchase[]>([])
  const [personalVehicles, setPersonalVehicles] = useState<PersonalVehicle[]>([])
  const [personalDispenses, setPersonalDispenses] = useState<PersonalVehicleDispense[]>([])
  const [buses, setBuses] = useState<BusInfo[]>([])
  const [busDispenses, setBusDispenses] = useState<BusDispense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'purchases' | 'buses' | 'personal'>('purchases')

  // Date filters
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  })
  const [showDateFilter, setShowDateFilter] = useState(false)

  // Edit vehicle state
  const [editingVehicle, setEditingVehicle] = useState<PersonalVehicle | null>(null)

  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    pricePerLitre: '',
    vendor: '',
    invoiceNumber: '',
    notes: '',
  })

  const [vehicleForm, setVehicleForm] = useState({
    vehicleName: '',
    vehicleNumber: '',
    vehicleType: '',
    ownerName: '',
    ownerContact: '',
  })

  const [dispenseForm, setDispenseForm] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    odometerReading: '',
    dispensedBy: '',
    purpose: '',
    notes: '',
  })

  // Bus dispense form
  const [busDispenseForm, setBusDispenseForm] = useState({
    busId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    odometerReading: '',
    dispensedBy: '',
    notes: '',
  })

  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<PersonalVehicle | null>(null)

  useEffect(() => {
    fetchInventory()
    fetchPurchases()
    fetchPersonalVehicles()
    fetchPersonalDispenses()
    fetchBuses()
    fetchBusDispenses()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fuel/inventory')
      const data = await response.json()
      setInventory(data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setError('Failed to fetch fuel inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/fuel/purchases')
      const data = await response.json()
      setPurchases(data)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    }
  }

  const fetchPersonalVehicles = async () => {
    try {
      const response = await fetch('/api/personal-vehicles')
      const data = await response.json()
      setPersonalVehicles(data)
    } catch (error) {
      console.error('Error fetching personal vehicles:', error)
    }
  }

  const fetchPersonalDispenses = async () => {
    try {
      const response = await fetch('/api/personal-vehicles/dispense')
      const data = await response.json()
      setPersonalDispenses(data)
    } catch (error) {
      console.error('Error fetching personal dispenses:', error)
    }
  }

  const fetchBuses = async () => {
    try {
      const response = await fetch('/api/fleet/buses')
      const data = await response.json()
      setBuses(data)
    } catch (error) {
      console.error('Error fetching buses:', error)
    }
  }

  const fetchBusDispenses = async () => {
    try {
      const response = await fetch('/api/fuel/dispenses')
      const data = await response.json()
      setBusDispenses(data)
    } catch (error) {
      console.error('Error fetching bus dispenses:', error)
    }
  }

  const calculateTotalCost = () => {
    const quantity = parseFloat(purchaseForm.quantity) || 0
    const pricePerLitre = parseFloat(purchaseForm.pricePerLitre) || 0
    return quantity * pricePerLitre
  }

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/fuel/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create purchase')
      }

      // Reset form
      setPurchaseForm({
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        pricePerLitre: '',
        vendor: '',
        invoiceNumber: '',
        notes: '',
      })

      // Refresh data
      await Promise.all([fetchInventory(), fetchPurchases()])
      alert('Fuel purchase recorded successfully!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return

    try {
      const response = await fetch(`/api/fuel/purchases?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete purchase')
      }

      await Promise.all([fetchInventory(), fetchPurchases()])
      alert('Purchase deleted successfully!')
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/personal-vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add vehicle')
      }

      setVehicleForm({
        vehicleName: '',
        vehicleNumber: '',
        vehicleType: '',
        ownerName: '',
        ownerContact: '',
      })
      setShowAddVehicle(false)
      await fetchPersonalVehicles()
      alert('Vehicle added successfully!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDispenseFuel = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/personal-vehicles/dispense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dispenseForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to dispense fuel')
      }

      setDispenseForm({
        vehicleId: '',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        odometerReading: '',
        dispensedBy: '',
        purpose: '',
        notes: '',
      })
      await Promise.all([fetchInventory(), fetchPersonalVehicles(), fetchPersonalDispenses()])
      alert('Fuel dispensed successfully!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this vehicle?')) return

    try {
      const response = await fetch(`/api/personal-vehicles?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to deactivate vehicle')
      }

      await fetchPersonalVehicles()
      alert('Vehicle deactivated successfully!')
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleDeleteDispense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dispense record?')) return

    try {
      const response = await fetch(`/api/personal-vehicles/dispense?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete dispense record')
      }

      await Promise.all([fetchInventory(), fetchPersonalVehicles(), fetchPersonalDispenses()])
      alert('Dispense record deleted successfully!')
    } catch (error: any) {
      alert(error.message)
    }
  }

  // Bus dispense handler
  const handleBusDispense = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/fuel/dispenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(busDispenseForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to dispense fuel')
      }

      setBusDispenseForm({
        busId: '',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        odometerReading: '',
        dispensedBy: '',
        notes: '',
      })
      await Promise.all([fetchInventory(), fetchBusDispenses()])
      alert('Fuel dispensed to bus successfully!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBusDispense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bus dispense record?')) return

    try {
      const response = await fetch(`/api/fuel/dispenses?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete dispense record')
      }

      await Promise.all([fetchInventory(), fetchBusDispenses()])
      alert('Bus dispense record deleted successfully!')
    } catch (error: any) {
      alert(error.message)
    }
  }

  // Edit vehicle handler
  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVehicle) return
    setSubmitting(true)

    try {
      const response = await fetch(`/api/personal-vehicles?id=${editingVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleName: vehicleForm.vehicleName,
          vehicleNumber: vehicleForm.vehicleNumber,
          vehicleType: vehicleForm.vehicleType,
          ownerName: vehicleForm.ownerName,
          ownerContact: vehicleForm.ownerContact,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update vehicle')
      }

      setVehicleForm({
        vehicleName: '',
        vehicleNumber: '',
        vehicleType: '',
        ownerName: '',
        ownerContact: '',
      })
      setEditingVehicle(null)
      await fetchPersonalVehicles()
      alert('Vehicle updated successfully!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const startEditVehicle = (vehicle: PersonalVehicle) => {
    setEditingVehicle(vehicle)
    setVehicleForm({
      vehicleName: vehicle.vehicleName,
      vehicleNumber: vehicle.vehicleNumber || '',
      vehicleType: vehicle.vehicleType || '',
      ownerName: vehicle.ownerName,
      ownerContact: vehicle.ownerContact || '',
    })
    setShowAddVehicle(true)
  }

  const cancelEdit = () => {
    setEditingVehicle(null)
    setVehicleForm({
      vehicleName: '',
      vehicleNumber: '',
      vehicleType: '',
      ownerName: '',
      ownerContact: '',
    })
    setShowAddVehicle(false)
  }

  // Filter data by date range
  const filterByDate = <T extends { date: string },>(data: T[]): T[] => {
    if (!dateFilter.startDate && !dateFilter.endDate) return data
    return data.filter(item => {
      const itemDate = new Date(item.date)
      if (dateFilter.startDate && itemDate < new Date(dateFilter.startDate)) return false
      if (dateFilter.endDate && itemDate > new Date(dateFilter.endDate)) return false
      return true
    })
  }

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fuel inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchInventory} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fuel Inventory Management</h1>
          <p className="text-gray-600">Track fuel purchases and monitor current stock levels</p>
        </div>

        {/* Low Stock Alert Banner */}
        {inventory && inventory.currentStock < CRITICAL_STOCK_THRESHOLD && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="text-red-800 font-bold">Critical Low Stock!</p>
                <p className="text-red-700 text-sm">
                  Fuel stock is critically low ({(inventory.currentStock).toFixed(2)} L). Please purchase fuel immediately.
                </p>
              </div>
            </div>
          </div>
        )}
        {inventory && inventory.currentStock >= CRITICAL_STOCK_THRESHOLD && inventory.currentStock < LOW_STOCK_THRESHOLD && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <p className="text-yellow-800 font-bold">Low Stock Warning</p>
                <p className="text-yellow-700 text-sm">
                  Fuel stock is running low ({(inventory.currentStock).toFixed(2)} L). Consider purchasing more fuel soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Summary */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-lg ${
                  inventory && inventory.currentStock < CRITICAL_STOCK_THRESHOLD
                    ? 'bg-red-100'
                    : inventory && inventory.currentStock < LOW_STOCK_THRESHOLD
                    ? 'bg-yellow-100'
                    : 'bg-blue-100'
                }`}>
                  <Droplet className={`h-8 w-8 ${
                    inventory && inventory.currentStock < CRITICAL_STOCK_THRESHOLD
                      ? 'text-red-600'
                      : inventory && inventory.currentStock < LOW_STOCK_THRESHOLD
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Fuel Stock</p>
                  <p className={`text-4xl font-bold ${
                    inventory && inventory.currentStock < CRITICAL_STOCK_THRESHOLD
                      ? 'text-red-600'
                      : inventory && inventory.currentStock < LOW_STOCK_THRESHOLD
                      ? 'text-yellow-600'
                      : 'text-gray-900'
                  }`}>
                    {(inventory?.currentStock ?? 0).toFixed(2)} L
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-800">Total Purchased</p>
                </div>
                <p className="text-xl font-bold text-green-900">
                  {(inventory?.totalPurchased ?? 0).toFixed(2)} L
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-800">Total Dispensed</p>
                </div>
                <p className="text-xl font-bold text-red-900">
                  {(inventory?.totalDispensed ?? 0).toFixed(2)} L
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-1">
                  <Fuel className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs text-yellow-800">Buses</p>
                </div>
                <p className="text-xl font-bold text-yellow-900">
                  {(inventory?.totalBusDispensed ?? 0).toFixed(2)} L
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Car className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-purple-800">Personal</p>
                </div>
                <p className="text-xl font-bold text-purple-900">
                  {(inventory?.totalPersonalDispensed ?? 0).toFixed(2)} L
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'purchases'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4" />
              Fuel Purchases
            </div>
          </button>
          <button
            onClick={() => setActiveTab('buses')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'buses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Bus Dispenses
            </div>
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'personal'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Personal Vehicles
            </div>
          </button>

          {/* Date Filter Toggle */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 ${
                showDateFilter || dateFilter.startDate || dateFilter.endDate
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {(dateFilter.startDate || dateFilter.endDate) && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">1</span>
              )}
            </button>
          </div>
        </div>

        {/* Date Filter Panel */}
        {showDateFilter && (
          <div className="card p-4 mb-6 bg-gray-50">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
              {(dateFilter.startDate || dateFilter.endDate) && (
                <button
                  onClick={clearDateFilter}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <>
        {/* Purchase Form */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Record Fuel Purchase</h2>
          </div>

          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={purchaseForm.date}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (Litres) *
                </label>
                <input
                  type="number"
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Litre *
                </label>
                <input
                  type="number"
                  value={purchaseForm.pricePerLitre}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, pricePerLitre: e.target.value })}
                  className="input-field"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                Total Cost: <span className="font-bold text-lg">{formatCurrency(calculateTotalCost())}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor (Optional)
                </label>
                <input
                  type="text"
                  value={purchaseForm.vendor}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, vendor: e.target.value })}
                  className="input-field"
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number (Optional)
                </label>
                <input
                  type="text"
                  value={purchaseForm.invoiceNumber}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                  className="input-field"
                  placeholder="Invoice number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Additional notes"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full md:w-auto"
            >
              {submitting ? 'Recording...' : 'Record Purchase'}
            </button>
          </form>
        </div>

        {/* Purchase History */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Purchase History</h2>

          {filterByDate(purchases).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {purchases.length === 0 ? 'No purchases recorded yet' : 'No purchases match the selected date range'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filterByDate(purchases).map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(purchase.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.quantity.toFixed(2)} L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(purchase.pricePerLitre)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {purchase.vendor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {purchase.invoiceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeletePurchase(purchase.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete purchase"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </>
        )}

        {activeTab === 'buses' && (
          <>
            {/* Bus Dispense Form */}
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <Bus className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">Dispense Fuel to Bus</h2>
              </div>

              <form onSubmit={handleBusDispense} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Bus *
                    </label>
                    <select
                      value={busDispenseForm.busId}
                      onChange={(e) => setBusDispenseForm({ ...busDispenseForm, busId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select a bus</option>
                      {buses.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          {bus.registrationNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={busDispenseForm.date}
                      onChange={(e) => setBusDispenseForm({ ...busDispenseForm, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (Litres) *
                    </label>
                    <input
                      type="number"
                      value={busDispenseForm.quantity}
                      onChange={(e) => setBusDispenseForm({ ...busDispenseForm, quantity: e.target.value })}
                      className="input-field"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Odometer Reading
                    </label>
                    <input
                      type="number"
                      value={busDispenseForm.odometerReading}
                      onChange={(e) => setBusDispenseForm({ ...busDispenseForm, odometerReading: e.target.value })}
                      className="input-field"
                      placeholder="Current KM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dispensed By
                    </label>
                    <input
                      type="text"
                      value={busDispenseForm.dispensedBy}
                      onChange={(e) => setBusDispenseForm({ ...busDispenseForm, dispensedBy: e.target.value })}
                      className="input-field"
                      placeholder="Name of person"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={busDispenseForm.notes}
                      onChange={(e) => setBusDispenseForm({ ...busDispenseForm, notes: e.target.value })}
                      className="input-field"
                      placeholder="Additional notes"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Dispensing...' : 'Dispense Fuel'}
                </button>
              </form>
            </div>

            {/* Bus Dispense History */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bus Dispense History</h2>

              {filterByDate(busDispenses).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {busDispenses.length === 0 ? 'No fuel dispensed to buses yet' : 'No dispenses match the selected date range'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bus
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Odometer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dispensed By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterByDate(busDispenses).map((dispense) => (
                        <tr key={dispense.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(dispense.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dispense.bus.registrationNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dispense.quantity.toFixed(2)} L
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dispense.odometerReading ? `${dispense.odometerReading.toLocaleString()} km` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dispense.dispensedBy || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDeleteBusDispense(dispense.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete dispense record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'personal' && (
          <>
            {/* Dispense Fuel Form */}
            <div className="card p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <Fuel className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Dispense Fuel to Personal Vehicle</h2>
              </div>

              <form onSubmit={handleDispenseFuel} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Vehicle *
                    </label>
                    <select
                      value={dispenseForm.vehicleId}
                      onChange={(e) => setDispenseForm({ ...dispenseForm, vehicleId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select a vehicle</option>
                      {personalVehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicleName} {vehicle.vehicleNumber ? `(${vehicle.vehicleNumber})` : ''} - {vehicle.ownerName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={dispenseForm.date}
                      onChange={(e) => setDispenseForm({ ...dispenseForm, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity (Litres) *
                    </label>
                    <input
                      type="number"
                      value={dispenseForm.quantity}
                      onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: e.target.value })}
                      className="input-field"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Odometer Reading
                    </label>
                    <input
                      type="number"
                      value={dispenseForm.odometerReading}
                      onChange={(e) => setDispenseForm({ ...dispenseForm, odometerReading: e.target.value })}
                      className="input-field"
                      placeholder="Current KM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dispensed By
                    </label>
                    <input
                      type="text"
                      value={dispenseForm.dispensedBy}
                      onChange={(e) => setDispenseForm({ ...dispenseForm, dispensedBy: e.target.value })}
                      className="input-field"
                      placeholder="Name of person"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose
                    </label>
                    <input
                      type="text"
                      value={dispenseForm.purpose}
                      onChange={(e) => setDispenseForm({ ...dispenseForm, purpose: e.target.value })}
                      className="input-field"
                      placeholder="e.g., School visit, Meeting"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={dispenseForm.notes}
                    onChange={(e) => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="Additional notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Dispensing...' : 'Dispense Fuel'}
                </button>
              </form>
            </div>

            {/* Personal Vehicles List */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Personal Vehicles</h2>
                {personalVehicles.length > 0 && !showAddVehicle && (
                  <button
                    onClick={() => setShowAddVehicle(true)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Vehicle
                  </button>
                )}
              </div>

              {/* Inline Add/Edit Vehicle Form */}
              {(showAddVehicle || personalVehicles.length === 0) && (
                <div className={`${editingVehicle ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border rounded-lg p-4 mb-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {editingVehicle ? (
                        <Edit2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Car className="h-5 w-5 text-purple-600" />
                      )}
                      <h3 className="font-medium text-gray-900">
                        {editingVehicle ? 'Edit Personal Vehicle' : 'Add Personal Vehicle'}
                      </h3>
                    </div>
                    {(personalVehicles.length > 0 || editingVehicle) && (
                      <button
                        onClick={cancelEdit}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <form onSubmit={editingVehicle ? handleEditVehicle : handleAddVehicle} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Name *
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.vehicleName}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                          className="input-field"
                          placeholder="e.g., Principal's Car"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Number
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.vehicleNumber}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                          className="input-field"
                          placeholder="e.g., PB10AB1234"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Type
                        </label>
                        <select
                          value={vehicleForm.vehicleType}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                          className="input-field"
                        >
                          <option value="">Select type</option>
                          <option value="Car">Car</option>
                          <option value="Bike">Bike</option>
                          <option value="Scooter">Scooter</option>
                          <option value="SUV">SUV</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Owner Name *
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.ownerName}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, ownerName: e.target.value })}
                          className="input-field"
                          placeholder="Owner's name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Owner Contact
                        </label>
                        <input
                          type="text"
                          value={vehicleForm.ownerContact}
                          onChange={(e) => setVehicleForm({ ...vehicleForm, ownerContact: e.target.value })}
                          className="input-field"
                          placeholder="Phone number"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={editingVehicle ? 'btn-primary bg-blue-600 hover:bg-blue-700' : 'btn-primary'}
                    >
                      {submitting
                        ? (editingVehicle ? 'Updating...' : 'Adding...')
                        : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')
                      }
                    </button>
                  </form>
                </div>
              )}

              {personalVehicles.length === 0 && !showAddVehicle ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Fill out the form above to add your first vehicle</p>
                </div>
              ) : null}

              {personalVehicles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Car className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{vehicle.vehicleName}</p>
                            {vehicle.vehicleNumber && (
                              <p className="text-sm text-gray-500">{vehicle.vehicleNumber}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedVehicle(vehicle)
                            }}
                            className="text-purple-500 hover:text-purple-700 p-1"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditVehicle(vehicle)
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Edit vehicle"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteVehicle(vehicle.id)
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Deactivate vehicle"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{vehicle.ownerName}</span>
                        </div>
                        {vehicle.vehicleType && (
                          <p className="text-gray-500">Type: {vehicle.vehicleType}</p>
                        )}
                        {vehicle.lastOdometer && (
                          <p className="text-gray-500">Odometer: {vehicle.lastOdometer.toLocaleString()} km</p>
                        )}
                        <div className="pt-2 border-t mt-2 space-y-1">
                          <p className="text-purple-600 font-medium">
                            Total Fuel: {vehicle.totalFuelDispensed.toFixed(2)} L
                          </p>
                          {vehicle.mileage !== null ? (
                            <p className="text-green-600 font-medium">
                              Mileage: {vehicle.mileage} km/L
                            </p>
                          ) : (
                            <p className="text-gray-400 text-xs">
                              {vehicle.odometerReadingsCount < 2
                                ? `Need ${2 - vehicle.odometerReadingsCount} more odometer reading${2 - vehicle.odometerReadingsCount > 1 ? 's' : ''} for mileage`
                                : 'Mileage unavailable'}
                            </p>
                          )}
                          {vehicle.totalDistance !== null && vehicle.totalDistance > 0 && (
                            <p className="text-gray-500 text-xs">
                              Distance tracked: {vehicle.totalDistance.toLocaleString()} km
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Personal Vehicle Dispense History */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dispense History</h2>

              {filterByDate(personalDispenses).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Fuel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {personalDispenses.length === 0 ? 'No fuel dispensed to personal vehicles yet' : 'No dispenses match the selected date range'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purpose
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterByDate(personalDispenses).map((dispense) => (
                        <tr key={dispense.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(dispense.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dispense.vehicle.vehicleName}
                            {dispense.vehicle.vehicleNumber && (
                              <span className="text-gray-500 ml-1">({dispense.vehicle.vehicleNumber})</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dispense.vehicle.ownerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dispense.quantity.toFixed(2)} L
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dispense.purpose || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleDeleteDispense(dispense.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete dispense record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Personal Vehicle Detail Modal */}
        {selectedVehicle && (
          <PersonalVehicleModal
            vehicle={selectedVehicle}
            dispenses={personalDispenses}
            onClose={() => setSelectedVehicle(null)}
          />
        )}
      </div>
    </div>
  )
}
