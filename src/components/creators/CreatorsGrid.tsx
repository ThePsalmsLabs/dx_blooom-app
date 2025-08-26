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
          <div className="space-y-3 sm:space-y-4">
            <div className="text-3xl sm:text-4xl">🔍</div>
            <h3 className="text-base sm:text-lg font-semibold">No Creators Found</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Try adjusting your filters or search terms to discover more creators.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view (default)
  if (viewMode === 'grid') {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {currentCreators.map((creatorAddress) => (
            <CreatorCard
              key={creatorAddress}
              creatorAddress={creatorAddress}
              variant="default"
              showSubscribeButton={true}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
                      className="w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs sm:text-sm"
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
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
          Showing {startIndex + 1}-{Math.min(endIndex, creatorAddresses.length)} of {creatorAddresses.length} creators
        </div>
      </div>
    )
  }

  // List view
  if (viewMode === 'list') {
    return (
      <div className={className}>
        <div className="space-y-3 sm:space-y-4">
          {currentCreators.map((creatorAddress) => (
            <CreatorCard
              key={creatorAddress}
              creatorAddress={creatorAddress}
              variant="default"
              showSubscribeButton={true}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 sm:mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
                      className="w-8 h-8 sm:w-9 sm:h-9 p-0 text-xs sm:text-sm"
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
              className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
          Showing {startIndex + 1}-{Math.min(endIndex, creatorAddresses.length)} of {creatorAddresses.length} creators
        </div>
      </div>
    )
  }

  // Compact view for mobile/mini app
  return (
    <div className={className}>
      <div className="space-y-2 sm:space-y-3">
        {currentCreators.map((creatorAddress) => (
          <CreatorCard
            key={creatorAddress}
            creatorAddress={creatorAddress}
            variant="compact"
            showSubscribeButton={true}
          />
        ))}
      </div>

      {/* Load More for compact view */}
      {endIndex < creatorAddresses.length && (
        <div className="text-center mt-4 sm:mt-6">
          <Button 
            variant="outline" 
            className="w-full max-w-sm text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Load More Creators
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
        Showing {Math.min(endIndex, creatorAddresses.length)} of {creatorAddresses.length} creators
      </div>
    </div>
  )
}

export function CreatorsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-start gap-2 sm:gap-4">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-muted rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 sm:h-4 bg-muted rounded w-3/4" />
                <div className="h-2 sm:h-3 bg-muted rounded w-1/2" />
                <div className="h-2 sm:h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
