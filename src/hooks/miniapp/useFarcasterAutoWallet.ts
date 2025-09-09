/**
 * Farcaster Auto Wallet Connection Hook
 * File: src/hooks/miniapp/useFarcasterAutoWallet.ts
 * 
 * This hook implements the correct Farcaster mini app wallet connection pattern
 * as described in the official documentation. It handles the automatic wallet
 * connection that should occur when users enter a Farcaster mini app.
 * 
 * KEY FEATURES:
 * - Automatically detects if wallet is already connected (as per Farcaster docs)
 * - Uses Quick Auth for seamless authentication
 * - Provides proper fallback for web contexts
 * - Follows the official Farcaster mini app patterns
 */

import { useCallback, useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

interface FarcasterAutoWalletResult {
  isConnected: boolean
  address: string | undefined
  isConnecting: boolean
  error: Error | null
  connect: () => Promise<void>
  isInMiniApp: boolean
}

/**
 * Hook for automatic wallet connection in Farcaster mini apps
 * 
 * According to Farcaster documentation:
 * - When a user enters a mini app, if they already have a connected wallet,
 *   the connector will automatically connect to it (e.g., isConnected will be true)
 * - We should check for existing connection before prompting manual connection
 * - Quick Auth handles the authentication flow automatically
 */
export function useFarcasterAutoWallet(): FarcasterAutoWalletResult {
  const { isConnected, address, isConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const [error, setError] = useState<Error | null>(null)
  const [isInMiniApp, setIsInMiniApp] = useState(false)

  // Detect if we're in a Farcaster mini app context
  useEffect(() => {
    const checkMiniAppContext = () => {
      if (typeof window === 'undefined') return false

      const url = new URL(window.location.href)
      const isMiniAppPath = url.pathname.startsWith('/mini') || url.pathname.startsWith('/miniapp')
      const hasMiniAppParam = url.searchParams.get('miniApp') === 'true'
      const hasFarcasterMeta = document.querySelector('meta[name="fc:frame"]') !== null || 
                              document.querySelector('meta[name="fc:miniapp"]') !== null
      const isEmbedded = window.parent !== window

      return isMiniAppPath || hasMiniAppParam || hasFarcasterMeta || isEmbedded
    }

    setIsInMiniApp(checkMiniAppContext())
  }, [])

  // Auto-connect logic for Farcaster mini app context
  useEffect(() => {
    if (!isInMiniApp) return

    const autoConnect = async () => {
      try {
        // Wait for SDK to be ready to avoid initialization conflicts
        const checkSDKReady = async () => {
          let attempts = 0
          const maxAttempts = 10
          
          while (attempts < maxAttempts) {
            try {
              const { sdk } = await import('@farcaster/miniapp-sdk')
              // Check if SDK is available and initialized
              if (sdk && typeof sdk === 'object') {
                console.log('✅ Farcaster SDK is available, proceeding with auto-connect')
                return true
              }
            } catch (e) {
              console.warn('SDK not ready yet, waiting...', e)
            }
            
            attempts++
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          
          console.warn('⚠️ SDK ready check timed out, proceeding anyway')
          return false
        }

        await checkSDKReady()

        // In Farcaster mini app, the wallet should be automatically connected
        // We just need to check if it's connected and log the status
        if (isConnected && address) {
          console.log('✅ Farcaster mini app: Wallet automatically connected', {
            address: `${address.slice(0, 6)}...${address.slice(-4)}`,
            isConnected,
            source: 'auto_detection'
          })
        } else {
          console.log('⚠️ Farcaster mini app: Wallet not automatically connected, attempting manual connection')
          
          // Find the Farcaster mini app connector
          const farcasterConnector = connectors.find(connector => 
            connector.id === 'farcasterMiniApp' || 
            connector.name === 'Farcaster Mini App'
          )

          console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })))
          console.log('🎯 Farcaster connector found:', !!farcasterConnector)

          if (farcasterConnector) {
            console.log('🚀 Attempting Farcaster connector connection...')
            await connect({ connector: farcasterConnector })
          } else {
            console.warn('❌ Farcaster mini app connector not found in available connectors')
          }
        }
      } catch (err) {
        console.error('❌ Auto-connect failed:', err)
        setError(err as Error)
      }
    }

    // Wait a bit longer to ensure providers are fully initialized
    const timeoutId = setTimeout(autoConnect, 500)
    return () => clearTimeout(timeoutId)
  }, [isInMiniApp, isConnected, address, connectors, connect])

  const connectWallet = useCallback(async () => {
    try {
      setError(null)

      if (isInMiniApp) {
        // In mini app context, find the Farcaster connector
        const farcasterConnector = connectors.find(connector => 
          connector.id === 'farcasterMiniApp' || 
          connector.name === 'Farcaster Mini App'
        )
        console.log('farcasterConnector', farcasterConnector)

        if (farcasterConnector) {
          await connect({ connector: farcasterConnector })
        } else {
          throw new Error('Farcaster mini app connector not available')
        }
      } else {
        // In web context, use the first available connector
        if (connectors.length > 0) {
          await connect({ connector: connectors[0] })
        } else {
          throw new Error('No wallet connectors available')
        }
      }
    } catch (err) {
      console.error('Manual wallet connection failed:', err)
      setError(err as Error)
    }
  }, [isInMiniApp, connectors, connect])

  return {
    isConnected,
    address,
    isConnecting,
    error,
    connect: connectWallet,
    isInMiniApp
  }
}
