'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Heart, Sparkles, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SmartMessagingButton } from './SmartMessagingButton'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface PostPurchaseMessagingProps {
  /** User's wallet address */
  userAddress: Address
  /** Creator's wallet address */
  creatorAddress: Address
  /** Content ID that was purchased */
  contentId: string
  /** Content title for display */
  contentTitle?: string
  /** Creator name for display */
  creatorName?: string
  /** Purchase amount for context */
  purchaseAmount?: string
  /** Whether to show the component */
  isVisible: boolean
  /** Callback when component is dismissed */
  onDismiss?: () => void
  /** Callback when user starts messaging */
  onStartMessaging?: () => void
  /** Auto-dismiss after timeout (default: 10 seconds) */
  autoDismissAfter?: number
  /** Variant for different use cases */
  variant?: 'celebration' | 'subtle' | 'compact'
  className?: string
}

export function PostPurchaseMessaging({
  userAddress,
  creatorAddress,
  contentId,
  contentTitle,
  creatorName,
  purchaseAmount,
  isVisible,
  onDismiss,
  onStartMessaging,
  autoDismissAfter = 10000,
  variant = 'celebration',
  className
}: PostPurchaseMessagingProps) {
  const [dismissed, setDismissed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(autoDismissAfter / 1000)

  // Auto-dismiss countdown
  useEffect(() => {
    if (!isVisible || dismissed) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible, dismissed, autoDismissAfter])

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const handleStartMessaging = () => {
    onStartMessaging?.()
    // Keep component open so user can see messaging UI
  }

  if (!isVisible || dismissed) return null

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        duration: 0.6,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    }
  }

  const celebrationElements = variant === 'celebration' && (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            opacity: 0,
            scale: 0,
            x: Math.random() * 200,
            y: Math.random() * 100
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
            y: [0, -50, -100]
          }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </motion.div>
      ))}
    </div>
  )

  if (variant === 'compact') {
    return (
      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed bottom-4 right-4 z-50 max-w-sm",
            className
          )}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Purchase Complete!</p>
                    <p className="text-xs text-muted-foreground">
                      Thank {creatorName || 'the creator'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleDismiss}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              <SmartMessagingButton
                userAddress={userAddress}
                creatorAddress={creatorAddress}
                contentId={contentId}
                context="post_purchase"
                size="sm"
                className="w-full"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Send Thanks
              </SmartMessagingButton>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm",
          className
        )}
        onClick={handleDismiss}
      >
        <motion.div
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          {celebrationElements}
          
          <Card className={cn(
            "w-full max-w-md shadow-2xl",
            variant === 'celebration' 
              ? "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-purple-200"
              : "bg-background border-border"
          )}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-lg">Purchase Complete!</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      You now have access to this content
                    </p>
                  </div>
                </motion.div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleDismiss}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <motion.div variants={itemVariants} className="space-y-2">
                {contentTitle && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Content</Badge>
                    <span className="text-sm font-medium truncate">{contentTitle}</span>
                  </div>
                )}
                
                {creatorName && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Creator</Badge>
                    <span className="text-sm font-medium">{creatorName}</span>
                  </div>
                )}
                
                {purchaseAmount && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Amount</Badge>
                    <span className="text-sm font-medium">{purchaseAmount} USDC</span>
                  </div>
                )}
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border"
              >
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">
                      Thank the Creator
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Send a personal message to show your appreciation for their work. 
                      Many creators love hearing from their supporters!
                    </p>
                    
                    <SmartMessagingButton
                      userAddress={userAddress}
                      creatorAddress={creatorAddress}
                      contentId={contentId}
                      context="post_purchase"
                      size="sm"
                      className="w-full"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Thank You Message
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </SmartMessagingButton>
                  </div>
                </div>
              </motion.div>

              {autoDismissAfter > 0 && (
                <motion.div 
                  variants={itemVariants}
                  className="text-center"
                >
                  <p className="text-xs text-muted-foreground">
                    Auto-closing in {timeRemaining}s
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Hook for managing post-purchase messaging state
 */
export function usePostPurchaseMessaging() {
  const [isVisible, setIsVisible] = useState(false)
  const [purchaseData, setPurchaseData] = useState<{
    userAddress: Address
    creatorAddress: Address
    contentId: string
    contentTitle?: string
    creatorName?: string
    purchaseAmount?: string
  } | null>(null)

  const show = (data: NonNullable<typeof purchaseData>) => {
    setPurchaseData(data)
    setIsVisible(true)
  }

  const hide = () => {
    setIsVisible(false)
  }

  const dismiss = () => {
    setIsVisible(false)
    // Clear data after animation completes
    setTimeout(() => setPurchaseData(null), 300)
  }

  return {
    isVisible,
    purchaseData,
    show,
    hide,
    dismiss
  }
}