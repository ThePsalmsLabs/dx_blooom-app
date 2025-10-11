/**
 * MiniApp XMTP Signer Implementation
 * File: /src/shared/xmtp/miniapp-signer.ts
 *
 * Production-ready XMTP signer implementation specifically designed for
 * Farcaster miniapp context. Provides proper EOA signer interface
 * required by XMTP SDK with full TypeScript type safety.
 *
 * Features:
 * - Full XMTP Signer interface compliance
 * - Wagmi integration for wallet operations
 * - Farcaster miniapp context detection
 * - Comprehensive error handling
 * - Zero placeholders or fallback logic
 */

'use client'

import { useAccount, useSignMessage } from 'wagmi'
import type { Address } from 'viem'
import type { Signer } from '@xmtp/browser-sdk'

// ================================================
// TYPES & INTERFACES
// ================================================

/**
 * XMTP Signer Interface Implementation
 * Compliant with @xmtp/browser-sdk V3 Signer interface (EOA type)
 * Includes helper method for convenience
 */
export interface MiniAppXMTPSigner {
  readonly type: 'EOA'
  getIdentifier(): Promise<{ identifier: string; identifierKind: 'Ethereum' }>
  signMessage(message: string): Promise<Uint8Array>
  // Helper method for getting address directly
  getAddress(): Promise<string>
}

/**
 * MiniApp Context Detection Result
 */
interface MiniAppContextResult {
  readonly isMiniApp: boolean
  readonly context: 'miniapp' | 'web'
  readonly indicators: {
    readonly pathname: boolean
    readonly iframe: boolean
    readonly userAgent: boolean
    readonly searchParams: boolean
  }
}

/**
 * Wallet State for Signer Operations
 */
interface WalletState {
  readonly isConnected: boolean
  readonly address: Address | undefined
  readonly canSign: boolean
  readonly chainId: number | undefined
}

// ================================================
// CONTEXT DETECTION
// ================================================

/**
 * Detect if we're running in a Farcaster miniapp context
 * Uses multiple indicators for reliable detection
 */
export function detectMiniAppContext(): MiniAppContextResult {
  if (typeof window === 'undefined') {
    return {
      isMiniApp: false,
      context: 'web',
      indicators: {
        pathname: false,
        iframe: false,
        userAgent: false,
        searchParams: false
      }
    }
  }

  const url = new URL(window.location.href)
  const userAgent = navigator.userAgent.toLowerCase()

  const indicators = {
    pathname: url.pathname.startsWith('/mini') || url.pathname.startsWith('/miniapp'),
    iframe: window.parent !== window,
    userAgent: userAgent.includes('farcaster') || userAgent.includes('warpcast'),
    searchParams: url.searchParams.get('miniApp') === 'true' || url.searchParams.get('context') === 'miniapp'
  }

  const isMiniApp = Object.values(indicators).some(Boolean)

  return {
    isMiniApp,
    context: isMiniApp ? 'miniapp' : 'web',
    indicators
  }
}

// ================================================
// WALLET STATE HOOK
// ================================================

/**
 * Hook to get current wallet state for XMTP signer operations
 * Provides real-time wallet connection status and capabilities
 */
export function useWalletStateForXMTP(): WalletState {
  const { address, isConnected, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const canSign = isConnected && Boolean(address) && Boolean(signMessageAsync)

  return {
    isConnected: Boolean(isConnected),
    address: address || undefined,
    canSign,
    chainId
  }
}

// ================================================
// MINIAPP XMTP SIGNER IMPLEMENTATION
// ================================================

/**
 * Create a production-ready XMTP signer from wallet state
 * Implements the complete XMTP Signer interface with proper error handling
 * 
 * Note: Pass wallet state from useMiniAppWallet() to avoid hook violations
 */
export function createMiniAppXMTPSigner(
  address: string,
  signMessage: (message: string) => Promise<string>
): MiniAppXMTPSigner {
  const context = detectMiniAppContext()

  if (!context.isMiniApp) {
    throw new Error('MiniApp XMTP signer can only be used in miniapp context')
  }

  if (!address) {
    throw new Error('Address required to create XMTP signer')
  }

  if (!signMessage) {
    throw new Error('Sign message function required to create XMTP signer')
  }

  return {
    type: 'EOA',

    async getAddress(): Promise<string> {
      return address
    },

    async getIdentifier(): Promise<{ identifier: string; identifierKind: 'Ethereum' }> {
      return {
        identifier: address,
        identifierKind: 'Ethereum'
      }
    },

    async signMessage(message: string): Promise<Uint8Array> {
      try {
        const signature = await signMessage(message)
        
        if (!signature) {
          throw new Error('Signature request was rejected or failed')
        }

        // Convert hex string to Uint8Array as required by V3
        const cleanHex = signature.startsWith('0x') ? signature.slice(2) : signature
        const bytes = new Uint8Array(cleanHex.length / 2)
        for (let i = 0; i < cleanHex.length; i += 2) {
          bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16)
        }

        return bytes
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`XMTP message signing failed: ${error.message}`)
        }
        throw new Error('XMTP message signing failed with unknown error')
      }
    }
  }
}

// ================================================
// SIGNER VALIDATION
// ================================================

/**
 * Validate that the signer is properly configured for XMTP operations
 * Performs comprehensive checks before XMTP client initialization
 */
export function validateMiniAppSigner(signer: MiniAppXMTPSigner): {
  readonly isValid: boolean
  readonly errors: readonly string[]
} {
  const errors: string[] = []

  // Check signer type
  if (signer.type !== 'EOA') {
    errors.push('Signer type must be EOA for miniapp context')
  }

  // Check required methods exist
  if (typeof signer.getAddress !== 'function') {
    errors.push('Signer must implement getAddress method')
  }

  if (typeof signer.getIdentifier !== 'function') {
    errors.push('Signer must implement getIdentifier method')
  }

  if (typeof signer.signMessage !== 'function') {
    errors.push('Signer must implement signMessage method')
  }

  // Check context
  const context = detectMiniAppContext()
  if (!context.isMiniApp) {
    errors.push('Signer can only be used in miniapp context')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ================================================
// SIGNER FACTORY WITH VALIDATION
// ================================================

/**
 * Create and validate a MiniApp XMTP signer
 * Throws descriptive errors if signer cannot be created
 */
export function createValidatedMiniAppXMTPSigner(
  address: string,
  signMessage: (message: string) => Promise<string>
): MiniAppXMTPSigner {
  const signer = createMiniAppXMTPSigner(address, signMessage)
  const validation = validateMiniAppSigner(signer)

  if (!validation.isValid) {
    const errorMessage = `MiniApp XMTP signer validation failed: ${validation.errors.join(', ')}`
    throw new Error(errorMessage)
  }

  return signer
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Check if XMTP signer can be created in current context
 * Useful for conditional rendering and feature detection
 */
export function canCreateXMTPSigner(): boolean {
  try {
    const context = detectMiniAppContext()
    if (!context.isMiniApp) return false

    const walletState = useWalletStateForXMTP()
    return walletState.isConnected && walletState.canSign
  } catch {
    return false
  }
}

/**
 * Get detailed signer readiness information
 * Provides comprehensive status for debugging and user feedback
 */
export function getXMTPSignerReadiness(): {
  readonly canCreate: boolean
  readonly context: MiniAppContextResult
  readonly walletState: WalletState
  readonly blockers: readonly string[]
} {
  const context = detectMiniAppContext()
  const walletState = useWalletStateForXMTP()
  const blockers: string[] = []

  if (!context.isMiniApp) {
    blockers.push('Not in miniapp context')
  }

  if (!walletState.isConnected) {
    blockers.push('Wallet not connected')
  }

  if (!walletState.canSign) {
    blockers.push('Wallet does not support message signing')
  }

  const canCreate = blockers.length === 0

  return {
    canCreate,
    context,
    walletState,
    blockers
  }
}

// ================================================
// EXPORTS
// ================================================

export type {
  MiniAppContextResult,
  WalletState
}
