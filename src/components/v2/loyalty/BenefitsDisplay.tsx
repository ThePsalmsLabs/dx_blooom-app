/**
 * BenefitsDisplay.tsx - Loyalty Benefits Showcase Component
 * 
 * Displays current tier benefits, next tier preview, and benefits comparison
 * Following established V2 patterns with real contract integration
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'
import {
  Gift,
  Percent,
  DollarSign,
  Clock,
  Zap,
  Star,
  Check,
  Lock,
  Sparkles,
  Crown,
  Award,
  Target,
  ArrowRight
} from 'lucide-react'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// V2 Hooks and Types
import { useLoyaltyManager, type TierBenefits } from '@/hooks/contracts/v2/managers/useLoyaltyManager'
import { TierBadge, TIER_CONFIG, type LoyaltyTier } from './TierBadge'

// Type guard to validate tier
function isValidLoyaltyTier(tier: number | undefined): tier is LoyaltyTier {
  return tier !== undefined && tier >= 0 && tier <= 4 && Number.isInteger(tier)
}

export interface BenefitsDisplayProps {
  userAddress?: Address
  className?: string
  variant?: 'full' | 'compact' | 'comparison'
  showNextTier?: boolean
}

interface BenefitItemProps {
  icon: React.ElementType
  label: string
  value: string | number
  isActive: boolean
  highlight?: boolean
  description?: string
}

function BenefitItem({ icon: Icon, label, value, isActive, highlight, description }: BenefitItemProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
              isActive 
                ? highlight 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                  : 'bg-muted/50 border-border'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                isActive 
                  ? highlight 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={`font-medium ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-semibold ${
                isActive 
                  ? highlight 
                    ? 'text-green-700' 
                    : 'text-primary'
                  : 'text-muted-foreground'
              }`}>
                {value}
              </span>
              {isActive ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        {description && (
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

export function BenefitsDisplay({
  userAddress,
  className = '',
  variant = 'full',
  showNextTier = true
}: BenefitsDisplayProps) {
  const { address: connectedAddress } = useAccount()
  const address = userAddress || connectedAddress
  
  const [selectedView, setSelectedView] = useState<'current' | 'next' | 'comparison'>('current')
  
  // Get loyalty data using established hooks
  const { 
    useUserTier, 
    useTierBenefits
  } = useLoyaltyManager()
  const { data: rawCurrentTier, isLoading: tierLoading } = useUserTier(address)
  
  // Validate and cast tier to proper type
  const currentTier = isValidLoyaltyTier(rawCurrentTier) ? rawCurrentTier : undefined
  const { data: currentBenefits, isLoading: benefitsLoading } = useTierBenefits(currentTier)
  
  // Get next tier info
  const nextTier = (currentTier !== undefined && currentTier < 4) ? ((currentTier + 1) as LoyaltyTier) : undefined
  const { data: nextTierBenefits } = useTierBenefits(nextTier)
  
  const isLoading = tierLoading || benefitsLoading
  
  // Format benefit values
  const formatDiscount = (bps: bigint) => `${Number(bps) / 100}%`
  const formatMultiplier = (multiplier: bigint) => `${Number(multiplier) / 100}x`
  const formatCashback = (bps: bigint) => `${Number(bps) / 100}%`
  const formatBonus = (bonus: bigint) => `${Number(bonus)} points`
  const formatHours = (hours: bigint) => `${Number(hours)}h early`

  // Get benefit items for a tier
  const getBenefitItems = (benefits: TierBenefits | undefined, tier: LoyaltyTier | undefined) => {
    if (!benefits || tier === undefined) return []
    
    return [
      {
        icon: Percent,
        label: 'Purchase Discount',
        value: formatDiscount(benefits.discountBps),
        isActive: Number(benefits.discountBps) > 0,
        highlight: true,
        description: 'Automatic discount applied to all purchases'
      },
      {
        icon: Star,
        label: 'Points Multiplier',
        value: formatMultiplier(benefits.pointsMultiplier),
        isActive: Number(benefits.pointsMultiplier) > 100,
        description: 'Extra points earned on every purchase'
      },
      {
        icon: DollarSign,
        label: 'Cashback Rate',
        value: formatCashback(benefits.cashbackBps),
        isActive: Number(benefits.cashbackBps) > 0,
        description: 'Cashback on completed purchases'
      },
      {
        icon: Clock,
        label: 'Early Access',
        value: formatHours(benefits.earlyAccessHours),
        isActive: Number(benefits.earlyAccessHours) > 0,
        description: 'Get early access to new content'
      },
      {
        icon: Zap,
        label: 'Free Gas Fees',
        value: benefits.freeTransactionFees ? 'Enabled' : 'Disabled',
        isActive: benefits.freeTransactionFees,
        highlight: benefits.freeTransactionFees,
        description: 'Platform covers all transaction fees'
      },
      {
        icon: Gift,
        label: 'Monthly Bonus',
        value: formatBonus(benefits.monthlyBonus),
        isActive: Number(benefits.monthlyBonus) > 0,
        description: 'Bonus points awarded monthly'
      },
      {
        icon: Award,
        label: 'Referral Bonus',
        value: formatBonus(benefits.referralBonus),
        isActive: Number(benefits.referralBonus) > 0,
        description: 'Points earned per successful referral'
      }
    ]
  }

  const currentBenefitItems = getBenefitItems(currentBenefits, currentTier)
  const nextBenefitItems = getBenefitItems(nextTierBenefits, nextTier)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!address || currentTier === undefined) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Connect your wallet to view loyalty benefits</p>
        </CardContent>
      </Card>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Current Benefits
            </CardTitle>
            <TierBadge tier={currentTier} size="sm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentBenefitItems.slice(0, 3).map((item, index) => (
            <BenefitItem
              key={index}
              icon={item.icon}
              label={item.label}
              value={item.value}
              isActive={item.isActive}
              highlight={item.highlight}
              description={item.description}
            />
          ))}
          {currentBenefitItems.length > 3 && (
            <div className="text-center pt-2">
              <span className="text-sm text-muted-foreground">
                +{currentBenefitItems.length - 3} more benefits
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Comparison variant
  if (variant === 'comparison') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Tier Benefits Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Current Tier */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TierBadge tier={currentTier} size="sm" />
                <span className="font-medium">Current Benefits</span>
              </div>
              <div className="space-y-2">
                {currentBenefitItems.map((item, index) => (
                  <BenefitItem
                    key={index}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                    isActive={item.isActive}
                    highlight={item.highlight}
                    description={item.description}
                  />
                ))}
              </div>
            </div>

            {/* Next Tier */}
            {nextTier !== undefined && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TierBadge tier={nextTier} size="sm" />
                  <span className="font-medium">Next Tier Benefits</span>
                  <Badge variant="outline" className="text-xs">
                    Upgrade Available
                  </Badge>
                </div>
                <div className="space-y-2">
                  {nextBenefitItems.map((item, index) => (
                    <BenefitItem
                      key={index}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      isActive={true}
                      highlight={
                        currentBenefitItems[index]?.value !== item.value ||
                        !currentBenefitItems[index]?.isActive
                      }
                      description={item.description}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full variant
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Loyalty Benefits
          </CardTitle>
          <TierBadge tier={currentTier} size="md" showLabel />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'current' | 'next' | 'comparison')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current Benefits</TabsTrigger>
            <TabsTrigger value="next" disabled={!nextTier}>
              Next Tier
            </TabsTrigger>
            <TabsTrigger value="comparison">Compare Tiers</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4 mt-6">
            <div className="space-y-3">
              {currentBenefitItems.map((item, index) => (
                <BenefitItem
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  isActive={item.isActive}
                  highlight={item.highlight}
                  description={item.description}
                />
              ))}
            </div>

            {showNextTier && nextTier !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Ready to upgrade to {TIER_CONFIG[nextTier]?.name}?
                    </h4>
                    <p className="text-sm text-blue-700">
                      Unlock enhanced benefits and rewards
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedView('next')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    View Benefits
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="next" className="space-y-4 mt-6">
            {nextTier !== undefined && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <TierBadge tier={nextTier} size="md" />
                  <div>
                    <h3 className="font-semibold">
                      {TIER_CONFIG[nextTier]?.name} Tier Benefits
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock these enhanced rewards
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {nextBenefitItems.map((item, index) => (
                    <BenefitItem
                      key={index}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      isActive={true}
                      highlight={
                        currentBenefitItems[index]?.value !== item.value ||
                        !currentBenefitItems[index]?.isActive
                      }
                      description={item.description}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Tier Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TierBadge tier={currentTier} size="sm" />
                  <span className="font-medium">Current: {TIER_CONFIG[currentTier]?.name}</span>
                </div>
                <div className="space-y-2">
                  {currentBenefitItems.map((item, index) => (
                    <BenefitItem
                      key={index}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      isActive={item.isActive}
                      description={item.description}
                    />
                  ))}
                </div>
              </div>

              {/* Next Tier Column */}
              {nextTier !== undefined && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TierBadge tier={nextTier} size="sm" />
                    <span className="font-medium">Next: {TIER_CONFIG[nextTier]?.name}</span>
                  </div>
                  <div className="space-y-2">
                    {nextBenefitItems.map((item, index) => (
                      <BenefitItem
                        key={index}
                        icon={item.icon}
                        label={item.label}
                        value={item.value}
                        isActive={true}
                        highlight={
                          currentBenefitItems[index]?.value !== item.value ||
                          !currentBenefitItems[index]?.isActive
                        }
                        description={item.description}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default BenefitsDisplay