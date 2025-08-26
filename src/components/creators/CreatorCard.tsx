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
  onClick?: () => void
}

export function CreatorCard({ 
  creatorAddress, 
  variant = 'default',
  showSubscribeButton = true,
  className,
  onClick 
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
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${className}`} onClick={onClick}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} />
              <AvatarFallback className="text-xs sm:text-sm">
                {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <h3 className="font-medium text-xs sm:text-sm truncate">
                  {formatAddress(creatorAddress)}
                </h3>
                {creator.isVerified && (
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground mt-1">
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

            <div className="flex flex-col items-end gap-1 sm:gap-2">
              <div className="text-xs text-muted-foreground">
                {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}/mo
              </div>
              {showSubscribeButton && (
                <SubscribeButton
                  creatorAddress={creatorAddress}
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 sm:h-7 px-2 sm:px-3"
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
        <CardHeader className="text-center pb-3 sm:pb-4">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4">
            <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} />
            <AvatarFallback className="text-sm sm:text-lg">
              {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2">
              <h3 className="font-bold text-sm sm:text-lg">{formatAddress(creatorAddress)}</h3>
              {creator.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs">
              Creator Since {new Date(Number(creator.registrationTime) * 1000).getFullYear()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {formatCurrency(creator.totalEarnings, 6, 'USDC')}
              </div>
              <div className="text-xs text-muted-foreground">Total Earned</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {creator.subscriberCount}
              </div>
              <div className="text-xs text-muted-foreground">Subscribers</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-purple-600">
                {creator.contentCount}
              </div>
              <div className="text-xs text-muted-foreground">Content</div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 sm:p-4 rounded-lg text-center">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Monthly Subscription</div>
            <div className="text-lg sm:text-xl font-bold text-blue-600">
              {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleViewProfile} className="w-full text-xs sm:text-sm h-8 sm:h-9">
              View Profile
            </Button>
            {showSubscribeButton && (
              <SubscribeButton
                creatorAddress={creatorAddress}
                variant="outline"
                className="w-full text-xs sm:text-sm h-8 sm:h-9"
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${className}`} onClick={onClick}>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
            <AvatarImage src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} />
            <AvatarFallback className="text-sm sm:text-base">
              {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <h3 className="font-semibold text-sm sm:text-lg truncate">{formatAddress(creatorAddress)}</h3>
              {creator.isVerified && (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                {creator.subscriberCount} subscribers
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                {creator.contentCount} content
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                {formatCurrency(creator.totalEarnings, 6, 'USDC')} earned
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">Monthly Subscription</div>
                <div className="text-sm sm:text-lg font-bold text-blue-600">
                  {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}
                </div>
              </div>
              
              <div className="flex gap-1 sm:gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleViewProfile}
                  size="sm"
                  className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                >
                  View Profile
                </Button>
                {showSubscribeButton && (
                  <SubscribeButton
                    creatorAddress={creatorAddress}
                    size="sm"
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 sm:h-4 bg-muted rounded w-24 mb-1 sm:mb-2" />
            <div className="h-2 sm:h-3 bg-muted rounded w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
