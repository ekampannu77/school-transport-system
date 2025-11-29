import { AUTH_RATE_LIMIT, REGISTER_RATE_LIMIT, API_RATE_LIMIT } from '@/lib/rate-limit-config'

// Note: Full rate limiting tests require Next.js runtime environment
// These tests verify the configuration values

describe('Rate Limit Configuration', () => {
  describe('AUTH_RATE_LIMIT', () => {
    it('should have correct window duration (15 minutes)', () => {
      expect(AUTH_RATE_LIMIT.windowMs).toBe(15 * 60 * 1000)
    })

    it('should have correct max requests (5)', () => {
      expect(AUTH_RATE_LIMIT.maxRequests).toBe(5)
    })
  })

  describe('REGISTER_RATE_LIMIT', () => {
    it('should have correct window duration (1 hour)', () => {
      expect(REGISTER_RATE_LIMIT.windowMs).toBe(60 * 60 * 1000)
    })

    it('should have correct max requests (3)', () => {
      expect(REGISTER_RATE_LIMIT.maxRequests).toBe(3)
    })
  })

  describe('API_RATE_LIMIT', () => {
    it('should have correct window duration (1 minute)', () => {
      expect(API_RATE_LIMIT.windowMs).toBe(60 * 1000)
    })

    it('should have correct max requests (100)', () => {
      expect(API_RATE_LIMIT.maxRequests).toBe(100)
    })
  })

  describe('Rate limit configuration sanity checks', () => {
    it('AUTH_RATE_LIMIT should be stricter than API_RATE_LIMIT', () => {
      expect(AUTH_RATE_LIMIT.maxRequests).toBeLessThan(API_RATE_LIMIT.maxRequests)
    })

    it('REGISTER_RATE_LIMIT should be stricter than AUTH_RATE_LIMIT', () => {
      expect(REGISTER_RATE_LIMIT.maxRequests).toBeLessThan(AUTH_RATE_LIMIT.maxRequests)
    })

    it('all rate limits should have positive window durations', () => {
      expect(AUTH_RATE_LIMIT.windowMs).toBeGreaterThan(0)
      expect(REGISTER_RATE_LIMIT.windowMs).toBeGreaterThan(0)
      expect(API_RATE_LIMIT.windowMs).toBeGreaterThan(0)
    })

    it('all rate limits should have positive max requests', () => {
      expect(AUTH_RATE_LIMIT.maxRequests).toBeGreaterThan(0)
      expect(REGISTER_RATE_LIMIT.maxRequests).toBeGreaterThan(0)
      expect(API_RATE_LIMIT.maxRequests).toBeGreaterThan(0)
    })
  })
})
