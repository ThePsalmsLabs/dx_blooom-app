// src/app/api/content/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { getContractAddresses, getContractConfig } from '@/lib/contracts/config'

// Define the content metadata interface for API responses
interface ContentMetadata {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: number
  readonly creatorAddress: string
  readonly pricingModel: 'pay-per-view' | 'subscription'
  readonly payPerViewPrice: string // USDC amount in wei (string to handle BigInt)
  readonly ipfsHash: string
  readonly publishedAt: string // Unix timestamp as string
  readonly isActive: boolean
}

// Define error response interface for consistent error handling
interface ErrorResponse {
  readonly error: string
  readonly details?: string
}

/**
 * GET handler for fetching public content metadata
 * 
 * This endpoint provides public information about content without requiring payment.
 * It fetches data directly from the ContentRegistry contract and formats it
 * for frontend consumption. Payment verification happens in the protected route.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ContentMetadata | ErrorResponse>> {
  try {
    // Extract and validate the content ID parameter
    const unwrappedParams = await params
    const contentIdParam = unwrappedParams.id
    
    if (!contentIdParam) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    // Convert string ID to BigInt for contract interaction
    let contentId: bigint
    try {
      contentId = BigInt(contentIdParam)
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid content ID format',
          details: 'Content ID must be a valid number'
        },
        { status: 400 }
      )
    }

    // Validate that the content ID is positive
    if (contentId <= 0) {
      return NextResponse.json(
        { 
          error: 'Invalid content ID',
          details: 'Content ID must be greater than 0'
        },
        { status: 400 }
      )
    }

    // Determine the network from environment variables
    const network = process.env.NETWORK as 'base' | 'base-sepolia'
    const chainId = network === 'base' ? base.id : baseSepolia.id
    const chain = network === 'base' ? base : baseSepolia

    // Set up the blockchain provider using your existing configuration
    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY 
      ? `https://${network}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : chain.rpcUrls.default.http[0]

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    // Get contract configuration using your existing setup
    const contractConfig = getContractConfig(chainId, 'CONTENT_REGISTRY')

    // Fetch content data from the ContentRegistry contract
    // This calls the getContentById function on your deployed contract
    const contentData = await publicClient.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'getContent',
      args: [contentId]
    })

    // Type assertion for the contract response based on your actual contract structure
    // Your contract returns a struct with named properties, which is much cleaner
    const contentStruct = contentData as {
      readonly creator: `0x${string}`
      readonly ipfsHash: string
      readonly title: string
      readonly description: string
      readonly category: number
      readonly payPerViewPrice: bigint
      readonly createdAt: bigint
      readonly isActive: boolean
    }

    // Extract the properties from the struct using descriptive names
    const {
      title,
      description,
      category,
      creator: creatorAddress,
      payPerViewPrice,
      ipfsHash,
      createdAt: publishedAt,
      isActive
    } = contentStruct

    // Check if content exists by verifying that the creator address is not zero
    if (creatorAddress === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { 
          error: 'Content not found',
          details: `No content exists with ID ${contentIdParam}`
        },
        { status: 404 }
      )
    }

    // Check if content is active (not deleted/disabled)
    if (!isActive) {
      return NextResponse.json(
        { 
          error: 'Content unavailable',
          details: 'This content is no longer available'
        },
        { status: 404 }
      )
    }

    // Determine pricing model based on your business logic
    // If payPerViewPrice is 0, it's subscription-only; otherwise it's pay-per-view
    const pricingModel = payPerViewPrice > BigInt(0) ? 'pay-per-view' : 'subscription'

    // Format the response with public metadata only
    const responseData: ContentMetadata = {
      id: contentIdParam,
      title,
      description,
      category,
      creatorAddress,
      pricingModel,
      payPerViewPrice: payPerViewPrice.toString(), // Convert BigInt to string for JSON
      ipfsHash, // This could be filtered to show only a preview hash if needed
      publishedAt: publishedAt.toString(), // Convert BigInt timestamp to string
      isActive
    }

    // Return successful response with content metadata
    return NextResponse.json(responseData, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' // Cache for 5 minutes
      }
    })

  } catch (error) {
    // Log the error for debugging while providing a clean response to users
    console.error('Error fetching content:', error)

    // Handle specific contract errors
    if (error instanceof Error) {
      if (error.message.includes('call revert')) {
        return NextResponse.json(
          { 
            error: 'Content not found',
            details: 'The specified content does not exist'
          },
          { status: 404 }
        )
      }
      
      if (error.message.includes('network')) {
        return NextResponse.json(
          { 
            error: 'Network error',
            details: 'Unable to connect to blockchain network'
          },
          { status: 503 }
        )
      }
    }

    // Generic error response for unexpected issues
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching content'
      },
      { status: 500 }
    )
  }
}

// Explicitly disable other HTTP methods for this route
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}