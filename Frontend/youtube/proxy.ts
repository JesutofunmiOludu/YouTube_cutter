// ============================================================
// VidMind AI — Next.js Edge Proxy (Next.js 16+ convention)
// proxy.ts (Root of Next.js app)
//
// Runs on the Edge before every matched request.
//
// Security & Auth enforcement:
//  1. Reads JWT access token from cookie ('vidmind_access_token')
//  2. Decodes JWT payload to check token expiry (O(1) base64 decode)
//  3. Decodes `is_verified` claim to enforce hard-block for unverified accounts
//  4. Redirects unauthenticated / expired users to /auth/login?from=...
//  5. Redirects unverified users on protected routes to /auth/verify-email-pending
//  6. Redirects authenticated, verified users away from auth routes to /dashboard
// ============================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes requiring authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/library',
  '/workspace',
  '/chat',
  '/research',
  '/pricing',
  '/settings',
]

// Auth entry routes (authenticated users should not visit these)
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/auth/login',
  '/auth/register',
]

// Routes within /auth that should remain accessible for verification flows
const ALLOWED_AUTH_PAGES = [
  '/auth/verify-email',
  '/auth/verify-email-pending',
  '/forgot-password',
  '/reset-password',
]

interface JWTPayload {
  exp?: number
  user_id?: string
  email?: string
  is_verified?: boolean
  [key: string]: unknown
}

/**
 * Decode base64url string in Edge runtime without external dependencies.
 */
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  try {
    return atob(base64)
  } catch {
    return ''
  }
}

/**
 * Parses JWT payload. Returns null if malformed.
 */
function parseJwtPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = decodeBase64Url(parts[1])
    return JSON.parse(decoded) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Checks if JWT is expired or invalid.
 */
function isTokenExpired(payload: JWTPayload | null): boolean {
  if (!payload || typeof payload.exp !== 'number') return true
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return payload.exp <= nowInSeconds
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rawToken = request.cookies.get('vidmind_access_token')?.value

  const payload = rawToken ? parseJwtPayload(rawToken) : null
  const hasValidToken = !!rawToken && !isTokenExpired(payload)
  const isVerified = payload?.is_verified ?? false

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const isAllowedAuthPage = ALLOWED_AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  // ── 1. Unauthenticated or Expired Token on Protected Route ──
  if (isProtected && !hasValidToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    const response = NextResponse.redirect(loginUrl)

    // Clear stale/expired cookie if present
    if (rawToken) {
      response.cookies.set('vidmind_access_token', '', {
        expires: new Date(0),
        path: '/',
      })
    }
    return response
  }

  // ── 2. Authenticated but UNVERIFIED user on Protected Route (Hard-block) ──
  if (isProtected && hasValidToken && !isVerified) {
    return NextResponse.redirect(new URL('/auth/verify-email-pending', request.url))
  }

  // ── 3. Authenticated & Verified user visiting Auth Routes ──
  if (isAuthRoute && hasValidToken && isVerified) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── 4. Authenticated but Unverified user visiting /auth/login or /auth/register ──
  if (isAuthRoute && hasValidToken && !isVerified && !isAllowedAuthPage) {
    return NextResponse.redirect(new URL('/auth/verify-email-pending', request.url))
  }

  return NextResponse.next()
}

export default proxy

// Configure matched paths
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
    '/auth/login',
    '/auth/register',
  ],
}
