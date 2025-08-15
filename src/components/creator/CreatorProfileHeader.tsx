import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatAddress, formatCurrency } from '@/lib/utils'
import { type Address } from 'viem'
import { Users, FileText, Star } from 'lucide-react'

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
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!creatorProfile.data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Creator not found</p>
        </CardContent>
      </Card>
    )
  }

  const creator = creatorProfile.data

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {formatAddress(creatorAddress)}
              {creator.isVerified && (
                <Badge className="ml-2">Verified</Badge>
              )}
            </h1>
            
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
          
          {/* Subscription CTA - ADD THIS */}
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
