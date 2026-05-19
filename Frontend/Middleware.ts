// ============================================================
// VidMind AI — Next.js Middleware
// middleware.ts  (must be at the project root, not in src/)
//
// Runs on the Edge before every matched request.
// Redirects unauthenticated users to /login and
// authenticated users away from /login and /register.
//
// Auth check: reads the JWT access token from a cookie.
// The cookie is set by the API service after login.
// ============================================================

import { NextResponse }  from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/library',
  '/workspace',
  '/chat',
  '/research',
  '/pricing',
  '/settings',
]

// Routes that authenticated users should NOT visit
const AUTH_ROUTES = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Read JWT token from cookie (set after login)
  const token = request.cookies.get('vidmind_access_token')?.value

  const isProtected  = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute  = AUTH_ROUTES.some((p) => pathname.startsWith(p))

  // Redirect unauthenticated users to login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login/register
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Only run middleware on these paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/library/:path*',
    '/workspace/:path*',
    '/chat/:path*',
    '/research/:path*',
    '/pricing/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
}