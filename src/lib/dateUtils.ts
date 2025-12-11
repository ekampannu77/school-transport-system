/**
 * Date formatting utilities - All dates displayed as DD/MM/YYYY
 */

/**
 * Format a date to DD/MM/YYYY format
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string or '-' if invalid
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Format a date to DD/MM/YYYY HH:MM format
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted datetime string or '-' if invalid
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Format a date for input fields (YYYY-MM-DD format required by HTML date inputs)
 * @param date - Date string, Date object, or null/undefined
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  return d.toISOString().split('T')[0]
}

/**
 * Get relative time description (e.g., "in 5 days", "2 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function getRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffTime = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

/**
 * Calculate student capacity from seating capacity
 * 1.5 students are allowed per seat (rounded up)
 * @param seatingCapacity - Number of seats in the bus
 * @returns Maximum number of students allowed
 */
export function calculateStudentCapacity(seatingCapacity: number): number {
  return Math.ceil(seatingCapacity * 1.5)
}

/**
 * Calculate the number of days remaining until a date
 * Positive = future, Negative = past, 0 = today
 * @param date - Date string or Date object
 * @param fromDate - Optional reference date (defaults to now)
 * @returns Number of days remaining (can be negative if expired)
 */
export function calculateDaysRemaining(date: string | Date, fromDate: Date = new Date()): number {
  const targetDate = new Date(date)
  const diffTime = targetDate.getTime() - fromDate.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Determine alert severity based on days remaining
 * @param daysRemaining - Number of days until expiry
 * @returns Severity level: 'critical', 'warning', or 'info'
 */
export function getAlertSeverity(daysRemaining: number): 'critical' | 'warning' | 'info' {
  if (daysRemaining < 0 || daysRemaining <= 7) return 'critical'
  if (daysRemaining <= 15) return 'warning'
  return 'info'
}

/**
 * Format days remaining for display
 * @param daysRemaining - Number of days (can be negative for expired)
 * @returns Formatted string like "in 5 days" or "expired 3 days ago"
 */
export function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining === 0) return 'today'
  if (daysRemaining === 1) return 'in 1 day'
  if (daysRemaining > 1) return `in ${daysRemaining} days`
  if (daysRemaining === -1) return 'expired 1 day ago'
  return `expired ${Math.abs(daysRemaining)} days ago`
}

/**
 * Get the current academic year in format 'YYYY-YY'
 * Academic year runs from April to March
 * e.g., April 2024 to March 2025 = '2024-25'
 * @param date - Optional date to calculate for (defaults to now)
 * @returns Academic year string like '2024-25'
 */
export function getCurrentAcademicYear(date: Date = new Date()): string {
  const month = date.getMonth() // 0-11
  const year = date.getFullYear()

  // If month is April (3) or later, academic year starts this year
  // If month is before April (0-2), academic year started last year
  const startYear = month >= 3 ? year : year - 1
  const endYear = startYear + 1

  return `${startYear}-${endYear.toString().slice(-2)}`
}
