'use client'

import React from 'react'
import { UnifiedAppProvider } from '@/providers/UnifiedAppProvider'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MiniKitProvider } from '@/components/providers/MiniKitProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
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
        <ThemeProvider>
          <MiniKitProvider>
            <UnifiedAppProvider forceContext="web">
              {children}
            </UnifiedAppProvider>
          </MiniKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
