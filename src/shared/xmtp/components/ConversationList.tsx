/**
 * Unified ConversationList Component
 * File: /src/shared/xmtp/components/ConversationList.tsx
 *
 * Production-ready conversation list with advanced features migrated from legacy system.
 * Enhanced with unified XMTP integration and cross-platform compatibility.
 *
 * Features:
 * - Real-time conversation updates
 * - Advanced search and filtering
 * - Touch-optimized swipe actions
 * - Framer Motion animations
 * - Accessibility compliance
 * - Cross-platform responsive design
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Archive, Edit3, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { ConversationPreview } from '../types/index'

// ================================================
// TYPES & INTERFACES
// ================================================

interface ConversationListProps {
  readonly conversations: ConversationPreview[]
  readonly selectedConversationId?: string
  readonly onSelectConversation: (conversation: ConversationPreview) => void
  readonly onNewConversation?: () => void
  readonly onArchiveConversation?: (conversationId: string) => void
  readonly isLoading?: boolean
  readonly className?: string
  readonly 'aria-label'?: string
  readonly role?: string
}

interface ConversationItemProps {
  readonly conversation: ConversationPreview
  readonly isSelected: boolean
  readonly onClick: () => void
  readonly onArchive?: () => void
}

interface ItemVariants {
  readonly initial: { opacity: number; x: number }
  readonly animate: { opacity: number; x: number }
  readonly exit: { opacity: number; x: number }
  readonly [key: string]: { [key: string]: number }
}

interface ActionVariants {
  readonly hidden: { x: number }
  readonly visible: { x: number }
  readonly [key: string]: { [key: string]: number }
}

interface HeaderVariants {
  readonly initial: { y: number; opacity: number }
  readonly animate: { y: number; opacity: number }
  readonly [key: string]: { [key: string]: number }
}

// ================================================
// CONVERSATION ITEM COMPONENT
// ================================================

function ConversationItem({
  conversation,
  isSelected,
  onClick,
  onArchive,
}: ConversationItemProps) {
  const [showActions, setShowActions] = useState(false)
  
  const itemVariants: ItemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { 
      opacity: 1, 
      x: 0
    },
    exit: { 
      opacity: 0, 
      x: 20
    }
  }

  const actionVariants: ActionVariants = {
    hidden: { x: 0 },
    visible: { x: -80 }
  }

  return (
    <motion.div
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative overflow-hidden"
    >
      {/* Action buttons (revealed on swipe) */}
      <motion.div
        className="absolute right-0 top-0 h-full flex items-center bg-destructive/10 dark:bg-destructive/20"
        variants={actionVariants}
        animate={showActions ? "visible" : "hidden"}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex h-full">
          {onArchive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-full px-3 bg-amber-500/90 text-white hover:bg-amber-600 rounded-none focus:ring-2 focus:ring-amber-300"
              onClick={(e) => {
                e.stopPropagation()
                onArchive()
                setShowActions(false)
              }}
              aria-label="Archive conversation"
            >
              <Archive className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Main conversation item */}
      <motion.div
        className={cn(
          "relative p-4 cursor-pointer transition-all duration-200",
          "hover:bg-muted/50 dark:hover:bg-muted/30",
          "border-b border-border/30 dark:border-border/20",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset",
          isSelected && "bg-primary/5 dark:bg-primary/10 border-primary/20",
        )}
        onClick={onClick}
        onTouchStart={(e) => {
          // Handle touch for swipe actions on mobile
          const startX = e.touches[0].clientX
          
          const handleTouchMove = (e: TouchEvent) => {
            const currentX = e.touches[0].clientX
            const diff = startX - currentX
            
            if (diff > 50) {
              setShowActions(true)
            } else if (diff < -20) {
              setShowActions(false)
            }
          }
          
          const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('touchend', handleTouchEnd)
          }
          
          document.addEventListener('touchmove', handleTouchMove)
          document.addEventListener('touchend', handleTouchEnd)
        }}
        whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
        whileTap={{ scale: 0.98 }}
        role="listitem"
        tabIndex={0}
        aria-selected={isSelected}
        aria-label={`Conversation with ${
          `${conversation.peerAddress.slice(0, 6)}...${conversation.peerAddress.slice(-4)}`
        }${conversation.unreadCount > 0 ? `, ${conversation.unreadCount} unread messages` : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar 
              className="w-12 h-12 ring-2 ring-background"
              role="img"
              aria-label={`Avatar for user`}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-medium" aria-hidden="true">
                  {conversation.peerAddress.slice(2, 4).toUpperCase()}
                </span>
              </div>
            </Avatar>
            
            {/* Online indicator */}
            {false && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full"
                role="img"
                aria-label="User is online"
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className={cn(
                "font-medium text-sm truncate",
                conversation.unreadCount > 0 && "font-semibold"
              )}>
                {`${conversation.peerAddress.slice(0, 6)}...${conversation.peerAddress.slice(-4)}`}
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {conversation.unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Badge 
                      variant="default" 
                      className="h-5 min-w-[20px] px-1.5 text-xs bg-blue-500 text-white"
                      aria-label={`${conversation.unreadCount} unread messages`}
                    >
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  </motion.div>
                )}
                
                <span 
                  className="text-xs text-muted-foreground"
                  aria-label={`Last message ${formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}`}
                >
                  {formatDistanceToNow(conversation.updatedAt, { addSuffix: false })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-sm text-muted-foreground truncate flex-1",
                conversation.unreadCount > 0 && "text-foreground font-medium"
              )}>
                {conversation.lastMessage?.content ? 
                  (conversation.lastMessage.content.type === 'text' ? 
                    conversation.lastMessage.content.text : 
                    '[Attachment]') : 
                  'No messages yet'}
              </p>
              
              {/* Status indicators */}
              <div className="flex items-center gap-1 ml-2">
                {conversation.lastMessage?.sender === conversation.peerAddress && 
                 conversation.lastMessage?.status === 'read' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-blue-500"
                    role="img"
                    aria-label="Message has been read"
                  >
                    <Clock className="w-3 h-3" aria-hidden="true" />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ================================================
// MAIN CONVERSATION LIST COMPONENT
// ================================================

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onArchiveConversation,
  isLoading = false,
  className,
  'aria-label': ariaLabel,
  role
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // ===== FILTERING & SORTING =====
  
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true
    
    const participantAddress = conversation.peerAddress.toLowerCase()
    const lastMessage = conversation.lastMessage?.content ? 
      (conversation.lastMessage.content.type === 'text' ? 
        conversation.lastMessage.content.text.toLowerCase() : 
        '[attachment]') : 
      ''
    const query = searchQuery.toLowerCase()
    
    return participantAddress.includes(query) || 
           lastMessage.includes(query)
  })

  // Filter out archived conversations by default
  const activeConversations = filteredConversations.filter(conv => 
    conv.status !== 'archived'
  )

  // Sort conversations by last message time
  const sortedConversations = [...activeConversations].sort((a, b) => {
    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })

  // ===== ANIMATION VARIANTS =====
  
  const headerVariants: HeaderVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 }
  }

  // ===== EVENT HANDLERS =====
  
  const handleArchiveConversation = (conversationId: string) => {
    if (onArchiveConversation) {
      onArchiveConversation(conversationId)
    }
  }

  // ===== RENDER =====
  
  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-background border-r border-border/50",
        "dark:bg-background/95 dark:border-border/30",
        className
      )}
      role={role}
      aria-label={ariaLabel || "Conversations list"}
    >
      {/* Header */}
      <motion.div
        variants={headerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col p-4 border-b border-border/30 dark:border-border/20"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" id="conversations-heading">Messages</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => setShowSearch(!showSearch)}
              aria-label={showSearch ? "Hide search" : "Show search"}
              aria-expanded={showSearch}
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </Button>
            {onNewConversation && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={onNewConversation}
                aria-label="Start new conversation"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
                autoFocus
                aria-label="Search conversations"
                role="searchbox"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Conversations list */}
      <div className="flex-1 min-h-0">
        <ScrollArea 
          className="h-full"
          aria-labelledby="conversations-heading"
          role="region"
        >
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
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
                </motion.div>
              ))}
            </div>
          ) : sortedConversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center"
              role="status"
              aria-live="polite"
            >
              <div 
                className="w-16 h-16 mb-4 bg-muted rounded-full flex items-center justify-center"
                role="img"
                aria-label="No conversations icon"
              >
                <Edit3 className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium mb-2">No conversations</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchQuery 
                  ? `No results found for "${searchQuery}"`
                  : "Start a conversation to get started"
                }
              </p>
              {onNewConversation && !searchQuery && (
                <Button 
                  onClick={onNewConversation} 
                  size="sm"
                  className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Start conversation
                </Button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <div role="list" aria-label="Conversations">
                {sortedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedConversationId}
                    onClick={() => onSelectConversation(conversation)}
                    onArchive={() => handleArchiveConversation(conversation.id)}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

// ================================================
// EXPORTS
// ================================================

export default ConversationList

