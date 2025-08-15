'use client'

import React, { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Star, 
  Grid3X3, 
  List, 
  Smartphone,
  Crown,
  Zap
} from 'lucide-react'

import { useAllCreators } from '@/hooks/contracts/useAllCreators'
import { CreatorsFilter, type CreatorFilters } from '@/components/creators/CreatorsFilter'
import { CreatorsGrid, CreatorsGridSkeleton } from '@/components/creators/CreatorsGrid'
import { CreatorCard } from '@/components/creators/CreatorCard'

type ViewMode = 'grid' | 'list' | 'compact'

export default function CreatorsDirectoryPage() {
  const { address: userAddress } = useAccount()
  const allCreators = useAllCreators()
  
  // UI State
  const [filters, setFilters] = useState<CreatorFilters>({
    search: '',
    verified: null,
    sortBy: 'newest',
    sortOrder: 'desc'
  })
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and sort creators
  const filteredCreators = useMemo(() => {
    let filtered = [...allCreators.creators]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(creator =>
        creator.address.toLowerCase().includes(searchLower)
      )
    }

    // Verification filter
    if (filters.verified !== null) {
      filtered = filtered.filter(creator =>
        Boolean(creator.profile?.isVerified) === filters.verified
      )
    }

    // Price range filter
    if (filters.minSubscriptionPrice || filters.maxSubscriptionPrice) {
      filtered = filtered.filter(creator => {
        if (!creator.profile) return false
        const price = Number(creator.profile.subscriptionPrice) / 1e6 // Convert from wei to USDC
        const min = filters.minSubscriptionPrice || 0
        const max = filters.maxSubscriptionPrice || Infinity
        return price >= min && price <= max
      })
    }

    // Sort
    filtered.sort((a, b) => {
      if (!a.profile || !b.profile) return 0
      
      let comparison = 0
      switch (filters.sortBy) {
        case 'newest':
          comparison = Number(b.profile.registrationTime) - Number(a.profile.registrationTime)
          break
        case 'earnings':
          comparison = Number(b.profile.totalEarnings) - Number(a.profile.totalEarnings)
          break
        case 'subscribers':
          comparison = Number(b.profile.subscriberCount) - Number(a.profile.subscriberCount)
          break
        case 'content':
          comparison = Number(b.profile.contentCount) - Number(a.profile.contentCount)
          break
        case 'alphabetical':
          comparison = a.address.localeCompare(b.address)
          break
      }
      
      return filters.sortOrder === 'desc' ? comparison : -comparison
    })

    return filtered.map(creator => creator.address)
  }, [allCreators.creators, filters])

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Discover Amazing Creators</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our vibrant community of creators building the future of decentralized content. 
            Support your favorites with subscriptions and unlock exclusive access.
          </p>
          
          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allCreators.totalCount}</div>
              <div className="text-sm text-muted-foreground">Total Creators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{allCreators.verifiedCreators.length}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">$2.4M+</div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </div>
          </div>
        </div>

        {/* Featured Creators Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              Featured Creators
            </h2>
            <Button variant="outline">View All Featured</Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {allCreators.topCreators.slice(0, 3).map((creator) => (
              <CreatorCard
                key={creator.address}
                creatorAddress={creator.address}
                variant="featured"
                showSubscribeButton={true}
              />
            ))}
          </div>
        </section>

        {/* Main Directory */}
        <section className="space-y-6">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="grid w-fit grid-cols-3">
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

              {/* View Mode Selector */}
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

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <CreatorsFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  totalCount={allCreators.totalCount}
                  filteredCount={filteredCreators.length}
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <TabsContent value="all">
                  {allCreators.isLoading ? (
                    <CreatorsGridSkeleton />
                  ) : (
                    <CreatorsGrid
                      creatorAddresses={filteredCreators}
                      filters={filters}
                      viewMode={viewMode}
                      itemsPerPage={12}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </TabsContent>

                <TabsContent value="verified">
                  <CreatorsGrid
                    creatorAddresses={allCreators.verifiedCreators.map(c => c.address)}
                    filters={filters}
                    viewMode={viewMode}
                    itemsPerPage={12}
                  />
                </TabsContent>

                <TabsContent value="trending">
                  <CreatorsGrid
                    creatorAddresses={allCreators.topCreators.map(c => c.address)}
                    filters={filters}
                    viewMode={viewMode}
                    itemsPerPage={12}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold">Ready to Start Creating?</h2>
            <p className="text-muted-foreground">
              Join thousands of creators earning from their content with transparent, 
              instant payments on the blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Zap className="h-4 w-4 mr-2" />
                Become a Creator
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
