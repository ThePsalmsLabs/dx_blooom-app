import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@farcaster/quick-auth'

/**
 * Farcaster Quick Auth Token Verification Endpoint
 * 
 * This endpoint verifies Farcaster Quick Auth JWT tokens using the official
 * Quick Auth client. This ensures proper security and validation.
 */

interface QuickAuthVerificationRequest {
  token: string
}

interface QuickAuthVerificationResponse {
  valid: boolean
  error?: string
  fid?: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

// Create the official Quick Auth client
const quickAuthClient = createClient()

export async function POST(request: NextRequest): Promise<NextResponse<QuickAuthVerificationResponse>> {
  try {
    const authHeader = request.headers.get('authorization')
    const body: QuickAuthVerificationRequest = await request.json()
    
    let token = body.token
    
    // Extract token from Authorization header if present
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Authentication token is required' 
        },
        { status: 400 }
      )
    }

    console.log('🔐 Verifying Farcaster Quick Auth token')

    try {
      // Use the official Quick Auth client to verify the JWT token
      const payload = await quickAuthClient.verifyJwt({
        token,
        domain: process.env.NEXT_PUBLIC_URL?.replace(/^https?:\/\//, '') || 'localhost:3000'
      })

      // Extract user data from the verified payload
      const fid = typeof payload.sub === 'string' ? parseInt(payload.sub) : payload.sub // FID is stored in the 'sub' field
      
      // Fetch additional user data from Farcaster API if needed
      let username, displayName, pfpUrl

      try {
        const userResponse = await fetch(`https://api.farcaster.xyz/fc/user-by-fid?fid=${fid}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          username = userData.result?.user?.username
          displayName = userData.result?.user?.displayName
          pfpUrl = userData.result?.user?.pfp?.url
        }
      } catch (fetchError) {
        console.warn('⚠️ Failed to fetch additional user data:', fetchError)
        // Continue with basic data from token
      }

      console.log('✅ Quick Auth token verified successfully for FID:', fid)

      // Return successful verification with user data
      return NextResponse.json({
        valid: true,
        fid,
        username: username || `user-${fid}`,
        displayName: displayName || undefined,
        pfpUrl: pfpUrl || undefined
      })

    } catch (verificationError) {
      console.error('❌ Token verification failed:', verificationError)
      return NextResponse.json(
        { 
          valid: false, 
          error: verificationError instanceof Error ? verificationError.message : 'Invalid token' 
        },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('❌ Quick Auth verification error:', error)
    
    return NextResponse.json(
      { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      },
      { status: 500 }
    )
  }
}

// Handle CORS for cross-origin requests
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}
