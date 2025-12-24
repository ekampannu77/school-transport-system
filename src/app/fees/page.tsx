'use client'

import { useState, useEffect } from 'react'
import { Search, DollarSign, Receipt, Filter } from 'lucide-react'
import CollectPaymentModal from '@/components/CollectPaymentModal'
import PaymentHistoryModal from '@/components/PaymentHistoryModal'

interface Student {
  id: string
  name: string
  class: string
  section: string | null
  village: string
  monthlyFee: number
  feePaid: number
  feeWaiverPercent?: number
  bus: {
    registrationNumber: string
  }
  isActive: boolean
}

interface Payment {
  quarter: number
  academicYear: string
}

export default function FeeCollectionPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const [filterBus, setFilterBus] = useState('')
  const [studentPayments, setStudentPayments] = useState<{ [key: string]: Payment[] }>({})

  const fetchPaymentsForStudents = async (studentList: Student[]) => {
    try {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const academicYear = currentMonth >= 4
        ? `${currentYear}-${String(currentYear + 1).slice(2)}`
        : `${currentYear - 1}-${String(currentYear).slice(2)}`

      const response = await fetch(`/api/payments?academicYear=${academicYear}`)
      const payments = await response.json()

      // Group payments by student ID
      const paymentsByStudent: { [key: string]: Payment[] } = {}
      payments.forEach((payment: any) => {
        if (!paymentsByStudent[payment.studentId]) {
          paymentsByStudent[payment.studentId] = []
        }
        paymentsByStudent[payment.studentId].push({
          quarter: payment.quarter,
          academicYear: payment.academicYear
        })
      })

      setStudentPayments(paymentsByStudent)
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      // Fetch all active students with a large page size
      const response = await fetch('/api/students?isActive=true&pageSize=1000')
      const result = await response.json()

      // Handle both paginated response and direct array response
      const studentList = Array.isArray(result) ? result : (result.data || [])

      setStudents(studentList)
      setFilteredStudents(studentList)

      // Fetch payments for all students
      if (studentList.length > 0) {
        fetchPaymentsForStudents(studentList)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filterStudentsData = () => {
    let filtered = students

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.village.toLowerCase().includes(term) ||
        s.bus.registrationNumber.toLowerCase().includes(term)
      )
    }

    // Class filter
    if (filterClass) {
      filtered = filtered.filter(s => s.class === filterClass)
    }

    // Bus filter
    if (filterBus) {
      filtered = filtered.filter(s => s.bus.registrationNumber === filterBus)
    }

    setFilteredStudents(filtered)
  }

  useEffect(() => {
    filterStudentsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, students, filterClass, filterBus])

  const handleCollectPayment = (student: Student) => {
    setSelectedStudent(student)
    setShowPaymentModal(true)
  }

  const handleShowPaymentHistory = (student: Student) => {
    setSelectedStudent(student)
    setShowPaymentHistory(true)
  }

  const handlePaymentSuccess = () => {
    fetchStudents() // Refresh data
  }

  const getQuartersPaid = (studentId: string) => {
    return studentPayments[studentId] || []
  }

  const getQuarterStatus = (studentId: string, quarter: number) => {
    const payments = getQuartersPaid(studentId)
    return payments.some(p => p.quarter === quarter)
  }

  // Get unique classes and buses for filters
  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort()
  const uniqueBuses = Array.from(new Set(students.map(s => s.bus.registrationNumber))).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Collection</h1>
        <p className="text-gray-600">Search for students and collect payments</p>
      </div>

      {/* Search and Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Students
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, village, or bus number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Class
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Bus
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filterBus}
              onChange={(e) => setFilterBus(e.target.value)}
            >
              <option value="">All Buses</option>
              {uniqueBuses.map(bus => (
                <option key={bus} value={bus}>{bus}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || filterClass || filterBus) && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterClass('')
                setFilterBus('')
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quarters Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || filterClass || filterBus ? 'No students found matching your search' : 'No students found'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.village}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.class}{student.section ? ` (${student.section})` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.bus.registrationNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{student.monthlyFee.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ₹{student.feePaid.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(quarter => (
                          <div
                            key={quarter}
                            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold ${
                              getQuarterStatus(student.id, quarter)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            title={`Quarter ${quarter}`}
                          >
                            Q{quarter}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCollectPayment(student)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                          title="Collect payment"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Collect
                        </button>
                        <button
                          onClick={() => handleShowPaymentHistory(student)}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
                          title="View history"
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedStudent && (
        <>
          <CollectPaymentModal
            student={selectedStudent}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={handlePaymentSuccess}
          />

          <PaymentHistoryModal
            student={selectedStudent}
            isOpen={showPaymentHistory}
            onClose={() => setShowPaymentHistory(false)}
          />
        </>
      )}
    </div>
  )
}
