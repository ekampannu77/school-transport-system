'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Droplet, AlertTriangle } from 'lucide-react'

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

interface InventorySummary {
  currentStock: number
  totalPurchased: number
  totalDispensed: number
}

export default function FuelInventoryPage() {
  const [inventory, setInventory] = useState<InventorySummary | null>(null)
  const [purchases, setPurchases] = useState<FuelPurchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    pricePerLitre: '',
    vendor: '',
    invoiceNumber: '',
    notes: '',
  })

  useEffect(() => {
    fetchInventory()
    fetchPurchases()
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

        {/* Inventory Summary */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Droplet className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Fuel Stock</p>
                  <p className="text-4xl font-bold text-gray-900">
                    {(inventory?.currentStock ?? 0).toFixed(2)} L
                  </p>
                </div>
              </div>
              {inventory && inventory.currentStock < 100 && (
                <div className="flex items-center gap-2 mt-3 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Low stock warning</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
        </div>

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

          {purchases.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Droplet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No purchases recorded yet</p>
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
                  {purchases && purchases.length > 0 ? purchases.map((purchase) => (
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
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No purchases recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
