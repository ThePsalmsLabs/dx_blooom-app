import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import { http } from 'viem'

// We define which blockchain networks our app supports
// Base mainnet for production, Base Sepolia for testing
const supportedChains = [base, baseSepolia] as const

// This creates the main configuration that tells wagmi how to connect to blockchains
// The metadata helps wallet apps display information about your dApp correctly
export const wagmiConfig = getDefaultConfig({
  appName: 'Onchain Content Platform',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: supportedChains,
  transports: {
    // These are the RPC endpoints that actually communicate with the blockchain
    // Using multiple providers ensures reliability if one goes down
    [base.id]: http('https://base-mainnet.g.alchemy.com/v2/i0MCcYy4Gs4p_LVqLAKr1cwF8dGBiYQi'),
    [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/i0MCcYy4Gs4p_LVqLAKr1cwF8dGBiYQi'),
  },
  ssr: true,
})

// Export the supported chains for use in other parts of the app
export { supportedChains }