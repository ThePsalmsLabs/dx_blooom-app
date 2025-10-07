'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagingInterface } from './MessagingInterface'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface MessagingInlineExpanderProps {
  userAddress: Address
  creatorAddress?: Address
  contentId?: string
  context?: 'post_purchase' | 'social_share' | 'general'
  trigger?: React.ReactNode
  position?: 'top' | 'bottom' | 'auto'
  className?: string
}

export function MessagingInlineExpander({
  userAddress,
  creatorAddress,
  contentId,
  context = 'general',
  trigger,
  position = 'auto',
  className
}: MessagingInlineExpanderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [actualPosition, setActualPosition] = useState<'top' | 'bottom'>('bottom')
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  // Calculate position based on viewport
  useEffect(() => {
    if (position === 'auto' && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      // Use bottom if there's more space below, otherwise top
      setActualPosition(spaceBelow > spaceAbove ? 'bottom' : 'top')
    } else {
      setActualPosition(position as 'top' | 'bottom')
    }
  }, [position, isExpanded])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        isExpanded
      ) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isExpanded])

  const expanderVariants = {
    collapsed: { 
      height: 0,
      opacity: 0,
      scale: 0.95
    },
    expanded: { 
      height: 'auto',
      opacity: 1,
      scale: 1
    }
  }

  const contentVariants = {
    collapsed: { 
      y: actualPosition === 'bottom' ? -20 : 20,
      opacity: 0
    },
    expanded: { 
      y: 0,
      opacity: 1
    }
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      className="gap-2 hover:bg-primary/5 transition-all duration-200"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <MessageCircle className="w-4 h-4" />
      Message Creator
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="w-4 h-4" />
      </motion.div>
    </Button>
  )

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative",
        actualPosition === 'top' && "flex flex-col-reverse",
        className
      )}
    >
      {/* Trigger */}
      <div ref={triggerRef}>
        {trigger ? (
          <div onClick={() => setIsExpanded(!isExpanded)}>
            {trigger}
          </div>
        ) : (
          defaultTrigger
        )}
      </div>

      {/* Expander */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expanderVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className={cn(
              "overflow-hidden bg-background border border-border rounded-lg shadow-lg",
              actualPosition === 'top' ? "mb-2" : "mt-2"
            )}
          >
            <motion.div
              variants={contentVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Start Conversation</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="h-96">
                <MessagingInterface
                  userAddress={userAddress}
                  creatorAddress={creatorAddress}
                  contentId={contentId}
                  context={context}
                  onClose={() => setIsExpanded(false)}
                  className="h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop blur for focus */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/5 backdrop-blur-[0.5px] z-[-1]"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}