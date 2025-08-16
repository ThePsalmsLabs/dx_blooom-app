import React, { useState, useCallback, useEffect } from 'react'
import { useChainId, useReadContract, useReadContracts } from 'wagmi'
import { type Address } from 'viem'
import { getCreatorRegistryContract } from '@/lib/contracts/config'
import { CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'

// ===== SIMPLIFIED TYPE DEFINITIONS =====
// These explicit types help TypeScript understand exactly what we're working with

export interface CreatorProfile {
  readonly isRegistered: boolean
  readonly subscriptionPrice: bigint
  readonly isVerified: boolean
  readonly totalEarnings: bigint
  readonly contentCount: bigint
  readonly subscriberCount: bigint
  readonly registrationTime: bigint
  readonly profileData: string
  readonly isSuspended: boolean
}

export interface CreatorWithAddress {
  readonly address: Address
  readonly profile: CreatorProfile
}

// Simplified result interface with clear, explicit types
export interface AllCreatorsResult {
  readonly creators: CreatorWithAddress[]
  readonly totalCount: number
  readonly currentPage: number
  readonly hasMore: boolean
  readonly isLoading: boolean
  readonly isError: boolean
  readonly error: Error | null
  readonly loadMore: () => void
  readonly reset: () => void
}

// ===== UTILITY FUNCTIONS =====
// Extract complex logic into simple, testable functions

/**
 * Generate array of indices for batch fetching
 * This replaces complex memoized calculations with a simple pure function
 */
function generateIndices(startIndex: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => startIndex + i)
}

/**
 * Create contract configuration for fetching creator addresses
 * Simplified contract config generation without complex memoization
 */
function createAddressContract(contractAddress: Address, index: number) {
  return {
    address: contractAddress,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getCreatorByIndex' as const,
    args: [BigInt(index)]
  }
}

/**
 * Create contract configuration for fetching creator profiles
 * Simple, explicit contract generation
 */
function createProfileContract(contractAddress: Address, creatorAddress: Address) {
  return {
    address: contractAddress,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getCreatorProfile' as const,
    args: [creatorAddress]
  }
}

/**
 * Check if address is valid (not zero address)
 * Simple validation function
 */
function isValidAddress(address: unknown): address is Address {
  return typeof address === 'string' && 
         address !== '0x0000000000000000000000000000000000000000' &&
         address.length === 42
}

/**
 * Process creator profile data with error handling
 * Explicit type checking and safe data processing
 */
function processProfileData(result: unknown): CreatorProfile | null {
  // Type guard for profile data
  if (!result || typeof result !== 'object' || !Array.isArray(result)) {
    return null
  }

  try {
    const [
      isRegistered,
      subscriptionPrice,
      isVerified,
      totalEarnings,
      contentCount,
      subscriberCount,
      registrationTime,
      profileData,
      isSuspended
    ] = result

    return {
      isRegistered: Boolean(isRegistered),
      subscriptionPrice: BigInt(subscriptionPrice || 0),
      isVerified: Boolean(isVerified),
      totalEarnings: BigInt(totalEarnings || 0),
      contentCount: BigInt(contentCount || 0),
      subscriberCount: BigInt(subscriberCount || 0),
      registrationTime: BigInt(registrationTime || 0),
      profileData: String(profileData || ''),
      isSuspended: Boolean(isSuspended)
    }
  } catch (error) {
    console.warn('Failed to process creator profile:', error)
    return null
  }
}

// ===== MAIN HOOK =====

export function useAllCreators(pageSize: number = 50): AllCreatorsResult {
  const chainId = useChainId()
  
  // ===== SIMPLE STATE MANAGEMENT =====
  // Use simple, explicit state instead of complex memoized values
  
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [creators, setCreators] = useState<CreatorWithAddress[]>([])
  
  // Get contract address once - simple and cached by React
  const contractAddress = getCreatorRegistryContract(chainId).address

  // ===== STEP 1: GET TOTAL COUNT =====
  // Simple total count query with explicit typing
  
  const totalCountQuery = useReadContract({
    address: contractAddress,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getTotalCreators',
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000,   // 15 minutes  
      retry: 3,
      refetchOnWindowFocus: false
    }
  })

  // Extract total count with explicit type safety
  const totalCount: number = Number(totalCountQuery.data || 0)
  
  // ===== STEP 2: CALCULATE BATCH PARAMETERS =====
  // Simple calculations without complex memoization
  
  const startIndex = 0
  const itemsToFetch = Math.min((currentPage + 1) * pageSize, totalCount)
  const batchIndices = generateIndices(startIndex, itemsToFetch)

  // ===== STEP 3: FETCH CREATOR ADDRESSES =====
  // Generate address contracts simply without complex memoization
  
  const addressContracts = batchIndices.map(index => 
    createAddressContract(contractAddress, index)
  )

  const addressQueries = useReadContracts({
    contracts: addressContracts,
    query: {
      enabled: totalCount > 0 && batchIndices.length > 0,
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: 2
    }
  })

  // ===== STEP 4: PROCESS ADDRESSES =====
  // Extract valid addresses with explicit type checking
  
  const validAddresses: Address[] = []
  
  if (addressQueries.data) {
    for (const result of addressQueries.data) {
      if (result.status === 'success' && isValidAddress(result.result)) {
        validAddresses.push(result.result)
      }
    }
  }

  // ===== STEP 5: FETCH CREATOR PROFILES =====
  // Generate profile contracts simply
  
  const profileContracts = validAddresses.map(address => 
    createProfileContract(contractAddress, address)
  )

  const profileQueries = useReadContracts({
    contracts: profileContracts,
    query: {
      enabled: validAddresses.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000,   // 15 minutes
      retry: 2
    }
  })

  // ===== STEP 6: PROCESS AND UPDATE STATE =====
  // Simple effect with explicit dependencies
  
  useEffect(() => {
    // Early return if no data
    if (!profileQueries.data || !profileQueries.isSuccess) {
      return
    }

    const processedCreators: CreatorWithAddress[] = []

    // Process each profile result
    for (let i = 0; i < profileQueries.data.length; i++) {
      const result = profileQueries.data[i]
      const address = validAddresses[i]

      if (result.status === 'success' && address) {
        const profile = processProfileData(result.result)
        
        if (profile && profile.isRegistered && !profile.isSuspended) {
          processedCreators.push({
            address,
            profile
          })
        }
      }
    }

    setCreators(processedCreators)
  }, [
    profileQueries.isSuccess, 
    profileQueries.data, 
    validAddresses.length
  ]) // Simple, explicit dependencies

  // ===== CALCULATE DERIVED VALUES =====
  // Simple calculations without complex memoization
  
  const loadedCount = (currentPage + 1) * pageSize
  const hasMore = loadedCount < totalCount
  
  const isLoading = totalCountQuery.isLoading || 
                   addressQueries.isLoading || 
                   profileQueries.isLoading

  const isError = totalCountQuery.isError || 
                 addressQueries.isError || 
                 profileQueries.isError

  const error = totalCountQuery.error || 
               addressQueries.error || 
               profileQueries.error

  // ===== ACTION HANDLERS =====
  // Simple callback functions with explicit types
  
  const loadMore = useCallback((): void => {
    if (hasMore && !isLoading) {
      setCurrentPage(prevPage => prevPage + 1)
    }
  }, [hasMore, isLoading])

  const reset = useCallback((): void => {
    setCurrentPage(0)
    setCreators([])
  }, [])

  // ===== RETURN INTERFACE =====
  // Explicit return type matching our interface
  
  return {
    creators,
    totalCount,
    currentPage,
    hasMore,
    isLoading,
    isError,
    error,
    loadMore,
    reset
  } as const
}