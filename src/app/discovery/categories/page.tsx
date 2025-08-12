import React from 'react'
import { Metadata } from 'next'
import { ContentDiscoveryInterface } from '@/components/content/ContentDiscoveryInterface'
import { RouteGuards } from '@/components/layout/RouteGuards'

export const metadata: Metadata = {
  title: 'Browse by Category | Creator Platform',
  description: 'Explore content organized by categories and topics'
}

export default function CategoriesPage() {
  return (
    <RouteGuards requiredLevel="wallet_connected">
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Browse by Category
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover content organized by topic and category for easier exploration.
          </p>
        </div>

        {/* Category-focused discovery interface */}
        <ContentDiscoveryInterface />
      </div>
    </RouteGuards>
  )
}


