import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { PlatformInsightsDashboard } from '@/components/analytics/PlatformInsightsDashboard'
import { RouteGuards } from '@/components/layout/RouteGuards'

export const metadata: Metadata = {
  title: 'Platform Insights | Admin Dashboard',
  description: 'Comprehensive platform analytics and administrative insights'
}

export default function PlatformInsightsPage() {
  return (
    <RouteGuards requiredLevel="admin">
      <div className="container mx-auto py-8 space-y-8">
        {/* Administrative Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Platform Insights
                </h1>
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                  Admin Only
                </span>
              </div>
              <p className="text-lg text-muted-foreground">
                Comprehensive platform analytics, growth metrics, and strategic
                insights for data-driven platform management and optimization.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Insights Dashboard */}
        <Suspense fallback={<div>Loading platform insights...</div>}>
          <PlatformInsightsDashboard />
        </Suspense>

        {/* Strategic Context */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-muted/30 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold">Platform Health Monitoring</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These metrics provide early warning indicators for platform health
              issues and growth opportunities. Monitor content activity ratios,
              creator engagement trends, and revenue distribution for strategic
              planning guidance.
            </p>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6 space-y-3">
            <h3 className="font-semibold">Growth Strategy Insights</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use category performance analysis and creator ecosystem metrics
              to identify expansion opportunities, optimize creator incentives,
              and guide platform feature development priorities.
            </p>
          </div>
        </div>
      </div>
    </RouteGuards>
  )
}


