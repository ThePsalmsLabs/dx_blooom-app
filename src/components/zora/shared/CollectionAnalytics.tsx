import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/seperator'
import { TrendingUp, TrendingDown, Eye, Heart, Share2, DollarSign, Users } from 'lucide-react'

interface CollectionAnalyticsProps {
  collectionData: {
    name: string
    totalSupply: number
    mintedCount: number
    floorPrice: number
    totalVolume: number
  }
  analytics: {
    views: number
    likes: number
    shares: number
    revenue: number
    revenueChange: number
    viewsChange: number
    likesChange: number
  }
  recentActivity: Array<{
    type: 'mint' | 'sale' | 'like' | 'view'
    timestamp: string
    description: string
    value?: string
  }>
  className?: string
}

export default function CollectionAnalytics({
  collectionData,
  analytics,
  recentActivity,
  className = ''
}: CollectionAnalyticsProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint': return '🎨'
      case 'sale': return '💰'
      case 'like': return '❤️'
      case 'view': return '👁️'
      default: return '📊'
    }
  }

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Collection Analytics</span>
          <Badge variant="outline">{collectionData.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Supply</span>
              <span className="text-sm font-medium">
                {collectionData.mintedCount} / {collectionData.totalSupply}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(collectionData.mintedCount / collectionData.totalSupply) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Floor Price</span>
              <span className="text-sm font-medium">{collectionData.floorPrice} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Volume</span>
              <span className="text-sm font-medium">{collectionData.totalVolume} ETH</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Analytics Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Views</span>
              {getChangeIndicator(analytics.viewsChange)}
            </div>
            <div className="text-2xl font-bold">{analytics.views.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              {analytics.viewsChange > 0 ? '+' : ''}{analytics.viewsChange}% from last week
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Likes</span>
              {getChangeIndicator(analytics.likesChange)}
            </div>
            <div className="text-2xl font-bold">{analytics.likes.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              {analytics.likesChange > 0 ? '+' : ''}{analytics.likesChange}% from last week
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Share2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Shares</span>
            </div>
            <div className="text-2xl font-bold">{analytics.shares.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total shares</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Revenue</span>
              {getChangeIndicator(analytics.revenueChange)}
            </div>
            <div className="text-2xl font-bold">${analytics.revenue.toLocaleString()}</div>
            <div className="text-xs text-gray-500">
              {analytics.revenueChange > 0 ? '+' : ''}{analytics.revenueChange}% from last week
            </div>
          </div>
        </div>

        <Separator />

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Recent Activity</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
                {activity.value && (
                  <Badge variant="outline" className="text-xs">
                    {activity.value}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1" size="sm">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Details
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Community
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
