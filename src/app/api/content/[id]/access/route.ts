// src/app/api/content/[id]/access/route.ts
// Content Access Verification API for Frame Integration
// Leverages existing Phase 1 smart contract infrastructure

import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'

/**
 * Access Verification Response Interface
 * 
 * This interface defines the structure of access verification responses,
 * providing clear information about whether a user can access content
 * and what actions they might need to take to gain access.
 */
interface AccessVerificationResponse {
  readonly hasAccess: boolean
  readonly requiresPurchase: boolean
  readonly accessType: 'free' | 'purchased' | 'subscription' | 'none'
  readonly expiresAt?: string
  readonly purchasePrice?: string
  readonly subscriptionInfo?: {
    readonly isActive: boolean
    readonly expiresAt: string
  }
}

/**
 * Content Access Data Interface
 * 
 * This interface defines the structure of content data needed for
 * access verification, ensuring type safety when working with
 * your contract data and pricing information.
 */
interface ContentAccessData {
  readonly id: bigint
  readonly creator: string
  readonly payPerViewPrice: bigint
  readonly isActive: boolean
  readonly requiresSubscription: boolean
}

/**
 * GET Handler for Content Access Verification
 * 
 * This handler verifies whether a user has access to specific content
 * by checking their purchase history and subscription status against
 * your existing smart contracts. It demonstrates how Component 2.4
 * seamlessly integrates with your Phase 1 infrastructure to maintain
 * consistent access control across all interaction patterns.
 * 
 * The verification logic leverages your existing contract architecture,
 * ensuring that Frame interactions follow the same security and business
 * rules as your main platform without duplicating access control logic.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unwrappedParams = await params
    const contentId = unwrappedParams.id
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('address')

    // Validate content ID
    if (!contentId || isNaN(Number(contentId))) {
      return NextResponse.json(
        { error: 'Invalid content ID' },
        { status: 400 }
      )
    }

    // Validate user address if provided
    if (userAddress && !isAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    // Fetch content data to understand access requirements
    const contentData = await fetchContentAccessData(contentId)
    
    if (!contentData) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // If no user address provided, return public access info
    if (!userAddress) {
      const response: AccessVerificationResponse = {
        hasAccess: contentData.payPerViewPrice === BigInt(0) && contentData.isActive,
        requiresPurchase: contentData.payPerViewPrice > BigInt(0),
        accessType: contentData.payPerViewPrice === BigInt(0) ? 'free' : 'none',
        purchasePrice: contentData.payPerViewPrice > BigInt(0) 
          ? (Number(contentData.payPerViewPrice) / 1e6).toFixed(2)
          : undefined
      }

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      })
    }

    // Verify user access for authenticated requests
    const accessVerification = await verifyUserAccess(contentData, userAddress)
    
    return NextResponse.json(accessVerification, {
      headers: {
        // Cache user-specific access for 1 minute to balance freshness with performance
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120'
      }
    })

  } catch (error) {
    console.error('Error verifying content access:', error)
    
    return NextResponse.json(
      { 
        error: 'Access verification failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Content Access Data Fetching
 * 
 * This function retrieves content data needed for access verification
 * by leveraging your existing content API infrastructure. It demonstrates
 * how access verification can reuse your established data access patterns
 * rather than implementing parallel contract reading logic.
 */
async function fetchContentAccessData(contentId: string): Promise<ContentAccessData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    
    // Use your existing content API endpoint
    const response = await fetch(`${baseUrl}/api/content/${contentId}`, {
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      return null
    }

    const content = await response.json()
    
    // Transform to access-specific data structure
    return {
      id: BigInt(contentId),
      creator: content.creator,
      payPerViewPrice: content.payPerViewPrice,
      isActive: content.isActive,
      requiresSubscription: content.requiresSubscription || false
    }
  } catch (error) {
    console.error('Error fetching content access data:', error)
    return null
  }
}

/**
 * User Access Verification Logic
 * 
 * This function implements the core access verification logic by checking
 * multiple access paths: direct purchase, subscription access, and creator
 * ownership. It demonstrates how to integrate multiple contract interactions
 * to provide comprehensive access control.
 */
async function verifyUserAccess(
  content: ContentAccessData,
  userAddress: string
): Promise<AccessVerificationResponse> {
  try {
    // Check if user is the content creator (automatic access)
    if (content.creator.toLowerCase() === userAddress.toLowerCase()) {
      return {
        hasAccess: true,
        requiresPurchase: false,
        accessType: 'free'
      }
    }

    // For free content, grant access if content is active
    if (content.payPerViewPrice === BigInt(0)) {
      return {
        hasAccess: content.isActive,
        requiresPurchase: false,
        accessType: 'free'
      }
    }

    // Check for existing purchase using your contract integration
    const hasPurchased = await checkDirectPurchase(content.id, userAddress)
    
    if (hasPurchased) {
      return {
        hasAccess: true,
        requiresPurchase: false,
        accessType: 'purchased'
      }
    }

    // Check subscription access if content supports it
    if (content.requiresSubscription) {
      const subscriptionInfo = await checkSubscriptionAccess(content.creator, userAddress)
      
      if (subscriptionInfo.isActive) {
        return {
          hasAccess: true,
          requiresPurchase: false,
          accessType: 'subscription',
          subscriptionInfo
        }
      }
    }

    // No access found - user needs to purchase
    return {
      hasAccess: false,
      requiresPurchase: true,
      accessType: 'none',
      purchasePrice: (Number(content.payPerViewPrice) / 1e6).toFixed(2)
    }

  } catch (error) {
    console.error('Error in user access verification:', error)
    
    // Default to requiring purchase on error for security
    return {
      hasAccess: false,
      requiresPurchase: true,
      accessType: 'none',
      purchasePrice: content.payPerViewPrice > BigInt(0) 
        ? (Number(content.payPerViewPrice) / 1e6).toFixed(2)
        : undefined
    }
  }
}

/**
 * Direct Purchase Verification
 * 
 * This function checks if a user has directly purchased access to content
 * by querying your PayPerView contract. It demonstrates how access verification
 * integrates with your existing smart contract infrastructure to maintain
 * consistent purchase tracking across all platform interactions.
 */
async function checkDirectPurchase(contentId: bigint, userAddress: string): Promise<boolean> {
  try {
    // This would integrate with your existing contract reading infrastructure
    // For now, we'll simulate the check with your API
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    
    const response = await fetch(
      `${baseUrl}/api/purchases/check?contentId=${contentId}&address=${userAddress}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      return false
    }

    const purchaseData = await response.json()
    return purchaseData.hasPurchased || false

  } catch (error) {
    console.error('Error checking direct purchase:', error)
    return false
  }
}

/**
 * Subscription Access Verification
 * 
 * This function checks if a user has active subscription access to a creator's
 * content by querying your SubscriptionManager contract. It demonstrates how
 * Component 2.4 supports multiple access models while maintaining integration
 * with your existing subscription infrastructure.
 */
async function checkSubscriptionAccess(
  creatorAddress: string, 
  userAddress: string
): Promise<{ isActive: boolean; expiresAt: string }> {
  try {
    // This would integrate with your existing contract reading infrastructure
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    
    const response = await fetch(
      `${baseUrl}/api/subscriptions/check?creator=${creatorAddress}&subscriber=${userAddress}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      return { isActive: false, expiresAt: '' }
    }

    const subscriptionData = await response.json()
    return {
      isActive: subscriptionData.isActive || false,
      expiresAt: subscriptionData.expiresAt || ''
    }

  } catch (error) {
    console.error('Error checking subscription access:', error)
    return { isActive: false, expiresAt: '' }
  }
}

/**
 * OPTIONS Handler for CORS Support
 * 
 * This handler enables proper cross-origin resource sharing for the access
 * verification endpoint, ensuring that Frame interactions and other client-side
 * requests can successfully verify content access regardless of their origin.
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}