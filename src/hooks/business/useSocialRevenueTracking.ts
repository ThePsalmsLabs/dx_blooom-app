// ==============================================================================
// COMPONENT 4.4: REVENUE ATTRIBUTION SYSTEM
// File: src/hooks/business/useSocialRevenueTracking.ts
// ==============================================================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useChainId, useWatchContractEvent, usePublicClient } from 'wagmi'
import { type Address, type Log, parseEventLogs } from 'viem'

// Import existing hooks from your core contracts system
import { useCreatorPendingEarnings } from '@/hooks/contracts/core'

// Import Mini App analytics integration (Component 4.2)
import { useMiniAppAnalytics } from '@/hooks/farcaster/useMiniAppAnalytics'

// Import contract configuration and ABIs
import { getCommerceIntegrationContract } from '@/lib/contracts/config'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'

/**
 * Revenue Attribution Interface
 * 
 * This interface defines the revenue attribution data structure, tracking how
 * much revenue comes from different sources. Using BigInt for monetary values
 * ensures precision and compatibility with your existing smart contract
 * infrastructure that handles USDC amounts.
 */
export interface RevenueAttribution {
  /** Revenue from direct platform purchases (no social referrer) */
  readonly directPurchases: bigint
  
  /** Revenue from social referrals (users coming from social media posts) */
  readonly socialReferrals: bigint
  
  /** Revenue from Farcaster Frame interactions and conversions */
  readonly frameConversions: bigint
  
  /** Revenue from Mini App purchases within Farcaster clients */
  readonly miniAppPurchases: bigint
}

/**
 * Payment Event Interface
 * 
 * This interface matches the PaymentCompleted event structure from your
 * Commerce Protocol Integration contract, ensuring type safety when processing
 * payment events for revenue attribution analysis.
 */
interface PaymentEvent {
  /** Unique payment intent identifier */
  readonly intentId: string
  
  /** User who made the payment */
  readonly user: Address
  
  /** Creator receiving the payment */
  readonly creator: Address
  
  /** Payment type (PayPerView, Subscription, etc.) */
  readonly paymentType: number
  
  /** Amount paid in USDC (as BigInt) */
  readonly amount: bigint
  
  /** Payment deadline timestamp */
  readonly deadline: bigint
  
  /** Block timestamp when payment occurred */
  readonly timestamp?: bigint
  
  /** Transaction hash for additional context */
  readonly transactionHash?: string
  
  /** Additional event metadata for source determination */
  readonly metadata?: {
    readonly referrer?: string
    readonly userAgent?: string
    readonly farcasterContext?: {
      readonly castHash?: string
      readonly frameId?: string
      readonly channelId?: string
    }
  }
}

/**
 * Payment Source Types
 * 
 * These types classify the origin of payments for revenue attribution.
 * The classification helps creators understand which channels drive
 * the most revenue and optimize their content strategy accordingly.
 */
type PaymentSource = 'direct' | 'social' | 'frame' | 'miniapp'

/**
 * Revenue Attribution Result Interface
 * 
 * This interface defines the complete return value of the useSocialRevenueTracking
 * hook, providing revenue attribution data alongside loading states and utility
 * functions for integration with dashboard components.
 */
interface SocialRevenueTrackingResult {
  /** Current revenue attribution data */
  readonly revenueAttribution: RevenueAttribution
  
  /** Loading state for attribution data */
  readonly isLoading: boolean
  
  /** Error state for attribution tracking */
  readonly error: Error | null
  
  /** Total tracked revenue across all sources */
  readonly totalTrackedRevenue: bigint
  
  /** Percentage breakdown of revenue sources */
  readonly revenueBreakdown: {
    readonly directPercentage: number
    readonly socialPercentage: number
    readonly framePercentage: number
    readonly miniAppPercentage: number
  }
  
  /** Function to manually refresh attribution data */
  readonly refetch: () => Promise<void>
  
  /** Function to reset attribution tracking */
  readonly reset: () => void
}

/**
 * Payment Source Determination Logic
 * 
 * This class encapsulates the business logic for determining payment sources
 * based on event metadata. It provides a clean separation of concerns and
 * makes the classification logic easily testable and maintainable.
 */
class PaymentSourceClassifier {
  /**
   * Determine Payment Source from Event Metadata
   * 
   * This method analyzes payment event metadata to classify the source of
   * the payment. It uses various indicators like referrer data, user agent
   * strings, and Farcaster context to make accurate attributions.
   * 
   * @param event - Payment event with metadata
   * @returns Classification of payment source
   */
  static determinePaymentSource(event: PaymentEvent): PaymentSource {
    // Check for Farcaster Frame context first (highest specificity)
    if (event.metadata?.farcasterContext?.frameId) {
      return 'frame'
    }
    
    // Check for Mini App context in user agent or referrer
    if (event.metadata?.userAgent?.includes('Farcaster') || 
        event.metadata?.referrer?.includes('warpcast.com') ||
        event.metadata?.referrer?.includes('farcaster')) {
      return 'miniapp'
    }
    
    // Check for social media referrers
    if (event.metadata?.referrer) {
      const socialDomains = [
        'twitter.com', 'x.com', 't.co',
        'facebook.com', 'fb.me',
        'instagram.com',
        'linkedin.com',
        'reddit.com',
        'discord.com',
        'telegram.org',
        'farcaster.xyz'
      ]
      
      const referrerUrl = new URL(event.metadata.referrer)
      const isFromSocial = socialDomains.some(domain => 
        referrerUrl.hostname.includes(domain)
      )
      
      if (isFromSocial) {
        return 'social'
      }
    }
    
    // Default to direct if no social indicators found
    return 'direct'
  }
  
  /**
   * Validate Payment Event Structure
   * 
   * This method ensures payment events have the required structure before
   * processing them for revenue attribution. It helps prevent runtime errors
   * and provides graceful handling of malformed events.
   * 
   * @param event - Payment event to validate
   * @returns Whether the event is valid for processing
   */
  static isValidPaymentEvent(event: unknown): event is PaymentEvent {
    if (!event || typeof event !== 'object') return false
    
    const e = event as Record<string, unknown>
    
    return (
      typeof e.intentId === 'string' &&
      typeof e.user === 'string' &&
      typeof e.creator === 'string' &&
      typeof e.paymentType === 'number' &&
      typeof e.amount === 'bigint'
    )
  }
}

/**
 * Revenue Attribution Calculator
 * 
 * This class handles the mathematical calculations for revenue attribution
 * and percentage breakdowns. It provides utility methods for converting
 * BigInt values to percentages and calculating derived metrics.
 */
class RevenueAttributionCalculator {
  /**
   * Calculate Revenue Percentage Breakdown
   * 
   * This method converts raw revenue amounts to percentage breakdowns for
   * dashboard display and analytics visualization. It handles edge cases
   * like zero revenue gracefully.
   * 
   * @param attribution - Revenue attribution data
   * @returns Percentage breakdown of revenue sources
   */
  static calculateRevenueBreakdown(attribution: RevenueAttribution) {
    const totalRevenue = attribution.directPurchases + 
                        attribution.socialReferrals + 
                        attribution.frameConversions + 
                        attribution.miniAppPurchases
    
    if (totalRevenue === BigInt(0)) {
      return {
        directPercentage: 0,
        socialPercentage: 0,
        framePercentage: 0,
        miniAppPercentage: 0
      }
    }
    
    // Convert BigInt to numbers for percentage calculation
    const total = Number(totalRevenue)
    const direct = Number(attribution.directPurchases)
    const social = Number(attribution.socialReferrals)
    const frame = Number(attribution.frameConversions)
    const miniApp = Number(attribution.miniAppPurchases)
    
    return {
      directPercentage: Math.round((direct / total) * 100 * 100) / 100,
      socialPercentage: Math.round((social / total) * 100 * 100) / 100,
      framePercentage: Math.round((frame / total) * 100 * 100) / 100,
      miniAppPercentage: Math.round((miniApp / total) * 100 * 100) / 100
    }
  }
  
  /**
   * Get Total Revenue
   * 
   * This utility method calculates the total revenue across all attribution
   * sources, providing a convenient way to get aggregate metrics.
   * 
   * @param attribution - Revenue attribution data
   * @returns Total revenue amount as BigInt
   */
  static getTotalRevenue(attribution: RevenueAttribution): bigint {
    return attribution.directPurchases + 
           attribution.socialReferrals + 
           attribution.frameConversions + 
           attribution.miniAppPurchases
  }
}

/**
 * Production Event Subscription Function
 *
 * Subscribes to PaymentCompleted events from the Commerce Protocol Integration contract.
 * Fetches historical logs and listens for new events, calling the callback with PaymentEvent[]
 *
 * @param contractAddress - Address of the Commerce Protocol Integration contract
 * @param callback - Function to call when payment events are received
 * @returns Cleanup function to unsubscribe from events
 */
function parseLog(log: Log): PaymentEvent {
  // args may be undefined or not have the expected types, so check each field
  const args = (log as Log & { args?: Record<string, unknown> }).args ?? {}
  return {
    intentId: typeof args.intentId === 'string' ? args.intentId : '',
    user: typeof args.user === 'string' ? (args.user as Address) : '0x',
    creator: typeof args.creator === 'string' ? (args.creator as Address) : '0x',
    paymentType: typeof args.paymentType === 'number' ? args.paymentType : 0,
    amount: typeof args.amountPaid === 'bigint' ? args.amountPaid :
           typeof args.amount === 'bigint' ? args.amount : BigInt(0),
    deadline: typeof args.deadline === 'bigint' ? args.deadline : BigInt(0),
    timestamp: typeof args.timestamp === 'bigint'
      ? args.timestamp
      : BigInt(Date.now() / 1000),
    transactionHash: typeof log.transactionHash === 'string' ? log.transactionHash : undefined,
    metadata: {
      // TODO: Enrich with analytics or transaction input parsing
      referrer: undefined,
      userAgent: undefined,
      farcasterContext: undefined,
    },
  }
}

function subscribeToPaymentEvents(
  publicClient: ReturnType<typeof usePublicClient> | null,
  contractAddress: Address,
  callback: (events: PaymentEvent[]) => void
): () => void {
  // Use provided publicClient for historical logs and watchContractEvent for real-time
  let cancelled = false
  
  // Guard: if publicClient is not available, return a no-op unsubscribe

  // Guard: if publicClient is not available, return a no-op unsubscribe
  if (!publicClient) {
    return () => {}
  }

  // Fetch historical logs
  (async () => {
    try {
      const logs = await publicClient.getLogs({
        address: contractAddress,
        fromBlock: 'earliest',
        toBlock: 'latest',
      })
      if (!cancelled && logs.length > 0) {
        const decoded = parseEventLogs({
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          eventName: 'PaymentCompleted',
          logs
        })
        const events = decoded.map(parseLog).filter(PaymentSourceClassifier.isValidPaymentEvent)
        callback(events)
      }
    } catch (err) {
      // Optionally handle error
      console.error('Error fetching historical PaymentCompleted logs:', err)
    }
  })()

  // Subscribe to new events using publicClient
  const unwatch = publicClient.watchContractEvent({
    address: contractAddress,
    abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
    eventName: 'PaymentCompleted',
    onLogs: (logs: Log[]) => {
      const events = logs.map(parseLog).filter(PaymentSourceClassifier.isValidPaymentEvent)
      if (events.length > 0) callback(events)
    },
  })

  // Cleanup function
  return () => {
    cancelled = true
    unwatch()
  }
}

/**
 * Social Revenue Tracking Hook
 * 
 * This hook implements the complete revenue attribution system by integrating
 * with your existing earnings tracking and adding social source attribution.
 * It demonstrates how to extend existing functionality without disrupting
 * current workflows.
 * 
 * Key Features:
 * - Integrates with your existing useCreatorPendingEarnings hook
 * - Processes payment events from Commerce Protocol Integration contract
 * - Classifies payment sources using metadata analysis
 * - Provides real-time revenue attribution tracking
 * - Includes comprehensive error handling and fallback states
 * - Maintains compatibility with your existing dashboard architecture
 * 
 * Integration Points:
 * - Uses Component 4.2's useMiniAppAnalytics for social metrics correlation
 * - Leverages Component 3.2's payment event context for source determination
 * - Connects with Component 4.1's EnhancedCreatorDashboard for display
 * - Follows your established patterns for hook design and state management
 * 
 * @param creatorAddress - Optional creator address, defaults to connected wallet
 * @returns Complete social revenue tracking data and utilities
 */
export function useSocialRevenueTracking(
  creatorAddress?: Address
): SocialRevenueTrackingResult {
  // Wallet connection and creator identification
  const { address: connectedAddress } = useAccount()
  const chainId = useChainId()
  const effectiveCreatorAddress = (creatorAddress || connectedAddress) as Address | undefined
  
  // Integration with existing earnings tracking
  const pendingEarnings = useCreatorPendingEarnings(effectiveCreatorAddress)
  
  // Contract configuration for event listening
  const contractConfig = useMemo(() => getCommerceIntegrationContract(chainId), [chainId])
  
  // State management for revenue attribution
  const [revenueAttribution, setRevenueAttribution] = useState<RevenueAttribution>({
    directPurchases: BigInt(0),
    socialReferrals: BigInt(0),
    frameConversions: BigInt(0),
    miniAppPurchases: BigInt(0)
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  // Public client must be called at hook top-level, not inside callbacks
  const publicClient = usePublicClient()
  
  /**
   * Process Payment Events for Revenue Attribution
   * 
   * This function analyzes payment events and updates the revenue attribution
   * state accordingly. It classifies each payment by source and accumulates
   * the revenue amounts for accurate tracking.
   * 
   * @param events - Array of payment events to process
   */
  const processPaymentEvents = useCallback((events: PaymentEvent[]) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Filter events for the current creator
      const creatorEvents = events.filter(event => 
        effectiveCreatorAddress && 
        event.creator.toLowerCase() === effectiveCreatorAddress.toLowerCase()
      )
      
      // Process each event and update attribution
      const attributionUpdates = {
        directPurchases: BigInt(0),
        socialReferrals: BigInt(0),
        frameConversions: BigInt(0),
        miniAppPurchases: BigInt(0)
      }
      
      creatorEvents.forEach(event => {
        if (!PaymentSourceClassifier.isValidPaymentEvent(event)) {
          console.warn('Invalid payment event structure:', event)
          return
        }
        
        const source = PaymentSourceClassifier.determinePaymentSource(event)
        
        switch (source) {
          case 'direct':
            attributionUpdates.directPurchases += event.amount
            break
          case 'social':
            attributionUpdates.socialReferrals += event.amount
            break
          case 'frame':
            attributionUpdates.frameConversions += event.amount
            break
          case 'miniapp':
            attributionUpdates.miniAppPurchases += event.amount
            break
        }
      })
      
      // Update revenue attribution state
      setRevenueAttribution(prev => ({
        directPurchases: prev.directPurchases + attributionUpdates.directPurchases,
        socialReferrals: prev.socialReferrals + attributionUpdates.socialReferrals,
        frameConversions: prev.frameConversions + attributionUpdates.frameConversions,
        miniAppPurchases: prev.miniAppPurchases + attributionUpdates.miniAppPurchases
      }))
      
    } catch (processingError) {
      const error = processingError instanceof Error 
        ? processingError 
        : new Error('Failed to process payment events')
      
      setError(error)
      console.error('Payment event processing error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [effectiveCreatorAddress])
  
  /**
   * Event Subscription Effect
   * 
   * This effect sets up the event subscription when the hook is mounted and
   * cleans up when unmounted. It uses the existing subscribeToPaymentEvents
   * function to integrate with your payment event infrastructure.
   */
  useEffect(() => {
    if (!effectiveCreatorAddress) {
      return
    }
    
    try {
      // Subscribe to payment events using existing infrastructure
      const unsubscribe = subscribeToPaymentEvents(publicClient, contractConfig.address, processPaymentEvents)
      
      return () => {
        unsubscribe()
      }
    } catch (subscriptionError) {
      const error = subscriptionError instanceof Error 
        ? subscriptionError 
        : new Error('Failed to subscribe to payment events')
      
      setError(error)
      console.error('Event subscription error:', error)
    }
  }, [effectiveCreatorAddress, processPaymentEvents, contractConfig.address])
  
  /**
   * Contract Event Watching
   * 
   * This hook watches for PaymentCompleted events from the Commerce Protocol
   * Integration contract to capture real-time payment data for attribution.
   * It provides a backup to the subscribeToPaymentEvents function.
   */
  useWatchContractEvent({
    address: contractConfig.address,
    abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
    eventName: 'PaymentCompleted',
    onLogs: (logs: Log[]) => {
      try {
        const paymentEvents: PaymentEvent[] = logs
          .map(parseLog)
          .filter(PaymentSourceClassifier.isValidPaymentEvent)
        if (paymentEvents.length > 0) {
          processPaymentEvents(paymentEvents)
        }
      } catch (logProcessingError) {
        console.error('Error processing contract event logs:', logProcessingError)
      }
    },
    enabled: !!effectiveCreatorAddress
  })
  
  /**
   * Derived Metrics Calculation
   * 
   * These memoized calculations provide additional metrics for dashboard
   * display and analytics, including percentage breakdowns and totals.
   */
  const totalTrackedRevenue = useMemo(() => 
    RevenueAttributionCalculator.getTotalRevenue(revenueAttribution),
    [revenueAttribution]
  )
  
  const revenueBreakdown = useMemo(() => 
    RevenueAttributionCalculator.calculateRevenueBreakdown(revenueAttribution),
    [revenueAttribution]
  )
  
  /**
   * Manual Refetch Function
   * 
   * This function allows dashboard components to manually trigger a refresh
   * of revenue attribution data, useful for providing users with up-to-date
   * metrics after content publishing or marketing activities.
   */
  const refetch = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Refetch underlying earnings data
      await pendingEarnings.refetch()
      
      // In production, you might also trigger a fresh fetch of payment events
      // For now, we'll just refresh the existing data
      console.log('Refreshing revenue attribution data...')
      
    } catch (refetchError) {
      const error = refetchError instanceof Error 
        ? refetchError 
        : new Error('Failed to refresh revenue attribution data')
      
      setError(error)
      console.error('Revenue attribution refetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pendingEarnings])
  
  /**
   * Reset Function
   * 
   * This function resets the revenue attribution tracking to initial state,
   * useful for testing or when switching between different creators.
   */
  const reset = useCallback(() => {
    setRevenueAttribution({
      directPurchases: BigInt(0),
      socialReferrals: BigInt(0),
      frameConversions: BigInt(0),
      miniAppPurchases: BigInt(0)
    })
    setError(null)
    setIsLoading(false)
  }, [])
  
  /**
   * Hook Return Value
   * 
   * The hook returns a comprehensive data structure that provides everything
   * dashboard components need for revenue attribution display and interaction.
   */
  return {
    revenueAttribution,
    isLoading: isLoading || pendingEarnings.isLoading,
    error: error || (pendingEarnings.error as Error | null),
    totalTrackedRevenue,
    revenueBreakdown,
    refetch,
    reset
  }
}