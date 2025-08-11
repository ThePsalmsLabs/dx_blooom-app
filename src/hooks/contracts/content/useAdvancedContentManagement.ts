/**
 * Advanced Content Management Hook - Content Lifecycle Control Layer
 * File: src/hooks/contracts/content/useAdvancedContentManagement.ts
 * 
 * This hook implements sophisticated content management capabilities using previously unused
 * ContentRegistry functions. It transforms the content publishing experience from a static
 * "publish once" model into dynamic content lifecycle management that professional creators need.
 * 
 * The hook enables creators to:
 * 1. Update content pricing dynamically based on demand and performance
 * 2. Toggle content availability (activate/deactivate) without losing purchase history
 * 3. Discover content through categories and tags for better content organization
 * 4. Manage content catalogs with professional tools
 * 
 * Business Impact:
 * - Creators can optimize pricing based on market response
 * - Content can be temporarily removed for updates without data loss
 * - Better content discovery improves platform engagement
 * - Professional content management attracts serious creators
 * 
 * Integration Notes:
 * - Uses your established contract interaction patterns from core.ts
 * - Integrates with ContentRegistry ABI and contract configuration
 * - Follows the same error handling and state management patterns
 * - Provides comprehensive TypeScript typing for all operations
 */

import { 
    useWriteContract, 
    useWaitForTransactionReceipt,
    useChainId,
    useAccount
  } from 'wagmi'
  import { useQueryClient } from '@tanstack/react-query'
  import { useCallback, useMemo, useEffect } from 'react'
  import { type Address, type Hash, parseUnits } from 'viem'
  
  // Import foundational layers following your established patterns
  import { getContractConfig } from '@/lib/contracts/config'
  import { CONTENT_REGISTRY_ABI } from '@/lib/contracts/abis'
  import type { ContentCategory } from '@/types/contracts'
  
  /**
   * Content Update Data Interface
   * 
   * This interface defines the parameters for updating existing content,
   * allowing creators to adjust pricing and availability based on performance data.
   */
  export interface ContentUpdateData {
    readonly contentId: bigint         // ID of content to update
    readonly newPriceUSDC?: string     // New price in USDC (e.g., "4.99") - optional to keep current price
    readonly isActive?: boolean        // Whether content should be available for purchase
  }
  
  /**
   * Content Discovery Filters Interface
   * 
   * This interface provides comprehensive filtering options for content discovery,
   * enabling users to find content through multiple pathways and improving the
   * overall platform experience for both creators and consumers.
   */
  export interface ContentDiscoveryFilters {
    readonly category?: ContentCategory  // Filter by content category
    readonly tags?: readonly string[]    // Filter by content tags
    readonly creator?: Address          // Filter by specific creator
    readonly activeOnly?: boolean       // Only show active content (default: true)
  }
  
  /**
   * Content Management Result Interface
   * 
   * This interface provides the complete content management functionality,
   * combining write operations (updates) with read operations (discovery)
   * in a unified interface that follows your established patterns.
   */
  export interface AdvancedContentManagementResult {
    // Transaction state management (following your core.ts patterns)
    readonly hash: Hash | undefined
    readonly isLoading: boolean
    readonly isError: boolean
    readonly error: Error | null
    readonly isSuccess: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    
    // Content update operations
    readonly updateContent: (data: ContentUpdateData) => Promise<void>
    readonly activateContent: (contentId: bigint) => Promise<void>
    readonly deactivateContent: (contentId: bigint) => Promise<void>
    readonly updateContentPrice: (contentId: bigint, newPriceUSDC: string) => Promise<void>
    
    // Content discovery operations (these use read contracts, so no transaction state)
    readonly getContentByCategory: (category: ContentCategory) => Promise<bigint[]>
    readonly getContentByTag: (tag: string) => Promise<bigint[]>
    readonly getCreatorActiveContent: (creator: Address) => Promise<bigint[]>
    
    // Utility functions
    readonly reset: () => void
  }
  
  /**
   * Advanced Content Management Hook
   * 
   * This hook implements comprehensive content management by leveraging previously unused
   * functions from your ContentRegistry contract. It follows the architectural patterns
   * established in your core hooks while providing the professional content management
   * tools that creators need to optimize their content strategy.
   * 
   * The hook demonstrates how unused contract functions can be systematically integrated
   * to provide significant business value without disrupting existing functionality.
   * 
   * @returns AdvancedContentManagementResult with all content management capabilities
   */
  export function useAdvancedContentManagement(): AdvancedContentManagementResult {
    const chainId = useChainId()
    const { address: userAddress } = useAccount()
    const queryClient = useQueryClient()
    
    // Get contract configuration using your established patterns
    const contractConfig = useMemo(() => 
      getContractConfig(chainId, 'CONTENT_REGISTRY'),
      [chainId]
    )
    
    // Set up write contract hook following your core.ts patterns
    const writeResult = useWriteContract()
    
    // Set up transaction confirmation tracking
    const confirmationResult = useWaitForTransactionReceipt({
      hash: writeResult.data,
      query: {
        enabled: !!writeResult.data,
      }
    })

    // Typed shape for the generic read API used below
    type ContractReadResponse<T> = { data: T }
    
    /**
     * Update Content Function
     * 
     * This implements the updateContent contract function, allowing creators to
     * modify content pricing and availability dynamically. This is crucial for
     * creators who want to optimize their pricing strategy based on market response.
     * 
     * @param data - ContentUpdateData containing the updates to apply
     */
    const updateContent = useCallback(async (data: ContentUpdateData): Promise<void> => {
      // Input validation following your established patterns
      if (!userAddress) {
        throw new Error('Wallet connection required')
      }
      
      if (!data.contentId || data.contentId <= BigInt(0)) {
        throw new Error('Valid content ID is required')
      }
      
      // Determine new price - if not provided, pass 0 to keep current price
      let newPriceInWei: bigint = BigInt(0)
      if (data.newPriceUSDC && data.newPriceUSDC.trim() !== '') {
        try {
          newPriceInWei = parseUnits(data.newPriceUSDC, 6) // USDC has 6 decimals
        } catch (parseError) {
          throw new Error(`Invalid price format: ${data.newPriceUSDC}`)
        }
        
        // Validate price bounds (matching ContentRegistry contract constraints)
        const minPrice = parseUnits('0.01', 6) // $0.01 minimum
        const maxPrice = parseUnits('50.00', 6) // $50.00 maximum
        
        if (newPriceInWei < minPrice) {
          throw new Error('Content price must be at least $0.01')
        }
        
        if (newPriceInWei > maxPrice) {
          throw new Error('Content price cannot exceed $50.00')
        }
      }
      
      // Determine active status - if not provided, default to true
      const isActive = data.isActive !== undefined ? data.isActive : true
      
      // Execute contract write following your established patterns
      writeResult.writeContract({
        address: contractConfig.address,
        abi: CONTENT_REGISTRY_ABI,
        functionName: 'updateContent',
        args: [data.contentId, newPriceInWei, isActive],
      })
    }, [writeResult, contractConfig.address, userAddress])
    
    /**
     * Activate Content Function
     * 
     * This is a convenience function that activates content without changing the price.
     * Useful for content that was temporarily deactivated for updates.
     * 
     * @param contentId - ID of content to activate
     */
    const activateContent = useCallback(async (contentId: bigint): Promise<void> => {
      await updateContent({ contentId, isActive: true })
    }, [updateContent])
    
    /**
     * Deactivate Content Function
     * 
     * This is a convenience function that deactivates content without changing the price.
     * Allows creators to temporarily remove content from sale without losing purchase history.
     * 
     * @param contentId - ID of content to deactivate
     */
    const deactivateContent = useCallback(async (contentId: bigint): Promise<void> => {
      await updateContent({ contentId, isActive: false })
    }, [updateContent])
    
    /**
     * Update Content Price Function
     * 
     * This is a convenience function for price-only updates. Useful for dynamic pricing
     * strategies where creators adjust prices based on demand or performance metrics.
     * 
     * @param contentId - ID of content to update
     * @param newPriceUSDC - New price in USDC format (e.g., "4.99")
     */
    const updateContentPrice = useCallback(async (contentId: bigint, newPriceUSDC: string): Promise<void> => {
      await updateContent({ contentId, newPriceUSDC })
    }, [updateContent])
    
    /**
     * Get Content By Category Function
     * 
     * This implements the getContentByCategory contract function, enabling content
     * discovery through category filtering. Essential for organized content browsing.
     * 
     * @param category - ContentCategory enum value to filter by
     * @returns Promise<bigint[]> - Array of content IDs in the category
     */
      const getContentByCategory = useCallback(async (category: ContentCategory): Promise<bigint[]> => {
      try {
        if (!contractConfig.address) return []
        const res = await fetch('/api/contract/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: contractConfig.address,
            abi: CONTENT_REGISTRY_ABI,
            functionName: 'getContentByCategory',
            args: [category],
            chainId
          })
        })
        const json = await res.json() as ContractReadResponse<readonly (string | number | bigint)[]>
        const raw = Array.isArray(json?.data) ? json.data : []
        return raw.map((v) => (typeof v === 'bigint' ? v : BigInt(typeof v === 'string' ? v : (v as number))))
      } catch (error) {
        console.error('Error fetching content by category:', error)
        throw new Error('Failed to fetch content by category')
      }
    }, [contractConfig.address, chainId])
    
    /**
     * Get Content By Tag Function
     * 
     * This implements the getContentByTag contract function, enabling content
     * discovery through tag-based search. Critical for helping users find specific content.
     * 
     * @param tag - Tag string to search for
     * @returns Promise<bigint[]> - Array of content IDs with the tag
     */
      const getContentByTag = useCallback(async (tag: string): Promise<bigint[]> => {
      if (!tag || tag.trim() === '') {
        return []
      }
      
      try {
        if (!contractConfig.address) return []
        const res = await fetch('/api/contract/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: contractConfig.address,
            abi: CONTENT_REGISTRY_ABI,
            functionName: 'getContentByTag',
            args: [tag.toLowerCase().trim()],
            chainId
          })
        })
        const json = await res.json() as ContractReadResponse<readonly (string | number | bigint)[]>
        const raw = Array.isArray(json?.data) ? json.data : []
        return raw.map((v) => (typeof v === 'bigint' ? v : BigInt(typeof v === 'string' ? v : (v as number))))
      } catch (error) {
        console.error('Error fetching content by tag:', error)
        throw new Error('Failed to fetch content by tag')
      }
    }, [contractConfig.address, chainId])
    
    /**
     * Get Creator Active Content Function
     * 
     * This implements the getCreatorActiveContent contract function, allowing creators
     * to get only their active content for management purposes. More efficient than
     * filtering all content client-side.
     * 
     * @param creator - Creator address to get content for
     * @returns Promise<bigint[]> - Array of active content IDs for the creator
     */
      const getCreatorActiveContent = useCallback(async (creator: Address): Promise<bigint[]> => {
      if (!creator) {
        return []
      }
      
      try {
        if (!contractConfig.address) return []
        const res = await fetch('/api/contract/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: contractConfig.address,
            abi: CONTENT_REGISTRY_ABI,
            functionName: 'getCreatorActiveContent',
            args: [creator],
            chainId
          })
        })
        const json = await res.json() as ContractReadResponse<readonly (string | number | bigint)[]>
        const raw = Array.isArray(json?.data) ? json.data : []
        return raw.map((v) => (typeof v === 'bigint' ? v : BigInt(typeof v === 'string' ? v : (v as number))))
      } catch (error) {
        console.error('Error fetching creator active content:', error)
        throw new Error('Failed to fetch creator active content')
      }
    }, [contractConfig.address, chainId])
    
    /**
     * Cache Invalidation Effect
     * 
     * This effect invalidates relevant queries when content update transactions are confirmed,
     * ensuring the UI reflects the latest contract state. It follows the patterns
     * established in your core hooks for comprehensive cache management.
     */
    useEffect(() => {
      if (confirmationResult.isSuccess && userAddress) {
        // Invalidate all content-related queries to refresh the UI
        queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey.includes('content') ||
            query.queryKey.includes('getContent') ||
            query.queryKey.includes('getCreatorContent') ||
            (query.queryKey.includes('contentById') && query.queryKey.includes(userAddress))
        })
      }
    }, [confirmationResult.isSuccess, queryClient, userAddress])
    
    /**
     * Reset Function
     * 
     * This function resets the transaction state, useful for error recovery
     * and preparing for new transactions. Follows your established patterns.
     */
    const reset = useCallback(() => {
      writeResult.reset()
    }, [writeResult])
    
    // Return the complete interface following your established patterns
    return {
      // Transaction state management (for write operations)
      hash: writeResult.data,
      isLoading: writeResult.isPending,
      isError: writeResult.isError || confirmationResult.isError,
      error: writeResult.error || confirmationResult.error,
      isSuccess: writeResult.isSuccess,
      isConfirming: confirmationResult.isLoading,
      isConfirmed: confirmationResult.isSuccess,
      
      // Content update operations (write operations)
      updateContent,
      activateContent,
      deactivateContent,
      updateContentPrice,
      
      // Content discovery operations (read operations)
      getContentByCategory,
      getContentByTag,
      getCreatorActiveContent,
      
      // Utility functions
      reset
    }
  }