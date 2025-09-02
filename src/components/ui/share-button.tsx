/**
 * MiniApp Share Button Component
 *
 * A dedicated share button for MiniApp content that integrates with Farcaster
 * and provides clear visual feedback for sharing actions.
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Share2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMiniAppSocial } from '@/hooks/business/miniapp-social'
import { enhancedToast } from '@/lib/utils/toast'

interface ShareButtonProps {
  contentId: bigint
  title: string
  description?: string
  imageUrl?: string
  creatorAddress?: `0x${string}`
  creatorName?: string
  variant?: 'default' | 'compact' | 'ghost'
  className?: string
  onShareSuccess?: () => void
  onShareError?: (error: Error) => void
}

export function ShareButton({
  contentId,
  title,
  description,
  imageUrl,
  creatorAddress,
  creatorName,
  variant = 'default',
  className,
  onShareSuccess,
  onShareError
}: ShareButtonProps) {
  const { canShare, shareContent, sharingState } = useMiniAppSocial()
  const [hasShared, setHasShared] = useState(false)

  const handleShare = useCallback(async () => {
    if (!canShare) {
      enhancedToast.error('Sharing not available in current context')
      return
    }

    try {
      // Handle creator profile sharing vs content sharing
      const isCreatorShare = contentId === BigInt(0) && creatorAddress

      const shareParams = isCreatorShare ? {
        contentId: BigInt(0), // Special ID for creator profiles
        title: title || `Check out creator ${creatorName || 'Unknown'} on @dxbloom!`,
        description: description || `Amazing creator with ${description?.split('•')[0] || 'great content'} on our platform!`,
        creatorAddress,
        creatorName: creatorName || 'Creator',
        customText: `🚀 Check out this amazing creator on @dxbloom! ${description ? `They have ${description.split('•')[0]} and are crushing it!` : 'Join the revolution!'}`
      } : {
        contentId,
        title,
        description,
        imageUrl,
        creatorAddress,
        creatorName,
        customText: `Check out "${title}"${creatorName ? ` by ${creatorName}` : ''} on @dxbloom! Premium content with instant USDC payments 🚀`
      }

      const result = await shareContent(shareParams)

      if (result.success) {
        setHasShared(true)
        enhancedToast.success(isCreatorShare ? 'Creator profile shared!' : 'Content shared successfully!')
        onShareSuccess?.()

        // Reset shared state after 3 seconds
        setTimeout(() => setHasShared(false), 3000)
      } else {
        throw result.error || new Error('Share failed')
      }
    } catch (error) {
      const shareError = error instanceof Error ? error : new Error('Share failed')
      enhancedToast.error('Failed to share')
      onShareError?.(shareError)
    }
  }, [
    canShare,
    shareContent,
    contentId,
    title,
    description,
    imageUrl,
    creatorAddress,
    creatorName,
    onShareSuccess,
    onShareError
  ])

  if (!canShare) {
    return null // Don't show share button if sharing is not available
  }

  const buttonVariants = {
    default: 'bg-purple-600 hover:bg-purple-700 text-white',
    compact: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    ghost: 'text-purple-600 hover:bg-purple-50'
  }

  return (
    <Button
      variant={variant === 'ghost' ? 'ghost' : 'outline'}
      size={variant === 'compact' ? 'sm' : 'default'}
      onClick={handleShare}
      disabled={sharingState.isSharing}
      className={cn(
        buttonVariants[variant],
        'transition-all duration-200',
        sharingState.isSharing && 'cursor-not-allowed',
        hasShared && 'bg-green-600 hover:bg-green-700 text-white',
        className
      )}
    >
      {sharingState.isSharing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Sharing...
        </>
      ) : hasShared ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Shared!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          {variant === 'compact' ? 'Share' : 'Share on Farcaster'}
        </>
      )}
    </Button>
  )
}

export default ShareButton
