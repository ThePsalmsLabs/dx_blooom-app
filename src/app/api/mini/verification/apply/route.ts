/**
 * MiniApp Verification Application API Route
 *
 * This endpoint handles creator verification application submissions specifically
 * for miniapp users. It wraps the existing verification API with miniapp-specific
 * validation and context.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/mini/verification/apply
 *
 * Submit a creator verification application from miniapp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { creatorAddress, bio, websiteUrl, twitterHandle, linkedinProfile, portfolioUrl, verificationReason } = body

    // Validate required fields
    if (!creatorAddress || !bio || !verificationReason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate bio length
    if (bio.length < 100) {
      return NextResponse.json(
        { error: 'Bio must be at least 100 characters long' },
        { status: 400 }
      )
    }

    // Validate verification reason length
    if (verificationReason.length < 50) {
      return NextResponse.json(
        { error: 'Verification reason must be at least 50 characters long' },
        { status: 400 }
      )
    }

    // Forward to the main verification API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/verification/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization headers if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify({
        creatorAddress,
        bio,
        websiteUrl,
        twitterHandle,
        linkedinProfile,
        portfolioUrl,
        verificationReason,
        source: 'miniapp' // Mark as coming from miniapp
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error || 'Verification application failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Verification application submitted successfully from MiniApp',
      applicationId: data.applicationId,
      miniapp: true
    }, { status: 200 })

  } catch (error) {
    console.error('MiniApp verification application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
