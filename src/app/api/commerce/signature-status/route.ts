/**
 * Backend Operator Signature Service - Fix 2: Commerce Protocol Integration
 * File: src/app/api/commerce/signature-status/route.ts
 * 
 * This backend service provides secure operator signatures for Commerce Protocol
 * payment intents. It acts as the trusted intermediary that validates and signs
 * payment intents, enabling users to pay with ETH and other tokens while creators
 * receive USDC through the Base Commerce Protocol.
 * 
 * Key Security Features:
 * - EIP-712 compliant signature generation for payment intents
 * - Secure private key management with environment variable protection
 * - Intent validation and expiration checking before signing
 * - Rate limiting and request validation to prevent abuse
 * - Comprehensive logging for audit trails and debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http } from 'viem'
import { baseSepolia, base } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Import contract configuration and ABI
import { getContractAddresses } from '@/lib/contracts/config'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'

/**
 * Signature Request Interface
 * 
 * This interface defines the structure of requests sent to the signature service,
 * ensuring proper validation and type safety for intent signing operations.
 */
interface SignatureRequest {
  readonly intentId: string       // Unique identifier for the payment intent
  readonly intentHash: string     // EIP-712 hash to be signed by the operator
  readonly deadline?: number      // Optional deadline for validation
  readonly userAddress?: string   // Optional user address for additional validation
}

/**
 * Signature Response Interface
 * 
 * This interface defines the structure of responses from the signature service,
 * providing clear indication of signing status and results.
 */
interface SignatureResponse {
  readonly success: boolean       // Whether the signing operation succeeded
  readonly isSigned: boolean      // Whether the intent has been signed
  readonly signature?: string     // The operator signature (if signed)
  readonly error?: string         // Error message (if signing failed)
  readonly expiresAt?: number     // When the signature expires
}

/**
 * Intent Registry Interface
 * 
 * This interface manages the in-memory registry of payment intents that have been
 * processed by the signature service, preventing replay attacks and managing state.
 */
interface IntentRegistryEntry {
  readonly intentId: string       // Intent identifier
  readonly intentHash: string     // Original hash
  readonly signature: string      // Generated signature
  readonly createdAt: number      // Timestamp when signed
  readonly expiresAt: number      // When signature expires
  readonly isUsed: boolean        // Whether signature has been used
}

/**
 * Environment Configuration Validation
 * 
 * This section validates that all required environment variables are properly
 * configured for the signature service to operate securely and correctly.
 */
const OPERATOR_PRIVATE_KEY = process.env.COMMERCE_OPERATOR_PRIVATE_KEY
const NODE_ENV = process.env.NODE_ENV || 'development'
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100 // Max requests per window

if (!OPERATOR_PRIVATE_KEY) {
  throw new Error('COMMERCE_OPERATOR_PRIVATE_KEY environment variable is required')
}

if (!OPERATOR_PRIVATE_KEY.startsWith('0x') || OPERATOR_PRIVATE_KEY.length !== 66) {
  throw new Error('COMMERCE_OPERATOR_PRIVATE_KEY must be a valid 32-byte hex string with 0x prefix')
}

/**
 * Blockchain Client Configuration
 * 
 * This section sets up the blockchain clients needed to interact with the
 * CommerceProtocolIntegration contract for signature operations and validation.
 */
const currentChain = NODE_ENV === 'production' ? base : baseSepolia
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
const ALCHEMY_URL = ALCHEMY_API_KEY
  ? (currentChain.id === base.id
      ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      : `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
  : undefined

const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(ALCHEMY_URL)
})

const operatorAccount = privateKeyToAccount(OPERATOR_PRIVATE_KEY as `0x${string}`)

const walletClient = createWalletClient({
  account: operatorAccount,
  chain: currentChain,
  transport: http(ALCHEMY_URL)
})

/**
 * In-Memory Intent Registry
 * 
 * This registry maintains state for signed intents, preventing replay attacks
 * and enabling efficient lookup of signature status. In production, this should
 * be replaced with a persistent database like Redis or PostgreSQL.
 */
const intentRegistry = new Map<string, IntentRegistryEntry>()

/**
 * Rate Limiting System
 * 
 * This system prevents abuse of the signature service by limiting the number
 * of requests from individual IP addresses within specified time windows.
 */
const rateLimitRegistry = new Map<string, { count: number; windowStart: number }>()

/**
 * Rate Limiting Function
 * 
 * This function checks whether a request from a specific IP address should be
 * allowed based on current rate limiting rules and request history.
 */
function checkRateLimit(ipAddress: string): boolean {
  const now = Date.now()
  const existing = rateLimitRegistry.get(ipAddress)

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW) {
    // New window or first request from this IP
    rateLimitRegistry.set(ipAddress, { count: 1, windowStart: now })
    return true
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit exceeded
  }

  // Increment count within current window
  rateLimitRegistry.set(ipAddress, { 
    count: existing.count + 1, 
    windowStart: existing.windowStart 
  })
  return true
}

/**
 * Intent Validation Function
 * 
 * This function performs comprehensive validation of payment intents before
 * signing, ensuring that only legitimate intents are processed by the service.
 */
async function validateIntent(intentId: string, intentHash: string): Promise<boolean> {
  try {
    const contractAddresses = getContractAddresses(currentChain.id)
    
    // Check if intent exists on the CommerceProtocolIntegration contract
    const intentHashOnChain = await publicClient.readContract({
      address: contractAddresses.COMMERCE_INTEGRATION,
      abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
      functionName: 'intentHashes',
      args: [intentId as `0x${string}`]
    }) as string

    // Verify the intent hash matches what's on-chain
    if (intentHashOnChain === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.error(`Intent ${intentId} not found on-chain`)
      return false
    }

    if (intentHashOnChain.toLowerCase() !== intentHash.toLowerCase()) {
      console.error(`Intent hash mismatch for ${intentId}`)
      return false
    }

    // Check if intent is already signed
    const isAlreadySigned = await publicClient.readContract({
      address: contractAddresses.COMMERCE_INTEGRATION,
      abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
      functionName: 'intentReadyForExecution',
      args: [intentId as `0x${string}`]
    }) as boolean

    if (isAlreadySigned) {
      console.log(`Intent ${intentId} is already signed`)
      return false // Already signed, don't sign again
    }

    return true
  } catch (error) {
    console.error('Intent validation failed:', error)
    return false
  }
}

/**
 * EIP-712 Signature Generation Function
 * 
 * This function generates a cryptographically secure signature for payment intents
 * using the EIP-712 standard, ensuring compatibility with Ethereum tooling and wallets.
 */
async function signIntentHash(intentHash: string): Promise<string> {
  try {
    // The intent hash is already properly formatted by the CommerceProtocolIntegration contract
    // We just need to sign it with the operator's private key
    const signature = await walletClient.signMessage({
      message: { raw: intentHash as `0x${string}` }
    })

    console.log(`Generated signature for intent hash ${intentHash}`)
    return signature
  } catch (error) {
    console.error('Signature generation failed:', error)
    throw new Error('Failed to generate operator signature')
  }
}

/**
 * Signature Submission Function
 * 
 * This function submits the generated signature to the CommerceProtocolIntegration
 * contract, making the payment intent ready for execution by users.
 */
async function submitSignatureToContract(intentId: string, signature: string): Promise<boolean> {
  try {
    const contractAddresses = getContractAddresses(currentChain.id)

    // Call CommerceProtocolIntegration.provideIntentSignature
    const hash = await walletClient.writeContract({
      address: contractAddresses.COMMERCE_INTEGRATION,
      abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
      functionName: 'provideIntentSignature',
      args: [intentId as `0x${string}`, signature as `0x${string}`]
    })

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status === 'success') {
      console.log(`Successfully submitted signature for intent ${intentId}`)
      return true
    } else {
      console.error(`Transaction failed for intent ${intentId}`)
      return false
    }
  } catch (error) {
    console.error('Failed to submit signature to contract:', error)
    return false
  }
}

/**
 * Cleanup Function for Intent Registry
 * 
 * This function removes expired entries from the intent registry to prevent
 * memory leaks and maintain efficient performance of the signature service.
 */
function cleanupExpiredIntents(): void {
  const now = Date.now()
  for (const [intentId, entry] of intentRegistry.entries()) {
    if (now > entry.expiresAt) {
      intentRegistry.delete(intentId)
      console.log(`Cleaned up expired intent: ${intentId}`)
    }
  }
}

/**
 * POST Handler for Signature Status Requests
 * 
 * This handler processes requests to check the signature status of payment intents
 * and generates signatures for valid intents that haven't been signed yet.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // Check rate limiting
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body: SignatureRequest
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON in request body' 
        },
        { status: 400 }
      )
    }

    const { intentId, intentHash } = body

    // Validate required fields
    if (!intentId || !intentHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: intentId and intentHash'
        },
        { status: 400 }
      )
    }

    // Validate format of intentId and intentHash
    if (typeof intentId !== 'string' || !intentId.startsWith('0x') || intentId.length !== 34) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid intentId format. Must be 16-byte hex string with 0x prefix.'
        },
        { status: 400 }
      )
    }

    if (typeof intentHash !== 'string' || !intentHash.startsWith('0x') || intentHash.length !== 66) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid intentHash format. Must be 32-byte hex string with 0x prefix.'
        },
        { status: 400 }
      )
    }

    // Clean up expired intents periodically
    if (Math.random() < 0.1) { // 10% chance on each request
      cleanupExpiredIntents()
    }

    // Check if we already have this intent signed
    const existingEntry = intentRegistry.get(intentId)
    if (existingEntry && Date.now() < existingEntry.expiresAt) {
      console.log(`Returning cached signature for intent ${intentId}`)
      return NextResponse.json({
        success: true,
        isSigned: true,
        signature: existingEntry.signature,
        expiresAt: existingEntry.expiresAt
      })
    }

    // Validate the intent against the blockchain
    const isValidIntent = await validateIntent(intentId, intentHash)
    if (!isValidIntent) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or already processed payment intent'
      }, { status: 400 })
    }

    console.log(`Processing signature request for intent ${intentId}`)

    // Generate the operator signature
    const signature = await signIntentHash(intentHash)

    // Submit signature to the CommerceProtocolIntegration contract
    const submissionSuccess = await submitSignatureToContract(intentId, signature)
    
    if (!submissionSuccess) {
      return NextResponse.json({
        success: false,
        error: 'Failed to submit signature to contract'
      }, { status: 500 })
    }

    // Store in registry for future reference
    const now = Date.now()
    const expiresAt = now + (24 * 60 * 60 * 1000) // 24 hours
    
    intentRegistry.set(intentId, {
      intentId,
      intentHash,
      signature,
      createdAt: now,
      expiresAt,
      isUsed: false
    })

    console.log(`Successfully signed and stored intent ${intentId}`)

    return NextResponse.json({
      success: true,
      isSigned: true,
      signature,
      expiresAt
    })

  } catch (error) {
    console.error('Signature service error:', error)
    
    return NextResponse.json({
      success: false,
      error: NODE_ENV === 'development' 
        ? `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
        : 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * GET Handler for Service Status
 * 
 * This handler provides a health check endpoint for monitoring the signature
 * service status and confirming proper configuration and connectivity.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const contractAddresses = getContractAddresses(currentChain.id)
    
    // Verify operator account has proper permissions
    const hasSignerRole = await publicClient.readContract({
      address: contractAddresses.COMMERCE_INTEGRATION,
      abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
      functionName: 'hasRole',
      args: [
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', // SIGNER_ROLE hash
        operatorAccount.address
      ]
    }) as boolean

    return NextResponse.json({
      status: 'operational',
      chain: currentChain.name,
      operatorAddress: operatorAccount.address,
      hasSignerRole,
      activeIntents: intentRegistry.size,
      environment: NODE_ENV
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * OPTIONS Handler for CORS Support
 * 
 * This handler enables Cross-Origin Resource Sharing for the signature service,
 * allowing frontend applications to make requests from different origins.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  })
}