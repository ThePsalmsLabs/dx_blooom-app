/**
 * Admin Verification Pending Applications API Route
 * 
 * This endpoint allows admins to fetch pending verification applications
 * for review. It should be protected with admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/verification/pending
 * 
 * Get all pending verification applications
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: In a real implementation, you would:
    // 1. Verify admin authentication/authorization
    // 2. Query database for pending applications
    // 3. Return formatted application data

    // For now, we'll return mock data
    const mockApplications = [
      {
        creatorAddress: '0x1234567890123456789012345678901234567890',
        bio: 'I am a passionate content creator focused on blockchain technology and decentralized applications. I have been creating educational content for over 2 years and have built a strong community of developers and enthusiasts.',
        websiteUrl: 'https://mywebsite.com',
        twitterHandle: '@blockchaincreator',
        linkedinProfile: 'linkedin.com/in/blockchaincreator',
        portfolioUrl: 'https://portfolio.com',
        verificationReason: 'I want to be verified to build trust with my audience and gain access to exclusive creator features that will help me grow my platform.',
        contentCount: 15,
        totalEarnings: 2500,
        subscriberCount: 45,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        creatorAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        bio: 'Professional software developer and educator specializing in Web3 development. I create comprehensive tutorials and guides for developers entering the blockchain space.',
        websiteUrl: 'https://web3tutorials.com',
        twitterHandle: '@web3dev',
        linkedinProfile: 'linkedin.com/in/web3dev',
        portfolioUrl: 'https://github.com/web3dev',
        verificationReason: 'Verification will help establish credibility with my audience and enable me to access advanced analytics to better understand my content performance.',
        contentCount: 8,
        totalEarnings: 1800,
        subscriberCount: 32,
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ]

    return NextResponse.json(mockApplications, { status: 200 })

  } catch (error) {
    console.error('Failed to fetch pending applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 