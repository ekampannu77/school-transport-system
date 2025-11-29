'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DriverDetailsContent from '@/components/DriverDetailsContent'

function DriverDetailsSkeleton() {
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

export default function DriverDetailsPage({ params }: { params: { driverId: string } }) {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    // Fetch just the role to set the correct title
    fetch(`/api/drivers/${params.driverId}`)
      .then(res => res.json())
      .then(data => setRole(data.role))
      .catch(() => setRole('driver'))
  }, [params.driverId])

  const isDriver = role === 'driver'
  const title = isDriver ? 'Driver Details' : 'Conductor Details'
  const description = isDriver
    ? 'Manage driver information, documents, and license details'
    : 'Manage conductor information and documents'

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/drivers"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Drivers
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>

      <Suspense fallback={<DriverDetailsSkeleton />}>
        <DriverDetailsContent driverId={params.driverId} />
      </Suspense>
    </div>
  )
}
