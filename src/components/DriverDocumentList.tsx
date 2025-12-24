'use client'

import { useEffect, useState, useCallback } from 'react'
import { FileText, Calendar, AlertCircle, Trash2, Eye, X } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'

interface Document {
  id: string
  documentType: string
  documentName: string
  fileUrl: string
  expiryDate: string | null
  notes: string | null
  createdAt: string
}

export default function DriverDocumentList({ driverId }: { driverId: string }) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/drivers/${driverId}/documents`)
      const data = await response.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [driverId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDelete = async (docId: string) => {
    try {
      const response = await fetch(`/api/drivers/${driverId}/documents/${docId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      fetchDocuments()
      setDeleteConfirm(null)
      alert('Document deleted successfully!')
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
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-600">No documents uploaded yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Upload your first document to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {doc.documentName}
                      </h4>
                      <span className="badge bg-gray-100 text-gray-800">
                        {doc.documentType}
                      </span>
                    </div>
                    {doc.expiryDate && (
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span
                          className={`text-xs ${
                            isExpired(doc.expiryDate)
                              ? 'text-red-600 font-medium'
                              : isExpiringSoon(doc.expiryDate)
                              ? 'text-yellow-600 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {isExpired(doc.expiryDate)
                            ? 'Expired:'
                            : isExpiringSoon(doc.expiryDate)
                            ? 'Expires:'
                            : 'Valid until:'}{' '}
                          {formatDate(doc.expiryDate)}
                        </span>
                        {(isExpired(doc.expiryDate) || isExpiringSoon(doc.expiryDate)) && (
                          <AlertCircle
                            className={`h-4 w-4 ${
                              isExpired(doc.expiryDate) ? 'text-red-600' : 'text-yellow-600'
                            }`}
                          />
                        )}
                      </div>
                    )}
                    {doc.notes && (
                      <p className="text-xs text-gray-500 mt-1">{doc.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Uploaded {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedDoc(doc)}
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
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedDoc.documentName}</h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
              <img
                src={selectedDoc.fileUrl}
                alt={selectedDoc.documentName}
                className="w-full h-auto"
              />
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
