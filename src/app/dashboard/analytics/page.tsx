import React from 'react'
import { Metadata } from 'next'
import { CreatorAnalyticsDashboard } from '@/components/analytics/CreatorAnalyticsDashboard'
import { RouteGuards } from '@/components/layout/RouteGuards'

export const metadata: Metadata = {
  title: 'Creator Analytics | Creator Platform',
  description: 'Comprehensive analytics and insights for content creators'
}

export default function CreatorAnalyticsPage() {
  return (
    <RouteGuards requiredLevel="creator_basic">
      <div className="container mx-auto py-8 space-y-8">
        {/* Page Header with Context */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Creator Analytics
                </h1>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  Advanced Insights
                </span>
              </div>
              <p className="text-lg text-muted-foreground">
                Deep dive into your content performance with comprehensive analytics,
                earnings optimization insights, and audience growth tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <CreatorAnalyticsDashboard />

        {/* Educational Context */}
        <div className="bg-muted/30 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-lg">Understanding Your Analytics</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These metrics combine onchain data from your smart contracts with calculated
            insights to help you optimize your content strategy. Use the comparative
            analysis to understand how your performance relates to platform averages,
            and leverage the recommendations to improve engagement and revenue.
          </p>
        </div>
      </div>
    </RouteGuards>
  )
}


