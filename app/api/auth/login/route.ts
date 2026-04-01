import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession, generateCsrfToken, COOKIE_NAME, CSRF_COOKIE_NAME } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, retryAfter } = rateLimit(`login:${ip}`, 5, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const { username, password } = await request.json()

    const user = await prisma.adminUser.findUnique({ where: { username } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const csrfToken = generateCsrfToken()
    const jwt = await createSession(user.id, csrfToken)

    const response = NextResponse.json({ success: true })

    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
