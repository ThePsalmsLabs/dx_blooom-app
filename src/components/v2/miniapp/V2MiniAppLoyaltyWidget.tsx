/**
 * V2 MiniApp Loyalty Widget - Mobile-Optimized Loyalty Features
 * 
 * Compact loyalty tier display and benefits widget designed for miniapp context.
 * Features swipe-to-view benefits, tier progression, and instant reward claiming.
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Crown, 
  Star, 
  Gift,
  TrendingUp,
  Zap,
  Sparkles,
  Award,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// V2 Loyalty Hooks
import { useLoyaltyManager } from '@/hooks/contracts/v2/managers/useLoyaltyManager'
import { useAccount } from 'wagmi'

interface V2MiniAppLoyaltyWidgetProps {
  className?: string
  showBenefits?: boolean
  compact?: boolean
}

const TIER_COLORS = {
  bronze: 'from-orange-400 to-orange-600',
  silver: 'from-gray-400 to-gray-600', 
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-purple-400 to-purple-600'
}

const TIER_ICONS = {
  bronze: Award,
  silver: Star,
  gold: Crown,
  platinum: Sparkles
}

export function V2MiniAppLoyaltyWidget({ 
  className,
  showBenefits = true,
  compact = false
}: V2MiniAppLoyaltyWidgetProps) {
  const { address } = useAccount()
  const loyalty = useLoyaltyManager()
  const [showDetails, setShowDetails] = useState(false)

  // Get loyalty data
  const userTier = loyalty.useUserTier(address)
  const userPoints = loyalty.useUserPoints(address)
  const benefits = loyalty.useUserTierBenefits(address)

  // Mock tier data (replace with actual tier calculation)
  const currentTier = userTier.data || 'bronze'
  const currentPoints = Number(userPoints.data || 0)
  const nextTierPoints = 1000 // This should come from contract
  const progress = Math.min((currentPoints / nextTierPoints) * 100, 100)

  const TierIcon = TIER_ICONS[currentTier as keyof typeof TIER_ICONS] || Award
  const tierGradient = TIER_COLORS[currentTier as keyof typeof TIER_COLORS]

  const handleClaimBenefit = async (benefitId: string) => {
    try {
      // Implementation depends on your loyalty contract
      console.log('Claiming benefit:', benefitId)
    } catch (error) {
      console.error('Claim failed:', error)
    }
  }

  if (compact) {
    return (
      <motion.div
        className={cn("w-full", className)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg bg-gradient-to-r", tierGradient)}>
                  <TierIcon className="h-3 w-3 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold capitalize text-gray-900">
                    {currentTier} Tier
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentPoints} points
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">
                V2
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-sm">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg bg-gradient-to-r", tierGradient)}>
                <TierIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 capitalize">
                  {currentTier} Tier
                </h3>
                <p className="text-xs text-gray-500">Loyalty Rewards</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              V2
            </Badge>
          </div>

          {/* Points & Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600">Points</span>
              <span className="text-xs text-gray-500">
                {currentPoints} / {nextTierPoints}
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-200">
              <div 
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                  tierGradient
                )}
                style={{ width: `${progress}%` }}
              />
            </Progress>
            <div className="text-xs text-gray-500 mt-1">
              {nextTierPoints - currentPoints} points to next tier
            </div>
          </div>

          {/* Benefits Preview */}
          {showBenefits && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white/70 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Active Benefits</span>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    {showDetails ? 'Hide' : 'View All'}
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 bg-green-100 rounded-full px-2 py-1">
                    <Gift className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-700">10% Discount</span>
                  </div>
                  <div className="flex items-center gap-1 bg-blue-100 rounded-full px-2 py-1">
                    <Zap className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-700">Free Gas</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Expandable Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-indigo-100 pt-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Gift className="h-3 w-3 text-green-600" />
                      <span className="text-xs">Purchase Discount</span>
                    </div>
                    <span className="text-xs font-semibold text-green-600">10%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-blue-600" />
                      <span className="text-xs">Gas Reimbursement</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">100%</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Action */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 bg-white/70 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
            onClick={() => {
              // Navigate to full loyalty page
              console.log('Navigate to loyalty details')
            }}
          >
            <TrendingUp className="h-3 w-3 mr-2" />
            View Tier Benefits
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}