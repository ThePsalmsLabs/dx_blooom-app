'use client'

import React from 'react'
import { UnifiedAppProvider } from '@/providers/UnifiedAppProvider'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MiniKitProvider } from '@/components/providers/MiniKitProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/lib/web3/wagmi'

// Create a client
const queryClient = new QueryClient()

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
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
