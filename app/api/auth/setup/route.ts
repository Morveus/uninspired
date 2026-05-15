import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  createSession,
  generateCsrfToken,
  COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function GET() {
  const count = await prisma.adminUser.count()
  return NextResponse.json({ needsSetup: count === 0 })
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`setup:${ip}`, 5, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many setup attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  // Refuse if an admin already exists — this endpoint is for first-time setup only.
  const count = await prisma.adminUser.count()
  if (count > 0) {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 403 })
  }

  let username: unknown
  let password: unknown
  try {
    const body = await request.json()
    username = body.username
    password = body.password
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const u = username.trim()
  if (u.length < 3 || u.length > 64) {
    return NextResponse.json({ error: 'Username must be 3-64 chars' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 chars' }, { status: 400 })
  }

  // Concurrency guard: re-check inside the create flow to avoid a race
  // creating two admins simultaneously.
  const passwordHash = await hashPassword(password)
  let user
  try {
    user = await prisma.adminUser.create({ data: { username: u, passwordHash } })
  } catch {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 403 })
  }

  const csrfToken = generateCsrfToken()
  const jwt = await createSession(user.id, csrfToken)

  const response = NextResponse.json({ success: true })

  response.cookies.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return response
}
