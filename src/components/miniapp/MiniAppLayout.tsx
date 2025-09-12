/**
 * MiniApp Layout Component
 * File: src/components/miniapp/MiniAppLayout.tsx
 * 
 * A modern layout wrapper for mini app pages that provides:
 * - Ultra-modern navigation
 * - Theme context
 * - Proper spacing for fixed navigation
 * - Error boundaries
 * - Performance optimizations
 */

'use client'

import React, { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import MiniAppNavigation from './MiniAppNavigation'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MiniAppLayoutProps {
  children: React.ReactNode
  className?: string
}

function MiniAppLayoutErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The mini app encountered an error. This usually resolves quickly.
          </p>
          <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
            {error.message}
          </div>
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MiniAppLayoutSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="hidden sm:block space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-11 w-24 rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="pt-20 pb-32 px-4 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
      
      {/* Bottom navigation skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-4">
        <div className="mx-4">
          <Skeleton className="h-20 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  )
}

export function MiniAppLayout({ children, className }: MiniAppLayoutProps) {
  return (
    <ErrorBoundary
      FallbackComponent={MiniAppLayoutErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Layout Error:', error, errorInfo)
        // In production, send to error reporting service
      }}
    >
      <div className={`min-h-screen bg-background ${className || ''}`}>
        {/* Navigation */}
        <Suspense fallback={<MiniAppLayoutSkeleton />}>
          <MiniAppNavigation />
        </Suspense>
        
        {/* Main Content */}
        <main className="pt-16 pb-32 min-h-screen">
          <Suspense fallback={<MiniAppLayoutSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default MiniAppLayout