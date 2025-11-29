import { NextRequest, NextResponse } from 'next/server'
import type { RateLimitConfig } from './rate-limit-config'
import { AUTH_RATE_LIMIT, REGISTER_RATE_LIMIT, API_RATE_LIMIT } from './rate-limit-config'

// Re-export config types and constants for convenience
export type { RateLimitConfig }
export { AUTH_RATE_LIMIT, REGISTER_RATE_LIMIT, API_RATE_LIMIT }

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// In production, use Redis or similar for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60000 // 1 minute
let lastCleanup = Date.now()

function cleanupExpiredEntries(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
  lastCleanup = now
}

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwardedFor) {
    // Take the first IP if multiple are present
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  // Fallback - in development, this might not work well
  return 'unknown'
}

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredEntries()

  const clientId = getClientIdentifier(request)
  const key = `${clientId}:${request.nextUrl.pathname}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Create new entry if none exists or window has expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const allowed = entry.count <= config.maxRequests

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  }
}

export function rateLimitResponse(resetTime: number): NextResponse {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
      },
    }
  )
}

// Helper function to apply rate limiting in route handlers
export function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const { allowed, remaining, resetTime } = checkRateLimit(request, config)

  if (!allowed) {
    return rateLimitResponse(resetTime)
  }

  // Return null to indicate request is allowed
  // The route handler can add rate limit headers to successful responses
  return null
}
