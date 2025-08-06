/**
 * Content Data Retrieval Hook
 * File: src/hooks/contracts/content.ts
 * 
 * This file provides essential content data fetching capabilities that support
 * your payment system. Think of this as the "product catalog" layer that tells
 * your payment components what they're selling.
 * 
 * Why this file is needed:
 * Your payment components need to know content details (title, price, creator)
 * to show users what they're buying and calculate payment amounts. This hook
 * provides that bridge between your ContentRegistry contract and your UI.
 * 
 * How it fits into your architecture:
 * - Extends your existing src/hooks/contracts/core.ts patterns
 * - Used by payment components to display content information
 * - Provides the content price data that payment hooks need for calculations
 * 
 * Educational note:
 * In Web3 applications, we often need to fetch data from multiple contracts
 * to build complete user experiences. This hook demonstrates the pattern of
 * creating focused, single-purpose hooks that other hooks can compose together.
 */

import { useReadContract, useChainId } from 'wagmi'
import { useMemo } from 'react'
import { type Address } from 'viem'
import { getContractAddresses } from '@/lib/contracts/config'

// ===== CONTENT REGISTRY ABI SUBSET =====
// We only include the functions we need for content data retrieval
// This keeps the component lightweight while ensuring type safety

const CONTENT_REGISTRY_ABI = [
  {
    name: 'getContent',
    type: 'function',
    inputs: [{ name: 'contentId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'category', type: 'uint8' },
          { name: 'payPerViewPrice', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'purchaseCount', type: 'uint256' },
          { name: 'tags', type: 'string[]' },
          { name: 'isReported', type: 'bool' },
          { name: 'reportCount', type: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  }
] as const

// ===== CONTENT DATA INTERFACES =====
// These types match your ContentRegistry contract structure

export interface ContentData {
  creator: Address
  ipfsHash: string
  title: string
  description: string
  category: number
  payPerViewPrice: bigint
  isActive: boolean
  createdAt: bigint
  purchaseCount: bigint
  tags: readonly string[]
  isReported: boolean
  reportCount: bigint
}

// ===== CORE CONTENT DATA HOOK =====
/**
 * Content Data Retrieval Hook
 * 
 * This hook fetches complete content information from your ContentRegistry contract.
 * It's designed to be the single source of truth for content data across your application.
 * 
 * Key features:
 * - Automatic caching and refetching based on content changes
 * - Type-safe content data matching your smart contract structure
 * - Optimized for performance with proper query configuration
 * - Error handling for non-existent or invalid content
 * 
 * Usage pattern:
 * This hook should be used by any component that needs to display or process
 * content information. Payment components use it to get pricing data, while
 * display components use it for titles and descriptions.
 */
export function useContentById(contentId: bigint | undefined) {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])

  const result = useReadContract({
    address: contractAddresses.CONTENT_REGISTRY,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getContent',
    args: contentId !== undefined ? [contentId] : undefined,
    query: {
      enabled: contentId !== undefined,
      // Content data rarely changes, so we can cache aggressively
      staleTime: 1000 * 60 * 5, // 5 minutes
      // Keep in cache longer since content is relatively static
      gcTime: 1000 * 60 * 30, // 30 minutes
      // Retry on failure since this is critical data
      retry: 3,
    }
  })

  return {
    data: result.data as ContentData | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

// ===== ACCESS CONTROL HOOK =====
/**
 * Content Access Check Hook
 * 
 * This hook determines whether a user has access to specific content.
 * It's the gatekeeper that your payment system uses to decide whether
 * to show purchase options or grant immediate access.
 * 
 * This hook is essential for:
 * - Showing/hiding purchase buttons based on access status  
 * - Preventing duplicate purchases
 * - Controlling content visibility and access
 * - Providing immediate feedback after successful purchases
 */
export const useContentDetails = useContentById;

export function useHasContentAccess(
  userAddress: Address | undefined, 
  contentId: bigint | undefined
) {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])

  const result = useReadContract({
    address: contractAddresses.PAY_PER_VIEW,
    abi: [
      {
        name: 'hasAccess',
        type: 'function',
        inputs: [
          { name: 'contentId', type: 'uint256' },
          { name: 'user', type: 'address' }
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view'
      }
    ] as const,
    functionName: 'hasAccess',
    args: userAddress && contentId !== undefined ? [contentId, userAddress] : undefined,
    query: {
      enabled: !!userAddress && contentId !== undefined,
      // Access status can change after purchases, but not frequently
      staleTime: 1000 * 60 * 2, // 2 minutes
      // Keep access data in cache for reasonable time
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 3,
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  }
}