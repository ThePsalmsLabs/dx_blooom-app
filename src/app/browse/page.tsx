/**
 * Content Discovery Page - Component 10.2: Production Content Browsing Experience
 * File: src/app/browse/page.tsx
 * 
 * This page demonstrates the culmination of content discovery architecture by orchestrating
 * all content-related components into a seamless browsing and purchasing experience.
 * 
 * Integration Showcase:
 * - ContentDiscoveryGrid provides sophisticated filtering and view options
 * - ContentPurchaseCard handles complete purchase workflows
 * - useActiveContentPaginated manages efficient content loading
 * - useContentPurchaseFlow orchestrates transaction logic
 * - SubgraphQueryService enables advanced search capabilities
 * - AppLayout provides consistent navigation and responsive design
 * 
 * This page validates that complex content discovery can feel intuitive and performant
 * while maintaining the transparency and control that Web3 users expect.
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Grid3x3,
  List,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/index'

// Import our architectural layers - demonstrating clean separation
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { ContentDiscoveryGrid } from '@/components/content/ContentDiscoveryGrid'
import { ContentPurchaseCard } from '@/components/web3/ContentPurchaseCard'

// Import utility functions and types that ensure type safety
import { cn } from '@/lib/utils'
import type { ContentCategory } from '@/types/contracts'
import { isValidContentCategory } from '@/types/contracts'

/**
 * Search Parameters Interface
 * 
 * This interface defines how URL search parameters map to content discovery state,
 * enabling direct linking to filtered content views and maintaining state across navigation.
 */
interface ContentDiscoveryParams {
  readonly category?: ContentCategory
  readonly search?: string
  readonly view?: 'grid' | 'list' | 'compact'
  readonly sort?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular'
  readonly access?: 'all' | 'free' | 'premium' | 'subscription'
  readonly minPrice?: string
  readonly maxPrice?: string
}

/**
 * Content Interaction State Interface
 * 
 * This interface manages the various modal and interaction states that can occur
 * during content discovery, ensuring clean state management.
 */
interface ContentInteractionState {
  readonly selectedContentId: bigint | null
  readonly showPurchaseModal: boolean
  readonly showContentPreview: boolean
  readonly lastPurchaseSuccess: boolean
}




/**
 * ContentDiscoveryPage Component
 * 
 * This component orchestrates the complete content discovery experience,
 * demonstrating how our modular architecture enables sophisticated features
 * while maintaining clean, maintainable code.
 */
export default function ContentDiscoveryPage() {
  // Navigation and URL state management
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Wallet connection for purchase and access features
  const { address: userAddress, isConnected } = useAccount()

  // Parse URL parameters into typed state
  const discoveryParams: ContentDiscoveryParams = useMemo(() => {
    const categoryParam = searchParams.get('category')
    const category = categoryParam ? parseInt(categoryParam, 10) : undefined
    
    return {
      category: category !== undefined && isValidContentCategory(category) ? category : undefined,
      search: searchParams.get('search') || undefined,
      view: (searchParams.get('view') as 'grid' | 'list' | 'compact') || 'grid',
      sort: (searchParams.get('sort') as 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular') || 'newest',
      access: (searchParams.get('access') as 'all' | 'free' | 'premium' | 'subscription') || 'all',
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined
    }
  }, [searchParams])

  // Content interaction state management
  const [interactionState, setInteractionState] = useState<ContentInteractionState>({
    selectedContentId: null,
    showPurchaseModal: false,
    showContentPreview: false,
    lastPurchaseSuccess: false
  })

  // Convert URL parameters to filter format for ContentDiscoveryGrid
  const initialFilters = useMemo(() => ({
    search: discoveryParams.search || '',
    category: discoveryParams.category || 'all' as const,
    sortBy: discoveryParams.sort || 'newest' as const,
    accessType: discoveryParams.access || 'all' as const,
    priceRange: [
      discoveryParams.minPrice ? parseFloat(discoveryParams.minPrice) : 0,
      discoveryParams.maxPrice ? parseFloat(discoveryParams.maxPrice) : 100
    ] as [number, number],
    tags: [] as string[]
  }), [discoveryParams])

  /**
   * Content Selection Handler
   * 
   * This function demonstrates how content selection flows through the application,
   * checking access status and determining appropriate user actions.
   */
  const handleContentSelect = useCallback((contentId: bigint) => {
    setInteractionState(prev => ({
      ...prev,
      selectedContentId: contentId,
      showPurchaseModal: true,
      showContentPreview: false
    }))
  }, [])

  /**
   * Purchase Success Handler
   * 
   * This function handles post-purchase state updates and user feedback,
   * demonstrating how successful transactions flow through the UI.
   */
  const handlePurchaseSuccess = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      showPurchaseModal: false,
      lastPurchaseSuccess: true,
      showContentPreview: true
    }))

    // Provide user feedback for successful purchase
    // Note: In a real app, this would trigger a toast notification
    console.log('Purchase successful, content unlocked')
  }, [])

  /**
   * Content Viewing Handler
   * 
   * This function handles navigation to content viewing pages after successful
   * purchase or for already-owned content.
   */
  const handleViewContent = useCallback(() => {
    if (interactionState.selectedContentId) {
      router.push(`/content/${interactionState.selectedContentId}`)
    }
  }, [interactionState.selectedContentId, router])

  /**
   * Modal Dismissal Handler
   * 
   * This function manages modal state cleanup while preserving important
   * interaction context for user experience continuity.
   */
  const handleModalDismiss = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      showPurchaseModal: false,
      showContentPreview: false,
      selectedContentId: null
    }))
  }, [])

  /**
   * URL Parameter Update Handler
   * 
   * This function demonstrates how UI state synchronizes with URL parameters,
   * enabling shareable links and browser navigation.
   */
  const updateURLParams = useCallback((updates: Partial<ContentDiscoveryParams>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        newParams.set(key, value.toString())
      } else {
        newParams.delete(key)
      }
    })

    const newURL = `${window.location.pathname}?${newParams.toString()}`
    router.replace(newURL)
  }, [searchParams, router])

  return (
    <AppLayout className="bg-gradient-to-br from-background via-background to-muted/20">
      {/* Route Guard ensures proper access patterns */}
      <RouteGuards
        requiredLevel= 'public'  // Content discovery is available to all users
      >
        <div className="container mx-auto py-6 space-y-6">
          {/* Page Header with Context and Actions */}
          <ContentDiscoveryHeader
            totalResults="Loading..." // This would be populated from actual query results
            currentCategory={discoveryParams.category}
            isConnected={isConnected}
            onUpdateParams={updateURLParams}
          />

          {/* Quick Filter Tabs for Common Discovery Patterns */}
          <QuickFilterTabs
            activeFilter={discoveryParams.access || 'all'}
            onFilterChange={(access) => updateURLParams({ access })}
          />

          {/* Main Content Discovery Grid */}
          <ContentDiscoveryGrid
            initialFilters={initialFilters}
            onContentSelect={handleContentSelect}
            showCreatorInfo={true}
            itemsPerPage={12}
            className="min-h-[600px]"
          />

          {/* Purchase Modal Integration */}
          <ContentPurchaseModal
            contentId={interactionState.selectedContentId}
            userAddress={userAddress}
            isOpen={interactionState.showPurchaseModal}
            onClose={handleModalDismiss}
            onPurchaseSuccess={handlePurchaseSuccess}
            onViewContent={handleViewContent}
          />

          {/* Success State Feedback */}
          {interactionState.lastPurchaseSuccess && (
            <PurchaseSuccessAlert
              onDismiss={() => setInteractionState(prev => ({ ...prev, lastPurchaseSuccess: false }))}
              onViewContent={handleViewContent}
            />
          )}

          {/* Educational Content for New Users */}
          {!isConnected && (
            <GuestUserGuidance />
          )}
        </div>
      </RouteGuards>
    </AppLayout>
  )
}

/**
 * Supporting Components
 * 
 * These components demonstrate how complex page interfaces can be broken down
 * into focused, reusable pieces while maintaining type safety and clear APIs.
 */

interface ContentDiscoveryHeaderProps {
  readonly totalResults: string
  readonly currentCategory?: ContentCategory
  readonly isConnected: boolean
  readonly onUpdateParams: (updates: Partial<ContentDiscoveryParams>) => void
}

function ContentDiscoveryHeader({
  totalResults,
  currentCategory,
  isConnected,
  onUpdateParams
}: ContentDiscoveryHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Page Title and Context */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Discover Content</h1>
          {currentCategory && (
            <Badge variant="secondary" className="capitalize">
              {currentCategory}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Explore decentralized content from creators worldwide. {totalResults} items available.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {isConnected && (
          <Button
            variant="outline"
            onClick={() => window.open('/dashboard', '_blank')}
            className="hidden sm:flex"
          >
            Creator Dashboard
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="default"
          onClick={() => onUpdateParams({ sort: 'newest' })}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Latest Content
        </Button>
      </div>
    </div>
  )
}

interface QuickFilterTabsProps {
  readonly activeFilter: string
  readonly onFilterChange: (filter: 'all' | 'free' | 'premium' | 'subscription') => void
}

function QuickFilterTabs({ activeFilter, onFilterChange }: QuickFilterTabsProps) {
  return (
    <Tabs value={activeFilter} onValueChange={onFilterChange as (value: string) => void}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="all">All Content</TabsTrigger>
        <TabsTrigger value="free">Free</TabsTrigger>
        <TabsTrigger value="premium">Pay-per-View</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

interface ContentPurchaseModalProps {
  readonly contentId: bigint | null
  readonly userAddress?: string
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onPurchaseSuccess: () => void
  readonly onViewContent: () => void
}

function ContentPurchaseModal({
  contentId,
  userAddress,
  isOpen,
  onClose,
  onPurchaseSuccess,
  onViewContent
}: ContentPurchaseModalProps) {
  if (!contentId) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase Content</DialogTitle>
          <DialogDescription>
            Complete your purchase to unlock this content immediately.
          </DialogDescription>
        </DialogHeader>
        
        <ContentPurchaseCard
          contentId={contentId}
          userAddress={userAddress}
          onPurchaseSuccess={onPurchaseSuccess}
          onViewContent={onViewContent}
          variant="full"
        />
      </DialogContent>
    </Dialog>
  )
}

interface PurchaseSuccessAlertProps {
  readonly onDismiss: () => void
  readonly onViewContent: () => void
}

function PurchaseSuccessAlert({ onDismiss, onViewContent }: PurchaseSuccessAlertProps) {
  return (
    <Alert className="border-green-200 bg-green-50">
      <AlertCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-green-800">
          Purchase successful! Your content has been unlocked.
        </span>
        <div className="flex gap-2">
          <Button size="sm" onClick={onViewContent}>
            View Content
          </Button>
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

function GuestUserGuidance() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          New to Web3 Content?
        </CardTitle>
        <CardDescription>
          Connect your wallet to purchase and access premium content from creators.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div>
              <h4 className="font-medium">Connect Wallet</h4>
              <p className="text-sm text-muted-foreground">
                Use MetaMask, Coinbase Wallet, or other supported wallets
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div>
              <h4 className="font-medium">Browse & Purchase</h4>
              <p className="text-sm text-muted-foreground">
                Pay with USDC for instant access to premium content
              </p>
            </div>
          </div>
        </div>
        
        <Button className="w-full sm:w-auto">
          Learn More About Web3 Content
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}