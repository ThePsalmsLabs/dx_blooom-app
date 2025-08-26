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

dd . 
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
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
      <Card 
        className={`group hover:shadow-md transition-all duration-200 cursor-pointer border-border/50 hover:border-border ${className}`} 
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-background">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} 
                alt={`${formatAddress(creatorAddress)} avatar`}
              />
              <AvatarFallback className="text-xs font-medium bg-muted">
                {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="font-medium text-sm truncate text-foreground">
                  {formatAddress(creatorAddress)}
                </h3>
                {creator.isVerified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 min-w-0">
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{creator.subscriberCount}</span>
                </span>
                <span className="flex items-center gap-1 min-w-0">
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{creator.contentCount}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <div className="text-xs font-medium text-blue-600 whitespace-nowrap">
                {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}/mo
              </div>
              {showSubscribeButton && (
                <SubscribeButton
                  creatorAddress={creatorAddress}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs whitespace-nowrap"
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
      <Card className={`group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-border/50 hover:border-border ${className}`}>
        <CardHeader className="text-center pb-4">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 ring-4 ring-background shadow-lg">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} 
              alt={`${formatAddress(creatorAddress)} avatar`}
            />
            <AvatarFallback className="text-lg font-semibold bg-muted">
              {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h3 className="font-bold text-base sm:text-lg text-foreground truncate">
                {formatAddress(creatorAddress)}
              </h3>
              {creator.isVerified && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            <Badge variant="outline" className="mb-4 text-xs px-3 py-1">
              Creator Since {new Date(Number(creator.registrationTime) * 1000).getFullYear()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-1 min-w-0">
              <div className="text-lg sm:text-xl font-bold text-green-600 truncate">
                {formatCurrency(creator.totalEarnings, 6, 'USDC')}
              </div>
              <div className="text-xs text-muted-foreground">Total Earned</div>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-lg sm:text-xl font-bold text-blue-600 truncate">
                {creator.subscriberCount}
              </div>
              <div className="text-xs text-muted-foreground">Subscribers</div>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-lg sm:text-xl font-bold text-purple-600 truncate">
                {creator.contentCount}
              </div>
              <div className="text-xs text-muted-foreground">Content</div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg text-center">
            <div className="text-xs text-muted-foreground mb-1">Monthly Subscription</div>
            <div className="text-lg font-bold text-blue-600 truncate">
              {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleViewProfile} 
              className="w-full text-sm h-9"
            >
              View Profile
            </Button>
            {showSubscribeButton && (
              <SubscribeButton
                creatorAddress={creatorAddress}
                variant="outline"
                className="w-full text-sm h-9"
              />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant - Restructured to prevent overflow
  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-border h-full ${className}`} 
      onClick={onClick}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex items-start gap-3 mb-4 min-w-0">
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 ring-2 ring-background">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${creatorAddress}`} 
              alt={`${formatAddress(creatorAddress)} avatar`}
            />
            <AvatarFallback className="text-sm font-medium bg-muted">
              {formatAddress(creatorAddress).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm sm:text-base truncate text-foreground">
                {formatAddress(creatorAddress)}
              </h3>
              {creator.isVerified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 min-w-0">
                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{creator.subscriberCount} subscribers</span>
              </span>
              <span className="flex items-center gap-1 min-w-0">
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{creator.contentCount} content</span>
              </span>
              <span className="flex items-center gap-1 min-w-0">
                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{formatCurrency(creator.totalEarnings, 6, 'USDC')} earned</span>
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="mb-4 min-w-0">
          <div className="text-xs text-muted-foreground mb-1">Monthly Subscription</div>
          <div className="text-sm sm:text-base font-bold text-blue-600 truncate">
            {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex gap-2 mt-auto">
          <Button 
            variant="outline" 
            onClick={handleViewProfile}
            size="sm"
            className="text-xs h-7 px-2.5 flex-1 min-w-0"
          >
            <span className="truncate">View Profile</span>
          </Button>
          {showSubscribeButton && (
            <SubscribeButton
              creatorAddress={creatorAddress}
              size="sm"
              className="text-xs h-7 px-2.5 flex-1 min-w-0"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CreatorCardSkeleton({ variant }: { variant: string }) {
  if (variant === 'compact') {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-2 bg-muted rounded w-16" />
            </div>
            <div className="w-12 h-6 bg-muted rounded flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'featured') {
    return (
      <Card className="animate-pulse">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full mx-auto mb-4" />
          <div className="space-y-2 min-w-0">
            <div className="h-4 bg-muted rounded w-32 mx-auto" />
            <div className="h-3 bg-muted rounded w-24 mx-auto" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-5 bg-muted rounded" />
                <div className="h-2 bg-muted rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
          <div className="h-16 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-9 bg-muted rounded" />
            <div className="h-9 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
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
  )
}
