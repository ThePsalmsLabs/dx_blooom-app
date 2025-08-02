import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify IPFS upload API is working
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'IPFS upload API is working',
    timestamp: new Date().toISOString()
  })
} 