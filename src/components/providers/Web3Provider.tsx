'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/lib/web3/wagmi'
import '@rainbow-me/rainbowkit/styles.css'

// Create a query client for caching blockchain data
// This prevents unnecessary re-fetching of data that doesn't change often
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache blockchain data for 1 minute by default
      // Contract data doesn't change frequently, so this reduces RPC calls
      staleTime: 1000 * 60,
      // Keep data in cache for 5 minutes even when components unmount
      // This helps when users navigate between pages quickly
      gcTime: 1000 * 60 * 5,
    },
  },
})

interface Web3ProviderProps {
  children: React.ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}