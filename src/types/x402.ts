// types/x402.ts
import { Address } from 'viem'

/**
 * X402 Payment Protocol Types
 * 
 * These types define the complete x402 integration interface that builds
 * on your existing contract infrastructure. Each type ensures complete
 * type safety while integrating with your current wagmi + viem setup.
 */

/**
 * X402 Network Configuration
 * Maps to your existing Base network setup in wagmi config
 */
export type X402Network = 'base' | 'base-sepolia'

/**
 * X402 Payment Requirement Interface
 * Defines what information the server sends to clients requesting payment
 */
export interface X402PaymentRequirement {
  readonly maxAmountRequired: string
  readonly resource: string
  readonly description: string
  readonly payTo: Address
  readonly asset: Address
  readonly network: X402Network
  readonly scheme: 'exact'
  readonly chainId: number
}

/**
 * X402 Route Configuration Interface
 * Defines how specific API routes are protected with x402 payments
 */
export interface X402RouteConfig {
  readonly price: string
  readonly network: X402Network
  readonly config?: X402PaymentConfig
}

/**
 * X402 Payment Configuration Interface
 * Extended configuration options for payment requirements
 */
export interface X402PaymentConfig {
  readonly description?: string
  readonly mimeType?: string
  readonly maxTimeoutSeconds?: number
  readonly outputSchema?: Record<string, unknown>
  readonly customPaywallHtml?: string
  readonly resource?: string
}

/**
 * X402 Routes Configuration Map
 * Maps API routes to their payment requirements
 */
export type X402RoutesConfig = Record<string, string | X402RouteConfig>

/**
 * X402 Facilitator Configuration Interface
 * Defines how to connect to Coinbase CDP facilitator service
 */
export interface X402FacilitatorConfig {
  readonly url?: string
  readonly createAuthHeaders?: (request: Request) => Promise<HeadersInit> | HeadersInit
}

/**
 * X402 Payment Verification Result Interface
 * Result from payment verification process
 */
export interface X402PaymentVerificationResult {
  readonly success: boolean
  readonly transactionHash?: string
  readonly blockNumber?: bigint
  readonly error?: string
}

/**
 * X402 Content Access Configuration Interface
 * Links x402 payments to your existing content access control
 */
export interface X402ContentAccessConfig {
  readonly contentId: bigint
  readonly creatorAddress: Address
  readonly accessType: 'purchase' | 'subscription'
  readonly validationContract: Address
}

/**
 * X402 Payment Success Callback Interface
 * Callback function signature for successful payments
 */
export type X402PaymentSuccessCallback = (
  paymentResult: X402PaymentVerificationResult,
  accessConfig: X402ContentAccessConfig
) => Promise<void>

/**
 * X402 Enhanced Fetch Configuration Interface
 * Configuration for client-side payment-enabled fetch wrapper
 */
export interface X402FetchConfig {
  readonly maxPaymentAmount?: string
  readonly network?: X402Network
  readonly timeout?: number
  readonly retryAttempts?: number
}

/**
 * X402 Payment Response Header Interface
 * Structured response information from successful payments
 */
export interface X402PaymentResponse {
  readonly transactionHash: string
  readonly amount: string
  readonly asset: Address
  readonly network: X402Network
  readonly timestamp: number
}