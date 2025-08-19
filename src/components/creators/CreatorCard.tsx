import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  FileText, 
  CheckCircle2,
  TrendingUp
} from 'lucide-react'
import { formatCurrency, formatAddress } from '@/lib/utils'
import { useCreatorProfile } from '@/hooks/contracts/core'
import { SubscribeButton } from '@/components/subscription/SubscribeButton'
import type { Address } from 'viem'

interface CreatorCardProps {
  creatorAddress: Address
  variant?: 'default' | 'compact' | 'featured'
  showSubscribeButton?: boolean
  className?: string
}

export function CreatorCard({ 
  creatorAddress, 
  variant = 'default',
  showSubscribeButton = true,
  className 
}: CreatorCardProps) {
  const router = useRouter()
  const creatorProfile = useCreatorProfile(creatorAddress)

  const handleViewProfile = () => {
    router.push(`/creator/${creatorAddress}`)
  }

  if (creatorProfile.isLoading) {
    return <CreatorCardSkeleton variant={variant} />
  }

  if (!creatorProfile.data) {
    return null
  }

  const creator = creatorProfile.data

  // Compact variant for mobile/mini app
  if (variant === 'compact') {
    return (
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} />
              <AvatarFallback>
                {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">
                  {formatAddress(creatorAddress)}
                </h3>
                {creator.isVerified && (
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {creator.subscriberCount}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {creator.contentCount}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-muted-foreground">
                {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}/mo
              </div>
              {showSubscribeButton && (
                <SubscribeButton
                  creatorAddress={creatorAddress}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 px-2"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Featured variant for hero sections
  if (variant === 'featured') {
    return (
      <Card className={`hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
        <CardHeader className="text-center pb-4">
          <Avatar className="w-20 h-20 mx-auto mb-4">
            <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} />
            <AvatarFallback className="text-lg">
              {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="font-bold text-lg">{formatAddress(creatorAddress)}</h3>
              {creator.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            <Badge variant="outline" className="mb-4">
              Creator Since {new Date(Number(creator.registrationTime) * 1000).getFullYear()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(creator.totalEarnings, 6, 'USDC')}
              </div>
              <div className="text-xs text-muted-foreground">Total Earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {creator.subscriberCount}
              </div>
              <div className="text-xs text-muted-foreground">Subscribers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {creator.contentCount}
              </div>
              <div className="text-xs text-muted-foreground">Content</div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">Monthly Subscription</div>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleViewProfile} className="w-full">
              View Profile
            </Button>
            {showSubscribeButton && (
              <SubscribeButton
                creatorAddress={creatorAddress}
                variant="outline"
                className="w-full"
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} />
            <AvatarFallback>
              {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{formatAddress(creatorAddress)}</h3>
              {creator.isVerified && (
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {creator.subscriberCount} subscribers
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {creator.contentCount} content
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {formatCurrency(creator.totalEarnings, 6, 'USDC')} earned
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Monthly Subscription</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleViewProfile}>
                  View Profile
                </Button>
                {showSubscribeButton && (
                  <SubscribeButton
                    creatorAddress={creatorAddress}
                    size="sm"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

function CreatorCardSkeleton({ variant }: { variant: string }) {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-3 bg-muted rounded w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
