import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatAddress, formatCurrency } from '@/lib/utils'
import { type Address } from 'viem'
import { Users, FileText, Star, CheckCircle } from 'lucide-react'

// Import hooks and components
import { useCreatorProfile } from '@/hooks/contracts/core'
import { CreatorSubscriptionPurchase } from '@/components/subscription'

interface CreatorProfileHeaderProps {
  creatorAddress: Address
}

export function CreatorProfileHeader({ creatorAddress }: CreatorProfileHeaderProps) {
  const creatorProfile = useCreatorProfile(creatorAddress)
  
  if (creatorProfile.isLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-2/3 sm:w-1/3 mb-3 sm:mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 sm:w-1/4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 sm:w-1/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!creatorProfile.data) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-6 text-center">
          <p className="text-sm sm:text-base text-muted-foreground">Creator not found</p>
        </CardContent>
      </Card>
    )
  }

  const creator = creatorProfile.data

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        {/* Mobile Layout - Stacked */}
        <div className="lg:hidden space-y-4">
          {/* Creator Info */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 sm:mb-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {formatAddress(creatorAddress)}
              </h1>
              {creator.isVerified && (
                <Badge className="text-xs sm:text-sm">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            {/* Stats - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-4">
              <div className="flex items-center justify-center sm:justify-start gap-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{creator.subscriberCount} subscribers</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{creator.contentCount} content pieces</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1">
                <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>
                  {creator.totalEarnings ? 
                    formatCurrency(creator.totalEarnings, 6, 'USDC') : 
                    '$0'} earned
                </span>
              </div>
            </div>
          </div>
          
          {/* Mobile Subscription CTA */}
          <div className="w-full">
            <CreatorSubscriptionPurchase
              creatorAddress={creatorAddress}
              variant="compact"
              showCreatorInfo={false}
              className="w-full"
            />
          </div>
        </div>

        {/* Desktop Layout - Side by side */}
        <div className="hidden lg:flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold">
                {formatAddress(creatorAddress)}
              </h1>
              {creator.isVerified && (
                <Badge className="text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-6 text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {creator.subscriberCount} subscribers
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {creator.contentCount} content pieces
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {creator.totalEarnings ? 
                  formatCurrency(creator.totalEarnings, 6, 'USDC') : 
                  '$0'} earned
              </span>
            </div>
          </div>
          
          {/* Desktop Subscription CTA */}
          <div className="ml-6">
            <CreatorSubscriptionPurchase
              creatorAddress={creatorAddress}
              variant="compact"
              showCreatorInfo={false}
              className="min-w-[280px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
