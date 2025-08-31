/**
 * Social Purchase Flow - Component 5 UI Layer
 * File: src/components/commerce/SocialPurchaseFlow.tsx
 * 
 * This component provides the complete social purchase experience,
 * building upon your existing UI patterns and integrating seamlessly with
 * your established component architecture. It transforms traditional Web3
 * purchases into social commerce experiences optimized for Farcaster contexts.
 * 
 * Key Integration Points:
 * - Uses your established shadcn/ui component patterns
 * - Integrates with your existing AppLayout and design system
 * - Follows your three-layer architecture (business logic → UI integration → components)
 * - Uses your established loading states, error handling, and user feedback patterns
 * - Connects with your existing MiniApp context and social analytics
 * - Leverages your SocialSharingHub and social context components
 * 
 * Architecture Alignment:
 * - Follows your established component prop patterns with readonly interfaces
 * - Uses your existing UI component library (Card, Button, Badge, etc.)
 * - Maintains your responsive design patterns and accessibility standards
 * - Integrates with your existing routing and navigation systems
 * - Preserves your error boundary and loading state management
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import type { Address } from 'viem'

// Import your established UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Progress,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui'

// Import your existing icons
import {
  ShoppingCart,
  Zap,
  Share2,
  Users,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  BarChart3,
  Verified
} from 'lucide-react'

// Import your business logic hook
import { 
  useSocialPurchaseFlow 
} from '@/hooks/commerce/useSocialPurchaseFlow'

// Import your existing utilities and types
import { cn, formatCurrency, formatAddress } from '@/lib/utils'

// Import your existing integrations
import { useMiniApp } from '@/contexts/MiniAppProvider'

// ================================================
// COMPONENT INTERFACES
// ================================================

/**
 * Social Purchase Flow Props
 * 
 * This interface defines the component props following your established patterns
 * with readonly properties and comprehensive configuration options.
 */
interface SocialPurchaseFlowProps {
  readonly contentId: bigint
  readonly userAddress?: Address
  readonly context?: 'web' | 'miniapp' | 'embedded'
  readonly variant?: 'full' | 'compact' | 'minimal'
  readonly showSocialProof?: boolean
  readonly enableBatchTransactions?: boolean
  readonly enableViralSharing?: boolean
  readonly className?: string
  readonly onPurchaseSuccess?: (contentId: bigint) => void
  readonly onPurchaseError?: (error: Error) => void
  readonly onSocialShare?: (shareData: any) => void
  readonly onAnalyticsEvent?: (event: string, data: any) => void
}

/**
 * Social Proof Display Configuration
 * 
 * This interface defines how social proof elements are displayed,
 * integrating with your existing social context components.
 */
interface SocialProofDisplayConfig {
  readonly showCreatorVerification: boolean
  readonly showMutualConnections: boolean
  readonly showSocialScore: boolean
  readonly showRecommendationSource: boolean
  readonly compactMode: boolean
}

/**
 * Purchase Action Button Configuration
 * 
 * This interface defines the purchase button states and configurations,
 * building upon your existing button component patterns.
 */
interface PurchaseActionConfig {
  readonly variant: 'default' | 'secondary' | 'outline' | 'destructive'
  readonly size: 'sm' | 'default' | 'lg'
  readonly disabled: boolean
  readonly loading: boolean
  readonly icon: React.ComponentType<{ className?: string }> | null
  readonly text: string
  readonly description?: string
  readonly badge?: string
}

// ================================================
// SOCIAL PROOF COMPONENTS
// ================================================

/**
 * Social Proof Indicator
 * 
 * This component displays social context and verification information,
 * following your established UI patterns and design system.
 */
function SocialProofIndicator({ 
  socialContext, 
  config 
}: { 
  socialContext: any
  config: SocialProofDisplayConfig 
}) {
  if (!socialContext || socialContext.socialProofLevel === 'none') {
    return null
  }

  const proofElements = []

  // Creator verification indicator
  if (config.showCreatorVerification && socialContext.creatorSocialProfile?.verified) {
    proofElements.push(
      <Badge key="creator-verified" variant="secondary" className="text-xs">
        <Verified className="w-3 h-3 mr-1" />
        Verified Creator
      </Badge>
    )
  }

  // Mutual connections indicator
  if (config.showMutualConnections && socialContext.mutualConnections > 0) {
    proofElements.push(
      <Badge key="mutual-connections" variant="outline" className="text-xs">
        <Users className="w-3 h-3 mr-1" />
        {socialContext.mutualConnections} mutual connection{socialContext.mutualConnections > 1 ? 's' : ''}
      </Badge>
    )
  }

  // Social score indicator
  if (config.showSocialScore && socialContext.socialScore > 0.5) {
    proofElements.push(
      <Badge key="social-score" variant="default" className="text-xs">
        <Star className="w-3 h-3 mr-1" />
        {Math.round(socialContext.socialScore * 100)}% social score
      </Badge>
    )
  }

  // Recommendation source indicator
  if (config.showRecommendationSource && socialContext.recommendationSource !== 'direct') {
    proofElements.push(
      <Badge key="recommendation" variant="outline" className="text-xs">
        <TrendingUp className="w-3 h-3 mr-1" />
        Recommended from {socialContext.recommendationSource}
      </Badge>
    )
  }

  if (proofElements.length === 0) return null

  return (
    <div className={cn(
      "flex flex-wrap gap-2",
      config.compactMode && "gap-1"
    )}>
      {proofElements.slice(0, config.compactMode ? 2 : 4)}
    </div>
  )
}

/**
 * Batch Transaction Benefits Display
 * 
 * This component showcases the benefits of batch transactions,
 * following your established information display patterns.
 */
function BatchTransactionBenefits({ 
  batchConfig, 
  compact = false 
}: { 
  batchConfig: any
  compact?: boolean 
}) {
  if (!batchConfig?.isAvailable) return null

  return (
    <div className={cn(
      "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-3",
      compact && "p-2"
    )}>
      <div className="flex items-center space-x-2 mb-2">
        <Zap className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Batch Transaction Available
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-gray-600" />
          <span>{batchConfig.estimatedTimeReduction}% faster</span>
        </div>
        <div className="flex items-center space-x-1">
          <BarChart3 className="w-3 h-3 text-gray-600" />
          <span>{batchConfig.estimatedGasSavings}% gas savings</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Viral Sharing Preview
 * 
 * This component shows the viral sharing preview and potential,
 * integrating with your social sharing components.
 */
function ViralSharingPreview({ 
  viralStrategy, 
  onShare 
}: { 
  viralStrategy: any
  onShare: () => void 
}) {
  if (!viralStrategy?.immediateShareEnabled) return null

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-900 dark:text-green-100">
            Share After Purchase
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {Math.round(viralStrategy.viralPotentialScore * 100)}% viral potential
        </Badge>
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        "{viralStrategy.suggestedShareText}"
      </p>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onShare}
        className="w-full text-xs"
      >
        <Share2 className="w-3 h-3 mr-1" />
        Preview Share
      </Button>
    </div>
  )
}

// ================================================
// PURCHASE ACTION COMPONENTS
// ================================================

/**
 * Social Purchase Button
 * 
 * This component provides the main purchase action button with social features,
 * following your established button component patterns.
 */
function SocialPurchaseButton({ 
  config, 
  onClick 
}: { 
  config: PurchaseActionConfig
  onClick: () => void 
}) {
  const IconComponent = config.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={config.variant}
            size={config.size}
            disabled={config.disabled || config.loading}
            onClick={onClick}
            className={cn(
              "w-full relative",
              config.variant === 'secondary' && config.badge === 'Optimized' && "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
              config.variant === 'secondary' && config.badge === 'Social' && "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            )}
          >
            {config.loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : IconComponent ? (
              <IconComponent className="w-4 h-4 mr-2" />
            ) : null}
            
            <span>{config.text}</span>
            
            {config.badge && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {config.badge}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        
        {config.description && (
          <TooltipContent>
            <p className="text-sm">{config.description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Purchase Progress Indicator
 * 
 * This component shows the purchase flow progress with social context,
 * following your established progress indicator patterns.
 */
function PurchaseProgressIndicator({ 
  currentStep, 
  socialState, 
  batchConfig 
}: { 
  currentStep: string
  socialState: any
  batchConfig: any 
}) {
  const steps = useMemo(() => {
    const baseSteps = [
      { key: 'preparing', label: 'Preparing', icon: Loader2 },
      { key: 'approving', label: 'Approving', icon: Shield },
      { key: 'purchasing', label: 'Purchasing', icon: ShoppingCart },
      { key: 'completed', label: 'Complete', icon: CheckCircle }
    ]

    if (batchConfig?.shouldUseBatch) {
      return [
        { key: 'preparing', label: 'Preparing', icon: Loader2 },
        { key: 'purchasing', label: 'Batch Purchase', icon: Zap },
        { key: 'completed', label: 'Complete', icon: CheckCircle }
      ]
    }

    return baseSteps
  }, [batchConfig])

  const currentStepIndex = steps.findIndex(step => 
    socialState.step.includes(step.key) || currentStep.includes(step.label)
  )

  const progress = currentStepIndex >= 0 ? 
    ((currentStepIndex + 1) / steps.length) * 100 : 0

  return (
    <div className="space-y-3">
      <Progress value={progress} className="h-2" />
      
      <div className="flex justify-between text-xs">
        {steps.map((step, index) => {
          const IconComponent = step.icon
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex
          
          return (
            <div 
              key={step.key}
              className={cn(
                "flex items-center space-x-1",
                isActive && "text-blue-600 font-medium",
                isCompleted && "text-green-600",
                !isActive && !isCompleted && "text-gray-400"
              )}
            >
              <IconComponent className={cn(
                "w-3 h-3",
                isActive && "animate-pulse"
              )} />
              <span>{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ================================================
// MAIN COMPONENT
// ================================================

/**
 * Social Purchase Flow Component
 * 
 * This is the main component that orchestrates the entire social purchase experience,
 * integrating all sub-components and following your established component patterns.
 */
export default function SocialPurchaseFlow({
  contentId,
  userAddress,
  context = 'web',
  variant = 'full',
  showSocialProof = true,
  enableBatchTransactions = true,
  enableViralSharing = true,
  className,
  onPurchaseSuccess,
  onPurchaseError,
  onSocialShare,
  onAnalyticsEvent
}: SocialPurchaseFlowProps) {
  
  const router = useRouter()
  const walletUI = useWalletConnectionUI()
  const miniAppContext = useMiniApp()
  const effectiveUserAddress = userAddress || walletUI.address

  // ===== BUSINESS LOGIC INTEGRATION =====
  
  const {
    content,
    hasAccess,
    isLoading,
    error,
    currentStep,
    canAfford,
    needsApproval,
    userBalance,
    socialState,
    socialContext,
    batchTransactionAvailable,
    viralSharingReady,
    executeSocialPurchase,
    executeBatchPurchase,
    executeSequentialPurchase,
    triggerImmediateShare,
    trackSocialConversion,
    reset
  } = useSocialPurchaseFlow(contentId, effectiveUserAddress as `0x${string}`)

  // ===== LOCAL STATE =====
  
  const [showViralPreview, setShowViralPreview] = useState(false)
  const [purchaseAttempts, setPurchaseAttempts] = useState(0)

  // ===== CONFIGURATION =====
  
  const isCompact = variant === 'compact' || variant === 'minimal'
  const isMiniApp = context === 'miniapp' || miniAppContext.isMiniApp
  
  const socialProofConfig: SocialProofDisplayConfig = useMemo(() => ({
    showCreatorVerification: showSocialProof && !isCompact,
    showMutualConnections: showSocialProof,
    showSocialScore: showSocialProof && variant === 'full',
    showRecommendationSource: showSocialProof && variant === 'full',
    compactMode: isCompact
  }), [showSocialProof, isCompact, variant])

  // ===== PURCHASE ACTION CONFIGURATION =====
  
  const purchaseActionConfig: PurchaseActionConfig = useMemo(() => {
    if (hasAccess) {
      return {
        variant: 'default',
        size: isCompact ? 'sm' : 'default',
        disabled: false,
        loading: false,
        icon: CheckCircle,
        text: 'Access Granted',
        description: 'You already have access to this content'
      }
    }

    if (error) {
      return {
        variant: 'default',
        size: isCompact ? 'sm' : 'default',
        disabled: false,
        loading: false,
        icon: AlertCircle,
        text: 'Retry Purchase',
        description: 'Click to retry the purchase'
      }
    }

    if (isLoading || socialState.step === 'purchasing') {
      return {
        variant: 'default',
        size: isCompact ? 'sm' : 'default',
        disabled: true,
        loading: true,
        icon: null,
        text: currentStep,
        description: 'Transaction in progress'
      }
    }

    if (!canAfford) {
      return {
        variant: 'default',
        size: isCompact ? 'sm' : 'default',
        disabled: true,
        loading: false,
        icon: AlertCircle,
        text: 'Insufficient Balance',
        description: 'You need more USDC to make this purchase'
      }
    }

    if (enableBatchTransactions && batchTransactionAvailable && socialState.batchConfig?.shouldUseBatch) {
      return {
        variant: 'secondary',
        size: isCompact ? 'sm' : 'default',
        disabled: false,
        loading: false,
        icon: Zap,
        text: 'Purchase with Batch',
        description: `Save ${socialState.batchConfig.estimatedGasSavings}% on gas and ${socialState.batchConfig.estimatedTimeReduction}% on time`,
        badge: 'Optimized'
      }
    }

    if (socialContext && socialContext.socialProofLevel !== 'none') {
      return {
        variant: 'secondary',
        size: isCompact ? 'sm' : 'default',
        disabled: false,
        loading: false,
        icon: Users,
        text: 'Social Purchase',
        description: 'Purchase with social context and sharing',
        badge: 'Social'
      }
    }

    return {
      variant: 'default',
      size: isCompact ? 'sm' : 'default',
      disabled: false,
      loading: false,
      icon: ShoppingCart,
      text: `Purchase for ${content ? formatCurrency(content.payPerViewPrice) : '...'}`,
      description: 'Standard purchase flow'
    }
  }, [
    hasAccess,
    error,
    isLoading,
    socialState,
    currentStep,
    canAfford,
    enableBatchTransactions,
    batchTransactionAvailable,
    socialContext,
    content,
    isCompact
  ])

  // ===== EVENT HANDLERS =====
  
  const handlePurchase = useCallback(async () => {
    try {
      setPurchaseAttempts(prev => prev + 1)
      
      // Analytics tracking
      onAnalyticsEvent?.('purchase_initiated', {
        contentId: contentId.toString(),
        attempt: purchaseAttempts + 1,
        batchEnabled: batchTransactionAvailable,
        socialContext: socialContext?.socialProofLevel
      })

      // Execute purchase based on configuration
      if (enableBatchTransactions && socialState.batchConfig?.shouldUseBatch) {
        await executeBatchPurchase()
      } else {
        await executeSocialPurchase()
      }

      // Success callback
      onPurchaseSuccess?.(contentId)
      
      // Track success
      await trackSocialConversion()
      
    } catch (error) {
      console.error('Purchase failed:', error)
      onPurchaseError?.(error as Error)
      
      // Analytics tracking
      onAnalyticsEvent?.('purchase_failed', {
        contentId: contentId.toString(),
        error: (error as Error).message,
        attempt: purchaseAttempts + 1
      })
    }
  }, [
    contentId,
    purchaseAttempts,
    batchTransactionAvailable,
    socialContext,
    enableBatchTransactions,
    socialState.batchConfig,
    executeBatchPurchase,
    executeSocialPurchase,
    onPurchaseSuccess,
    onPurchaseError,
    onAnalyticsEvent,
    trackSocialConversion
  ])

  const handleViralShare = useCallback(async () => {
    try {
      await triggerImmediateShare()
      onSocialShare?.(socialState.viralStrategy)
      
      // Analytics tracking
      onAnalyticsEvent?.('viral_share_triggered', {
        contentId: contentId.toString(),
        viralPotential: socialState.viralStrategy?.viralPotentialScore
      })
      
    } catch (error) {
      console.error('Viral sharing failed:', error)
    }
  }, [triggerImmediateShare, onSocialShare, socialState.viralStrategy, onAnalyticsEvent, contentId])

  const handleRetry = useCallback(() => {
    reset()
    setPurchaseAttempts(0)
  }, [reset])

  // ===== LOADING STATE =====
  
  if (isLoading && !content) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // ===== ERROR STATE =====
  
  if (error && !content) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load content. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRetry} className="mt-4 w-full">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ===== MAIN RENDER =====
  
  return (
    <Card className={cn("w-full", className)}>
      {/* Card Header */}
      <CardHeader className={cn("pb-4", isCompact && "pb-2")}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={cn("text-lg", isCompact && "text-base")}>
              {content?.title || 'Loading...'}
            </CardTitle>
            {!isCompact && content && (
              <CardDescription className="mt-1">
                {content.description || `Content by ${formatAddress(content.creator)}`}
              </CardDescription>
            )}
          </div>
          
          {content && (
            <div className="text-right">
              <div className="text-lg font-bold">
                {formatCurrency(content.payPerViewPrice)}
              </div>
              {userBalance && (
                <div className="text-xs text-muted-foreground">
                  Balance: {formatCurrency(userBalance)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Social Proof Section */}
        {showSocialProof && socialContext && (
          <div className="mt-3">
            <SocialProofIndicator 
              socialContext={socialContext}
              config={socialProofConfig}
            />
          </div>
        )}
      </CardHeader>

      {/* Card Content */}
      <CardContent className={cn("space-y-4", isCompact && "space-y-2")}>
        {/* Batch Transaction Benefits */}
        {enableBatchTransactions && socialState.batchConfig && (
          <BatchTransactionBenefits 
            batchConfig={socialState.batchConfig}
            compact={isCompact}
          />
        )}

        {/* Viral Sharing Preview */}
        {enableViralSharing && socialState.viralStrategy && (
          <ViralSharingPreview 
            viralStrategy={socialState.viralStrategy}
            onShare={handleViralShare}
          />
        )}

        {/* Purchase Progress */}
        {(isLoading || socialState.step !== 'idle') && !isCompact && (
          <PurchaseProgressIndicator 
            currentStep={currentStep}
            socialState={socialState}
            batchConfig={socialState.batchConfig}
          />
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'An error occurred during purchase'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Card Footer */}
      <CardFooter className={cn("pt-4", isCompact && "pt-2")}>
        <div className="w-full space-y-3">
          {/* Main Purchase Button */}
          <SocialPurchaseButton 
            config={purchaseActionConfig}
            onClick={hasAccess ? () => router.push(`/content/${contentId}`) : handlePurchase}
          />

          {/* Additional Actions */}
          {hasAccess && viralSharingReady && !isCompact && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViralShare}
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share This Content
            </Button>
          )}

          {/* Purchase attempts indicator for retry scenarios */}
          {purchaseAttempts > 1 && !hasAccess && (
            <div className="text-center text-xs text-muted-foreground">
              Attempt {purchaseAttempts} • <button onClick={handleRetry} className="underline">Reset</button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}