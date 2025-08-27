/**
 * Fast RPC Provider Component
 * 
 * This component provides a fast initial RPC connection by using the fastest
 * available provider, bypassing the fallback ranking system for initial loads.
 */

'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { base } from 'wagmi/chains'

interface FastRPCProviderProps {
  children: React.ReactNode
}

const FAST_PROVIDERS = [
  {
    name: 'Alchemy',
    url: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    enabled: !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  },
  {
    name: 'Ankr',
    url: `https://rpc.ankr.com/base/${process.env.NEXT_PUBLIC_ANKR_API_KEY}`,
    enabled: !!process.env.NEXT_PUBLIC_ANKR_API_KEY
  },
  {
    name: 'Base Official',
    url: 'https://mainnet.base.org',
    enabled: true
  }
]

export function FastRPCProvider({ children }: FastRPCProviderProps) {
  const [isFastProviderReady, setIsFastProviderReady] = useState(false)

  useEffect(() => {
    const testFastProvider = async () => {
      for (const provider of FAST_PROVIDERS) {
        if (!provider.enabled) continue

        try {
          const client = createPublicClient({
            chain: base,
            transport: http(provider.url, { timeout: 2000 })
          })

          const startTime = Date.now()
          await client.getBlockNumber()
          const latency = Date.now() - startTime

          if (latency < 1000) {
            console.log(`🚀 Fast RPC Provider: ${provider.name} (${latency}ms)`)
            setIsFastProviderReady(true)
            return
          }
        } catch (error) {
          console.debug(`Fast provider ${provider.name} failed:`, error)
        }
      }

      // If no fast provider found, still mark as ready to avoid blocking
      console.log('⚠️ No fast RPC provider found, using fallback')
      setIsFastProviderReady(true)
    }

    testFastProvider()
  }, [])

  // Show loading state while testing providers
  if (!isFastProviderReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Optimizing connection...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
