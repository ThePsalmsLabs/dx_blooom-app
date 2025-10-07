'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minimize2, Maximize2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagingInterface } from './MessagingInterface'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface MessagingSlidePanelProps {
  userAddress: Address
  creatorAddress?: Address
  contentId?: string
  context?: 'post_purchase' | 'social_share' | 'general'
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function MessagingSlidePanel({
  userAddress,
  creatorAddress,
  contentId,
  context = 'general',
  isOpen,
  onClose,
  className
}: MessagingSlidePanelProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [panelWidth, setPanelWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = panelWidth

    const handleMouseMove = (e: MouseEvent) => {
      const diff = startX - e.clientX
      const newWidth = Math.min(Math.max(startWidth + diff, 320), 800)
      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const panelVariants = {
    hidden: { 
      x: '100%',
      opacity: 0
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    minimized: {
      x: panelWidth - 60,
      opacity: 0.9,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 35
      }
    }
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={() => !isMinimized && onClose()}
          />

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate={isMinimized ? "minimized" : "visible"}
            exit="hidden"
            className={cn(
              "fixed top-0 right-0 h-full bg-background border-l shadow-2xl z-50",
              "flex flex-col overflow-hidden",
              isResizing && "select-none",
              className
            )}
            style={{ width: panelWidth }}
          >
            {/* Resize handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 group"
              onMouseDown={handleMouseDown}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-border group-hover:bg-primary transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">
                  {isMinimized ? 'Chat' : 'Messaging'}
                </h3>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-1 min-h-0"
                >
                  <MessagingInterface
                    userAddress={userAddress}
                    creatorAddress={creatorAddress}
                    contentId={contentId}
                    context={context}
                    onClose={onClose}
                    className="h-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}