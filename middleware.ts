// File: middleware.ts (at project root)
/**
 * Next.js Middleware - Basic CSP and Security Headers
 * 
 * This middleware provides basic security headers and Content Security Policy
 * for the application. The x402 payment middleware has been removed as part
 * of the migration to V2 Commerce Protocol.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Add CSP Headers to Response
 *
 * This function adds Content Security Policy headers to any response.
 */
function addCSPHeaders(response: NextResponse): NextResponse {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://auth.privy.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://auth.privy.io wss: https:",
    "frame-src 'self' https://auth.privy.io",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspHeader)
  return response
}

/**
 * Next.js Middleware Entry Point
 *
 * This is the main function that Next.js calls for every request matching
 * the matcher configuration. It applies security headers to all responses.
 */
export default async function middleware(): Promise<NextResponse> {
  // Continue with normal Next.js processing and add security headers
  const response = NextResponse.next()
  return addCSPHeaders(response)
}

/**
 * Middleware Configuration for Next.js
 * 
 * This configuration tells Next.js which routes this middleware should handle.
 * The matcher excludes static assets for better performance.
 */
export const config = {
  matcher: [
    // Include all routes but exclude static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}