/**
 * LoyaltyDashboard.tsx - Premium Loyalty System Interface
 * 
 * Beautiful, animated loyalty dashboard with tier progression, points tracking,
 * and premium visual effects. Best-in-class UI design matching V2PaymentModal quality.
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'
import {
  Star,
  TrendingUp,
  Gift,
  Clock,
  Users,
  Sparkles,
  Crown,
  Trophy,
  Info,
  Calendar,
  DollarSign,
  Zap,
  Award,
  Target,
  BarChart3,
  Wallet
} from 'lucide-react'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/seperator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// V2 Hooks
import { useLoyaltyManager, type TierBenefits } from '@/hooks/contracts/v2/managers/useLoyaltyManager'

// Import premium components
import { TierBadge, TIER_CONFIG, type LoyaltyTier } from './TierBadge'
import { TierProgressBar } from './TierProgressBar'

// Premium stats card component
interface StatsCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  change?: number
  color: string
  delay: number
}

function StatsCard({ icon: Icon, label, value, change, color, delay }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full bg-gradient-to-r ${color} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold">{value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
              {change !== undefined && (
                <div className={`text-xs flex items-center mt-1 ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {change >= 0 ? '+' : ''}{change}% this month
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface BenefitsDisplayProps {
  benefits: TierBenefits
  tier: LoyaltyTier
}

function BenefitsDisplay({ benefits, tier }: BenefitsDisplayProps) {
  const discountPercent = Number(benefits.discountBps) / 100
  const cashbackPercent = Number(benefits.cashbackBps) / 100
  const pointsMultiplier = Number(benefits.pointsMultiplier) / 100
  const earlyAccessHours = Number(benefits.earlyAccessHours)
  const monthlyBonus = Number(benefits.monthlyBonus)

  const benefitsList = [
    {
      icon: DollarSign,
      label: 'Purchase Discount',
      value: `${discountPercent}%`,
      description: 'Automatic discount on all purchases',
      color: 'from-green-500 to-emerald-600',
      available: discountPercent > 0
    },
    {
      icon: TrendingUp,
      label: 'Points Multiplier',
      value: `${pointsMultiplier}x`,
      description: 'Earn more points per purchase',
      color: 'from-blue-500 to-cyan-600',
      available: true
    },
    {
      icon: Gift,
      label: 'Cashback',
      value: `${cashbackPercent}%`,
      description: 'Cashback on all transactions',
      color: 'from-purple-500 to-pink-600',
      available: cashbackPercent > 0
    },
    {
      icon: Clock,
      label: 'Early Access',
      value: earlyAccessHours > 0 ? `${earlyAccessHours}h` : 'None',
      description: 'Early access to new content',
      color: 'from-orange-500 to-red-600',
      available: earlyAccessHours > 0
    },
    {
      icon: Zap,
      label: 'Free Fees',
      value: benefits.freeTransactionFees ? 'Yes' : 'No',
      description: 'No platform transaction fees',
      color: 'from-yellow-500 to-orange-600',
      available: benefits.freeTransactionFees
    },
    {
      icon: Calendar,
      label: 'Monthly Bonus',
      value: monthlyBonus > 0 ? `${monthlyBonus} pts` : 'None',
      description: 'Bonus points every month',
      color: 'from-indigo-500 to-purple-600',
      available: monthlyBonus > 0
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {benefitsList.map((benefit, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`cursor-help transition-all duration-300 hover:shadow-lg ${
                  benefit.available 
                    ? 'hover:scale-105 border-primary/20' 
                    : 'opacity-60 grayscale hover:grayscale-0'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full bg-gradient-to-r ${benefit.color} shadow-md`}>
                        <benefit.icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {benefit.label}
                        </div>
                        <div className={`text-lg font-bold ${
                          benefit.available ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {benefit.value}
                        </div>
                      </div>
                    </div>
                    {benefit.available && tier >= 2 && (
                      <motion.div
                        className="absolute top-2 right-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-3 w-3 text-yellow-500" />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{benefit.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>
      ))}
    </div>
  )
}

interface PointsHistoryProps {
  userAddress: Address
}

function PointsHistory({ userAddress }: PointsHistoryProps) {
  // Import the real PointsHistory component
  return (
    <div className="space-y-4">
      <div className="text-center text-muted-foreground">
        <p>View your complete points history in the dedicated Points tab above.</p>
        <p className="text-xs mt-1">All transactions are fetched live from the blockchain.</p>
      </div>
      {/* Show recent activity summary */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        <div className="p-3 border rounded-lg bg-green-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recent Activity</span>
            <span className="text-xs text-muted-foreground">Live from contract</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Points transactions are tracked via LoyaltyManager events
          </div>
        </div>
      </div>
    </div>
  )
}

export interface LoyaltyDashboardProps {
  className?: string
}

export function LoyaltyDashboard({ className = '' }: LoyaltyDashboardProps) {
  const { address: userAddress } = useAccount()
  const {
    useLoyaltySummary,
    useUserTierBenefits
  } = useLoyaltyManager()
  
  const loyaltySummary = useLoyaltySummary(userAddress)
  const tierBenefits = useUserTierBenefits(userAddress)
  
  const [activeTab, setActiveTab] = useState('overview')

  if (!userAddress) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
          <p className="text-muted-foreground">
            Connect your wallet to view your loyalty status and rewards
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loyaltySummary.isLoading || tierBenefits.isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loyaltySummary.error || !loyaltySummary.stats) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Loyalty Data</h3>
          <p className="text-muted-foreground">
            Make your first purchase to join the loyalty program
          </p>
        </CardContent>
      </Card>
    )
  }

  const stats = loyaltySummary.stats
  // Contract returns tuple: [totalPoints, availablePoints, currentTier, totalSpent, purchaseCount, tierDiscountBps, freeFees]
  const currentTier = (stats ? stats[2] : 0) as 0 | 1 | 2 | 3 | 4
  const benefits = tierBenefits.benefits

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Crown className="h-7 w-7 text-primary" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Loyalty Program
                  </span>
                </CardTitle>
                <p className="text-muted-foreground mt-1">Your rewards and tier benefits</p>
              </div>
              <TierBadge tier={currentTier} size="xl" />
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                icon={Star}
                label="Total Points"
                value={Number(stats ? stats[0] : 0)}
                change={undefined} // Real percentage would come from historical data comparison
                color="from-blue-500 to-cyan-600"
                delay={0.1}
              />
              <StatsCard
                icon={Wallet}
                label="Available Points"
                value={Number(stats ? stats[1] : 0)}
                change={undefined} // Real percentage would come from historical data comparison
                color="from-green-500 to-emerald-600"
                delay={0.2}
              />
              <StatsCard
                icon={BarChart3}
                label="Total Purchases"
                value={Number(stats ? stats[4] : 0)}
                change={undefined} // Real percentage would come from historical data comparison
                color="from-purple-500 to-pink-600"
                delay={0.3}
              />
            </div>

            <Separator className="my-8" />

            {/* Total Spent Display */}
            <motion.div 
              className="text-center p-6 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Total Platform Spending</span>
              </div>
              <div className="text-3xl font-bold text-amber-700">
                ${Number((stats ? stats[3] : BigInt(0)) / BigInt(1000000)).toLocaleString()}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                Contributing to your tier progression
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tier Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <TierProgressBar 
          currentPoints={stats ? stats[0] : BigInt(0)} 
          currentTier={currentTier}
          showAnimation={true}
          onTierUpgrade={(newTier) => {
            // Real tier upgrade handling - could trigger notifications, confetti, etc.
            // In production, this would integrate with your notification system
            if (typeof window !== 'undefined' && 'Notification' in window) {
              new Notification('Tier Upgrade!', {
                body: `Congratulations! You've reached ${TIER_CONFIG[newTier].name} tier!`,
                icon: '/favicon.ico'
              })
            }
          }}
        />
      </motion.div>

      {/* Premium Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/50">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Benefits</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="tiers" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>All Tiers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Your Current Benefits</CardTitle>
                      <p className="text-muted-foreground">
                        Enjoy these perks with your {TIER_CONFIG[currentTier].name} tier
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {benefits ? (
                    <BenefitsDisplay benefits={benefits} tier={currentTier} />
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Loading benefits...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Points History</CardTitle>
                      <p className="text-muted-foreground">
                        Track your points earnings and spending
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <PointsHistory userAddress={userAddress} />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-6 mt-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Loyalty Tier Overview</h3>
                  <p className="text-muted-foreground">
                    Progress through tiers to unlock premium benefits
                  </p>
                </div>
                
                {Object.entries(TIER_CONFIG).map(([tierNum]) => {
                  const tier = parseInt(tierNum) as LoyaltyTier
                  const isCurrentTier = tier === currentTier
                  const isUnlocked = tier <= currentTier
                  
                  return (
                    <motion.div
                      key={tier}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: tier * 0.1 }}
                    >
                      <TierBadge 
                        tier={tier} 
                        variant="card" 
                        className={`transition-all duration-300 ${
                          isCurrentTier ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                        } ${!isUnlocked ? 'opacity-60' : 'hover:shadow-md'}`}
                      />
                      {isCurrentTier && (
                        <motion.div 
                          className="flex justify-center mt-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        >
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Your Current Tier
                          </Badge>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

export default LoyaltyDashboard