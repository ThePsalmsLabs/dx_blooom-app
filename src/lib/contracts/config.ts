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
} from './abis'

import { PROTOCOL_REWARDS_ABI, ZORA_CREATOR_1155_IMPL_ABI, ZORA_CREATOR_1155_FACTORY_ABI, ZORA_FIXED_PRICE_SALE_STRATEGY_ABI } from './abis/zora'
import { ZORA_ADDRESSES } from './addresses/zora'

// ===== NETWORK CONTRACT ADDRESSES =====
// These are the actual deployed contract addresses for each supported network

export const CONTRACT_ADDRESSES: Record<number, NetworkContractAddresses> = {
  // Base Mainnet (Production) - V2 Deployed Contracts
  [base.id]: {
    // V2 Core Payment System
    COMMERCE_PROTOCOL_CORE: (process.env.NEXT_PUBLIC_COMMERCE_PROTOCOL_CORE_ADDRESS || '0x1782B43595Cf41F466ee95CB3B82FeA81B7627BA') as Address,
    COMMERCE_PROTOCOL_PERMIT: (process.env.NEXT_PUBLIC_COMMERCE_PROTOCOL_PERMIT_ADDRESS || '0x02de2006759543a8636dA5c9734d7b958CE316fE') as Address,
    BASE_COMMERCE_INTEGRATION: (process.env.NEXT_PUBLIC_BASE_COMMERCE_INTEGRATION_ADDRESS || '0x60F99A5355b400212C622CF8Dec5F90D6Bab34F7') as Address,
    
    // V2 Manager Contracts
    ADMIN_MANAGER: (process.env.NEXT_PUBLIC_ADMIN_MANAGER_ADDRESS || '0x0cA5e6cecA2F11b0490e1F3E0db34f1687b8Ea26') as Address,
    ACCESS_MANAGER: (process.env.NEXT_PUBLIC_ACCESS_MANAGER_ADDRESS || '0x39b16dF60fd643597b21d21cedb13Af0B21dDa84') as Address,
    VIEW_MANAGER: (process.env.NEXT_PUBLIC_VIEW_MANAGER_ADDRESS || '0x6D56B0C818dB7A00bD82C1e0C2F13D013E7513eB') as Address,
    SIGNATURE_MANAGER: (process.env.NEXT_PUBLIC_SIGNATURE_MANAGER_ADDRESS || '0x217a726Ed7028fE1474D38E3E9900007FEaa3154') as Address,
    REFUND_MANAGER: (process.env.NEXT_PUBLIC_REFUND_MANAGER_ADDRESS || '0x3860CBCf97544E2DCD339Bf8dBbc71b95F530F32') as Address,
    PERMIT_PAYMENT_MANAGER: (process.env.NEXT_PUBLIC_PERMIT_PAYMENT_MANAGER_ADDRESS || '0x6863D1C017D22211216e62B7366156dC827127F6') as Address,
    
    // V2 Rewards System
    REWARDS_TREASURY: (process.env.NEXT_PUBLIC_REWARDS_TREASURY_ADDRESS || '0x7AABd51708c24f07f7F9f65a25C67f9d8fA02D8b') as Address,
    LOYALTY_MANAGER: (process.env.NEXT_PUBLIC_LOYALTY_MANAGER_ADDRESS || '0xA653f0a18d7DbD351bE2C1b55558C920dFCdB0eF') as Address,
    REWARDS_INTEGRATION: (process.env.NEXT_PUBLIC_REWARDS_INTEGRATION_ADDRESS || '0x48CC71cB278e2e1f5267514Ee957B9ccbE65a7Cb') as Address,
    
    // Updated Registry Contracts (V2 Deployed)
    CREATOR_REGISTRY: (process.env.NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS || '0x48817Cbf34AAE5F2f38B276805f2d531c1e44680') as Address,
    CONTENT_REGISTRY: (process.env.NEXT_PUBLIC_CONTENT_REGISTRY_ADDRESS || '0xbEcA3140a295A13844fEbE10DFeeC4592742c5dC') as Address,
    PAY_PER_VIEW: (process.env.NEXT_PUBLIC_PAY_PER_VIEW_ADDRESS || '0x905a75105341F740Af36Becec4534b9869f83f07') as Address,
    SUBSCRIPTION_MANAGER: (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS || '0xdbbA5a3ecde5d74D48f1a1920310eEe9F29f193a') as Address,
    PRICE_ORACLE: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '0x015361C256289932e313833c9C0d44f9fE5655D0') as Address,
    
    // External Protocol Addresses
    COMMERCE_PROTOCOL: '0xeADE6bE02d043b3550bE19E960504dbA14A14971' as Address, // Base Mainnet Commerce Protocol
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Base Mainnet USDC
    
    // Legacy V1 Support (for migration period)
    COMMERCE_INTEGRATION: (process.env.NEXT_PUBLIC_COMMERCE_INTEGRATION_ADDRESS || '0x931601610C9491948e7cEeA2e9Df480162e45409') as Address,
  },
  
  // Base Sepolia (Testnet) - Development/Testing
  [baseSepolia.id]: {
    // V2 Core Payment System (use mainnet addresses for now, update when testnet deployed)
    COMMERCE_PROTOCOL_CORE: (process.env.NEXT_PUBLIC_COMMERCE_PROTOCOL_CORE_ADDRESS || '0x1782B43595Cf41F466ee95CB3B82FeA81B7627BA') as Address,
    COMMERCE_PROTOCOL_PERMIT: (process.env.NEXT_PUBLIC_COMMERCE_PROTOCOL_PERMIT_ADDRESS || '0x02de2006759543a8636dA5c9734d7b958CE316fE') as Address,
    BASE_COMMERCE_INTEGRATION: (process.env.NEXT_PUBLIC_BASE_COMMERCE_INTEGRATION_ADDRESS || '0x60F99A5355b400212C622CF8Dec5F90D6Bab34F7') as Address,
    
    // V2 Manager Contracts
    ADMIN_MANAGER: (process.env.NEXT_PUBLIC_ADMIN_MANAGER_ADDRESS || '0x0cA5e6cecA2F11b0490e1F3E0db34f1687b8Ea26') as Address,
    ACCESS_MANAGER: (process.env.NEXT_PUBLIC_ACCESS_MANAGER_ADDRESS || '0x39b16dF60fd643597b21d21cedb13Af0B21dDa84') as Address,
    VIEW_MANAGER: (process.env.NEXT_PUBLIC_VIEW_MANAGER_ADDRESS || '0x6D56B0C818dB7A00bD82C1e0C2F13D013E7513eB') as Address,
    SIGNATURE_MANAGER: (process.env.NEXT_PUBLIC_SIGNATURE_MANAGER_ADDRESS || '0x217a726Ed7028fE1474D38E3E9900007FEaa3154') as Address,
    REFUND_MANAGER: (process.env.NEXT_PUBLIC_REFUND_MANAGER_ADDRESS || '0x3860CBCf97544E2DCD339Bf8dBbc71b95F530F32') as Address,
    PERMIT_PAYMENT_MANAGER: (process.env.NEXT_PUBLIC_PERMIT_PAYMENT_MANAGER_ADDRESS || '0x6863D1C017D22211216e62B7366156dC827127F6') as Address,
    
    // V2 Rewards System
    REWARDS_TREASURY: (process.env.NEXT_PUBLIC_REWARDS_TREASURY_ADDRESS || '0x7AABd51708c24f07f7F9f65a25C67f9d8fA02D8b') as Address,
    LOYALTY_MANAGER: (process.env.NEXT_PUBLIC_LOYALTY_MANAGER_ADDRESS || '0xA653f0a18d7DbD351bE2C1b55558C920dFCdB0eF') as Address,
    REWARDS_INTEGRATION: (process.env.NEXT_PUBLIC_REWARDS_INTEGRATION_ADDRESS || '0x48CC71cB278e2e1f5267514Ee957B9ccbE65a7Cb') as Address,
    
    // Registry Contracts (V1 testnet addresses for backward compatibility)
    CREATOR_REGISTRY: (process.env.NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS || '0xe94dbb72bdd8604e25a2c7d2cf9bad71f2870d5b') as Address,
    CONTENT_REGISTRY: (process.env.NEXT_PUBLIC_CONTENT_REGISTRY_ADDRESS || '0x981f162aa0d25c660c2658f50904cb3b33afa406') as Address,
    PAY_PER_VIEW: (process.env.NEXT_PUBLIC_PAY_PER_VIEW_ADDRESS || '0x559B0FaF011e95D3B634a88390cD320f186141D0') as Address,
    SUBSCRIPTION_MANAGER: (process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS || '0xeBA8d808105097b3A14Ee7b70716BbDB49798099') as Address,
    PRICE_ORACLE: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '0x02df436c2a4DFd8EFd0FDd791853Be75d1D46431') as Address,
    
    // External Protocol Addresses
    COMMERCE_PROTOCOL: (process.env.NEXT_PUBLIC_COMMERCE_PROTOCOL_ADDRESS || '0x96A08D8e8631b6dB52Ea0cbd7232d9A85d239147') as Address, // Base Sepolia Commerce Protocol
    USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as Address, // Base Sepolia USDC
    
    // Legacy V1 Support
    COMMERCE_INTEGRATION: (process.env.NEXT_PUBLIC_COMMERCE_INTEGRATION_ADDRESS || '0x8cbcD15F39BDAB3a15908d9a730870383ab7cfe3') as Address,
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
      const errorMessage = `Missing contract address for ${contractName} on chain ${chainId}. ` +
        `Please set the environment variable NEXT_PUBLIC_${contractName}_ADDRESS or switch to a supported network.`
      console.error(errorMessage)
      throw new Error(errorMessage)
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



export function getZoraAddresses(chainId: number) {
  const addresses = ZORA_ADDRESSES[chainId as keyof typeof ZORA_ADDRESSES]
  if (!addresses) {
    throw new Error(`Zora Protocol not supported on chain ${chainId}`)
  }
  return addresses
}

export function getZoraFactoryContract(chainId: number) {
  const addresses = getZoraAddresses(chainId)
  return {
    address: addresses.ZORA_CREATOR_1155_FACTORY_IMPL,
    abi: ZORA_CREATOR_1155_FACTORY_ABI
  } as const
}

export function getZoraCreator1155Contract(contractAddress: Address) {
  return {
    address: contractAddress,
    abi: ZORA_CREATOR_1155_IMPL_ABI
  } as const
}

export function getFixedPriceSaleStrategyContract(chainId: number) {
  const addresses = getZoraAddresses(chainId)
  return {
    address: addresses.FIXED_PRICE_SALE_STRATEGY,
    abi: ZORA_FIXED_PRICE_SALE_STRATEGY_ABI
  } as const
}

export function getProtocolRewardsContract(chainId: number) {
  const addresses = getZoraAddresses(chainId)
  return {
    address: addresses.PROTOCOL_REWARDS,
    abi: PROTOCOL_REWARDS_ABI
  } as const
}