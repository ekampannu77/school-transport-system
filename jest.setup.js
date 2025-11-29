import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.NODE_ENV = 'test'
