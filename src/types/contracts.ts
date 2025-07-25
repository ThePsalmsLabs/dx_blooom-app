/**
 * Contract Type Definitions - TypeScript Interface Layer
 * File: src/types/contracts.ts
 * 
 * This file defines TypeScript interfaces that exactly mirror the data structures
 * in your Solidity smart contracts. Think of these as the communication protocol
 * between your smart contracts and your frontend - they ensure that every piece
 * of data is properly typed and validated.
 * 
 * These types serve multiple critical purposes:
 * 1. Compile-time safety: TypeScript catches type mismatches before deployment
 * 2. IDE support: Auto-completion and documentation for all contract data
 * 3. Runtime validation: Ensures data matches expected contract formats
 * 4. Code maintainability: Makes contract changes visible across the frontend
 * 
 * Each interface corresponds exactly to a Solidity struct or function parameter,
 * maintaining perfect synchronization between your contracts and frontend.
 */

import { type Address, type Hash } from 'viem'

// ===== CONTENT CATEGORIZATION SYSTEM =====
// These categories align exactly with the enum defined in ContentRegistry.sol

/**
 * Content Categories - Mirrors ContentRegistry.sol enum
 * 
 * This enum defines how content is categorized on the platform. The numeric
 * values must match exactly with the Solidity enum or contract calls will fail.
 * When you add new categories to the smart contract, they must be added here too.
 */
export enum ContentCategory {
  ARTICLE = 0,        // Written content, blog posts, news articles
  VIDEO = 1,          // Video content, tutorials, entertainment
  AUDIO = 2,          // Podcasts, music, audio books
  IMAGE = 3,          // Photography, artwork, infographics
  DOCUMENT = 4,       // PDFs, research papers, technical docs
  COURSE = 5,         // Educational content, structured learning
  SOFTWARE = 6,       // Code, applications, digital tools
  DATA = 7            // Datasets, research data, analytics
}

/**
 * Helper function to convert category enum to human-readable string
 * This is useful for displaying categories in the UI
 */
export function categoryToString(category: ContentCategory): string {
  const categoryNames = {
    [ContentCategory.ARTICLE]: 'Article',
    [ContentCategory.VIDEO]: 'Video', 
    [ContentCategory.AUDIO]: 'Audio',
    [ContentCategory.IMAGE]: 'Image',
    [ContentCategory.DOCUMENT]: 'Document',
    [ContentCategory.COURSE]: 'Course',
    [ContentCategory.SOFTWARE]: 'Software',
    [ContentCategory.DATA]: 'Data'
  }
  return categoryNames[category] || 'Unknown'
}

// ===== CREATOR PROFILE SYSTEM =====
// These interfaces mirror the Creator struct in CreatorRegistry.sol

/**
 * Creator Profile Interface - Mirrors CreatorRegistry.Creator struct
 * 
 * This represents a registered content creator on the platform. Every field
 * corresponds exactly to the Solidity struct, ensuring perfect compatibility
 * when reading creator data from the blockchain.
 */
export interface Creator {
  readonly isRegistered: boolean        // Registration status flag
  readonly subscriptionPrice: bigint    // Monthly subscription price in USDC (6 decimals)
  readonly isVerified: boolean          // Platform verification badge status
  readonly totalEarnings: bigint        // Cumulative lifetime earnings for reputation
  readonly contentCount: bigint         // Number of content pieces published
  readonly subscriberCount: bigint      // Current active subscriber count
  readonly registrationTime: bigint     // Blockchain timestamp of registration
}

/**
 * Creator Registration Parameters
 * 
 * This interface defines the parameters needed when registering a new creator.
 * Used by frontend forms and the useRegisterCreator hook.
 */
export interface CreatorRegistrationParams {
  readonly subscriptionPrice: bigint    // Monthly price in USDC (must be between min/max)
}

/**
 * Creator Dashboard Summary
 * 
 * This interface provides aggregated data for creator dashboard displays.
 * It combines on-chain data with computed metrics for UI presentation.
 */
export interface CreatorDashboardData {
  readonly profile: Creator
  readonly pendingEarnings: bigint      // Withdrawable earnings
  readonly recentPurchases: readonly ContentPurchase[]
  readonly topPerformingContent: readonly Content[]
  readonly monthlyRevenue: bigint       // Current month's earnings
  readonly growthMetrics: {
    readonly subscriberGrowth: number   // Percentage change in subscribers
    readonly revenueGrowth: number      // Percentage change in revenue
    readonly contentGrowth: number      // Percentage change in content count
  }
}

// ===== CONTENT MANAGEMENT SYSTEM =====
// These interfaces handle all content-related data structures

/**
 * Content Interface - Mirrors ContentRegistry.Content struct
 * 
 * This represents a piece of content on the platform. Each content item
 * has metadata stored on-chain while the actual content lives on IPFS.
 */
export interface Content {
  readonly creator: Address             // Ethereum address of the content creator
  readonly ipfsHash: string            // IPFS hash for decentralized content storage
  readonly title: string               // Human-readable content title
  readonly description: string         // Detailed content description
  readonly category: ContentCategory   // Content classification
  readonly payPerViewPrice: bigint     // Price for one-time access (USDC, 6 decimals)
  readonly creationTime: bigint        // Blockchain timestamp of creation
  readonly isActive: boolean           // Whether content is currently available
}

/**
 * Content Upload Parameters
 * 
 * This interface defines the data needed when uploading new content.
 * Used by content creation forms and the useRegisterContent hook.
 */
export interface ContentUploadParams {
  readonly ipfsHash: string            // Content already uploaded to IPFS
  readonly title: string               // Content title (max 200 characters)
  readonly description: string         // Content description (max 1000 characters)
  readonly category: ContentCategory   // Content classification
  readonly payPerViewPrice: bigint     // Price in USDC (6 decimals)
  readonly tags: readonly string[]     // Searchable tags for content discovery
}

/**
 * Content with Extended Metadata
 * 
 * This interface extends the base Content with additional computed fields
 * that are useful for frontend display but not stored on-chain.
 */
export interface ContentWithMetadata extends Content {
  readonly contentId: bigint           // Unique content identifier
  readonly formattedPrice: string      // Human-readable price (e.g., "$1.50")
  readonly relativeTime: string        // Human-readable creation time (e.g., "2 days ago")
  readonly creatorProfile: Creator     // Full creator information
  readonly accessCount: bigint         // Number of users who have purchased access
  readonly tags: readonly string[]     // Associated tags for search/filtering
}

/**
 * Content Discovery Parameters
 * 
 * This interface defines parameters for browsing and searching content.
 * Used by content discovery pages and search functionality.
 */
export interface ContentDiscoveryParams {
  readonly category?: ContentCategory   // Optional category filter
  readonly creator?: Address           // Optional creator filter
  readonly tags?: readonly string[]    // Optional tag filters
  readonly minPrice?: bigint           // Minimum price filter
  readonly maxPrice?: bigint           // Maximum price filter
  readonly sortBy?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular'
  readonly offset: number              // Pagination offset
  readonly limit: number               // Number of items to return
}

// ===== PURCHASE AND ACCESS CONTROL =====
// These interfaces handle payment flows and access management

/**
 * Content Purchase Record
 * 
 * This represents a completed purchase transaction. Used for purchase history
 * and access control verification.
 */
export interface ContentPurchase {
  readonly user: Address               // Buyer's Ethereum address
  readonly contentId: bigint           // Content that was purchased
  readonly amount: bigint              // Amount paid in USDC
  readonly timestamp: bigint           // When the purchase occurred
  readonly transactionHash: Hash       // Blockchain transaction reference
}

/**
 * Direct Purchase Parameters
 * 
 * This interface defines parameters for purchasing content directly.
 * Used by the usePurchaseContent hook and payment flows.
 */
export interface DirectPurchaseParams {
  readonly contentId: bigint           // Content to purchase
  readonly paymentToken?: Address      // Optional: specific token to pay with
  readonly maxSlippage?: number        // Optional: maximum price slippage tolerance
}

/**
 * Subscription Record
 * 
 * This represents an active subscription to a creator. Used for access
 * control and subscription management.
 */
export interface Subscription {
  readonly user: Address               // Subscriber's Ethereum address
  readonly creator: Address            // Creator being subscribed to
  readonly startTime: bigint           // When subscription began
  readonly expiryTime: bigint          // When subscription expires
  readonly autoRenew: boolean          // Whether subscription auto-renews
  readonly totalPaid: bigint           // Total amount paid for this subscription
}

/**
 * Access Control Result
 * 
 * This interface provides comprehensive access information for content.
 * Used by access control hooks and content display components.
 */
export interface AccessControlResult {
  readonly hasAccess: boolean          // Whether user can access content
  readonly accessType: 'none' | 'purchase' | 'subscription' | 'creator'
  readonly purchaseRequired: boolean   // Whether purchase is needed for access
  readonly subscriptionActive: boolean // Whether user has active subscription
  readonly subscriptionExpiry?: bigint // When subscription expires (if applicable)
  readonly canAfford: boolean          // Whether user can afford the content
}

// ===== NETWORK AND CONTRACT CONFIGURATION =====
// These types handle blockchain network and contract configuration

/**
 * Network Contract Addresses
 * 
 * This interface defines all contract addresses for a specific network.
 * Used by contract configuration and deployment management.
 */
export interface NetworkContractAddresses {
  readonly CREATOR_REGISTRY: Address
  readonly CONTENT_REGISTRY: Address
  readonly PAY_PER_VIEW: Address
  readonly SUBSCRIPTION_MANAGER: Address
  readonly COMMERCE_INTEGRATION: Address
  readonly PRICE_ORACLE: Address
  readonly COMMERCE_PROTOCOL: Address   // External Base Commerce Protocol
  readonly USDC: Address               // External USDC token contract
}

/**
 * Contract Call Parameters
 * 
 * This interface standardizes parameters for contract function calls.
 * Used by hooks to provide consistent error handling and gas management.
 */
export interface ContractCallParams {
  readonly gasLimit?: bigint           // Optional gas limit override
  readonly gasPrice?: bigint           // Optional gas price override
  readonly value?: bigint              // ETH value to send with transaction
  readonly account?: Address           // Account to call from (for simulations)
}

// ===== COMMERCE PROTOCOL INTEGRATION =====
// These types handle advanced payment flows through Base Commerce Protocol

/**
 * Transfer Intent
 * 
 * This interface represents a Base Commerce Protocol transfer intent.
 * Used for advanced payment flows and cross-chain transactions.
 */
export interface TransferIntent {
  readonly operator: Address           // Commerce Protocol operator
  readonly sender: Address             // Payment sender
  readonly recipient: Address          // Payment recipient
  readonly amount: bigint              // Payment amount
  readonly token: Address              // Payment token
  readonly expiry: bigint              // Intent expiration time
  readonly fees: {
    readonly operator: bigint          // Operator fee
    readonly recipient: bigint         // Recipient fee
  }
}

/**
 * Commerce Payment Parameters
 * 
 * This interface defines parameters for Commerce Protocol payments.
 * Used by advanced payment hooks and enterprise payment flows.
 */
export interface CommercePaymentParams {
  readonly transferIntent: TransferIntent
  readonly signature: string          // Cryptographic signature for intent
  readonly metadata?: {
    readonly contentId?: bigint        // Associated content (if any)
    readonly subscriptionDuration?: bigint // Subscription length (if any)
  }
}

// ===== PRICE AND CURRENCY MANAGEMENT =====
// These types handle pricing, currency conversion, and financial calculations

/**
 * Price Information
 * 
 * This interface provides comprehensive pricing data for any asset.
 * Used by price oracle hooks and payment calculation utilities.
 */
export interface PriceInfo {
  readonly token: Address              // Token contract address
  readonly priceInUSDC: bigint         // Price in USDC (6 decimals)
  readonly lastUpdated: bigint         // When price was last updated
  readonly confidence: number          // Price confidence score (0-100)
  readonly source: string              // Price data source identifier
}

/**
 * Currency Conversion Parameters
 * 
 * This interface defines parameters for converting between tokens.
 * Used by price calculation and multi-token payment flows.
 */
export interface CurrencyConversionParams {
  readonly fromToken: Address          // Source token
  readonly toToken: Address            // Destination token  
  readonly amount: bigint              // Amount to convert
  readonly slippageTolerance: number   // Maximum acceptable slippage (0-100)
}

// ===== EVENT AND NOTIFICATION TYPES =====
// These types handle blockchain events and user notifications

/**
 * Platform Event
 * 
 * This interface represents any significant platform event.
 * Used by event listening hooks and notification systems.
 */
export interface PlatformEvent {
  readonly type: 'content_registered' | 'content_purchased' | 'subscription_created' | 'creator_registered' | 'earnings_withdrawn'
  readonly timestamp: bigint           // When event occurred
  readonly transactionHash: Hash       // Associated transaction
  readonly blockNumber: bigint         // Block where event was emitted
  readonly data: Record<string, unknown> // Event-specific data
}

/**
 * User Notification
 * 
 * This interface represents notifications shown to users.
 * Used by notification components and alert systems.
 */
export interface UserNotification {
  readonly id: string                  // Unique notification identifier
  readonly type: 'success' | 'error' | 'warning' | 'info'
  readonly title: string               // Notification headline
  readonly message: string             // Detailed notification message
  readonly timestamp: Date             // When notification was created
  readonly isRead: boolean             // Whether user has seen notification
  readonly actionUrl?: string          // Optional action link
  readonly relatedTransaction?: Hash   // Associated blockchain transaction
}

// ===== TYPE GUARDS AND VALIDATION =====
// These utilities help validate and narrow types at runtime

/**
 * Type guard to check if an object is a valid Creator
 */
export function isCreator(obj: unknown): obj is Creator {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'isRegistered' in obj &&
    'subscriptionPrice' in obj &&
    'totalEarnings' in obj
  )
}

/**
 * Type guard to check if an object is valid Content
 */
export function isContent(obj: unknown): obj is Content {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'creator' in obj &&
    'ipfsHash' in obj &&
    'title' in obj &&
    'category' in obj
  )
}

/**
 * Type guard to check if a category value is valid
 */
export function isValidContentCategory(category: number): category is ContentCategory {
  return category >= 0 && category <= 7 && Number.isInteger(category)
}