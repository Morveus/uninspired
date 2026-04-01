import { NextResponse } from 'next/server'
import { COOKIE_NAME, CSRF_COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set(CSRF_COOKIE_NAME, '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
