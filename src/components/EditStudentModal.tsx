'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { formatDateForInput } from '@/lib/dateUtils'

interface Student {
  id: string
  name: string
  class: string
  section: string | null
  village: string
  monthlyFee: number | null
  parentName: string
  parentContact: string
  emergencyContact: string | null
  startDate: string
}

interface EditStudentModalProps {
  student: Student | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditStudentModal({ student, isOpen, onClose, onSuccess }: EditStudentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    section: '',
    village: '',
    monthlyFee: '',
    parentName: '',
    parentContact: '',
    emergencyContact: '',
    startDate: '',
  })

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        class: student.class,
        section: student.section || '',
        village: student.village,
        monthlyFee: student.monthlyFee?.toString() || '0',
        parentName: student.parentName,
        parentContact: student.parentContact,
        emergencyContact: student.emergencyContact || '',
        startDate: formatDateForInput(student.startDate),
      })
    }
  }, [student])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          class: formData.class,
          section: formData.section || null,
          village: formData.village,
          monthlyFee: parseFloat(formData.monthlyFee),
          parentName: formData.parentName,
          parentContact: formData.parentContact,
          emergencyContact: formData.emergencyContact || null,
          startDate: new Date(formData.startDate),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update student')
      }

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  if (!isOpen || !student) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Student</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter student name"
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                placeholder="e.g., 5, 10, LKG, UKG"
              />
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section (Optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="e.g., A, B, S, M, COM, Sci"
              />
            </div>

            {/* Village */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Village / Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                placeholder="Residential area"
              />
            </div>

            {/* Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                placeholder="e.g., 1500"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">When student started using the bus</p>
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent / Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Parent or guardian name"
              />
            </div>

            {/* Parent Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.parentContact}
                onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                placeholder="+91-9876543210"
              />
            </div>

            {/* Emergency Contact */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact (Optional)
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Alternative emergency number"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
