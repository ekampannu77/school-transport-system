import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  href?: string
}

export default function StatCard({ title, value, icon: Icon, trend, subtitle, href }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`ml-2 text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className="ml-4">
          <div className="bg-primary-100 rounded-full p-3">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
        </div>
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className="card p-6 hover:shadow-lg transition-shadow cursor-pointer block">
        {content}
      </Link>
    )
  }

  return <div className="card p-6">{content}</div>
}
