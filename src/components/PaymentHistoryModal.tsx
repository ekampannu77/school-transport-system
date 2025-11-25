'use client'

import { useState, useEffect } from 'react'
import { X, Receipt } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  paymentDate: string
  quarter: number
  academicYear: string
  paymentMethod: string
  receiptNumber: string
  transactionId?: string
  checkNumber?: string
  bankName?: string
  collectedBy?: string
  remarks?: string
}

interface Student {
  id: string
  name: string
  class: string
  section: string | null
  monthlyFee: number
  feePaid: number | null
}

interface PaymentHistoryModalProps {
  student: Student
  isOpen: boolean
  onClose: () => void
}

export default function PaymentHistoryModal({ student, isOpen, onClose }: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && student) {
      fetchPayments()
    }
  }, [isOpen, student])

  const fetchPayments = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/payments?studentId=${student.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payments')
      }

      setPayments(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getPaymentMethodDisplay = (method: string) => {
    const methods: { [key: string]: string } = {
      'CASH': 'Cash',
      'CHEQUE': 'Cheque',
      'UPI': 'UPI',
      'ONLINE_TRANSFER': 'Online Transfer',
      'CARD': 'Card'
    }
    return methods[method] || method
  }

  const getQuarterName = (quarter: number) => {
    const quarters: { [key: number]: string } = {
      1: 'Q1 (Apr-Jun)',
      2: 'Q2 (Jul-Sep)',
      3: 'Q3 (Oct-Dec)',
      4: 'Q4 (Jan-Mar)'
    }
    return quarters[quarter] || `Q${quarter}`
  }

  // Calculate quarter-wise payment status
  const getQuarterStatus = (academicYear: string) => {
    const quarters = [1, 2, 3, 4]
    return quarters.map(q => {
      const payment = payments.find(p => p.quarter === q && p.academicYear === academicYear)
      return {
        quarter: q,
        paid: !!payment,
        amount: payment?.amount || 0,
        payment
      }
    })
  }

  // Get current academic year
  const getCurrentAcademicYear = () => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    if (currentMonth >= 4) {
      return `${currentYear}-${String(currentYear + 1).slice(2)}`
    }
    return `${currentYear - 1}-${String(currentYear).slice(2)}`
  }

  if (!isOpen) return null

  const currentAcademicYear = getCurrentAcademicYear()
  const quarterStatus = getQuarterStatus(currentAcademicYear)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
            <p className="text-sm text-gray-600 mt-1">
              {student.name} - Class {student.class}{student.section ? ` (${student.section})` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Year ({currentAcademicYear})</h3>
            <div className="grid grid-cols-4 gap-3">
              {quarterStatus.map(({ quarter, paid, amount }) => (
                <div
                  key={quarter}
                  className={`p-3 rounded-md text-center ${
                    paid ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="text-xs text-gray-600">{getQuarterName(quarter)}</div>
                  <div className={`text-lg font-semibold mt-1 ${paid ? 'text-green-700' : 'text-gray-400'}`}>
                    {paid ? '✓' : '○'}
                  </div>
                  {paid && <div className="text-xs text-gray-600 mt-1">₹{amount.toFixed(0)}</div>}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly Fee:</span>
                <span className="font-medium">₹{student.monthlyFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-semibold text-green-600">₹{(student.feePaid || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">All Transactions</h3>

            {loading && (
              <div className="text-center py-8 text-gray-500">Loading payments...</div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {!loading && !error && payments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No payments recorded yet
              </div>
            )}

            {!loading && !error && payments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Receipt #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quarter
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Receipt className="h-4 w-4 text-gray-400" />
                            {payment.receiptNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {getQuarterName(payment.quarter)} {payment.academicYear}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{payment.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {getPaymentMethodDisplay(payment.paymentMethod)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.transactionId && (
                            <div className="text-xs">TXN: {payment.transactionId}</div>
                          )}
                          {payment.checkNumber && (
                            <div className="text-xs">Cheque: {payment.checkNumber}</div>
                          )}
                          {payment.collectedBy && (
                            <div className="text-xs text-gray-500">By: {payment.collectedBy}</div>
                          )}
                          {payment.remarks && (
                            <div className="text-xs text-gray-500 italic">{payment.remarks}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
