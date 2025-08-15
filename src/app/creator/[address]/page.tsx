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
        <div className="container mx-auto py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Creator Info */}
            <div className="lg:col-span-3 space-y-8">
              <CreatorProfileHeader creatorAddress={creatorAddress} />
              
              {/* Creator Content Grid - Placeholder for now */}
              <div className="bg-muted p-8 rounded-lg text-center">
                <h2 className="text-xl font-semibold mb-2">Creator Content</h2>
                <p className="text-muted-foreground">
                  Content grid will be implemented here
                </p>
              </div>
            </div>
            
            {/* Subscription Sidebar - ADD THIS */}
            <div className="space-y-6">
              <CreatorSubscriptionPurchase 
                creatorAddress={creatorAddress}
                onSubscriptionSuccess={() => {
                  // Refresh page data
                  window.location.reload()
                }}
              />
              
              {/* Creator Stats - Placeholder */}
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Creator Stats</h3>
                <p className="text-muted-foreground text-sm">
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
