import { useState, useEffect, useCallback } from 'react'

interface AnalyticsData {
  views: number
  likes: number
  shares: number
  revenue: number
  revenueChange: number
  viewsChange: number
  likesChange: number
  sharesChange: number
  recentActivity: Array<{
    type: 'mint' | 'sale' | 'like' | 'view' | 'share'
    timestamp: string
    description: string
    value?: string
  }>
}

interface CollectionAnalytics {
  totalSupply: number
  mintedCount: number
  floorPrice: number
  totalVolume: number
  averagePrice: number
  uniqueOwners: number
  secondarySales: number
  royaltyEarnings: number
}

interface UseZoraAnalyticsReturn {
  analytics: AnalyticsData | null
  collectionAnalytics: CollectionAnalytics | null
  isLoading: boolean
  error: string | null
  refreshAnalytics: () => Promise<void>
  trackEvent: (event: string, data: Record<string, any>) => void
}

export function useZoraAnalytics(contentId?: string, collectionId?: string): UseZoraAnalyticsReturn {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [collectionAnalytics, setCollectionAnalytics] = useState<CollectionAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!contentId && !collectionId) return

    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call - replace with actual API endpoints
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockAnalytics: AnalyticsData = {
        views: Math.floor(Math.random() * 10000) + 1000,
        likes: Math.floor(Math.random() * 500) + 50,
        shares: Math.floor(Math.random() * 200) + 20,
        revenue: Math.floor(Math.random() * 5000) + 500,
        revenueChange: Math.floor(Math.random() * 40) - 20,
        viewsChange: Math.floor(Math.random() * 30) - 15,
        likesChange: Math.floor(Math.random() * 25) - 12,
        sharesChange: Math.floor(Math.random() * 20) - 10,
        recentActivity: [
          {
            type: 'view',
            timestamp: new Date().toISOString(),
            description: 'New viewer from Twitter',
            value: '1'
          },
          {
            type: 'like',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            description: 'User liked your content',
            value: '1'
          },
          {
            type: 'share',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            description: 'Shared on Discord',
            value: '1'
          }
        ]
      }

      const mockCollectionAnalytics: CollectionAnalytics = {
        totalSupply: 1000,
        mintedCount: Math.floor(Math.random() * 800) + 100,
        floorPrice: Math.random() * 2 + 0.1,
        totalVolume: Math.floor(Math.random() * 100) + 10,
        averagePrice: Math.random() * 1.5 + 0.2,
        uniqueOwners: Math.floor(Math.random() * 500) + 50,
        secondarySales: Math.floor(Math.random() * 100) + 10,
        royaltyEarnings: Math.floor(Math.random() * 1000) + 100
      }

      setAnalytics(mockAnalytics)
      setCollectionAnalytics(mockCollectionAnalytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setIsLoading(false)
    }
  }, [contentId, collectionId])

  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics()
  }, [fetchAnalytics])

  const trackEvent = useCallback((event: string, data: Record<string, any>) => {
    // This would typically send to your analytics service
    console.log('Analytics event:', event, data)
    
    // Update local analytics state
    setAnalytics(prev => {
      if (!prev) return prev
      
      switch (event) {
        case 'view':
          return { ...prev, views: prev.views + 1 }
        case 'like':
          return { ...prev, likes: prev.likes + 1 }
        case 'share':
          return { ...prev, shares: prev.shares + 1 }
        default:
          return prev
      }
    })
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    analytics,
    collectionAnalytics,
    isLoading,
    error,
    refreshAnalytics,
    trackEvent
  }
}

// Helper hook for real-time analytics updates
export function useRealtimeAnalytics(contentId?: string) {
  const [realTimeData, setRealTimeData] = useState({
    currentViewers: 0,
    recentLikes: 0,
    recentShares: 0
  })

  useEffect(() => {
    if (!contentId) return

    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        currentViewers: Math.floor(Math.random() * 50),
        recentLikes: Math.floor(Math.random() * 5),
        recentShares: Math.floor(Math.random() * 3)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [contentId])

  return realTimeData
}

// Helper hook for analytics comparison
export function useAnalyticsComparison(currentData: AnalyticsData | null, previousData: AnalyticsData | null) {
  const comparison = {
    viewsGrowth: 0,
    likesGrowth: 0,
    sharesGrowth: 0,
    revenueGrowth: 0
  }

  if (currentData && previousData) {
    comparison.viewsGrowth = ((currentData.views - previousData.views) / previousData.views) * 100
    comparison.likesGrowth = ((currentData.likes - previousData.likes) / previousData.likes) * 100
    comparison.sharesGrowth = ((currentData.shares - previousData.shares) / previousData.shares) * 100
    comparison.revenueGrowth = ((currentData.revenue - previousData.revenue) / previousData.revenue) * 100
  }

  return comparison
}
