import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BusDetailsContent from '@/components/BusDetailsContent'

export default function BusDetailsPage({ params }: { params: { busId: string } }) {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/fleet"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fleet
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Bus Details</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage bus information, documents, and insurance
        </p>
      </div>

      <Suspense fallback={<BusDetailsSkeleton />}>
        <BusDetailsContent busId={params.busId} />
      </Suspense>
    </div>
  )
}

function BusDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  )
}
