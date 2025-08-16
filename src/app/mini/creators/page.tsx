'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Users, 
  Star, 
  Grid,
  List
} from 'lucide-react'

import { useAllCreators } from '@/hooks/contracts/useAllCreators'
import { CreatorCard } from '@/components/creators/CreatorCard'

export default function MiniAppCreatorsPage() {
  const allCreators = useAllCreators()
  const [searchQuery, setSearchQuery] = useState('')
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Derived data for backward compatibility
  const topCreators = React.useMemo(() =>
    [...allCreators.creators]
      .sort((a, b) => Number(b.profile.totalEarnings) - Number(a.profile.totalEarnings))
      .slice(0, 15),
    [allCreators.creators]
  )

  const filteredCreators = allCreators.creators.filter(creator => {
    const matchesSearch = !searchQuery || 
      creator.address.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVerified = !showVerifiedOnly || creator.profile?.isVerified
    return matchesSearch && matchesVerified
  })

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Creators
            </h1>
            <Badge variant="secondary">
              {allCreators.totalCount} creators
            </Badge>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={!showVerifiedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowVerifiedOnly(false)}
              >
                All
              </Button>
              <Button
                variant={showVerifiedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowVerifiedOnly(true)}
              >
                <Star className="h-3 w-3 mr-1" />
                Verified
              </Button>
            </div>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCreators.slice(0, 20).map((creator) => (
                  <CreatorCard
                    key={creator.address}
                    creatorAddress={creator.address}
                    variant="compact"
                    showSubscribeButton={true}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCreators.slice(0, 20).map((creator) => (
                  <CreatorCard
                    key={creator.address}
                    creatorAddress={creator.address}
                    variant="compact"
                    showSubscribeButton={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured">
            <div className="space-y-4">
              {topCreators.slice(0, 10).map((creator) => (
                <CreatorCard
                  key={creator.address}
                  creatorAddress={creator.address}
                  variant="featured"
                  showSubscribeButton={true}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending">
            <div className="grid grid-cols-1 gap-4">
              {topCreators.slice(0, 15).map((creator) => (
                <CreatorCard
                  key={creator.address}
                  creatorAddress={creator.address}
                  variant="compact"
                  showSubscribeButton={true}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Load More */}
        {filteredCreators.length > 20 && (
          <div className="text-center mt-6">
            <Button variant="outline" className="w-full">
              Load More Creators
            </Button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="p-4 border-t bg-muted/50">
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold mb-2">Ready to Create?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join our creator community and start earning from your content
            </p>
            <Button className="w-full">
              Become a Creator
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation for Mini App */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t">
        <div className="flex items-center justify-around py-2">
          <a href="/mini" className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-5 h-5 bg-muted rounded" />
            <span className="text-xs">Home</span>
          </a>
          <a href="/mini/browse" className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-5 h-5 bg-muted rounded" />
            <span className="text-xs">Browse</span>
          </a>
          <a href="/mini/creators" className="flex flex-col items-center gap-1 p-2 text-foreground">
            <div className="w-5 h-5 bg-primary rounded" />
            <span className="text-xs">Creators</span>
          </a>
          <a href="/mini/profile" className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-5 h-5 bg-muted rounded" />
            <span className="text-xs">Profile</span>
          </a>
        </div>
      </div>
    </div>
  )
}
