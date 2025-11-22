import DriversTable from '@/components/DriversTable'

export default function DriversPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
        <p className="text-gray-600 mt-1">Manage your fleet drivers and their information</p>
      </div>
      <DriversTable />
    </div>
  )
}
