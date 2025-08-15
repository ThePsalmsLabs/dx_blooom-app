import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { 
  Crown, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  DollarSign 
} from 'lucide-react'
import { formatCurrency, formatAddress } from '@/lib/utils'
import { useCreatorProfile } from '@/hooks/contracts/core'
import type { Address } from 'viem'

interface CreatorLeaderboardProps {
  creatorAddresses: readonly Address[]
  metric: 'earnings' | 'subscribers' | 'content'
  title: string
  maxItems?: number
  showRanking?: boolean
  className?: string
}

export function CreatorLeaderboard({
  creatorAddresses,
  metric,
  title,
  maxItems = 10,
  showRanking = true,
  className
}: CreatorLeaderboardProps) {
  const router = useRouter()

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="h-5 w-5 text-yellow-500" />
      case 1: return <Medal className="h-5 w-5 text-gray-400" />
      case 2: return <Award className="h-5 w-5 text-orange-500" />
      default: return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
    }
  }

  const getMetricIcon = () => {
    switch (metric) {
      case 'earnings': return <DollarSign className="h-4 w-4 text-green-600" />
      case 'subscribers': return <Users className="h-4 w-4 text-blue-600" />
      case 'content': return <TrendingUp className="h-4 w-4 text-purple-600" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getMetricIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {creatorAddresses.slice(0, maxItems).map((address, index) => (
          <CreatorLeaderboardItem
            key={address}
            creatorAddress={address}
            rank={index + 1}
            rankIcon={showRanking ? getRankIcon(index) : undefined}
            metric={metric}
            onClick={() => router.push(`/creator/${address}`)}
          />
        ))}
        
        {creatorAddresses.length > maxItems && (
          <Button variant="ghost" className="w-full mt-4">
            View Full Leaderboard
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function CreatorLeaderboardItem({
  creatorAddress,
  rank,
  rankIcon,
  metric,
  onClick
}: {
  creatorAddress: Address
  rank: number
  rankIcon?: React.ReactNode
  metric: 'earnings' | 'subscribers' | 'content'
  onClick: () => void
}) {
  const creatorProfile = useCreatorProfile(creatorAddress)

  if (!creatorProfile.data) {
    return (
      <div className="flex items-center gap-3 p-2 animate-pulse">
        <div className="w-8 h-8 bg-muted rounded" />
        <div className="w-10 h-10 bg-muted rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-24 mb-1" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
        <div className="h-4 bg-muted rounded w-20" />
      </div>
    )
  }

  const creator = creatorProfile.data

  const getMetricValue = () => {
    switch (metric) {
      case 'earnings':
        return formatCurrency(creator.totalEarnings, 6, 'USDC')
      case 'subscribers':
        return creator.subscriberCount.toLocaleString()
      case 'content':
        return creator.contentCount.toString()
    }
  }

  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center">
        {rankIcon}
      </div>

      {/* Avatar */}
      <Avatar className="w-10 h-10">
        <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} />
        <AvatarFallback>
          {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Creator Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {formatAddress(creatorAddress)}
          </span>
          {creator.isVerified && (
            <Badge variant="secondary" className="text-xs">Verified</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {creator.subscriberCount} subscribers
        </div>
      </div>

      {/* Metric Value */}
      <div className="text-right">
        <div className="font-bold text-sm">
          {getMetricValue()}
        </div>
        <div className="text-xs text-muted-foreground">
          {metric}
        </div>
      </div>
    </div>
  )
}
