/**
 * TierProgressBar.tsx - Premium Animated Tier Progress Bar
 * 
 * Beautiful progress visualization with particle effects, milestone markers,
 * and smooth animations showing progression through loyalty tiers.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Crown,
  Star,
  TrendingUp
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { TIER_CONFIG, type LoyaltyTier } from './TierBadge'

interface ParticleProps {
  x: number
  y: number
  color: string
  delay: number
}

function Particle({ x, y, color, delay }: ParticleProps) {
  return (
    <motion.div
      className={`absolute w-1 h-1 ${color} rounded-full`}
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        y: [0, -20, -40]
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 3
      }}
    />
  )
}

interface ConfettiProps {
  trigger: boolean
  tier: LoyaltyTier
}

function ConfettiEffect({ trigger }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, color: string, rotation: number}>>([])

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 50 + 25,
        color: ['bg-yellow-400', 'bg-purple-400', 'bg-blue-400', 'bg-pink-400'][Math.floor(Math.random() * 4)],
        rotation: Math.random() * 360
      }))
      setParticles(newParticles)
      
      setTimeout(() => setParticles([]), 3000)
    }
  }, [trigger])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute w-2 h-2 ${particle.color} rounded-sm`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              rotate: particle.rotation
            }}
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{
              opacity: 0,
              scale: 0,
              y: -100,
              rotate: particle.rotation + 360
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface MilestoneMarkerProps {
  tier: LoyaltyTier
  position: number
  isActive: boolean
  isCompleted: boolean
  isNext: boolean
}

function MilestoneMarker({ tier, position, isActive, isCompleted, isNext }: MilestoneMarkerProps) {
  const config = TIER_CONFIG[tier]
  const Icon = config.icon

  return (
    <motion.div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${position}%`, top: '50%' }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: tier * 0.1, type: "spring", stiffness: 200 }}
    >
      <motion.div
        className={`relative w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${
          isCompleted || isActive
            ? `bg-gradient-to-r ${config.gradient} border-white shadow-lg ${config.shadowColor}`
            : isNext 
              ? 'bg-white border-primary shadow-md'
              : 'bg-muted border-muted-foreground'
        }`}
        whileHover={{ scale: 1.2 }}
        animate={isActive ? {
          boxShadow: [
            `0 0 0 0 rgba(${tier === 2 ? '251, 191, 36' : tier === 3 ? '59, 130, 246' : '168, 85, 247'}, 0.4)`,
            `0 0 0 8px rgba(${tier === 2 ? '251, 191, 36' : tier === 3 ? '59, 130, 246' : '168, 85, 247'}, 0)`,
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Icon 
          className={`w-4 h-4 ${
            isCompleted || isActive ? 'text-white' : isNext ? 'text-primary' : 'text-muted-foreground'
          }`} 
        />
        
        {/* Sparkle effect for premium tiers */}
        {(isCompleted || isActive) && tier >= 2 && (
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
          </motion.div>
        )}
      </motion.div>
      
      {/* Tier label */}
      <motion.div
        className="absolute top-10 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: tier * 0.1 + 0.3 }}
      >
        <div className={`text-xs font-medium text-center ${
          isCompleted || isActive ? config.textColor : 'text-muted-foreground'
        }`}>
          {config.name}
        </div>
        {tier > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {config.threshold.toLocaleString()}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export interface TierProgressBarProps {
  currentPoints: bigint
  currentTier: LoyaltyTier
  className?: string
  showAnimation?: boolean
  onTierUpgrade?: (newTier: LoyaltyTier) => void
}

export function TierProgressBar({ 
  currentPoints, 
  currentTier, 
  className = '',
  showAnimation = true,
  onTierUpgrade
}: TierProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [previousTier, setPreviousTier] = useState(currentTier)

  const currentThreshold = TIER_CONFIG[currentTier].threshold
  const nextTier = Math.min(currentTier + 1, 4) as LoyaltyTier
  const nextThreshold = TIER_CONFIG[nextTier].threshold
  
  const isMaxTier = currentTier === 4
  const points = Number(currentPoints)
  
  const progress = isMaxTier 
    ? 100 
    : ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100

  const pointsToNext = isMaxTier ? 0 : nextThreshold - points

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(Math.max(0, Math.min(100, progress)))
    }, 500)
    return () => clearTimeout(timer)
  }, [progress])

  // Detect tier upgrades
  useEffect(() => {
    if (currentTier > previousTier && showAnimation) {
      setShowConfetti(true)
      onTierUpgrade?.(currentTier)
      setTimeout(() => setShowConfetti(false), 3000)
    }
    setPreviousTier(currentTier)
  }, [currentTier, previousTier, showAnimation, onTierUpgrade])

  // Calculate milestone positions
  const milestones = Object.entries(TIER_CONFIG).map(([tierNum]) => {
    const tier = parseInt(tierNum) as LoyaltyTier
    let position: number
    
    if (tier === 0) position = 0
    else if (tier === 4) position = 100
    else {
      // Distribute tiers evenly across the progress bar
      position = (tier / 4) * 100
    }
    
    return {
      tier,
      position,
      isActive: tier === currentTier,
      isCompleted: tier < currentTier,
      isNext: tier === nextTier && !isMaxTier
    }
  })

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Tier Progress</h3>
          </div>
          {!isMaxTier ? (
            <Badge variant="outline" className="space-x-1">
              <span>{pointsToNext.toLocaleString()}</span>
              <span>to {TIER_CONFIG[nextTier].name}</span>
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Crown className="h-3 w-3 mr-1" />
              Max Tier
            </Badge>
          )}
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          {/* Points Display */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{points.toLocaleString()} points</span>
            </div>
            {!isMaxTier && (
              <div className="text-muted-foreground">
                Goal: {nextThreshold.toLocaleString()}
              </div>
            )}
          </div>

          {/* Main Progress Bar Container */}
          <div className="relative">
            {/* Background Progress Bar */}
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${TIER_CONFIG[currentTier].gradient} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${animatedProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                {/* Animated shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </motion.div>
              
              {/* Particle effects along progress bar */}
              {showAnimation && animatedProgress > 0 && (
                <div className="absolute inset-0">
                  {[...Array(5)].map((_, i) => (
                    <Particle
                      key={i}
                      x={Math.min(animatedProgress - 5, Math.max(5, (animatedProgress / 5) * (i + 1)))}
                      y={50}
                      color="bg-white"
                      delay={i * 0.2}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Milestone Markers */}
            <div className="relative mt-2 mb-8">
              {milestones.map(({ tier, position, isActive, isCompleted, isNext }) => (
                <MilestoneMarker
                  key={tier}
                  tier={tier}
                  position={position}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  isNext={isNext}
                />
              ))}
            </div>

            {/* Confetti Effect */}
            <ConfettiEffect trigger={showConfetti} tier={currentTier} />
          </div>

          {/* Next Tier Preview */}
          {!isMaxTier && (
            <motion.div 
              className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-gradient-to-r ${TIER_CONFIG[nextTier].gradient}`}>
                    {React.createElement(TIER_CONFIG[nextTier].icon, { className: "h-4 w-4 text-white" })}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Next: {TIER_CONFIG[nextTier].name} Tier</div>
                    <div className="text-xs text-muted-foreground">
                      Unlock premium benefits and higher rewards
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {pointsToNext.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">points needed</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Max Tier Achievement */}
          {isMaxTier && (
            <motion.div 
              className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="flex items-center justify-center space-x-2 text-purple-700">
                <Crown className="h-5 w-5" />
                <span className="font-bold">Maximum Tier Achieved!</span>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-center text-sm text-purple-600 mt-1">
                You've unlocked all premium benefits and rewards
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TierProgressBar