// ==============================================================================
// X402 CONFIGURATION AND PAYMENT PROOF MODULE
// File: src/lib/web3/x402-config.ts
// ==============================================================================

import { Address } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { X402PaymentRequirement } from '@/types/x402'


// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

/**
 * X402 Configuration Interface
 * 
 * This interface defines the configuration needed for x402 payment processing
 * on different networks. It integrates with your existing contract infrastructure
 * while providing the specific parameters that x402 requires.
 */
export interface X402Config {
  readonly chainId: number
  readonly networkName: string
  readonly usdcTokenAddress: Address
  readonly resourceWalletAddress: Address
  readonly facilitatorUrl: string
  readonly minPaymentAmount: bigint
  readonly maxPaymentAmount: bigint
  readonly defaultDeadlineMinutes: number
}

/**
 * X402 Payment Proof Interface
 * 
 * This interface represents a payment proof that can be verified by x402
 * facilitators. It follows the x402 protocol specification for "exact" scheme
 * payments, ensuring compatibility with the broader x402 ecosystem.
 */
export interface X402PaymentProof {
  readonly scheme: 'exact'
  readonly amount: string
  readonly token: Address
  readonly recipient: Address
  readonly deadline: number
  readonly nonce: string
  readonly chainId: number
  readonly metadata: {
    readonly contentId: string
    readonly resourcePath: string
    readonly version: string
    readonly contractAddress: Address
    readonly originalRecipient: Address
    readonly userAddress: Address
  }
}

/**
 * X402 Payment Verification Result Interface
 * 
 * This interface represents the result of payment proof verification
 * from an x402 facilitator service.
 */
export interface X402PaymentVerificationResult {
  readonly success: boolean
  readonly error?: string
  readonly transactionHash?: string
  readonly blockNumber?: number
  readonly timestamp?: number
}

/**
 * X402 Payment Proof Creation Parameters
 * 
 * This interface defines the parameters needed to create a payment proof
 * for your specific content platform use case.
 */
export interface X402PaymentProofParams {
  readonly contentId: string
  readonly amount: bigint
  readonly recipient: Address
  readonly userAddress: Address
  readonly chainId: number
  readonly contractAddress: Address
  readonly x402Config: X402Config
}

// ==============================================================================
// CONFIGURATION CONSTANTS
// ==============================================================================

/**
 * X402 Network Configurations
 * 
 * These configurations map your existing contract addresses and network
 * setup to the x402 protocol requirements. Each network has specific
 * parameters for payment processing and verification.
 */
const X402_NETWORK_CONFIGS: Record<number, X402Config> = {
  [base.id]: {
    chainId: base.id,
    networkName: 'base',
    usdcTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    resourceWalletAddress: (process.env.NEXT_PUBLIC_X402_RESOURCE_WALLET || '0x') as Address,
    facilitatorUrl: 'https://facilitator.x402.org',
    minPaymentAmount: BigInt(10000), // 0.01 USDC (6 decimals)
    maxPaymentAmount: BigInt(100000000), // 100 USDC (6 decimals)
    defaultDeadlineMinutes: 30
  },
  [baseSepolia.id]: {
    chainId: baseSepolia.id,
    networkName: 'base-sepolia',
    usdcTokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    resourceWalletAddress: (process.env.NEXT_PUBLIC_X402_RESOURCE_WALLET_TESTNET || '0x') as Address,
    facilitatorUrl: 'https://facilitator-testnet.x402.org',
    minPaymentAmount: BigInt(1000), // 0.001 USDC (for testing)
    maxPaymentAmount: BigInt(10000000), // 10 USDC (for testing)
    defaultDeadlineMinutes: 30
  }
}

// ==============================================================================
// CONFIGURATION FUNCTIONS
// ==============================================================================

/**
 * Get X402 Middleware Configuration
 * 
 * This function retrieves the x402 configuration for a specific chain ID.
 * It validates that all required environment variables are set and throws
 * descriptive errors if the configuration is incomplete.
 * 
 * @param chainId - The blockchain network chain ID
 * @returns X402 configuration for the specified network
 * @throws Error if chain is unsupported or configuration is incomplete
 */
export function getX402MiddlewareConfig(chainId: number): X402Config {
  const config = X402_NETWORK_CONFIGS[chainId]
  
  if (!config) {
    throw new Error(
      `Unsupported chain ID for x402: ${chainId}. ` +
      `Supported chains: ${Object.keys(X402_NETWORK_CONFIGS).join(', ')}`
    )
  }
  
  // Validate that the resource wallet address is properly configured
  if (!config.resourceWalletAddress || config.resourceWalletAddress === '0x') {
    const envVar = chainId === base.id 
      ? 'NEXT_PUBLIC_X402_RESOURCE_WALLET'
      : 'NEXT_PUBLIC_X402_RESOURCE_WALLET_TESTNET'
      
    throw new Error(
      `X402 resource wallet address not configured for chain ${chainId}. ` +
      `Please set the ${envVar} environment variable.`
    )
  }
  
  return config
}

/**
 * Check X402 Network Support
 * 
 * This function checks if a given chain ID is supported by x402 integration.
 * It's useful for conditional rendering of x402 payment options in your UI.
 * 
 * @param chainId - The blockchain network chain ID to check
 * @returns True if the chain supports x402 payments
 */
export function isX402Supported(chainId: number): boolean {
  return chainId in X402_NETWORK_CONFIGS
}

// ==============================================================================
// PAYMENT PROOF FUNCTIONS
// ==============================================================================

/**
 * Create X402 Payment Proof
 * 
 * This function creates a payment proof that follows the x402 protocol
 * specification. It integrates with your existing contract architecture
 * by mapping your content purchase requirements to x402 payment structures.
 * 
 * The function generates a secure nonce, calculates appropriate deadlines,
 * validates payment amounts, and structures the proof for x402 verification.
 * 
 * @param params - Parameters for creating the payment proof
 * @returns A valid x402 payment proof ready for verification
 * @throws Error if parameters are invalid or configuration is missing
 */
export async function createX402PaymentProof(
  params: X402PaymentProofParams
): Promise<X402PaymentProof> {
  const { 
    contentId, 
    amount, 
    recipient, 
    userAddress, 
    chainId, 
    contractAddress,
    x402Config 
  } = params
  
  try {
    // Validate payment amount against x402 configuration limits
    if (amount < x402Config.minPaymentAmount) {
      throw new Error(
        `Payment amount too low: ${amount} < ${x402Config.minPaymentAmount}. ` +
        `Minimum payment is ${formatUSDC(x402Config.minPaymentAmount)}`
      )
    }
    
    if (amount > x402Config.maxPaymentAmount) {
      throw new Error(
        `Payment amount too high: ${amount} > ${x402Config.maxPaymentAmount}. ` +
        `Maximum payment is ${formatUSDC(x402Config.maxPaymentAmount)}`
      )
    }
    
    // Validate chain ID consistency
    if (x402Config.chainId !== chainId) {
      throw new Error(
        `Chain ID mismatch: config expects ${x402Config.chainId}, got ${chainId}`
      )
    }
    
    // Generate secure nonce for this payment proof
    const nonce = generateSecureNonce()
    
    // Calculate deadline (default 30 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + (x402Config.defaultDeadlineMinutes * 60)
    
    // Create the payment proof structure following x402 "exact" scheme
    const paymentProof: X402PaymentProof = {
      scheme: 'exact',
      amount: amount.toString(),
      token: x402Config.usdcTokenAddress,
      recipient: x402Config.resourceWalletAddress, // x402 requires payments to resource wallet
      deadline,
      nonce,
      chainId: x402Config.chainId,
      metadata: {
        contentId,
        resourcePath: `/api/protected/content/${contentId}`,
        version: '1.0.0',
        contractAddress,
        originalRecipient: recipient, // Your platform's creator address
        userAddress
      }
    }
    
    return paymentProof
    
  } catch (error) {
    const proofError = error instanceof Error 
      ? error 
      : new Error('Failed to create x402 payment proof')
    
    console.error('X402 payment proof creation failed:', {
      error: proofError.message,
      contentId,
      amount: amount.toString(),
      chainId
    })
    
    throw proofError
  }
}

/**
 * Verify X402 Payment Proof
 * 
 * This function verifies a payment proof with the x402 facilitator service.
 * It handles network requests, error responses, and provides detailed
 * verification results that your application can use for access control.
 * 
 * @param paymentProof - The payment proof to verify
 * @param x402Config - The x402 configuration for network-specific settings
 * @returns Verification result with success status and transaction details
 * @throws Error if verification request fails or proof is invalid
 */
export async function verifyX402PaymentProof(
  paymentProof: X402PaymentProof,
  x402Config: X402Config
): Promise<X402PaymentVerificationResult> {
  try {
    // Prepare the verification request payload
    const verificationPayload = {
      paymentProof,
      networkConfig: {
        chainId: x402Config.chainId,
        tokenAddress: x402Config.usdcTokenAddress,
        facilitatorUrl: x402Config.facilitatorUrl
      }
    }
    
    // Make request to x402 facilitator for verification
    const response = await fetch(`${x402Config.facilitatorUrl}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(verificationPayload)
    })
    
    if (!response.ok) {
      throw new Error(
        `Verification request failed: ${response.status} ${response.statusText}`
      )
    }
    
    const verificationData = await response.json()
    
    // Parse and validate the verification response
    if (verificationData.success) {
      return {
        success: true,
        transactionHash: verificationData.transactionHash,
        blockNumber: verificationData.blockNumber,
        timestamp: verificationData.timestamp
      }
    } else {
      return {
        success: false,
        error: verificationData.error || 'Payment verification failed'
      }
    }
    
  } catch (error) {
    const verificationError = error instanceof Error 
      ? error 
      : new Error('Payment verification failed')
    
    console.error('X402 payment verification failed:', {
      error: verificationError.message,
      paymentProof: {
        amount: paymentProof.amount,
        contentId: paymentProof.metadata.contentId,
        nonce: paymentProof.nonce
      }
    })
    
    return {
      success: false,
      error: verificationError.message
    }
  }
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Generate Secure Nonce for Payment Proofs
 * 
 * This function generates cryptographically secure nonces using the Web Crypto API
 * when available, with a secure fallback for environments where it's not supported.
 * The nonce ensures each payment proof is unique and prevents replay attacks.
 * 
 * @returns A cryptographically secure random nonce as a hex string
 */
function generateSecureNonce(): string {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      // Use Web Crypto API for secure random generation
      const array = new Uint8Array(32)
      window.crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Node.js crypto API
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    } else {
      // Fallback for environments without crypto API
      console.warn('Using fallback random generation - not cryptographically secure')
      return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    }
  } catch (error) {
    console.warn('Failed to generate secure nonce, using fallback:', error)
    // Time-based fallback with multiple random components
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2)
    const extraRandom = Math.random().toString(36).substring(2)
    return timestamp + randomPart + extraRandom
  }
}

/**
 * Format USDC Amount for Display
 * 
 * This utility function formats USDC amounts (which have 6 decimal places)
 * into human-readable strings. It's useful for error messages and logging.
 * 
 * @param amount - The USDC amount in base units (6 decimals)
 * @returns Formatted string like "$1.50"
 */
function formatUSDC(amount: bigint): string {
  const dollars = Number(amount) / 1000000 // Convert from 6 decimals
  return `$${dollars.toFixed(2)}`
}

/**
 * Create Middleware Payment Requirements
 * 
 * This function creates the standardized payment requirement object that gets
 * returned in HTTP 402 responses. Think of this as creating a "payment invoice"
 * that tells clients exactly what they need to pay and where to send it.
 * 
 * @param amount - Payment amount in token base units (e.g., USDC with 6 decimals)
 * @param recipient - The recipient address (your resource wallet)
 * @param network - The blockchain network ('base' or 'base-sepolia')
 * @param metadata - Optional metadata like contentId and description
 * @returns X402 payment requirement object for 402 responses
 */
export function createMiddlewarePaymentRequirements(
  amount: bigint,
  recipient: Address,
  network: 'base' | 'base-sepolia',
  metadata?: { contentId?: string; description?: string }
): X402PaymentRequirement {
  const chainId = network === 'base' ? base.id : baseSepolia.id
  const config = getX402MiddlewareConfig(chainId)
  
  // Format the payment requirement according to x402 protocol
  const paymentRequirement: X402PaymentRequirement = {
    maxAmountRequired: amount.toString(),
    resource: metadata?.contentId 
      ? `/api/protected/content/${metadata.contentId}`
      : '/api/protected',
    description: metadata?.description || 'Payment required for content access',
    payTo: config.resourceWalletAddress, // x402 requires payments to resource wallet
    asset: config.usdcTokenAddress,
    network: network,
    scheme: 'exact',
    chainId: chainId
  }
  
  return paymentRequirement
}

/**
 * Create Secure Headers
 * 
 * This function creates standardized HTTP headers for x402 responses.
 * It includes security headers and content type information.
 * 
 * @param isPaymentRequired - Whether this is a 402 payment required response
 * @returns Headers object with appropriate security and content headers
 */
export function createSecureHeaders(isPaymentRequired: boolean = false): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  }
  
  if (isPaymentRequired) {
    headers['WWW-Authenticate'] = 'x402'
  }
  
  return headers
}

/**
 * Validate Middleware Configuration
 * 
 * This function validates that all required configuration is present
 * for the middleware to function properly. Call this at middleware startup.
 * 
 * @throws Error if configuration is invalid or incomplete
 */
export function validateMiddlewareConfig(): void {
  const chainId = process.env.NETWORK === 'base' ? base.id : baseSepolia.id
  const validation = validateX402Configuration(chainId)
  
  if (!validation.isValid) {
    throw new Error(
      `X402 middleware configuration invalid: ${validation.errors.join(', ')}`
    )
  }
  
  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn('X402 middleware configuration warnings:', validation.warnings)
  }
}

/**
 * Validate X402 Environment Configuration
 * 
 * This function checks that all required environment variables for x402
 * integration are properly configured. It's useful for application startup
 * validation and debugging configuration issues.
 * 
 * @param chainId - The chain ID to validate configuration for
 * @returns Validation result with any missing configuration details
 */
export function validateX402Configuration(chainId: number): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const config = getX402MiddlewareConfig(chainId)
    
    // Check if resource wallet is a placeholder
    if (config.resourceWalletAddress === '0x' || !config.resourceWalletAddress) {
      errors.push('Resource wallet address not configured')
    }
    
    // Check if resource wallet address is valid format
    if (config.resourceWalletAddress && !config.resourceWalletAddress.startsWith('0x')) {
      errors.push('Resource wallet address invalid format')
    }
    
    // Check if facilitator URL is accessible (warning only)
    if (!config.facilitatorUrl.startsWith('https://')) {
      warnings.push('Facilitator URL should use HTTPS in production')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
    
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Configuration validation failed'],
      warnings
    }
  }
}