import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from 'jose'

// JWT Secret - must be set in environment variables
// Lazy-loaded to avoid build-time errors
let _encodedSecret: Uint8Array | undefined

function getEncodedSecret(): Uint8Array {
  if (!_encodedSecret) {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.')
    }
    _encodedSecret = new TextEncoder().encode(secret)
  }
  return _encodedSecret
}

export interface JWTPayload extends JoseJWTPayload {
  userId: string
  username: string
  role: string
}

/**
 * Verify a JWT token (Edge-compatible)
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret())
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}

/**
 * Create a JWT token (Edge-compatible)
 */
export async function createTokenEdge(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .sign(getEncodedSecret())

  return token
}
