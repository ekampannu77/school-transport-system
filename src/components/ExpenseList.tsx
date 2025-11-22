'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Calendar, FileText, X } from 'lucide-react'

interface Expense {
  id: string
  category: string
  amount: number
  date: string
  description: string | null
  odometerReading: number | null
  receiptImageUrl: string | null
  bus: {
    registrationNumber: string
  }
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const response = await fetch('/api/expenses/log')
        const data = await response.json()
        setExpenses(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching expenses:', error)
        setExpenses([])
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Fuel: 'bg-blue-100 text-blue-800',
      Maintenance: 'bg-orange-100 text-orange-800',
      Salary: 'bg-green-100 text-green-800',
      Insurance: 'bg-purple-100 text-purple-800',
      Other: 'bg-gray-100 text-gray-800',
    }
    return colors[category as keyof typeof colors] || colors.Other
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>

      <div className="space-y-4">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${getCategoryColor(expense.category)}`}>
                    {expense.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {expense.bus.registrationNumber}
                  </span>
                </div>
                {expense.description && (
                  <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(expense.date).toLocaleDateString()}
                  </div>
                  {expense.odometerReading && (
                    <div>Odometer: {expense.odometerReading.toLocaleString()} km</div>
                  )}
                  {expense.receiptImageUrl && (
                    <button
                      onClick={() => setSelectedReceipt(expense.receiptImageUrl)}
                      className="flex items-center gap-1 text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      View Receipt
                    </button>
                  )}
                </div>
              </div>
              <div className="ml-4 flex items-center">
                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-lg font-semibold text-gray-900">
                  ₹{expense.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by logging your first expense.
          </p>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="bg-white rounded-lg p-4">
              <img
                src={selectedReceipt}
                alt="Receipt"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
