/**
 * MiniApp Wallet Hook - Native Farcaster + Wagmi Integration
 * File: src/hooks/miniapp/useMiniAppWallet.ts
 * 
 * This hook provides auto-connection and persistent wallet state for MiniApp contexts
 * using only native Farcaster connector + wagmi (no external connectors like Privy).
 * 
 * Key Features:
 * - Auto-connects Farcaster wallet on MiniApp open
 * - Uses wagmi's built-in persistence (localStorage)
 * - State persists across navigation (no remounting)
 * - Simple interface matching web app patterns
 */

'use client'

import { useAccount, useConnect, useDisconnect, useWalletClient, useSignMessage } from 'wagmi'
import { useEffect, useCallback, useState } from 'react'
import type { WalletClient } from 'viem'

export interface MiniAppWalletState {
  readonly isConnected: boolean
  readonly address: string | null
  readonly isConnecting: boolean
  readonly error: string | null
  readonly connect: () => Promise<void>
  readonly disconnect: () => void
  readonly walletClient: WalletClient | null
  readonly signMessage: ((message: string) => Promise<string>) | null
}

/**
 * Detect if we're in a Farcaster MiniApp context
 */
function isFarcasterContext(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check multiple indicators for Farcaster context
  return (
    window.parent !== window || // iframe context
    window.location.search.includes('farcaster=true') ||
    window.location.search.includes('miniApp=true') ||
    navigator.userAgent.includes('Farcaster') ||
    // Check for Farcaster SDK availability
    typeof (window as any).farcaster !== 'undefined'
  )
}

/**
 * MiniApp Wallet Hook - Auto-connection + Persistent State
 */
export function useMiniAppWallet(): MiniAppWalletState {
  // Core wagmi hooks (always call these first)
  const { address, isConnected, isConnecting: wagmiConnecting } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const { signMessageAsync } = useSignMessage()
  
  // Local state for error handling
  const [error, setError] = useState<string | null>(null)
  const [isAutoConnecting, setIsAutoConnecting] = useState(false)
  
  // Combined connecting state
  const isConnecting = wagmiConnecting || isAutoConnecting
  
  // Auto-connect function
  const autoConnect = useCallback(async () => {
    if (isConnected || isConnecting) {
      console.log('🔗 Wallet already connected or connecting, skipping auto-connect')
      return
    }
    
    try {
      setError(null)
      setIsAutoConnecting(true)
      
      // Check if in Farcaster context
      if (!isFarcasterContext()) {
        console.log('🚫 Not in Farcaster context, skipping auto-connect')
        return
      }
      
      console.log('🚀 Starting Farcaster wallet auto-connection...')
      
      // Find Farcaster connector
      const farcasterConnector = connectors.find(connector => 
        connector.id === 'farcasterMiniApp' || 
        connector.name?.toLowerCase().includes('farcaster') ||
        connector.id.toLowerCase().includes('farcaster')
      )
      
      if (!farcasterConnector) {
        throw new Error('Farcaster connector not found')
      }
      
      console.log('🎯 Found Farcaster connector:', farcasterConnector.name || farcasterConnector.id)
      
      // Attempt connection
      await connect({ connector: farcasterConnector })
      
      console.log('✅ Farcaster wallet auto-connection successful')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Auto-connection failed'
      console.warn('⚠️ Farcaster auto-connect failed:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsAutoConnecting(false)
    }
  }, [isConnected, isConnecting, connect, connectors])
  
  // Manual connect function (for retry)
  const manualConnect = useCallback(async () => {
    return autoConnect()
  }, [autoConnect])
  
  // Disconnect function
  const handleDisconnect = useCallback(() => {
    try {
      setError(null)
      disconnect()
      console.log('🔌 Wallet disconnected')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      console.warn('⚠️ Disconnect failed:', errorMessage)
      setError(errorMessage)
    }
  }, [disconnect])
  
  // Sign message function wrapper
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!signMessageAsync) {
      throw new Error('Message signing not available')
    }
    if (!isConnected) {
      throw new Error('Wallet not connected')
    }
    
    try {
      const signature = await signMessageAsync({ message })
      return signature
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Message signing failed'
      throw new Error(`Failed to sign message: ${errorMessage}`)
    }
  }, [signMessageAsync, isConnected])
  
  // Auto-connect on mount (with delay for SDK readiness)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoConnect()
    }, 200) // Short delay to ensure Farcaster SDK is ready
    
    return () => clearTimeout(timer)
  }, [autoConnect])
  
  // Handle wagmi connect errors
  useEffect(() => {
    if (connectError) {
      const errorMessage = connectError.message || 'Connection error'
      console.warn('🚨 Wagmi connection error:', errorMessage)
      setError(errorMessage)
      setIsAutoConnecting(false)
    }
  }, [connectError])
  
  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 MiniApp wallet state:', {
        isConnected,
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
        isConnecting,
        error,
        isFarcasterContext: isFarcasterContext(),
        connectorsCount: connectors.length
      })
    }
  }, [isConnected, address, isConnecting, error, connectors.length])
  
  return {
    isConnected,
    address: address || null,
    isConnecting,
    error,
    connect: manualConnect,
    disconnect: handleDisconnect,
    walletClient: walletClient || null,
    signMessage: (isConnected && !!signMessageAsync) ? signMessage : null
  }
}

/**
 * Simple hook that matches web app useAccount pattern
 * Use this for components that just need to read wallet state
 */
export function useWalletState() {
  const { address, isConnected } = useAccount()
  
  return {
    isConnected,
    address: address || null
  }
}