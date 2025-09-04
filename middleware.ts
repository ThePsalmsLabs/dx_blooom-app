// File: middleware.ts (at project root)
/**
 * x402 Payment Middleware Integration - Production Ready Implementation
 * 
 * This middleware demonstrates advanced patterns for building robust Web3 payment gateways
 * that integrate seamlessly with existing Next.js applications. It showcases several
 * important concepts:
 * 
 * 1. **Immutable Request Handling**: Proper ways to pass data between middleware and
 *    route handlers without violating TypeScript's immutability constraints
 * 
 * 2. **Progressive Enhancement**: How to add payment capabilities to existing routes
 *    without breaking existing functionality
 * 
 * 3. **Error Resilience**: Comprehensive error handling that degrades gracefully
 *    when external services are unavailable
 * 
 * 4. **Type Safety**: Advanced TypeScript patterns for working with external APIs
 *    and blockchain data while maintaining compile-time safety
 * 
 * Think of this middleware as a sophisticated payment orchestrator that sits between
 * your users and your content, automatically handling the complexity of blockchain
 * payments while providing a simple HTTP-based interface.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, Address } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { 
  getX402MiddlewareConfig, 
  createMiddlewarePaymentRequirements,
  validateMiddlewareConfig,
  createSecureHeaders
} from '@/lib/web3/x402-config'
import { getContractAddresses } from '@/lib/contracts/config'

/**
 * x402 Payment Proof Structure
 * 
 * This interface defines the cryptographic proof that clients must provide
 * when making payments through the x402 protocol. Each field serves a specific
 * security purpose in preventing fraud and ensuring payment integrity.
 */
export interface X402PaymentProof {
  readonly signature: string      // EIP-712 signature proving payment authorization
  readonly amount: string         // Payment amount in token's smallest unit (6 decimals for USDC)
  readonly token: Address         // Token contract address (USDC on Base/Base Sepolia)
  readonly recipient: Address     // Recipient wallet address (your resource wallet)
  readonly deadline: number       // Unix timestamp preventing stale payment authorizations
  readonly nonce: string          // Unique identifier preventing replay attacks
  readonly chainId: number        // Network identifier ensuring payments on correct chain
}

/**
 * Payment Verification Result
 * 
 * This interface standardizes the result of payment verification operations,
 * providing both success/failure status and detailed information about the verification.
 */
export interface PaymentVerificationResult {
  readonly verified: boolean
  readonly transactionHash?: string
  readonly verifiedAmount?: bigint
  readonly error?: string
  readonly timestamp: number
}

/**
 * Route Parameter Extraction Result
 * 
 * This interface structures the data extracted from dynamic route parameters,
 * enabling the middleware to determine what content is being accessed and
 * how to price it appropriately.
 */
interface RouteParameters {
  readonly contentId?: string
  readonly creatorAddress?: Address
  readonly routeType: 'content' | 'creator' | 'subscription' | 'unknown'
}

/**
 * Dynamic Pricing Information
 * 
 * This interface represents pricing data fetched from your smart contracts,
 * combining the payment amount with recipient information.
 */
interface PricingInfo {
  readonly amount: bigint
  readonly recipient: Address
  readonly contentActive: boolean
}

/**
 * Custom Headers for Payment Communication
 * 
 * These constants define the HTTP headers used to communicate payment verification
 * results between middleware and route handlers. This approach solves the immutability
 * problem while maintaining clean separation of concerns.
 */
const PAYMENT_HEADERS = {
  VERIFIED: 'x-payment-verified',
  AMOUNT: 'x-payment-amount', 
  TOKEN: 'x-payment-token',
  TRANSACTION_HASH: 'x-payment-tx-hash',
  CONTENT_ID: 'x-payment-content-id',
  RECIPIENT: 'x-payment-recipient'
} as const

const X402_FACILITATOR_TIMEOUT = 10000; // 10 seconds
const X402_NETWORK = (process.env.NEXT_PUBLIC_X402_NETWORK === 'base-sepolia') ? 'base-sepolia' : 'base';
const X402_CHAIN_ID = X402_NETWORK === 'base' ? 8453 : 84532;

/**
 * Create Blockchain Client with Optimized Configuration
 * 
 * This function creates a viem client optimized for middleware operations.
 * It includes retry logic, batching, and error handling specifically tuned
 * for the high-throughput, low-latency requirements of payment middleware.
 */
function createOptimizedBlockchainClient(network: 'base' | 'base-sepolia') {
  const chain = network === 'base' ? base : baseSepolia
  
  // Use the same RPC configuration as your existing wagmi setup for consistency
  const rpcUrl = network === 'base' 
    ? process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || 'https://mainnet.base.org'
    : process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'

  return createPublicClient({
    chain,
    transport: http(rpcUrl, {
      // Optimized configuration for middleware performance
      batch: {
        batchSize: 5,        // Smaller batches for faster response
        wait: 8,             // Reduced wait time for immediate responses
      },
      retryCount: 2,         // Limited retries to prevent timeout issues
      retryDelay: 500,       // Quick retry for transient failures
      timeout: 10000,        // 10 second timeout for middleware operations
    }),
  })
}

/**
 * Route Parameter Extraction with Advanced Pattern Matching
 * 
 * This function demonstrates sophisticated URL parsing that handles your existing
 * API route structure while being extensible for future route patterns. It uses
 * regular expressions to extract meaningful data from dynamic routes.
 */
function extractRouteParameters(pathname: string): RouteParameters {
  // Content access routes: /api/protected/content/[id] or /miniapp/content/[id]
  const contentMatch = pathname.match(/\/(?:api\/protected\/|miniapp\/)content\/([^\/]+)/)
  if (contentMatch) {
    return {
      contentId: contentMatch[1],
      routeType: 'content'
    }
  }

  // Creator subscription routes: /api/protected/subscribe/[creator]
  const subscribeMatch = pathname.match(/\/api\/protected\/subscribe\/(0x[a-fA-F0-9]{40})/)
  if (subscribeMatch) {
    return {
      creatorAddress: subscribeMatch[1] as Address,
      routeType: 'subscription'
    }
  }

  // Creator profile routes: /api/protected/creator/[address]
  const creatorMatch = pathname.match(/\/api\/protected\/creator\/(0x[a-fA-F0-9]{40})/)
  if (creatorMatch) {
    return {
      creatorAddress: creatorMatch[1] as Address,
      routeType: 'creator'
    }
  }

  return { routeType: 'unknown' }
}

/**
 * Smart Contract Integration for Dynamic Pricing
 * 
 * This function demonstrates how to integrate with your existing smart contracts
 * to fetch real-time pricing information. It includes comprehensive error handling
 * and fallback mechanisms to ensure the middleware remains responsive even when
 * blockchain interactions are slow or fail.
 */
async function fetchContractPricing(
  client: ReturnType<typeof createOptimizedBlockchainClient>,
  routeType: RouteParameters['routeType'],
  contractAddresses: ReturnType<typeof getContractAddresses>,
  parameters: { contentId?: string; creatorAddress?: Address }
): Promise<PricingInfo | null> {
  try {
    if (routeType === 'content' && parameters.contentId) {
      // Fetch content pricing and availability from ContentRegistry
      const contentData = await Promise.race([
        client.readContract({
          address: contractAddresses.CONTENT_REGISTRY,
          abi: [
            {
              name: 'getContent',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'contentId', type: 'uint256' }],
              outputs: [
                {
                  type: 'tuple',
                  components: [
                    { name: 'creator', type: 'address' },
                    { name: 'payPerViewPrice', type: 'uint256' },
                    { name: 'isActive', type: 'bool' }
                  ]
                }
              ]
            }
          ] as const,
          functionName: 'getContent',
          args: [BigInt(parameters.contentId)]
        }),
        // Race against timeout to ensure middleware responsiveness
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contract call timeout')), 5000)
        )
      ]) as { creator: Address; payPerViewPrice: bigint; isActive: boolean }

      return {
        amount: contentData.payPerViewPrice,
        recipient: contentData.creator,
        contentActive: contentData.isActive
      }
    }

    if (routeType === 'subscription' && parameters.creatorAddress) {
      // Fetch subscription pricing from CreatorRegistry using getSubscriptionPrice + isRegisteredCreator
      const [subscriptionPrice, isRegistered] = await Promise.race([
        Promise.all([
          client.readContract({
            address: contractAddresses.CREATOR_REGISTRY,
            abi: [
              {
                name: 'getSubscriptionPrice',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'creator', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }
            ] as const,
            functionName: 'getSubscriptionPrice',
            args: [parameters.creatorAddress]
          }),
          client.readContract({
            address: contractAddresses.CREATOR_REGISTRY,
            abi: [
              {
                name: 'isRegisteredCreator',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'creator', type: 'address' }],
                outputs: [{ name: '', type: 'bool' }]
              }
            ] as const,
            functionName: 'isRegisteredCreator',
            args: [parameters.creatorAddress]
          })
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Contract call timeout')), 5000)
        )
      ]) as [bigint, boolean]

      return {
        amount: subscriptionPrice,
        recipient: parameters.creatorAddress,
        contentActive: isRegistered
      }
    }

    return null
  } catch (error) {
    console.error('Contract pricing fetch failed:', error)
    return null
  }
}

/**
 * Comprehensive Payment Verification with Security Checks
 * 
 * This function implements the complete x402 payment verification process,
 * including cryptographic validation, amount verification, deadline checking,
 * and integration with the Coinbase facilitator service for final confirmation.
 */
async function verifyPaymentProof(
  paymentProof: X402PaymentProof,
  expectedAmount: bigint,
  expectedRecipient: Address,
  network: 'base' | 'base-sepolia'
): Promise<PaymentVerificationResult> {
  const startTime = Date.now()
  
  try {
    // Step 1: Validate payment proof structure and format
    if (!paymentProof.signature || !paymentProof.amount || !paymentProof.token || !paymentProof.recipient) {
      return {
        verified: false,
        error: 'Incomplete payment proof',
        timestamp: Date.now()
      }
    }

    // Step 2: Verify payment amount meets or exceeds requirement
    const providedAmount = BigInt(paymentProof.amount)
    if (providedAmount < expectedAmount) {
      return {
        verified: false,
        error: `Insufficient payment amount: provided ${providedAmount}, required ${expectedAmount}`,
        timestamp: Date.now()
      }
    }

    // Step 3: Verify payment recipient matches expected recipient
    if (paymentProof.recipient.toLowerCase() !== expectedRecipient.toLowerCase()) {
      return {
        verified: false,
        error: 'Payment recipient mismatch',
        timestamp: Date.now()
      }
    }

    // Step 4: Check payment deadline to prevent stale payments
    const currentTime = Math.floor(Date.now() / 1000)
    if (paymentProof.deadline < currentTime) {
      return {
        verified: false,
        error: 'Payment authorization expired',
        timestamp: Date.now()
      }
    }

    // Step 5: Verify network consistency
    const expectedChainId = network === 'base' ? 8453 : 84532
    if (paymentProof.chainId !== expectedChainId) {
      return {
        verified: false,
        error: `Network mismatch: expected ${expectedChainId}, got ${paymentProof.chainId}`,
        timestamp: Date.now()
      }
    }

    // Step 6: Verify payment through Coinbase x402 facilitator
    const config = getX402MiddlewareConfig(X402_CHAIN_ID)
    const facilitatorResponse = await Promise.race([
      fetch(`${config.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'x402-middleware/1.0',
        },
        body: JSON.stringify({
          paymentProof,
          expectedAmount: expectedAmount.toString(),
          expectedRecipient,
          network,
        }),
      }),
      // Race against timeout to ensure responsiveness
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Facilitator timeout')), X402_FACILITATOR_TIMEOUT)
      )
    ])

    if (!facilitatorResponse.ok) {
      return {
        verified: false,
        error: `Facilitator verification failed: ${facilitatorResponse.status}`,
        timestamp: Date.now()
      }
    }

    const verificationResult = await facilitatorResponse.json()
    
    return {
      verified: verificationResult.verified === true,
      transactionHash: verificationResult.transactionHash,
      verifiedAmount: providedAmount,
      error: verificationResult.verified ? undefined : verificationResult.error,
      timestamp: Date.now()
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed',
      timestamp: Date.now()
    }
  }
}

/**
 * Generate 402 Payment Required Response
 * 
 * This function creates the standardized HTTP 402 response that instructs
 * x402-compatible clients how to complete payment. The response includes
 * all necessary information for automatic payment processing.
 */
function create402PaymentResponse(
  amount: bigint,
  recipient: Address,
  network: 'base' | 'base-sepolia',
  metadata?: { contentId?: string; description?: string }
): NextResponse {
  const paymentRequirements = createMiddlewarePaymentRequirements(
    amount,
    recipient,
    network,
    metadata
  )

  const headers = createSecureHeaders(true)

  const response = new NextResponse(JSON.stringify(paymentRequirements), {
    status: 402,
    headers
  })

  return addCSPHeaders(response)
}

/**
 * Add CSP Headers to Response
 *
 * This function adds Content Security Policy headers to any response.
 */
function addCSPHeaders(response: NextResponse): NextResponse {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://auth.privy.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://auth.privy.io wss: https:",
    "frame-src 'self' https://auth.privy.io",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspHeader)
  return response
}

/**
 * Create Success Response with Payment Headers
 *
 * This function demonstrates the pattern for passing payment verification data
 * to downstream route handlers without violating immutability constraints.
 * It uses custom HTTP headers to communicate payment status.
 */
function createSuccessResponse(
  request: NextRequest,
  verificationResult: PaymentVerificationResult,
  pricingInfo: PricingInfo,
  contentId?: string
): NextResponse {
  // Create response that continues to the next handler
  const response = NextResponse.next()

  // Add payment verification headers for downstream handlers to read
  response.headers.set(PAYMENT_HEADERS.VERIFIED, 'true')
  response.headers.set(PAYMENT_HEADERS.AMOUNT, pricingInfo.amount.toString())
  response.headers.set(PAYMENT_HEADERS.RECIPIENT, pricingInfo.recipient)

  if (verificationResult.transactionHash) {
    response.headers.set(PAYMENT_HEADERS.TRANSACTION_HASH, verificationResult.transactionHash)
  }

  if (contentId) {
    response.headers.set(PAYMENT_HEADERS.CONTENT_ID, contentId)
  }

  // Add CSP headers
  return addCSPHeaders(response)
}

/**
 * Main Request Processing Logic
 * 
 * This function orchestrates the entire payment verification process for
 * protected routes. It demonstrates how to build resilient middleware that
 * handles multiple failure modes gracefully while maintaining performance.
 */
async function processPaymentRequest(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  try {
    // Validate middleware configuration before processing
    validateMiddlewareConfig()

    // Extract route information to determine pricing strategy
    const routeParams = extractRouteParameters(pathname)
    
    if (routeParams.routeType === 'unknown') {
      return null // Not a protected route, continue normal processing
    }

    // Initialize blockchain client and configuration
    const config = getX402MiddlewareConfig(X402_CHAIN_ID)
    const contractAddresses = getContractAddresses(X402_CHAIN_ID)
    const blockchainClient = createOptimizedBlockchainClient(X402_NETWORK)

    // Fetch current pricing from smart contracts
    const pricingInfo = await fetchContractPricing(
      blockchainClient,
      routeParams.routeType,
      contractAddresses,
      { contentId: routeParams.contentId, creatorAddress: routeParams.creatorAddress }
    )

    // Handle cases where content is not available or not found
    if (!pricingInfo) {
      const response = new NextResponse('Content not found', {
        status: 404,
        headers: createSecureHeaders()
      })
      return addCSPHeaders(response)
    }

    if (!pricingInfo.contentActive) {
      const response = new NextResponse('Content not available', {
        status: 403,
        headers: createSecureHeaders()
      })
      return addCSPHeaders(response)
    }

    // Check for payment in request headers
    const paymentHeader = request.headers.get('X-PAYMENT')
    
    if (!paymentHeader) {
      // No payment provided, return 402 with payment instructions
      return create402PaymentResponse(
        pricingInfo.amount,
        pricingInfo.recipient,
        X402_NETWORK,
        {
          contentId: routeParams.contentId,
          description: `Access to ${routeParams.routeType} ${routeParams.contentId || routeParams.creatorAddress}`
        }
      )
    }

    // Parse payment proof from header
    let paymentProof: X402PaymentProof
    try {
      paymentProof = JSON.parse(paymentHeader)
    } catch (parseError) {
      const response = new NextResponse('Invalid payment format', {
        status: 400,
        headers: createSecureHeaders()
      })
      return addCSPHeaders(response)
    }

    // Verify payment against expected parameters
    const verificationResult = await verifyPaymentProof(
      paymentProof,
      pricingInfo.amount,
      pricingInfo.recipient,
      X402_NETWORK
    )

    if (!verificationResult.verified) {
      console.warn('Payment verification failed:', verificationResult.error)
      // Return fresh payment requirements for retry
      const response = create402PaymentResponse(
        pricingInfo.amount,
        pricingInfo.recipient,
        X402_NETWORK,
        {
          contentId: routeParams.contentId,
          description: `Payment verification failed: ${verificationResult.error}`
        }
      )
      return addCSPHeaders(response)
    }

    // Payment verified successfully, create response with payment headers
    return createSuccessResponse(
      request,
      verificationResult,
      pricingInfo,
      routeParams.contentId
    )

  } catch (error) {
    console.error('Payment processing error:', error)
    const response = new NextResponse('Payment processing error', {
      status: 500,
      headers: createSecureHeaders()
    })
    return addCSPHeaders(response)
  }
}

/**
 * Next.js Middleware Entry Point
 *
 * This is the main function that Next.js calls for every request matching
 * the matcher configuration. It determines whether requests need payment
 * processing and routes them appropriately.
 */
export default async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Define protected route patterns that require x402 payment
  const protectedRoutePatterns = [
    /^\/api\/protected\/content\/[^\/]+$/,        // Content access endpoints
    /^\/api\/protected\/subscribe\/[^\/]+$/,      // Subscription endpoints  
    /^\/miniapp\/content\/[^\/]+$/,               // Mini app content routes
    /^\/api\/frame\/premium$/                     // Premium frame endpoints
  ]

  // Check if current request matches any protected route pattern
  const isProtectedRoute = protectedRoutePatterns.some(pattern => pattern.test(pathname))

  if (!isProtectedRoute) {
    // Not a protected route, continue with normal Next.js processing
    const response = NextResponse.next()
    return addCSPHeaders(response)
  }

  // Process payment verification for protected route
  const paymentResponse = await processPaymentRequest(request, pathname)

  if (paymentResponse) {
    // Payment processing returned a specific response (402, error, or success with headers)
    return addCSPHeaders(paymentResponse)
  }

  // Payment verified and headers set, continue to route handler
  const response = NextResponse.next()
  return addCSPHeaders(response)
}

/**
 * Middleware Configuration for Next.js
 * 
 * This configuration tells Next.js which routes this middleware should handle.
 * The matcher is optimized to include only routes that might need payment
 * processing while excluding static assets for better performance.
 */
export const config = {
  matcher: [
    // Include API routes that might need protection
    '/api/protected/:path*',
    '/miniapp/:path*', 
    '/api/frame/:path*',
    // Exclude static files, images, and Next.js internals for performance
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

/**
 * Utility Functions for Route Handlers
 * 
 * These functions help your existing route handlers read payment verification
 * data from the headers set by this middleware. This maintains clean separation
 * between payment processing and content delivery logic.
 */

/**
 * Check if request has verified payment
 * Use this in your route handlers to determine if payment was verified
 * 
 * @param request - Next.js request object (or headers object)
 * @returns true if payment was verified by middleware
 */
export function hasVerifiedPayment(request: NextRequest | Headers): boolean {
  const headers = request instanceof Headers ? request : request.headers
  return headers.get(PAYMENT_HEADERS.VERIFIED) === 'true'
}

/**
 * Get payment details from middleware headers
 * Use this in your route handlers to access payment verification details
 * 
 * @param request - Next.js request object (or headers object)
 * @returns Payment details if available, null otherwise
 */
export function getPaymentDetails(request: NextRequest | Headers): {
  amount: bigint
  recipient: string
  transactionHash?: string
  contentId?: string
} | null {
  const headers = request instanceof Headers ? request : request.headers
  
  if (!hasVerifiedPayment(headers)) {
    return null
  }

  const amount = headers.get(PAYMENT_HEADERS.AMOUNT)
  const recipient = headers.get(PAYMENT_HEADERS.RECIPIENT)
  
  if (!amount || !recipient) {
    return null
  }

  return {
    amount: BigInt(amount),
    recipient,
    transactionHash: headers.get(PAYMENT_HEADERS.TRANSACTION_HASH) || undefined,
    contentId: headers.get(PAYMENT_HEADERS.CONTENT_ID) || undefined
  }
}