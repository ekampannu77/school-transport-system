'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          It might have been moved or deleted.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
