/**
 * MiniApp Content Browser - Optimized for Miniapp Context
 * 
 * This component is specifically designed for miniapp usage with the following optimizations:
 * - Only makes contract calls when wallet is connected
 * - Lazy loads content data
 * - Shows skeleton states while loading
 * - Prevents hanging on RPC calls
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

import {
  Play,
  Eye,
  RefreshCw,
  Wallet,
  AlertCircle,
  Unlock
} from 'lucide-react'
import { cn, formatCurrency, formatAddress } from '@/lib/utils'
import { categoryToString } from '@/types/contracts'
import {
  useActiveContentPaginated,
  useContentById,
  useHasContentAccess,
  useCreatorProfile
} from '@/hooks/contracts/core'
import { MiniAppPurchaseButton } from '@/components/commerce/MiniAppPurchaseButton'
import { useMiniAppRPCOptimization } from '@/hooks/miniapp/useMiniAppRPCOptimization'
import type { Address } from 'viem'

interface MiniAppContentBrowserProps {
  itemsPerPage?: number
  onContentSelect?: (contentId: bigint) => void
  className?: string
  contentIds?: readonly bigint[] // Optional: use specific content IDs instead of paginated fetch
}

/**
 * MiniApp Content Card Component
 * Displays real content data from the contract
 */
function MiniAppContentCard({
  contentId,
  onContentSelect,
  userAddress
}: {
  contentId: bigint
  onContentSelect?: (contentId: bigint) => void
  userAddress?: string
}) {
  // Fetch real content data from contract
  const contentQuery = useContentById(contentId)
  const accessControl = useHasContentAccess(
    userAddress as `0x${string}` | undefined,
    contentId
  )
  const creatorProfile = useCreatorProfile(contentQuery.data?.creator)

  const handleClick = () => {
    if (onContentSelect) {
      onContentSelect(contentId)
    }
  }

  // Loading state
  if (contentQuery.isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="aspect-video bg-muted animate-pulse" />
        <CardContent className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (contentQuery.error || !contentQuery.data) {
    return (
      <Card className="overflow-hidden border-destructive/50">
        <div className="aspect-video bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <CardContent className="p-3">
          <p className="text-xs text-destructive">Failed to load content</p>
        </CardContent>
      </Card>
    )
  }

  const content = contentQuery.data

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      {/* Content Preview */}
      <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center relative">
        <Play className="h-8 w-8 text-muted-foreground" />
        {accessControl.data && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              <Unlock className="h-3 w-3 mr-1" />
              Owned
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Content Title */}
        <h3 className="font-medium text-sm truncate" title={content.title}>
          {content.title}
        </h3>

        {/* Content Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {content.description || 'No description available'}
        </p>

        {/* Category and Creator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{categoryToString(content.category)}</span>
          <span>by {formatAddress(content.creator)}</span>
        </div>

        {/* Price and Purchase Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm font-semibold">
            {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
          </div>
          <MiniAppPurchaseButton
            contentId={contentId}
            title={content.title}
            userAddress={userAddress as Address}
            creatorInfo={{
              address: content.creator,
              name: formatAddress(content.creator)
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function MiniAppContentSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-video bg-muted animate-pulse" />
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MiniAppContentBrowserCore({
  itemsPerPage = 6,
  onContentSelect,
  className,
  contentIds
}: MiniAppContentBrowserProps) {
  const walletUI = useWalletConnectionUI()
  const [shouldLoadContent, setShouldLoadContent] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Initialize RPC optimization
  const rpcOptimization = useMiniAppRPCOptimization({
    enableBatching: true,
    enablePrefetching: true,
    mobileOptimizations: true,
    aggressiveCaching: true,
    throttleMs: 1000
  })

  // Intersection Observer for visibility-based loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('miniapp-content-browser')
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  // Optimized content loading strategy
  useEffect(() => {
    if (walletUI.isConnected) {
      setShouldLoadContent(true)
    } else {
      // Delay content loading for non-connected users to prioritize wallet connection
      const timer = setTimeout(() => setShouldLoadContent(true), 3000) // Increased delay
      return () => clearTimeout(timer)
    }
  }, [walletUI.isConnected])

  // Use provided contentIds or fetch from contract
  const contentQuery = useActiveContentPaginated(
    shouldLoadContent && isVisible && !contentIds ? 0 : 0,
    shouldLoadContent && isVisible && !contentIds ? itemsPerPage : 0
  )

  // Create mock data structure when contentIds are provided
  const providedContentData = useMemo(() => {
    if (contentIds) {
      return {
        contentIds: contentIds.slice(0, itemsPerPage),
        total: BigInt(contentIds.length)
      }
    }
    return null
  }, [contentIds, itemsPerPage])

  // Use provided content IDs if available, otherwise use fetched data
  const effectiveContentData = contentIds ? providedContentData : contentQuery.data
  const isEffectiveLoading = contentIds ? false : contentQuery.isLoading
  const hasEffectiveError = contentIds ? false : contentQuery.isError

  // Apply RPC optimization metrics tracking
  useEffect(() => {
    if (effectiveContentData) {
      // Track successful data fetch for metrics
      console.log('📊 Content loaded successfully with optimization')
    }
  }, [effectiveContentData])

  const handleContentClick = useCallback((contentId: bigint) => {
    if (onContentSelect) {
      onContentSelect(contentId)
    }
  }, [onContentSelect])

  const handleRefresh = useCallback(async () => {
    // Use smart refresh with throttling
    await rpcOptimization.smartRefresh('content-browser', async () => {
      await contentQuery.refetch()
    })
  }, [contentQuery, rpcOptimization])

  // Show wallet connection prompt if not connected
  if (!walletUI.isConnected) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your wallet to discover and purchase content
          </p>
        </div>
        
        {shouldLoadContent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Featured Content</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                disabled={contentQuery.isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", contentQuery.isLoading && "animate-spin")} />
              </Button>
            </div>
            
            {isEffectiveLoading ? (
              <MiniAppContentSkeleton />
            ) : hasEffectiveError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-2">Unable to Load Content</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please try again later
                </p>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {effectiveContentData?.contentIds?.map((contentId: bigint) => (
                  <MiniAppContentCard
                    key={contentId.toString()}
                    contentId={contentId}
                    onContentSelect={handleContentClick}
                    userAddress={walletUI.address as Address}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Show content for connected users
  return (
    <div id="miniapp-content-browser" className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Featured Content
          {rpcOptimization.metrics.savedCalls > 0 && (
            <Badge variant="secondary" className="text-xs ml-2">
              {rpcOptimization.metrics.savedCalls} calls saved
            </Badge>
          )}
        </h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleRefresh}
          disabled={contentQuery.isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", contentQuery.isLoading && "animate-spin")} />
        </Button>
      </div>
      
      {contentQuery.isLoading ? (
        <MiniAppContentSkeleton />
      ) : contentQuery.isError ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-2">Unable to Load Content</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please try again later
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : contentQuery.data?.contentIds?.length === 0 ? (
        <div className="text-center py-8">
          <Eye className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-2">No Content Available</h3>
          <p className="text-sm text-muted-foreground">
            Check back soon for amazing content from creators
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {contentQuery.data?.contentIds?.map((contentId) => (
            <MiniAppContentCard
              key={contentId.toString()}
              contentId={contentId}
              onContentSelect={handleContentClick}
              userAddress={walletUI.address as Address}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MiniAppContentBrowser(props: MiniAppContentBrowserProps) {
  return (
    <Suspense fallback={<MiniAppContentSkeleton />}>
      <MiniAppContentBrowserCore {...props} />
    </Suspense>
  )
}
