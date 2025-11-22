'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'

interface BusDocumentUploaderProps {
  busId: string
  onUploadSuccess: () => void
}

export default function BusDocumentUploader({ busId, onUploadSuccess }: BusDocumentUploaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    documentType: 'Insurance',
    documentName: '',
    fileUrl: '',
    expiryDate: '',
    notes: '',
  })

  const documentTypes = [
    'Insurance',
    'Registration Certificate',
    'Fitness Certificate',
    'Pollution Certificate',
    'Permit',
    'Tax Receipt',
    'Other'
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, fileUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/fleet/buses/${busId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          expiryDate: formData.expiryDate || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload document')
      }

      // Reset form
      setFormData({
        documentType: 'Insurance',
        documentName: '',
        fileUrl: '',
        expiryDate: '',
        notes: '',
      })
      setIsOpen(false)
      onUploadSuccess()
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="card p-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Upload className="h-5 w-5" />
          Upload New Document
        </button>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Type *
          </label>
          <select
            value={formData.documentType}
            onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
            className="input-field"
            required
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Name *
          </label>
          <input
            type="text"
            value={formData.documentName}
            onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
            className="input-field"
            placeholder="e.g., Insurance Policy 2024"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload File *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    required
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>
          {formData.fileUrl && (
            <p className="mt-2 text-sm text-green-600">File uploaded successfully</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input-field"
            rows={3}
            placeholder="Additional information about this document..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="flex-1 btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>
    </div>
  )
}
