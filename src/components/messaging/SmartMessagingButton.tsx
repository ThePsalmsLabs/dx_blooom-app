'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagingSlidePanel } from './MessagingSlidePanel'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface SmartMessagingButtonProps {
  userAddress: Address
  creatorAddress?: Address
  contentId?: string
  context?: 'post_purchase' | 'social_share' | 'general'
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
}

/**
 * Smart Messaging Button
 * 
 * Automatically chooses the best UX pattern based on platform:
 * - Web: Side panel (Discord/Slack style)
 * - Miniapp: Dedicated page route
 * - Mobile Web: Dedicated page route
 */
export function SmartMessagingButton({
  userAddress,
  creatorAddress,
  contentId,
  context = 'general',
  variant = 'default',
  size = 'default',
  className,
  children
}: SmartMessagingButtonProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const router = useRouter()

  // Detect platform environment
  const platformInfo = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return { isMiniApp: false, isMobile: false, isDesktop: true }
    }
    
    // Check for Farcaster miniapp indicators with proper typing
    const userAgent = window.navigator.userAgent.toLowerCase()
    const farcasterWindow = window as Window & { farcaster?: { isEnabled: boolean } }
    
    const isMiniApp = userAgent.includes('farcaster') || 
                     window.location.hostname.includes('warpcast') ||
                     document.referrer.includes('warpcast') ||
                     window.location.search.includes('frame=') ||
                     Boolean(farcasterWindow.farcaster?.isEnabled)

    // Check for mobile (including tablets)
    const isMobile = window.innerWidth < 768 // Tailwind md breakpoint
    const isDesktop = !isMobile && !isMiniApp

    return { isMiniApp, isMobile, isDesktop }
  }, [])

  // Choose UX pattern: Desktop = Side Panel, Mobile/Miniapp = Dedicated Page
  const shouldUseDedicatedPage = platformInfo.isMiniApp || platformInfo.isMobile

  const handleOpenMessaging = () => {
    if (!userAddress) {
      console.log('Please connect your wallet to send messages')
      return
    }

    if (shouldUseDedicatedPage) {
      // Navigate to dedicated messaging page with context
      const params = new URLSearchParams({
        userAddress,
        creatorAddress: creatorAddress || '',
        contentId: contentId || '',
        context
      })
      router.push(`/messages?${params.toString()}`)
    } else {
      // Open side panel for web
      setIsPanelOpen(true)
    }
  }

  return (
    <>
      {/* Direct button implementation to avoid onClick conflicts */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant={variant}
          size={size}
          onClick={handleOpenMessaging}
          className={cn("relative overflow-hidden", className)}
        >
          <motion.div
            className="flex items-center gap-2"
            initial={{ x: 0 }}
            whileHover={{ x: 2 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <MessageCircle className="w-4 h-4" />
            {children || 'Message Creator'}
          </motion.div>
        </Button>
      </motion.div>

      {/* Side panel for web only */}
      {!shouldUseDedicatedPage && (
        <MessagingSlidePanel
          userAddress={userAddress}
          creatorAddress={creatorAddress}
          contentId={contentId}
          context={context}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </>
  )
}

/**
 * Hook for platform-aware messaging detection
 */
export function useMessagingPlatform() {
  const platformInfo = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return { isMiniApp: false, isMobile: false, isDesktop: true }
    }
    
    const userAgent = window.navigator.userAgent.toLowerCase()
    const farcasterWindow = window as Window & { farcaster?: { isEnabled: boolean } }
    
    const isMiniApp = userAgent.includes('farcaster') || 
                     window.location.hostname.includes('warpcast') ||
                     document.referrer.includes('warpcast') ||
                     window.location.search.includes('frame=') ||
                     Boolean(farcasterWindow.farcaster?.isEnabled)

    const isMobile = window.innerWidth < 768 // Tailwind md breakpoint
    const isDesktop = !isMobile && !isMiniApp

    return { isMiniApp, isMobile, isDesktop }
  }, [])

  return {
    ...platformInfo,
    shouldUseDedicatedPage: platformInfo.isMiniApp || platformInfo.isMobile,
    recommendedUXPattern: platformInfo.isDesktop ? 'side-panel' : 'dedicated-page'
  }
}