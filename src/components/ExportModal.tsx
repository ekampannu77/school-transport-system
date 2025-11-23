'use client'

import { useState } from 'react'
import { X, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [startMonth, setStartMonth] = useState('')
  const [startYear, setStartYear] = useState(new Date().getFullYear().toString())
  const [endMonth, setEndMonth] = useState('')
  const [endYear, setEndYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  const handleExport = async () => {
    if (!startMonth || !startYear || !endMonth || !endYear) {
      alert('Please select start and end dates')
      return
    }

    const startMonthIndex = months.indexOf(startMonth) + 1
    const endMonthIndex = months.indexOf(endMonth) + 1
    const startDate = new Date(parseInt(startYear), startMonthIndex - 1, 1)
    const endDate = new Date(parseInt(endYear), endMonthIndex - 1, 1)

    if (startDate > endDate) {
      alert('Start date must be before end date')
      return
    }

    setLoading(true)

    try {
      // Fetch data from API with date range
      const response = await fetch(
        `/api/export?startMonth=${startMonthIndex}&startYear=${startYear}&endMonth=${endMonthIndex}&endYear=${endYear}`
      )
      const data = await response.json()

      // Generate PDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      let yPos = 20

      // Add header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('ASM Public School', pageWidth / 2, yPos, { align: 'center' })
      yPos += 8
      doc.setFontSize(14)
      doc.text('Transport Management Report', pageWidth / 2, yPos, { align: 'center' })
      yPos += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const dateRangeText = startMonth === endMonth && startYear === endYear
        ? `${startMonth} ${startYear}`
        : `${startMonth} ${startYear} - ${endMonth} ${endYear}`
      doc.text(dateRangeText, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      // Add Summary section
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary', 14, yPos)
      yPos += 7
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Buses: ${data.buses?.length || 0}`, 14, yPos)
      yPos += 5
      doc.text(`Total Expenses: Rs. ${data.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0).toLocaleString('en-IN')}`, 14, yPos)
      yPos += 10

      // Add Bus Details with Driver, Conductor, Route, and Expenses
      if (data.buses?.length > 0) {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Bus Details', 14, yPos)
        yPos += 5

        // Calculate expenses per bus
        const expensesByBus = data.expenses.reduce((acc: any, expense: any) => {
          const busReg = expense.bus.registrationNumber
          if (!acc[busReg]) acc[busReg] = 0
          acc[busReg] += expense.amount
          return acc
        }, {})

        autoTable(doc, {
          startY: yPos,
          head: [['Bus', 'Driver', 'Conductor', 'Route', 'Expenses (Rs.)']],
          body: data.buses.map((bus: any) => [
            bus.registrationNumber,
            bus.primaryDriver?.name || 'Not assigned',
            bus.busRoutes[0]?.conductor?.name || 'Not assigned',
            bus.busRoutes[0]?.route?.routeName || 'Not assigned',
            (expensesByBus[bus.registrationNumber] || 0).toLocaleString('en-IN')
          ]),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      }

      // Add Detailed Expenses section
      if (data.expenses?.length > 0) {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Expense Details', 14, yPos)
        yPos += 5

        autoTable(doc, {
          startY: yPos,
          head: [['Bus', 'Category', 'Amount (Rs.)', 'Date', 'Description']],
          body: data.expenses.map((expense: any) => [
            expense.bus.registrationNumber,
            expense.category,
            expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
            new Date(expense.date).toLocaleDateString('en-IN'),
            expense.description || '-'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        })
      }

      // Add footer
      const pageCount = doc.internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      // Save PDF
      const fileNameDate = startMonth === endMonth && startYear === endYear
        ? `${startMonth}_${startYear}`
        : `${startMonth}${startYear}_to_${endMonth}${endYear}`
      const fileName = `Transport_Report_${fileNameDate}.pdf`
      doc.save(fileName)

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Export Report</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Date Range Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select Period</h3>

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">From</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="input-field"
              >
                <option value="">Select month</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="input-field"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">To</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(e.target.value)}
                className="input-field"
              >
                <option value="">Select month</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="input-field"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Info text */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            The report will include all buses with their assigned drivers, conductors, routes, and expenses for the selected date range. You can select a single month or multiple months.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>Generating...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
