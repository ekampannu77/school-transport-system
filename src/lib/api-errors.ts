import { NextResponse } from 'next/server'

// Standard API error codes
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  BAD_REQUEST: 'BAD_REQUEST',
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

interface ApiErrorResponse {
  error: string
  code?: ApiErrorCode
  details?: unknown
}

// Helper function to create consistent error responses
export function createErrorResponse(
  message: string,
  status: number,
  code?: ApiErrorCode,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { error: message }
  if (code) response.code = code
  if (details) response.details = details

  return NextResponse.json(response, { status })
}

// Pre-built common error responses
export const ApiErrors = {
  validationError: (message: string, details?: unknown) =>
    createErrorResponse(message, 400, API_ERROR_CODES.VALIDATION_ERROR, details),

  notFound: (resource: string) =>
    createErrorResponse(`${resource} not found`, 404, API_ERROR_CODES.NOT_FOUND),

  duplicate: (message: string) =>
    createErrorResponse(message, 409, API_ERROR_CODES.DUPLICATE),

  unauthorized: (message = 'Unauthorized') =>
    createErrorResponse(message, 401, API_ERROR_CODES.UNAUTHORIZED),

  forbidden: (message = 'Forbidden') =>
    createErrorResponse(message, 403, API_ERROR_CODES.FORBIDDEN),

  internal: (message = 'Internal server error') =>
    createErrorResponse(message, 500, API_ERROR_CODES.INTERNAL_ERROR),

  badRequest: (message: string) =>
    createErrorResponse(message, 400, API_ERROR_CODES.BAD_REQUEST),

  rateLimited: () =>
    createErrorResponse('Too many requests', 429, API_ERROR_CODES.RATE_LIMITED),
}

// Handle Prisma errors consistently
export function handlePrismaError(error: any, resource: string): NextResponse<ApiErrorResponse> {
  // Record not found
  if (error.code === 'P2025') {
    return ApiErrors.notFound(resource)
  }

  // Unique constraint violation
  if (error.code === 'P2002') {
    const fields = error.meta?.target?.join(', ') || 'field'
    return ApiErrors.duplicate(`${resource} with this ${fields} already exists`)
  }

  // Foreign key constraint violation
  if (error.code === 'P2003') {
    return ApiErrors.badRequest('Related record not found')
  }

  // Default to internal error
  return ApiErrors.internal(`Failed to process ${resource.toLowerCase()}`)
}

// Type-safe wrapper for API route handlers
export type ApiHandler<T = unknown> = (
  request: Request
) => Promise<NextResponse<T | ApiErrorResponse>>
