'use client'

import React, { Suspense } from 'react'
import { PlatformInsightsDashboard } from '@/components/analytics/PlatformInsightsDashboard'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { MiniAppWalletProvider } from '@/contexts/MiniAppWalletContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BarChart3, Shield, TrendingUp, Users, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

function MiniAppInsightsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}

function MiniAppAdminInsightsContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-purple-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Admin</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-4 mb-6">
          <div className="flex items-center justify-center gap-2">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Platform Insights</h1>
          </div>
          <p className="text-sm text-gray-600 max-w-xs mx-auto">
            Comprehensive platform analytics and administrative controls
          </p>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Admin Only
          </Badge>
        </div>

        {/* Access Control Notice */}
        <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              This section contains sensitive platform data and administrative controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Only verified platform administrators can access these analytics and management tools.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">🔐 Secure Access</Badge>
                <Badge variant="outline" className="text-xs">📊 Real-time Data</Badge>
                <Badge variant="outline" className="text-xs">⚡ Live Updates</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Guards for Admin Access */}
        <RouteGuards requiredLevel="admin">
          {/* Quick Stats Overview */}
          <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">1,250</div>
                  <div className="text-xs text-muted-foreground">Total Content</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">89</div>
                  <div className="text-xs text-muted-foreground">Active Creators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-xs text-muted-foreground">Health Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">$12.5K</div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Insights Dashboard */}
          <Suspense fallback={<MiniAppInsightsSkeleton />}>
            <PlatformInsightsDashboard />
          </Suspense>

          {/* Admin Actions */}
          <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" className="justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Review Verifications
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </RouteGuards>
      </div>
    </div>
  )
}

export default function MiniAppAdminInsightsPage() {
  return (
    <MiniAppWalletProvider>
      <MiniAppAdminInsightsContent />
    </MiniAppWalletProvider>
  )
}
