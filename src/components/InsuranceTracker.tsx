'use client'

import { useState } from 'react'
import { Calendar, AlertCircle, Bell, Save } from 'lucide-react'

interface InsuranceTrackerProps {
  busId: string
  insuranceExpiry: string | null
  insuranceReminder: string | null
  onUpdate: () => void
}

export default function InsuranceTracker({
  busId,
  insuranceExpiry,
  insuranceReminder,
  onUpdate,
}: InsuranceTrackerProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    insuranceExpiry: insuranceExpiry
      ? new Date(insuranceExpiry).toISOString().split('T')[0]
      : '',
    insuranceReminder: insuranceReminder
      ? new Date(insuranceReminder).toISOString().split('T')[0]
      : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/fleet/buses/${busId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insuranceExpiry: formData.insuranceExpiry || null,
          insuranceReminder: formData.insuranceReminder || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update insurance information')
      }

      onUpdate()
      alert('Insurance information updated successfully!')
    } catch (error) {
      console.error('Error updating insurance:', error)
      alert('Failed to update insurance information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilExpiry = () => {
    if (!insuranceExpiry) return null
    const expiry = new Date(insuranceExpiry)
    const today = new Date()
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const daysUntilExpiry = getDaysUntilExpiry()
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Status</h3>

        {insuranceExpiry ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                isExpired
                  ? 'bg-red-100'
                  : isExpiringSoon
                  ? 'bg-yellow-100'
                  : 'bg-green-100'
              }`}>
                <AlertCircle className={`h-6 w-6 ${
                  isExpired
                    ? 'text-red-600'
                    : isExpiringSoon
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`} />
              </div>
              <div className="flex-1">
                <h4 className={`text-lg font-semibold ${
                  isExpired
                    ? 'text-red-600'
                    : isExpiringSoon
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {isExpired
                    ? 'Insurance Expired'
                    : isExpiringSoon
                    ? 'Insurance Expiring Soon'
                    : 'Insurance Active'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Expiry Date: {new Date(insuranceExpiry).toLocaleDateString()}
                </p>
                {daysUntilExpiry !== null && (
                  <p className="text-sm text-gray-600">
                    {isExpired
                      ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                      : `${daysUntilExpiry} days remaining`}
                  </p>
                )}
              </div>
            </div>

            {insuranceReminder && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Reminder Set</p>
                  <p className="text-blue-700">
                    You'll be reminded on {new Date(insuranceReminder).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">No insurance information set</p>
            <p className="text-sm text-gray-500 mt-1">
              Add insurance expiry date to track renewal deadlines
            </p>
          </div>
        )}
      </div>

      {/* Update Form */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Insurance Information</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance Expiry Date
            </label>
            <input
              type="date"
              value={formData.insuranceExpiry}
              onChange={(e) =>
                setFormData({ ...formData, insuranceExpiry: e.target.value })
              }
              className="input-field"
            />
            <p className="mt-1 text-xs text-gray-500">
              The date when the current insurance policy expires
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Renewal Reminder Date
            </label>
            <input
              type="date"
              value={formData.insuranceReminder}
              onChange={(e) =>
                setFormData({ ...formData, insuranceReminder: e.target.value })
              }
              className="input-field"
            />
            <p className="mt-1 text-xs text-gray-500">
              When would you like to be reminded about renewal? (e.g., 30 days before expiry)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Tip: Set a reminder date</p>
                <p className="text-blue-700">
                  We recommend setting the reminder 30-60 days before expiry to allow time for
                  renewal processing.
                </p>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2" disabled={loading}>
            <Save className="h-5 w-5" />
            {loading ? 'Saving...' : 'Save Insurance Information'}
          </button>
        </form>
      </div>
    </div>
  )
}
