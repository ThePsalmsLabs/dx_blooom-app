'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagingInterface } from '@/components/messaging'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

function MessagesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get parameters from URL - all required for proper functionality
  const userAddress = searchParams.get('userAddress') as Address
  const creatorAddress = searchParams.get('creatorAddress') as Address
  const contentId = searchParams.get('contentId')
  const context = searchParams.get('context') as 'post_purchase' | 'social_share' | 'general'
  
  // Validate required parameters
  if (!userAddress || !creatorAddress) {
    return (
      <div className="h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-2">Invalid Parameters</h1>
          <p className="text-muted-foreground mb-4">
            Missing required wallet addresses for messaging
          </p>
          <Button onClick={() => router.push('/')}>
            Return Home
          </Button>
        </div>
      </div>
    )
  }

  // Detect platform environment
  const isMiniApp = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    
    const userAgent = window.navigator.userAgent.toLowerCase()
    
    return userAgent.includes('farcaster') || 
           window.location.hostname.includes('warpcast') ||
           document.referrer.includes('warpcast') ||
           window.location.search.includes('frame=') ||
           Boolean((window as Window & { farcaster?: { isEnabled: boolean } }).farcaster?.isEnabled)
  }, [])

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className={cn(
      "h-screen bg-background flex flex-col",
      isMiniApp && "max-h-screen overflow-hidden"
    )}>
      {/* Mobile/Miniapp Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur-sm md:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h1 className="font-semibold">
            {context === 'post_purchase' ? 'Thank Creator' : 
             context === 'social_share' ? 'Share & Chat' : 
             'Messages'}
          </h1>
        </div>
      </div>

      {/* Messaging Interface */}
      <div className="flex-1 min-h-0">
        <MessagingInterface
          userAddress={userAddress}
          creatorAddress={creatorAddress}
          contentId={contentId || undefined}
          context={context || 'general'}
          onClose={handleBack}
          className="h-full"
        />
      </div>

      {/* Miniapp-specific optimizations */}
      {isMiniApp && (
        <>
          <style jsx global>{`
            body {
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
            }
            .h-safe-area-inset-bottom {
              height: env(safe-area-inset-bottom);
            }
          `}</style>
          
          <div className="h-safe-area-inset-bottom bg-background" />
        </>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense 
      fallback={
        <div className="h-screen bg-background flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading messages...
          </div>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}