import { useReadContract, useReadContracts, useChainId } from 'wagmi'
import { useMemo, useCallback, useState, useEffect } from 'react'
import { type Address } from 'viem'
import { getCreatorRegistryContract } from '@/lib/contracts/config'
import { CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'
import type { Creator } from '@/types/contracts'

interface CreatorListEntry {
  address: Address
  profile: Creator | null
  isLoading: boolean
  error: Error | null
}

interface AllCreatorsResult {
  creators: readonly CreatorListEntry[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
  verifiedCreators: readonly CreatorListEntry[]
  topCreators: readonly CreatorListEntry[]
  loadMore: () => void
  hasMore: boolean
}

// Type for the creator profile result from the contract
interface CreatorProfileResult {
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

/**
 * PRODUCTION Hook to fetch all creators from the CreatorRegistry contract
 * 
 * This implementation properly fetches all creators by:
 * 1. Getting total creator count
 * 2. Batch fetching creator addresses
 * 3. Batch fetching creator profiles
 * 
 * For optimal performance in production, consider using a subgraph.
 */
export function useAllCreators(pageSize: number = 50): AllCreatorsResult {
  const chainId = useChainId()
  const [currentPage, setCurrentPage] = useState(0)
  const [allCreatorAddresses, setAllCreatorAddresses] = useState<Address[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])

  // Step 1: Get total number of creators
  const totalCountQuery = useReadContract({
    address: contractConfig.address,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getTotalCreators',
    query: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15,
      retry: 3,
    }
  })

  // Step 2: Generate contracts for batch fetching creator addresses
  const creatorAddressContracts = useMemo(() => {
    if (!totalCountQuery.data) return []
    const count = Number(totalCountQuery.data)
    const startIndex = currentPage * pageSize
    const endIndex = Math.min(startIndex + pageSize, count)
    
    return Array.from({ length: endIndex - startIndex }, (_, i) => ({
      address: contractConfig.address,
      abi: CREATOR_REGISTRY_ABI,
      functionName: 'getCreatorByIndex',
      args: [BigInt(startIndex + i)]
    }))
  }, [totalCountQuery.data, currentPage, pageSize, contractConfig.address])

  // Step 3: Batch fetch creator addresses
  const addressQueries = useReadContracts({
    contracts: creatorAddressContracts,
    query: {
      enabled: creatorAddressContracts.length > 0,
      staleTime: 1000 * 60 * 10,
      retry: 3,
    }
  })

  // Step 4: Extract addresses and create profile contracts
  const creatorAddresses = useMemo(() => {
    if (!addressQueries.data) return []
    const addresses: Address[] = []
    
    for (const result of addressQueries.data) {
      if (result.status === 'success' && result.result) {
        addresses.push(result.result as Address)
      }
    }
    
    return addresses
  }, [addressQueries.data])

  const profileContracts = useMemo(() => 
    creatorAddresses.map(address => ({
      address: contractConfig.address,
      abi: CREATOR_REGISTRY_ABI,
      functionName: 'getCreatorProfile',
      args: [address]
    })),
    [creatorAddresses, contractConfig.address]
  )

  // Step 5: Batch fetch creator profiles
  const profileQueries = useReadContracts({
    contracts: profileContracts,
    query: {
      enabled: profileContracts.length > 0,
      staleTime: 1000 * 60 * 5,
      retry: 3,
    }
  })

  // Step 6: Combine addresses with profiles and update state
  useEffect(() => {
    if (profileQueries.data && creatorAddresses.length > 0) {
      if (currentPage === 0) {
        setAllCreatorAddresses(creatorAddresses)
      } else {
        setAllCreatorAddresses(prev => [...prev, ...creatorAddresses])
      }
    }
  }, [profileQueries.data, creatorAddresses, currentPage])

  // Step 7: Create the final creators array
  const creators: CreatorListEntry[] = useMemo(() => {
    if (currentPage === 0) {
      return creatorAddresses.map((address, index) => {
        const profileResult = profileQueries.data?.[index]
        
        if (profileResult?.status === 'success' && profileResult.result) {
          const profile = profileResult.result as CreatorProfileResult
          return {
            address,
            profile: {
              isRegistered: profile.isRegistered,
              subscriptionPrice: profile.subscriptionPrice,
              isVerified: profile.isVerified,
              totalEarnings: profile.totalEarnings,
              contentCount: profile.contentCount,
              subscriberCount: profile.subscriberCount,
              registrationTime: profile.registrationTime,
            } as Creator,
            isLoading: profileQueries.isLoading,
            error: null
          }
        }
        
        return {
          address,
          profile: null,
          isLoading: profileQueries.isLoading,
          error: profileResult?.status === 'failure' ? new Error('Failed to load profile') : null
        }
      })
    }
    
    // For subsequent pages, combine with existing data
    return allCreatorAddresses.map((address, index) => {
      const profileResult = profileQueries.data?.[index]
      
      if (profileResult?.status === 'success' && profileResult.result) {
        const profile = profileResult.result as CreatorProfileResult
        return {
          address,
          profile: {
            isRegistered: profile.isRegistered,
            subscriptionPrice: profile.subscriptionPrice,
            isVerified: profile.isVerified,
            totalEarnings: profile.totalEarnings,
            contentCount: profile.contentCount,
            subscriberCount: profile.subscriberCount,
            registrationTime: profile.registrationTime,
          } as Creator,
          isLoading: profileQueries.isLoading,
          error: null
        }
      }
      
      return {
        address,
        profile: null,
        isLoading: profileQueries.isLoading,
        error: profileResult?.status === 'failure' ? new Error('Failed to load profile') : null
      }
    })
  }, [creatorAddresses, profileQueries.data, profileQueries.isLoading, currentPage, allCreatorAddresses])

  const verifiedCreators = useMemo(() => 
    creators.filter(creator => creator.profile?.isVerified), 
    [creators]
  )

  const topCreators = useMemo(() =>
    [...creators]
      .filter(creator => creator.profile)
      .sort((a, b) => 
        Number(b.profile!.totalEarnings) - Number(a.profile!.totalEarnings)
      )
      .slice(0, 10),
    [creators]
  )

  const hasMore = useMemo(() => {
    if (!totalCountQuery.data) return false
    return (currentPage + 1) * pageSize < Number(totalCountQuery.data)
  }, [totalCountQuery.data, currentPage, pageSize])

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      setCurrentPage(prev => prev + 1)
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore])

  const refetch = useCallback(() => {
    setCurrentPage(0)
    setAllCreatorAddresses([])
    totalCountQuery.refetch()
    addressQueries.refetch()
    profileQueries.refetch()
  }, [totalCountQuery, addressQueries, profileQueries])

  return {
    creators,
    totalCount: Number(totalCountQuery.data || 0),
    isLoading: totalCountQuery.isLoading || addressQueries.isLoading || profileQueries.isLoading,
    error: totalCountQuery.error || addressQueries.error || profileQueries.error,
    refetch,
    verifiedCreators,
    topCreators,
    loadMore,
    hasMore
  }
}

/**
 * FUTURE: Graph Integration Hook
 * 
 * This hook will replace the contract-based fetching with subgraph queries
 * for better performance with large creator lists.
 * 
 * Example implementation:
 * 
 * export function useAllCreatorsGraph(): AllCreatorsResult {
 *   const { data, loading, error, refetch } = useQuery(CREATORS_QUERY, {
 *     variables: { first: 1000 },
 *     context: { client: graphClient }
 *   })
 *   
 *   // Transform GraphQL data to CreatorListEntry format
 *   const creators = useMemo(() => 
 *     data?.creators?.map(creator => ({
 *       address: creator.id,
 *       profile: creator,
 *       isLoading: false,
 *       error: null
 *     })) || [], [data]
 *   )
 *   
 *   return {
 *     creators,
 *     totalCount: data?.creators?.length || 0,
 *     isLoading: loading,
 *     error: error || null,
 *     refetch,
 *     verifiedCreators: creators.filter(c => c.profile?.isVerified),
 *     topCreators: creators
 *       .filter(c => c.profile)
 *       .sort((a, b) => Number(b.profile!.totalEarnings) - Number(a.profile!.totalEarnings))
 *       .slice(0, 10)
 *   }
 * }
 */
