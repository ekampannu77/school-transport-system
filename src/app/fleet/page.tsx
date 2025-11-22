import { Suspense } from 'react'
import FleetTable from '@/components/FleetTable'

export default function FleetPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage your school bus fleet
        </p>
      </div>

      <Suspense fallback={<FleetTableSkeleton />}>
        <FleetTable />
      </Suspense>
    </div>
  )
}

function FleetTableSkeleton() {
  return (
    <div className="card p-6">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
}
