'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface TypingIndicatorProps {
  senderName?: string
  senderAvatar?: string
  className?: string
}

export function TypingIndicator({ 
  senderName, 
  senderAvatar, 
  className 
}: TypingIndicatorProps) {
  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  const containerVariants = {
    initial: { opacity: 0, y: 10, scale: 0.9 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "flex items-end gap-2 mb-1 mr-12",
        className
      )}
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-shrink-0"
      >
        <Avatar className="w-7 h-7 ring-2 ring-background">
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </Avatar>
      </motion.div>

      {/* Typing bubble */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className={cn(
          "relative max-w-[120px] px-4 py-3 text-sm",
          "bg-muted text-foreground shadow-sm rounded-t-[18px] rounded-b-[18px] rounded-l-[4px]",
          "dark:bg-muted/80 dark:text-muted-foreground",
          "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]",
          "dark:shadow-[0_1px_3px_rgba(255,255,255,0.05),0_1px_2px_rgba(255,255,255,0.03)]"
        )}>
          {/* Typing dots */}
          <div className="flex items-center justify-center gap-1 min-h-[20px]">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                variants={dotVariants}
                animate="animate"
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
                className="w-2 h-2 bg-muted-foreground/60 rounded-full"
              />
            ))}
          </div>

          {/* Optional sender name */}
          {senderName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-5 left-0 text-xs text-muted-foreground"
            >
              {senderName} is typing...
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}