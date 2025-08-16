import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useChainId, useReadContract, useReadContracts } from 'wagmi'
import { type Address } from 'viem'
import { getCreatorRegistryContract } from '@/lib/contracts/config'
import { CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'

// Define the creator profile type based on your contract structure
export interface CreatorProfile {
  isRegistered: boolean
  subscriptionPrice: bigint
  isVerified: boolean
  totalEarnings: bigint
  contentCount: bigint
  subscriberCount: bigint
  registrationTime: bigint
  profileData: string
  isSuspended: boolean
}

export interface CreatorWithAddress {
  address: Address
  profile: CreatorProfile
}

export interface AllCreatorsResult {
  creators: CreatorWithAddress[]
  totalCount: number
  currentPage: number
  hasMore: boolean
  isLoading: boolean
  isError: boolean
  error: Error | null
  loadMore: () => void
  reset: () => void
}

export function useAllCreators(pageSize: number = 50): AllCreatorsResult {
  const chainId = useChainId()
  const [currentPage, setCurrentPage] = useState(0)
  const [creators, setCreators] = useState<CreatorWithAddress[]>([])
  
  // Simple contract address - avoid complex memoization
  const contractAddress = getCreatorRegistryContract(chainId).address

  // Step 1: Get total number of creators
  const totalCountQuery = useReadContract({
    address: contractAddress,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getTotalCreators',
    query: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15,
      retry: 3,
    }
  })

  // Step 2: Calculate batch size and indices - simplified
  const totalCount = Number(totalCountQuery.data || 0)
  const maxItems = (currentPage + 1) * pageSize
  const itemsToFetch = Math.min(maxItems, totalCount)
  
  // Step 3: Generate contracts for batch fetching - flattened approach
  const addressContracts = []
  for (let i = 0; i < itemsToFetch; i++) {
    addressContracts.push({
      address: contractAddress,
      abi: CREATOR_REGISTRY_ABI,
      functionName: 'getCreatorByIndex',
      args: [BigInt(i)]
    })
  }

  // Step 4: Batch fetch creator addresses
  const addressQueries = useReadContracts({
    contracts: addressContracts,
    query: {
      enabled: addressContracts.length > 0,
      staleTime: 1000 * 60 * 10,
      retry: 3,
    }
  })

  // Step 5: Process results with simplified dependency tracking
  const addressQuerySuccessFlag = addressQueries.isSuccess
  const addressQueryDataLength = addressQueries.data?.length || 0
  
  useEffect(() => {
    if (!addressQuerySuccessFlag || addressQueryDataLength === 0) {
      setValidAddressesForProfiles([])
      return
    }

    // Extract valid addresses without complex data dependency
    const addressData = addressQueries.data
    if (!addressData) return
    
    const validAddresses: Address[] = []
    for (const result of addressData) {
      if (result.status === 'success' && result.result) {
        validAddresses.push(result.result as Address)
      }
    }

    setValidAddressesForProfiles(validAddresses)
  }, [addressQuerySuccessFlag, addressQueryDataLength])

  // Separate state for addresses ready for profile fetching
  const [validAddressesForProfiles, setValidAddressesForProfiles] = useState<Address[]>([])

  // Step 6: Batch fetch creator profiles - separate query
  const profileQueries = useReadContracts({
    contracts: validAddressesForProfiles.map(address => ({
      address: contractAddress,
      abi: CREATOR_REGISTRY_ABI,
      functionName: 'getCreatorProfile',
      args: [address]
    })),
    query: {
      enabled: validAddressesForProfiles.length > 0,
      staleTime: 1000 * 60 * 5,
      retry: 3,
    }
  })

  // Step 7: Process final results with simplified dependencies
  const profileQuerySuccessFlag = profileQueries.isSuccess
  const profileQueryDataLength = profileQueries.data?.length || 0
  const validAddressesLength = validAddressesForProfiles.length
  
  useEffect(() => {
    if (!profileQuerySuccessFlag || profileQueryDataLength === 0 || validAddressesLength === 0) {
      setCreators([])
      return
    }
    
    // Process without complex data dependency
    const profileData = profileQueries.data
    if (!profileData) return
    
    const result: CreatorWithAddress[] = []
    
    for (let i = 0; i < validAddressesForProfiles.length && i < profileData.length; i++) {
      const profileResult = profileData[i]
      
      if (profileResult?.status === 'success' && profileResult.result) {
        const profile = profileResult.result as CreatorProfile
        
        // Only include active, non-suspended creators
        if (profile.isRegistered && !profile.isSuspended) {
          result.push({
            address: validAddressesForProfiles[i],
            profile
          })
        }
      }
    }
    
    setCreators(result)
  }, [profileQuerySuccessFlag, profileQueryDataLength, validAddressesLength])

  // Calculate pagination info - simplified
  const loadedCount = (currentPage + 1) * pageSize
  const hasMore = loadedCount < totalCount

  // Loading states - simplified
  const isLoading = totalCountQuery.isLoading || addressQueries.isLoading || profileQueries.isLoading
  const isError = totalCountQuery.isError || addressQueries.isError || profileQueries.isError
  const error = totalCountQuery.error || addressQueries.error || profileQueries.error

  // Actions
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasMore, isLoading])

  const reset = useCallback(() => {
    setCurrentPage(0)
    setCreators([])
    setValidAddressesForProfiles([])
  }, [])

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
  }
}