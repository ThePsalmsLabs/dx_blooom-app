/**
 * Creator Profile Management Hook - Contract Interaction Layer
 * File: src/hooks/contracts/creator/useCreatorProfileManagement.ts
 * 
 * This hook manages creator profile interactions with the CreatorRegistry smart contract,
 * implementing the previously unused functions: updateSubscriptionPrice and updateProfileData.
 * It follows the platform's established patterns for transaction state management, error handling,
 * and contract interactions using wagmi v2 and viem.
 * 
 * The hook enables creators to:
 * 1. Update their monthly subscription pricing dynamically
 * 2. Update their profile metadata stored on-chain
 * 3. Track transaction status with comprehensive error handling
 * 
 * Integration Notes:
 * - Uses the existing contract configuration system from lib/contracts/config.ts
 * - Follows the ContractWriteResult interface pattern from core.ts
 * - Integrates with TanStack Query for cache invalidation
 * - Provides proper TypeScript types for all operations
 */

import { 
    useWriteContract, 
    useWaitForTransactionReceipt,
    useChainId,
    useAccount
  } from 'wagmi'
  import { useQueryClient } from '@tanstack/react-query'
  import { useCallback, useMemo, useEffect } from 'react'
  import { type Hash, parseUnits } from 'viem'
  
  // Import our foundational layers following existing patterns
  import { getContractConfig } from '@/lib/contracts/config'
  import { CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'
  import { isValidIpfsHash } from '@/lib/utils'
  
/**
   * Creator Profile Update Data Interface
   * 
   * This interface defines the structure for profile data updates. The profileData
   * field typically contains an IPFS hash pointing to a JSON file with detailed
   * creator information like bio, social links, categories, etc.
   */
  export interface CreatorProfileUpdateData {
    readonly profileData: string     // IPFS hash for profile metadata JSON
  }
  
  /**
   * Subscription Price Update Data Interface
   * 
   * This interface handles subscription price updates with proper validation
   * and formatting for the smart contract.
   */
  export interface SubscriptionPriceUpdateData {
    readonly newPriceUSDC: string    // Price in USDC as string (e.g., "9.99")
  }
  
  /**
   * Contract Write Result Interface
   * 
   * This extends the standard contract interaction pattern used throughout
   * the platform to provide consistent transaction state management.
   */
  export interface CreatorProfileManagementResult {
    // Transaction state management
    readonly hash: Hash | undefined
    readonly isLoading: boolean
    readonly isError: boolean
    readonly error: Error | null
    readonly isSuccess: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    
    // Action functions
    readonly updateSubscriptionPrice: (data: SubscriptionPriceUpdateData) => Promise<void>
    readonly updateProfileData: (data: CreatorProfileUpdateData) => Promise<void>
    
    // Utility functions
    readonly reset: () => void
  }
  
  /**
   * Creator Profile Management Hook
   * 
   * This hook provides comprehensive creator profile management functionality,
   * implementing the previously unused contract functions while maintaining
   * the platform's established patterns for error handling and state management.
   * 
   * @returns CreatorProfileManagementResult with all profile management capabilities
   */
  export function useCreatorProfileManagement(): CreatorProfileManagementResult {
    const chainId = useChainId()
    const { address: userAddress } = useAccount()
    const queryClient = useQueryClient()
    
    // Get contract configuration using existing patterns
    const contractConfig = useMemo(() => 
      getContractConfig(chainId, 'CREATOR_REGISTRY'),
      [chainId]
    )
    
    // Set up write contract hook following existing patterns
    const writeResult = useWriteContract()
    
    // Set up transaction confirmation tracking
    const confirmationResult = useWaitForTransactionReceipt({
      hash: writeResult.data,
      query: {
        enabled: !!writeResult.data,
      }
    })
    
    /**
     * Update Subscription Price Function
     * 
     * This function implements the updateSubscriptionPrice contract function,
     * allowing creators to dynamically adjust their monthly subscription pricing.
     * It includes proper validation, price formatting, and error handling.
     * 
     * @param data - SubscriptionPriceUpdateData containing the new price
     */
    const updateSubscriptionPrice = useCallback(async (data: SubscriptionPriceUpdateData): Promise<void> => {
      // Input validation following platform patterns
      if (!userAddress) {
        throw new Error('Wallet connection required')
      }
      
      if (!data.newPriceUSDC || data.newPriceUSDC.trim() === '') {
        throw new Error('Subscription price is required')
      }
      
      // Parse and validate price format
      let priceInWei: bigint
      try {
        // Convert USDC price to wei (6 decimals for USDC)
        priceInWei = parseUnits(data.newPriceUSDC, 6)
      } catch (parseError) {
        throw new Error(`Invalid price format: ${data.newPriceUSDC}`)
      }
      
      // Validate price bounds (these match the contract's MIN/MAX_SUBSCRIPTION_PRICE)
      const minPrice = parseUnits('0.01', 6) // $0.01 minimum
      const maxPrice = parseUnits('1000.00', 6) // $1000 maximum
      
      if (priceInWei < minPrice) {
        throw new Error('Subscription price must be at least $0.01')
      }
      
      if (priceInWei > maxPrice) {
        throw new Error('Subscription price cannot exceed $1000.00')
      }
      
      // Execute contract write following established patterns
      try {
        writeResult.writeContract({
          address: contractConfig.address,
          abi: CREATOR_REGISTRY_ABI,
          functionName: 'updateSubscriptionPrice',
          args: [priceInWei],
        })
      } catch (error) {
        // Ensure consumer sees a thrown error in addition to hook state
        throw error instanceof Error ? error : new Error('Failed to update subscription price')
      }
    }, [writeResult, contractConfig.address, userAddress])
    
    /**
     * Update Profile Data Function
     * 
     * This function implements the updateProfileData contract function,
     * allowing creators to update their profile metadata stored on-chain.
     * The profileData typically contains an IPFS hash pointing to detailed profile information.
     * 
     * @param data - CreatorProfileUpdateData containing the new profile data
     */
    const updateProfileData = useCallback(async (data: CreatorProfileUpdateData): Promise<void> => {
      // Input validation following platform patterns
      if (!userAddress) {
        throw new Error('Wallet connection required')
      }
      
      if (!data.profileData || data.profileData.trim() === '') {
        throw new Error('Profile data is required')
      }
      
      // Normalize and validate IPFS reference (supports CID v0/v1, ipfs:// URIs, and gateway URLs)
      const normalizedProfileData = normalizeAndValidateIpfsReference(data.profileData)
      
      // Execute contract write following established patterns
      try {
        writeResult.writeContract({
          address: contractConfig.address,
          abi: CREATOR_REGISTRY_ABI,
          functionName: 'updateProfileData',
          args: [normalizedProfileData],
        })
      } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to update profile data')
      }
    }, [writeResult, contractConfig.address, userAddress])
    
    /**
     * Cache Invalidation Effect
     * 
     * This effect invalidates relevant queries when transactions are confirmed,
     * ensuring the UI reflects the latest contract state. It follows the patterns
     * established in the core hooks.
     */
    useEffect(() => {
      if (confirmationResult.isSuccess) {
        // Follow core hook pattern: invalidate all readContract queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['readContract'] })
      }
    }, [confirmationResult.isSuccess, queryClient])
    
    /**
     * Reset Function
     * 
     * This function resets the transaction state, useful for error recovery
     * and preparing for new transactions.
     */
    const reset = useCallback(() => {
      writeResult.reset()
    }, [writeResult])
    
    // Return the complete interface following platform patterns
    return {
      // Transaction state management
      hash: writeResult.data,
      isLoading: writeResult.isPending,
      isError: writeResult.isError || confirmationResult.isError,
      error: writeResult.error || confirmationResult.error,
      isSuccess: writeResult.isSuccess,
      isConfirming: confirmationResult.isLoading,
      isConfirmed: confirmationResult.isSuccess,
      
      // Action functions
      updateSubscriptionPrice,
      updateProfileData,
      
      // Utility functions
      reset
    }
  }

  /**
   * Normalize and validate an IPFS reference string.
   * Accepts:
   * - Raw CID v0/v1 (preferred)
   * - ipfs://CID[/path]
   * - Gateway URLs like https://gateway.pinata.cloud/ipfs/CID or https://CID.ipfs.dweb.link
   * Returns the normalized CID string or throws if invalid.
   */
  function normalizeAndValidateIpfsReference(input: string): string {
    const trimmed = input.trim()
    if (trimmed.length === 0) {
      throw new Error('Profile data (IPFS hash) is required')
    }

    // If it's already a valid CID
    if (isValidIpfsHash(trimmed)) {
      return trimmed
    }

    // ipfs://CID or ipfs://CID/path
    if (trimmed.startsWith('ipfs://')) {
      const withoutScheme = trimmed.slice('ipfs://'.length)
      const cidCandidate = withoutScheme.split('/')[0] ?? ''
      if (isValidIpfsHash(cidCandidate)) return cidCandidate
    }

    // URLs with /ipfs/CID(/...)
    try {
      const url = new URL(trimmed)
      // Path-based gateway /ipfs/CID
      const ipfsIndex = url.pathname.indexOf('/ipfs/')
      if (ipfsIndex !== -1) {
        const after = url.pathname.slice(ipfsIndex + '/ipfs/'.length)
        const cidCandidate = after.split('/')[0] ?? ''
        if (isValidIpfsHash(cidCandidate)) return cidCandidate
      }

      // Subdomain gateways: https://<CID>.ipfs.<gateway>
      const hostParts = url.hostname.split('.')
      if (hostParts.length >= 3 && hostParts[1] === 'ipfs') {
        const cidCandidate = hostParts[0]
        if (isValidIpfsHash(cidCandidate)) return cidCandidate
      }
    } catch {
      // Not a URL, fall through
    }

    throw new Error('Invalid IPFS reference. Provide a valid CID (v0/v1), ipfs://CID, or gateway URL containing the CID.')
  }