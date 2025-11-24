'use client'

import { DollarSign, Gauge, Users, AlertCircle, TrendingUp, Calendar, FileText } from 'lucide-react'

interface BusOverviewProps {
  bus: {
    id: string
    registrationNumber: string
    chassisNumber: string
    seatingCapacity: number
    purchaseDate: string
    totalExpenses: number
    mileage: number
    mileageData: {
      kmPerLitre: number
      totalDistance: number
      totalLitres: number
      fuelRecordsCount: number
    }
    _count: {
      expenses: number
      students: number
      reminders: number
      documents: number
    }
    recentExpenses: Array<{
      id: string
      category: string
      amount: number
      date: string
      description: string | null
      odometerReading: number | null
    }>
    expensesByCategory: Record<string, number>
    reminders: Array<{
      id: string
      type: string
      dueDate: string
      notes: string | null
    }>
  }
}

export default function BusOverview({ bus }: BusOverviewProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Fuel: 'bg-blue-100 text-blue-800',
      Maintenance: 'bg-orange-100 text-orange-800',
      Salary: 'bg-green-100 text-green-800',
      Insurance: 'bg-purple-100 text-purple-800',
      Other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.Other
  }

  const getReminderColor = (type: string) => {
    const colors: Record<string, string> = {
      Maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
      Insurance: 'bg-purple-100 text-purple-800 border-purple-200',
      Inspection: 'bg-blue-100 text-blue-800 border-blue-200',
      Other: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[type] || colors.Other
  }

  const totalExpensesByCategory = Object.entries(bus.expensesByCategory).sort(
    ([, a], [, b]) => b - a
  )

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{bus.totalExpenses.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">{bus._count.expenses} records</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Mileage</p>
              <p className="text-2xl font-bold text-gray-900">
                {bus.mileage > 0 ? `${bus.mileage} km/L` : 'No data'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {bus.mileageData.fuelRecordsCount} fuel records
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Gauge className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">{bus._count.students}</p>
              <p className="text-xs text-gray-400 mt-1">
                of {bus.seatingCapacity} capacity
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pending Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{bus._count.reminders}</p>
              <p className="text-xs text-gray-400 mt-1">Requires attention</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {bus.mileageData.fuelRecordsCount > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Distance Traveled</p>
              <p className="text-xl font-semibold text-gray-900">
                {bus.mileageData.totalDistance.toLocaleString()} km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Fuel Consumed</p>
              <p className="text-xl font-semibold text-gray-900">
                {bus.mileageData.totalLitres.toLocaleString()} L
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Fuel Efficiency</p>
              <p className="text-xl font-semibold text-gray-900">
                {bus.mileage} km/L
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
            Expenses by Category
          </h3>
          {totalExpensesByCategory.length > 0 ? (
            <div className="space-y-4">
              {totalExpensesByCategory.map(([category, amount]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`badge ${getCategoryColor(category)}`}>
                      {category}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${(amount / bus.totalExpenses) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expense data available</p>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary-600" />
            Recent Expenses
          </h3>
          {bus.recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {bus.recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-xs ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600">{expense.description}</p>
                    )}
                    {expense.odometerReading && (
                      <p className="text-xs text-gray-400 mt-1">
                        Odometer: {expense.odometerReading.toLocaleString()} km
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{expense.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
          )}
        </div>
      </div>

      {/* Pending Reminders */}
      {bus.reminders.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
            Pending Reminders
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bus.reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-lg border ${getReminderColor(reminder.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{reminder.type}</p>
                    {reminder.notes && (
                      <p className="text-sm text-gray-600 mt-1">{reminder.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Due: {new Date(reminder.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bus Information Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary-600" />
          Bus Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Registration Number</p>
            <p className="text-base font-medium text-gray-900">{bus.registrationNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Chassis Number</p>
            <p className="text-base font-medium text-gray-900">{bus.chassisNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Purchase Date</p>
            <p className="text-base font-medium text-gray-900">
              {new Date(bus.purchaseDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Seating Capacity</p>
            <p className="text-base font-medium text-gray-900">{bus.seatingCapacity} seats</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Documents</p>
            <p className="text-base font-medium text-gray-900">{bus._count.documents} files</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expense Records</p>
            <p className="text-base font-medium text-gray-900">{bus._count.expenses} entries</p>
          </div>
        </div>
      </div>
    </div>
  )
}
