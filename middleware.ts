import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Create a custom middleware function
function middleware(request: NextRequest) {
  // Extract token from URL if present
  const pathname = request.nextUrl.pathname;
  const tokenMatch = pathname.match(/\/(en|fr)\/admin\/([\w-]+)/);
  
  if (tokenMatch) {
    const token = tokenMatch[2];
    // Check if token matches LOGIN_TOKEN from .env
    if (token !== process.env.LOGIN_TOKEN) {
      // Return 401 Unauthorized if token doesn't match
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  }

  // Continue with the intl middleware
  return createMiddleware(routing)(request);
}

export default middleware;

export const config = {
  // Match both internationalized pathnames and token paths
  matcher: ['/', '/(en|fr)/:path*', '/(en|fr)/token/:path*']
};