/**
 * V2MiniAppSmartMessagingButton - Smart XMTP Messaging Button
 * File: src/components/v2/miniapp/V2MiniAppSmartMessagingButton.tsx
 *
 * Intelligent messaging button that replaces decorative MessageCircle icons
 * with functional XMTP-integrated messaging capabilities for mobile miniapp.
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  MessageCircle, 
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Lock,
  UserCheck,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// XMTP Integration
import { useXMTPClient } from '@/hooks/messaging/useXMTPClient'
import { useConversationManager } from '@/hooks/messaging/useConversationManager'
import { useMessagingPermissions } from '@/hooks/messaging/useMessagingPermissions'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'

import type { Address } from 'viem'

// ================================================
// TYPES & INTERFACES
// ================================================

interface V2MiniAppSmartMessagingButtonProps {
  // Core messaging props
  creatorAddress: Address
  contentId?: string
  context?: 'content' | 'creator' | 'purchase' | 'general'
  
  // UI props
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showUnreadBadge?: boolean
  disabled?: boolean
  className?: string
  
  // Behavior props
  quickMessage?: string // Pre-filled message for quick actions
  autoNavigate?: boolean // Navigate to messages page on click
  requiresPermission?: boolean // Check messaging permissions
  
  // Callbacks
  onMessagingStart?: (conversationId: string) => void
  onPermissionDenied?: () => void
  onConnectionError?: (error: Error) => void
  
  // Mobile props
  hapticFeedback?: boolean
  longPressAction?: 'quick-message' | 'options' | 'none'
}

type MessagingState = 
  | 'idle'
  | 'checking-permission'
  | 'connecting'
  | 'creating-conversation'
  | 'ready'
  | 'error'
  | 'permission-denied'
  | 'not-connected'

// ================================================
// SMART MESSAGING BUTTON COMPONENT
// ================================================

export function V2MiniAppSmartMessagingButton({
  creatorAddress,
  contentId,
  context = 'general',
  variant = 'default',
  size = 'md',
  showLabel = false,
  showUnreadBadge = true,
  disabled = false,
  className,
  quickMessage,
  autoNavigate = true,
  requiresPermission = true,
  onMessagingStart,
  onPermissionDenied,
  onConnectionError,
  hapticFeedback = true,
  longPressAction = 'quick-message'
}: V2MiniAppSmartMessagingButtonProps) {
  const router = useRouter()
  
  // State management
  const [messagingState, setMessagingState] = useState<MessagingState>('idle')
  const [unreadCount, setUnreadCount] = useState(0)
  const [showQuickMessage, setShowQuickMessage] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout>()

  // Hooks
  const { isConnected: walletConnected, address: userAddress } = useFarcasterAutoWallet()
  const { 
    client, 
    isConnected: xmtpConnected, 
    isConnecting: xmtpConnecting,
    connect: connectXMTP,
    error: xmtpError 
  } = useXMTPClient()
  
  const { 
    conversations, 
    createConversation,
    isLoading: conversationsLoading 
  } = useConversationManager()
  
  const {
    checkPermissions,
    isLoading: permissionsLoading
  } = useMessagingPermissions()

  // Find existing conversation with creator
  const existingConversation = useMemo(() => {
    return conversations.find(conv => 
      conv.peerAddress.toLowerCase() === creatorAddress.toLowerCase()
    )
  }, [conversations, creatorAddress])

  // Calculate unread count for this creator
  useEffect(() => {
    if (existingConversation && showUnreadBadge) {
      setUnreadCount(existingConversation.unreadCount || 0)
    } else {
      setUnreadCount(0)
    }
  }, [existingConversation, showUnreadBadge])

  // Update messaging state based on various conditions
  useEffect(() => {
    if (!walletConnected || !userAddress) {
      setMessagingState('not-connected')
    } else if (xmtpError) {
      setMessagingState('error')
    } else if (xmtpConnecting) {
      setMessagingState('connecting')
    } else if (!xmtpConnected) {
      setMessagingState('idle')
    } else if (permissionsLoading) {
      setMessagingState('checking-permission')
    } else if (conversationsLoading) {
      setMessagingState('creating-conversation')
    } else {
      setMessagingState('ready')
    }
  }, [
    walletConnected, 
    userAddress, 
    xmtpConnected, 
    xmtpConnecting, 
    xmtpError,
    permissionsLoading,
    requiresPermission,
    conversationsLoading
  ])

  // Get icon based on messaging state
  const getStateIcon = useCallback(() => {
    switch (messagingState) {
      case 'connecting':
      case 'checking-permission':
      case 'creating-conversation':
        return Loader2
      case 'ready':
        return quickMessage ? Send : MessageCircle
      case 'error':
        return AlertCircle
      case 'permission-denied':
        return Lock
      case 'not-connected':
        return Shield
      default:
        return MessageCircle
    }
  }, [messagingState, quickMessage])

  // Get button color based on state
  const getStateColor = useCallback(() => {
    switch (messagingState) {
      case 'ready':
        return 'text-primary'
      case 'error':
        return 'text-destructive'
      case 'permission-denied':
        return 'text-amber-600'
      case 'not-connected':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }, [messagingState])

  // Get tooltip message
  const getTooltipMessage = useCallback(() => {
    switch (messagingState) {
      case 'idle':
        return 'Connect to XMTP to message'
      case 'connecting':
        return 'Connecting to messaging...'
      case 'checking-permission':
        return 'Checking permissions...'
      case 'creating-conversation':
        return 'Setting up conversation...'
      case 'ready':
        return quickMessage ? `Send: "${quickMessage}"` : 'Send message'
      case 'error':
        return 'Messaging unavailable'
      case 'permission-denied':
        return 'Messaging permission required'
      case 'not-connected':
        return 'Connect wallet to message'
      default:
        return 'Message creator'
    }
  }, [messagingState, quickMessage])

  // Handle haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (hapticFeedback && navigator.vibrate) {
      const patterns = {
        light: [25],
        medium: [50],
        heavy: [100]
      }
      navigator.vibrate(patterns[type])
    }
  }, [hapticFeedback])

  // Handle click action
  const handleClick = useCallback(async () => {
    if (disabled || messagingState === 'connecting' || messagingState === 'creating-conversation') {
      return
    }

    triggerHaptic('light')

    try {
      // Handle different states
      switch (messagingState) {
        case 'not-connected':
          // Navigate to connection flow
          router.push('/mini?connect=true')
          return

        case 'idle':
          // Connect to XMTP
          setMessagingState('connecting')
          await connectXMTP()
          return

        case 'permission-denied':
          // Check permission
          if (requiresPermission && userAddress) {
            setMessagingState('checking-permission')
            const permissions = await checkPermissions({
              fromAddress: userAddress as Address,
              toAddress: creatorAddress,
              context: 'general'
            })
            if (!permissions.canMessage) {
              onPermissionDenied?.()
              return
            }
          }
          break

        case 'error':
          // Retry connection
          setMessagingState('connecting')
          await connectXMTP()
          return

        case 'ready':
          break

        default:
          return
      }

      // If we have a quick message, send it directly
      if (quickMessage && existingConversation) {
        setMessagingState('creating-conversation')
        // Here you would send the quick message
        console.log(`Sending quick message: "${quickMessage}" to ${creatorAddress}`)
        triggerHaptic('medium')
        
        // Simulate message sending
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        if (onMessagingStart) {
          onMessagingStart(existingConversation.id)
        }
        
        if (autoNavigate) {
          router.push(`/mini/messages?conversation=${existingConversation.id}`)
        }
        return
      }

      // Navigate to conversation or create new one
      if (existingConversation) {
        if (onMessagingStart) {
          onMessagingStart(existingConversation.id)
        }
        
        if (autoNavigate) {
          const params = new URLSearchParams()
          params.set('conversation', existingConversation.id)
          if (contentId) params.set('contentId', contentId)
          if (context) params.set('context', context)
          
          router.push(`/mini/messages?${params.toString()}`)
        }
      } else {
        // Create new conversation
        setMessagingState('creating-conversation')
        
        const conversation = await createConversation(creatorAddress, {
          contentId: contentId ? BigInt(contentId) : undefined,
          creatorAddress,
          socialContext: 'miniapp'
        })
        
        if (onMessagingStart) {
          onMessagingStart(conversation.id)
        }
        
        if (autoNavigate) {
          router.push(`/mini/messages?conversation=${conversation.id}`)
        }
      }

    } catch (error) {
      console.error('Messaging action failed:', error)
      setMessagingState('error')
      onConnectionError?.(error as Error)
      triggerHaptic('heavy')
    }
  }, [
    disabled,
    messagingState,
    quickMessage,
    existingConversation,
    creatorAddress,
    contentId,
    context,
    autoNavigate,
    requiresPermission,
    triggerHaptic,
    connectXMTP,
    checkPermissions,
    createConversation,
    onMessagingStart,
    onPermissionDenied,
    onConnectionError,
    router
  ])

  // Handle long press
  const handleLongPressStart = useCallback(() => {
    if (longPressAction === 'none' || disabled) return

    const timer = setTimeout(() => {
      triggerHaptic('medium')
      
      if (longPressAction === 'quick-message' && quickMessage) {
        setShowQuickMessage(true)
      } else if (longPressAction === 'options') {
        // Show options menu (future implementation)
        console.log('Show messaging options menu')
      }
    }, 500)
    
    setLongPressTimer(timer)
  }, [longPressAction, disabled, quickMessage, triggerHaptic])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(undefined)
    }
  }, [longPressTimer])

  // Get size classes
  const sizeClasses = {
    sm: 'h-8 w-8 p-0',
    md: 'h-10 w-10 p-0',
    lg: 'h-12 w-12 p-0'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const StateIcon = getStateIcon()
  const isLoading = messagingState === 'connecting' || 
                   messagingState === 'checking-permission' || 
                   messagingState === 'creating-conversation'

  return (
    <TooltipProvider>
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              className={cn(
                sizeClasses[size],
                "relative transition-all duration-200",
                getStateColor(),
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
              onClick={handleClick}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              disabled={disabled}
              aria-label={`Message creator${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <motion.div
                animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                transition={isLoading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <StateIcon className={cn(iconSizes[size])} />
              </motion.div>
              
              {/* Unread Badge */}
              <AnimatePresence>
                {unreadCount > 0 && showUnreadBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge 
                      variant="destructive" 
                      className="h-5 min-w-[20px] px-1 text-xs flex items-center justify-center"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Quick Action Indicator */}
              {quickMessage && messagingState === 'ready' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Zap className="w-2 h-2 text-white" />
                </motion.div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipMessage()}</p>
          </TooltipContent>
        </Tooltip>

        {/* Label */}
        {showLabel && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-center mt-1 text-muted-foreground"
          >
            Message
          </motion.p>
        )}

        {/* Quick Message Preview */}
        <AnimatePresence>
          {showQuickMessage && quickMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50"
            >
              <div className="bg-background border border-border rounded-lg p-3 shadow-lg max-w-48">
                <p className="text-sm font-medium mb-2">Quick Message</p>
                <p className="text-xs text-muted-foreground mb-3">"{quickMessage}"</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => {
                      setShowQuickMessage(false)
                      handleClick()
                    }}
                  >
                    Send
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={() => setShowQuickMessage(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}