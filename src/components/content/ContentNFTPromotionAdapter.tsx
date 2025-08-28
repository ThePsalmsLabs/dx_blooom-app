/**
 * Content NFT Promotion Adapter
 * 
 * This adapter bridges the type mismatch between your existing Content type
 * and the ContentWithMetadata type expected by ContentNFTPromotion.
 * It provides a seamless integration point for adding NFT minting to existing content.
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Basic usage with Content type:
 * ```tsx
 * <ContentNFTPromotionAdapter
 *   content={contentData} // Your existing Content type
 *   creatorAddress={contentData.creator}
 *   onMintSuccess={(contractAddress, tokenId) => {
 *     console.log('NFT minted successfully!')
 *   }}
 * />
 * ```
 * 
 * 2. With explicit contentId:
 * ```tsx
 * <ContentNFTPromotionAdapter
 *   content={contentData}
 *   creatorAddress={contentData.creator}
 *   contentId={BigInt(123)} // If you have the actual contentId
 *   onMintSuccess={handleMintSuccess}
 * />
 * ```
 * 
 * 3. In a content card:
 * ```tsx
 * function ContentCard({ content }: { content: Content }) {
 *   return (
 *     <Card>
 *       <CardContent>
 *         <h3>{content.title}</h3>
 *         <p>{content.description}</p>
 *         <ContentNFTPromotionAdapter
 *           content={content}
 *           creatorAddress={content.creator}
 *           className="mt-4"
 *         />
 *       </CardContent>
 *     </Card>
 *   )
 * }
 * ```
 */

'use client'

import React from 'react'
import { type Address } from 'viem'
import { ContentNFTPromotion } from './ContentNFTPromotion'
import { useContentNFTPromotion } from '@/hooks/content/useContentNFTPromotion'
import type { Content } from '@/types/contracts'

// Create adapter interface that bridges the types
interface ContentNFTPromotionAdapterProps {
  readonly content: Content  // Your existing content type
  readonly creatorAddress: Address
  readonly className?: string
  readonly onMintSuccess?: (contractAddress: Address, tokenId: bigint) => void
  readonly contentId?: bigint // Optional: if you have the contentId from elsewhere
}

export function ContentNFTPromotionAdapter({
  content,
  creatorAddress,
  className,
  onMintSuccess,
  contentId
}: ContentNFTPromotionAdapterProps) {
  
  // Use the hook to handle type transformation and validation
  const { contentWithMetadata, isReady, error, canMint } = useContentNFTPromotion({
    content,
    contentId,
    creatorAddress
  })

  // Show loading state while hook is processing
  if (!isReady) {
    return null
  }

  // Show error state if there are issues
  if (error) {
    console.warn('ContentNFTPromotionAdapter error:', error)
    return null
  }

  // Don't render if content can't be minted
  if (!canMint || !contentWithMetadata) {
    return null
  }

  return (
    <ContentNFTPromotion
      content={contentWithMetadata}
      creatorAddress={creatorAddress}
      className={className}
      onMintSuccess={onMintSuccess}
    />
  )
}

// Export for easy integration
export default ContentNFTPromotionAdapter
