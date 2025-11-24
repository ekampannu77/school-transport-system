'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, Trash2, MapPin, Phone, Edit } from 'lucide-react'
import AddStudentModal from './AddStudentModal'
import EditStudentModal from './EditStudentModal'

interface Student {
  id: string
  name: string
  class: string
  village: string
  parentName: string
  parentContact: string
  emergencyContact: string | null
  monthlyFee: number | null
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

  useEffect(() => {
    fetchStudents()
  }, [busId])

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?busId=${busId}`)
      const data = await response.json()

      // Ensure data is an array before setting students
      if (Array.isArray(data)) {
        setStudents(data)
      } else {
        console.error('API returned non-array data:', data)
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setShowEditModal(true)
  }

  const handleMarkInactive = async (studentId: string, studentName: string) => {
    if (!confirm(`Mark ${studentName} as stopped using the bus?`)) {
      return
    }

    setDeletingId(studentId)
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: false,
          endDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        fetchStudents()
      } else {
        alert('Failed to update student')
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student')
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkActive = async (studentId: string) => {
    setDeletingId(studentId)
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: true,
          endDate: null,
        }),
      })

      if (response.ok) {
        fetchStudents()
      } else {
        alert('Failed to update student')
      }
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student')
    } finally {
      setDeletingId(null)
    }
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

  const activeStudents = students.filter(s => s.isActive)
  const inactiveStudents = students.filter(s => !s.isActive)
  const displayStudents = showInactive ? students : activeStudents
  const availableSeats = seatingCapacity - activeStudents.length
  const occupancyPercentage = Math.round((activeStudents.length / seatingCapacity) * 100)

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
              Students ({activeStudents.length}/{seatingCapacity})
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Village
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayStudents.map((student) => (
                    <tr key={student.id} className={`hover:bg-gray-50 ${!student.isActive ? 'bg-gray-50 opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">₹{(student.monthlyFee || 0).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.class}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.village}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div className="flex items-center text-green-600">
                            <span className="text-xs">Started: {new Date(student.startDate).toLocaleDateString('en-IN')}</span>
                          </div>
                          {student.endDate && (
                            <div className="flex items-center text-red-600">
                              <span className="text-xs">Stopped: {new Date(student.endDate).toLocaleDateString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="text-gray-900">{student.parentName}</div>
                          <div className="flex items-center text-gray-500">
                            <Phone className="h-3 w-3 mr-1" />
                            <span className="text-xs">{student.parentContact}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit student"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {student.isActive ? (
                            <button
                              onClick={() => handleMarkInactive(student.id, student.name)}
                              disabled={deletingId === student.id}
                              className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                              title="Mark as stopped using bus"
                            >
                              Stop
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkActive(student.id)}
                              disabled={deletingId === student.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Mark as active again"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(student.id, student.name)}
                            disabled={deletingId === student.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
    </>
  )
}
