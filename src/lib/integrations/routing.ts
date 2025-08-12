import { NextRequest, NextResponse } from 'next/server'

export function createFeatureRoutingMiddleware() {
  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Discovery access: require at least consumer role
    if (pathname.startsWith('/discovery')) {
      const userRole = getUserRoleFromRequest(request)
      if (!['consumer', 'creator', 'admin'].includes(userRole)) {
        return NextResponse.redirect(new URL('/onboard', request.url))
      }
    }

    // Creator analytics: creators only
    if (pathname.startsWith('/dashboard/analytics')) {
      const userRole = getUserRoleFromRequest(request)
      if (userRole !== 'creator' && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Admin insights: admin only
    if (pathname.startsWith('/admin/insights')) {
      const userRole = getUserRoleFromRequest(request)
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    return NextResponse.next()
  }
}

function getUserRoleFromRequest(_request: NextRequest): string {
  // TODO: Wire to real auth/session. Default to consumer for now.
  return 'consumer'
}


