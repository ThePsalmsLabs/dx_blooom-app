/**
 * Treasury Dashboard Component - V2 Treasury Management Interface
 * 
 * Best-in-class UI/UX for treasury management with modern design patterns,
 * micro-interactions, and delightful user experience.
 */

import React, { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRewardsTreasury } from '@/hooks/contracts/v2/managers/useRewardsTreasury'
import { formatUnits } from 'viem'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  Wallet, 
  Users, 
  Gift,
  Crown,
  Shield,
  AlertCircle,
  Sparkles,
  Trophy,
  Target,
  Activity,
  Clock,
  Star,
  Zap,
  Eye
} from 'lucide-react'

interface TreasuryDashboardProps {
  variant?: 'admin' | 'user'
  className?: string
}

// Animation variants for smooth transitions
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0
  }
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.02, 1],
    transition: { duration: 2, repeat: Infinity }
  }
}

export function TreasuryDashboard({ 
  variant = 'user',
  className = '' 
}: TreasuryDashboardProps) {
  const { address: userAddress } = useAccount()
  const [activeTab, setActiveTab] = useState('overview')
  const [isClaimingRewards, setIsClaimingRewards] = useState(false)
  
  const {
    useTreasuryOverview,
    useUserRewardsSummary,
    useTreasuryPermissions,
    claimRewards,
    isLoading
  } = useRewardsTreasury()

  const treasuryOverview = useTreasuryOverview()
  const userRewards = useUserRewardsSummary(userAddress)
  const permissions = useTreasuryPermissions(userAddress)

  // Memoized calculations for better performance
  const treasuryMetrics = useMemo(() => {
    if (!treasuryOverview.stats) return null
    
    const [totalBalance, customerPool, creatorPool, operationalPool, reservePool] = treasuryOverview.stats
    const total = totalBalance || BigInt(0)
    
    return {
      totalBalance: total,
      pools: [
        {
          name: 'Customer Rewards',
          value: customerPool || BigInt(0),
          percentage: total > 0 ? Number((customerPool || BigInt(0)) * BigInt(100) / total) : 0,
          icon: Users,
          color: 'from-blue-500 to-blue-600',
          description: 'Available for user rewards and loyalty programs'
        },
        {
          name: 'Creator Incentives',
          value: creatorPool || BigInt(0),
          percentage: total > 0 ? Number((creatorPool || BigInt(0)) * BigInt(100) / total) : 0,
          icon: Crown,
          color: 'from-purple-500 to-purple-600',
          description: 'Funding creator incentive programs'
        },
        {
          name: 'Operations',
          value: operationalPool || BigInt(0),
          percentage: total > 0 ? Number((operationalPool || BigInt(0)) * BigInt(100) / total) : 0,
          icon: Activity,
          color: 'from-green-500 to-green-600',
          description: 'Platform operations and development'
        },
        {
          name: 'Reserve Fund',
          value: reservePool || BigInt(0),
          percentage: total > 0 ? Number((reservePool || BigInt(0)) * BigInt(100) / total) : 0,
          icon: Shield,
          color: 'from-amber-500 to-amber-600',
          description: 'Emergency reserves and future growth'
        }
      ]
    }
  }, [treasuryOverview.stats])

  const userMetrics = useMemo(() => {
    if (!userRewards.pendingRewards && !userRewards.claimableRewards) return null
    
    const pending = userRewards.pendingRewards || BigInt(0)
    const contributed = userRewards.claimableRewards || BigInt(0)
    
    return {
      pendingRewards: pending,
      totalContributed: contributed,
      canClaim: pending > BigInt(0),
      rewardTier: pending > BigInt(100_000000) ? 'Premium' : pending > BigInt(10_000000) ? 'Gold' : 'Silver' // USDC has 6 decimals
    }
  }, [userRewards])

  const handleClaimRewards = async () => {
    setIsClaimingRewards(true)
    try {
      await claimRewards.mutateAsync()
      toast.success('🎉 Rewards Claimed!', {
        description: 'Your rewards have been successfully transferred to your wallet',
        action: {
          label: 'View Transaction',
          onClick: () => console.log('View tx')
        }
      })
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      toast.error('Claim Failed', {
        description: 'Unable to claim rewards. Please try again.'
      })
    } finally {
      setIsClaimingRewards(false)
    }
  }

  // Loading state with elegant skeleton
  if (treasuryOverview.isLoading || userRewards.isLoading) {
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={`space-y-8 ${className}`}
      >
        {/* Header Skeleton */}
        <motion.div 
          variants={itemVariants} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-2"
        >
          <div className="h-8 w-64 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse" />
        </motion.div>
        
        {/* Stats Grid Skeleton */}
        <motion.div 
          variants={itemVariants} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-xl animate-pulse" />
          ))}
        </motion.div>
        
        {/* Content Skeleton */}
        <motion.div 
          variants={itemVariants} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="h-64 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-xl animate-pulse" />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`space-y-8 ${className}`}
    >
      {/* Hero Header with Gradient Background */}
      <motion.div 
        variants={itemVariants}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 p-8 text-white"
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Treasury Dashboard</h1>
                <p className="text-white/80">
                  {variant === 'admin' 
                    ? 'Manage platform treasury and revenue distribution' 
                    : 'Track your rewards and participate in treasury growth'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {permissions.isAdmin && (
            <Badge variant="secondary" className="gap-2 bg-white/20 text-white border-white/30">
              <Shield className="h-3 w-3" />
              Admin Access
            </Badge>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
      </motion.div>

      {/* Treasury Stats Grid */}
      <motion.div 
        variants={itemVariants} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {treasuryMetrics?.pools.map((pool, index) => {
          const Icon = pool.icon
          return (
            <motion.div
              key={pool.name}
              variants={pulseVariants}
              whileHover="pulse"
              className="group"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {pool.name}
                  </CardTitle>
                  <div className={`rounded-full bg-gradient-to-r ${pool.color} p-2 text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${formatUnits(pool.value, 6)}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {pool.percentage.toFixed(1)}% of total
                    </p>
                    {pool.percentage > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div 
        variants={itemVariants} 
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="h-4 w-4" />
              My Rewards
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Treasury Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {treasuryMetrics?.pools.map((pool, index) => (
                    <motion.div
                      key={pool.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full bg-gradient-to-r ${pool.color} p-1.5 text-white`}>
                            <pool.icon className="h-3 w-3" />
                          </div>
                          <div>
                            <p className="font-medium">{pool.name}</p>
                            <p className="text-xs text-muted-foreground">{pool.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${formatUnits(pool.value, 6)}</p>
                          <p className="text-xs text-muted-foreground">{pool.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <Progress 
                        value={pool.percentage} 
                        className="h-2"
                      />
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <AnimatePresence>
              {userAddress ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Rewards Hero Card */}
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 p-2 text-white">
                          <Gift className="h-5 w-5" />
                        </div>
                        Your Rewards Overview
                        {userMetrics?.rewardTier && (
                          <Badge variant="outline" className="ml-auto">
                            <Star className="h-3 w-3 mr-1" />
                            {userMetrics.rewardTier} Member
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Pending Rewards */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="space-y-3 p-4 rounded-xl bg-white/50"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                            <p className="font-medium">Pending Rewards</p>
                          </div>
                          <p className="text-3xl font-bold text-emerald-600">
                            ${userMetrics?.pendingRewards ? formatUnits(userMetrics.pendingRewards, 6) : '0.00'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Ready to claim
                          </p>
                        </motion.div>

                        {/* Total Contributed */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="space-y-3 p-4 rounded-xl bg-white/50"
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <p className="font-medium">Total Contributed</p>
                          </div>
                          <p className="text-3xl font-bold text-blue-600">
                            ${userMetrics?.totalContributed ? formatUnits(userMetrics.totalContributed, 6) : '0.00'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Platform revenue shared
                          </p>
                        </motion.div>
                      </div>

                      {/* Claim Button */}
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Button 
                          onClick={handleClaimRewards}
                          disabled={!userMetrics?.canClaim || isClaimingRewards}
                          size="lg"
                          className={cn(
                            "w-full h-14 text-lg font-semibold",
                            userMetrics?.canClaim 
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                              : "bg-muted"
                          )}
                        >
                          {isClaimingRewards ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2"
                              />
                              Claiming Rewards...
                            </>
                          ) : userMetrics?.canClaim ? (
                            <>
                              <Zap className="h-5 w-5 mr-2" />
                              Claim ${formatUnits(userMetrics.pendingRewards, 6)}
                            </>
                          ) : (
                            <>
                              <Clock className="h-5 w-5 mr-2" />
                              No Rewards Available
                            </>
                          )}
                        </Button>
                      </motion.div>

                      {!userMetrics?.canClaim && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200"
                        >
                          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900">Earn More Rewards</p>
                            <p className="text-sm text-blue-700">
                              Complete purchases, engage with content, and refer friends to earn treasury rewards
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-muted-foreground">
                    Connect your wallet to view and claim your treasury rewards
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Treasury Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                    <p className="text-muted-foreground">
                      Detailed treasury analytics and performance metrics coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}

export default TreasuryDashboard