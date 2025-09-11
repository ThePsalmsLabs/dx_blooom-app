/**
 * Wallet Utilities for Mini App
 * File: src/lib/utils/wallet-utils.ts
 * 
 * Common utilities for wallet operations in the mini app context.
 * Used consistently across all pages to avoid duplicate logic.
 */

import { formatAddress } from '@/lib/utils'

/**
 * Format wallet address for display
 */
export function formatWalletAddress(address: string | undefined): string | null {
  if (!address || typeof address !== 'string') return null
  return formatAddress(address as `0x${string}`)
}

/**
 * Check if wallet is properly connected with address
 */
export function isWalletFullyConnected(isConnected: boolean, address: string | undefined): boolean {
  return isConnected && !!address && typeof address === 'string' && address.startsWith('0x')
}

/**
 * Get safe address for contract calls
 */
export function getSafeAddress(address: string | undefined): `0x${string}` | undefined {
  if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
    return undefined
  }
  return address as `0x${string}`
}

/**
 * Check if address is valid Ethereum address
 */
export function isValidEthereumAddress(address: string | undefined): address is `0x${string}` {
  if (!address || typeof address !== 'string') return false
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}