/**
 * Verification Application API Route
 * 
 * This endpoint handles creator verification application submissions.
 * It stores the application data and triggers the review process.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/verification/apply
 * 
 * Submit a creator verification application
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

    // TODO: In a real implementation, you would:
    // 1. Store the application in a database
    // 2. Send notification to admin team
    // 3. Update creator's verification status to 'pending'
    // 4. Send confirmation email to creator

    // For now, we'll just log the application and return success
    console.log('Verification application received:', {
      creatorAddress,
      bio,
      websiteUrl,
      twitterHandle,
      linkedinProfile,
      portfolioUrl,
      verificationReason,
      submittedAt: new Date().toISOString()
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Verification application submitted successfully',
        applicationId: `app_${Date.now()}_${creatorAddress.slice(2, 8)}`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Verification application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 