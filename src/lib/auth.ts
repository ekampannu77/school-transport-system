import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// JWT Secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const TOKEN_NAME = 'auth_token'

export interface JWTPayload {
  userId: string
  username: string
  role: string
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Verify a password against a hashed password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Create a JWT token for a user
 */
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Get the current user from the request cookies
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(TOKEN_NAME)?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}

/**
 * Set authentication cookie
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Clear authentication cookie
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
}
