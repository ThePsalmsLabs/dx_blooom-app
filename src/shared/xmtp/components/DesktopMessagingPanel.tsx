/**
 * Desktop Messaging Side Panel Component
 * File: /src/shared/xmtp/components/DesktopMessagingPanel.tsx
 *
 * Production-ready desktop side panel for web messaging.
 * Provides Discord/Slack-style slide-out messaging interface.
 *
 * Features:
 * - Smooth slide-out animations with Framer Motion
 * - Responsive design with proper z-index management
 * - Keyboard navigation and accessibility
 * - Overlay backdrop with click-to-close
 * - Integration with existing MessagingInterface
 * - Proper focus management and escape key handling
 * - Mobile-responsive fallback
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagingInterface } from './MessagingInterface'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

// ================================================
// TYPES & INTERFACES
// ================================================

interface DesktopMessagingPanelProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly userAddress: Address
  readonly creatorAddress?: Address
  readonly contentId?: string
  readonly context?: 'post_purchase' | 'social_share' | 'general' | 'creator_reply'
  readonly className?: string
  readonly 'aria-label'?: string
}

interface PanelVariants {
  readonly initial: { x: string; opacity: number }
  readonly animate: { x: number; opacity: number }
  readonly exit: { x: string; opacity: number }
  readonly [key: string]: any
}

interface BackdropVariants {
  readonly initial: { opacity: number }
  readonly animate: { opacity: number }
  readonly exit: { opacity: number }
  readonly [key: string]: any
}

// ================================================
// ANIMATION VARIANTS
// ================================================

const panelVariants: PanelVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 }
}

const backdropVariants: BackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

// ================================================
// MAIN DESKTOP MESSAGING PANEL COMPONENT
// ================================================

/**
 * Desktop Messaging Side Panel
 * 
 * Provides a slide-out messaging interface optimized for desktop web.
 * Integrates with the existing MessagingInterface component.
 */
export function DesktopMessagingPanel({
  isOpen,
  onClose,
  userAddress,
  creatorAddress,
  contentId,
  context = 'general',
  className,
  'aria-label': ariaLabel
}: DesktopMessagingPanelProps) {
  // ===== STATE MANAGEMENT =====
  
  const [isMobile, setIsMobile] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // ===== RESPONSIVE DETECTION =====
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Tailwind md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ===== FOCUS MANAGEMENT =====
  
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement
      
      // Focus the panel when it opens
      setTimeout(() => {
        if (panelRef.current) {
          panelRef.current.focus()
        }
      }, 100)
    } else if (previousActiveElement.current) {
      // Restore focus when panel closes
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [isOpen])

  // ===== KEYBOARD NAVIGATION =====
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // ===== MOBILE FALLBACK =====
  
  // On mobile, redirect to dedicated page instead of showing side panel
  if (isMobile) {
    return null
  }

  // ===== RENDER =====
  
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Side Panel */}
          <motion.div
            ref={panelRef}
            className={cn(
              "fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50",
              "flex flex-col overflow-hidden",
              className
            )}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ 
              duration: 0.3, 
              ease: [0.32, 0.72, 0, 1], // Custom easing for smooth slide
              opacity: { duration: 0.2 }
            }}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || 'Messaging panel'}
            tabIndex={-1}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">
                    {context === 'post_purchase' ? 'Thank Creator' : 
                     context === 'social_share' ? 'Share & Chat' : 
                     'Messages'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Connect with creators
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-muted"
                aria-label="Close messaging panel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messaging Interface */}
            <div className="flex-1 min-h-0">
              <MessagingInterface
                userAddress={userAddress}
                creatorAddress={creatorAddress}
                contentId={contentId}
                context={context}
                onClose={onClose}
                className="h-full"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DesktopMessagingPanel
