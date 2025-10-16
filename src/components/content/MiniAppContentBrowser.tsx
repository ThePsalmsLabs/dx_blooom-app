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
import { useRouter } from 'next/navigation'
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
  Unlock,
  CheckCircle
} from 'lucide-react'
import { cn, formatCurrency, formatAddress } from '@/lib/utils'
import { categoryToString } from '@/types/contracts'
import {
  useActiveContentPaginated,
  useContentById,
  useHasContentAccess,
  useCreatorProfile
} from '@/hooks/contracts/core'
// Note: Mock content integration removed - using only real contract data
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
  const router = useRouter()
  // Fetch real content data only
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

  const handleViewContent = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/mini/content/${contentId}`)
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

        {/* Price and Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm font-semibold">
            {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
          </div>
          {accessControl.data ? (
            <Button
              size="sm"
              className="text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={handleViewContent}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              View
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-xs bg-primary hover:bg-primary/90 text-white"
              onClick={handleViewContent}
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MiniAppContentSkeleton() {
  return (
    <div className="space-y-4">
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

  // Optimized content loading strategy (aligned with web app)
  useEffect(() => {
    if (walletUI.isConnected) {
      setShouldLoadContent(true)
    } else {
      // Immediate loading for better UX (same as web app)
      setShouldLoadContent(true)
    }
  }, [walletUI.isConnected])

  // Use provided contentIds or fetch from contract
  const contentQuery = useActiveContentPaginated(
    shouldLoadContent && isVisible && !contentIds ? 0 : 0,
    shouldLoadContent && isVisible && !contentIds ? itemsPerPage : 0
  )

  // Create data structure when contentIds are provided
  const providedContentData = useMemo(() => {
    if (contentIds && contentIds.length > 0) {
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
  
  // Check if we actually have content to display
  const hasContent = effectiveContentData?.contentIds && effectiveContentData.contentIds.length > 0
  
  // Real content data only - no mock data fallback

  // Apply RPC optimization metrics tracking (FIXED INFINITE LOGGING)
  useEffect(() => {
    if (effectiveContentData && hasContent) {
      // Track successful data fetch for metrics (throttled)
      const now = Date.now()
      const lastLogKey = 'content-browser-last-log'
      const lastLog = parseInt(localStorage.getItem(lastLogKey) || '0')
      
      // Only log once per 10 seconds to prevent spam
      if (now - lastLog > 10000) {
        console.log('📊 Content loaded successfully with optimization', {
          contentCount: effectiveContentData.contentIds.length,
          total: effectiveContentData.total
        })
        localStorage.setItem(lastLogKey, now.toString())
      }
    } else if (effectiveContentData && !hasContent) {
      console.log('📊 No content available - empty state detected')
    }
  }, [effectiveContentData, hasContent])

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
          <div className="mx-auto mb-4 p-4 bg-muted/50 rounded-full w-fit">
            <Wallet className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-2 text-lg">Wallet Not Connected</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Connect your wallet to discover exclusive content, purchase premium media, and access your personalized feed
          </p>

          {/* Connection Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-2xl mx-auto">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Eye className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Browse Content</p>
              <p className="text-xs text-muted-foreground">Discover premium media</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Unlock className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Instant Access</p>
              <p className="text-xs text-muted-foreground">Purchase with USDC</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <RefreshCw className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">Sync Status</p>
              <p className="text-xs text-muted-foreground">Across all devices</p>
            </div>
          </div>

          {/* Connect Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={walletUI.connect}
              disabled={walletUI.isConnecting}
              size="lg"
              className="px-8"
            >
              {walletUI.isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>

            {/* Alternative: Switch to Different Wallet */}
            {!walletUI.isConnecting && (
              <Button
                variant="outline"
                size="lg"
                onClick={walletUI.connect}
                className="px-6"
                title="Connect a different wallet"
              >
                Switch Wallet
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs text-muted-foreground">
              Secure connection powered by Privy • Base Network
            </p>

            {/* Connection Tips */}
            <div className="bg-muted/30 rounded-lg p-3 text-left max-w-md mx-auto">
              <h4 className="text-xs font-medium mb-2">💡 Connection Tips:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use MetaMask, Coinbase Wallet, or WalletConnect</li>
                <li>• Switch to Base Sepolia testnet for testing</li>
                <li>• Approve the connection in your wallet</li>
                <li>• Your wallet address stays private</li>
                <li>• Use "Switch Wallet" to connect a different wallet</li>
                <li>• Disconnect anytime to change wallets</li>
              </ul>
            </div>

            {/* Network Info */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                <span>Base Network</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 bg-purple-500 rounded-full" />
                <span>USDC Payments</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
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
            ) : hasContent ? (
              <div className="space-y-4">
                {effectiveContentData?.contentIds?.map((contentId: bigint) => (
                  <MiniAppContentCard
                    key={contentId.toString()}
                    contentId={contentId}
                    onContentSelect={handleContentClick}
                    userAddress={walletUI.address as Address}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-2">No Content Available</h3>
                <p className="text-sm text-muted-foreground">
                  No content has been published yet. Check back soon!
                </p>
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
      ) : !hasContent ? (
        <div className="text-center py-8">
          <Eye className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-2">No Content Available</h3>
          <p className="text-sm text-muted-foreground">
            No content has been published yet. Be the first to create content!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {effectiveContentData?.contentIds?.map((contentId) => (
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
