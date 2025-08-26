import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CreatorCard } from './CreatorCard'
import type { Address } from 'viem'
import type { CreatorFilters } from './CreatorsFilter'

interface CreatorsGridProps {
  creatorAddresses: readonly Address[]
  filters: CreatorFilters
  viewMode: 'grid' | 'list' | 'compact'
  itemsPerPage?: number
  currentPage?: number
  onPageChange?: (page: number) => void
  className?: string
}

export function CreatorsGrid({
  creatorAddresses,
  filters,
  viewMode,
  itemsPerPage = 12,
  currentPage = 1,
  onPageChange,
  className
}: CreatorsGridProps) {
  const totalPages = Math.ceil(creatorAddresses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCreators = creatorAddresses.slice(startIndex, endIndex)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange?.(newPage)
    }
  }

  if (creatorAddresses.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl">🔍</div>
            <h3 className="text-lg font-semibold">No Creators Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Try adjusting your filters or search terms to discover more creators.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view (default) - Improved responsive layout with proper constraints
  if (viewMode === 'grid') {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 auto-rows-fr">
          {currentCreators.map((creatorAddress) => (
            <div key={creatorAddress} className="min-w-0 w-full">
              <CreatorCard
                creatorAddress={creatorAddress}
                variant="default"
                showSubscribeButton={true}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-9 px-3 text-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show first page, last page, current page, and pages around current
                const page = i + 1
                if (totalPages <= 5 || page === 1 || page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-9 h-9 p-0 text-sm"
                    >
                      {page}
                    </Button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-muted-foreground">...</span>
                }
                return null
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-9 px-3 text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-center text-sm text-muted-foreground mt-4">
          Showing {startIndex + 1}-{Math.min(endIndex, creatorAddresses.length)} of {creatorAddresses.length} creators
        </div>
      </div>
    )
  }

  // List view - Improved spacing and layout
  if (viewMode === 'list') {
    return (
      <div className={className}>
        <div className="space-y-4">
          {currentCreators.map((creatorAddress) => (
            <div key={creatorAddress} className="min-w-0 w-full">
              <CreatorCard
                creatorAddress={creatorAddress}
                variant="default"
                showSubscribeButton={true}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-9 px-3 text-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1
                if (totalPages <= 5 || page === 1 || page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-9 h-9 p-0 text-sm"
                    >
                      {page}
                    </Button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-muted-foreground">...</span>
                }
                return null
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-9 px-3 text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-center text-sm text-muted-foreground mt-4">
          Showing {startIndex + 1}-{Math.min(endIndex, creatorAddresses.length)} of {creatorAddresses.length} creators
        </div>
      </div>
    )
  }

  // Compact view for mobile/mini app - Improved spacing
  return (
    <div className={className}>
      <div className="space-y-3">
        {currentCreators.map((creatorAddress) => (
          <div key={creatorAddress} className="min-w-0 w-full">
            <CreatorCard
              creatorAddress={creatorAddress}
              variant="compact"
              showSubscribeButton={true}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {/* Load More for compact view */}
      {endIndex < creatorAddresses.length && (
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            className="w-full max-w-sm text-sm h-9"
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Load More Creators
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-muted-foreground mt-4">
        Showing {Math.min(endIndex, creatorAddresses.length)} of {creatorAddresses.length} creators
      </div>
    </div>
  )
}

export function CreatorsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 auto-rows-fr">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="min-w-0 w-full">
          <Card className="animate-pulse h-full">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded w-20" />
                    <div className="h-2 bg-muted rounded w-24" />
                  </div>
                </div>
              </div>
              <div className="space-y-1 mb-4">
                <div className="h-2 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
              <div className="flex gap-2 mt-auto">
                <div className="w-full h-7 bg-muted rounded" />
                <div className="w-full h-7 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
