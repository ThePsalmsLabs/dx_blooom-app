/**
 * Farcaster Auto-Wallet Hook - Pure Centralized State Reader
 * File: src/hooks/miniapp/useFarcasterAutoWallet.ts
 *
 * This hook reads ONLY from the app-level Farcaster wallet state managed by
 * UnifiedMiniAppProvider. Pure Farcaster connection - no fallbacks, no mixed logic.
 *
 * Key Features:
 * - Pure Farcaster wallet state only
 * - Reads from centralized app-level connection
 * - Instant state access (no loading delays)
 * - Consistent behavior across all components
 * - Either Farcaster connection or nothing
 */

'use client'

import { useCallback } from 'react'
import { useConnect } from 'wagmi'
import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'

interface FarcasterAutoWalletResult {
  readonly isConnected: boolean
  readonly address: string | undefined
  readonly isConnecting: boolean
  readonly isInMiniApp: boolean
  readonly error: Error | null
  readonly connect: () => Promise<void>
}

export function useFarcasterAutoWallet(): FarcasterAutoWalletResult {
  // Get centralized Farcaster wallet state - PURE, NO FALLBACKS
  const { farcasterWallet } = useUnifiedMiniApp()
  const { connect, connectors } = useConnect()

  const connectWallet = useCallback(async () => {
    try {
      console.log('🔗 Farcaster wallet manual connect requested')
      
      // Only attempt connection if we're in MiniApp context
      if (!farcasterWallet.isInMiniApp) {
        throw new Error('Farcaster wallet connection only available in MiniApp context')
      }
      
      // Find Farcaster connector only
      const farcasterConnector = connectors.find(connector => 
        connector.id === 'farcasterMiniApp' || 
        connector.name === 'Farcaster Mini App' ||
        connector.id === 'farcaster'
      )
      
      if (farcasterConnector) {
        console.log('🎯 Connecting with Farcaster connector:', farcasterConnector.name)
        await connect({ connector: farcasterConnector })
      } else {
        throw new Error('Farcaster connector not available')
      }
    } catch (err) {
      console.error('❌ Farcaster wallet connect failed:', err)
      throw err
    }
  }, [farcasterWallet.isInMiniApp, connectors, connect])

  return {
    isConnected: farcasterWallet.isConnected,
    address: farcasterWallet.address,
    isConnecting: farcasterWallet.isConnecting,
    isInMiniApp: farcasterWallet.isInMiniApp,
    error: farcasterWallet.error,
    connect: connectWallet
  }
}