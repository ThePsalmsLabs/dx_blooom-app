import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting for health checks
const healthCheckRateLimit = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

/**
 * Health Check API Endpoint
 * 
 * This endpoint provides basic health status for the backend services.
 * Used by the useBackendHealthMonitor hook to track backend availability.
 * 
 * Returns:
 * - 200 OK: Backend is healthy and operational
 * - 503 Service Unavailable: Backend is experiencing issues
 * - 429 Too Many Requests: Rate limit exceeded
 */
export async function GET(request: NextRequest) {
  // Simple rate limiting
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  const now = Date.now()
  
  const clientData = healthCheckRateLimit.get(clientIp)
  if (clientData && now < clientData.resetTime) {
    if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((clientData.resetTime - now) / 1000) },
        { status: 429, headers: { 'Retry-After': Math.ceil((clientData.resetTime - now) / 1000).toString() } }
      )
    }
    clientData.count++
  } else {
    healthCheckRateLimit.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
  }
  
  // Clean up old entries
  for (const [ip, data] of healthCheckRateLimit.entries()) {
    if (now > data.resetTime) {
      healthCheckRateLimit.delete(ip)
    }
  }
  try {
    // Basic health check - you can extend this to check:
    // - Database connectivity
    // - External service dependencies
    // - System resources
    // - Contract connectivity
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }

    return NextResponse.json(healthStatus, { status: 200 })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
}

/**
 * POST method for more detailed health checks
 * Can be used for active health monitoring with additional parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { detailed = false } = body

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }

    // Add detailed information if requested
    if (detailed) {
      Object.assign(healthStatus, {
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      })
    }

    return NextResponse.json(healthStatus, { status: 200 })
    
  } catch (error) {
    console.error('Detailed health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
}
