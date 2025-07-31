// ==============================================================================
// FARCASTER CONTEXT HOOK WITH AUTHENTICATION INTEGRATION
// File: src/hooks/farcaster/useFarcasterContext.ts
// ==============================================================================

'use client'

import { useState, useEffect, useCallback } from 'react'
import { FarcasterContext } from '../business/workflows'

/**
 * Farcaster Context Hook with strict typing.
 * Only exposes fields defined in FarcasterContext.
 */
export function useFarcasterContext(): FarcasterContext | null {
  const [context, setContext] = useState<FarcasterContext | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Detect MiniApp environment
  const isInMiniApp = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    const url = new URL(window.location.href)
    return (
      url.pathname.startsWith('/mini') ||
      url.pathname.startsWith('/miniapp') ||
      url.searchParams.get('miniApp') === 'true' ||
      document.querySelector('meta[name="fc:frame"]') !== null ||
      document.querySelector('meta[name="fc:miniapp"]') !== null
    )
  }, [])

  useEffect(() => {
    if (!isInMiniApp() || isInitialized) return

    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        await sdk.actions.ready()
        const sdkContext = await sdk.context

        if (sdkContext && sdkContext.client && sdkContext.user) {
          // Map SDK location types to allowed FarcasterContext types
          const allowedLocations = ['cast', 'composer', 'notification', 'profile', 'unknown'] as const
          let location: FarcasterContext['location'] = 'unknown'
          const sdkLocation = sdkContext.location?.type
          if (allowedLocations.includes(sdkLocation as FarcasterContext['location'])) {
            location = sdkLocation as FarcasterContext['location']
          }

          const farcasterContext: FarcasterContext = {
            user: {
              fid: sdkContext.user.fid,
              username: sdkContext.user.username ?? '',
              displayName: sdkContext.user.displayName ?? '',
              pfpUrl: sdkContext.user.pfpUrl ?? '',
            },
            client: {
              name: sdkContext.client.platformType || '',
              version: '1.0.0'
            },
            location
          }
          setContext(farcasterContext)
        }
      } catch (error) {
        setContext(null)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeFarcaster()
  }, [isInMiniApp, isInitialized])

  return context
}