'use client'

import { useState, useEffect } from 'react'
import { IndianRupee, Bus, Users, Calendar, Trash2 } from 'lucide-react'

interface BusStats {
  busId: string
  registrationNumber: string
  privateOwnerName: string
  privateOwnerContact: string | null
  privateOwnerBank: string | null
  schoolCommission: number
  studentCount: number
  totalRevenue: number
  commission: number
  netRevenue: number
  totalPaid: number
  totalPending: number
  amountOwing: number
  monthlyExpected: number
  lastPaymentDate: string | null
}

interface Payment {
  id: string
  busId: string
  amount: number
  paymentDate: string
  periodStartDate: string
  periodEndDate: string
  paymentMethod: string
  transactionRef: string | null
  notes: string | null
  status: string
  bus: {
    registrationNumber: string
    privateOwnerName: string
  }
}

export default function PrivateBusesPage() {
  const [busStats, setBusStats] = useState<BusStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedBus, setSelectedBus] = useState<BusStats | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    periodStartDate: '',
    periodEndDate: '',
    paymentMethod: 'CASH',
    transactionRef: '',
    notes: '',
  })

  useEffect(() => {
    fetchBusStats()
  }, [])

  const fetchBusStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bus-owner-payments/stats')
      const data = await response.json()
      setBusStats(data)
    } catch (error) {
      console.error('Error fetching bus stats:', error)
      setError('Failed to fetch bus statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentHistory = async (busId: string) => {
    try {
      const response = await fetch(`/api/bus-owner-payments?busId=${busId}`)
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payment history:', error)
    }
  }

  const handleRecordPayment = (bus: BusStats) => {
    setSelectedBus(bus)
    setPaymentForm({
      amount: bus.amountOwing > 0 ? bus.amountOwing.toString() : '',
      paymentDate: new Date().toISOString().split('T')[0],
      periodStartDate: '',
      periodEndDate: '',
      paymentMethod: 'CASH',
      transactionRef: '',
      notes: '',
    })
    setShowPaymentModal(true)
  }

  const handleViewHistory = async (bus: BusStats) => {
    setSelectedBus(bus)
    await fetchPaymentHistory(bus.busId)
    setShowHistoryModal(true)
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBus) return

    try {
      const response = await fetch('/api/bus-owner-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          busId: selectedBus.busId,
          ...paymentForm,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to record payment')
      }

      // Refresh stats and close modal
      await fetchBusStats()
      setShowPaymentModal(false)
      setSelectedBus(null)
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/bus-owner-payments?id=${paymentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete payment')
      }

      // Refresh payment history and stats
      if (selectedBus) {
        await fetchPaymentHistory(selectedBus.busId)
      }
      await fetchBusStats()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
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
          <p className="text-gray-600">Loading private buses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchBusStats} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const totalStats = busStats.reduce(
    (acc, bus) => ({
      totalRevenue: acc.totalRevenue + bus.totalRevenue,
      totalCommission: acc.totalCommission + bus.commission,
      totalPaid: acc.totalPaid + bus.totalPaid,
      totalOwing: acc.totalOwing + bus.amountOwing,
    }),
    { totalRevenue: 0, totalCommission: 0, totalPaid: 0, totalOwing: 0 }
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Private Bus Payments</h1>
          <p className="text-gray-600">Track revenue collection and payments to private bus owners</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Paid to Owners</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalStats.totalPaid)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Private Buses</p>
                <p className="text-2xl font-bold text-gray-900">{busStats.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bus List */}
        {busStats.length === 0 ? (
          <div className="card p-12 text-center">
            <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Private Buses</h3>
            <p className="text-gray-600">No private buses have been added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {busStats.map((bus) => (
              <div key={bus.busId} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Bus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{bus.registrationNumber}</h3>
                      <p className="text-gray-600">{bus.privateOwnerName}</p>
                      {bus.privateOwnerContact && (
                        <p className="text-sm text-gray-500">{bus.privateOwnerContact}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{bus.studentCount} students</span>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm text-blue-800">Fees Collected</span>
                    <span className="font-semibold text-blue-900">{formatCurrency(bus.totalRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm text-green-800">Paid to Owner</span>
                    <span className="font-semibold text-green-900">{formatCurrency(bus.totalPaid)}</span>
                  </div>
                  <div className={`flex items-center justify-between p-3 rounded-lg border ${bus.amountOwing > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <span className={`text-sm ${bus.amountOwing > 0 ? 'text-red-800' : 'text-gray-600'}`}>Amount Owing</span>
                    <span className={`font-semibold ${bus.amountOwing > 0 ? 'text-red-900' : 'text-gray-900'}`}>{formatCurrency(bus.amountOwing)}</span>
                  </div>
                </div>

                {/* Last Payment & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Last payment: {formatDate(bus.lastPaymentDate)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewHistory(bus)}
                      className="btn-secondary text-sm"
                    >
                      View History
                    </button>
                    <button
                      onClick={() => handleRecordPayment(bus)}
                      className="btn-primary text-sm"
                      disabled={bus.amountOwing <= 0}
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Record Payment - {selectedBus.registrationNumber}
            </h2>
            <p className="text-sm text-gray-600 mb-4">Owner: {selectedBus.privateOwnerName}</p>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="input-field"
                  placeholder="Enter amount"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount owing: {formatCurrency(selectedBus.amountOwing)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    value={paymentForm.periodStartDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, periodStartDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period End *
                  </label>
                  <input
                    type="date"
                    value={paymentForm.periodEndDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, periodEndDate: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="ONLINE_TRANSFER">Online Transfer</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  className="input-field"
                  placeholder="Transaction ID / Cheque number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedBus(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment History - {selectedBus.registrationNumber}
            </h2>
            <p className="text-sm text-gray-600 mb-6">Owner: {selectedBus.privateOwnerName}</p>

            {payments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payment history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(payment.paymentDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            payment.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {payment.status}
                        </span>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Payment Method</p>
                        <p className="font-medium text-gray-900">{payment.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Period</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(payment.periodStartDate)} - {formatDate(payment.periodEndDate)}
                        </p>
                      </div>
                      {payment.transactionRef && (
                        <div>
                          <p className="text-gray-600">Transaction Ref</p>
                          <p className="font-medium text-gray-900">{payment.transactionRef}</p>
                        </div>
                      )}
                      {payment.notes && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Notes</p>
                          <p className="font-medium text-gray-900">{payment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowHistoryModal(false)
                  setSelectedBus(null)
                  setPayments([])
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
