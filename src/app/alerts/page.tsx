import { Suspense } from 'react'
import AlertsList from '@/components/AlertsList'

export default function AlertsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alerts & Reminders</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track expiring licenses, insurance, and maintenance schedules
        </p>
      </div>

      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsList />
      </Suspense>
    </div>
  )
}

function AlertsSkeleton() {
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
