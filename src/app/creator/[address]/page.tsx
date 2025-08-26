'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { type Address } from 'viem'
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { CreatorProfileHeader } from '@/components/creator/CreatorProfileHeader'
import { CreatorSubscriptionPurchase } from '@/components/subscription'

export default function CreatorProfilePage() {
  const params = useParams()
  const creatorAddress = params.address as Address

  return (
    <AppLayout>
      <RouteGuards requiredLevel="public">
        {/* Mobile-first responsive container */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Responsive grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content Area - Responsive column spans */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Creator Profile Header */}
              <CreatorProfileHeader creatorAddress={creatorAddress} />
              
              {/* Creator Content Grid - Responsive placeholder */}
              <div className="bg-muted p-4 sm:p-6 lg:p-8 rounded-lg text-center">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3 lg:mb-4">
                  Creator Content
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Content grid will be implemented here
                </p>
              </div>
            </div>
            
            {/* Sidebar - Stacks on mobile, fixed on desktop */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Subscription Card - Responsive sizing */}
              <div className="sticky top-4 lg:top-6">
                <CreatorSubscriptionPurchase 
                  creatorAddress={creatorAddress}
                  onSubscriptionSuccess={() => {
                    // Refresh page data
                    window.location.reload()
                  }}
                  className="w-full"
                />
              </div>
              
              {/* Creator Stats - Responsive card */}
              <div className="bg-muted p-4 sm:p-6 rounded-lg">
                <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">
                  Creator Stats
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Additional creator statistics will be displayed here
                </p>
              </div>
            </div>
          </div>
        </div>
      </RouteGuards>
    </AppLayout>
  )
}
