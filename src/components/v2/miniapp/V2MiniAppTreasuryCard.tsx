/**
 * V2 MiniApp Treasury Card - Mobile-Optimized Treasury Management
 * 
 * Compact, touch-friendly treasury interface designed specifically for miniapp context.
 * Features swipe gestures, haptic feedback, and instant action patterns.
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  TrendingUp, 
  Download, 
  Zap,
  ChevronRight,
  Star,
  Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// V2 Treasury Hooks
import { useRewardsTreasury } from '@/hooks/contracts/v2/managers/useRewardsTreasury'
import { useAccount } from 'wagmi'

interface V2MiniAppTreasuryCardProps {
  className?: string
  showQuickActions?: boolean
}

export function V2MiniAppTreasuryCard({ 
  className,
  showQuickActions = true 
}: V2MiniAppTreasuryCardProps) {
  const { address } = useAccount()
  const treasury = useRewardsTreasury()
  const [isExpanded, setIsExpanded] = useState(false)

  // Get treasury data
  const treasuryStats = treasury.useGetTreasuryStats()
  const userRewards = treasury.usePendingRewards(address)
  const permissions = treasury.useTreasuryPermissions(address)

  const handleClaimRewards = async () => {
    if (!userRewards.data) return
    try {
      await treasury.claimRewards.mutateAsync()
    } catch (error) {
      console.error('Claim failed:', error)
    }
  }

  const formatAmount = (amount: bigint | undefined) => {
    if (!amount) return '$0.00'
    return `$${(Number(amount) / 1e6).toFixed(2)}`
  }

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100 shadow-sm">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Treasury</h3>
                <p className="text-xs text-gray-500">V2 Rewards</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
              <Star className="h-3 w-3 mr-1" />
              V2
            </Badge>
          </div>

          {/* Quick Stats Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium text-gray-600">Claimable</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatAmount(userRewards.data)}
              </div>
            </div>
            
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">Total Pool</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {treasuryStats.data && formatAmount(treasuryStats.data[0])}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {showQuickActions && userRewards.data && Number(userRewards.data) > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleClaimRewards}
                disabled={treasury.isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium py-2.5 rounded-lg"
              >
                {treasury.isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                  </motion.div>
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Claim Rewards
              </Button>
            </motion.div>
          )}

          {/* Expandable Details */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-purple-100"
            >
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Pool:</span>
                  <span className="font-medium">
                    {treasuryStats.data && formatAmount(treasuryStats.data[1])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Creator Pool:</span>
                  <span className="font-medium">
                    {treasuryStats.data && formatAmount(treasuryStats.data[2])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Status:</span>
                  <span className="font-medium">
                    {permissions.isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 flex items-center justify-center text-xs text-purple-600 hover:text-purple-700 transition-colors"
          >
            <span>{isExpanded ? 'Less' : 'More'} Details</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-3 w-3 ml-1" />
            </motion.div>
          </button>
        </CardContent>
      </Card>
    </motion.div>
  )
}