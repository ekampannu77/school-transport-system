'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface Student {
  id: string
  name: string
  class: string
  section: string | null
  monthlyFee: number
  feeWaiverPercent?: number
}

interface CollectPaymentModalProps {
  student: Student
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CollectPaymentModal({ student, isOpen, onClose, onSuccess }: CollectPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // 1-12

  // Determine current quarter based on month
  const getCurrentQuarter = () => {
    if (currentMonth >= 4 && currentMonth <= 6) return 1
    if (currentMonth >= 7 && currentMonth <= 9) return 2
    if (currentMonth >= 10 && currentMonth <= 12) return 3
    return 4 // Jan-Mar
  }

  // Calculate academic year (e.g., "2025-26")
  const getAcademicYear = () => {
    if (currentMonth >= 4) {
      return `${currentYear}-${String(currentYear + 1).slice(2)}`
    }
    return `${currentYear - 1}-${String(currentYear).slice(2)}`
  }

  const calculateQuarterlyFee = useCallback(() => {
    // If student has a monthly fee
    if (student.monthlyFee) {
      // Quarter is 3 months
      const baseFee = student.monthlyFee * 3
      
      // Apply waiver if any
      if (student.feeWaiverPercent && student.feeWaiverPercent > 0) {
        const waiverAmount = (baseFee * student.feeWaiverPercent) / 100
        return baseFee - waiverAmount
      }
      
      return baseFee
    }
    return 0
  }, [student.monthlyFee, student.feeWaiverPercent])

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        amount: String(calculateQuarterlyFee()),
        remarks: '',
        transactionId: '',
        checkNumber: '',
        bankName: '',
        paymentMethod: 'CASH',
        quarter: getCurrentQuarter(),
        academicYear: getAcademicYear(),
        collectedBy: '',
        paymentDate: new Date().toISOString().split('T')[0],
      }))
    }
  }, [isOpen, calculateQuarterlyFee])

  const [formData, setFormData] = useState({
    amount: String(calculateQuarterlyFee()),
    quarter: getCurrentQuarter(),
    academicYear: getAcademicYear(),
    paymentMethod: 'CASH',
    transactionId: '',
    checkNumber: '',
    bankName: '',
    collectedBy: '',
    remarks: '',
    paymentDate: new Date().toISOString().split('T')[0],
  })

  // Reset amount when student changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      amount: String(calculateQuarterlyFee()),
    }))
  }, [calculateQuarterlyFee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to collect payment')
      }

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      amount: String(calculateQuarterlyFee()),
      quarter: getCurrentQuarter(),
      academicYear: getAcademicYear(),
      paymentMethod: 'CASH',
      transactionId: '',
      checkNumber: '',
      bankName: '',
      collectedBy: '',
      remarks: '',
      paymentDate: new Date().toISOString().split('T')[0],
    })
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Collect Payment</h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.name} - Class {student.class}{student.section ? ` (${student.section})` : ''}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quarter <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.quarter}
                onChange={(e) => setFormData({ ...formData, quarter: parseInt(e.target.value) })}
              >
                <option value={1}>Q1 (Apr-Jun)</option>
                <option value={2}>Q2 (Jul-Sep)</option>
                <option value={3}>Q3 (Oct-Dec)</option>
                <option value={4}>Q4 (Jan-Mar)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2025-26"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="4500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Suggested: ₹{calculateQuarterlyFee().toFixed(2)}
                {student.feeWaiverPercent && student.feeWaiverPercent > 0 &&
                  ` (${student.feeWaiverPercent}% waiver applied)`
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="ONLINE_TRANSFER">Online Transfer</option>
              <option value="CARD">Card</option>
            </select>
          </div>

          {/* Conditional fields based on payment method */}
          {(formData.paymentMethod === 'UPI' || formData.paymentMethod === 'ONLINE_TRANSFER') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                placeholder="UTR/Transaction ID"
              />
            </div>
          )}

          {formData.paymentMethod === 'CHEQUE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cheque Number
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.checkNumber}
                  onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                  placeholder="123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Bank Name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collected By
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.collectedBy}
              onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
              placeholder="Staff name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white px-6 py-2.5 rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Processing...' : 'Collect Payment'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
