/**
 * Unified SmartMessagingButton Component
 * File: /src/shared/xmtp/components/SmartMessagingButton.tsx
 *
 * Production-ready context-aware messaging button with platform detection.
 * Migrated from legacy system with enhanced unified XMTP integration.
 *
 * Features:
 * - Platform-aware UX patterns (side panel vs dedicated page)
 * - Context-aware messaging (post-purchase, social share, general)
 * - Farcaster miniapp detection
 * - Mobile-responsive design
 * - Accessibility compliance
 * - Framer Motion animations
 * - Cross-platform compatibility
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DesktopMessagingPanel } from './DesktopMessagingPanel'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

// ================================================
// TYPES & INTERFACES
// ================================================

interface SmartMessagingButtonProps {
  readonly userAddress: Address
  readonly creatorAddress?: Address
  readonly contentId?: string
  readonly context?: 'post_purchase' | 'social_share' | 'general' | 'creator_reply'
  readonly variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  readonly size?: 'default' | 'sm' | 'lg'
  readonly className?: string
  readonly children?: React.ReactNode
}

interface PlatformInfo {
  readonly isMiniApp: boolean
  readonly isMobile: boolean
  readonly isDesktop: boolean
}

interface MessagingPlatformHook {
  readonly isMiniApp: boolean
  readonly isMobile: boolean
  readonly isDesktop: boolean
  readonly shouldUseDedicatedPage: boolean
  readonly recommendedUXPattern: 'side-panel' | 'dedicated-page'
}

// ================================================
// PLATFORM DETECTION UTILITIES
// ================================================

/**
 * Detects the current platform environment
 * @returns Platform information object
 */
function detectPlatform(): PlatformInfo {
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
}

// ================================================
// PLATFORM-AWARE MESSAGING HOOK
// ================================================

/**
 * Hook for platform-aware messaging detection
 * @returns Platform information and UX recommendations
 */
export function useMessagingPlatform(): MessagingPlatformHook {
  const platformInfo = React.useMemo(() => {
    return detectPlatform()
  }, [])

  return {
    ...platformInfo,
    shouldUseDedicatedPage: platformInfo.isMiniApp || platformInfo.isMobile,
    recommendedUXPattern: platformInfo.isDesktop ? 'side-panel' : 'dedicated-page'
  }
}

// ================================================
// MAIN SMART MESSAGING BUTTON COMPONENT
// ================================================

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
  // ===== STATE MANAGEMENT =====
  
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const router = useRouter()

  // ===== PLATFORM DETECTION =====
  
  const platformInfo = React.useMemo(() => {
    return detectPlatform()
  }, [])

  // ===== UX PATTERN SELECTION =====
  
  // Choose UX pattern: Desktop = Side Panel, Mobile/Miniapp = Dedicated Page
  const shouldUseDedicatedPage = platformInfo.isMiniApp || platformInfo.isMobile

  // ===== EVENT HANDLERS =====
  
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

  // ===== MAIN RENDER =====
  
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

      {/* Desktop Side Panel */}
      {!shouldUseDedicatedPage && (
        <DesktopMessagingPanel
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          userAddress={userAddress}
          creatorAddress={creatorAddress}
          contentId={contentId}
          context={context}
          aria-label="Messaging panel"
        />
      )}
    </>
  )
}

// ================================================
// CONTEXT-AWARE MESSAGING BUTTONS
// ================================================

/**
 * Post-purchase messaging button with specific styling
 */
export function PostPurchaseMessagingButton({
  userAddress,
  creatorAddress,
  contentId,
  className
}: Omit<SmartMessagingButtonProps, 'context' | 'children'>) {
  return (
    <SmartMessagingButton
      userAddress={userAddress}
      creatorAddress={creatorAddress}
      contentId={contentId}
      context="post_purchase"
      variant="default"
      className={cn("bg-green-600 hover:bg-green-700", className)}
    >
      Thank Creator
    </SmartMessagingButton>
  )
}

/**
 * Social share messaging button
 */
export function SocialShareMessagingButton({
  userAddress,
  creatorAddress,
  contentId,
  className
}: Omit<SmartMessagingButtonProps, 'context' | 'children'>) {
  return (
    <SmartMessagingButton
      userAddress={userAddress}
      creatorAddress={creatorAddress}
      contentId={contentId}
      context="social_share"
      variant="outline"
      className={className}
    >
      Share & Discuss
    </SmartMessagingButton>
  )
}

/**
 * General messaging button
 */
export function GeneralMessagingButton({
  userAddress,
  creatorAddress,
  className
}: Omit<SmartMessagingButtonProps, 'context' | 'contentId' | 'children'>) {
  return (
    <SmartMessagingButton
      userAddress={userAddress}
      creatorAddress={creatorAddress}
      context="general"
      variant="secondary"
      className={className}
    >
      Message Creator
    </SmartMessagingButton>
  )
}

// ================================================
// EXPORTS
// ================================================

export default SmartMessagingButton
