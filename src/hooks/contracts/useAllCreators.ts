// src/hooks/contracts/useAllCreators.ts - PROPERLY FIXED WITH CORRECT ABIs
import { useState, useCallback, useEffect } from 'react'
import { useChainId, useReadContract, useReadContracts } from 'wagmi'
import { type Address } from 'viem'
import { getCreatorRegistryContract } from '@/lib/contracts/config'
import { CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'

// ===== CORRECT TYPE DEFINITIONS MATCHING YOUR ABI =====
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
function generateIndices(startIndex: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => startIndex + i)
}

function createAddressContract(contractAddress: Address, index: number) {
  return {
    address: contractAddress,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getCreatorByIndex' as const,
    args: [BigInt(index)]
  }
}

function createProfileContract(contractAddress: Address, creatorAddress: Address) {
  return {
    address: contractAddress,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getCreatorProfile' as const,
    args: [creatorAddress]
  }
}

function isValidAddress(address: unknown): address is Address {
  return typeof address === 'string' && 
         address !== '0x0000000000000000000000000000000000000000' &&
         address.length === 42 &&
         address.startsWith('0x')
}

// FIXED: Proper profile data processing based on your actual ABI
function processProfileData(result: unknown): CreatorProfile | null {
  console.log('🔧 RAW PROFILE DATA:', result)
  
  // Handle case where result might be wrapped in additional layers
  let profileData = result
  
  // Check if result has a nested structure (some wagmi versions do this)
  if (result && typeof result === 'object' && 'result' in result) {
    profileData = (result as any).result
    console.log('🔧 EXTRACTED NESTED RESULT:', profileData)
  }
  
  // The ABI shows getCreatorProfile returns a tuple (which becomes an array in JS)
  if (!profileData || !Array.isArray(profileData)) {
    console.error('❌ Profile data is not an array:', profileData)
    return null
  }

  // Verify we have the correct number of elements according to your ABI
  if (profileData.length < 9) {
    console.error('❌ Profile array too short:', profileData.length, 'Expected 9, got:', profileData)
    return null
  }

  try {
    // According to your ABI, the tuple structure is:
    // [isRegistered, subscriptionPrice, isVerified, totalEarnings, contentCount, subscriberCount, registrationTime, profileData, isSuspended]
    const [
      isRegistered,        // bool
      subscriptionPrice,   // uint256
      isVerified,         // bool  
      totalEarnings,      // uint256
      contentCount,       // uint256
      subscriberCount,    // uint256
      registrationTime,   // uint256
      profileDataString,  // string
      isSuspended         // bool
    ] = profileData

    console.log('🔧 PARSING PROFILE ELEMENTS:', {
      isRegistered,
      subscriptionPrice,
      isVerified,
      totalEarnings,
      contentCount,
      subscriberCount,
      registrationTime,
      profileDataString,
      isSuspended
    })

    const profile: CreatorProfile = {
      isRegistered: Boolean(isRegistered),
      subscriptionPrice: BigInt(subscriptionPrice || 0),
      isVerified: Boolean(isVerified),
      totalEarnings: BigInt(totalEarnings || 0),
      contentCount: BigInt(contentCount || 0),
      subscriberCount: BigInt(subscriberCount || 0),
      registrationTime: BigInt(registrationTime || 0),
      profileData: String(profileDataString || ''),
      isSuspended: Boolean(isSuspended)
    }

    console.log('✅ SUCCESSFULLY PROCESSED PROFILE:', profile)
    return profile
  } catch (error) {
    console.error('❌ ERROR PROCESSING PROFILE:', error, 'Raw data:', profileData)
    return null
  }
}

// ===== MAIN HOOK WITH CORRECT FUNCTION NAMES =====
export function useAllCreators(pageSize: number = 50): AllCreatorsResult {
  const chainId = useChainId()
  
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [creators, setCreators] = useState<CreatorWithAddress[]>([])
  
  const contractAddress = getCreatorRegistryContract(chainId).address

  console.log('🔍 useAllCreators initialized:', {
    chainId,
    contractAddress,
    pageSize,
    currentPage
  })

  // FIXED: Use correct function name from ABI
  const totalCountQuery = useReadContract({
    address: contractAddress,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getTotalCreators', // CORRECTED FUNCTION NAME
    query: {
      enabled: !!contractAddress,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5
    }
  })

  const totalCount = totalCountQuery.data ? Number(totalCountQuery.data) : 0

  console.log('📊 Total count query:', {
    data: totalCountQuery.data,
    isLoading: totalCountQuery.isLoading,
    isError: totalCountQuery.isError,
    error: totalCountQuery.error,
    totalCount
  })

  // Calculate indices for current page
  const startIndex = currentPage * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)
  const currentIndices = generateIndices(startIndex, endIndex - startIndex)

  console.log('📈 Page calculation:', {
    currentPage,
    pageSize,
    startIndex,
    endIndex,
    totalCount,
    currentIndices: currentIndices.length
  })

  // Fetch creator addresses
  const addressQueries = useReadContracts({
    contracts: currentIndices.map(index => 
      createAddressContract(contractAddress, index)
    ),
    query: {
      enabled: !!contractAddress && currentIndices.length > 0,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10
    }
  })

  // Process addresses
  const validAddresses = addressQueries.data
    ?.map(result => result.status === 'success' ? result.result : null)
    .filter(isValidAddress) || []

  console.log('📍 Address queries:', {
    queriesData: addressQueries.data?.length,
    validAddresses: validAddresses.length,
    isLoading: addressQueries.isLoading,
    isError: addressQueries.isError,
    sampleAddresses: validAddresses.slice(0, 3)
  })

  // Fetch profiles
  const profileQueries = useReadContracts({
    contracts: validAddresses.map(address => 
      createProfileContract(contractAddress, address)
    ),
    query: {
      enabled: !!contractAddress && validAddresses.length > 0,
      staleTime: 1000 * 60 * 1,
      gcTime: 1000 * 60 * 5
    }
  })

  console.log('👤 Profile queries:', {
    queriesData: profileQueries.data?.length,
    isLoading: profileQueries.isLoading,
    isError: profileQueries.isError,
    isSuccess: profileQueries.isSuccess
  })

  // ENHANCED: Process profiles with extensive debugging
  useEffect(() => {
    console.log('🔄 Processing creators effect triggered')
    
    if (!profileQueries.data || !profileQueries.isSuccess) {
      console.log('⏳ Profile queries not ready yet')
      return
    }

    console.log('📝 Processing profile data:', {
      profileQueriesLength: profileQueries.data.length,
      validAddressesLength: validAddresses.length,
      rawProfileData: profileQueries.data
    })

    const processedCreators: CreatorWithAddress[] = []

    for (let i = 0; i < profileQueries.data.length; i++) {
      const result = profileQueries.data[i]
      const address = validAddresses[i]

      console.log(`🔍 Processing creator ${i}:`, {
        address,
        resultStatus: result.status,
        rawResult: result.result,
        hasResult: !!result.result
      })

      if (result.status === 'success' && address && result.result) {
        console.log(`📊 RAW PROFILE DATA for ${address}:`, result.result)
        
        const profile = processProfileData(result.result)
        
        if (profile) {
          // LESS RESTRICTIVE: Include all non-suspended creators
          if (!profile.isSuspended) {
            processedCreators.push({
              address,
              profile
            })
            console.log(`✅ ADDED creator ${i}:`, { 
              address, 
              isRegistered: profile.isRegistered, 
              isVerified: profile.isVerified,
              isSuspended: profile.isSuspended
            })
          } else {
            console.log(`⚠️ SKIPPED suspended creator ${i}:`, address)
          }
        } else {
          console.log(`❌ FAILED to process profile for creator ${i}:`, address)
        }
      } else {
        console.log(`❌ FAILED to get profile for creator ${i}:`, {
          address,
          status: result.status,
          error: 'error' in result ? result.error : 'unknown'
        })
      }
    }

    console.log('🎯 FINAL processed creators:', {
      count: processedCreators.length,
      creators: processedCreators.map(c => ({ 
        address: c.address, 
        isRegistered: c.profile.isRegistered,
        isVerified: c.profile.isVerified,
        isSuspended: c.profile.isSuspended
      }))
    })

    setCreators(processedCreators)
  }, [
    profileQueries.isSuccess, 
    profileQueries.data, 
    validAddresses.length
  ])

  // Calculate derived values
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

  // Action handlers
  const loadMore = useCallback((): void => {
    if (hasMore && !isLoading) {
      console.log('📄 Loading more creators, current page:', currentPage)
      setCurrentPage(prevPage => prevPage + 1)
    }
  }, [hasMore, isLoading, currentPage])

  const reset = useCallback((): void => {
    console.log('🔄 Resetting creators')
    setCurrentPage(0)
    setCreators([])
  }, [])

  console.log('📊 useAllCreators final state:', {
    creators: creators.length,
    totalCount,
    currentPage,
    hasMore,
    isLoading,
    isError,
    error: error?.message
  })

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