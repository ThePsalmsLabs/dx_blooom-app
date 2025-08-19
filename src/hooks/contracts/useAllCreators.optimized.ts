// src/hooks/contracts/useAllCreators.optimized.ts
import { useState, useCallback, useEffect, useRef } from 'react'
import { useChainId, useReadContract, useReadContracts, usePublicClient } from 'wagmi'
import { type Address } from 'viem'
import { getCreatorRegistryContract } from '@/lib/contracts/config'
import { CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'
import { safeStringify } from '@/lib/utils/bigint-serializer'

// Types remain the same
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
  readonly retryFailed: () => void
}

/**
 * Optimized Batch Configuration
 * Dynamically adjusts based on rate limit responses
 */
class DynamicBatchConfig {
  private currentBatchSize: number = 10 // Start conservative
  private minBatchSize: number = 2
  private maxBatchSize: number = 50
  private successfulRequests: number = 0
  private failedRequests: number = 0

  getBatchSize(): number {
    return this.currentBatchSize
  }

  onSuccess(): void {
    this.successfulRequests++
    this.failedRequests = 0 // Reset failed counter on success

    // Gradually increase batch size after consecutive successes
    if (this.successfulRequests > 3 && this.currentBatchSize < this.maxBatchSize) {
      this.currentBatchSize = Math.min(this.currentBatchSize + 2, this.maxBatchSize)
      console.log(`✅ Increasing batch size to ${this.currentBatchSize}`)
    }
  }

  onRateLimit(): void {
    this.failedRequests++
    this.successfulRequests = 0 // Reset success counter

    // Aggressively reduce batch size on rate limit
    this.currentBatchSize = Math.max(
      Math.floor(this.currentBatchSize * 0.5), 
      this.minBatchSize
    )
    console.warn(`⚠️ Rate limit detected. Reducing batch size to ${this.currentBatchSize}`)
  }

  getDelay(): number {
    // Exponential backoff based on failed requests
    const baseDelay = 200 // 200ms base delay
    return baseDelay * Math.pow(2, Math.min(this.failedRequests, 5))
  }
}

/**
 * Enhanced useAllCreators Hook with Rate Limit Protection
 * 
 * Features:
 * - Dynamic batch sizing based on rate limit feedback
 * - Exponential backoff on failures
 * - Progressive loading with caching
 * - Retry mechanism for failed batches
 */
export function useAllCreators(initialPageSize: number = 20): AllCreatorsResult {
  const chainId = useChainId()
  const publicClient = usePublicClient()
  
  // State management
  const [creators, setCreators] = useState<CreatorWithAddress[]>([])
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [failedBatches, setFailedBatches] = useState<number[]>([])
  
  // Refs for optimization
  const batchConfig = useRef(new DynamicBatchConfig())
  const loadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const contractAddress = getCreatorRegistryContract(chainId).address

  // Step 1: Get total count with retry logic
  const totalCountQuery = useReadContract({
    address: contractAddress,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getTotalCreators',
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000,   // 15 minutes
      retry: 5, // More retries for critical data
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    }
  })

  const totalCount = Number(totalCountQuery.data || 0)

  /**
   * Smart Batch Fetching with Rate Limit Protection
   */
  const fetchCreatorBatch = useCallback(async (
    startIndex: number, 
    endIndex: number
  ): Promise<CreatorWithAddress[]> => {
    const batchSize = batchConfig.current.getBatchSize()
    const results: CreatorWithAddress[] = []
    
    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()
      
      // Process in smaller chunks based on dynamic batch size
      for (let i = startIndex; i < endIndex; i += batchSize) {
        // Check if aborted
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Fetch aborted')
        }

        const chunkEnd = Math.min(i + batchSize, endIndex)
        const indices = Array.from({ length: chunkEnd - i }, (_, idx) => i + idx)
        
        // Add delay between chunks to avoid rate limiting
        if (i > startIndex) {
          const delay = batchConfig.current.getDelay()
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        console.log(`📊 Fetching creators ${i} to ${chunkEnd - 1}...`)

        try {
          // Step 1: Fetch addresses
          const addressCalls = indices.map(index => ({
            address: contractAddress,
            abi: CREATOR_REGISTRY_ABI,
            functionName: 'getCreatorByIndex' as const,
            args: [BigInt(index)]
          }))

          const addressResults = await publicClient!.multicall({
            contracts: addressCalls,
            allowFailure: true, // Don't fail entire batch on single error
          })

          // Extract valid addresses
          const validAddresses: Address[] = []
          addressResults.forEach((result, idx) => {
            if (result.status === 'success' && result.result) {
              validAddresses.push(result.result as Address)
            } else {
              console.warn(`Failed to fetch address at index ${indices[idx]}`)
              setFailedBatches(prev => [...prev, indices[idx]])
            }
          })

          // Step 2: Fetch profiles for valid addresses
          if (validAddresses.length > 0) {
            const profileCalls = validAddresses.map(address => ({
              address: contractAddress,
              abi: CREATOR_REGISTRY_ABI,
              functionName: 'getCreatorProfile' as const,
              args: [address]
            }))

            const profileResults = await publicClient!.multicall({
              contracts: profileCalls,
              allowFailure: true,
            })

            // Process profiles
            profileResults.forEach((result, idx) => {
              if (result.status === 'success' && result.result) {
                const profileData = result.result as any
                results.push({
                  address: validAddresses[idx],
                  profile: {
                    isRegistered: Boolean(profileData[0]),
                    subscriptionPrice: BigInt(profileData[1] || 0),
                    isVerified: Boolean(profileData[2]),
                    totalEarnings: BigInt(profileData[3] || 0),
                    contentCount: BigInt(profileData[4] || 0),
                    subscriberCount: BigInt(profileData[5] || 0),
                    registrationTime: BigInt(profileData[6] || 0),
                    profileData: String(profileData[7] || ''),
                    isSuspended: Boolean(profileData[8])
                  }
                })
              }
            })
          }

          // Mark batch as successful
          batchConfig.current.onSuccess()
          
        } catch (chunkError: any) {
          console.error(`Error fetching chunk ${i}-${chunkEnd}:`, chunkError)
          
          // Check if it's a rate limit error
          if (chunkError?.message?.includes('429') || 
              chunkError?.message?.includes('rate limit')) {
            batchConfig.current.onRateLimit()
            
            // Wait longer before continuing
            await new Promise(resolve => 
              setTimeout(resolve, batchConfig.current.getDelay() * 2)
            )
          } else {
            // Track failed indices for retry
            indices.forEach(idx => 
              setFailedBatches(prev => [...prev, idx])
            )
          }
        }
      }
      
      return results
      
    } finally {
      abortControllerRef.current = null
    }
  }, [contractAddress, publicClient])

  /**
   * Load More Implementation with Protection
   */
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !totalCount) return
    
    loadingRef.current = true
    setIsLoadingMore(true)
    setError(null)

    try {
      const startIndex = currentPage * initialPageSize
      const endIndex = Math.min(startIndex + initialPageSize, totalCount)
      
      const newCreators = await fetchCreatorBatch(startIndex, endIndex)
      
      setCreators(prev => [...prev, ...newCreators])
      setCurrentPage(prev => prev + 1)
      
      console.log(`✅ Loaded ${newCreators.length} creators`)
      
    } catch (err: any) {
      console.error('Failed to load creators:', err)
      setError(err)
    } finally {
      loadingRef.current = false
      setIsLoadingMore(false)
    }
  }, [currentPage, initialPageSize, totalCount, fetchCreatorBatch])

  /**
   * Retry Failed Batches
   */
  const retryFailed = useCallback(async () => {
    if (failedBatches.length === 0) return
    
    console.log(`🔄 Retrying ${failedBatches.length} failed indices...`)
    setIsLoadingMore(true)
    
    try {
      const retryResults = await fetchCreatorBatch(
        Math.min(...failedBatches),
        Math.max(...failedBatches) + 1
      )
      
      setCreators(prev => [...prev, ...retryResults])
      setFailedBatches([]) // Clear failed batches on success
      
    } catch (err: any) {
      console.error('Retry failed:', err)
      setError(err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [failedBatches, fetchCreatorBatch])

  /**
   * Reset Hook State
   */
  const reset = useCallback(() => {
    // Abort any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setCreators([])
    setCurrentPage(0)
    setError(null)
    setFailedBatches([])
    batchConfig.current = new DynamicBatchConfig()
  }, [])

  // Auto-load first batch
  useEffect(() => {
    if (totalCount > 0 && creators.length === 0 && !loadingRef.current) {
      loadMore()
    }
  }, [totalCount]) // Only depend on totalCount to avoid loops

  const hasMore = creators.length < totalCount

  return {
    creators,
    totalCount,
    currentPage,
    hasMore,
    isLoading: totalCountQuery.isLoading || isLoadingMore,
    isError: totalCountQuery.isError || !!error,
    error: totalCountQuery.error || error,
    loadMore,
    reset,
    retryFailed,
  }
}
