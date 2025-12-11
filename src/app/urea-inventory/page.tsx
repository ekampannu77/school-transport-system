'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Droplet, AlertTriangle, Bus, Calendar, Filter, X } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/Modal'
import { formatDate } from '@/lib/dateUtils'

interface UreaPurchase {
  id: string
  date: string
  quantity: number
  pricePerLitre: number
  totalCost: number
  vendor: string | null
  invoiceNumber: string | null
  notes: string | null
}

interface UreaDispense {
  id: string
  busId: string
  date: string
  quantity: number
  dispensedBy: string | null
  notes: string | null
  bus: {
    registrationNumber: string
  }
}

interface BusOption {
  id: string
  registrationNumber: string
}

interface InventorySummary {
  currentStock: number
  totalPurchased: number
  totalDispensed: number
  totalSpent: number
  averagePrice: number
  busSummary: Array<{
    busId: string
    registrationNumber: string
    totalDispensed: number
  }>
}

const LOW_STOCK_THRESHOLD = 50
const CRITICAL_STOCK_THRESHOLD = 20

export default function UreaInventoryPage() {
  const [inventory, setInventory] = useState<InventorySummary | null>(null)
  const [purchases, setPurchases] = useState<UreaPurchase[]>([])
  const [dispenses, setDispenses] = useState<UreaDispense[]>([])
  const [buses, setBuses] = useState<BusOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'purchase' | 'dispense'>('purchase')
  const toast = useToast()

  // Date filters
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  })
  const [showDateFilter, setShowDateFilter] = useState(false)

  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    pricePerLitre: '',
    vendor: '',
    invoiceNumber: '',
    notes: '',
  })

  const [dispenseForm, setDispenseForm] = useState({
    busId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    dispensedBy: '',
    notes: '',
  })

  useEffect(() => {
    fetchInventory()
    fetchPurchases()
    fetchDispenses()
    fetchBuses()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/urea/inventory')
      const data = await response.json()
      setInventory(data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setError('Failed to fetch urea inventory')
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/urea/purchases')
      const data = await response.json()
      setPurchases(data)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    }
  }

  const fetchDispenses = async () => {
    try {
      const response = await fetch('/api/urea/dispenses')
      const data = await response.json()
      setDispenses(data)
    } catch (error) {
      console.error('Error fetching dispenses:', error)
    }
  }

  const fetchBuses = async () => {
    try {
      const response = await fetch('/api/fleet')
      const data = await response.json()
      setBuses(data.map((bus: { id: string; registrationNumber: string }) => ({
        id: bus.id,
        registrationNumber: bus.registrationNumber,
      })))
    } catch (error) {
      console.error('Error fetching buses:', error)
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
      const response = await fetch('/api/urea/purchases', {
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
      toast.success('Urea purchase recorded successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to record purchase'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDispenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/urea/dispenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dispenseForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to dispense urea')
      }

      // Reset form
      setDispenseForm({
        busId: '',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        dispensedBy: '',
        notes: '',
      })

      // Refresh data
      await Promise.all([fetchInventory(), fetchDispenses()])
      toast.success('Urea dispensed successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to dispense urea'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return

    try {
      const response = await fetch(`/api/urea/purchases?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete purchase')
      }

      await Promise.all([fetchInventory(), fetchPurchases()])
      toast.success('Purchase deleted successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete purchase'
      toast.error(message)
    }
  }

  const handleDeleteDispense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dispense record?')) return

    try {
      const response = await fetch(`/api/urea/dispenses?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete dispense')
      }

      await Promise.all([fetchInventory(), fetchDispenses()])
      toast.success('Dispense deleted successfully!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete dispense'
      toast.error(message)
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading urea inventory...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Urea Inventory Management</h1>
          <p className="text-gray-600">Track urea purchases and dispenses to buses</p>
        </div>

        {/* Low Stock Alert Banner */}
        {inventory && inventory.currentStock < CRITICAL_STOCK_THRESHOLD && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="text-red-800 font-bold">Critical Low Stock!</p>
                <p className="text-red-700 text-sm">
                  Urea stock is critically low ({(inventory.currentStock).toFixed(2)} L). Please purchase urea immediately.
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
                  Urea stock is running low ({(inventory.currentStock).toFixed(2)} L). Consider purchasing more soon.
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
                    : 'bg-cyan-100'
                }`}>
                  <Droplet className={`h-8 w-8 ${
                    inventory && inventory.currentStock < CRITICAL_STOCK_THRESHOLD
                      ? 'text-red-600'
                      : inventory && inventory.currentStock < LOW_STOCK_THRESHOLD
                      ? 'text-yellow-600'
                      : 'text-cyan-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Urea Stock</p>
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
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <div className="flex items-center gap-2 mb-1">
                  <Droplet className="h-4 w-4 text-cyan-600" />
                  <p className="text-xs text-cyan-800">Total Spent</p>
                </div>
                <p className="text-xl font-bold text-cyan-900">
                  {formatCurrency(inventory?.totalSpent ?? 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Bus className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-purple-800">Avg Price/L</p>
                </div>
                <p className="text-xl font-bold text-purple-900">
                  {formatCurrency(inventory?.averagePrice ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bus Dispense Summary */}
        {inventory && inventory.busSummary && inventory.busSummary.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Urea Usage by Bus</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {inventory.busSummary.map((bus) => (
                <div key={bus.busId} className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm font-medium text-gray-900">{bus.registrationNumber}</p>
                  <p className="text-lg font-bold text-cyan-600">{bus.totalDispensed.toFixed(2)} L</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Filter Toggle */}
        <div className="flex justify-end mb-4">
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

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('purchase')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'purchase'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Record Purchase
          </button>
          <button
            onClick={() => setActiveTab('dispense')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'dispense'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Bus className="h-4 w-4 inline mr-2" />
            Dispense to Bus
          </button>
        </div>

        {/* Purchase Form */}
        {activeTab === 'purchase' && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Plus className="h-5 w-5 text-cyan-600" />
              <h2 className="text-xl font-semibold text-gray-900">Record Urea Purchase</h2>
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

              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <p className="text-sm text-cyan-800">
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

              <Button type="submit" loading={submitting} className="w-full md:w-auto">
                Record Purchase
              </Button>
            </form>
          </div>
        )}

        {/* Dispense Form */}
        {activeTab === 'dispense' && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Bus className="h-5 w-5 text-cyan-600" />
              <h2 className="text-xl font-semibold text-gray-900">Dispense Urea to Bus</h2>
            </div>

            <form onSubmit={handleDispenseSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Bus *
                  </label>
                  <select
                    value={dispenseForm.busId}
                    onChange={(e) => setDispenseForm({ ...dispenseForm, busId: e.target.value })}
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

              {inventory && (
                <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-600">
                  Available stock: <span className="font-bold text-gray-900">{inventory.currentStock.toFixed(2)} L</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispensed By (Optional)
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
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={dispenseForm.notes}
                    onChange={(e) => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
                    className="input-field"
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <Button type="submit" loading={submitting} className="w-full md:w-auto">
                Dispense Urea
              </Button>
            </form>
          </div>
        )}

        {/* Purchase History */}
        <div className="card p-6 mb-6">
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

        {/* Dispense History */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dispense History</h2>

          {filterByDate(dispenses).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {dispenses.length === 0 ? 'No dispenses recorded yet' : 'No dispenses match the selected date range'}
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
                      Dispensed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filterByDate(dispenses).map((dispense) => (
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
                        {dispense.dispensedBy || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {dispense.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteDispense(dispense.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete dispense"
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
      </div>
    </div>
  )
}
