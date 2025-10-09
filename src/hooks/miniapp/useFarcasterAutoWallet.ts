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

import { useCallback, useMemo, useEffect, useState } from 'react'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'
import { getConnectionState, shouldBeConnected } from '@/lib/wallet/connection-persistence'
import { WalletStateManager, type WalletEvent } from '@/lib/wallet/WalletStateManager'
import { useWalletStateQuery, useConnectionStatusQuery } from '@/hooks/wallet/useWalletQuery'

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
  
  // React Query integration for advanced caching and background refetch
  const { data: queryState, isLoading: queryLoading } = useWalletStateQuery()
  const { data: connectionStatus } = useConnectionStatusQuery()
  
  // Local state for WalletStateManager updates (fallback for when React Query is loading)
  const [managerState, setManagerState] = useState(() => WalletStateManager.getState())
  
  // Listen to WalletStateManager events for real-time updates
  useEffect(() => {
    const handleWalletEvent = (event: WalletEvent) => {
      setManagerState(event.state)
      
      // Log important events for debugging
      if (event.type === 'connected' || event.type === 'disconnected') {
        console.log(`🔔 WalletStateManager event: ${event.type}`, {
          source: event.source,
          address: event.state.address,
          timestamp: new Date(event.timestamp).toISOString()
        })
      }
    }
    
    // Subscribe to all wallet events
    WalletStateManager.on('connected', handleWalletEvent)
    WalletStateManager.on('disconnected', handleWalletEvent)
    WalletStateManager.on('connecting', handleWalletEvent)
    WalletStateManager.on('error', handleWalletEvent)
    WalletStateManager.on('health-check', handleWalletEvent)
    
    // Initial state sync
    setManagerState(WalletStateManager.getState())
    
    return () => {
      WalletStateManager.off('connected', handleWalletEvent)
      WalletStateManager.off('disconnected', handleWalletEvent)
      WalletStateManager.off('connecting', handleWalletEvent)
      WalletStateManager.off('error', handleWalletEvent)
      WalletStateManager.off('health-check', handleWalletEvent)
    }
  }, [])

  const connectWallet = useCallback(async () => {
    try {
      console.log('🔗 Farcaster wallet manual connect requested')
      
      // Update state manager to connecting
      WalletStateManager.updateConnecting(true, 'user')
      
      // Only attempt connection if we're in MiniApp context
      if (!farcasterWallet.isInMiniApp) {
        const error = new Error('Farcaster wallet connection only available in MiniApp context')
        WalletStateManager.updateError(error, 'user')
        throw error
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
        
        // Note: Connection success will be handled by the global account change listener
        // in UnifiedMiniAppProvider, which will update WalletStateManager
        
      } else {
        const error = new Error('Farcaster connector not available')
        WalletStateManager.updateError(error, 'user')
        throw error
      }
    } catch (err) {
      console.error('❌ Farcaster wallet connect failed:', err)
      WalletStateManager.updateError(err as Error, 'user')
      throw err
    }
  }, [farcasterWallet.isInMiniApp, connectors, connect])

  const disconnectWallet = useCallback(() => {
    try {
      console.log('🔗 Farcaster wallet disconnect requested')
      
      // Update state manager first
      WalletStateManager.updateDisconnection('user')
      
      // Then disconnect via wagmi
      disconnect()
    } catch (err) {
      console.error('❌ Farcaster wallet disconnect failed:', err)
      WalletStateManager.updateError(err as Error, 'user')
    }
  }, [disconnect])

  // Optimistic state: Show connected immediately if we have valid persistence data
  const optimisticState = useMemo(() => {
    const storedState = getConnectionState()
    const shouldAutoConnect = shouldBeConnected()
    
    // If we should be connected based on storage but wagmi hasn't connected yet,
    // show optimistic connected state to prevent UI flash
    if (shouldAutoConnect && storedState && !wagmiConnected && !farcasterWallet.isConnecting) {
      console.log('🚀 Showing optimistic wallet state:', storedState.address)
      return {
        isConnected: true,
        address: storedState.address,
        isOptimistic: true
      }
    }
    
    return null
  }, [wagmiConnected, farcasterWallet.isConnecting])

  // Multi-layer state prioritization: React Query → WalletStateManager → Wagmi → Optimistic
  const actuallyConnected = wagmiConnected && Boolean(wagmiAddress)
  const actuallyConnecting = wagmiConnecting || farcasterWallet.isConnecting || (queryState?.isConnecting || managerState.isConnecting)
  
  // Prioritize React Query data (most up-to-date with background refresh), fallback chain
  const displayConnected = actuallyConnected || 
                           (queryState?.isConnected) || 
                           (connectionStatus?.isConnected) || 
                           managerState.isConnected || 
                           (optimisticState?.isConnected === true && !actuallyConnecting)
                           
  const displayAddress = wagmiAddress || 
                         queryState?.address || 
                         connectionStatus?.address || 
                         managerState.address || 
                         farcasterWallet.address || 
                         optimisticState?.address
                         
  const displayError = queryState?.error || managerState.error || farcasterWallet.error

  return {
    isConnected: displayConnected,
    address: displayAddress,
    isConnecting: actuallyConnecting,
    isInMiniApp: farcasterWallet.isInMiniApp,
    error: displayError,
    connect: connectWallet,
    disconnect: disconnectWallet
  }
}