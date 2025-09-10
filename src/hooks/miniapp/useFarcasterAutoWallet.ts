/**
 * Farcaster Auto Wallet Connection Hook
 * File: src/hooks/miniapp/useFarcasterAutoWallet.ts
 * 
 * This hook implements the correct Farcaster mini app wallet connection pattern
 * as described in the official documentation. It handles both automatic and 
 * manual wallet connection that should occur when users interact with a Farcaster mini app.
 * 
 * KEY FEATURES:
 * - Automatically attempts wallet connection on mini app load
 * - Provides manual connection using Farcaster connector
 * - Prevents Privy login modal from appearing in mini app context
 * - Uses proper Farcaster connector for seamless authentication
 * - Provides fallback for web contexts
 * - Follows the official Farcaster mini app patterns
 * 
 * FIXES:
 * - connectWallet now actually connects using Farcaster connector instead of returning early
 * - Auto-connect attempts connection with Farcaster connector when available
 * - Prevents fallback to Privy authentication in mini app context
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
        // According to docs: "when a user enters a mini app, if they already have a connected wallet, 
        // the connector will automatically connect to it (e.g., isConnected will be true)"
        if (isConnected && address) {
          console.log('✅ Farcaster mini app: Wallet automatically connected', {
            address: `${address.slice(0, 6)}...${address.slice(-4)}`,
            isConnected,
            source: 'farcaster_auto_connect'
          })
        } else {
          // Try to auto-connect using Farcaster connector
          console.log('⏳ Farcaster mini app: Attempting auto-connect...')
          console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })))
          
          const farcasterConnector = connectors.find(connector => 
            connector.id === 'farcasterMiniApp' || 
            connector.name === 'Farcaster Mini App' ||
            connector.id === 'farcaster'
          )
          
          console.log('🎯 Farcaster connector available:', !!farcasterConnector)
          
          if (farcasterConnector) {
            try {
              console.log('🔗 Attempting auto-connect with Farcaster connector:', farcasterConnector.name)
              await connect({ connector: farcasterConnector })
              console.log('✅ Auto-connect successful')
            } catch (autoConnectError) {
              console.warn('⚠️ Auto-connect failed, user will need to connect manually:', autoConnectError)
              // Don't set error state for auto-connect failures - let user try manual connection
            }
          } else {
            console.warn('⚠️ No Farcaster connector found for auto-connect')
            console.log('📊 Connection status:', {
              isInMiniApp,
              isConnected,
              address,
              connectorsCount: connectors.length,
              farcasterConnectorFound: !!farcasterConnector,
              allConnectorIds: connectors.map(c => c.id),
              allConnectorNames: connectors.map(c => c.name)
            })
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
        console.log('🔗 Manual connect called in Farcaster mini app')
        console.log('📱 Current connection state:', { isConnected, address })
        
        if (!isConnected) {
          // Find the Farcaster connector
          const farcasterConnector = connectors.find(connector => 
            connector.id === 'farcasterMiniApp' || 
            connector.name === 'Farcaster Mini App' ||
            connector.id === 'farcaster'
          )
          
          console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })))
          console.log('🎯 Found Farcaster connector:', !!farcasterConnector)
          
          if (farcasterConnector) {
            console.log('✅ Connecting using Farcaster connector:', farcasterConnector.name)
            await connect({ connector: farcasterConnector })
          } else {
            console.error('❌ No Farcaster connector found in mini app')
            console.error('Available connectors:', connectors.map(c => `${c.id} (${c.name})`))
            
            // Check if we have any wagmi-based connectors as backup
            const wagmiConnector = connectors.find(connector => 
              connector.id !== 'injected' && connector.id !== 'metaMask'
            )
            
            if (wagmiConnector && connectors.length > 0) {
              console.log('🔄 Falling back to available connector:', wagmiConnector.name)
              await connect({ connector: wagmiConnector })
            } else {
              throw new Error('No compatible wallet connectors available for Farcaster mini app. Please ensure you are accessing this from within the Farcaster mobile app with a connected wallet.')
            }
          }
        } else {
          console.log('✅ Wallet already connected in Farcaster mini app')
        }
      } else {
        // In web context, use normal connection flow
        console.log('🌐 Connecting in web context')
        if (connectors.length > 0) {
          // Prefer Farcaster connector if available, otherwise use first connector
          const preferredConnector = connectors.find(connector => 
            connector.id === 'farcasterMiniApp' || 
            connector.name === 'Farcaster Mini App' ||
            connector.id === 'farcaster'
          ) || connectors[0]
          
          console.log('🔗 Using connector:', preferredConnector.name)
          await connect({ connector: preferredConnector })
        } else {
          throw new Error('No wallet connectors available')
        }
      }
    } catch (err) {
      console.error('❌ Wallet connection failed:', err)
      setError(err as Error)
      throw err // Re-throw to allow UI to handle the error
    }
  }, [isInMiniApp, isConnected, address, connectors, connect])

  return {
    isConnected,
    address,
    isConnecting,
    error,
    connect: connectWallet,
    isInMiniApp
  }
}
