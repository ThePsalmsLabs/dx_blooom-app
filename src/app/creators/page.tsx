'use client'

import React, { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Star, 
  Grid3X3, 
  List, 
  Smartphone,
  Crown,
  Zap,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'

import { useAllCreators } from '@/hooks/contracts/useAllCreators.optimized'
import { CreatorsFilter, type CreatorFilters } from '@/components/creators/CreatorsFilter'
import { CreatorsGrid, CreatorsGridSkeleton } from '@/components/creators/CreatorsGrid'
import { CreatorCard } from '@/components/creators/CreatorCard'

type ViewMode = 'grid' | 'list' | 'compact'

export default function CreatorsDirectoryPage() {
  const { address: userAddress } = useAccount()
  const allCreators = useAllCreators(20) // Start with 20 items per page
  
  // UI State
  const [filters, setFilters] = useState<CreatorFilters>({
    search: '',
    verified: null,
    sortBy: 'newest',
    sortOrder: 'desc'
  })
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)



  // Fixed: Derived data with better error handling
  const verifiedCreators = useMemo(() => {
    if (!allCreators.creators || allCreators.creators.length === 0) {
      return []
    }
    return allCreators.creators.filter(creator => 
      creator?.profile?.isVerified === true
    )
  }, [allCreators.creators])

  const topCreators = useMemo(() => {
    if (!allCreators.creators || allCreators.creators.length === 0) {
      return []
    }
    return [...allCreators.creators]
      .sort((a, b) => {
        const aEarnings = a?.profile?.totalEarnings ? Number(a.profile.totalEarnings) : 0
        const bEarnings = b?.profile?.totalEarnings ? Number(b.profile.totalEarnings) : 0
        return bEarnings - aEarnings
      })
      .slice(0, 10)
  }, [allCreators.creators])

  // Filter and sort creators
  const filteredCreators = useMemo(() => {
    if (!allCreators.creators || allCreators.creators.length === 0) {
      return []
    }
    
    let filtered = [...allCreators.creators]
    
    // Search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase().trim()
      filtered = filtered.filter(creator => {
        if (!creator?.address) return false
        const addressMatch = creator.address.toLowerCase().includes(searchLower)
        // You could add more search criteria here if needed
        return addressMatch
      })
    }

    // Verification filter
    if (filters.verified !== null) {
      filtered = filtered.filter(creator => {
        if (!creator?.profile) return false
        const isVerified = Boolean(creator.profile.isVerified)
        return isVerified === filters.verified
      })
    }

    // Price range filter
    if (filters.minSubscriptionPrice || filters.maxSubscriptionPrice) {
      filtered = filtered.filter(creator => {
        if (!creator?.profile?.subscriptionPrice) return true // Include creators without subscription price
        
        const price = Number(creator.profile.subscriptionPrice)
        const minPrice = filters.minSubscriptionPrice || 0
        const maxPrice = filters.maxSubscriptionPrice || Number.MAX_SAFE_INTEGER
        
        return price >= minPrice && price <= maxPrice
      })
    }

    // Sorting
    if (filters.sortBy && filtered.length > 0) {
      filtered.sort((a, b) => {
        let aValue: number | string = 0
        let bValue: number | string = 0
        
        switch (filters.sortBy) {
          case 'newest':
            aValue = a?.profile?.registrationTime ? Number(a.profile.registrationTime) : 0
            bValue = b?.profile?.registrationTime ? Number(b.profile.registrationTime) : 0
            break
          case 'earnings':
            aValue = a?.profile?.totalEarnings ? Number(a.profile.totalEarnings) : 0
            bValue = b?.profile?.totalEarnings ? Number(b.profile.totalEarnings) : 0
            break
          case 'subscribers':
            aValue = a?.profile?.subscriberCount ? Number(a.profile.subscriberCount) : 0
            bValue = b?.profile?.subscriberCount ? Number(b.profile.subscriberCount) : 0
            break
          case 'content':
            aValue = a?.profile?.contentCount ? Number(a.profile.contentCount) : 0
            bValue = b?.profile?.contentCount ? Number(b.profile.contentCount) : 0
            break
          case 'alphabetical':
            aValue = a?.address || ''
            bValue = b?.address || ''
            break
        }
        
        if (typeof aValue === 'string') {
          return filters.sortOrder === 'asc' 
            ? aValue.localeCompare(bValue as string)
            : (bValue as string).localeCompare(aValue)
        } else {
          // Ensure both values are numbers for arithmetic operations
          const aNum = typeof aValue === 'number' ? aValue : 0
          const bNum = typeof bValue === 'number' ? bValue : 0
          return filters.sortOrder === 'asc' 
            ? aNum - bNum 
            : bNum - aNum
        }
      })
    }

    return filtered
  }, [allCreators.creators, filters])

  // Extract addresses for the CreatorsGrid component
  const creatorAddresses = useMemo(() => 
    filteredCreators.map(creator => creator.address), 
    [filteredCreators]
  )

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header Section - Enhanced Mobile Responsiveness */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            Discover Amazing Creators
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight px-2">
            Explore our vibrant community of creators building the future of decentralized content.
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Support your favorites with subscriptions and unlock exclusive access.
          </p>

          {/* Quick Stats - Mobile Optimized */}
          <div className="flex justify-center gap-4 sm:gap-8 pt-3 sm:pt-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{allCreators.totalCount}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Creators</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{verifiedCreators.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">$2.4M+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Earned</div>
            </div>
          </div>
        </div>

        {/* Featured Creators Section - Mobile Optimized */}
        {topCreators.length > 0 && (
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  Featured Creators
                </CardTitle>
                <Button variant="outline" size="sm" className="self-start sm:self-auto">
                  View All Featured
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {topCreators.slice(0, 6).map((creator) => (
                  <CreatorCard
                    key={creator.address}
                    creatorAddress={creator.address}
                    variant="compact"
                    showSubscribeButton={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Area - Enhanced Mobile Layout */}
        <div className="grid lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Filters Sidebar - Mobile Collapsible */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="lg:sticky lg:top-4">
              <CreatorsFilter
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={allCreators.totalCount}
                filteredCount={filteredCreators.length}
              />
            </div>
          </div>

          {/* Creators Grid */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4 order-1 lg:order-2">
            {/* Tabs and View Controls - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <Tabs defaultValue="all" className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-none">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">All Creators</TabsTrigger>
                  <TabsTrigger value="verified" className="text-xs sm:text-sm">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Verified</span>
                    <span className="sm:hidden">✓</span>
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Trending</span>
                    <span className="sm:hidden">📈</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-1 sm:gap-2 justify-center sm:justify-end">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                >
                  <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">Grid</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                >
                  <List className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">List</span>
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                  className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
                >
                  <Smartphone className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">Compact</span>
                </Button>
              </div>
            </div>



            {/* Creators Grid Component */}
            {allCreators.isLoading ? (
              <CreatorsGridSkeleton />
            ) : allCreators.isError ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-red-500 mb-4">⚠️ Error loading creators</div>
                  <p className="text-muted-foreground mb-4">
                    {allCreators.error?.message || 'Failed to load creators'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={allCreators.retryFailed} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Failed
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Full Reload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <CreatorsGrid
                  creatorAddresses={creatorAddresses}
                  filters={filters}
                  viewMode={viewMode}
                  itemsPerPage={12}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
                
                {/* Load More Button - Mobile Optimized */}
                {allCreators.hasMore && (
                  <div className="flex justify-center mt-6 sm:mt-8">
                    <Button
                      onClick={allCreators.loadMore}
                      disabled={allCreators.isLoading}
                      size="lg"
                      className="px-6 sm:px-8 w-full sm:w-auto max-w-sm"
                    >
                      {allCreators.isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Creators</span>
                          <span className="ml-2 text-xs sm:text-sm opacity-70 hidden sm:inline">
                            ({allCreators.creators.length} of {allCreators.totalCount})
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Call to Action for Creators */}
        <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Become a Creator</h3>
            <p className="text-muted-foreground mb-4">
              Join thousands of creators earning from their content with transparent, instant payments on the blockchain.
            </p>
            <Button size="lg">
              <Zap className="h-5 w-5 mr-2" />
              Become a Creator
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}