// src/lib/web3/client.ts
import { createPublicClient, http, type PublicClient } from 'viem'
import { base, baseSepolia } from 'viem/chains'

/**
 * Shared blockchain client factory to avoid redundant client creation
 * Routes all calls through the configured Alchemy transport
 */

let cachedClient: PublicClient | null = null
let cachedChainId: number | null = null

/**
 * Get a shared public client that uses the same Alchemy configuration
 * This ensures all blockchain reads go through your Alchemy API key
 */
export function getSharedPublicClient(): PublicClient {
  const isProduction = process.env.NODE_ENV === 'production'
  const network = process.env.NETWORK as 'base' | 'base-sepolia' | undefined
  const chain = isProduction || network === 'base' ? base : baseSepolia
  
  // Return cached client if same chain
  if (cachedClient && cachedChainId === chain.id) {
    return cachedClient
  }
  
  // Build Alchemy URL using your API key
  const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  const alchemyUrl = ALCHEMY_API_KEY
    ? (chain.id === base.id
        ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    : undefined
  
  // Create client with Alchemy transport or fallback
  cachedClient = createPublicClient({ chain, transport: http(alchemyUrl || chain.rpcUrls.default.http[0]) }) as unknown as PublicClient
  
  cachedChainId = chain.id
  return cachedClient
}

/**
 * Get blockchain client for specific chain ID
 * Useful when you need to explicitly specify the network
 */
export function getPublicClientForChain(chainId: number): PublicClient {
  const chain = chainId === base.id ? base : baseSepolia
  const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  
  const alchemyUrl = ALCHEMY_API_KEY
    ? (chain.id === base.id
        ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
    : undefined
  
  return createPublicClient({
    chain,
    transport: http(alchemyUrl || chain.rpcUrls.default.http[0])
  }) as unknown as PublicClient
}
