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
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'

interface FarcasterAutoWalletResult {
  readonly isConnected: boolean
  readonly address: string | undefined
  readonly isConnecting: boolean
  readonly isInMiniApp: boolean
  readonly error: Error | null
  readonly connect: () => Promise<void>
  readonly disconnect: () => void
}

export function useFarcasterAutoWallet(): FarcasterAutoWalletResult {
  // Get actual wagmi connection state for real-time updates
  const { address: wagmiAddress, isConnected: wagmiConnected, isConnecting: wagmiConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  // Get centralized Farcaster wallet state from app-level provider
  const { farcasterWallet } = useUnifiedMiniApp()

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

  const disconnectWallet = useCallback(() => {
    try {
      console.log('🔗 Farcaster wallet disconnect requested')
      disconnect()
    } catch (err) {
      console.error('❌ Farcaster wallet disconnect failed:', err)
    }
  }, [disconnect])

  // Use wagmi state as the source of truth for connection status
  // This ensures real-time updates when wallet connects/disconnects
  const actuallyConnected = wagmiConnected && Boolean(wagmiAddress)
  const actuallyConnecting = wagmiConnecting || farcasterWallet.isConnecting

  return {
    isConnected: actuallyConnected,
    address: wagmiAddress || farcasterWallet.address,
    isConnecting: actuallyConnecting,
    isInMiniApp: farcasterWallet.isInMiniApp,
    error: farcasterWallet.error,
    connect: connectWallet,
    disconnect: disconnectWallet
  }
}