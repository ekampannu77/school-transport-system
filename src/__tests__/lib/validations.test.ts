import {
  loginSchema,
  registerSchema,
  createBusSchema,
  createDriverSchema,
  createStudentSchema,
  createPaymentSchema,
  createExpenseSchema,
  validateRequest,
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = { username: 'admin', password: 'password123' }
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty username', () => {
      const invalidData = { username: '', password: 'password123' }
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const invalidData = { username: 'admin', password: '' }
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const invalidData = { username: 'admin' }
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        username: 'newuser',
        email: 'user@example.com',
        password: 'password123',
        role: 'staff' as const,
      }
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject short username', () => {
      const invalidData = {
        username: 'ab',
        email: 'user@example.com',
        password: 'password123',
      }
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        username: 'newuser',
        email: 'invalid-email',
        password: 'password123',
      }
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidData = {
        username: 'newuser',
        email: 'user@example.com',
        password: '12345',
      }
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const invalidData = {
        username: 'newuser',
        email: 'user@example.com',
        password: 'password123',
        role: 'superadmin',
      }
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should default role to staff', () => {
      const validData = {
        username: 'newuser',
        email: 'user@example.com',
        password: 'password123',
      }
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('staff')
      }
    })
  })

  describe('createBusSchema', () => {
    it('should validate correct bus data', () => {
      const validData = {
        registrationNumber: 'KA-01-AB-1234',
        chassisNumber: 'CHASSIS123456',
        seatingCapacity: 40,
        purchaseDate: '2023-01-15',
        ownershipType: 'SCHOOL_OWNED' as const,
      }
      const result = createBusSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require private owner name for private buses', () => {
      const invalidData = {
        registrationNumber: 'KA-01-AB-1234',
        chassisNumber: 'CHASSIS123456',
        seatingCapacity: 40,
        purchaseDate: '2023-01-15',
        ownershipType: 'PRIVATE_OWNED' as const,
      }
      const result = createBusSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate private bus with owner name', () => {
      const validData = {
        registrationNumber: 'KA-01-AB-1234',
        chassisNumber: 'CHASSIS123456',
        seatingCapacity: 40,
        purchaseDate: '2023-01-15',
        ownershipType: 'PRIVATE_OWNED' as const,
        privateOwnerName: 'John Doe',
      }
      const result = createBusSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid seating capacity', () => {
      const invalidData = {
        registrationNumber: 'KA-01-AB-1234',
        chassisNumber: 'CHASSIS123456',
        seatingCapacity: -5,
        purchaseDate: '2023-01-15',
      }
      const result = createBusSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should coerce seating capacity from string', () => {
      const validData = {
        registrationNumber: 'KA-01-AB-1234',
        chassisNumber: 'CHASSIS123456',
        seatingCapacity: '40',
        purchaseDate: '2023-01-15',
      }
      const result = createBusSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.seatingCapacity).toBe(40)
      }
    })
  })

  describe('createDriverSchema', () => {
    it('should validate correct driver data', () => {
      const validData = {
        name: 'John Doe',
        role: 'driver' as const,
        phone: '9876543210',
        licenseNumber: 'DL-123456',
        licenseExpiry: '2025-12-31',
      }
      const result = createDriverSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require license for drivers', () => {
      const invalidData = {
        name: 'John Doe',
        role: 'driver' as const,
        phone: '9876543210',
      }
      const result = createDriverSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should not require license for conductors', () => {
      const validData = {
        name: 'Jane Doe',
        role: 'conductor' as const,
        phone: '9876543210',
      }
      const result = createDriverSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const invalidData = {
        name: 'John Doe',
        role: 'conductor' as const,
        phone: '9876543210',
        status: 'unknown',
      }
      const result = createDriverSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createStudentSchema', () => {
    it('should validate correct student data', () => {
      const validData = {
        name: 'Student Name',
        class: '10',
        village: 'Village Name',
        monthlyFee: 1500,
        parentName: 'Parent Name',
        parentContact: '9876543210',
        busId: '123e4567-e89b-12d3-a456-426614174000',
      }
      const result = createStudentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid bus ID format', () => {
      const invalidData = {
        name: 'Student Name',
        class: '10',
        village: 'Village Name',
        monthlyFee: 1500,
        parentName: 'Parent Name',
        parentContact: '9876543210',
        busId: 'invalid-id',
      }
      const result = createStudentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative monthly fee', () => {
      const invalidData = {
        name: 'Student Name',
        class: '10',
        village: 'Village Name',
        monthlyFee: -100,
        parentName: 'Parent Name',
        parentContact: '9876543210',
        busId: '123e4567-e89b-12d3-a456-426614174000',
      }
      const result = createStudentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createPaymentSchema', () => {
    it('should validate correct payment data', () => {
      const validData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 4500,
        quarter: 1,
        academicYear: '2024-2025',
        paymentMethod: 'CASH' as const,
      }
      const result = createPaymentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid quarter', () => {
      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 4500,
        quarter: 5,
        academicYear: '2024-2025',
        paymentMethod: 'CASH' as const,
      }
      const result = createPaymentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid academic year format', () => {
      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 4500,
        quarter: 1,
        academicYear: '2024',
        paymentMethod: 'CASH' as const,
      }
      const result = createPaymentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid payment method', () => {
      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 4500,
        quarter: 1,
        academicYear: '2024-2025',
        paymentMethod: 'BITCOIN',
      }
      const result = createPaymentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createExpenseSchema', () => {
    it('should validate correct expense data', () => {
      const validData = {
        busId: '123e4567-e89b-12d3-a456-426614174000',
        category: 'Fuel' as const,
        amount: 5000,
        date: '2024-01-15',
      }
      const result = createExpenseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid category', () => {
      const invalidData = {
        busId: '123e4567-e89b-12d3-a456-426614174000',
        category: 'Unknown',
        amount: 5000,
        date: '2024-01-15',
      }
      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const invalidData = {
        busId: '123e4567-e89b-12d3-a456-426614174000',
        category: 'Fuel' as const,
        amount: -100,
        date: '2024-01-15',
      }
      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('validateRequest helper', () => {
    it('should return success true with validated data', () => {
      const result = validateRequest(loginSchema, { username: 'admin', password: 'pass123' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.username).toBe('admin')
      }
    })

    it('should return success false with error message', () => {
      const result = validateRequest(loginSchema, { username: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeTruthy()
      }
    })
  })
})
