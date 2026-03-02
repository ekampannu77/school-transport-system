import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { verifyTokenEdge } from '@/lib/auth-edge'
import { registerSchema, validateRequest } from '@/lib/validations'
import { authLogger } from '@/lib/logger'
import { withRateLimit, REGISTER_RATE_LIMIT } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = withRateLimit(request, REGISTER_RATE_LIMIT)
  if (rateLimitResponse) {
    authLogger.warn('Registration rate limit exceeded', { ip: request.headers.get('x-forwarded-for') })
    return rateLimitResponse
  }

  try {
    // Check if any users exist (setup mode vs post-setup mode)
    const userCount = await prisma.user.count()

    if (userCount > 0) {
      // System already set up — only an authenticated admin can create new users
      const token = request.cookies.get('auth_token')?.value
      if (!token) {
        authLogger.warn('Unauthenticated registration attempt after setup')
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      const payload = await verifyTokenEdge(token)
      if (!payload || (payload as any).role !== 'admin') {
        authLogger.warn('Non-admin registration attempt', { role: (payload as any)?.role })
        return NextResponse.json(
          { error: 'Admin access required to create users' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()

    // Validate input
    const validation = validateRequest(registerSchema, body)
    if (!validation.success) {
      authLogger.info('Registration validation failed', { error: validation.error })
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { username, email, password, role } = validation.data

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    })

    if (existingUser) {
      authLogger.info('Registration attempt with existing credentials', { username, email })
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    authLogger.info('User registered successfully', { username, userId: user.id, role })

    return NextResponse.json({
      message: 'User created successfully',
      user,
    }, { status: 201 })
  } catch (error) {
    authLogger.error('Registration error', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
