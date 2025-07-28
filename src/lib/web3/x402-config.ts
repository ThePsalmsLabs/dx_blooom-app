// File: src/lib/web3/x402-config.ts

import { Address } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { getContractAddresses } from '@/lib/contracts/config'

/**
 * x402 Configuration Interface
 * Integrates x402 protocol with existing contract infrastructure
 */
export interface X402Config {
  readonly walletAddress: Address
  readonly network: 'base' | 'base-sepolia' 
  readonly facilitatorUrl: string
  readonly contractAddresses: Record<string, Address>
  readonly chainId: number
}

/**
 * x402 Network Configuration
 * Maps supported networks to their x402 settings
 */
export interface X402NetworkConfig {
  readonly chainId: number
  readonly facilitatorUrl: string
  readonly rpcUrl: string
  readonly blockExplorer: string
  readonly usdcAddress: Address
  readonly commerceProtocol: Address
}

/**
 * Payment verification configuration for x402 middleware
 */
export interface X402PaymentConfig {
  readonly maxAmount: bigint
  readonly allowedTokens: readonly Address[]
  readonly timeout: number
  readonly minAmount: bigint
  readonly gaslessTolerance: number
}

/**
 * x402 Payment Requirements Schema
 * Used for 402 responses to clients
 */
export interface X402PaymentRequirements {
  readonly resource: string
  readonly maxAmountRequired: string
  readonly description: string
  readonly payTo: Address
  readonly asset: Address
  readonly scheme: 'exact'
  readonly network: 'base' | 'base-sepolia'
}

/**
 * x402 Payment Verification Response
 * Structure returned by facilitator after verification
 */
export interface X402VerificationResponse {
  readonly verified: boolean
  readonly transactionHash?: string
  readonly blockNumber?: number
  readonly amount?: string
  readonly timestamp?: number
  readonly error?: string
}

// Network configurations mapping
export const X402_NETWORKS: Record<'base' | 'base-sepolia', X402NetworkConfig> = {
  'base': {
    chainId: base.id,
    facilitatorUrl: 'https://x402.org/facilitator',
    rpcUrl: base.rpcUrls.default.http[0],
    blockExplorer: base.blockExplorers.default.url,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Base Mainnet USDC
    commerceProtocol: '0xeADE6bE02d043b3550bE19E960504dbA14A14971' as Address // Base Mainnet Commerce Protocol
  },
  'base-sepolia': {
    chainId: baseSepolia.id,
    facilitatorUrl: 'https://x402.org/facilitator',
    rpcUrl: baseSepolia.rpcUrls.default.http[0],
    blockExplorer: baseSepolia.blockExplorers.default.url,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // Base Sepolia USDC
    commerceProtocol: '0x96A08D8e8631b6dB52Ea0cbd7232d9A85d239147' as Address // Base Sepolia Commerce Protocol
  }
} as const

// Default facilitator configuration for Coinbase's hosted service
export const X402_FACILITATOR_CONFIG = {
  baseUrl: 'https://x402.org/facilitator',
  verifyEndpoint: '/verify',
  timeout: 30000, // 30 seconds timeout for payment verification
  retryAttempts: 3,
  retryDelay: 1000 // 1 second between retries
} as const

/**
 * Complete x402 configuration factory
 * Creates a full x402 config object with all necessary settings
 * 
 * @param chainId - The blockchain network ID (8453 for Base, 84532 for Base Sepolia)
 * @returns Complete x402 configuration object
 */
export function createX402Config(chainId: number): X402Config {
  // Validate the chain ID is supported
  const network = chainId === base.id ? 'base' : 
                  chainId === baseSepolia.id ? 'base-sepolia' : null
  
  if (!network) {
    throw new Error(`Unsupported chain ID for x402: ${chainId}. Only Base (${base.id}) and Base Sepolia (${baseSepolia.id}) are supported.`)
  }

  // Get network-specific configuration
  const networkConfig = getX402NetworkConfig(network)
  
  // Get your deployed contract addresses
  const contractAddresses = getContractAddresses(chainId)
  
  // Resource wallet address - this should be your designated payment receiver
  const walletAddress = (
    process.env.NEXT_PUBLIC_RESOURCE_WALLET_ADDRESS || 
    process.env.NEXT_PUBLIC_COMMERCE_INTEGRATION_ADDRESS ||
    contractAddresses.COMMERCE_INTEGRATION
  ) as Address

  if (!walletAddress || walletAddress === '0x') {
    throw new Error('Resource wallet address not configured. Set NEXT_PUBLIC_RESOURCE_WALLET_ADDRESS or ensure COMMERCE_INTEGRATION contract is deployed.')
  }

  return {
    walletAddress,
    network,
    facilitatorUrl: networkConfig.facilitatorUrl,
    contractAddresses: {
      ...contractAddresses,
      USDC: networkConfig.usdcAddress,
      COMMERCE_PROTOCOL: networkConfig.commerceProtocol
    },
    chainId
  }
}

/**
 * Get x402 network configuration for specified chain
 * 
 * @param network - The network name ('base' or 'base-sepolia')
 * @returns Network configuration with facilitator URLs, RPC endpoints, and contract addresses
 */
export function getX402NetworkConfig(network: 'base' | 'base-sepolia'): X402NetworkConfig {
  const config = X402_NETWORKS[network]
  
  if (!config) {
    throw new Error(`Unsupported x402 network: ${network}. Supported networks: base, base-sepolia`)
  }
  
  return config
}

/**
 * Validate x402 configuration for completeness and correctness
 * 
 * @param config - The x402 configuration to validate
 * @returns True if configuration is valid, throws error otherwise
 */
export function validateX402Config(config: X402Config): boolean {
  // Validate wallet address format
  if (!config.walletAddress || !config.walletAddress.startsWith('0x') || config.walletAddress.length !== 42) {
    throw new Error(`Invalid wallet address format: ${config.walletAddress}`)
  }

  // Validate network
  if (!['base', 'base-sepolia'].includes(config.network)) {
    throw new Error(`Invalid network: ${config.network}`)
  }

  // Validate facilitator URL
  if (!config.facilitatorUrl || !config.facilitatorUrl.startsWith('https://')) {
    throw new Error(`Invalid facilitator URL: ${config.facilitatorUrl}`)
  }

  // Validate chain ID matches network
  const expectedChainId = config.network === 'base' ? base.id : baseSepolia.id
  if (config.chainId !== expectedChainId) {
    throw new Error(`Chain ID ${config.chainId} doesn't match network ${config.network} (expected ${expectedChainId})`)
  }

  // Validate required contract addresses are present
  const requiredContracts = ['COMMERCE_INTEGRATION', 'CONTENT_REGISTRY', 'PAY_PER_VIEW']
  for (const contract of requiredContracts) {
    if (!config.contractAddresses[contract]) {
      throw new Error(`Missing required contract address: ${contract}`)
    }
  }

  return true
}

/**
 * Get payment configuration for x402 middleware
 * Defines payment limits, allowed tokens, and timeout settings
 * 
 * @returns Payment configuration object with security and operational limits
 */
export function getX402PaymentConfig(): X402PaymentConfig {
  return {
    maxAmount: BigInt('1000000000'), // 1,000 USDC (6 decimals) max payment
    minAmount: BigInt('10000'), // 0.01 USDC (6 decimals) minimum payment
    allowedTokens: [
      X402_NETWORKS.base.usdcAddress,
      X402_NETWORKS['base-sepolia'].usdcAddress
    ],
    timeout: 300000, // 5 minutes timeout for payment completion
    gaslessTolerance: 10 // Allow up to 10% difference in gas estimates for ERC-3009
  }
}

/**
 * Create payment requirements object for 402 responses
 * This is what gets sent to clients when payment is required
 * 
 * @param resource - The protected resource path
 * @param amount - Payment amount in USDC (as string with decimals)
 * @param description - Human-readable description of what's being purchased
 * @param network - Target network for payment
 * @returns Payment requirements object for client
 */
export function createPaymentRequirements(
  resource: string,
  amount: string,
  description: string,
  network: 'base' | 'base-sepolia' = 'base'
): X402PaymentRequirements {
  const networkConfig = getX402NetworkConfig(network)
  
  // Get the appropriate receiver wallet address
  const chainId = networkConfig.chainId
  const config = createX402Config(chainId)
  
  return {
    resource,
    maxAmountRequired: amount,
    description,
    payTo: config.walletAddress,
    asset: networkConfig.usdcAddress,
    scheme: 'exact',
    network
  }
}

/**
 * Verify payment with Coinbase x402 facilitator
 * Makes actual API call to facilitator service for payment verification
 * 
 * @param paymentPayload - The payment data from X-PAYMENT header
 * @param paymentRequirements - The original payment requirements
 * @param network - Network where payment should be verified
 * @returns Verification response from facilitator
 */
export async function verifyPaymentWithFacilitator(
  paymentPayload: string,
  paymentRequirements: X402PaymentRequirements,
  network: 'base' | 'base-sepolia' = 'base'
): Promise<X402VerificationResponse> {
  const networkConfig = getX402NetworkConfig(network)
  const facilitatorUrl = `${networkConfig.facilitatorUrl}${X402_FACILITATOR_CONFIG.verifyEndpoint}`
  
  try {
    const response = await fetch(facilitatorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'x402-client/1.0'
      },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements
      }),
      signal: AbortSignal.timeout(X402_FACILITATOR_CONFIG.timeout)
    })

    if (!response.ok) {
      throw new Error(`Facilitator verification failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json() as X402VerificationResponse
    
    if (!result.verified) {
      throw new Error(`Payment verification failed: ${result.error || 'Unknown error'}`)
    }

    return result
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Payment verification failed: ${error.message}`)
    }
    throw new Error('Payment verification failed: Unknown error')
  }
}

/**
 * Get current environment network
 * Determines which network to use based on environment variables
 * 
 * @returns Current network name based on environment
 */
export function getCurrentNetwork(): 'base' | 'base-sepolia' {
  const envNetwork = process.env.NEXT_PUBLIC_NETWORK?.toLowerCase()
  
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
 * Get x402 configuration for current environment
 * Convenience function that creates config for the current environment network
 * 
 * @returns x402 configuration for current environment
 */
export function getCurrentX402Config(): X402Config {
  const network = getCurrentNetwork()
  const chainId = network === 'base' ? base.id : baseSepolia.id
  return createX402Config(chainId)
}

/**
 * Format USDC amount for display
 * Converts USDC amount (6 decimals) to human-readable format
 * 
 * @param amount - USDC amount as bigint (6 decimals)
 * @returns Formatted string like "1.50 USDC"
 */
export function formatUSDCAmount(amount: bigint): string {
  const formatted = (Number(amount) / 1_000_000).toFixed(2)
  return `${formatted} USDC`
}

/**
 * Parse USDC amount from string
 * Converts human-readable amount to USDC units (6 decimals)
 * 
 * @param amount - Amount as string like "1.50"
 * @returns USDC amount as bigint (6 decimals)
 */
export function parseUSDCAmount(amount: string): bigint {
  const parsed = parseFloat(amount)
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid USDC amount: ${amount}`)
  }
  return BigInt(Math.round(parsed * 1_000_000))
}

/**
 * Check if current environment is production
 * 
 * @returns True if running on Base mainnet
 */
export function isProduction(): boolean {
  return getCurrentNetwork() === 'base'
}

/**
 * Get error message for common x402 errors
 * Provides user-friendly error messages for common failure scenarios
 * 
 * @param error - Error object or message
 * @returns User-friendly error message
 */
export function getX402ErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    if (error.includes('insufficient')) return 'Insufficient USDC balance for payment'
    if (error.includes('timeout')) return 'Payment verification timed out. Please try again.'
    if (error.includes('network')) return 'Network error. Please check your connection and try again.'
    if (error.includes('signature')) return 'Invalid payment signature. Please try the payment again.'
    return error
  }
  
  if (error instanceof Error) {
    return getX402ErrorMessage(error.message)
  }
  
  return 'An unexpected error occurred during payment processing.'
}