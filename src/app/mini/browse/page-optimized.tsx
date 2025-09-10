/**
 * Optimized MiniApp Browse Page - Performance Fixed
 * File: src/app/mini/browse/page-optimized.tsx
 * 
 * This is a completely rewritten browse page that prevents freezing:
 * 
 * FIXES APPLIED:
 * 1. Minimal component hierarchy
 * 2. No heavy providers or contexts
 * 3. Lazy loading with Suspense
 * 4. Error boundaries for resilience
 * 5. Mock data by default with optional real data
 * 6. Circuit breaker for RPC failures
 */

'use client'

import React, { Suspense, useState, useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useRouter } from 'next/navigation'

import {
  AlertCircle,
  RefreshCw,
  Settings,
  ToggleLeft,
  ToggleRight,
  Loader2
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Switch
} from '@/components/ui/index'

import { OptimizedMiniAppContentBrowser } from '@/components/content/OptimizedMiniAppContentBrowser'

// ================================================
// ERROR BOUNDARY COMPONENT
// ================================================

function BrowseErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error
  resetErrorBoundary: () => void 
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-lg font-semibold">Browse Error</h2>
              <p className="text-sm text-muted-foreground mt-1">
                The content browser encountered an issue.
              </p>
            </div>
            
            <Alert className="text-left">
              <AlertDescription className="text-xs font-mono">
                {error.message}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="default"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button 
                onClick={resetErrorBoundary} 
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// LOADING COMPONENT
// ================================================

function BrowseLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
          </div>
          <div className="h-9 bg-muted rounded w-24 animate-pulse" />
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-4">
                <div className="aspect-video bg-muted rounded-lg mb-3 animate-pulse" />
                <div className="space-y-3">
                  <div>
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 mt-1 animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                    <div className="h-5 bg-muted rounded w-20 animate-pulse" />
                  </div>
                  <div className="h-8 bg-muted rounded w-full animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ================================================
// CORE BROWSE COMPONENT
// ================================================

function OptimizedBrowseCore() {
  const router = useRouter()
  const [enableRealData, setEnableRealData] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Handle content selection
  const handleContentSelect = useCallback((contentId: bigint) => {
    console.log('🎯 Content selected:', contentId)
    
    // Navigate to mini content page to stay in mini app context
    router.push(`/mini/content/${contentId}`)
  }, [router])

  // Handle real data toggle
  const handleRealDataToggle = useCallback(async (enabled: boolean) => {
    setIsLoading(true)
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      setEnableRealData(enabled)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 pb-20"> {/* Extra bottom padding for mobile */}
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Browse Content</h1>
          <p className="text-muted-foreground">
            Discover premium content from verified creators
          </p>
        </div>

        {/* Settings panel */}
        <Card className="p-3">
          <div className="flex items-center space-x-3">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Real Data</span>
              <div className="flex items-center space-x-1">
                {enableRealData ? (
                  <ToggleRight className="h-5 w-5 text-primary" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
                <Switch
                  checked={enableRealData}
                  onCheckedChange={handleRealDataToggle}
                  disabled={isLoading}
                />
              </div>
            </div>
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </Card>
      </div>

      {/* Real data warning */}
      {enableRealData && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Performance Note:</strong> Real data mode makes blockchain calls which may be slower. 
            If the page becomes unresponsive, disable real data mode.
          </AlertDescription>
        </Alert>
      )}

      {/* Content browser */}
      <Suspense fallback={<BrowseLoadingSkeleton />}>
        <OptimizedMiniAppContentBrowser
          itemsPerPage={6}
          onContentSelect={handleContentSelect}
          enableRealData={enableRealData}
          className="min-h-[60vh]"
        />
      </Suspense>

      {/* Footer info */}
      <div className="mt-12 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">About This Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                This optimized browse page prevents freezing by using mock data by default 
                and implementing circuit breakers for blockchain calls.
              </p>
              <p>
                <strong>Mock Mode:</strong> Fast, responsive experience with sample content.
              </p>
              <p>
                <strong>Real Data Mode:</strong> Live blockchain data with performance safeguards.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ================================================
// MAIN BROWSE PAGE
// ================================================

export default function OptimizedMiniAppBrowsePage() {
  return (
    <ErrorBoundary
      FallbackComponent={BrowseErrorFallback}
      onError={(error) => {
        console.error('Browse page error:', error)
      }}
    >
      <OptimizedBrowseCore />
    </ErrorBoundary>
  )
}

// Performance debugging
if (typeof window !== 'undefined') {
  (window as any).browsePage = {
    reload: () => window.location.reload(),
    clearCache: () => {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
    }
  }
}

