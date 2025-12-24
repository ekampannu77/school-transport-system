'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, Plus, Trash2, MapPin, Phone, Edit, DollarSign, Receipt, UserMinus, UserPlus } from 'lucide-react'
import AddStudentModal from './AddStudentModal'
import EditStudentModal from './EditStudentModal'
import CollectPaymentModal from './CollectPaymentModal'
import PaymentHistoryModal from './PaymentHistoryModal'
import StudentStatusModal from './StudentStatusModal'
import { formatDate, calculateStudentCapacity } from '@/lib/dateUtils'

interface StatusHistory {
  id: string
  status: string
  startDate: string
  endDate: string | null
  reason: string | null
  createdAt: string
}

interface Student {
  id: string
  name: string
  class: string
  section: string | null
  village: string
  parentName: string
  parentContact: string
  emergencyContact: string | null
  monthlyFee: number | null
  feePaid: number | null
  feeWaiverPercent?: number
  startDate: string
  endDate: string | null
  isActive: boolean
}

interface BusStudentsListProps {
  busId: string
  seatingCapacity: number
}

export default function BusStudentsList({ busId, seatingCapacity }: BusStudentsListProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [editingFeePaidId, setEditingFeePaidId] = useState<string | null>(null)
  const [tempFeePaid, setTempFeePaid] = useState<string>('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusModalStudent, setStatusModalStudent] = useState<Student | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch(`/api/students?busId=${busId}&pageSize=500`)
      const result = await response.json()

      // Handle paginated response format { data: [...], pagination: {...} }
      if (result.data && Array.isArray(result.data)) {
        setStudents(result.data)
      } else if (Array.isArray(result)) {
        // Fallback for direct array response
        setStudents(result)
      } else {
        console.error('API returned unexpected data format:', result)
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [busId])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setShowEditModal(true)
  }

  const openStatusModal = async (student: Student) => {
    setStatusModalStudent(student)
    setShowStatusModal(true)
    setLoadingHistory(true)

    // Always fetch status history for this student
    try {
      const response = await fetch(`/api/students/${student.id}/status`)
      if (response.ok) {
        const history = await response.json()
        setStatusHistory(history)
      }
    } catch (error) {
      console.error('Error fetching status history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleStatusChange = async (data: { date: string; reason?: string }) => {
    if (!statusModalStudent) return

    const isActivating = !statusModalStudent.isActive

    try {
      const response = await fetch(`/api/students/${statusModalStudent.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: isActivating,
          date: data.date,
          reason: data.reason,
        }),
      })

      if (response.ok) {
        fetchStudents()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update student status')
      }
    } catch (error) {
      console.error('Error updating student status:', error)
      alert('Failed to update student status')
    }
  }

  const closeStatusModal = () => {
    setShowStatusModal(false)
    setStatusModalStudent(null)
    setStatusHistory([])
  }

  const handleDelete = async (studentId: string, studentName: string) => {
    if (!confirm(`Permanently delete ${studentName}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(studentId)
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchStudents()
      } else {
        alert('Failed to delete student')
      }
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student')
    } finally {
      setDeletingId(null)
    }
  }

  const handlePromoteAll = async () => {
    const currentMonth = new Date().getMonth() + 1 // 1-12
    const confirmMessage = currentMonth >= 4
      ? 'Promote all active students to the next class? This will increment each student\'s class by 1.'
      : 'Warning: It is recommended to promote students after April. Continue anyway?'

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch('/api/students/promote', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        fetchStudents()
      } else {
        alert(data.error || 'Failed to promote students')
      }
    } catch (error) {
      console.error('Error promoting students:', error)
      alert('Failed to promote students')
    }
  }

  const handleFeePaidClick = (student: Student) => {
    setEditingFeePaidId(student.id)
    setTempFeePaid((student.feePaid || 0).toString())
  }

  const handleFeePaidSave = async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feePaid: parseFloat(tempFeePaid) || 0,
        }),
      })

      if (response.ok) {
        fetchStudents()
        setEditingFeePaidId(null)
      } else {
        alert('Failed to update fee paid')
      }
    } catch (error) {
      console.error('Error updating fee paid:', error)
      alert('Failed to update fee paid')
    }
  }

  const handleFeePaidCancel = () => {
    setEditingFeePaidId(null)
    setTempFeePaid('')
  }

  const handleCollectPayment = (student: Student) => {
    setSelectedStudent(student)
    setShowPaymentModal(true)
  }

  const handleShowPaymentHistory = (student: Student) => {
    setSelectedStudent(student)
    setShowPaymentHistory(true)
  }

  const activeStudents = students.filter(s => s.isActive)
  const inactiveStudents = students.filter(s => !s.isActive)
  const displayStudents = showInactive ? students : activeStudents
  const studentCapacity = calculateStudentCapacity(seatingCapacity)
  const availableSeats = studentCapacity - activeStudents.length
  const occupancyPercentage = Math.round((activeStudents.length / studentCapacity) * 100)

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Students ({activeStudents.length}/{studentCapacity})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {availableSeats > 0 ? (
                <span className="text-green-600">{availableSeats} seats available</span>
              ) : (
                <span className="text-red-600">Bus is at full capacity</span>
              )}
              {' · '}
              <span>{occupancyPercentage}% occupied</span>
              {inactiveStudents.length > 0 && (
                <span className="text-gray-500"> · {inactiveStudents.length} inactive</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {inactiveStudents.length > 0 && (
              <button
                onClick={() => setShowInactive(!showInactive)}
                className="btn-secondary text-sm"
              >
                {showInactive ? 'Hide Inactive' : 'Show Inactive'}
              </button>
            )}
            {activeStudents.length > 0 && (
              <button
                onClick={handlePromoteAll}
                className="btn-secondary text-sm"
                title="Promote all students to next class"
              >
                Promote All
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
              disabled={availableSeats <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No students assigned</h3>
            <p className="text-sm text-gray-500 mb-4">
              Get started by adding students to this bus
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2 inline" />
              Add First Student
            </button>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fee
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fee Paid
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Remaining
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Class
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Section
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Village
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bus Usage
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Parent Contact
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayStudents.map((student) => (
                    <tr key={student.id} className={`hover:bg-gray-50 ${!student.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">₹{(student.monthlyFee || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {editingFeePaidId === student.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={tempFeePaid}
                              onChange={(e) => setTempFeePaid(e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              step="0.01"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFeePaidSave(student.id)
                                if (e.key === 'Escape') handleFeePaidCancel()
                              }}
                            />
                            <button onClick={() => handleFeePaidSave(student.id)} className="text-green-600 hover:text-green-900 text-xs">✓</button>
                            <button onClick={handleFeePaidCancel} className="text-red-600 hover:text-red-900 text-xs">✕</button>
                          </div>
                        ) : (
                          <div
                            className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-800"
                            onClick={() => handleFeePaidClick(student)}
                            title="Click to edit"
                          >
                            ₹{(student.feePaid || 0).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-orange-600">
                          ₹{((student.monthlyFee || 0) - (student.feePaid || 0)).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.class}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.section || '-'}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.village}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          <div className="text-green-600">
                            {formatDate(student.startDate)}
                          </div>
                          {student.endDate && (
                            <div className="text-red-600">
                              {formatDate(student.endDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="text-gray-900">{student.parentName}</div>
                          <div className="flex items-center text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            {student.parentContact}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {student.isActive ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCollectPayment(student)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Collect payment"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShowPaymentHistory(student)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Payment history"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit student"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openStatusModal(student)}
                            className={`p-1 ${student.isActive ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                            title={student.isActive ? 'Mark inactive' : 'Reactivate'}
                          >
                            {student.isActive ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(student.id, student.name)}
                            disabled={deletingId === student.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1"
                            title="Delete student permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AddStudentModal
        busId={busId}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchStudents}
      />

      <EditStudentModal
        student={editingStudent}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={fetchStudents}
      />

      {selectedStudent && (
        <>
          <CollectPaymentModal
            student={{
              ...selectedStudent,
              monthlyFee: selectedStudent.monthlyFee || 0,
            }}
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={fetchStudents}
          />

          <PaymentHistoryModal
            student={{
              ...selectedStudent,
              monthlyFee: selectedStudent.monthlyFee || 0,
            }}
            isOpen={showPaymentHistory}
            onClose={() => setShowPaymentHistory(false)}
          />
        </>
      )}

      {statusModalStudent && (
        <StudentStatusModal
          isOpen={showStatusModal}
          onClose={closeStatusModal}
          onConfirm={handleStatusChange}
          studentName={statusModalStudent.name}
          currentStatus={statusModalStudent.isActive}
          statusHistory={statusHistory}
          loading={loadingHistory}
        />
      )}
    </>
  )
}
