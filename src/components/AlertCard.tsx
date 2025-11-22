import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { ExpiryAlert } from '@/lib/services/alerts'

interface AlertCardProps {
  alert: ExpiryAlert
  onResolve?: (id: string) => void
}

export default function AlertCard({ alert, onResolve }: AlertCardProps) {
  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
    },
  }

  const config = severityConfig[alert.severity]
  const Icon = config.icon

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.textColor}`}>{alert.message}</h3>
          <div className="mt-2 text-sm text-gray-600">
            <p>
              Due: {new Date(alert.dueDate).toLocaleDateString()} ({alert.daysRemaining} days
              remaining)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
