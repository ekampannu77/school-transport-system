'use client'

import { useState, useEffect } from 'react'
import { Upload, Fuel, Droplet, AlertCircle, Clock } from 'lucide-react'
import { calculateDaysRemaining } from '@/lib/dateUtils'

interface Bus {
  id: string
  registrationNumber: string
}

interface InventoryInfo {
  currentStock: number
  lastDispense: {
    date: string
    quantity: number
    daysAgo: number
  } | null
}

export default function ExpenseForm() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [inventoryInfo, setInventoryInfo] = useState<InventoryInfo | null>(null)
  const [loadingInventoryInfo, setLoadingInventoryInfo] = useState(false)
  const [formData, setFormData] = useState({
    busId: '',
    category: 'Fuel',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    odometerReading: '',
    receiptImageUrl: '',
    pricePerLitre: '',
    litresFilled: '',
  })

  useEffect(() => {
    async function fetchBuses() {
      try {
        const response = await fetch('/api/fleet/buses')
        const data = await response.json()
        setBuses(data)
      } catch (error) {
        console.error('Error fetching buses:', error)
      }
    }
    fetchBuses()
  }, [])

  // Fetch inventory and last dispense when Fuel or Urea category is selected or bus changes
  useEffect(() => {
    async function fetchInventoryInfo() {
      const isFuelOrUrea = formData.category === 'Fuel' || formData.category === 'Urea'
      if (!isFuelOrUrea) {
        setInventoryInfo(null)
        return
      }

      setLoadingInventoryInfo(true)
      try {
        // Fetch inventory based on category
        const inventoryEndpoint = formData.category === 'Fuel' ? '/api/fuel/inventory' : '/api/urea/inventory'
        const inventoryRes = await fetch(inventoryEndpoint)
        const inventoryData = await inventoryRes.json()

        let lastDispense = null

        // Fetch last dispense for selected bus
        if (formData.busId) {
          const dispensesEndpoint = formData.category === 'Fuel'
            ? `/api/fuel/dispenses?busId=${formData.busId}`
            : `/api/urea/dispenses?busId=${formData.busId}`
          const dispensesRes = await fetch(dispensesEndpoint)
          const dispensesData = await dispensesRes.json()

          if (dispensesData.length > 0) {
            const latestDispense = dispensesData[0] // Already sorted by date desc
            const daysAgo = Math.abs(calculateDaysRemaining(latestDispense.date))
            lastDispense = {
              date: latestDispense.date,
              quantity: latestDispense.quantity,
              daysAgo,
            }
          }
        }

        setInventoryInfo({
          currentStock: inventoryData.currentStock || 0,
          lastDispense,
        })
      } catch (error) {
        console.error('Error fetching inventory info:', error)
      } finally {
        setLoadingInventoryInfo(false)
      }
    }

    fetchInventoryInfo()
  }, [formData.category, formData.busId])

  // Auto-calculate amount for fuel/urea expenses
  useEffect(() => {
    const isFuelOrUrea = formData.category === 'Fuel' || formData.category === 'Urea'
    if (isFuelOrUrea && formData.pricePerLitre && formData.litresFilled) {
      const price = parseFloat(formData.pricePerLitre)
      const litres = parseFloat(formData.litresFilled)
      if (!isNaN(price) && !isNaN(litres)) {
        const total = (price * litres).toFixed(2)
        setFormData(prev => ({ ...prev, amount: total }))
      }
    }
  }, [formData.pricePerLitre, formData.litresFilled, formData.category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/expenses/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          odometerReading: formData.odometerReading
            ? parseInt(formData.odometerReading)
            : null,
          pricePerLitre: formData.pricePerLitre && (formData.category === 'Fuel' || formData.category === 'Urea')
            ? parseFloat(formData.pricePerLitre)
            : null,
          litresFilled: formData.litresFilled && (formData.category === 'Fuel' || formData.category === 'Urea')
            ? parseFloat(formData.litresFilled)
            : null,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        // Reset form
        setFormData({
          busId: '',
          category: 'Fuel',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          odometerReading: '',
          receiptImageUrl: '',
          pricePerLitre: '',
          litresFilled: '',
        })
        // Reload the page to show new expense
        window.location.reload()
      } else {
        alert('Failed to log expense')
      }
    } catch (error) {
      console.error('Error logging expense:', error)
      alert('Error logging expense')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real application, you would upload to a cloud storage service
      // For now, we'll use a local file URL (for demonstration)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, receiptImageUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Log New Expense</h2>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">Expense logged successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bus</label>
          <select
            value={formData.busId}
            onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input-field"
            required
          >
            <option value="Fuel">Fuel</option>
            <option value="Urea">Urea</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Salary">Salary</option>
            <option value="Insurance">Insurance</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Inventory Info Panel - shows when Fuel or Urea category is selected */}
        {(formData.category === 'Fuel' || formData.category === 'Urea') && (
          <div className={`${formData.category === 'Fuel' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border rounded-lg p-4 space-y-3`}>
            <div className={`flex items-center gap-2 ${formData.category === 'Fuel' ? 'text-blue-800' : 'text-purple-800'} font-medium`}>
              {formData.category === 'Fuel' ? <Fuel className="h-5 w-5" /> : <Droplet className="h-5 w-5" />}
              <span>{formData.category} Inventory Info</span>
            </div>

            {loadingInventoryInfo ? (
              <div className={`text-sm ${formData.category === 'Fuel' ? 'text-blue-600' : 'text-purple-600'}`}>
                Loading {formData.category.toLowerCase()} information...
              </div>
            ) : inventoryInfo ? (
              <div className="space-y-2">
                {/* Available Stock */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available in Stock:</span>
                  <span className={`font-semibold ${inventoryInfo.currentStock > 50 ? 'text-green-600' : inventoryInfo.currentStock > 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {inventoryInfo.currentStock.toFixed(2)} litres
                  </span>
                </div>

                {/* Low Stock Warning */}
                {inventoryInfo.currentStock < 50 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Low {formData.category.toLowerCase()} stock! Consider purchasing more.</span>
                  </div>
                )}

                {/* Last Dispense Info - only when bus is selected */}
                {formData.busId && inventoryInfo.lastDispense && (
                  <div className={`pt-2 border-t ${formData.category === 'Fuel' ? 'border-blue-200' : 'border-purple-200'}`}>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last dispensed: <strong>{inventoryInfo.lastDispense.quantity} litres</strong>,{' '}
                        <strong className={inventoryInfo.lastDispense.daysAgo > 7 ? 'text-orange-600' : 'text-gray-900'}>
                          {inventoryInfo.lastDispense.daysAgo === 0
                            ? 'today'
                            : inventoryInfo.lastDispense.daysAgo === 1
                              ? '1 day ago'
                              : `${inventoryInfo.lastDispense.daysAgo} days ago`}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {formData.busId && !inventoryInfo.lastDispense && (
                  <div className={`pt-2 border-t ${formData.category === 'Fuel' ? 'border-blue-200' : 'border-purple-200'} text-sm text-gray-500`}>
                    No previous {formData.category.toLowerCase()} dispense records for this bus.
                  </div>
                )}

                {!formData.busId && (
                  <div className={`text-sm ${formData.category === 'Fuel' ? 'text-blue-600' : 'text-purple-600'} italic`}>
                    Select a bus to see its last dispense info.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {(formData.category === 'Fuel' || formData.category === 'Urea') ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Litre (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerLitre}
                  onChange={(e) => setFormData({ ...formData, pricePerLitre: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 105.50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Litres Filled
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.litresFilled}
                  onChange={(e) => setFormData({ ...formData, litresFilled: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field bg-gray-50"
                placeholder="Auto-calculated"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Calculated automatically from price per litre × litres filled
              </p>
            </div>

            {formData.category === 'Fuel' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer Reading (km)
                </label>
                <input
                  type="number"
                  value={formData.odometerReading}
                  onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 45000"
                />
              </div>
            )}
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            rows={3}
            placeholder="Optional notes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receipt Image (Optional)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
          {formData.receiptImageUrl && (
            <p className="mt-2 text-sm text-green-600">Receipt uploaded successfully</p>
          )}
        </div>

        <button type="submit" className="w-full btn-primary" disabled={loading}>
          {loading ? 'Logging...' : 'Log Expense'}
        </button>
      </form>
    </div>
  )
}
