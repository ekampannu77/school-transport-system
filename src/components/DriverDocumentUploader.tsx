'use client'

import { useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'

interface DriverDocumentUploaderProps {
  driverId: string
  onUploadSuccess: () => void
}

export default function DriverDocumentUploader({
  driverId,
  onUploadSuccess,
}: DriverDocumentUploaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    documentType: 'License',
    documentName: '',
    fileUrl: '',
    expiryDate: '',
    notes: '',
  })

  const documentTypes = [
    'License',
    'Medical Certificate',
    'ID Proof',
    'Police Verification',
    'Training Certificate',
    'Background Check',
    'Other',
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
      const response = await fetch(`/api/drivers/${driverId}/documents`, {
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

      setFormData({
        documentType: 'License',
        documentName: '',
        fileUrl: '',
        expiryDate: '',
        notes: '',
      })
      setIsOpen(false)
      onUploadSuccess()
      alert('Document uploaded successfully!')
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload driver documents like license, medical certificates, etc.
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="h-5 w-5" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) =>
                    setFormData({ ...formData, documentType: e.target.value })
                  }
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
                  Document Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.documentName}
                  onChange={(e) =>
                    setFormData({ ...formData, documentName: e.target.value })
                  }
                  placeholder="e.g., Driving License 2024"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {formData.fileUrl ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-8 w-8 text-primary-600" />
                        <span className="text-sm text-gray-600">File uploaded</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={handleFileUpload}
                              accept="image/*,.pdf"
                              required
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="input-field"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Set an expiry date to receive reminders
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Add any additional notes..."
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-4">
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
        </div>
      )}
    </div>
  )
}
