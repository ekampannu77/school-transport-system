'use client'

import { useEffect, useState } from 'react'
import { FileText, Calendar, Trash2, Eye, AlertCircle, X } from 'lucide-react'

interface Document {
  id: string
  documentType: string
  documentName: string
  fileUrl: string
  expiryDate: string | null
  notes: string | null
  createdAt: string
}

export default function BusDocumentList({ busId }: { busId: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [busId])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/fleet/buses/${busId}/documents`)
      const data = await response.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/fleet/buses/${busId}/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      fetchDocuments()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload documents to keep track of insurance, registration, and more.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge bg-blue-100 text-blue-800">
                      {doc.documentType}
                    </span>
                    {doc.expiryDate && isExpired(doc.expiryDate) && (
                      <span className="badge bg-red-100 text-red-800 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Expired
                      </span>
                    )}
                    {doc.expiryDate && !isExpired(doc.expiryDate) && isExpiringSoon(doc.expiryDate) && (
                      <span className="badge bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Expiring Soon
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{doc.documentName}</h4>
                  {doc.notes && (
                    <p className="text-sm text-gray-600 mb-2">{doc.notes}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                    {doc.expiryDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => setSelectedDocument(doc.fileUrl)}
                    className="text-primary-600 hover:text-primary-800 transition-colors"
                    title="View document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(doc.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedDocument(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="bg-white rounded-lg p-4">
              {selectedDocument.startsWith('data:application/pdf') ? (
                <iframe
                  src={selectedDocument}
                  className="w-full h-[80vh]"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={selectedDocument}
                  alt="Document"
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Document</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
