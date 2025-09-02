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

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Play,
  Eye,
  RefreshCw,
  Wallet,
  AlertCircle,
  Share2
} from 'lucide-react'
import { cn, formatCurrency, formatAddress } from '@/lib/utils'
import { useActiveContentPaginated } from '@/hooks/contracts/core'
import { MiniAppPurchaseButton } from '@/components/commerce/MiniAppPurchaseButton'
import { ShareButton } from '@/components/ui/share-button'
import type { Address } from 'viem'

interface MiniAppContentBrowserProps {
  itemsPerPage?: number
  onContentSelect?: (contentId: bigint) => void
  className?: string
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
  className 
}: MiniAppContentBrowserProps) {
  const walletUI = useWalletConnectionUI()
  const [shouldLoadContent, setShouldLoadContent] = useState(false)

  // Only load content if wallet is connected or after a delay
  useEffect(() => {
    if (walletUI.isConnected) {
      setShouldLoadContent(true)
    } else {
      // Delay content loading for non-connected users to prioritize wallet connection
      const timer = setTimeout(() => setShouldLoadContent(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [walletUI.isConnected])

  // Only make contract calls when we should load content
  const contentQuery = useActiveContentPaginated(
    shouldLoadContent ? 0 : 0,
    shouldLoadContent ? itemsPerPage : 0
  )

  const handleContentClick = useCallback((contentId: bigint) => {
    if (onContentSelect) {
      onContentSelect(contentId)
    }
  }, [onContentSelect])

  const handleRefresh = useCallback(() => {
    contentQuery.refetch()
  }, [contentQuery])

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
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {contentQuery.data?.contentIds?.map((contentId) => (
                  <Card key={contentId.toString()} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <h3 className="font-medium text-sm truncate">
                        Content #{contentId.toString()}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        Connect your wallet to view details and purchase
                      </p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {formatAddress('0x1234...5678' as Address)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          Creator
                        </span>
                      </div>
                    </CardContent>
                  </Card>
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
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Play className="h-5 w-5 text-primary" />
          Featured Content
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
            <Card 
              key={contentId.toString()} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleContentClick(contentId)}
            >
              <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-medium text-sm truncate">
                  Content #{contentId.toString()}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  Click to view details and purchase
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {formatAddress('0x1234...5678' as Address)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      Creator
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {formatCurrency(BigInt(1000000))} {/* 0.01 USDC in wei */}
                  </Badge>
                </div>

                {/* Social Proof Indicators */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>1.2k views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    <span>42 shares</span>
                  </div>
                </div>
                <MiniAppPurchaseButton
                  contentId={contentId}
                  title={`Content #${contentId.toString()}`}
                  className="w-full"
                />

                {/* Share Button */}
                <div className="flex gap-2 pt-2">
                  <ShareButton
                    contentId={contentId}
                    title={`Content #${contentId.toString()}`}
                    description="Premium content on Bloom platform"
                    variant="compact"
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>
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
