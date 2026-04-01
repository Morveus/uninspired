import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'uninspired-session'
const localePattern = routing.locales.join('|')

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return new TextEncoder().encode(secret)
}

async function verifySessionMiddleware(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  try {
    await jwtVerify(token, getJwtSecret())
    return true
  } catch {
    return false
  }
}

async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if this is an admin route
  const adminMatch = pathname.match(new RegExp(`^/(${localePattern})/admin`))
  if (adminMatch) {
    const isValid = await verifySessionMiddleware(request)
    if (!isValid) {
      const locale = adminMatch[1]
      const loginUrl = new URL(`/${locale}/login`, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check CSRF on API mutations
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/login') && !pathname.startsWith('/api/auth/logout')) {
    const method = request.method
    if (['POST', 'PATCH', 'DELETE'].includes(method)) {
      // CSRF check: compare header to JWT claim
      const token = request.cookies.get(COOKIE_NAME)?.value
      if (token) {
        try {
          const { payload } = await jwtVerify(token, getJwtSecret())
          const csrfHeader = request.headers.get('X-CSRF-Token')
          if (csrfHeader && csrfHeader !== payload.csrf) {
            return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
          }
        } catch {
          // JWT invalid — let the route handler deal with auth
        }
      }
    }
  }

  return createMiddleware(routing)(request)
}

export default middleware

export const config = {
  matcher: ['/', `/(${['en', 'fr', 'de', 'es', 'it', 'pl', 'ru', 'pt', 'zh'].join('|')})/:path*`]
}
