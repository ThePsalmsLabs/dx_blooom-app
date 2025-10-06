/**
 * TierBadge.tsx - Premium Tier Badge Component
 * 
 * Beautiful animated tier badge with sparkle effects, gradients, and premium styling
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Medal,
  Star,
  Crown,
  Trophy,
  Diamond,
  Sparkles
} from 'lucide-react'

export type LoyaltyTier = 0 | 1 | 2 | 3 | 4

// Premium tier configuration with enhanced visual design
export const TIER_CONFIG = {
  0: { 
    name: 'Bronze', 
    gradient: 'from-amber-600 via-orange-500 to-amber-700',
    shadowColor: 'shadow-amber-500/25',
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
    textColor: 'text-amber-800',
    glowColor: 'amber',
    icon: Medal,
    threshold: 0,
    sparkles: false
  },
  1: { 
    name: 'Silver', 
    gradient: 'from-slate-400 via-gray-300 to-slate-500',
    shadowColor: 'shadow-slate-500/25',
    bgColor: 'bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200',
    textColor: 'text-slate-800',
    glowColor: 'slate',
    icon: Star,
    threshold: 1000,
    sparkles: false
  },
  2: { 
    name: 'Gold', 
    gradient: 'from-yellow-400 via-amber-400 to-yellow-600',
    shadowColor: 'shadow-yellow-500/30',
    bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200',
    textColor: 'text-yellow-800',
    glowColor: 'yellow',
    icon: Crown,
    threshold: 5000,
    sparkles: true
  },
  3: { 
    name: 'Platinum', 
    gradient: 'from-blue-400 via-cyan-400 to-blue-600',
    shadowColor: 'shadow-blue-500/30',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200',
    textColor: 'text-blue-800',
    glowColor: 'blue',
    icon: Trophy,
    threshold: 20000,
    sparkles: true
  },
  4: { 
    name: 'Diamond', 
    gradient: 'from-purple-400 via-pink-400 to-purple-600',
    shadowColor: 'shadow-purple-500/40',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200',
    textColor: 'text-purple-800',
    glowColor: 'purple',
    icon: Diamond,
    threshold: 50000,
    sparkles: true
  }
} as const

interface SparkleProps {
  tier: LoyaltyTier
}

function SparkleEffect({ tier }: SparkleProps) {
  if (!TIER_CONFIG[tier].sparkles) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${20 + (i * 12)}%`,
            top: `${15 + (i % 2) * 35}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export interface TierBadgeProps {
  tier: LoyaltyTier
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  animated?: boolean
  variant?: 'default' | 'compact' | 'card'
  className?: string
  onClick?: () => void
}

export function TierBadge({ 
  tier, 
  size = 'md', 
  showLabel = true, 
  animated = true,
  variant = 'default',
  className = '',
  onClick
}: TierBadgeProps) {
  const config = TIER_CONFIG[tier]
  const Icon = config.icon
  
  const sizeConfig = {
    xs: { 
      container: 'h-6 w-6', 
      icon: 'h-3 w-3', 
      text: 'text-xs',
      padding: 'p-1.5'
    },
    sm: { 
      container: 'h-8 w-8', 
      icon: 'h-4 w-4', 
      text: 'text-sm',
      padding: 'p-2'
    },
    md: { 
      container: 'h-10 w-10', 
      icon: 'h-5 w-5', 
      text: 'text-base',
      padding: 'p-2.5'
    },
    lg: { 
      container: 'h-14 w-14', 
      icon: 'h-7 w-7', 
      text: 'text-lg',
      padding: 'p-3'
    },
    xl: { 
      container: 'h-20 w-20', 
      icon: 'h-10 w-10', 
      text: 'text-xl',
      padding: 'p-4'
    }
  }

  const sizeClasses = sizeConfig[size]

  // Animation variants for different interactions
  const badgeVariants = {
    idle: { 
      scale: 1,
      rotate: 0,
      boxShadow: tier >= 2 ? `0 0 20px rgba(${tier === 2 ? '251, 191, 36' : tier === 3 ? '59, 130, 246' : '168, 85, 247'}, 0.3)` : 'none'
    },
    hover: { 
      scale: 1.1,
      rotate: tier === 4 ? 5 : 0,
      boxShadow: tier >= 2 ? `0 0 30px rgba(${tier === 2 ? '251, 191, 36' : tier === 3 ? '59, 130, 246' : '168, 85, 247'}, 0.5)` : 'none'
    },
    tap: { 
      scale: 0.95,
      rotate: 0
    }
  }

  const pulseAnimation = animated && tier === 4 ? {
    boxShadow: [
      '0 0 0 0 rgba(168, 85, 247, 0.7)',
      '0 0 0 10px rgba(168, 85, 247, 0)',
      '0 0 0 0 rgba(168, 85, 247, 0)'
    ]
  } : {}

  if (variant === 'compact') {
    return (
      <motion.button
        className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-full ${config.bgColor} ${className}`}
        variants={badgeVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        onClick={onClick}
      >
        <Icon className={`${sizeClasses.icon} ${config.textColor}`} />
        {showLabel && (
          <span className={`font-medium ${config.textColor} ${sizeClasses.text}`}>
            {config.name}
          </span>
        )}
      </motion.button>
    )
  }

  if (variant === 'card') {
    return (
      <motion.div
        className={`p-4 rounded-lg ${config.bgColor} border-2 ${className}`}
        variants={badgeVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        onClick={onClick}
      >
        <div className="flex items-center space-x-3">
          <div className={`relative ${sizeClasses.container} rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center ${config.shadowColor} shadow-lg`}>
            <Icon className={`${sizeClasses.icon} text-white`} />
            <SparkleEffect tier={tier} />
          </div>
          <div>
            <div className={`font-bold ${config.textColor} ${sizeClasses.text}`}>
              {config.name} Tier
            </div>
            {tier > 0 && (
              <div className="text-xs text-muted-foreground">
                {config.threshold.toLocaleString()}+ points
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Default variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <motion.div 
        className={`relative ${sizeClasses.container} rounded-full bg-gradient-to-r ${config.gradient} ${sizeClasses.padding} flex items-center justify-center ${config.shadowColor} shadow-lg cursor-pointer`}
        variants={badgeVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        animate={animated ? pulseAnimation : {}}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        onClick={onClick}
      >
        <Icon className={`${sizeClasses.icon} text-white drop-shadow-sm`} />
        <SparkleEffect tier={tier} />
        
        {/* Premium glow effect for higher tiers */}
        {tier >= 3 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                `0 0 10px rgba(${tier === 3 ? '59, 130, 246' : '168, 85, 247'}, 0.3)`,
                `0 0 20px rgba(${tier === 3 ? '59, 130, 246' : '168, 85, 247'}, 0.5)`,
                `0 0 10px rgba(${tier === 3 ? '59, 130, 246' : '168, 85, 247'}, 0.3)`
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
      </motion.div>
      
      {showLabel && (
        <div className="flex flex-col">
          <motion.span 
            className={`font-bold ${config.textColor} ${sizeClasses.text}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {config.name}
          </motion.span>
          {tier >= 2 && config.sparkles && (
            <motion.div
              className="flex items-center space-x-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Sparkles className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground font-medium">
                Premium
              </span>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

export default TierBadge