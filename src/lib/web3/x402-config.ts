// src/lib/web3/x402-config.ts

import { type Address } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { getContractAddresses } from '@/lib/contracts/config'

/**
 * Hex String Type System
 * 
 * These types ensure strict type safety for blockchain-specific data formats.
 * The HexString type ensures that only properly formatted hex strings can be used
 * where blockchain addresses or transaction hashes are expected.
 */
type HexString = `0x${string}`

/**
 * x402 Middleware Configuration Interface
 * 
 * This interface defines the complete configuration structure that your
 * sophisticated middleware expects. It provides all the settings needed
 * for production-ready x402 payment processing while integrating seamlessly
 * with your existing contract infrastructure.
 */
export interface X402MiddlewareConfig {
  /** The network to operate on (matches your existing environment setup) */
  readonly network: 'base' | 'base-sepolia'
  
  /** Coinbase x402 facilitator URL for payment verification */
  readonly facilitatorUrl: string
  
  /** Timeout for external service calls (facilitator, RPC) in milliseconds */
  readonly timeout: number
  
  /** Your platform's resource wallet address (where payments are received) */
  readonly resourceWalletAddress: Address
  
  /** USDC token contract address for the current network */
  readonly usdcTokenAddress: Address
  
  /** Whether to enable debug logging for payment processing */
  readonly enableDebugLogging: boolean
  
  /** Maximum age for payment proofs before they're considered stale */
  readonly maxPaymentProofAge: number
  
  /** Chain ID for the current network */
  readonly chainId: number
  
  /** Maximum allowed payment amount in USDC (6 decimals) */
  readonly maxPaymentAmount: bigint
  
  /** Minimum required payment amount in USDC (6 decimals) */
  readonly minPaymentAmount: bigint
  
  /** List of allowed token addresses for payments */
  readonly allowedTokens: readonly Address[]
  
  /** Gas tolerance percentage for gasless payments */
  readonly gaslessTolerance: number
  
  /** Number of retry attempts for facilitator calls */
  readonly retryAttempts: number
  
  /** Delay between retry attempts in milliseconds */
  readonly retryDelay: number
}

/**
 * x402 Network Configuration Interface
 * 
 * Maps supported networks to their complete x402 settings including
 * facilitator URLs, RPC endpoints, and deployed contract addresses.
 */
export interface X402NetworkConfig {
  readonly chainId: number
  readonly facilitatorUrl: string
  readonly rpcUrl: string
  readonly blockExplorer: string
  readonly usdcAddress: Address
  readonly commerceProtocol: Address
  readonly name: string
  readonly isTestnet: boolean
}

/**
 * Payment Requirement Structure
 * 
 * This interface defines the structure of payment requirements returned
 * in HTTP 402 responses. It complies with x402 protocol specifications
 * while providing all information needed for automatic payment processing.
 */
export interface PaymentRequirement {
  /** Payment scheme (always 'exact' for your platform) */
  readonly scheme: 'exact'
  
  /** Required payment amount in token's smallest unit */
  readonly amount: string
  
  /** Token contract address (USDC) */
  readonly token: Address
  
  /** Network identifier */
  readonly chainId: number
  
  /** Recipient wallet address */
  readonly recipient: Address
  
  /** Payment deadline (Unix timestamp) */
  readonly deadline: number
  
  /** Unique nonce for this payment requirement */
  readonly nonce: string
  
  /** Human-readable description */
  readonly description: string
  
  /** Optional metadata for content identification */
  readonly metadata?: {
    readonly contentId?: string
    readonly resourcePath?: string
    readonly version?: string
  }
}

/**
 * Payment Requirements Response Structure
 * 
 * This interface defines the complete HTTP 402 response structure
 * that x402-compatible clients expect when payment is required.
 */
export interface PaymentRequirementsResponse {
  readonly error: string
  readonly paymentRequirements: readonly PaymentRequirement[]
  readonly facilitator: {
    readonly url: string
    readonly version: string
  }
}

/**
 * x402 Payment Verification Response
 * 
 * Structure returned by facilitator after verification of payment proof.
 * Contains all necessary information to confirm payment validity.
 */
export interface X402VerificationResponse {
  readonly verified: boolean
  readonly transactionHash?: string
  readonly blockNumber?: number
  readonly amount?: string
  readonly timestamp?: number
  readonly error?: string
  readonly gasUsed?: string
  readonly effectiveGasPrice?: string
}

/**
 * Payment Proof Structure
 * 
 * Defines the complete structure of payment proofs that clients submit
 * for verification. Used by validation functions to ensure data integrity.
 */
export interface PaymentProof {
  readonly signature: string
  readonly amount: string
  readonly token: Address
  readonly recipient: Address
  readonly deadline: number
  readonly nonce: string
  readonly chainId: number
  readonly transactionHash?: string
  readonly blockNumber?: number
}

// Network configurations mapping with comprehensive settings
export const X402_NETWORKS: Record<'base' | 'base-sepolia', X402NetworkConfig> = {
  'base': {
    chainId: base.id,
    facilitatorUrl: 'https://facilitator.x402.org',
    rpcUrl: base.rpcUrls.default.http[0],
    blockExplorer: base.blockExplorers.default.url,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Base Mainnet USDC
    commerceProtocol: '0xeADE6bE02d043b3550bE19E960504dbA14A14971' as Address, // Base Mainnet Commerce Protocol
    name: 'Base Mainnet',
    isTestnet: false
  },
  'base-sepolia': {
    chainId: baseSepolia.id,
    facilitatorUrl: 'https://facilitator.x402.org',
    rpcUrl: baseSepolia.rpcUrls.default.http[0],
    blockExplorer: baseSepolia.blockExplorers.default.url,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // Base Sepolia USDC
    commerceProtocol: '0x96A08D8e8631b6dB52Ea0cbd7232d9A85d239147' as Address, // Base Sepolia Commerce Protocol
    name: 'Base Sepolia Testnet',
    isTestnet: true
  }
} as const

// Default facilitator configuration for Coinbase's hosted service
export const X402_FACILITATOR_CONFIG = {
  baseUrl: 'https://facilitator.x402.org',
  verifyEndpoint: '/verify',
  timeout: 30000, // 30 seconds timeout for payment verification
  retryAttempts: 3,
  retryDelay: 1000, // 1 second between retries
  version: '1.0'
} as const

/**
 * Type Guard with Explicit Parameter Typing
 * 
 * This function provides strict type checking for hex strings used in
 * blockchain operations. Prevents runtime errors from malformed addresses.
 */
function isHexString(value: unknown): value is HexString {
  return typeof value === 'string' && value.startsWith('0x') && value.length > 2
}

/**
 * Validate Ethereum Address Format
 * 
 * Ensures that provided addresses conform to Ethereum's 40-character
 * hexadecimal format. Essential for preventing payment routing errors.
 */
function isValidEthereumAddress(address: unknown): address is Address {
  return typeof address === 'string' && /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Get Current Environment Network
 * 
 * Determines which network to use based on environment variables.
 * Defaults to testnet for development safety, ensuring developers
 * don't accidentally use mainnet during testing.
 */
export function getCurrentNetwork(): 'base' | 'base-sepolia' {
  const envNetwork = process.env.NEXT_PUBLIC_NETWORK?.toLowerCase() || process.env.NETWORK?.toLowerCase()
  
  if (envNetwork === 'base' || envNetwork === 'base-mainnet') {
    return 'base'
  }
  
  if (envNetwork === 'base-sepolia' || envNetwork === 'sepolia') {
    return 'base-sepolia'
  }
  
  // Default to testnet for development safety
  return 'base-sepolia'
}

/**
 * Get x402 Network Configuration
 * 
 * Retrieves comprehensive network configuration including facilitator URLs,
 * RPC endpoints, and deployed contract addresses for the specified network.
 */
export function getX402NetworkConfig(network: 'base' | 'base-sepolia'): X402NetworkConfig {
  const config = X402_NETWORKS[network]
  
  if (!config) {
    throw new Error(`Unsupported x402 network: ${network}. Supported networks: base, base-sepolia`)
  }
  
  return config
}

/**
 * Get x402 Middleware Configuration
 * 
 * This function creates the complete configuration object that your middleware uses
 * for all payment processing operations. It integrates with your existing
 * environment variables and contract addresses to ensure consistency across your platform.
 */
export function getX402MiddlewareConfig(): X402MiddlewareConfig {
  // Get network from environment (same pattern as your existing code)
  const network = getCurrentNetwork()
  const networkConfig = getX402NetworkConfig(network)
  
  // Get resource wallet address from environment with multiple fallback options
  const resourceWalletAddress = (
    process.env.RESOURCE_WALLET_ADDRESS ||
    process.env.NEXT_PUBLIC_RESOURCE_WALLET_ADDRESS ||
    process.env.NEXT_PUBLIC_COMMERCE_INTEGRATION_ADDRESS
  ) as Address
  
  if (!resourceWalletAddress) {
    throw new Error('RESOURCE_WALLET_ADDRESS environment variable is required for x402 middleware')
  }
  
  if (!isValidEthereumAddress(resourceWalletAddress)) {
    throw new Error(`Invalid RESOURCE_WALLET_ADDRESS format: ${resourceWalletAddress}`)
  }
  
  // Get contract addresses using your existing system
  const contractAddresses = getContractAddresses(networkConfig.chainId)
  
  // Determine facilitator URL with environment override capability
  const facilitatorUrl = process.env.X402_FACILITATOR_URL || networkConfig.facilitatorUrl
  
  // Check for debug mode (useful during development)
  const enableDebugLogging = process.env.NODE_ENV === 'development' || 
                             process.env.X402_DEBUG === 'true'
  
  return {
    network,
    facilitatorUrl,
    timeout: 30000, // 30 second timeout for external calls
    resourceWalletAddress,
    usdcTokenAddress: networkConfig.usdcAddress,
    enableDebugLogging,
    maxPaymentProofAge: 30 * 60 * 1000, // 30 minutes
    chainId: networkConfig.chainId,
    maxPaymentAmount: BigInt('1000000000'), // 1,000 USDC (6 decimals)
    minPaymentAmount: BigInt('10000'), // 0.01 USDC (6 decimals)
    allowedTokens: [networkConfig.usdcAddress],
    gaslessTolerance: 10, // 10% tolerance for gas estimates
    retryAttempts: X402_FACILITATOR_CONFIG.retryAttempts,
    retryDelay: X402_FACILITATOR_CONFIG.retryDelay
  }
}

/**
 * Validate Middleware Configuration
 * 
 * This function performs comprehensive validation of the middleware
 * configuration to catch issues early and provide clear error messages.
 * Your middleware calls this during initialization to ensure everything
 * is set up correctly before processing any requests.
 */
export function validateMiddlewareConfig(): void {
  try {
    const config = getX402MiddlewareConfig()
    
    // Validate facilitator URL format
    try {
      new URL(config.facilitatorUrl)
    } catch (error) {
      throw new Error(`Invalid facilitator URL: ${config.facilitatorUrl}`)
    }
    
    // Validate timeout is reasonable
    if (config.timeout < 1000 || config.timeout > 60000) {
      throw new Error(`Invalid timeout: ${config.timeout}ms. Must be between 1000-60000ms`)
    }
    
    // Validate payment amounts are logical
    if (config.minPaymentAmount >= config.maxPaymentAmount) {
      throw new Error('Minimum payment amount must be less than maximum payment amount')
    }
    
    // Validate allowed tokens array is not empty
    if (config.allowedTokens.length === 0) {
      throw new Error('At least one allowed token must be configured')
    }
    
    // Validate all allowed tokens have proper address format
    for (const token of config.allowedTokens) {
      if (!isValidEthereumAddress(token)) {
        throw new Error(`Invalid token address in allowed tokens: ${token}`)
      }
    }
    
    // Log configuration in debug mode
    if (config.enableDebugLogging) {
      console.log('✅ x402 Middleware Configuration Validated:', {
        network: config.network,
        chainId: config.chainId,
        facilitatorUrl: config.facilitatorUrl,
        resourceWalletAddress: config.resourceWalletAddress,
        usdcTokenAddress: config.usdcTokenAddress,
        timeout: config.timeout,
        allowedTokens: config.allowedTokens.length,
        paymentRange: `${formatUSDCAmount(config.minPaymentAmount)} - ${formatUSDCAmount(config.maxPaymentAmount)}`
      })
    }
    
  } catch (error) {
    console.error('❌ x402 Middleware Configuration Validation Failed:', error)
    throw error
  }
}

/**
 * Generate Secure Nonce
 * 
 * This function creates cryptographically secure nonces for payment
 * requirements. The nonces prevent replay attacks and ensure each
 * payment requirement is unique and time-bound.
 */
function generateSecureNonce(): string {
  // Combine timestamp with random bytes for uniqueness and ordering
  const timestamp = Date.now().toString(36)
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
  
  return `${timestamp}-${randomBytes}`
}

/**
 * Create Middleware Payment Requirements
 * 
 * This function generates the payment requirement objects that your
 * middleware returns in HTTP 402 responses. It creates requirements
 * that comply with x402 protocol specifications while integrating
 * with your platform's pricing and payment infrastructure.
 */
export function createMiddlewarePaymentRequirements(
  amount: bigint,
  recipient: Address,
  network: 'base' | 'base-sepolia' = 'base',
  metadata?: {
    contentId?: string
    description?: string
    resourcePath?: string
    validUntil?: number
  }
): PaymentRequirementsResponse {
  const config = getX402MiddlewareConfig()
  const networkConfig = getX402NetworkConfig(network)
  
  // Validate amount is within acceptable range
  if (amount < config.minPaymentAmount || amount > config.maxPaymentAmount) {
    throw new Error(
      `Payment amount ${formatUSDCAmount(amount)} is outside allowed range: ` +
      `${formatUSDCAmount(config.minPaymentAmount)} - ${formatUSDCAmount(config.maxPaymentAmount)}`
    )
  }
  
  // Validate recipient address
  if (!isValidEthereumAddress(recipient)) {
    throw new Error(`Invalid recipient address: ${recipient}`)
  }
  
  // Generate payment deadline (30 minutes from now, or custom if provided)
  const deadline = metadata?.validUntil || Math.floor(Date.now() / 1000) + (30 * 60)
  
  // Create descriptive message for the payment requirement
  const description = metadata?.description || 
    (metadata?.contentId 
      ? `Access to content ${metadata.contentId}`
      : 'Premium content access')
  
  // Generate unique nonce for this payment requirement
  const nonce = generateSecureNonce()
  
  // Create the payment requirement object
  const paymentRequirement: PaymentRequirement = {
    scheme: 'exact',
    amount: amount.toString(),
    token: config.usdcTokenAddress,
    chainId: config.chainId,
    recipient,
    deadline,
    nonce,
    description,
    metadata: {
      contentId: metadata?.contentId,
      resourcePath: metadata?.resourcePath,
      version: X402_FACILITATOR_CONFIG.version
    }
  }
  
  // Log payment requirement generation in debug mode
  if (config.enableDebugLogging) {
    console.log('💰 Generated Payment Requirement:', {
      amount: formatUSDCAmount(amount),
      recipient,
      description,
      deadline: new Date(deadline * 1000).toISOString(),
      nonce,
      network: networkConfig.name
    })
  }
  
  // Return the complete 402 response structure
  return {
    error: 'Payment Required',
    paymentRequirements: [paymentRequirement],
    facilitator: {
      url: config.facilitatorUrl,
      version: X402_FACILITATOR_CONFIG.version
    }
  }
}

/**
 * Verify Payment with Coinbase x402 Facilitator
 * 
 * Makes actual API call to facilitator service for payment verification.
 * Includes retry logic and comprehensive error handling for production reliability.
 */
export async function verifyPaymentWithFacilitator(
  paymentProof: PaymentProof,
  paymentRequirements: PaymentRequirement,
  network: 'base' | 'base-sepolia' = 'base'
): Promise<X402VerificationResponse> {
  const config = getX402MiddlewareConfig()
  const facilitatorUrl = `${config.facilitatorUrl}${X402_FACILITATOR_CONFIG.verifyEndpoint}`
  
  let lastError: Error | null = null
  
  // Retry logic for network resilience
  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      if (config.enableDebugLogging) {
        console.log(`🔍 Payment verification attempt ${attempt}/${config.retryAttempts}`)
      }
      
      const response = await fetch(facilitatorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `x402-client/${X402_FACILITATOR_CONFIG.version}`,
          'X-Network': network,
          'X-Chain-Id': config.chainId.toString()
        },
        body: JSON.stringify({
          paymentProof,
          paymentRequirements,
          networkConfig: {
            chainId: config.chainId,
            network
          }
        }),
        signal: AbortSignal.timeout(config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Facilitator verification failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json() as X402VerificationResponse
      
      if (!result.verified) {
        throw new Error(`Payment verification failed: ${result.error || 'Unknown error'}`)
      }

      if (config.enableDebugLogging) {
        console.log('✅ Payment verification successful:', {
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          amount: result.amount
        })
      }

      return result
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown verification error')
      
      if (config.enableDebugLogging) {
        console.log(`❌ Verification attempt ${attempt} failed:`, lastError.message)
      }
      
      // Don't retry on the last attempt
      if (attempt < config.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      }
    }
  }
  
  // All attempts failed
  throw new Error(`Payment verification failed after ${config.retryAttempts} attempts: ${lastError?.message}`)
}

/**
 * Validate Payment Proof Structure
 * 
 * This function validates that a payment proof contains all required
 * fields with correct types and formats. It's used by your middleware
 * to validate incoming payment proofs before processing them.
 */
export function validatePaymentProofStructure(paymentProof: unknown): paymentProof is PaymentProof {
  if (!paymentProof || typeof paymentProof !== 'object') {
    return false
  }
  
  const proof = paymentProof as any
  
  // Check all required fields are present and have correct types
  const requiredFields = [
    { field: 'signature', type: 'string' },
    { field: 'amount', type: 'string' },
    { field: 'token', type: 'string' },
    { field: 'recipient', type: 'string' },
    { field: 'deadline', type: 'number' },
    { field: 'nonce', type: 'string' },
    { field: 'chainId', type: 'number' }
  ]
  
  for (const { field, type } of requiredFields) {
    if (!(field in proof) || typeof proof[field] !== type) {
      return false
    }
  }
  
  // Validate address formats
  const addressFields = ['token', 'recipient'] as const
  for (const field of addressFields) {
    if (!isValidEthereumAddress(proof[field])) {
      return false
    }
  }
  
  // Validate amount is a valid number string
  try {
    const amount = BigInt(proof.amount)
    if (amount < BigInt(0)) {
      return false
    }
  } catch {
    return false
  }
  
  // Validate deadline is in the future
  const currentTime = Math.floor(Date.now() / 1000)
  if (proof.deadline <= currentTime) {
    return false
  }
  
  // Validate chain ID matches supported networks
  const supportedChainIds = Object.values(X402_NETWORKS).map(config => config.chainId)
  if (!supportedChainIds.includes(proof.chainId)) {
    return false
  }
  
  return true
}

/**
 * Create Secure Headers
 * 
 * This function generates the HTTP headers that your middleware uses
 * for secure communication. It includes appropriate CORS headers,
 * security headers, and caching directives based on the response type.
 */
export function createSecureHeaders(isPaymentRequired: boolean = false): Record<string, string> {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-x402-Version': X402_FACILITATOR_CONFIG.version
  }
  
  if (isPaymentRequired) {
    // Headers for HTTP 402 Payment Required responses
    return {
      ...baseHeaders,
      'X-Payment-Required': 'x402',
      'X-Payment-Protocol': `x402/${X402_FACILITATOR_CONFIG.version}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      // CORS headers for x402 clients
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Payment, X-Network',
      'Access-Control-Expose-Headers': 'X-Payment-Required, X-Payment-Protocol'
    }
  } else {
    // Headers for successful or error responses
    return {
      ...baseHeaders,
      'Cache-Control': 'private, no-cache',
      'Vary': 'Accept-Encoding, X-Payment'
    }
  }
}

/**
 * Format USDC Amount for Display
 * 
 * Converts USDC amount (6 decimals) to human-readable format.
 * Essential for creating clear user interfaces and error messages.
 */
export function formatUSDCAmount(amount: bigint): string {
  const formatted = (Number(amount) / 1_000_000).toFixed(2)
  return `${formatted} USDC`
}

/**
 * Parse USDC Amount from String
 * 
 * Converts human-readable amount to USDC units (6 decimals).
 * Used when processing user input or configuration values.
 */
export function parseUSDCAmount(amount: string): bigint {
  const parsed = parseFloat(amount)
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid USDC amount: ${amount}`)
  }
  return BigInt(Math.round(parsed * 1_000_000))
}

/**
 * Check if Current Environment is Production
 * 
 * Determines if the current configuration is running on mainnet.
 * Used for environment-specific behavior and safety checks.
 */
export function isProduction(): boolean {
  return getCurrentNetwork() === 'base'
}

/**
 * Get Error Message for Common x402 Errors
 * 
 * Provides user-friendly error messages for common failure scenarios.
 * Helps create better user experiences during payment processing.
 */
export function getX402ErrorMessage(error: unknown): string {
  const errorString = typeof error === 'string' ? error : 
                     error instanceof Error ? error.message : 
                     'Unknown error'
  
  // Map technical errors to user-friendly messages
  if (errorString.includes('insufficient')) return 'Insufficient USDC balance for payment'
  if (errorString.includes('timeout')) return 'Payment verification timed out. Please try again.'
  if (errorString.includes('network')) return 'Network error. Please check your connection and try again.'
  if (errorString.includes('signature')) return 'Invalid payment signature. Please try the payment again.'
  if (errorString.includes('deadline')) return 'Payment deadline has expired. Please request a new payment requirement.'
  if (errorString.includes('amount')) return 'Payment amount is invalid or outside acceptable range.'
  if (errorString.includes('nonce')) return 'Payment nonce is invalid or has already been used.'
  if (errorString.includes('recipient')) return 'Payment recipient address is invalid.'
  if (errorString.includes('facilitator')) return 'Payment verification service is currently unavailable.'
  
  return errorString
}

/**
 * Get Network Configuration Summary
 * 
 * This function provides a summary of the current network configuration
 * for debugging and monitoring purposes. It's useful for verifying that
 * your middleware is configured correctly for the target environment.
 */
export function getNetworkConfigSummary(): {
  network: string
  chainId: number
  facilitatorUrl: string
  usdcAddress: string
  resourceWallet: string
  isTestnet: boolean
  allowedTokens: number
  paymentRange: string
} {
  const config = getX402MiddlewareConfig()
  const networkConfig = getX402NetworkConfig(config.network)
  
  return {
    network: networkConfig.name,
    chainId: config.chainId,
    facilitatorUrl: config.facilitatorUrl,
    usdcAddress: config.usdcTokenAddress,
    resourceWallet: config.resourceWalletAddress,
    isTestnet: networkConfig.isTestnet,
    allowedTokens: config.allowedTokens.length,
    paymentRange: `${formatUSDCAmount(config.minPaymentAmount)} - ${formatUSDCAmount(config.maxPaymentAmount)}`
  }
}

/**
 * Development and Testing Utilities
 * 
 * These functions provide utilities for testing and debugging x402
 * integration during development. They help validate configuration
 * and test payment flows without requiring real blockchain transactions.
 */

/**
 * Create Mock Payment Proof for Testing
 * 
 * This function generates valid-looking payment proofs for testing
 * purposes. It should only be used in development environments.
 */
export function createMockPaymentProof(
  amount: bigint,
  contentId: string,
  userAddress: Address
): PaymentProof {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock payment proofs should not be used in production')
  }
  
  const config = getX402MiddlewareConfig()
  
  return {
    signature: '0x' + '0'.repeat(130), // Mock signature
    amount: amount.toString(),
    token: config.usdcTokenAddress,
    recipient: config.resourceWalletAddress,
    deadline: Math.floor(Date.now() / 1000) + (30 * 60),
    nonce: generateSecureNonce(),
    chainId: config.chainId,
    transactionHash: '0x' + '1'.repeat(64), // Mock transaction hash
    blockNumber: 12345678 // Mock block number
  }
}

/**
 * Test x402 Configuration
 * 
 * Comprehensive test function that validates all aspects of x402 configuration.
 * Use this during development to ensure everything is set up correctly.
 */
export function testX402Configuration(): {
  success: boolean
  results: Array<{ test: string; passed: boolean; error?: string }>
} {
  const results: Array<{ test: string; passed: boolean; error?: string }> = []
  
  // Test configuration loading
  try {
    getX402MiddlewareConfig()
    results.push({ test: 'Configuration Loading', passed: true })
  } catch (error) {
    results.push({ 
      test: 'Configuration Loading', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
  
  // Test network configuration
  try {
    const network = getCurrentNetwork()
    getX402NetworkConfig(network)
    results.push({ test: 'Network Configuration', passed: true })
  } catch (error) {
    results.push({ 
      test: 'Network Configuration', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
  
  // Test payment requirement creation
  try {
    const testAmount = parseUSDCAmount('1.00')
    const config = getX402MiddlewareConfig()
    createMiddlewarePaymentRequirements(testAmount, config.resourceWalletAddress)
    results.push({ test: 'Payment Requirements Creation', passed: true })
  } catch (error) {
    results.push({ 
      test: 'Payment Requirements Creation', 
      passed: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
  
  // Test mock payment proof (only in development)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const testAmount = parseUSDCAmount('1.00')
      const config = getX402MiddlewareConfig()
      const mockProof = createMockPaymentProof(testAmount, 'test-content', config.resourceWalletAddress)
      const isValid = validatePaymentProofStructure(mockProof)
      results.push({ test: 'Mock Payment Proof Creation', passed: isValid })
    } catch (error) {
      results.push({ 
        test: 'Mock Payment Proof Creation', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }
  
  const allPassed = results.every(result => result.passed)
  
  return {
    success: allPassed,
    results
  }
}