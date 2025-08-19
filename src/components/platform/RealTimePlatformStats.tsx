import React, { useMemo } from 'react'
import { Users, FileText, DollarSign, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlatformAnalytics } from '@/hooks/contracts/analytics/usePlatformAnalytics'
import { useAllCreators, type CreatorWithAddress } from '@/hooks/contracts/useAllCreators.optimized'
import { formatNumber } from '@/lib/utils'

interface RealTimePlatformStatsProps {
  className?: string
  compact?: boolean
}

/**
 * Real-Time Platform Stats Component
 * 
 * This component replaces the hardcoded mock data in your homepage with actual
 * contract data. It demonstrates how Web3 applications should display live
 * blockchain state rather than static placeholders.
 * 
 * Key Features:
 * - Fetches real content count from your ContentRegistry contract
 * - Shows actual creator statistics from CreatorRegistry
 * - Displays loading states during contract calls
 * - Handles error states gracefully with retry options
 * - Updates automatically when new content is registered
 * 
 * Integration Points:
 * - Uses your existing usePlatformAnalytics hook
 * - Leverages your useAllCreators hook for creator data
 * - Follows your established design token patterns
 * - Maintains consistency with your existing UI components
 */
export function RealTimePlatformStats({ className, compact = false }: RealTimePlatformStatsProps) {
  // Fetch real-time platform analytics from your contracts
  const {
    platformStats,
    creatorStats,
    isLoading: platformLoading,
    isError: platformError,
    error: platformErrorDetails,
    refetch: refetchPlatform
  } = usePlatformAnalytics()

  // Fetch creator data using your existing hook
  const {
    creators,
    totalCount: creatorTotalCount,
    isLoading: _creatorsLoading,
    isError: creatorsError,
    retryFailed: retryCreators
  } = useAllCreators()

  // Process the real contract data into display-ready format
  const processedStats = useMemo(() => {
    // If we don't have platform stats yet, return loading state
    if (!platformStats || platformLoading) {
      return {
        isLoading: true,
        totalContent: undefined,
        activeContent: undefined,
        totalCreators: undefined,
        verifiedCreators: undefined,
        totalEarnings: undefined
      }
    }

    // Calculate verified creators count from the creators array
    const verifiedCreatorsCount = creators?.filter((c: CreatorWithAddress) => c.profile.isVerified)?.length || 0

    // Calculate total earnings from all creators
    const totalEarnings = creators?.reduce((sum: number, creator: CreatorWithAddress) => {
      return sum + Number(creator.profile.totalEarnings || 0)
    }, 0) || 0

    return {
      isLoading: false,
      // Use actual contract data - this fixes your "0+" issue!
      totalContent: Number(platformStats.totalContent),
      activeContent: Number(platformStats.activeContent),
      totalCreators: Number(creatorTotalCount || creatorStats?.totalCreators || 0),
      verifiedCreators: verifiedCreatorsCount,
      totalEarnings: totalEarnings
    }
  }, [platformStats, platformLoading, creators, creatorTotalCount, creatorStats])

  // Handle error states with user-friendly messaging
  if (platformError || creatorsError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-medium text-red-900">Unable to Load Platform Stats</h3>
              <p className="text-sm text-red-700 mt-1">
                {platformErrorDetails?.message || 'Failed to fetch data from blockchain'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchPlatform()
                retryCreators()
              }}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render the actual platform statistics
  return (
    <div className={className}>
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Content - This fixes your "0+" issue */}
        <div className="text-center">
          {processedStats.isLoading ? (
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {formatNumber(processedStats.totalContent || 0)}+
            </div>
          )}
          <div className="text-xs md:text-sm text-muted-foreground">Pieces of Content</div>
          {!compact && processedStats.activeContent !== undefined && (
            <div className="text-xs text-green-600 mt-1">
              {formatNumber(processedStats.activeContent)} active
            </div>
          )}
        </div>

        {/* Active Creators */}
        <div className="text-center">
          {processedStats.isLoading ? (
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {formatNumber(processedStats.totalCreators || 0)}+
            </div>
          )}
          <div className="text-xs md:text-sm text-muted-foreground">Active Creators</div>
        </div>

        {/* Verified Creators */}
        <div className="text-center">
          {processedStats.isLoading ? (
            <Skeleton className="h-8 w-16 mx-auto mb-2" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {formatNumber(processedStats.verifiedCreators || 0)}
            </div>
          )}
          <div className="text-xs md:text-sm text-muted-foreground">Verified Creators</div>
        </div>

        {/* Total Earnings */}
        <div className="text-center">
          {processedStats.isLoading ? (
            <Skeleton className="h-8 w-20 mx-auto mb-2" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-primary">
              ${formatNumber(processedStats.totalEarnings || 0)}
            </div>
          )}
          <div className="text-xs md:text-sm text-muted-foreground">Creator Earnings</div>
        </div>
      </div>

      {/* Enhanced Stats Cards (for non-compact view) */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Content Statistics Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  {processedStats.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold">
                        {formatNumber(processedStats.totalContent || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Content
                      </div>
                      {processedStats.activeContent !== undefined && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {formatNumber(processedStats.activeContent)} active
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creator Statistics Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  {processedStats.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold">
                        {formatNumber(processedStats.totalCreators || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Registered Creators
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {formatNumber(processedStats.verifiedCreators || 0)} verified
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Statistics Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  {processedStats.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold">
                        ${formatNumber(processedStats.totalEarnings || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Creator Earnings
                      </div>
                      {processedStats.totalCreators && processedStats.totalCreators > 0 && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          ${Math.round((processedStats.totalEarnings || 0) / processedStats.totalCreators)} avg
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Health Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  {processedStats.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ) : (
                    <>
                      <div className="font-semibold">
                        {processedStats.totalContent && processedStats.activeContent 
                          ? Math.round((processedStats.activeContent / processedStats.totalContent) * 100)
                          : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Content Active Rate
                      </div>
                      <Badge 
                        variant={
                          processedStats.totalContent && processedStats.activeContent 
                            ? (processedStats.activeContent / processedStats.totalContent) > 0.8 
                              ? "default" 
                              : "secondary"
                            : "secondary"
                        } 
                        className="text-xs mt-1"
                      >
                        {processedStats.totalContent && processedStats.activeContent 
                          ? (processedStats.activeContent / processedStats.totalContent) > 0.8 
                            ? "Healthy" 
                            : "Growing"
                          : "Loading"
                        }
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Indicator */}
      {processedStats.isLoading && (
        <div className="flex items-center justify-center text-muted-foreground text-sm mt-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading real-time platform data...
        </div>
      )}

      {/* Data Freshness Indicator */}
      {!processedStats.isLoading && !compact && (
        <div className="text-center mt-4">
          <Badge variant="outline" className="text-xs">
            Live data from blockchain
          </Badge>
        </div>
      )}
    </div>
  )
}

/**
 * Example Usage in your HomePage component:
 * 
 * Replace your existing hardcoded stats section with:
 * 
 * import { RealTimePlatformStats } from '@/components/platform/RealTimePlatformStats'
 * 
 * // In your CreatorsSection component:
 * <RealTimePlatformStats className="mb-8" />
 * 
 * // Or for a compact version:
 * <RealTimePlatformStats compact className="mb-6" />
 */