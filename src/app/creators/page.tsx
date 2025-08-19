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
import { safeStringify } from '@/lib/utils/bigint-serializer'

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

  // DEBUG: Add console logging to see what's happening
  console.log('🔍 Creators Debug Info:', {
    totalCount: allCreators.totalCount,
    creatorsArrayLength: allCreators.creators.length,
    isLoading: allCreators.isLoading,
    isError: allCreators.isError,
    error: allCreators.error,
    sampleCreator: allCreators.creators[0],
    filters
  })

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

  // FIXED: Filter and sort creators with better logic
  const filteredCreators = useMemo(() => {
    console.log('🔧 Starting to filter creators:', allCreators.creators.length)
    
    if (!allCreators.creators || allCreators.creators.length === 0) {
      console.log('❌ No creators to filter')
      return []
    }
    
    let filtered = [...allCreators.creators]
    
    // Search filter - more robust
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase().trim()
      const beforeSearchCount = filtered.length
      filtered = filtered.filter(creator => {
        if (!creator?.address) return false
        const addressMatch = creator.address.toLowerCase().includes(searchLower)
        // You could add more search criteria here if needed
        return addressMatch
      })
      console.log(`🔍 Search filter: ${beforeSearchCount} → ${filtered.length}`)
    }

    // Verification filter - more robust
    if (filters.verified !== null) {
      const beforeVerifiedCount = filtered.length
      filtered = filtered.filter(creator => {
        if (!creator?.profile) return false
        const isVerified = Boolean(creator.profile.isVerified)
        return isVerified === filters.verified
      })
      console.log(`✅ Verification filter: ${beforeVerifiedCount} → ${filtered.length}`)
    }

    // Price range filter - fixed logic
    if (filters.minSubscriptionPrice || filters.maxSubscriptionPrice) {
      const beforePriceCount = filtered.length
      filtered = filtered.filter(creator => {
        if (!creator?.profile?.subscriptionPrice) return true // Include creators without subscription price
        
        const price = Number(creator.profile.subscriptionPrice)
        const minPrice = filters.minSubscriptionPrice || 0
        const maxPrice = filters.maxSubscriptionPrice || Number.MAX_SAFE_INTEGER
        
        return price >= minPrice && price <= maxPrice
      })
      console.log(`💰 Price filter: ${beforePriceCount} → ${filtered.length}`)
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

    console.log(`🎯 Final filtered creators: ${filtered.length}`)
    return filtered
  }, [allCreators.creators, filters])

  // Extract addresses for the CreatorsGrid component
  const creatorAddresses = useMemo(() => 
    filteredCreators.map(creator => creator.address), 
    [filteredCreators]
  )

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Users className="h-4 w-4" />
            Discover Amazing Creators
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold">
            Explore our vibrant community of creators building the future of decentralized content.
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Support your favorites with subscriptions and unlock exclusive access.
          </p>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{allCreators.totalCount}</div>
              <div className="text-sm text-muted-foreground">Total Creators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{verifiedCreators.length}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">$2.4M+</div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </div>
          </div>
        </div>

        {/* Featured Creators Section */}
        {topCreators.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Featured Creators
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All Featured
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <CreatorsFilter
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={allCreators.totalCount}
              filteredCount={filteredCreators.length}
            />
          </div>

          {/* Creators Grid */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tabs and View Controls */}
            <div className="flex items-center justify-between">
              <Tabs defaultValue="all" className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">All Creators</TabsTrigger>
                  <TabsTrigger value="verified">
                    <Star className="h-4 w-4 mr-2" />
                    Verified
                  </TabsTrigger>
                  <TabsTrigger value="trending">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* DEBUG Panel - Remove this in production */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-sm text-yellow-800">🐛 Debug Info (Remove in production)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-yellow-700">
                <div>Total Count: {allCreators.totalCount}</div>
                <div>Creators Array Length: {allCreators.creators.length}</div>
                <div>Filtered Count: {filteredCreators.length}</div>
                <div>Is Loading: {allCreators.isLoading ? 'Yes' : 'No'}</div>
                <div>Has Error: {allCreators.isError ? 'Yes' : 'No'}</div>
                {allCreators.error && <div>Error: {allCreators.error.message}</div>}
                <div>First Creator: {allCreators.creators[0]?.address || 'None'}</div>
                {allCreators.creators[0] && (
                  <div>First Creator Profile: {JSON.stringify(allCreators.creators[0].profile, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                  , 2)}</div>
                )}
              </CardContent>
            </Card>

            {/* LIVE PROFILE DEBUG - Enhanced debugging for profile processing */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
              <h3 className="font-bold text-yellow-800 mb-2">🔧 Live Profile Debug</h3>
              <button 
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => {
                  console.log('🔍 MANUAL PROFILE TEST')
                  
                  // Get the profile queries data from your useAllCreators hook
                  const hookData = (window as any).allCreatorsHookData
                  
                  if (hookData?.profileQueries?.data) {
                    console.log('Found profile queries data:', safeStringify(hookData.profileQueries.data))
                    
                    hookData.profileQueries.data.forEach((result: any, index: number) => {
                      console.log(`Profile ${index}:`, safeStringify(result))
                      if (result.status === 'success') {
                        console.log(`Processing profile ${index} result:`, safeStringify(result.result))
                        // Note: processProfileData function is in the hook, not accessible here
                        console.log(`Profile ${index} raw result:`, safeStringify(result.result))
                      }
                    })
                  } else {
                    console.log('No profile data found')
                  }
                }}
              >
                Test Profile Processing
              </button>
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
                
                {/* Load More Button */}
                {allCreators.hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={allCreators.loadMore}
                      disabled={allCreators.isLoading}
                      size="lg"
                      className="px-8"
                    >
                      {allCreators.isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Creators
                          <span className="ml-2 text-sm opacity-70">
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