'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'

interface StatusHistory {
  id: string
  status: string
  startDate: string
  endDate: string | null
  reason: string | null
  createdAt: string
}

interface StudentStatusModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { date: string; reason?: string }) => Promise<void>
  studentName: string
  currentStatus: boolean // isActive
  statusHistory?: StatusHistory[]
  loading?: boolean
}

export default function StudentStatusModal({
  isOpen,
  onClose,
  onConfirm,
  studentName,
  currentStatus,
  statusHistory = [],
  loading = false,
}: StudentStatusModalProps) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default to today's date
      const today = new Date().toISOString().split('T')[0]
      setDate(today)
      setReason('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date) return

    setSubmitting(true)
    try {
      await onConfirm({ date, reason: reason || undefined })
      onClose()
    } catch (error) {
      console.error('Error updating student status:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const isMarkingInactive = currentStatus // If currently active, we're marking inactive
  const title = isMarkingInactive ? 'Mark Student Inactive' : 'Reactivate Student'

  // Filter inactive periods (status === 'inactive' with an endDate means completed inactive period)
  const inactivePeriods = statusHistory.filter(h => h.status === 'inactive')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            {isMarkingInactive ? (
              <>You are about to mark <strong>{studentName}</strong> as inactive.</>
            ) : (
              <>You are about to reactivate <strong>{studentName}</strong>.</>
            )}
          </p>

          {/* Show inactive history - for both active and inactive students */}
          {inactivePeriods.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-medium text-amber-800">
                  {isMarkingInactive ? 'Previous Inactive Periods' : 'Inactive History'}
                </h3>
              </div>
              {loading ? (
                <div className="text-sm text-amber-600 pl-6">Loading history...</div>
              ) : (
                <div className="space-y-2">
                  {inactivePeriods.map((period) => (
                    <div key={period.id} className="text-sm text-amber-700 pl-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(period.startDate)}
                          {period.endDate ? (
                            <> to {formatDate(period.endDate)}</>
                          ) : (
                            <span className="text-red-600 font-medium"> to present (currently inactive)</span>
                          )}
                        </span>
                      </div>
                      {period.reason && (
                        <p className="text-xs text-amber-600 mt-1 ml-5">
                          Reason: {period.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Show current inactive period info when reactivating */}
          {!isMarkingInactive && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  The current inactive period will be closed with today&apos;s date.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Date picker */}
            <div className="mb-4">
              <label htmlFor="status-date" className="block text-sm font-medium text-gray-700 mb-1">
                {isMarkingInactive ? 'Inactive from date' : 'Reactivation date'}
              </label>
              <input
                type="date"
                id="status-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Reason (only for marking inactive) */}
            {isMarkingInactive && (
              <div className="mb-4">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="e.g., Left school, Moved to different area..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isMarkingInactive
                    ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                } disabled:opacity-50`}
                disabled={submitting || !date}
              >
                {submitting ? 'Processing...' : isMarkingInactive ? 'Mark Inactive' : 'Reactivate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
