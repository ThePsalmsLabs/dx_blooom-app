/**
 * Subscription Status Check Hook
 * 
 * This hook provides a simple interface for checking if a user is subscribed to a creator.
 * It wraps the more complex subscription management system to provide a clean boolean check.
 */

import { useMemo } from 'react'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'
import { useSubscriptionManagement } from './useSubscriptionManagement'

export interface SubscriptionStatusResult {
  /** Whether the user currently has an active subscription */
  readonly isSubscribed: boolean
  /** Whether the subscription is in a grace period */
  readonly inGracePeriod: boolean
  /** Number of days remaining in the subscription (0 if not subscribed) */
  readonly daysRemaining: number
  /** When the subscription expires (null if not subscribed) */
  readonly expiresAt: Date | null
  /** Whether subscription data is currently loading */
  readonly isLoading: boolean
  /** Any error that occurred while checking subscription status */
  readonly error: Error | null
  /** Subscription details if available */
  readonly subscriptionDetails: {
    readonly startTime: Date | null
    readonly totalPaid: bigint
    readonly renewalCount: number
  } | null
}

/**
 * Hook to check if a user is subscribed to a specific creator
 */
export function useSubscriptionStatus(
  creatorAddress: Address | undefined, 
  userAddress?: Address
): SubscriptionStatusResult {
  const { address: connectedAddress } = useAccount()
  const effectiveUserAddress = userAddress || connectedAddress
  
  // Use the existing subscription management hook
  const subscriptionManagement = useSubscriptionManagement(effectiveUserAddress)
  
  // Check if user is subscribed to this specific creator
  const subscriptionStatus = useMemo(() => {
    if (!effectiveUserAddress || !creatorAddress) {
      return {
        isSubscribed: false,
        inGracePeriod: false,
        daysRemaining: 0,
        expiresAt: null,
        isLoading: false,
        error: null,
        subscriptionDetails: null
      }
    }

    // Check if this creator is in the user's active subscriptions
    const activeSubscription = subscriptionManagement.activeSubscriptions.subscriptions.find(
      sub => sub.creator.toLowerCase() === creatorAddress.toLowerCase()
    )

    if (!activeSubscription) {
      return {
        isSubscribed: false,
        inGracePeriod: false,
        daysRemaining: 0,
        expiresAt: null,
        isLoading: subscriptionManagement.isLoading,
        error: subscriptionManagement.error,
        subscriptionDetails: null
      }
    }

    const expiresAt = activeSubscription.endTime > BigInt(0) 
      ? new Date(Number(activeSubscription.endTime) * 1000)
      : null

    return {
      isSubscribed: activeSubscription.isActive,
      inGracePeriod: activeSubscription.inGracePeriod,
      daysRemaining: activeSubscription.daysRemaining,
      expiresAt,
      isLoading: subscriptionManagement.isLoading,
      error: subscriptionManagement.error,
      subscriptionDetails: {
        startTime: activeSubscription.startTime > BigInt(0) 
          ? new Date(Number(activeSubscription.startTime) * 1000)
          : null,
        totalPaid: activeSubscription.totalPaid,
        renewalCount: Number(activeSubscription.renewalCount)
      }
    }
  }, [
    effectiveUserAddress,
    creatorAddress,
    subscriptionManagement.activeSubscriptions.subscriptions,
    subscriptionManagement.isLoading,
    subscriptionManagement.error
  ])

  return subscriptionStatus
}

/**
 * Simple hook that returns just a boolean for subscription status
 * Useful for simple access control checks
 */
export function useIsSubscribed(
  creatorAddress: Address | undefined,
  userAddress?: Address
): boolean {
  const status = useSubscriptionStatus(creatorAddress, userAddress)
  return status.isSubscribed
}