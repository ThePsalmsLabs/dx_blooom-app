'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagingInterface } from './MessagingInterface'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface MessagingSplitDrawerProps {
  userAddress: Address
  creatorAddress?: Address
  contentId?: string
  context?: 'post_purchase' | 'social_share' | 'general'
  isOpen: boolean
  onToggle: () => void
  side?: 'left' | 'right'
  defaultWidth?: number
  children?: React.ReactNode
  className?: string
}

export function MessagingSplitDrawer({
  userAddress,
  creatorAddress,
  contentId,
  context = 'general',
  isOpen,
  onToggle,
  side = 'right',
  defaultWidth = 400,
  children,
  className
}: MessagingSplitDrawerProps) {
  const [drawerWidth, setDrawerWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [contentWidth, setContentWidth] = useState('100%')

  // Calculate content width when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      setContentWidth(`calc(100% - ${drawerWidth}px)`)
    } else {
      setContentWidth('100%')
    }
  }, [isOpen, drawerWidth])

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = drawerWidth

    const handleMouseMove = (e: MouseEvent) => {
      const diff = side === 'right' ? startX - e.clientX : e.clientX - startX
      const newWidth = Math.min(Math.max(startWidth + diff, 300), 800)
      setDrawerWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const drawerVariants = {
    closed: {
      x: side === 'right' ? '100%' : '-100%',
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  }

  const contentVariants = {
    expanded: {
      width: '100%',
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    compressed: {
      width: contentWidth,
      x: side === 'left' && isOpen ? drawerWidth : 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  }

  return (
    <div className={cn("relative h-full overflow-hidden", className)}>
      {/* Main Content */}
      <motion.div
        variants={contentVariants}
        animate={isOpen ? "compressed" : "expanded"}
        className="h-full overflow-auto bg-background"
      >
        {children}
        
        {/* Toggle Button - always visible */}
        <motion.div
          className={cn(
            "fixed top-1/2 -translate-y-1/2 z-50",
            side === 'right' ? "right-4" : "left-4"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={onToggle}
            size="lg"
            className={cn(
              "h-12 w-12 rounded-full shadow-lg border-2 border-background",
              "bg-primary hover:bg-primary/90"
            )}
          >
            {isOpen ? (
              side === 'right' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
            ) : (
              <MessageCircle className="w-5 h-5" />
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* Messaging Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className={cn(
              "fixed top-0 h-full bg-background border shadow-2xl z-40",
              side === 'right' ? "right-0 border-l" : "left-0 border-r",
              isResizing && "select-none"
            )}
            style={{ width: drawerWidth }}
          >
            {/* Resize Handle */}
            <div
              className={cn(
                "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 group",
                side === 'right' ? "left-0" : "right-0"
              )}
              onMouseDown={handleMouseDown}
            >
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-border group-hover:bg-primary transition-colors",
                side === 'right' ? "left-0" : "right-0"
              )} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Messages</h3>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onToggle}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="h-[calc(100%-60px)]">
              <MessagingInterface
                userAddress={userAddress}
                creatorAddress={creatorAddress}
                contentId={contentId}
                context={context}
                onClose={onToggle}
                className="h-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>
    </div>
  )
}