// src/app/api/protected/content/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { getContractAddresses, getContractConfig } from '../../../../../lib/contracts/config'

// Import verification functions (these will be implemented in subsequent components)
// Using placeholder implementations for now that can be replaced with actual logic
import { verifyWithExistingContracts } from '../../../../../lib/x402/verification'
import { hasActiveSubscription } from '../../../../../lib/contracts/subscription'

// Define the payment proof interface based on x402 specifications
// This structure represents the cryptographic proof that a payment was made
import { type Address, type Hash } from 'viem'

interface PaymentProof {
  readonly transactionId: Hash // The blockchain transaction hash
  readonly amount: string // Payment amount in USDC (as string to handle precision)
  readonly contentId: string // The content ID this payment was for
  readonly userAddress: Address // Address of the user who made the payment
  readonly timestamp: number // When the payment was made (Unix timestamp)
  readonly tokenAddress: Address // The token contract address used for payment (should be USDC)
  readonly recipientAddress: Address // The recipient address that should have received the payment
  readonly signature?: string // Optional cryptographic signature for additional verification
}

// Define the request body structure for the protected content endpoint
interface ProtectedContentRequest {
  readonly userAddress: string // Ethereum address of the requesting user
  readonly paymentProof?: {
    readonly transactionId: string // The blockchain transaction hash
    readonly amount: string // Payment amount in USDC (as string to handle precision)
    readonly contentId: string // The content ID this payment was for
    readonly userAddress: string // Address of the user who made the payment
    readonly timestamp: number // When the payment was made (Unix timestamp)
    readonly tokenAddress: string // The token contract address used for payment (should be USDC)
    readonly recipientAddress: string // The recipient address that should have received the payment
    readonly signature?: string // Optional cryptographic signature for additional verification
  } // Required for pay-per-view, optional for subscription
}

// Define the full content response interface (includes sensitive content)
interface ProtectedContentResponse {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: number
  readonly creatorAddress: string
  readonly pricingModel: 'pay-per-view' | 'subscription'
  readonly payPerViewPrice: string
  readonly ipfsHash: string // Full IPFS hash for content access
  readonly publishedAt: string
  readonly isActive: boolean
  readonly fullContent: string // The actual premium content
  readonly accessGrantedAt: string // Timestamp when access was granted
}

// Define error response interface for consistent error handling
interface ErrorResponse {
  readonly error: string
  readonly details?: string
  readonly code?: string // Error code for programmatic handling
}

/**
 * POST handler for accessing protected content with payment verification
 * 
 * This endpoint is the security gateway for premium content access. It implements
 * a dual verification system: direct payment verification for pay-per-view content
 * and subscription status checking for subscription-based content. The endpoint
 * ensures that users can only access content they have legitimately paid for.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProtectedContentResponse | ErrorResponse>> {
  try {
    // Extract and validate the content ID parameter
    const unwrappedParams = await params
    const contentIdParam = unwrappedParams.id
    
    if (!contentIdParam) {
      return NextResponse.json(
        { 
          error: 'Content ID is required',
          code: 'MISSING_CONTENT_ID'
        },
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
          details: 'Content ID must be a valid number',
          code: 'INVALID_CONTENT_ID'
        },
        { status: 400 }
      )
    }

    // Validate that the content ID is positive
    if (contentId <= BigInt(0)) {
      return NextResponse.json(
        { 
          error: 'Invalid content ID',
          details: 'Content ID must be greater than 0',
          code: 'INVALID_CONTENT_ID'
        },
        { status: 400 }
      )
    }

    // Parse and validate the request body
    let requestBody: ProtectedContentRequest
    try {
      requestBody = await request.json()
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          details: 'Request body must be valid JSON',
          code: 'INVALID_REQUEST_BODY'
        },
        { status: 400 }
      )
    }

    // Validate required fields in the request body
    const { userAddress, paymentProof } = requestBody

    if (!userAddress || typeof userAddress !== 'string') {
      return NextResponse.json(
        { 
          error: 'User address is required',
          details: 'userAddress field must be a valid string',
          code: 'MISSING_USER_ADDRESS'
        },
        { status: 400 }
      )
    }

    // Validate that the user address is a valid Ethereum address
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return NextResponse.json(
        { 
          error: 'Invalid user address format',
          details: 'userAddress must be a valid Ethereum address',
          code: 'INVALID_USER_ADDRESS'
        },
        { status: 400 }
      )
    }

    // Set up blockchain provider using the same configuration as the public route
    const network = process.env.NETWORK as 'base' | 'base-sepolia'
    const chainId = network === 'base' ? base.id : baseSepolia.id
    const chain = network === 'base' ? base : baseSepolia

    const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY 
      ? `https://${network}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : chain.rpcUrls.default.http[0]

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    })

    // Get contract configuration using your existing setup
    const contractConfig = getContractConfig(chainId, 'CONTENT_REGISTRY')

    // Fetch content data from the ContentRegistry contract (same as public route)
    const contentData = await publicClient.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'getContent',
      args: [contentId]
    })

    // Type assertion for the contract response based on your actual contract structure
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

    // Extract the properties from the struct
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

    // Check if content exists and is active (same validation as public route)
    if (creatorAddress === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { 
          error: 'Content not found',
          details: `No content exists with ID ${contentIdParam}`,
          code: 'CONTENT_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    if (!isActive) {
      return NextResponse.json(
        { 
          error: 'Content unavailable',
          details: 'This content is no longer available',
          code: 'CONTENT_INACTIVE'
        },
        { status: 404 }
      )
    }

    // Determine pricing model based on your business logic
    const pricingModel = payPerViewPrice > BigInt(0) ? 'pay-per-view' : 'subscription'

    // Handle payment verification based on the content's pricing model
    if (pricingModel === 'pay-per-view') {
      // For pay-per-view content, payment proof is required
      if (!paymentProof) {
        return NextResponse.json(
          { 
            error: 'Payment required',
            details: 'Payment proof is required for pay-per-view content',
            code: 'PAYMENT_PROOF_REQUIRED'
          },
          { status: 402 }
        )
      }

      // Validate payment proof structure
      if (!paymentProof.transactionId || !paymentProof.amount || !paymentProof.userAddress || 
          !paymentProof.tokenAddress || !paymentProof.recipientAddress) {
        return NextResponse.json(
          { 
            error: 'Invalid payment proof',
            details: 'Payment proof must include transactionId, amount, userAddress, tokenAddress, and recipientAddress',
            code: 'INVALID_PAYMENT_PROOF'
          },
          { status: 400 }
        )
      }

      // Cast the payment proof to the correct types for verification
      const typedPaymentProof = {
        transactionId: paymentProof.transactionId as Hash,
        amount: paymentProof.amount,
        contentId: paymentProof.contentId,
        userAddress: paymentProof.userAddress as Address,
        timestamp: paymentProof.timestamp,
        tokenAddress: paymentProof.tokenAddress as Address,
        recipientAddress: paymentProof.recipientAddress as Address,
        signature: paymentProof.signature
      }

      // Verify that the payment proof is for the correct user
      if (typedPaymentProof.userAddress.toLowerCase() !== userAddress.toLowerCase()) {
        return NextResponse.json(
          { 
            error: 'Payment proof mismatch',
            details: 'Payment proof must be for the requesting user',
            code: 'PAYMENT_PROOF_MISMATCH'
          },
          { status: 403 }
        )
      }

      // Verify that the payment amount matches the content price
      const proofAmount = BigInt(typedPaymentProof.amount)
      if (proofAmount < payPerViewPrice) {
        return NextResponse.json(
          { 
            error: 'Insufficient payment',
            details: `Payment amount ${typedPaymentProof.amount} is less than required ${payPerViewPrice.toString()}`,
            code: 'INSUFFICIENT_PAYMENT'
          },
          { status: 402 }
        )
      }

      // Verify the payment proof against your existing contracts
      // This function will be implemented in Component 1.3
      try {
        const isValidPayment = await verifyWithExistingContracts(typedPaymentProof)
        
        if (!isValidPayment) {
          return NextResponse.json(
            { 
              error: 'Payment verification failed',
              details: 'The provided payment proof could not be verified',
              code: 'PAYMENT_VERIFICATION_FAILED'
            },
            { status: 402 }
          )
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        return NextResponse.json(
          { 
            error: 'Payment verification error',
            details: 'Unable to verify payment at this time',
            code: 'PAYMENT_VERIFICATION_ERROR'
          },
          { status: 503 }
        )
      }

    } else if (pricingModel === 'subscription') {
      // For subscription content, check active subscription status
      // Extract creator ID from the creator address for subscription checking
      const creatorId = BigInt(creatorAddress) // This might need adjustment based on your creator ID system

      try {
        const hasSubscription = await hasActiveSubscription(userAddress, creatorId)
        
        if (!hasSubscription) {
          return NextResponse.json(
            { 
              error: 'Subscription required',
              details: 'An active subscription to this creator is required to access this content',
              code: 'SUBSCRIPTION_REQUIRED'
            },
            { status: 403 }
          )
        }
      } catch (error) {
        console.error('Subscription verification error:', error)
        return NextResponse.json(
          { 
            error: 'Subscription verification error',
            details: 'Unable to verify subscription status at this time',
            code: 'SUBSCRIPTION_VERIFICATION_ERROR'
          },
          { status: 503 }
        )
      }
    }

    // If we reach this point, access is granted
    // In a real implementation, you would fetch the full content from IPFS using the ipfsHash
    // For now, we'll simulate the full content response
    const fullContent = `Full premium content for: ${title}. IPFS Hash: ${ipfsHash}`

    // Format the successful response with full content access
    const responseData: ProtectedContentResponse = {
      id: contentIdParam,
      title,
      description,
      category,
      creatorAddress,
      pricingModel,
      payPerViewPrice: payPerViewPrice.toString(),
      ipfsHash, // Full IPFS hash for content retrieval
      publishedAt: publishedAt.toString(),
      isActive,
      fullContent, // The premium content the user paid to access
      accessGrantedAt: new Date().toISOString() // Current timestamp
    }

    // Return successful response with full content access
    return NextResponse.json(responseData, { 
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate', // Never cache protected content
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    // Log the error for debugging while providing a clean response to users
    console.error('Error accessing protected content:', error)

    // Handle specific contract errors
    if (error instanceof Error) {
      if (error.message.includes('call revert')) {
        return NextResponse.json(
          { 
            error: 'Content not found',
            details: 'The specified content does not exist',
            code: 'CONTENT_NOT_FOUND'
          },
          { status: 404 }
        )
      }
      
      if (error.message.includes('network')) {
        return NextResponse.json(
          { 
            error: 'Network error',
            details: 'Unable to connect to blockchain network',
            code: 'NETWORK_ERROR'
          },
          { status: 503 }
        )
      }
    }

    // Generic error response for unexpected issues
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred while processing your request',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Explicitly disable other HTTP methods for this route
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      details: 'Use POST method to access protected content',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  )
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { 
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    },
    { status: 405 }
  )
}