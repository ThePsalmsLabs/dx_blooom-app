'use client'

import React from 'react'
import { UnifiedAppProvider } from '@/providers/UnifiedAppProvider'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MiniKitProvider } from '@/components/providers/MiniKitProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { enhancedWagmiConfig, validateRPCConfiguration } from '@/lib/web3/enhanced-wagmi-config'

// Create optimized query client for wagmi
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // Consider data stale after 1 minute
      gcTime: 1000 * 60 * 5,     // Keep in cache for 5 minutes
      retry: 3,                   // Retry failed queries 3 times
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Validate RPC configuration on startup (development only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      validateRPCConfiguration().then(results => {
        console.log('🔧 RPC Configuration Status:', results)
        
        if (results.recommendedActions.length > 0) {
          console.warn('⚠️  RPC Configuration Recommendations:')
          results.recommendedActions.forEach(action => {
            console.warn(`   • ${action}`)
          })
        } else {
          console.log('✅ RPC configuration is optimal')
        }
      })
    }
  }, [])

  return (
    <WagmiProvider config={enhancedWagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          showRecentTransactions={true}
          appInfo={{
            appName: 'Bloom',
            learnMoreUrl: 'https://dxbloom.com/about',
          }}
          coolMode
        >
          <ThemeProvider>
            <MiniKitProvider>
              <UnifiedAppProvider forceContext="web">
                {children}
              </UnifiedAppProvider>
            </MiniKitProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
