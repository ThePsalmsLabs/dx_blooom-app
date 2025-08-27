/**
 * AdaptiveUIModule - Intelligent Presentation Orchestration System
 * 
 * This module provides sophisticated UI orchestration that unifies the user experience
 * patterns from both OrchestratedContentPurchaseCard and OrchestratedContentPurchaseCard into
 * a single, intelligent system. It creates adaptive interfaces that respond dynamically
 * to system health, user capabilities, and contextual complexity requirements.
 * 
 * Key Features:
 * - Health-aware UI adaptation that adjusts complexity based on system status
 * - Progressive complexity disclosure with intelligent feature gating
 * - Unified error handling and recovery UX across all interaction patterns
 * - Contextual payment method recommendations with visual hierarchy optimization
 * - Adaptive loading states and performance feedback systems
 * - Accessibility-first design with semantic interaction patterns
 * - Cross-device responsive behavior with contextual feature prioritization
 * 
 * Design Philosophy:
 * - "Complexity as a Service" - Show users exactly what they need, when they need it
 * - "Trust Through Transparency" - Make sophisticated operations feel understandable
 * - "Graceful Degradation" - Maintain functionality even when advanced features fail
 * - "Progressive Enhancement" - Build from simple, then add sophistication
 * 
 * Architecture Integration:
 * - Builds on BalanceManagementModule for financial context awareness
 * - Leverages SwapIntegrationModule for transaction orchestration feedback
 * - Provides unified patterns for both Smart and Orchestrated component architectures
 * - Creates reusable UI primitives that adapt to different complexity requirements
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  DollarSign,
  RotateCcw
} from 'lucide-react'

// Import shadcn/ui components following established patterns
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

// Import Components 1 & 2 dependencies
import { useUnifiedBalanceManagement, type ManagedTokenInfo } from '../balance/BalanceManagementModule'
import { useUnifiedSwapIntegration } from '../swap/SwapIntegrationModule'

// =============================================================================
// LOCAL TYPE DEFINITIONS (for interfaces not exported from other modules)
// =============================================================================

/**
 * Purchase Feasibility Analysis Interface
 * Comprehensive analysis of user's ability to complete content purchase
 */
interface PurchaseFeasibilityAnalysis {
  readonly canPurchaseWithUSDC: boolean
  readonly canPurchaseWithETH: boolean
  readonly requiredUSDCAmount: bigint
  readonly requiredETHAmount: bigint | null
  readonly usdcShortfall: bigint
  readonly ethShortfall: bigint | null
  readonly needsUSDCApproval: boolean
  readonly recommendedMethod: 'usdc' | 'eth' | 'swap' | 'insufficient' | 'price_unavailable'
  readonly swapRecommendation: {
    readonly fromToken: string
    readonly toToken: string
    readonly fromAmount: bigint
    readonly estimatedGas: bigint
  } | null
}

/**
 * Swap Price Analysis Interface
 * Comprehensive price analysis combining multiple data sources
 */
interface SwapPriceAnalysis {
  readonly fromToken: ManagedTokenInfo
  readonly toToken: ManagedTokenInfo
  readonly fromAmount: bigint
  readonly expectedToAmount: bigint
  readonly minimumToAmount: bigint
  readonly priceImpact: number
  readonly slippageTolerance: number
  readonly route: {
    readonly pools: Array<{
      readonly address: string
      readonly fee: number
      readonly liquidity: bigint
    }>
    readonly path: string[]
    readonly isOptimal: boolean
  }
  readonly timing: {
    readonly validUntil: Date
    readonly lastUpdated: Date
    readonly staleness: number
  }
  readonly security: {
    readonly riskScore: number
    readonly warnings: string[]
    readonly isRecommended: boolean
  }
  readonly gasAnalysis: {
    readonly estimatedGas: bigint
    readonly gasPrice: bigint
    readonly totalCostETH: bigint
    readonly totalCostUSD: number | null
  }
}

/**
 * Swap Execution State Interface
 * Granular state tracking for complex swap execution process
 */
interface SwapExecutionState {
  readonly phase: 'idle' | 'validating' | 'calculating' | 'creating_intent' | 'extracting_intent' | 'waiting_signature' | 'executing_swap' | 'confirming' | 'completed' | 'error'
  readonly progress: number
  readonly message: string
  readonly canCancel: boolean
  readonly canRetry: boolean
  readonly estimatedTimeRemaining: number
  readonly currentIntent?: unknown
  readonly error?: Error
  readonly performanceMetrics: {
    readonly totalDuration?: number
    readonly phaseTimings: Record<string, number>
    readonly bottleneckPhase?: string
    readonly backendLatency?: number
  }
}

// =============================================================================
// ADAPTIVE UI CONFIGURATION & CONTEXT
// =============================================================================

/**
 * UI Complexity Levels
 * Defines different levels of interface complexity based on user needs and system health
 */
export type UIComplexityLevel = 'minimal' | 'standard' | 'advanced' | 'expert'

/**
 * System Health Status for UI Adaptation
 * Extends the health monitoring from Components 1 & 2 for UI-specific adaptations
 */
export type UIHealthStatus = 'optimal' | 'degraded' | 'limited' | 'emergency'

/**
 * User Capability Assessment
 * Intelligent assessment of user capabilities for adaptive interface design
 */
interface UserCapabilityProfile {
  readonly experienceLevel: 'novice' | 'intermediate' | 'advanced' | 'expert'
  readonly hasMultipleTokens: boolean
  readonly hasStableBalance: boolean
  readonly prefersSimplicity: boolean
  readonly deviceCapability: 'mobile' | 'tablet' | 'desktop'
  readonly connectionQuality: 'high' | 'medium' | 'low'
  readonly accessibilityNeeds: {
    readonly reduceMotion: boolean
    readonly highContrast: boolean
    readonly largerText: boolean
  }
}

/**
 * Adaptive UI Configuration
 * Comprehensive configuration for UI behavior adaptation
 */
interface AdaptiveUIConfig {
  readonly complexityStrategy: 'auto' | 'fixed' | 'user_preference'
  readonly fixedComplexityLevel?: UIComplexityLevel
  readonly enableProgressiveDisclosure: boolean
  readonly enableHealthAdaptation: boolean
  readonly enablePerformanceOptimization: boolean
  readonly animationStrategy: 'full' | 'reduced' | 'none'
  readonly errorRecoveryLevel: 'basic' | 'advanced' | 'expert'
  readonly showDebugInfo: boolean
}

/**
 * Adaptive UI Context
 * Shared context for UI state management across all components
 */
interface AdaptiveUIContext {
  readonly complexityLevel: UIComplexityLevel
  readonly healthStatus: UIHealthStatus
  readonly userProfile: UserCapabilityProfile
  readonly config: AdaptiveUIConfig
  readonly setComplexityLevel: (level: UIComplexityLevel) => void
  readonly adaptToHealth: (health: UIHealthStatus) => void
  readonly updateUserProfile: (updates: Partial<UserCapabilityProfile>) => void
}

// Create React context for adaptive UI
const AdaptiveUIContextImpl = createContext<AdaptiveUIContext | null>(null)

/**
 * Hook to access adaptive UI context
 */
export function useAdaptiveUI(): AdaptiveUIContext {
  const context = useContext(AdaptiveUIContextImpl)
  if (!context) {
    throw new Error('useAdaptiveUI must be used within AdaptiveUIProvider')
  }
  return context
}

// =============================================================================
// INTELLIGENT COMPLEXITY ASSESSMENT ENGINE
// =============================================================================

/**
 * Complexity Assessment Engine
 * Intelligently determines optimal UI complexity based on multiple factors
 */
class ComplexityAssessmentEngine {
  /**
   * Assess optimal complexity level based on multiple factors
   */
  assessOptimalComplexity(
    userProfile: UserCapabilityProfile,
    systemHealth: UIHealthStatus,
    transactionContext: {
      readonly hasMultiplePaymentOptions: boolean
      readonly requiresSwap: boolean
      readonly hasComplexErrorState: boolean
      readonly isHighValueTransaction: boolean
    }
  ): UIComplexityLevel {
    let complexityScore = 0

    // Base complexity from user experience
    switch (userProfile.experienceLevel) {
      case 'novice': complexityScore += 0; break
      case 'intermediate': complexityScore += 1; break
      case 'advanced': complexityScore += 2; break
      case 'expert': complexityScore += 3; break
    }

    // Adjust for user capabilities
    if (userProfile.hasMultipleTokens) complexityScore += 1
    if (userProfile.hasStableBalance) complexityScore += 0.5
    if (userProfile.prefersSimplicity) complexityScore -= 1

    // Adjust for transaction complexity
    if (transactionContext.hasMultiplePaymentOptions) complexityScore += 1
    if (transactionContext.requiresSwap) complexityScore += 1.5
    if (transactionContext.hasComplexErrorState) complexityScore += 1
    if (transactionContext.isHighValueTransaction) complexityScore += 0.5

    // Adjust for system health (reduce complexity when system is stressed)
    switch (systemHealth) {
      case 'optimal': break
      case 'degraded': complexityScore -= 0.5; break
      case 'limited': complexityScore -= 1; break
      case 'emergency': complexityScore -= 2; break
    }

    // Adjust for device capability
    switch (userProfile.deviceCapability) {
      case 'mobile': complexityScore -= 0.5; break
      case 'tablet': break
      case 'desktop': complexityScore += 0.5; break
    }

    // Map score to complexity level
    if (complexityScore <= 0.5) return 'minimal'
    if (complexityScore <= 1.5) return 'standard'
    if (complexityScore <= 2.5) return 'advanced'
    return 'expert'
  }

  /**
   * Determine feature availability based on complexity level
   */
  getAvailableFeatures(complexityLevel: UIComplexityLevel): {
    readonly showBalanceDetails: boolean
    readonly showSwapOptions: boolean
    readonly showAdvancedMetrics: boolean
    readonly showSystemHealth: boolean
    readonly enableProgressiveDisclosure: boolean
    readonly showErrorDetails: boolean
    readonly enableCustomization: boolean
    readonly showPerformanceMetrics: boolean
  } {
    const baseFeatures = {
      showBalanceDetails: false,
      showSwapOptions: false,
      showAdvancedMetrics: false,
      showSystemHealth: false,
      enableProgressiveDisclosure: false,
      showErrorDetails: false,
      enableCustomization: false,
      showPerformanceMetrics: false
    }

    switch (complexityLevel) {
      case 'minimal':
        return { ...baseFeatures }

      case 'standard':
        return {
          ...baseFeatures,
          showBalanceDetails: true,
          enableProgressiveDisclosure: true
        }

      case 'advanced':
        return {
          ...baseFeatures,
          showBalanceDetails: true,
          showSwapOptions: true,
          showSystemHealth: true,
          enableProgressiveDisclosure: true,
          showErrorDetails: true
        }

      case 'expert':
        return {
          showBalanceDetails: true,
          showSwapOptions: true,
          showAdvancedMetrics: true,
          showSystemHealth: true,
          enableProgressiveDisclosure: true,
          showErrorDetails: true,
          enableCustomization: true,
          showPerformanceMetrics: true
        }
    }
  }
}

// =============================================================================
// ADAPTIVE UI PROVIDER
// =============================================================================

/**
 * AdaptiveUIProvider Component
 * Provides adaptive UI context to all child components
 */
interface AdaptiveUIProviderProps {
  readonly children: React.ReactNode
  readonly config?: Partial<AdaptiveUIConfig>
}

export function AdaptiveUIProvider({ children, config = {} }: AdaptiveUIProviderProps) {
  // Configuration with intelligent defaults
  const finalConfig: AdaptiveUIConfig = useMemo(() => ({
    complexityStrategy: 'auto',
    enableProgressiveDisclosure: true,
    enableHealthAdaptation: true,
    enablePerformanceOptimization: true,
    animationStrategy: 'reduced',
    errorRecoveryLevel: 'advanced',
    showDebugInfo: false,
    ...config
  }), [config])

  // Accessibility detection
  const prefersReducedMotion = useReducedMotion()

  // State management
  const [complexityLevel, setComplexityLevel] = useState<UIComplexityLevel>('standard')
  const [healthStatus, setHealthStatus] = useState<UIHealthStatus>('optimal')
  const [userProfile, setUserProfile] = useState<UserCapabilityProfile>({
    experienceLevel: 'intermediate',
    hasMultipleTokens: false,
    hasStableBalance: false,
    prefersSimplicity: false,
    deviceCapability: 'desktop',
    connectionQuality: 'high',
    accessibilityNeeds: {
      reduceMotion: prefersReducedMotion ?? false,
      highContrast: false,
      largerText: false
    }
  })

  // Complexity assessment engine
  const assessmentEngine = useRef(new ComplexityAssessmentEngine()).current

  // Auto-detect device capability
  useEffect(() => {
    const detectDeviceCapability = (): 'mobile' | 'tablet' | 'desktop' => {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'
      return 'desktop'
    }

    const handleResize = (): void => {
      setUserProfile(prev => ({
        ...prev,
        deviceCapability: detectDeviceCapability()
      }))
    }

    handleResize() // Initial detection
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Adaptive complexity level adjustment
  const adaptToHealth = useCallback((health: UIHealthStatus): void => {
    setHealthStatus(health)
    
    if (finalConfig.enableHealthAdaptation && finalConfig.complexityStrategy === 'auto') {
      // Reassess complexity based on new health status
      const newComplexity = assessmentEngine.assessOptimalComplexity(
        userProfile,
        health,
        {
          hasMultiplePaymentOptions: userProfile.hasMultipleTokens,
          requiresSwap: false, // Would be determined by actual transaction context
          hasComplexErrorState: health === 'limited' || health === 'emergency',
          isHighValueTransaction: false
        }
      )
      setComplexityLevel(newComplexity)
    }
  }, [finalConfig, userProfile, assessmentEngine])

  // Update user profile
  const updateUserProfile = useCallback((updates: Partial<UserCapabilityProfile>): void => {
    setUserProfile(prev => {
      const newProfile = { ...prev, ...updates }
      
      // Auto-adjust complexity if enabled
      if (finalConfig.complexityStrategy === 'auto') {
        const newComplexity = assessmentEngine.assessOptimalComplexity(
          newProfile,
          healthStatus,
          {
            hasMultiplePaymentOptions: newProfile.hasMultipleTokens,
            requiresSwap: false,
            hasComplexErrorState: healthStatus === 'limited' || healthStatus === 'emergency',
            isHighValueTransaction: false
          }
        )
        setComplexityLevel(newComplexity)
      }
      
      return newProfile
    })
  }, [finalConfig, healthStatus, assessmentEngine])

  // Context value
  const contextValue: AdaptiveUIContext = useMemo(() => ({
    complexityLevel,
    healthStatus,
    userProfile,
    config: finalConfig,
    setComplexityLevel,
    adaptToHealth,
    updateUserProfile
  }), [complexityLevel, healthStatus, userProfile, finalConfig, adaptToHealth, updateUserProfile])

  return (
    <AdaptiveUIContextImpl.Provider value={contextValue}>
      {children}
    </AdaptiveUIContextImpl.Provider>
  )
}

// =============================================================================
// ADAPTIVE UI COMPONENTS
// =============================================================================

/**
 * AdaptivePaymentMethodSelector Component
 * Intelligently displays payment methods based on complexity level and user capabilities
 */
interface AdaptivePaymentMethodSelectorProps {
  readonly availableTokens: ManagedTokenInfo[]
  readonly selectedToken: ManagedTokenInfo | null
  readonly onTokenSelect: (token: ManagedTokenInfo) => void
  readonly purchaseAnalysis?: PurchaseFeasibilityAnalysis
  readonly className?: string
}

export function AdaptivePaymentMethodSelector({
  availableTokens,
  selectedToken,
  onTokenSelect,
  purchaseAnalysis,
  className
}: AdaptivePaymentMethodSelectorProps): React.ReactElement | null {
  const { complexityLevel, userProfile, config } = useAdaptiveUI()
  const [isExpanded, setIsExpanded] = useState(false)

  // Get features available at current complexity level
  const complexityEngine = useRef(new ComplexityAssessmentEngine()).current
  const availableFeatures = complexityEngine.getAvailableFeatures(complexityLevel)

  // Filter and sort tokens based on complexity level
  const displayTokens = useMemo(() => {
    let tokens = availableTokens

    // For minimal complexity, only show the most suitable token
    if (complexityLevel === 'minimal') {
      const recommended = purchaseAnalysis?.recommendedMethod
      if (recommended === 'usdc') {
        tokens = tokens.filter(t => t.symbol === 'USDC').slice(0, 1)
      } else if (recommended === 'eth') {
        tokens = tokens.filter(t => t.symbol === 'ETH').slice(0, 1)
      } else {
        tokens = tokens.slice(0, 1) // Just show first available
      }
    }

    // Sort by recommendation and balance with null safety
    return tokens.sort((a, b) => {
      // Prioritize tokens that can afford the purchase
      const aCanAfford = purchaseAnalysis ? a.balance >= purchaseAnalysis.requiredUSDCAmount : false
      const bCanAfford = purchaseAnalysis ? b.balance >= purchaseAnalysis.requiredUSDCAmount : false
      
      if (aCanAfford !== bCanAfford) return bCanAfford ? 1 : -1
      
      // Prioritize USDC for stability
      if (a.symbol === 'USDC' && b.symbol !== 'USDC') return -1
      if (b.symbol === 'USDC' && a.symbol !== 'USDC') return 1
      
      // Sort by balance (descending) with null safety
      const aBalanceUSD = a.balanceUSD ?? 0
      const bBalanceUSD = b.balanceUSD ?? 0
      return bBalanceUSD - aBalanceUSD
    })
  }, [availableTokens, complexityLevel, purchaseAnalysis])

  // Determine display mode based on complexity
  const displayMode = useMemo(() => {
    if (complexityLevel === 'minimal') return 'single'
    if (complexityLevel === 'standard') return 'compact'
    return 'detailed'
  }, [complexityLevel])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: config.animationStrategy === 'none' ? 0 : 0.2,
        staggerChildren: config.animationStrategy === 'none' ? 0 : 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: config.animationStrategy === 'none' ? 0 : 0.15 }
    }
  }

  if (displayMode === 'single') {
    // Minimal complexity: show only recommended token
    const token = selectedToken || displayTokens[0]
    if (!token) return null

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-2", className)}
      >
        <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{token.name}</div>
                {availableFeatures.showBalanceDetails && (
                  <div className="text-sm text-muted-foreground">
                    Balance: {token.balanceFormatted} {token.symbol}
                  </div>
                )}
              </div>
            </div>
            {purchaseAnalysis && (
              <Badge variant={
                purchaseAnalysis.canPurchaseWithUSDC || purchaseAnalysis.canPurchaseWithETH 
                  ? "default" : "destructive"
              }>
                {purchaseAnalysis.canPurchaseWithUSDC || purchaseAnalysis.canPurchaseWithETH 
                  ? "Available" : "Insufficient"}
              </Badge>
            )}
          </div>
        </Card>
      </motion.div>
    )
  }

  if (displayMode === 'compact') {
    // Standard complexity: show compact selection
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-3", className)}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
          {displayTokens.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {displayTokens.length} options
            </Button>
          )}
        </div>

        <AnimatePresence>
          <motion.div className="grid gap-2">
            {/* Always show selected token */}
            {selectedToken && (
              <motion.div variants={itemVariants}>
                <PaymentMethodCard
                  token={selectedToken}
                  isSelected={true}
                  onClick={() => {}}
                  purchaseAnalysis={purchaseAnalysis}
                  showDetails={availableFeatures.showBalanceDetails}
                />
              </motion.div>
            )}

            {/* Show other options when expanded */}
            {isExpanded && displayTokens
              .filter(token => token.address !== selectedToken?.address)
              .map((token) => (
                <motion.div key={token.address} variants={itemVariants}>
                  <PaymentMethodCard
                    token={token}
                    isSelected={false}
                    onClick={() => onTokenSelect(token)}
                    purchaseAnalysis={purchaseAnalysis}
                    showDetails={availableFeatures.showBalanceDetails}
                  />
                </motion.div>
              ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    )
  }

  // Advanced/Expert complexity: show detailed selection
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-4", className)}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
          {availableFeatures.showAdvancedMetrics && purchaseAnalysis && (
            <div className="text-xs text-muted-foreground">
              Recommendation: {purchaseAnalysis.recommendedMethod.toUpperCase()}
            </div>
          )}
        </div>
        {availableFeatures.showSystemHealth && (
          <SystemHealthBadge />
        )}
      </div>

      <div className="grid gap-3">
        {displayTokens.map((token) => (
          <motion.div key={token.address} variants={itemVariants}>
            <PaymentMethodCard
              token={token}
              isSelected={token.address === selectedToken?.address}
              onClick={() => onTokenSelect(token)}
              purchaseAnalysis={purchaseAnalysis}
              showDetails={true}
              showAdvanced={complexityLevel === 'expert'}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/**
 * PaymentMethodCard Component
 * Reusable card component for displaying payment method information
 */
interface PaymentMethodCardProps {
  readonly token: ManagedTokenInfo
  readonly isSelected: boolean
  readonly onClick: () => void
  readonly purchaseAnalysis?: PurchaseFeasibilityAnalysis
  readonly showDetails: boolean
  readonly showAdvanced?: boolean
}

function PaymentMethodCard({
  token,
  isSelected,
  onClick,
  purchaseAnalysis,
  showDetails,
  showAdvanced = false
}: PaymentMethodCardProps): React.ReactElement {
  const { config } = useAdaptiveUI()

  const canAfford = useMemo(() => {
    if (!purchaseAnalysis) return true
    if (token.symbol === 'USDC') return purchaseAnalysis.canPurchaseWithUSDC
    if (token.symbol === 'ETH') return purchaseAnalysis.canPurchaseWithETH
    return false
  }, [token, purchaseAnalysis])

  return (
    <motion.div
      whileHover={config.animationStrategy !== 'none' ? { scale: 1.01 } : undefined}
      whileTap={config.animationStrategy !== 'none' ? { scale: 0.99 } : undefined}
      transition={{ duration: 0.1 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          isSelected ? "ring-2 ring-primary border-primary" : "hover:border-muted-foreground/50",
          !canAfford && "opacity-60"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {token.symbol === 'ETH' ? <Zap className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{token.name}</span>
                  {isSelected && <CheckCircle className="h-3 w-3 text-primary" />}
                </div>
                {showDetails && (
                  <div className="text-sm text-muted-foreground">
                    {token.balanceFormatted} {token.symbol} 
                    {token.balanceUSD !== null && token.balanceUSD > 0 && ` ($${token.balanceUSD.toFixed(2)})`}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right space-y-1">
              <Badge variant={canAfford ? "default" : "destructive"}>
                {canAfford ? "Available" : "Insufficient"}
              </Badge>
              
              {showAdvanced && purchaseAnalysis && (
                <div className="text-xs text-muted-foreground">
                  {token.symbol === 'USDC' ? 
                    `Need: $${(Number(purchaseAnalysis.requiredUSDCAmount) / 1e6).toFixed(2)}` :
                    `Need: ${(Number(purchaseAnalysis.requiredETHAmount) / 1e18).toFixed(4)} ETH`
                  }
                </div>
              )}
            </div>
          </div>
          
          {showAdvanced && token.needsApproval && (
            <Alert className="mt-3">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This token requires approval before use
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

/**
 * SystemHealthBadge Component
 * Shows current system health status with appropriate visual indicators
 */
function SystemHealthBadge(): React.ReactElement {
  const { healthStatus } = useAdaptiveUI()

  const healthConfig = useMemo(() => {
    switch (healthStatus) {
      case 'optimal':
        return { 
          icon: CheckCircle, 
          color: "bg-green-100 text-green-700 border-green-200",
          label: "Optimal"
        }
      case 'degraded':
        return {
          icon: AlertTriangle,
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          label: "Degraded"
        }
      case 'limited':
        return {
          icon: AlertCircle,
          color: "bg-orange-100 text-orange-700 border-orange-200",
          label: "Limited"
        }
      case 'emergency':
        return {
          icon: AlertCircle,
          color: "bg-red-100 text-red-700 border-red-200",
          label: "Emergency"
        }
    }
  }, [healthStatus])

  const Icon = healthConfig.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={cn("text-xs border", healthConfig.color)}>
            <Icon className="h-3 w-3 mr-1" />
            {healthConfig.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>System Health: {healthConfig.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * AdaptiveErrorDisplay Component
 * Intelligently displays errors based on complexity level and recovery capabilities
 */
interface AdaptiveErrorDisplayProps {
  readonly error: Error | null
  readonly phase?: string
  readonly canRetry?: boolean
  readonly onRetry?: () => void
  readonly onDismiss?: () => void
  readonly className?: string
}

export function AdaptiveErrorDisplay({
  error,
  phase,
  canRetry = false,
  onRetry,
  onDismiss,
  className
}: AdaptiveErrorDisplayProps): React.ReactElement | null {
  const { complexityLevel, config } = useAdaptiveUI()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!error) return null

  // Get error details based on complexity level
  const showTechnicalDetails = complexityLevel === 'expert' || config.showDebugInfo
  const showPhaseInfo = complexityLevel === 'advanced' || complexityLevel === 'expert'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("space-y-3", className)}
    >
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            {/* Main error message */}
            <div className="font-medium">
              {error.message}
            </div>
            
            {/* Phase information for advanced users */}
            {showPhaseInfo && phase && (
              <div className="text-xs opacity-75">
                Failed during: {phase}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {canRetry && onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              
              {showTechnicalDetails && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Eye className={cn("h-3 w-3 mr-1", isExpanded && "hidden")} />
                  <EyeOff className={cn("h-3 w-3 mr-1", !isExpanded && "hidden")} />
                  {isExpanded ? 'Hide' : 'Show'} Details
                </Button>
              )}
              
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
            
            {/* Technical details for expert users */}
            <Collapsible open={isExpanded}>
              <CollapsibleContent>
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <div className="text-xs font-mono text-muted-foreground">
                    <div><strong>Error Type:</strong> {error.name}</div>
                    {error.stack && (
                      <div className="mt-2">
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  )
}

/**
 * AdaptiveLoadingState Component
 * Shows appropriate loading states based on complexity level and context
 */
interface AdaptiveLoadingStateProps {
  readonly message?: string
  readonly progress?: number
  readonly phase?: string
  readonly showDetails?: boolean
  readonly className?: string
}

export function AdaptiveLoadingState({
  message = "Loading...",
  progress,
  phase,
  showDetails,
  className
}: AdaptiveLoadingStateProps): React.ReactElement {
  const { complexityLevel } = useAdaptiveUI()

  const shouldShowProgress = progress !== undefined && (complexityLevel === 'advanced' || complexityLevel === 'expert')
  const shouldShowPhase = phase && (complexityLevel === 'expert' || showDetails)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("space-y-3", className)}
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <div>
          <div className="font-medium">{message}</div>
          {shouldShowPhase && (
            <div className="text-sm text-muted-foreground">
              Current phase: {phase}
            </div>
          )}
        </div>
      </div>
      
      {shouldShowProgress && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {progress?.toFixed(0)}% complete
          </div>
        </div>
      )}
    </motion.div>
  )
}

// =============================================================================
// INTEGRATION ADAPTERS
// =============================================================================

/**
 * Hook for Smart Component Integration
 * Provides adaptive UI optimized for the OrchestratedContentPurchaseCard architecture
 */
export function useSmartCardAdaptiveUI(balanceManager: ReturnType<typeof useUnifiedBalanceManagement>) {
  const adaptiveUI = useAdaptiveUI()

  // Update user profile based on balance data
  useEffect(() => {
    const hasMultipleTokens = balanceManager.managedTokens.length > 1
    const hasStableBalance = balanceManager.managedTokens.some(token => (token.balanceUSD ?? 0) > 10)

    adaptiveUI.updateUserProfile({
      hasMultipleTokens,
      hasStableBalance,
      experienceLevel: hasMultipleTokens && hasStableBalance ? 'advanced' : 'intermediate'
    })
  }, [balanceManager.managedTokens, adaptiveUI])

  // Adapt UI based on system health
  useEffect(() => {
    const healthStatus = balanceManager.systemHealth.overallStatus
    let uiHealthStatus: UIHealthStatus = 'optimal'
    
    switch (healthStatus) {
      case 'healthy': uiHealthStatus = 'optimal'; break
      case 'degraded': uiHealthStatus = 'degraded'; break
      case 'critical': uiHealthStatus = 'emergency'; break
    }
    
    adaptiveUI.adaptToHealth(uiHealthStatus)
  }, [balanceManager.systemHealth.overallStatus, adaptiveUI])

  return {
    ...adaptiveUI,
    // Smart-specific enhancements
    shouldShowBalanceDetails: adaptiveUI.complexityLevel !== 'minimal',
    shouldShowSwapOptions: adaptiveUI.complexityLevel === 'advanced' || adaptiveUI.complexityLevel === 'expert',
    preferredComplexityLevel: 'standard' as UIComplexityLevel
  }
}

/**
 * Hook for Orchestrated Component Integration
 * Provides adaptive UI optimized for the OrchestratedContentPurchaseCard architecture
 */
export function useOrchestratedCardAdaptiveUI(
  balanceManager: ReturnType<typeof useUnifiedBalanceManagement>,
  swapManager: ReturnType<typeof useUnifiedSwapIntegration>
) {
  const adaptiveUI = useAdaptiveUI()

  // Update user profile based on system capabilities
  useEffect(() => {
    const hasMultipleTokens = balanceManager.managedTokens.length > 1
    const hasStableBalance = balanceManager.managedTokens.some(token => (token.balanceUSD ?? 0) > 10)
    const systemIsHealthy = balanceManager.systemHealth.overallStatus === 'healthy'

    adaptiveUI.updateUserProfile({
      hasMultipleTokens,
      hasStableBalance,
      experienceLevel: systemIsHealthy && hasMultipleTokens ? 'expert' : 'advanced'
    })
  }, [balanceManager.managedTokens, balanceManager.systemHealth, adaptiveUI])

  // Adapt based on swap execution state
  useEffect(() => {
    if (swapManager.executionState.phase === 'error') {
      adaptiveUI.adaptToHealth('degraded')
    } else if (swapManager.systemHealth.overallStatus === 'healthy') {
      adaptiveUI.adaptToHealth('optimal')
    }
  }, [swapManager.executionState.phase, swapManager.systemHealth, adaptiveUI])

  return {
    ...adaptiveUI,
    // Orchestrated-specific enhancements
    shouldShowSystemHealth: true,
    shouldShowAdvancedMetrics: adaptiveUI.complexityLevel === 'expert',
    shouldShowPerformanceMetrics: adaptiveUI.complexityLevel === 'expert',
    preferredComplexityLevel: 'advanced' as UIComplexityLevel
  }
}