/**
 * Content NFT Promotion Hook
 * 
 * This hook provides a clean interface for integrating NFT promotion functionality
 * with existing content components. It handles the type transformations and
 * provides proper error handling.
 */

import { useCallback, useMemo } from 'react'
import { type Address } from 'viem'
import { useCreatorProfile } from '@/hooks/contracts/core'
import type { Content, ContentWithMetadata } from '@/types/contracts'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

interface UseContentNFTPromotionProps {
  readonly content: Content
  readonly contentId?: bigint
  readonly creatorAddress?: Address
}

interface UseContentNFTPromotionReturn {
  readonly contentWithMetadata: ContentWithMetadata | null
  readonly isReady: boolean
  readonly error: string | null
  readonly canMint: boolean
}

export function useContentNFTPromotion({
  content,
  contentId,
  creatorAddress
}: UseContentNFTPromotionProps): UseContentNFTPromotionReturn {
  
  // Get creator profile if we have a creator address
  const creatorProfileQuery = useCreatorProfile(creatorAddress)
  
  // Transform content to ContentWithMetadata format
  const contentWithMetadata = useMemo((): ContentWithMetadata | null => {
    try {
      // Validate required fields
      if (!content.title || !content.creator) {
        return null
      }
      
      // Generate contentId if not provided
      const effectiveContentId = contentId || BigInt(Date.now())
      
      // Get creator profile or create minimal one
      const creatorProfile = creatorProfileQuery.data || {
        isRegistered: true,
        subscriptionPrice: BigInt(0),
        isVerified: false,
        totalEarnings: BigInt(0),
        contentCount: BigInt(1),
        subscriberCount: BigInt(0),
        registrationTime: content.creationTime
      }
      
      return {
        // Map existing Content fields
        ...content,
        
        // Add required fields for NFT promotion
        contentId: effectiveContentId,
        
        // Format display fields
        formattedPrice: formatCurrency(content.payPerViewPrice, 6),
        relativeTime: formatRelativeTime(content.creationTime),
        
        // Add creator profile
        creatorProfile,
        
        // Add access count (default to 0)
        accessCount: BigInt(0),
        
        // Add tags (empty array as default)
        tags: []
      }
    } catch (error) {
      console.error('Error transforming content for NFT promotion:', error)
      return null
    }
  }, [content, contentId, creatorProfileQuery.data])
  
  // Determine if the component is ready to render
  const isReady = useMemo(() => {
    return contentWithMetadata !== null && 
           (!creatorAddress || creatorProfileQuery.isSuccess || creatorProfileQuery.isError)
  }, [contentWithMetadata, creatorAddress, creatorProfileQuery.isSuccess, creatorProfileQuery.isError])
  
  // Check for errors
  const error = useMemo(() => {
    if (!content.title || !content.creator) {
      return 'Content missing required fields'
    }
    
    if (creatorAddress && creatorProfileQuery.error) {
      return 'Failed to load creator profile'
    }
    
    if (creatorAddress && content.creator.toLowerCase() !== creatorAddress.toLowerCase()) {
      return 'Creator address mismatch'
    }
    
    return null
  }, [content, creatorAddress, creatorProfileQuery.error])
  
  // Determine if content can be minted as NFT
  const canMint = useMemo(() => {
    return isReady && 
           error === null && 
           contentWithMetadata !== null &&
           content.isActive
  }, [isReady, error, contentWithMetadata, content.isActive])
  
  return {
    contentWithMetadata,
    isReady,
    error,
    canMint
  }
}

// Export a helper function for manual transformation
export function transformContentToMetadata(
  content: Content,
  contentId?: bigint,
  creatorProfile?: any
): ContentWithMetadata | null {
  try {
    if (!content.title || !content.creator) {
      return null
    }
    
    const effectiveContentId = contentId || BigInt(Date.now())
    
    return {
      ...content,
      contentId: effectiveContentId,
      formattedPrice: formatCurrency(content.payPerViewPrice, 6),
      relativeTime: formatRelativeTime(content.creationTime),
      creatorProfile: creatorProfile || {
        isRegistered: true,
        subscriptionPrice: BigInt(0),
        isVerified: false,
        totalEarnings: BigInt(0),
        contentCount: BigInt(1),
        subscriberCount: BigInt(0),
        registrationTime: content.creationTime
      },
      accessCount: BigInt(0),
      tags: []
    }
  } catch (error) {
    console.error('Error in transformContentToMetadata:', error)
    return null
  }
}
