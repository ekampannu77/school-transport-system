import { Suspense } from 'react'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseList from '@/components/ExpenseList'

export default function ExpensesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track and manage all fleet-related expenses
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ExpenseForm />
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<ExpenseListSkeleton />}>
            <ExpenseList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ExpenseListSkeleton() {
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
