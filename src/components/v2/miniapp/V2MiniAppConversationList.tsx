/**
 * V2MiniAppConversationList - Mobile-First Conversation List
 * File: src/components/v2/miniapp/V2MiniAppConversationList.tsx
 *
 * Touch-optimized conversation list designed specifically for mobile miniapp experience.
 * Features swipe gestures, long-press actions, and mobile-native interaction patterns.
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion'
import { 
  MessageCircle, 
  Search, 
  Plus, 
  Archive, 
  Pin, 
  MoreVertical,
  CheckCheck,
  Clock,
  Volume2,
  VolumeX,
  Trash2,
  Star,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Conversation } from '@/types/messaging'

// ================================================
// TYPES & INTERFACES
// ================================================

interface V2MiniAppConversationListProps {
  conversations: Conversation[]
  selectedConversationId?: string
  onConversationSelect: (conversation: Conversation) => void
  onNewConversation?: () => void
  isLoading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  className?: string
  emptyStateTitle?: string
  emptyStateMessage?: string
  emptyStateAction?: React.ReactNode
}

interface ConversationActions {
  pin: boolean
  mute: boolean
  archived: boolean
}

interface SwipeAction {
  id: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  label: string
  action: (conversationId: string) => void
}

interface V2ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: () => void
  onAction: (action: string, conversationId: string) => void
  index: number
}

// ================================================
// MOBILE-OPTIMIZED CONVERSATION ITEM
// ================================================

function V2ConversationItem({ 
  conversation, 
  isSelected, 
  onSelect, 
  onAction, 
  index 
}: V2ConversationItemProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [dragX, setDragX] = useState(0)
  const controls = useAnimation()

  // Conversation state
  const [actions, setActions] = useState<ConversationActions>({
    pin: false,
    mute: false,
    archived: false
  })

  // Long press handling
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout>()

  // Swipe actions configuration
  const leftActions: SwipeAction[] = [
    {
      id: 'pin',
      icon: Pin,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500',
      label: actions.pin ? 'Unpin' : 'Pin',
      action: (id) => {
        onAction('pin', id)
        setActions(prev => ({ ...prev, pin: !prev.pin }))
      }
    }
  ]

  const rightActions: SwipeAction[] = [
    {
      id: 'mute',
      icon: actions.mute ? Volume2 : VolumeX,
      color: 'text-slate-600',
      bgColor: 'bg-slate-500',
      label: actions.mute ? 'Unmute' : 'Mute',
      action: (id) => {
        onAction('mute', id)
        setActions(prev => ({ ...prev, mute: !prev.mute }))
      }
    },
    {
      id: 'archive',
      icon: Archive,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      label: 'Archive',
      action: (id) => {
        onAction('archive', id)
        setActions(prev => ({ ...prev, archived: true }))
      }
    }
  ]

  // Animation variants
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const // easeOut cubic-bezier
      }
    },
    pressed: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  }

  // Handle pan/swipe gestures
  const handlePan = useCallback((event: any, info: PanInfo) => {
    const deltaX = info.offset.x
    setDragX(deltaX)
    
    // Show actions when swiped enough
    if (Math.abs(deltaX) > 60) {
      setShowActions(true)
    } else {
      setShowActions(false)
    }
  }, [])

  // Handle pan end
  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    const deltaX = info.offset.x
    const velocity = info.velocity.x
    
    // Determine if we should trigger an action
    if (Math.abs(deltaX) > 100 || Math.abs(velocity) > 500) {
      if (deltaX > 0 && leftActions.length > 0) {
        // Swipe right - trigger left action
        leftActions[0].action(conversation.id)
      } else if (deltaX < 0 && rightActions.length > 0) {
        // Swipe left - trigger first right action
        rightActions[0].action(conversation.id)
      }
    }
    
    // Reset position
    controls.start({ x: 0 })
    setDragX(0)
    setShowActions(false)
  }, [conversation.id, leftActions, rightActions, controls])

  // Handle touch interactions
  const handleTouchStart = useCallback(() => {
    setIsPressed(true)
    const timer = setTimeout(() => {
      // Long press - show action menu
      setShowActions(true)
      // Haptic feedback simulation
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
    setPressTimer(timer)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false)
    if (pressTimer) {
      clearTimeout(pressTimer)
    }
  }, [pressTimer])

  // Generate participant display name
  const participantName = useMemo(() => {
    if (conversation.participantName) {
      return conversation.participantName
    }
    return `${conversation.participantAddress.slice(0, 6)}...${conversation.participantAddress.slice(-4)}`
  }, [conversation.participantName, conversation.participantAddress])

  // Generate avatar content
  const avatarContent = useMemo(() => {
    return participantName.charAt(0).toUpperCase()
  }, [participantName])

  // Format last message time
  const lastMessageTime = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })
    } catch {
      return 'Unknown'
    }
  }, [conversation.lastMessageAt])

  return (
    <div className="relative overflow-hidden">
      {/* Action Buttons Background */}
      <AnimatePresence>
        {showActions && (
          <>
            {/* Left actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 h-full flex items-center z-10"
            >
              {leftActions.map((action, actionIndex) => (
                <motion.button
                  key={action.id}
                  initial={{ x: -60 }}
                  animate={{ x: 0 }}
                  exit={{ x: -60 }}
                  transition={{ delay: actionIndex * 0.05 }}
                  className={cn(
                    "h-full px-4 flex items-center justify-center min-w-[60px]",
                    action.bgColor,
                    "text-white font-medium"
                  )}
                  onClick={() => {
                    action.action(conversation.id)
                    setShowActions(false)
                  }}
                  aria-label={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </motion.button>
              ))}
            </motion.div>

            {/* Right actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 h-full flex items-center z-10"
            >
              {rightActions.map((action, actionIndex) => (
                <motion.button
                  key={action.id}
                  initial={{ x: 60 }}
                  animate={{ x: 0 }}
                  exit={{ x: 60 }}
                  transition={{ delay: actionIndex * 0.05 }}
                  className={cn(
                    "h-full px-4 flex items-center justify-center min-w-[60px]",
                    action.bgColor,
                    "text-white font-medium"
                  )}
                  onClick={() => {
                    action.action(conversation.id)
                    setShowActions(false)
                  }}
                  aria-label={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Conversation Item */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate={isPressed ? "pressed" : "visible"}
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        className={cn(
          "relative bg-background border-b border-border/30 cursor-pointer transition-all duration-200",
          "hover:bg-muted/30 active:bg-muted/50",
          isSelected && "bg-primary/5 border-primary/20",
          actions.pin && "bg-amber-50/50 dark:bg-amber-950/20",
          actions.archived && "opacity-60"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (!showActions) {
            onSelect()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Conversation with ${participantName}${conversation.unreadCount > 0 ? `, ${conversation.unreadCount} unread messages` : ''}`}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-12 h-12 ring-2 ring-background">
              <AvatarImage 
                src={conversation.participantName ? `/api/avatar/${conversation.participantAddress}` : undefined}
                alt={`${participantName} avatar`}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                {avatarContent}
              </AvatarFallback>
            </Avatar>
            
            {/* Online Status */}
            {conversation.isOnline && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"
              />
            )}

            {/* Pin Indicator */}
            {actions.pin && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -left-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center"
              >
                <Pin className="w-2.5 h-2.5 text-white" />
              </motion.div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-1">
              <h3 className={cn(
                "font-medium text-sm truncate",
                conversation.unreadCount > 0 && "font-semibold"
              )}>
                {participantName}
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mute Indicator */}
                {actions.mute && (
                  <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
                )}

                {/* Unread Badge */}
                {conversation.unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Badge 
                      variant="default" 
                      className="h-5 min-w-[20px] px-1.5 text-xs bg-blue-500 text-white"
                    >
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  </motion.div>
                )}
                
                {/* Timestamp */}
                <span className="text-xs text-muted-foreground">
                  {lastMessageTime}
                </span>
              </div>
            </div>
            
            {/* Message Preview Row */}
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-sm text-muted-foreground truncate flex-1",
                conversation.unreadCount > 0 && "text-foreground font-medium"
              )}>
                {conversation.lastMessage?.content || 'No messages yet'}
              </p>
              
              {/* Status Indicators */}
              <div className="flex items-center gap-1 ml-2">
                {conversation.lastMessage?.status === 'read' && (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                )}
                {conversation.lastMessage?.status === 'sent' && (
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Close Actions Button */}
      <AnimatePresence>
        {showActions && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-2 right-2 z-20 w-8 h-8 bg-background border border-border rounded-full flex items-center justify-center shadow-lg"
            onClick={() => setShowActions(false)}
            aria-label="Close actions"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ================================================
// MAIN CONVERSATION LIST COMPONENT
// ================================================

export function V2MiniAppConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
  isLoading = false,
  searchQuery = '',
  onSearchChange,
  className,
  emptyStateTitle = "No conversations yet",
  emptyStateMessage = "Start messaging by connecting with creators",
  emptyStateAction
}: V2MiniAppConversationListProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery)
  const [showSearch, setShowSearch] = useState(false)

  // Use internal search if no external handler provided
  const currentSearchQuery = onSearchChange ? searchQuery : internalSearchQuery
  const handleSearchChange = onSearchChange || setInternalSearchQuery

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!currentSearchQuery.trim()) return conversations
    
    const query = currentSearchQuery.toLowerCase()
    return conversations.filter(conversation => {
      const participantName = conversation.participantName?.toLowerCase() || ''
      const participantAddress = conversation.participantAddress.toLowerCase()
      const lastMessage = conversation.lastMessage?.content?.toLowerCase() || ''
      
      return participantName.includes(query) || 
             participantAddress.includes(query) || 
             lastMessage.includes(query)
    })
  }, [conversations, currentSearchQuery])

  // Sort conversations: pinned first, then by last message time
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      // Pinned conversations first (would need to implement pinning state)
      // For now, just sort by last message time
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })
  }, [filteredConversations])

  // Handle conversation actions
  const handleConversationAction = useCallback((action: string, conversationId: string) => {
    console.log(`Action ${action} on conversation ${conversationId}`)
    
    // Here you would integrate with your conversation management system
    switch (action) {
      case 'pin':
        // Toggle pin status
        break
      case 'mute':
        // Toggle mute status
        break
      case 'archive':
        // Archive conversation
        break
      default:
        break
    }
  }, [])

  // ================================================
  // LOADING STATE
  // ================================================

  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full bg-background", className)}>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          </div>
        </div>

        {/* Conversation Skeletons */}
        <div className="flex-1 p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-4"
            >
              <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // ================================================
  // MAIN RENDER
  // ================================================

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-20"
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => setShowSearch(!showSearch)}
              aria-label={showSearch ? "Hide search" : "Show search"}
            >
              <Search className="w-4 h-4" />
            </Button>
            {onNewConversation && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={onNewConversation}
                aria-label="Start new conversation"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-4 pb-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={currentSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full p-8 text-center"
          >
            <div className="w-16 h-16 mb-4 bg-muted rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">{emptyStateTitle}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {currentSearchQuery 
                ? `No results found for "${currentSearchQuery}"`
                : emptyStateMessage
              }
            </p>
            {emptyStateAction && !currentSearchQuery && emptyStateAction}
          </motion.div>
        ) : (
          /* Conversation Items */
          <div>
            {sortedConversations.map((conversation, index) => (
              <V2ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onSelect={() => onConversationSelect(conversation)}
                onAction={handleConversationAction}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}