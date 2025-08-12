import React from 'react'
import { Metadata } from 'next'
import { ContentManagementDashboard } from '@/components/creator/ContentManagementDashboard'
import { RouteGuards } from '@/components/layout/RouteGuards'

export const metadata: Metadata = {
  title: 'Content Management | Creator Dashboard',
  description: 'Upload, edit, and manage your content with advanced tools'
}

export default function ContentManagementPage() {
  return (
    <RouteGuards requiredLevel="creator_basic">
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Content Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload new content, manage existing content, and optimize your content
            strategy with integrated analytics and discovery insights.
          </p>
        </div>

        {/* Enhanced Content Management */}
        <ContentManagementDashboard />
      </div>
    </RouteGuards>
  )
}


