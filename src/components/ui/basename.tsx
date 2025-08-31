'use client'

import React, { useMemo } from 'react'
import { Name } from '@coinbase/onchainkit/identity'
import { base } from 'viem/chains'
import { type Address } from 'viem'
import { cn } from '@/lib/utils'
import { formatAddress } from '@/lib/utils'

interface BasenameProps {
  /** Ethereum address to resolve to Basename */
  address: Address | string | null | undefined
  /** Additional CSS classes */
  className?: string
  /** Whether to show the full address if no Basename is found */
  showAddressOnFallback?: boolean
  /** Custom fallback text when no Basename is available */
  fallbackText?: string
  /** Whether to enable loading skeleton */
  enableSkeleton?: boolean
  /** Custom styling for the Name component */
  nameClassName?: string
}

/**
 * Basename Component - Displays Base names (Basenames) for Ethereum addresses
 *
 * This component uses Coinbase's OnchainKit to resolve and display Basenames
 * associated with Ethereum addresses on Base network. It provides a seamless
 * fallback to formatted addresses when no Basename is available.
 *
 * Features:
 * - Automatic Basename resolution using OnchainKit
 * - Graceful fallback to formatted address
 * - Customizable styling and display options
 * - Loading states and error handling
 * - TypeScript support with proper typing
 *
 * @param address - Ethereum address to resolve
 * @param className - Additional CSS classes for the container
 * @param showAddressOnFallback - Whether to show formatted address when no Basename
 * @param fallbackText - Custom fallback text
 * @param enableSkeleton - Whether to show loading skeleton
 * @param nameClassName - Custom styling for the Name component
 */
export function Basename({
  address,
  className,
  showAddressOnFallback = true,
  fallbackText,
  enableSkeleton = true,
  nameClassName
}: BasenameProps) {
  const resolvedAddress = useMemo(() => {
    if (!address) return null
    return typeof address === 'string' ? address as Address : address
  }, [address])

  const fallbackDisplay = useMemo(() => {
    if (!resolvedAddress) return fallbackText || 'Unknown'
    if (!showAddressOnFallback) return fallbackText || 'Anonymous'
    return formatAddress(resolvedAddress)
  }, [resolvedAddress, showAddressOnFallback, fallbackText])

  // If no address provided, show fallback
  if (!resolvedAddress) {
    return (
      <span className={cn('text-muted-foreground', className)}>
        {fallbackDisplay}
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-center', className)}>
      <Name
        address={resolvedAddress}
        chain={base}
        className={cn(
          'font-medium text-foreground hover:text-primary transition-colors',
          nameClassName
        )}
        // OnchainKit handles loading states internally
        // We'll show fallback if Name component fails to resolve
      />
      {/* Fallback is handled by OnchainKit's Name component automatically */}
    </div>
  )
}

/**
 * BasenameWithAddress Component - Shows both Basename and formatted address
 *
 * This component displays both the Basename (if available) and the formatted
 * Ethereum address, providing maximum context for users.
 */
export function BasenameWithAddress({
  address,
  className,
  separator = ' • ',
  ...props
}: BasenameProps & {
  separator?: string
}) {
  const resolvedAddress = useMemo(() => {
    if (!address) return null
    return typeof address === 'string' ? address as Address : address
  }, [address])

  if (!resolvedAddress) {
    return (
      <span className={cn('text-muted-foreground', className)}>
        {props.fallbackText || 'Unknown'}
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-center flex-wrap gap-1', className)}>
      <Basename
        address={resolvedAddress}
        showAddressOnFallback={false}
        {...props}
      />
      <span className="text-muted-foreground">
        {separator}
      </span>
      <span className="font-mono text-sm text-muted-foreground">
        {formatAddress(resolvedAddress)}
      </span>
    </div>
  )
}

/**
 * CompactBasename Component - Space-efficient Basename display
 *
 * Optimized for tight spaces like navigation bars, tables, and cards.
 * Shows only the Basename or a very short address format.
 */
export function CompactBasename({
  address,
  className,
  ...props
}: BasenameProps) {
  return (
    <Basename
      address={address}
      className={cn('text-sm', className)}
      showAddressOnFallback={true}
      nameClassName="text-sm font-medium"
      {...props}
    />
  )
}

export default Basename

