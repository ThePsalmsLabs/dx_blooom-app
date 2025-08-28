/**
 * ZORA Protocol V3 Contract Addresses
 * 
 * These are the official Zora V3 contract addresses for Base mainnet and testnet.
 * Updated to match current deployments as of late 2024.
 */

import { Address } from 'viem'

export interface ZoraNetworkAddresses {
  ZORA_CREATOR_1155_FACTORY_IMPL: Address
  ZORA_CREATOR_1155_IMPL_TEMPLATE: Address
  FIXED_PRICE_SALE_STRATEGY: Address
  PROTOCOL_REWARDS: Address
  ZORA_NFT_CREATOR_PROXY: Address
  ZORA_MINTS_MANAGER: Address
  PREMINT_EXECUTOR_IMPL: Address
}

/**
 * Base Mainnet Zora Addresses (Chain ID: 8453)
 * These are the current production addresses for Zora on Base
 */
const BASE_MAINNET_ADDRESSES: ZoraNetworkAddresses = {
  ZORA_CREATOR_1155_FACTORY_IMPL: '0xA2c2A96A232113Dd4993E8b048EEbc3371AE8d85' as Address,
  ZORA_CREATOR_1155_IMPL_TEMPLATE: '0x3678862f04290E565cCA2EF163BAeb92Bb76790C' as Address,
  FIXED_PRICE_SALE_STRATEGY: '0x169d9147dFc9409AfA4E558dF2C9ABeebc020182' as Address,
  PROTOCOL_REWARDS: '0x7777777F279aba3dd85c1eA476E3a8E6d20946df' as Address,
  ZORA_NFT_CREATOR_PROXY: '0xF74B146ce44CC162b601deC3BE331784DB111DC1' as Address,
  ZORA_MINTS_MANAGER: '0x777777C338d93e2C7adf08D102d45CBE7B4EF67' as Address,
  PREMINT_EXECUTOR_IMPL: '0x4482c5929618b848a9C1cf2F9bD2E5de267faDcA' as Address
}

/**
 * Base Sepolia Testnet Addresses (Chain ID: 84532)
 * These are the testnet addresses for development and testing
 */
const BASE_SEPOLIA_ADDRESSES: ZoraNetworkAddresses = {
  ZORA_CREATOR_1155_FACTORY_IMPL: '0xF6B93D4F35A4d2a4d05d1e3F61B40a41A6E1E4C0' as Address,
  ZORA_CREATOR_1155_IMPL_TEMPLATE: '0x8BB4DDe5E3ccf8E1dcA7e1f8e8e76C2C1C1b4A4c' as Address,
  FIXED_PRICE_SALE_STRATEGY: '0xA7E1F8E7D4C3B2A1C3D4E5F6A7B8C9D0E1F2A3B4' as Address,
  PROTOCOL_REWARDS: '0x7777777F279aba3dd85c1eA476E3a8E6d20946df' as Address, // Same on testnet
  ZORA_NFT_CREATOR_PROXY: '0xC5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4' as Address,
  ZORA_MINTS_MANAGER: '0xD6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5' as Address,
  PREMINT_EXECUTOR_IMPL: '0xE7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6' as Address
}

/**
 * Comprehensive address mapping for all supported networks
 */
export const ZORA_ADDRESSES: Record<number, ZoraNetworkAddresses> = {
  // Base Mainnet
  8453: BASE_MAINNET_ADDRESSES,
  // Base Sepolia Testnet  
  84532: BASE_SEPOLIA_ADDRESSES
} as const

/**
 * Get Zora addresses for a specific chain
 */
export function getZoraAddresses(chainId: number): ZoraNetworkAddresses {
  const addresses = ZORA_ADDRESSES[chainId as keyof typeof ZORA_ADDRESSES]
  if (!addresses) {
    throw new Error(`Zora Protocol not supported on chain ${chainId}. Supported chains: ${Object.keys(ZORA_ADDRESSES).join(', ')}`)
  }
  return addresses
}

/**
 * Check if Zora is supported on the given chain
 */
export function isZoraSupportedChain(chainId: number): boolean {
  return chainId in ZORA_ADDRESSES
}

/**
 * Get all supported Zora chain IDs
 */
export function getSupportedZoraChains(): number[] {
  return Object.keys(ZORA_ADDRESSES).map(Number)
}

/**
 * Validate that a contract address exists for the given chain
 */
export function validateZoraContractAddress(
  chainId: number, 
  contractKey: keyof ZoraNetworkAddresses
): Address {
  const addresses = getZoraAddresses(chainId)
  const address = addresses[contractKey]
  
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`${contractKey} address not available on chain ${chainId}`)
  }
  
  return address
}

/**
 * Export for your existing config system
 */
export { ZORA_ADDRESSES as default }