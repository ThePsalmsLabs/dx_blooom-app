/**
 * Unified MessageBubble Component
 * File: /src/shared/xmtp/components/MessageBubble.tsx
 *
 * Production-ready message bubble with reactions, status indicators, and animations.
 * Migrated from legacy system with enhanced unified XMTP integration.
 *
 * Features:
 * - Message status indicators (sending, sent, delivered, read, failed)
 * - Message grouping and timestamps
 * - Accessibility compliance
 * - Keyboard navigation
 * - Framer Motion animations
 * - Cross-platform compatibility
 * - iOS-style bubble design
 */

'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Check, CheckCheck, User, Download, Image, File, Video, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { decryptAttachment } from '../utils/attachmentEncryption'
import { extractTextContent, extractAttachments, hasAttachments } from '../utils/contentTypeDetection'
import type { MessagePreview, MessageStatus, MessageContent, AttachmentMessage } from '../types/index'

// ================================================
// ATTACHMENT RENDERER COMPONENTS
// ================================================

interface AttachmentRendererProps {
  readonly attachment: AttachmentMessage
  readonly className?: string
}

function AttachmentRenderer({ attachment, className }: AttachmentRendererProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    if (decryptedUrl) {
      // Already decrypted, just download
      const link = document.createElement('a')
      link.href = decryptedUrl
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch encrypted data
      const response = await fetch(attachment.url)
      if (!response.ok) {
        throw new Error(`Failed to fetch attachment: ${response.statusText}`)
      }

      const encryptedData = await response.arrayBuffer()

      // Decrypt the data
      const decryptionResult = await decryptAttachment(encryptedData, attachment.encryption, attachment.digest)
      
      if (!decryptionResult.isValid) {
        throw new Error('Attachment integrity check failed')
      }

      // Create blob URL
      const blob = new Blob([decryptionResult.decryptedData], { type: attachment.mimeType })
      const url = URL.createObjectURL(blob)
      setDecryptedUrl(url)

      // Trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setIsLoading(false)
    }
  }, [attachment, decryptedUrl])

  const getAttachmentIcon = () => {
    if (attachment.mimeType.startsWith('image/')) return Image
    if (attachment.mimeType.startsWith('video/')) return Video
    return File
  }

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const IconComponent = getAttachmentIcon()

  return (
    <div className={cn("flex items-center gap-3 p-3 bg-muted/50 rounded-lg border", className)}>
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <IconComponent className="w-5 h-5 text-primary" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{attachment.name}</p>
        <p className="text-xs text-muted-foreground">
          {attachment.mimeType} • {formatFileSize(attachment.size)}
        </p>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={isLoading}
        className="flex-shrink-0"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}

function ImageAttachmentRenderer({ attachment, className }: AttachmentRendererProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showFullSize, setShowFullSize] = useState(false)

  const loadImage = useCallback(async () => {
    if (imageUrl) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch encrypted data
      const response = await fetch(attachment.url)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const encryptedData = await response.arrayBuffer()

      // Decrypt the data
      const decryptionResult = await decryptAttachment(encryptedData, attachment.encryption, attachment.digest)
      
      if (!decryptionResult.isValid) {
        throw new Error('Image integrity check failed')
      }

      // Create blob URL
      const blob = new Blob([decryptionResult.decryptedData], { type: attachment.mimeType })
      const url = URL.createObjectURL(blob)
      setImageUrl(url)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image')
    } finally {
      setIsLoading(false)
    }
  }, [attachment, imageUrl])

  // Load image on mount
  React.useEffect(() => {
    loadImage()
  }, [loadImage])

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-8 bg-muted/50 rounded-lg border", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border", className)}>
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-muted/50 rounded-lg border", className)}>
        <Image className="w-5 h-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading image...</p>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <img
        src={imageUrl}
        alt={attachment.name}
        className="max-w-full h-auto rounded-lg cursor-pointer"
        onClick={() => setShowFullSize(true)}
        loading="lazy"
      />
      
      {/* Full size modal */}
      {showFullSize && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullSize(false)}
        >
          <img
            src={imageUrl}
            alt={attachment.name}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ================================================
// MESSAGE CONTENT RENDERER
// ================================================

interface MessageContentRendererProps {
  readonly content: MessageContent
}

function MessageContentRenderer({ content }: MessageContentRendererProps) {
  switch (content.type) {
    case 'text':
      return <span>{content.text}</span>
    
    case 'attachment':
      return (
        <div className="space-y-2">
          {content.attachment.mimeType.startsWith('image/') ? (
            <ImageAttachmentRenderer attachment={content.attachment} />
          ) : (
            <AttachmentRenderer attachment={content.attachment} />
          )}
        </div>
      )
    
    case 'mixed':
      return (
        <div className="space-y-2">
          {content.text && <span>{content.text}</span>}
          {content.attachments.map((attachment, index) => (
            <div key={index}>
              {attachment.mimeType.startsWith('image/') ? (
                <ImageAttachmentRenderer attachment={attachment} />
              ) : (
                <AttachmentRenderer attachment={attachment} />
              )}
            </div>
          ))}
        </div>
      )
    
    default:
      return <span className="text-muted-foreground italic">[Unsupported message type]</span>
  }
}

// ================================================
// TYPES & INTERFACES
// ================================================

interface MessageBubbleProps {
  readonly message: MessagePreview
  readonly isOwn: boolean
  readonly showAvatar?: boolean
  readonly showTimestamp?: boolean
  readonly isFirstInGroup?: boolean
  readonly isLastInGroup?: boolean
  readonly previousMessage?: MessagePreview
  readonly nextMessage?: MessagePreview
  readonly className?: string
}

interface MessageStatusIndicatorProps {
  readonly status: MessageStatus
  readonly className?: string
}

// ================================================
// MESSAGE STATUS INDICATOR
// ================================================

function MessageStatusIndicator({ status, className }: MessageStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        )
      case 'sent':
        return <Check className="w-3 h-3" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'failed':
        return (
          <div className="w-3 h-3 border border-red-500 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="w-1 h-1 bg-red-500 rounded-full" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'flex items-center text-xs opacity-70',
        status === 'failed' && 'text-red-500',
        className
      )}
      role="status"
    >
      {getStatusIcon()}
    </motion.div>
  )
}

// ================================================
// MAIN MESSAGE BUBBLE COMPONENT
// ================================================

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = false,
  isFirstInGroup = false,
  isLastInGroup = false,
  previousMessage,
  className
}: MessageBubbleProps) {
  // ===== KEYBOARD INTERACTION =====
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Handle message selection (XMTP only supports basic messaging)
      console.log('Message selected:', message.id)
    }
  }

  // ===== TIMESTAMP LOGIC =====
  
  const shouldShowTimestamp = showTimestamp || 
    (previousMessage && new Date(message.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 5 * 60 * 1000)

  // ===== ANIMATION VARIANTS =====
  
  const messageBubbleVariants = {
    initial: { scale: 0.8, opacity: 0, y: 20 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30
      }
    },
    exit: { scale: 0.8, opacity: 0, y: -10 }
  }

  // ===== BUBBLE STYLING =====
  
  const getBubbleClasses = () => {
    const baseClasses = "max-w-[280px] md:max-w-[320px] px-4 py-2.5 text-sm leading-relaxed"
    
    if (isOwn) {
      return cn(
        baseClasses,
        "bg-blue-500 text-white shadow-sm",
        isFirstInGroup && "rounded-t-[18px]",
        isLastInGroup && "rounded-b-[18px]",
        !isFirstInGroup && !isLastInGroup && "rounded-none",
        "rounded-l-[18px]",
        // Add subtle iOS-style gradient
        "bg-gradient-to-br from-blue-500 to-blue-600",
        "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]"
      )
    } else {
      return cn(
        baseClasses,
        "bg-muted text-foreground shadow-sm",
        "dark:bg-muted/80 dark:text-muted-foreground",
        isFirstInGroup && "rounded-t-[18px]",
        isLastInGroup && "rounded-b-[18px]",
        !isFirstInGroup && !isLastInGroup && "rounded-none",
        "rounded-r-[18px]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]",
        "dark:shadow-[0_1px_3px_rgba(255,255,255,0.05),0_1px_2px_rgba(255,255,255,0.03)]"
      )
    }
  }

  // ===== MAIN RENDER =====
  
  return (
    <motion.div
      variants={messageBubbleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "flex items-end gap-2 mb-1",
        isOwn ? "flex-row-reverse ml-12" : "mr-12",
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && isLastInGroup && !isOwn && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-shrink-0"
        >
          <Avatar 
            className="w-7 h-7 ring-2 ring-background"
            role="img"
            aria-label="Sender avatar"
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
          </Avatar>
        </motion.div>
      )}

      {/* Spacer when no avatar */}
      {!showAvatar || !isLastInGroup || isOwn ? (
        <div className="w-7 h-7 flex-shrink-0" />
      ) : null}

      <div className="flex flex-col gap-1 min-w-0">
        {/* Timestamp */}
        {shouldShowTimestamp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-xs text-muted-foreground text-center py-2",
              "font-medium tracking-wide"
            )}
            role="separator"
            aria-label={`Message sent ${formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}`}
          >
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </motion.div>
        )}

        {/* Message bubble */}
        <div className={cn(
          "relative",
          isOwn ? "flex justify-end" : "flex justify-start"
        )}>
          <div 
            className={cn(
              getBubbleClasses(),
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            )}
            tabIndex={0}
            role="article"
            aria-label={`Message from ${isOwn ? 'you' : 'sender'}: ${extractTextContent(message.content)}`}
            onKeyDown={handleKeyDown}
          >
            <MessageContentRenderer content={message.content} />
          </div>
        </div>

        {/* Message status (for own messages) */}
        {isOwn && isLastInGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end pr-1"
          >
            <MessageStatusIndicator status={message.status} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ================================================
// MESSAGE GROUPING UTILITY
// ================================================

/**
 * Groups consecutive messages by sender with time-based separation
 * @param messages Array of messages to group
 * @returns Array of message groups
 */
export function groupMessages(messages: MessagePreview[]): MessagePreview[][] {
  const groups: MessagePreview[][] = []
  let currentGroup: MessagePreview[] = []
  let lastSender: string | null = null

  for (const message of messages) {
    const timeDiff = currentGroup.length > 0 
      ? new Date(message.timestamp).getTime() - new Date(currentGroup[currentGroup.length - 1].timestamp).getTime()
      : 0

    // Start new group if sender changes or time gap > 5 minutes
    if (message.sender !== lastSender || timeDiff > 5 * 60 * 1000) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = [message]
      lastSender = message.sender
    } else {
      currentGroup.push(message)
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

// ================================================
// EXPORTS
// ================================================

export default MessageBubble
