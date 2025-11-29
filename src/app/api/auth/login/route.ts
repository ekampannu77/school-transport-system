import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { createTokenEdge } from '@/lib/auth-edge'
import { loginSchema, validateRequest } from '@/lib/validations'
import { authLogger } from '@/lib/logger'
import { withRateLimit, AUTH_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = withRateLimit(request, AUTH_RATE_LIMIT)
  if (rateLimitResponse) {
    authLogger.warn('Login rate limit exceeded', { ip: request.headers.get('x-forwarded-for') })
    return rateLimitResponse
  }

  try {
    const body = await request.json()

    // Validate input
    const validation = validateRequest(loginSchema, body)
    if (!validation.success) {
      authLogger.info('Login validation failed', { error: validation.error })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { username, password } = validation.data

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      authLogger.info('Login attempt for non-existent user', { username })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      authLogger.warn('Login attempt for disabled account', { username, userId: user.id })
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      authLogger.info('Invalid password attempt', { username })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await createTokenEdge({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    authLogger.info('User logged in successfully', { username, userId: user.id })

    // Create response with user info
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })

    // Set cookie on response (aligned with JWT expiry of 1 day)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day - matches JWT expiry
      path: '/',
    })

    return response
  } catch (error) {
    authLogger.error('Login error', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
