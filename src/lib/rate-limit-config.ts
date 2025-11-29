export type RateLimitConfig = {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
}

// Pre-configured rate limit configs
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,             // 5 attempts per 15 minutes for login
}

export const REGISTER_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 3,             // 3 registrations per hour
}

export const API_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 100,           // 100 requests per minute
}
