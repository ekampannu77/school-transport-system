import RoutesTable from '@/components/RoutesTable'

export default function RoutesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
        <p className="text-gray-600 mt-1">Manage your bus routes and assignments</p>
      </div>
      <RoutesTable />
    </div>
  )
}
