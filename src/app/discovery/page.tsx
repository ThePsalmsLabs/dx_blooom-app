import React from 'react'
import { Metadata } from 'next'
import { ContentDiscoveryInterface } from '@/components/content/ContentDiscoveryInterface'
import { RouteGuards } from '@/components/layout/RouteGuards'

export const metadata: Metadata = {
  title: 'Content Discovery | Creator Platform',
  description: 'Discover content with advanced filtering, search, and personalization'
}

export default function DiscoveryPage() {
  return (
    <RouteGuards requiredLevel="wallet_connected">
      <div className="container mx-auto py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Content Discovery
            </h1>
            <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded">
              Enhanced
            </span>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Explore our content library with advanced filtering, intelligent search, 
            and personalized recommendations powered by onchain analytics.
          </p>
        </div>

        {/* Main Discovery Interface */}
        <ContentDiscoveryInterface />
      </div>
    </RouteGuards>
  )
}


