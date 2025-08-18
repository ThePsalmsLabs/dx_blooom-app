'use client'

import React from 'react'
import { Suspense } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { ContentBrowser } from '@/components/content/ContentBrowser'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Enhanced Browse Page - Responsive Content Discovery
 * 
 * This page demonstrates the new unified responsive content browser
 * that intelligently adapts to different screen sizes while maintaining
 * optimal user experience across all devices.
 * 
 * Features:
 * - Intelligent grid layout that calculates optimal columns
 * - Seamless sidebar transitions
 * - Theme-aware design
 * - Mobile-first responsive design
 * - Integration with existing smart contract infrastructure
 */

function BrowsePageSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EnhancedBrowsePage() {
  return (
    <AppLayout>
      <RouteGuards 
        requiredLevel="public"
      >
        <Suspense fallback={<BrowsePageSkeleton />}>
          <ContentBrowser 
            className="min-h-screen"
            showSidebar={true}
          />
        </Suspense>
      </RouteGuards>
    </AppLayout>
  )
}
