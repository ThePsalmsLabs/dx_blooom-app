// Contract Configuration System
// This file provides type-safe contract instances and configuration management

import { Address } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { NetworkContractAddresses } from '@/types/contracts'
import { 
  CREATOR_REGISTRY_ABI,
  CONTENT_REGISTRY_ABI,
  PAY_PER_VIEW_ABI,
  SUBSCRIPTION_MANAGER_ABI,
  COMMERCE_PROTOCOL_INTEGRATION_ABI,
  PRICE_ORACLE_ABI
} from './abi'

// ===== NETWORK CONTRACT ADDRESSES =====
// These are the actual deployed contract addresses for each supported network

export const CONTRACT_ADDRESSES: Record<number, NetworkContractAddresses> = {
  // Base Mainnet (Production)
  [base.id]: {
    CREATOR_REGISTRY: (process.env.NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS || '0x') as Address,
    CONTENT_REGISTRY: (process.env.NEXT_PUBLIC_CONTENT_REGISTRY_ADDRESS || '0x') as Address,
    PAY_PER_VIEW: (process.env.NEXT_PUBLIC_PAY_PER_VIEW_ADDRESS || '0x') as Address,
    SUBSCRIPTION_MANAGER: (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS || '0x') as Address,
    COMMERCE_INTEGRATION: (process.env.NEXT_PUBLIC_COMMERCE_INTEGRATION_ADDRESS || '0x') as Address,
    PRICE_ORACLE: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '0x') as Address,
    COMMERCE_PROTOCOL: '0xeADE6bE02d043b3550bE19E960504dbA14A14971' as Address, // Base Mainnet Commerce Protocol
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Base Mainnet USDC
  },
  
  // Base Sepolia (Testnet)
  [baseSepolia.id]: {
    CREATOR_REGISTRY: '0x7a2BDfCf9D5dE4fd299Af7bF1A93514E46560b84' as Address,
    CONTENT_REGISTRY: '0xf4a37B1F3568b200a4ED98675224C0DfF6Ad7444' as Address,
    PAY_PER_VIEW: '0xC042014fAC0Dd156c17b22e06fF964Eb2890A496' as Address,
    SUBSCRIPTION_MANAGER: '0x996A1c47d3Aef5ACb5DE5Ef983c78feF56a1aBF5' as Address,
    COMMERCE_INTEGRATION: '0x7cF35C5426A98304bA073D6b625BDFF01Cd5C715' as Address,
    PRICE_ORACLE: '0x521f25C63FCCD2ff3c30d8B0F73291457d34c476' as Address,
    COMMERCE_PROTOCOL: '0x96A08D8e8631b6dB52Ea0cbd7232d9A85d239147' as Address, // Base Sepolia Commerce Protocol
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // Base Sepolia USDC
  },
} as const

// ===== CONTRACT CONFIGURATION OBJECTS =====
// These provide ready-to-use contract configurations for wagmi hooks

/**
 * Gets contract addresses for the specified chain ID
 * Throws an error if the chain is not supported
 */
export function getContractAddresses(chainId: number): NetworkContractAddresses {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(CONTRACT_ADDRESSES).join(', ')}`)
  }
  
  // Validate that all addresses are properly set
  Object.entries(addresses).forEach(([contractName, address]) => {
    if (!address || address === '0x') {
      throw new Error(`Missing contract address for ${contractName} on chain ${chainId}`)
    }
  })
  
  return addresses
}

/**
 * Type-safe helper to get a specific contract configuration
 * This ensures we always have the correct ABI paired with the right address
 */
export function getContractConfig(chainId: number, contractName: keyof NetworkContractAddresses) {
  const addresses = getContractAddresses(chainId)
  const address = addresses[contractName]
  
  // Return the appropriate ABI for each contract
  switch (contractName) {
    case 'CREATOR_REGISTRY':
      return { address, abi: CREATOR_REGISTRY_ABI } as const
    case 'CONTENT_REGISTRY':
      return { address, abi: CONTENT_REGISTRY_ABI } as const
    case 'PAY_PER_VIEW':
      return { address, abi: PAY_PER_VIEW_ABI } as const
    case 'SUBSCRIPTION_MANAGER':
      return { address, abi: SUBSCRIPTION_MANAGER_ABI } as const
    case 'COMMERCE_INTEGRATION':
      return { address, abi: COMMERCE_PROTOCOL_INTEGRATION_ABI } as const
    case 'PRICE_ORACLE':
      return { address, abi: PRICE_ORACLE_ABI } as const
    default:
      // For external contracts like USDC and Commerce Protocol, we don't have full ABIs
      return { address, abi: [] } as const
  }
}

// ===== PRE-CONFIGURED CONTRACT INSTANCES =====
// These are helper functions that provide commonly used contract configurations

/**
 * Get CreatorRegistry contract configuration for wagmi hooks
 */
export const getCreatorRegistryContract = (chainId: number) => 
  getContractConfig(chainId, 'CREATOR_REGISTRY')

/**
 * Get ContentRegistry contract configuration for wagmi hooks
 */
export const getContentRegistryContract = (chainId: number) => 
  getContractConfig(chainId, 'CONTENT_REGISTRY')

/**
 * Get PayPerView contract configuration for wagmi hooks
 */
export const getPayPerViewContract = (chainId: number) => 
  getContractConfig(chainId, 'PAY_PER_VIEW')

/**
 * Get SubscriptionManager contract configuration for wagmi hooks
 */
export const getSubscriptionManagerContract = (chainId: number) => 
  getContractConfig(chainId, 'SUBSCRIPTION_MANAGER')

/**
 * Get CommerceProtocolIntegration contract configuration for wagmi hooks
 */
export const getCommerceIntegrationContract = (chainId: number) => 
  getContractConfig(chainId, 'COMMERCE_INTEGRATION')

/**
 * Get PriceOracle contract configuration for wagmi hooks
 */
export const getPriceOracleContract = (chainId: number) => 
  getContractConfig(chainId, 'PRICE_ORACLE')

// ===== UTILITY FUNCTIONS =====

/**
 * Check if a chain ID is supported by the platform
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES
}

/**
 * Get the list of all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(CONTRACT_ADDRESSES).map(Number)
}

/**
 * Get human-readable name for a chain ID
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case base.id: return 'Base Mainnet'
    case baseSepolia.id: return 'Base Sepolia'
    default: return `Unknown Chain (${chainId})`
  }
}

/**
 * Check if we're on a testnet
 */
export function isTestnet(chainId: number): boolean {
  return chainId === baseSepolia.id
}

/**
 * Get the block explorer URL for a transaction on the given chain
 */
export function getBlockExplorerUrl(chainId: number): string {
  switch (chainId) {
    case base.id:
      return 'https://basescan.org'
    case baseSepolia.id:
      return 'https://sepolia.basescan.org'
    default:
      return '#'
  }
}

/**
 * Format a transaction hash with a link to the block explorer
 */
export function getTransactionUrl(chainId: number, hash: string): string {
  const baseUrl = getBlockExplorerUrl(chainId)
  return `${baseUrl}/tx/${hash}`
}

/**
 * Format an address with a link to the block explorer
 */
export function getAddressUrl(chainId: number, address: string): string {
  const baseUrl = getBlockExplorerUrl(chainId)
  return `${baseUrl}/address/${address}`
}

// ===== CONSTANTS =====

// USDC has 6 decimal places (not 18 like ETH)
export const USDC_DECIMALS = 6

// Default subscription duration (30 days in seconds)
export const DEFAULT_SUBSCRIPTION_DURATION = BigInt(30 * 24 * 60 * 60)

// Platform fee basis points (100 basis points = 1%)
export const PLATFORM_FEE_BPS = BigInt(250)

// Gas limit estimates for different operations
export const GAS_LIMITS = {
    CREATOR_REGISTRATION: BigInt(150_000),
    CONTENT_REGISTRATION: BigInt(200_000),
    DIRECT_PURCHASE: BigInt(180_000),
    SUBSCRIPTION: BigInt(200_000),
    COMMERCE_PAYMENT: BigInt(300_000),
  } as const

// Content categories mapping for UI display
export const CONTENT_CATEGORY_LABELS = {
  [0]: 'Article',
  [1]: 'Video', 
  [2]: 'Audio',
  [3]: 'Image',
  [4]: 'Document',
  [5]: 'Other',
} as const

// Payment type labels for UI display
export const PAYMENT_TYPE_LABELS = {
  [0]: 'Pay-per-view',
  [1]: 'Subscription',
} as const