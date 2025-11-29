import { z } from 'zod'

// ============================================
// Auth Schemas
// ============================================
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['admin', 'staff', 'viewer']).default('staff'),
})

// ============================================
// Bus Schemas
// ============================================
const baseBusSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required').max(20),
  chassisNumber: z.string().min(1, 'Chassis number is required').max(50),
  seatingCapacity: z.coerce.number().int().positive('Seating capacity must be positive'),
  purchaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid purchase date'),
  primaryDriverId: z.string().optional().nullable(),
  conductorId: z.string().optional().nullable(),
  fitnessExpiry: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid fitness expiry date').optional().nullable(),
  registrationExpiry: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid registration expiry date').optional().nullable(),
  insuranceExpiry: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid insurance expiry date').optional().nullable(),
  ownershipType: z.enum(['SCHOOL_OWNED', 'PRIVATE_OWNED']).default('SCHOOL_OWNED'),
  privateOwnerName: z.string().max(100).optional().nullable(),
  privateOwnerContact: z.string().max(20).optional().nullable(),
  privateOwnerBank: z.string().max(100).optional().nullable(),
  schoolCommission: z.coerce.number().min(0).max(100).optional().default(0),
})

const busRefinement = (data: z.infer<typeof baseBusSchema>) => {
  if (data.ownershipType === 'PRIVATE_OWNED' && !data.privateOwnerName) {
    return false
  }
  return true
}

export const createBusSchema = baseBusSchema.refine(
  busRefinement,
  { message: 'Private owner name is required for private buses', path: ['privateOwnerName'] }
)

export const updateBusSchema = baseBusSchema.extend({
  id: z.string().uuid('Invalid bus ID'),
}).refine(
  busRefinement,
  { message: 'Private owner name is required for private buses', path: ['privateOwnerName'] }
)

// ============================================
// Driver Schemas
// ============================================
const baseDriverSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['driver', 'conductor']).default('driver'),
  licenseNumber: z.string().max(50).optional().nullable(),
  phone: z.string().min(1, 'Phone is required').max(20),
  address: z.string().max(500).optional().nullable(),
  licenseExpiry: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid license expiry date').optional().nullable(),
  aadharNumber: z.string().max(20).optional().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
})

const driverRefinement = (data: z.infer<typeof baseDriverSchema>) => {
  if (data.role === 'driver' && (!data.licenseNumber || !data.licenseExpiry)) {
    return false
  }
  return true
}

export const createDriverSchema = baseDriverSchema.refine(
  driverRefinement,
  { message: 'License number and expiry are required for drivers', path: ['licenseNumber'] }
)

export const updateDriverSchema = baseDriverSchema.extend({
  id: z.string().uuid('Invalid driver ID'),
}).refine(
  driverRefinement,
  { message: 'License number and expiry are required for drivers', path: ['licenseNumber'] }
)

// ============================================
// Student Schemas
// ============================================
export const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  class: z.string().min(1, 'Class is required').max(20),
  section: z.string().max(10).optional().nullable(),
  village: z.string().min(1, 'Village is required').max(100),
  monthlyFee: z.coerce.number().min(0, 'Monthly fee must be non-negative'),
  parentName: z.string().min(1, 'Parent name is required').max(100),
  parentContact: z.string().min(1, 'Parent contact is required').max(20),
  emergencyContact: z.string().max(20).optional().nullable(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional().nullable(),
  busId: z.string().uuid('Invalid bus ID'),
  feeWaiverPercent: z.coerce.number().min(0).max(100).optional().default(0),
  isActive: z.boolean().optional().default(true),
})

export const updateStudentSchema = createStudentSchema.partial().extend({
  id: z.string().uuid('Invalid student ID'),
})

// ============================================
// Payment Schemas
// ============================================
export const createPaymentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  amount: z.coerce.number().positive('Amount must be positive'),
  quarter: z.coerce.number().int().min(1).max(4, 'Quarter must be 1, 2, 3, or 4'),
  academicYear: z.string().min(1, 'Academic year is required').regex(/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'UPI', 'ONLINE_TRANSFER', 'CARD']),
  transactionId: z.string().max(100).optional().nullable(),
  checkNumber: z.string().max(50).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  collectedBy: z.string().max(100).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
  paymentDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid payment date').optional(),
})

// ============================================
// Route Schemas
// ============================================
export const createRouteSchema = z.object({
  routeName: z.string().min(1, 'Route name is required').max(100),
  startPoint: z.string().min(1, 'Start point is required').max(200),
  endPoint: z.string().min(1, 'End point is required').max(200),
  totalDistanceKm: z.coerce.number().positive('Distance must be positive').optional(),
})

export const updateRouteSchema = createRouteSchema.partial().extend({
  id: z.string().uuid('Invalid route ID'),
})

export const assignBusToRouteSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  routeId: z.string().uuid('Invalid route ID'),
  driverId: z.string().uuid('Invalid driver ID').optional().nullable(),
  conductorId: z.string().uuid('Invalid conductor ID').optional().nullable(),
  academicTerm: z.string().min(1, 'Academic term is required').max(50),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional().nullable(),
})

// ============================================
// Expense Schemas
// ============================================
export const createExpenseSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  category: z.enum(['Fuel', 'Maintenance', 'Salary', 'Insurance', 'Other']),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  description: z.string().max(500).optional().nullable(),
  odometerReading: z.coerce.number().min(0).optional().nullable(),
  litresFilled: z.coerce.number().positive().optional().nullable(),
  pricePerLitre: z.coerce.number().positive().optional().nullable(),
  receiptImageUrl: z.string().url().optional().nullable(),
})

// ============================================
// Fuel Schemas
// ============================================
export const createFuelPurchaseSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  pricePerLitre: z.coerce.number().positive('Price per litre must be positive'),
  totalCost: z.coerce.number().positive('Total cost must be positive'),
  vendor: z.string().max(100).optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const createFuelDispenseSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  odometerReading: z.coerce.number().min(0).optional().nullable(),
  dispensedBy: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

// ============================================
// Bus Owner Payment Schemas
// ============================================
export const createBusOwnerPaymentSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  amount: z.coerce.number().positive('Amount must be positive'),
  paymentDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid payment date'),
  periodStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid period start date'),
  periodEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid period end date'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'UPI', 'ONLINE_TRANSFER', 'CARD']).optional(),
  transactionReference: z.string().max(100).optional().nullable(),
  status: z.enum(['PENDING', 'PAID']).default('PENDING'),
  remarks: z.string().max(500).optional().nullable(),
})

// ============================================
// Alert Schemas
// ============================================
export const resolveReminderSchema = z.object({
  reminderId: z.string().uuid('Invalid reminder ID'),
})

// ============================================
// ID Validation Schema
// ============================================
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

// ============================================
// Helper function to validate and return errors
// ============================================
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message).join(', ')
    return { success: false, error: errors }
  }
  return { success: true, data: result.data }
}
