import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const COOKIE_NAME = 'uninspired-session'
const CSRF_COOKIE_NAME = 'csrf-token'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: number, csrfToken: string): Promise<string> {
  const jwt = await new SignJWT({ sub: String(userId), csrf: csrfToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getJwtSecret())
  return jwt
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as { sub: string; csrf: string; iat: number; exp: number }
  } catch {
    return null
  }
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

export { COOKIE_NAME, CSRF_COOKIE_NAME }
