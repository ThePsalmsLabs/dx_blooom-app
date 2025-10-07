'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagingInterface } from './MessagingInterface'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface MessagingFloatingWidgetProps {
  userAddress: Address
  creatorAddress?: Address
  contentId?: string
  context?: 'post_purchase' | 'social_share' | 'general'
  className?: string
}

export function MessagingFloatingWidget({
  userAddress,
  creatorAddress,
  contentId,
  context = 'general',
  className
}: MessagingFloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen && !isMinimized) return // Don't drag when expanded
    
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const handleMouseMove = (e: MouseEvent) => {
      if (typeof window === 'undefined') return
      
      const newX = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - offsetX))
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - offsetY))
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Position variants
  const getPositionStyle = () => {
    if (isOpen && !isMinimized) {
      // Expanded: bottom-right corner
      return {
        bottom: 20,
        right: 20,
        top: 'auto',
        left: 'auto'
      }
    } else {
      // Floating bubble: draggable position
      if (typeof window === 'undefined') {
        return {
          bottom: 20,
          right: 20,
          top: 'auto',
          left: 'auto'
        }
      }
      
      return {
        bottom: `${window.innerHeight - position.y - 60}px`,
        right: `${window.innerWidth - position.x - 60}px`,
        top: 'auto',
        left: 'auto'
      }
    }
  }

  const bubbleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    },
    expanded: {
      scale: 1,
      opacity: 1,
      borderRadius: 12,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  }

  const widgetVariants = {
    hidden: { 
      scale: 0.8, 
      opacity: 0,
      height: 0,
      width: 0
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      height: 600,
      width: 400,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    }
  }

  return (
    <>
      {/* Floating Bubble */}
      <motion.div
        className={cn(
          "fixed z-50 cursor-pointer select-none",
          isDragging && "cursor-grabbing",
          className
        )}
        style={getPositionStyle()}
        onMouseDown={handleMouseDown}
        layout
      >
        <AnimatePresence>
          {!isOpen || isMinimized ? (
            <motion.div
              key="bubble"
              variants={bubbleVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative"
              onClick={() => {
                if (!isDragging) {
                  setIsOpen(true)
                  setIsMinimized(false)
                }
              }}
            >
              {/* Floating Button */}
              <div className="relative">
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                </Button>
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.div>
                )}
              </div>

              {/* Pulse Animation */}
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
            </motion.div>
          ) : (
            /* Expanded Widget */
            <motion.div
              key="widget"
              variants={widgetVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Widget Header */}
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm">Messages</h3>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Widget Content */}
              <div className="h-[calc(600px-60px)]">
                <MessagingInterface
                  userAddress={userAddress}
                  creatorAddress={creatorAddress}
                  contentId={contentId}
                  context={context}
                  onClose={() => setIsOpen(false)}
                  className="h-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Backdrop for expanded state */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}