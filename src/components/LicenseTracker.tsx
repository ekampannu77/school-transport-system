'use client'

import { useState } from 'react'
import { Calendar, AlertCircle, Bell, Save } from 'lucide-react'

interface LicenseTrackerProps {
  driverId: string
  licenseExpiry: string | null
  licenseReminder: string | null
  onUpdate: () => void
}

export default function LicenseTracker({
  driverId,
  licenseExpiry,
  licenseReminder,
  onUpdate,
}: LicenseTrackerProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    licenseExpiry: licenseExpiry
      ? new Date(licenseExpiry).toISOString().split('T')[0]
      : '',
    licenseReminder: licenseReminder
      ? new Date(licenseReminder).toISOString().split('T')[0]
      : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseExpiry: formData.licenseExpiry || null,
          licenseReminder: formData.licenseReminder || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update license information')
      }

      onUpdate()
      alert('License information updated successfully!')
    } catch (error) {
      console.error('Error updating license:', error)
      alert('Failed to update license information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getDaysUntilExpiry = () => {
    if (!licenseExpiry) return null
    const expiry = new Date(licenseExpiry)
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">License Status</h3>

        {licenseExpiry ? (
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
                    ? 'License Expired'
                    : isExpiringSoon
                    ? 'License Expiring Soon'
                    : 'License Valid'}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Expiry Date: {new Date(licenseExpiry).toLocaleDateString()}
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

            {licenseReminder && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Reminder Set</p>
                  <p className="text-blue-700">
                    You'll be reminded on {new Date(licenseReminder).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">No license information set</p>
            <p className="text-sm text-gray-500 mt-1">
              Add license expiry date to track renewal deadlines
            </p>
          </div>
        )}
      </div>

      {/* Update Form */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Update License Information</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Expiry Date
            </label>
            <input
              type="date"
              value={formData.licenseExpiry}
              onChange={(e) =>
                setFormData({ ...formData, licenseExpiry: e.target.value })
              }
              className="input-field"
            />
            <p className="mt-1 text-xs text-gray-500">
              The date when the current license expires
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Renewal Reminder Date
            </label>
            <input
              type="date"
              value={formData.licenseReminder}
              onChange={(e) =>
                setFormData({ ...formData, licenseReminder: e.target.value })
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
            {loading ? 'Saving...' : 'Save License Information'}
          </button>
        </form>
      </div>
    </div>
  )
}
