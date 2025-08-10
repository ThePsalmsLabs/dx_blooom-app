// src/lib/contracts/subscription.ts
import { createPublicClient, http, type Address, type PublicClient } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { getContractConfig } from './config'

/**
 * Subscription Status Enumeration
 * 
 * This enumeration defines all possible states a subscription can be in. Understanding
 * these states is crucial for implementing proper access control. Each state represents
 * a distinct business scenario that requires different handling in the user interface
 * and access control logic.
 */
export enum SubscriptionStatus {
  /** User has never subscribed to this creator */
  NEVER_SUBSCRIBED = 'never_subscribed',
  
  /** User has an active, current subscription */
  ACTIVE = 'active',
  
  /** User had a subscription but it has expired */
  EXPIRED = 'expired',
  
  /** User's subscription exists but payments are overdue */
  PAYMENT_OVERDUE = 'payment_overdue',
  
  /** Creator has cancelled/disabled this user's subscription */
  CANCELLED_BY_CREATOR = 'cancelled_by_creator',
  
  /** User has cancelled their own subscription (may still be active until expiry) */
  CANCELLED_BY_USER = 'cancelled_by_user'
}

/**
 * Subscription Details Interface
 * 
 * This interface provides comprehensive information about a user's subscription
 * relationship with a creator. Rather than just providing a boolean active/inactive
 * status, we capture all the nuanced information that determines subscription state.
 * This detailed approach enables sophisticated business logic and user experience
 * improvements.
 */
export interface SubscriptionDetails {
  /** Whether the subscription currently grants content access */
  readonly isActive: boolean
  
  /** Detailed status providing context about the subscription state */
  readonly status: SubscriptionStatus
  
  /** Unix timestamp when the subscription began */
  readonly startTime: bigint
  
  /** Unix timestamp when the subscription expires (0 if no expiry) */
  readonly expiryTime: bigint
  
  /** Unix timestamp of the last successful payment */
  readonly lastPaymentTime: bigint
  
  /** Amount paid for the subscription in USDC (smallest unit) */
  readonly subscriptionPrice: bigint
  
  /** Whether the subscription auto-renews */
  readonly autoRenew: boolean
  
  /** Address of the subscriber */
  readonly subscriberAddress: Address
  
  /** Address of the creator being subscribed to */
  readonly creatorAddress: Address
  
  /** How many days remain until expiry (negative if expired) */
  readonly daysRemaining: number
  
  /** Whether the subscription can be renewed */
  readonly canRenew: boolean
}

/**
 * Subscription Query Result Interface
 * 
 * This interface wraps subscription details with metadata about the query itself.
 * This approach enables better error handling and debugging by providing context
 * about whether data comes from cache, blockchain, or encountered errors during
 * retrieval. The comprehensive error information helps distinguish between different
 * types of failures that require different handling strategies.
 */
export interface SubscriptionQueryResult {
  /** Whether the query succeeded in retrieving subscription data */
  readonly success: boolean
  
  /** Subscription details if query was successful */
  readonly subscription?: SubscriptionDetails
  
  /** Error message if query failed */
  readonly error?: string
  
  /** Technical error code for programmatic handling */
  readonly errorCode?: string
  
  /** Whether this data came from cache or fresh blockchain query */
  readonly fromCache: boolean
  
  /** Timestamp when this data was retrieved */
  readonly retrievedAt: number
  
  /** Block number when subscription data was last updated on-chain */
  readonly blockNumber?: bigint
}

/**
 * Subscription Cache Entry
 * 
 * This interface defines how we cache subscription data to improve performance
 * and reduce blockchain queries. Subscription status doesn't change frequently,
 * so intelligent caching significantly improves user experience while maintaining
 * accuracy. The cache includes expiry logic to ensure we don't serve stale data
 * for too long.
 */
interface SubscriptionCacheEntry {
  readonly subscription: SubscriptionDetails
  readonly cachedAt: number
  readonly blockNumber: bigint
  readonly expiresAt: number
}

/**
 * Subscription Status Cache
 * 
 * This cache optimizes subscription queries by storing recent results and avoiding
 * redundant blockchain queries. The cache is particularly important for subscription
 * checks because they often happen multiple times in quick succession (checking
 * access for multiple pieces of content from the same creator). The cache includes
 * intelligent invalidation logic to balance performance with data freshness.
 */
class SubscriptionStatusCache {
  private readonly cache = new Map<string, SubscriptionCacheEntry>()
  private readonly defaultCacheDuration = 5 * 60 * 1000 // 5 minutes default cache time

  /**
   * Generate cache key for subscriber-creator pair
   */
  private getCacheKey(subscriberAddress: Address, creatorAddress: Address): string {
    return `${subscriberAddress.toLowerCase()}-${creatorAddress.toLowerCase()}`
  }

  /**
   * Check if cached entry exists and is still valid
   */
  public getCachedSubscription(
    subscriberAddress: Address, 
    creatorAddress: Address
  ): SubscriptionCacheEntry | undefined {
    const key = this.getCacheKey(subscriberAddress, creatorAddress)
    const entry = this.cache.get(key)
    
    if (!entry) {
      return undefined
    }

    // Check if cache entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry
  }

  /**
   * Store subscription data in cache
   */
  public cacheSubscription(
    subscriberAddress: Address,
    creatorAddress: Address,
    subscription: SubscriptionDetails,
    blockNumber: bigint,
    customCacheDuration?: number
  ): void {
    const key = this.getCacheKey(subscriberAddress, creatorAddress)
    const cacheDuration = customCacheDuration || this.defaultCacheDuration
    
    this.cache.set(key, {
      subscription,
      cachedAt: Date.now(),
      blockNumber,
      expiresAt: Date.now() + cacheDuration
    })
  }

  /**
   * Invalidate cache entry for a specific subscriber-creator pair
   */
  public invalidateSubscription(subscriberAddress: Address, creatorAddress: Address): void {
    const key = this.getCacheKey(subscriberAddress, creatorAddress)
    this.cache.delete(key)
  }

  /**
   * Clear all cached subscription data
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics for monitoring and debugging
   */
  public getCacheStats(): {
    readonly totalEntries: number
    readonly validEntries: number
    readonly expiredEntries: number
  } {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of Array.from(this.cache.values())) {
      if (now <= entry.expiresAt) {
        validEntries++
      } else {
        expiredEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    }
  }
}

// Global cache instance for subscription status
const subscriptionCache = new SubscriptionStatusCache()

/**
 * Create Blockchain Client for Subscription Queries
 * 
 * This function creates a blockchain client specifically configured for subscription
 * queries. It uses the same network configuration as your other components to ensure
 * consistency, but we create a separate instance to enable subscription-specific
 * optimizations like longer timeouts for complex queries.
 */
function createSubscriptionClient(): PublicClient {
  const network = process.env.NETWORK as 'base' | 'base-sepolia'
  const chain = network === 'base' ? base : baseSepolia
  
  // Use Alchemy if available for better reliability and performance
  const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY 
    ? `https://${network}.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : chain.rpcUrls.default.http[0]

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl, {
      timeout: 30_000, // 30 second timeout for subscription queries
      retryCount: 3,   // Retry failed requests up to 3 times
    })
  })
  
  return client as PublicClient
}

/**
 * Calculate Subscription Status from Raw Data
 * 
 * This function implements the business logic that determines subscription status
 * based on the raw data retrieved from the blockchain. The logic must handle edge
 * cases like expired subscriptions, cancelled subscriptions that are still active
 * until expiry, and subscriptions with payment issues. This centralized logic
 * ensures consistent status determination across your platform.
 */
function calculateSubscriptionStatus(
  startTime: bigint,
  expiryTime: bigint,
  lastPaymentTime: bigint,
  autoRenew: boolean,
  isActive: boolean
): SubscriptionStatus {
  const now = BigInt(Math.floor(Date.now() / 1000)) // Current Unix timestamp

  // If subscription was never started, user never subscribed
  if (startTime === BigInt(0)) {
    return SubscriptionStatus.NEVER_SUBSCRIBED
  }

  // If subscription is marked as inactive by contract, check why
  if (!isActive) {
    // If expiry time has passed, subscription expired
    if (expiryTime > BigInt(0) && now > expiryTime) {
      return SubscriptionStatus.EXPIRED
    }
    
    // If not expired but inactive, likely cancelled by creator
    return SubscriptionStatus.CANCELLED_BY_CREATOR
  }

  // If subscription is active in contract, check if it's actually current
  if (expiryTime > BigInt(0) && now > expiryTime) {
    // Subscription has expired but contract hasn't been updated
    return SubscriptionStatus.EXPIRED
  }

  // Check for payment issues (if last payment was too long ago for auto-renewing subscriptions)
  if (autoRenew && lastPaymentTime > BigInt(0)) {
    const daysSinceLastPayment = Number(now - lastPaymentTime) / (24 * 60 * 60)
    // If more than 35 days since last payment (allowing for 30-day cycles + grace period)
    if (daysSinceLastPayment > 35) {
      return SubscriptionStatus.PAYMENT_OVERDUE
    }
  }

  // If all checks pass, subscription is active
  return SubscriptionStatus.ACTIVE
}

/**
 * Calculate Days Remaining in Subscription
 * 
 * This utility function calculates how many days remain in a subscription,
 * returning negative values for expired subscriptions. This information is
 * useful for user interfaces that show subscription status and for business
 * logic that handles subscription renewals and grace periods.
 */
function calculateDaysRemaining(expiryTime: bigint): number {
  if (expiryTime === BigInt(0)) {
    return Number.MAX_SAFE_INTEGER // No expiry means unlimited time
  }

  const now = Math.floor(Date.now() / 1000)
  const secondsRemaining = Number(expiryTime) - now
  return Math.floor(secondsRemaining / (24 * 60 * 60))
}

/**
 * Query Subscription Data from Blockchain
 * 
 * This function directly queries the SubscriptionManager contract to retrieve
 * raw subscription data for a subscriber-creator pair. It handles all the
 * blockchain interaction complexity and error scenarios, providing a clean
 * interface for the higher-level subscription checking functions.
 */
async function querySubscriptionFromContract(
  client: PublicClient,
  subscriberAddress: Address,
  creatorAddress: Address
): Promise<{
  readonly success: boolean
  readonly data?: {
    readonly startTime: bigint
    readonly expiryTime: bigint
    readonly lastPaymentTime: bigint
    readonly subscriptionPrice: bigint
    readonly autoRenew: boolean
    readonly isActive: boolean
  }
  readonly error?: string
  readonly blockNumber?: bigint
}> {
  try {
    // Get contract configuration for SubscriptionManager
    const network = process.env.NETWORK as 'base' | 'base-sepolia'
    const chainId = network === 'base' ? base.id : baseSepolia.id
    const contractConfig = getContractConfig(chainId, 'SUBSCRIPTION_MANAGER')

    // Get current block number for cache invalidation
    const blockNumber = await client.getBlockNumber()

    // Query subscription data from the contract
    // This calls your SubscriptionManager contract's getSubscription function
    const subscriptionData = await client.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'getSubscriptionDetails',
      args: [subscriberAddress, creatorAddress]
    })

    // Type assertion based on your SubscriptionManager contract structure
    const subscriptionRecord = subscriptionData as {
        readonly isActive: boolean
        readonly startTime: bigint
        readonly endTime: bigint
        readonly renewalCount: bigint
        readonly totalPaid: bigint
        readonly lastPayment: bigint
        // ... other actual fields from your SubscriptionRecord struct
      }

    // Transform the contract data to match our expected interface
    const transformedData = {
      startTime: subscriptionRecord.startTime,
      expiryTime: subscriptionRecord.endTime, // Map endTime to expiryTime
      lastPaymentTime: subscriptionRecord.lastPayment, // Map lastPayment to lastPaymentTime
      subscriptionPrice: subscriptionRecord.totalPaid, // Map totalPaid to subscriptionPrice
      autoRenew: subscriptionRecord.renewalCount > BigInt(0), // Assume auto-renew if renewal count > 0
      isActive: subscriptionRecord.isActive
    }

    return {
      success: true,
      data: transformedData,
      blockNumber
    }

  } catch (error) {
    console.error('Error querying subscription from contract:', error)
    
    // Handle specific contract errors
    if (error instanceof Error) {
      if (error.message.includes('call revert')) {
        return {
          success: false,
          error: 'Subscription data not found or contract call reverted'
        }
      }
      
      if (error.message.includes('network')) {
        return {
          success: false,
          error: 'Network error while querying subscription data'
        }
      }
    }

    return {
      success: false,
      error: `Failed to query subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Get Detailed Subscription Information
 * 
 * This function provides comprehensive subscription information for a subscriber-creator
 * pair. It combines blockchain data with business logic to provide a complete picture
 * of the subscription relationship, including status, timing, and renewal information.
 * This is the main function that other parts of your application should use when they
 * need detailed subscription information.
 */
export async function getSubscriptionDetails(
  subscriberAddress: Address,
  creatorAddress: Address
): Promise<SubscriptionQueryResult> {
  try {
    // Validate input addresses
    if (!/^0x[a-fA-F0-9]{40}$/.test(subscriberAddress)) {
      return {
        success: false,
        error: 'Invalid subscriber address format',
        errorCode: 'INVALID_SUBSCRIBER_ADDRESS',
        fromCache: false,
        retrievedAt: Date.now()
      }
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
      return {
        success: false,
        error: 'Invalid creator address format',
        errorCode: 'INVALID_CREATOR_ADDRESS',
        fromCache: false,
        retrievedAt: Date.now()
      }
    }

    // Check cache first to avoid unnecessary blockchain queries
    const cachedEntry = subscriptionCache.getCachedSubscription(subscriberAddress, creatorAddress)
    
    if (cachedEntry) {
      return {
        success: true,
        subscription: cachedEntry.subscription,
        fromCache: true,
        retrievedAt: cachedEntry.cachedAt,
        blockNumber: cachedEntry.blockNumber
      }
    }

    // Create blockchain client and query contract
    const client = createSubscriptionClient()
    const contractQuery = await querySubscriptionFromContract(client, subscriberAddress, creatorAddress)

    if (!contractQuery.success || !contractQuery.data) {
      return {
        success: false,
        error: contractQuery.error || 'Failed to retrieve subscription data',
        errorCode: 'CONTRACT_QUERY_FAILED',
        fromCache: false,
        retrievedAt: Date.now()
      }
    }

    // Extract and process subscription data
    const {
      startTime,
      expiryTime,
      lastPaymentTime,
      subscriptionPrice,
      autoRenew,
      isActive
    } = contractQuery.data

    // Calculate derived subscription information
    const status = calculateSubscriptionStatus(startTime, expiryTime, lastPaymentTime, autoRenew, isActive)
    const daysRemaining = calculateDaysRemaining(expiryTime)
    const actuallyActive = status === SubscriptionStatus.ACTIVE

    // Determine if subscription can be renewed
    const canRenew = status === SubscriptionStatus.EXPIRED || 
                     status === SubscriptionStatus.PAYMENT_OVERDUE ||
                     (status === SubscriptionStatus.ACTIVE && daysRemaining < 7) // Allow early renewal

    // Create comprehensive subscription details
    const subscriptionDetails: SubscriptionDetails = {
      isActive: actuallyActive,
      status,
      startTime,
      expiryTime,
      lastPaymentTime,
      subscriptionPrice,
      autoRenew,
      subscriberAddress,
      creatorAddress,
      daysRemaining,
      canRenew
    }

    // Cache the result for future queries
    if (contractQuery.blockNumber) {
      subscriptionCache.cacheSubscription(
        subscriberAddress,
        creatorAddress,
        subscriptionDetails,
        contractQuery.blockNumber
      )
    }

    return {
      success: true,
      subscription: subscriptionDetails,
      fromCache: false,
      retrievedAt: Date.now(),
      blockNumber: contractQuery.blockNumber
    }

  } catch (error) {
    console.error('Error getting subscription details:', error)
    return {
      success: false,
      error: `Failed to get subscription details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorCode: 'SUBSCRIPTION_QUERY_ERROR',
      fromCache: false,
      retrievedAt: Date.now()
    }
  }
}

/**
 * Check if User Has Active Subscription
 * 
 * This is the primary function that Component 1.2 uses to verify subscription-based
 * content access. It provides a simple boolean response about whether a user currently
 * has access to a creator's content through an active subscription. This function
 * handles all the complexity of subscription status determination and provides the
 * clean interface that access control logic requires.
 */
export async function hasActiveSubscription(
  userAddress: string,
  creatorId: bigint
): Promise<boolean> {
  try {
    // Convert creatorId to address - this assumes your system uses creator addresses
    // If your system uses numeric creator IDs, you'll need to map them to addresses
    // through your CreatorRegistry contract
    const creatorAddress = `0x${creatorId.toString(16).padStart(40, '0')}` as Address

    // Validate and normalize user address
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      console.error('Invalid user address format:', userAddress)
      return false
    }

    const subscriberAddress = userAddress as Address

    // Get detailed subscription information
    const subscriptionQuery = await getSubscriptionDetails(subscriberAddress, creatorAddress)

    // Return false if query failed or subscription is not active
    if (!subscriptionQuery.success || !subscriptionQuery.subscription) {
      console.error('Subscription query failed:', subscriptionQuery.error)
      return false
    }

    // Return the active status from the detailed subscription information
    return subscriptionQuery.subscription.isActive

  } catch (error) {
    // Log error for debugging but always return false for security
    console.error('Error checking subscription status:', error)
    return false
  }
}

/**
 * Invalidate Subscription Cache
 * 
 * This utility function allows other parts of your system to invalidate cached
 * subscription data when subscription changes occur. For example, when a user
 * subscribes or unsubscribes, you should call this function to ensure that
 * subsequent subscription checks use fresh data from the blockchain rather
 * than stale cached information.
 */
export function invalidateSubscriptionCache(
  subscriberAddress: Address,
  creatorAddress: Address
): void {
  subscriptionCache.invalidateSubscription(subscriberAddress, creatorAddress)
}

/**
 * Get Subscription Cache Statistics
 * 
 * This utility function provides insights into cache performance, which can be
 * useful for monitoring and optimization. Understanding cache hit rates helps
 * tune cache durations and identify patterns in subscription checking behavior.
 */
export function getSubscriptionCacheStats(): {
  readonly totalEntries: number
  readonly validEntries: number
  readonly expiredEntries: number
} {
  return subscriptionCache.getCacheStats()
}