'use client'

import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'

interface Bus {
  id: string
  registrationNumber: string
}

export default function ExpenseForm() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    busId: '',
    category: 'Fuel',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    odometerReading: '',
    receiptImageUrl: '',
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
            <option value="Maintenance">Maintenance</option>
            <option value="Salary">Salary</option>
            <option value="Insurance">Insurance</option>
            <option value="Other">Other</option>
          </select>
        </div>

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
