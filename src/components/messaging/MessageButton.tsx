'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessagingSlidePanel } from './MessagingSlidePanel'
import { MessagingFloatingWidget } from './MessagingFloatingWidget'
import { MessagingInlineExpander } from './MessagingInlineExpander'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

type MessagingUIType = 'slide-panel' | 'floating-widget' | 'inline-expander' | 'page-route'

interface MessageButtonProps {
  userAddress: Address
  creatorAddress?: Address
  contentId?: string
  context?: 'post_purchase' | 'social_share' | 'general'
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  uiType?: MessagingUIType
  className?: string
  children?: React.ReactNode
}

export function MessageButton({
  userAddress,
  creatorAddress,
  contentId,
  context = 'general',
  variant = 'default',
  size = 'default',
  uiType = 'slide-panel',
  className,
  children
}: MessageButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenMessaging = () => {
    if (!userAddress) {
      console.log('Please connect your wallet to send messages')
      return
    }

    if (uiType === 'page-route') {
      // Navigate to dedicated messages page
      window.location.href = '/messages'
      return
    }

    setIsOpen(true)
  }

  // Floating widget renders differently
  if (uiType === 'floating-widget') {
    return (
      <MessagingFloatingWidget
        userAddress={userAddress}
        creatorAddress={creatorAddress}
        contentId={contentId}
        context={context}
        className={className}
      />
    )
  }

  // Inline expander renders as a wrapper
  if (uiType === 'inline-expander') {
    const trigger = (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant={variant}
          size={size}
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
    )

    return (
      <MessagingInlineExpander
        userAddress={userAddress}
        creatorAddress={creatorAddress}
        contentId={contentId}
        context={context}
        trigger={trigger}
        className={className}
      />
    )
  }

  // Default: slide panel
  return (
    <>
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

      <MessagingSlidePanel
        userAddress={userAddress}
        creatorAddress={creatorAddress}
        contentId={contentId}
        context={context}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}