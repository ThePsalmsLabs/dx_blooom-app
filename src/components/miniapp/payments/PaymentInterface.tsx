// src/components/miniapp/payments/PaymentInterface.tsx

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { type Address } from 'viem'
import { 
  ShoppingCart,
  Zap, 
  Share2, 
  Loader2,
  Wallet,
  Users,
  CheckCircle2,
  Shield,
  Star,
  Sparkles
} from 'lucide-react'

// Import established UI components following your patterns
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'


import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Import business logic hooks we built
import { 
  useMiniAppAuth,
  type OptimalPaymentMethod,
  type MiniAppAuthResult
} from '@/hooks/business/miniapp-auth'
import { 
  useX402ContentPurchaseFlow,
  type PurchaseStrategy
} from '@/hooks/business/workflows'

// Import existing infrastructure
import { useContentById } from '@/hooks/contracts/core'
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

// Import utilities following your patterns
import { cn, formatCurrency, formatAddress } from '@/lib/utils'
import { enhancedToast, handleUIError } from '@/lib/utils/toast'

// ===== PAYMENT INTERFACE TYPES =====

/**
 * Authentication Display State
 * 
 * This interface defines how authentication method information
 * is displayed to users, providing clear visual feedback about
 * their connection status and capabilities.
 */
interface AuthenticationDisplayState {
  readonly type: 'farcaster-native' | 'privy-wallet' | 'needs-connection' | 'connecting'
  readonly displayName: string
  readonly description: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive'
  readonly badgeText: string
  readonly showEnhancementIndicator: boolean
  readonly enhancementText?: string
}

/**
 * Purchase Strategy Display Configuration
 * 
 * This interface configures how different purchase strategies
 * are presented to users, emphasizing the benefits of each approach.
 */
interface StrategyDisplayConfig {
  readonly strategy: PurchaseStrategy
  readonly title: string
  readonly description: string
  readonly benefits: readonly string[]
  readonly buttonText: string
  readonly buttonVariant: 'default' | 'glow' | 'outline' | 'secondary'
  readonly buttonIcon: React.ComponentType<{ className?: string }>
  readonly estimatedTime: string
  readonly confidenceLevel: 'high' | 'medium' | 'low'
  readonly showSocialFeatures: boolean
}

/**
 * Payment Interface Props
 * 
 * This interface defines the component's props, following your established
 * patterns while enabling comprehensive customization.
 */
export interface PaymentInterfaceProps {
  /** Content ID for the content to purchase */
  readonly contentId: bigint
  
  /** Content title for display and sharing */
  readonly title: string
  
  /** Optional content description for additional context */
  readonly description?: string
  
  /** Optional creator information for social context */
  readonly creatorInfo?: {
    readonly address: Address
    readonly name?: string
    readonly isVerified?: boolean
  }
  
  /** Optional user address override */
  readonly userAddress?: Address
  
  /** Layout variant for different contexts */
  readonly variant?: 'default' | 'compact' | 'expanded'
  
  /** Enable social sharing features */
  readonly enableSocialFeatures?: boolean
  
  /** Show detailed authentication information */
  readonly showAuthDetails?: boolean
  
  /** Show purchase strategy explanation */
  readonly showStrategyDetails?: boolean
  
  /** Custom styling className */
  readonly className?: string
  
  /** Callback fired when purchase is completed */
  readonly onPurchaseComplete?: (contentId: bigint) => void
  
  /** Callback fired when content is shared */
  readonly onShareComplete?: (contentId: bigint) => void
  
  /** Callback fired when authentication method changes */
  readonly onAuthMethodChange?: (method: OptimalPaymentMethod) => void
}

// ===== DISPLAY CONFIGURATION FUNCTIONS =====

/**
 * Get Authentication Display State
 * 
 * This function converts authentication state into display configuration,
 * providing users with clear visual feedback about their connection status.
 */
function getAuthenticationDisplayState(authResult: MiniAppAuthResult): AuthenticationDisplayState {
  if (!authResult.isAuthenticated) {
    return {
      type: 'needs-connection',
      displayName: 'Connect Wallet',
      description: 'Connect your wallet to access additional features',
      icon: Wallet,
      badgeVariant: 'outline',
      badgeText: 'Not Connected',
      showEnhancementIndicator: false
    }
  }

  if (authResult.user?.authenticationMethod === 'farcaster-native') {
    return {
      type: 'farcaster-native',
      displayName: 'Farcaster Verified',
      description: 'Your wallet is verified on Farcaster for seamless payments',
      icon: Shield,
      badgeVariant: 'default',
      badgeText: 'Verified',
      showEnhancementIndicator: true,
      enhancementText: 'Direct Payment Enabled'
    }
  }

  if (authResult.user?.authenticationMethod === 'wallet-with-social') {
    return {
      type: 'farcaster-native',
      displayName: 'Farcaster Connected',
      description: 'Social features available',
      icon: Users,
      badgeVariant: 'secondary',
      badgeText: 'Social',
      showEnhancementIndicator: true,
      enhancementText: 'Batch Transactions'
    }
  }

  return {
    type: 'privy-wallet',
    displayName: 'Wallet Connected',
    description: 'Standard Web3 wallet connection',
    icon: Wallet,
    badgeVariant: 'secondary',
    badgeText: 'Connected',
    showEnhancementIndicator: false
  }
}

/**
 * Get Strategy Display Configuration
 * 
 * This function converts purchase strategy into display configuration,
 * highlighting the benefits and capabilities of each approach.
 */
function getStrategyDisplayConfig(
  strategy: PurchaseStrategy,
  confidence: number,
  socialContext: boolean
): StrategyDisplayConfig {
  switch (strategy) {
    case 'farcaster-direct':
      return {
        strategy,
        title: 'Direct Payment',
        description: 'Instant purchase using your verified Farcaster wallet',
        benefits: [
          'Single-click purchase',
          'Social verification trust',
          'Instant access',
          'Automatic sharing options'
        ],
        buttonText: 'Buy Now',
        buttonVariant: 'glow',
        buttonIcon: Sparkles,
        estimatedTime: '~15 seconds',
        confidenceLevel: 'high',
        showSocialFeatures: true
      }

    case 'batch-transaction':
      return {
        strategy,
        title: 'One-Click Purchase',
        description: 'Approve and purchase in a single transaction',
        benefits: [
          'Combined approval + purchase',
          'Reduced transaction fees',
          'Faster completion',
          'Mobile optimized'
        ],
        buttonText: 'Approve & Purchase',
        buttonVariant: 'glow',
        buttonIcon: Zap,
        estimatedTime: '~30 seconds',
        confidenceLevel: confidence > 80 ? 'high' : 'medium',
        showSocialFeatures: socialContext
      }

    case 'standard-flow':
      return {
        strategy,
        title: 'Standard Purchase',
        description: 'Traditional approve then purchase flow',
        benefits: [
          'Proven reliability',
          'Universal compatibility',
          'Clear transaction steps',
          'Full control'
        ],
        buttonText: 'Purchase',
        buttonVariant: 'default',
        buttonIcon: ShoppingCart,
        estimatedTime: '~60 seconds',
        confidenceLevel: 'medium',
        showSocialFeatures: false
      }

    default:
      return {
        strategy: 'standard-flow',
        title: 'Purchase',
        description: 'Complete purchase to access content',
        benefits: ['Access to content'],
        buttonText: 'Purchase',
        buttonVariant: 'default',
        buttonIcon: ShoppingCart,
        estimatedTime: 'Variable',
        confidenceLevel: 'low',
        showSocialFeatures: false
      }
  }
}

// ===== MAIN PAYMENT INTERFACE COMPONENT =====

/**
 * Payment Interface Component
 * 
 * This component represents the culmination of our authentication and payment
 * flow features, providing users with an intelligent, adaptive payment
 * interface that optimizes the experience based on their authentication method
 * and context.
 * 
 * KEY FEATURES:
 * - Intelligent authentication method display with visual indicators
 * - Strategy-optimized purchase flows with clear benefit communication
 * - Social features integration for Farcaster users
 * - Comprehensive error handling and loading states
 * - Responsive design following your established patterns
 * - Accessibility-first implementation with proper ARIA attributes
 * 
 * INTEGRATION POINTS:
 * - Uses authentication (useMiniAppAuth) for user state
 * - Leverages unified payment flow (useUnifiedMiniAppPurchaseFlow) for transactions
 * - Integrates with Farcaster context for social features
 * - Follows your established UI component and styling patterns
 * - Maintains compatibility with existing content hooks and utilities
 */
export function PaymentInterface({
  contentId,
  title,
  description,
  creatorInfo,
  userAddress,
  variant = 'default',
  enableSocialFeatures = true,
  showAuthDetails = true,
  showStrategyDetails = true,
  className,
  onPurchaseComplete,
  onShareComplete,
  onAuthMethodChange
}: PaymentInterfaceProps) {
  // Hooks integration
  const authResult = useMiniAppAuth()
  const purchaseFlow = useX402ContentPurchaseFlow(contentId, userAddress)
  const farcasterContext = useFarcasterContext()
  
  // Content data for display
  const { data: contentData, isLoading: isContentLoading } = useContentById(contentId)
  
  // Component state
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded')
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Display configuration
  const authDisplay = useMemo(() => 
    getAuthenticationDisplayState(authResult), 
    [authResult]
  )
  
  const strategyDisplay = useMemo(() => 
    getStrategyDisplayConfig(
      purchaseFlow.strategy,
      purchaseFlow.strategyAnalysis?.confidence ?? 0,
      Boolean(farcasterContext?.user)
    ), 
    [purchaseFlow.strategy, purchaseFlow.strategyAnalysis, farcasterContext]
  )
  
  // ===== EVENT HANDLERS =====
  
  /**
   * Handle Purchase Action
   * 
   * This function initiates the purchase using the optimal strategy
   * and handles success/error states appropriately.
   */
  const handlePurchase = useCallback(async () => {
    if (isProcessing) return // Prevent double-clicks
    
    try {
      setIsProcessing(true)
      setPurchaseError(null)
      
      console.log('🚀 Initiating purchase with strategy:', purchaseFlow.strategy)
      
      await purchaseFlow.purchaseWithOptimalStrategy()
      
      // Track strategy selection for analytics
      if (purchaseFlow.strategyAnalysis) {
        purchaseFlow.trackStrategySelection(
          purchaseFlow.strategy,
          [...purchaseFlow.strategyAnalysis.reasoning]
        )
      }
      
      // Handle successful purchase
      if (enableSocialFeatures && farcasterContext?.user) {
        setShowShareOptions(true)
        purchaseFlow.trackSocialPurchase(contentId)
      }
      
      console.log('✅ Purchase completed successfully')
      onPurchaseComplete?.(contentId)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed'
      console.error('Purchase failed:', errorMessage)
      
      setPurchaseError(errorMessage)
      
      // Show error to user with retry option
      if (error instanceof Error && error.message.includes('insufficient')) {
        setPurchaseError('Insufficient balance. Please check your USDC balance and try again.')
      } else if (error instanceof Error && error.message.includes('rejected')) {
        setPurchaseError('Transaction was rejected. Please try again.')
      } else {
        setPurchaseError(`Purchase failed: ${errorMessage}`)
      }
    } finally {
      setIsProcessing(false)
    }
  }, [purchaseFlow, enableSocialFeatures, farcasterContext, contentId, onPurchaseComplete, isProcessing])
  
  /**
   * Handle Social Share Action
   * 
   * This function handles social sharing for Farcaster users,
   * leveraging the social context for viral growth.
   */
  const handleShare = useCallback(async () => {
    if (!farcasterContext?.user || !enableSocialFeatures) return
    
    try {
      setShareError(null)
      
      // Integration point for Farcaster sharing
      console.log('🚀 Social Share:', {
        contentId: contentId.toString(),
        title,
        fid: farcasterContext.user.fid,
        username: farcasterContext.user.username
      })
      
      // Simulate share action (replace with actual Farcaster API integration)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ Content shared successfully on Farcaster')
      onShareComplete?.(contentId)
      setShowShareOptions(false)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed'
      console.error('Share failed:', errorMessage)
      
      setShareError(errorMessage)
      
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('network')) {
        setShareError('Network error. Please check your connection and try again.')
      } else {
        setShareError(`Share failed: ${errorMessage}`)
      }
    }
  }, [farcasterContext, enableSocialFeatures, contentId, title, onShareComplete])
  
  // ===== AUTHENTICATION METHOD DISPLAY =====
  
  /**
   * Authentication Status Component
   * 
   * This component displays the user's authentication method with
   * appropriate visual indicators and enhancement information.
   */
  const AuthenticationStatus = () => {
    const AuthIcon = authDisplay.icon
    
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-full",
            authDisplay.type === 'farcaster-native' && "bg-blue-100 text-blue-600",
            authDisplay.type === 'privy-wallet' && "bg-green-100 text-green-600",
            authDisplay.type === 'needs-connection' && "bg-gray-100 text-gray-600"
          )}>
            <AuthIcon className="h-4 w-4" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{authDisplay.displayName}</span>
              <Badge variant={authDisplay.badgeVariant} className="text-xs">
                {authDisplay.badgeText}
              </Badge>
            </div>
            
            {showAuthDetails && (
              <p className="text-xs text-muted-foreground mt-1">
                {authDisplay.description}
              </p>
            )}
          </div>
        </div>
        
        {authDisplay.showEnhancementIndicator && authDisplay.enhancementText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden sm:inline">{authDisplay.enhancementText}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Additional features available with your authentication method</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }
  
  // ===== PURCHASE STRATEGY DISPLAY =====
  
  /**
   * Purchase Strategy Component
   * 
   * This component displays the selected purchase strategy with
   * benefits and optimization information.
   */
  const PurchaseStrategyDisplay = () => {
    if (!showStrategyDetails) return null
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{strategyDisplay.title}</h4>
          <div className="flex items-center space-x-2">
            {strategyDisplay.confidenceLevel === 'high' && (
              <Badge variant="default" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Recommended
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {strategyDisplay.estimatedTime}
            </Badge>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {strategyDisplay.description}
        </p>
        
        {variant !== 'compact' && (
          <div className="grid grid-cols-2 gap-2">
            {strategyDisplay.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // ===== CONTENT DISPLAY =====
  
  /**
   * Content Information Component
   * 
   * This component displays the content information with pricing
   * and creator details following your established patterns.
   */
  const ContentInformation = () => {
    if (isContentLoading) {
      return (
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
        </div>
      )
    }
    
    if (!contentData) return null
    
    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{title}</h3>
            {description && variant !== 'compact' && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          
          <div className="text-right ml-4">
            <div className="font-bold text-lg">
              {formatCurrency(contentData.payPerViewPrice, 6)}
            </div>
            <div className="text-xs text-muted-foreground">
              USDC
            </div>
          </div>
        </div>
        
        {creatorInfo && variant !== 'compact' && (
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {creatorInfo.address.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-muted-foreground">
                {creatorInfo.name || formatAddress(creatorInfo.address)}
              </span>
              {creatorInfo.isVerified && (
                <CheckCircle2 className="h-3 w-3 text-blue-500" />
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // ===== PURCHASE BUTTON =====
  
  /**
   * Purchase Button
   * 
   * This component renders the appropriate purchase button based on
   * the current strategy and authentication state.
   */
  const PurchaseButton = () => {
    const ButtonIcon = strategyDisplay.buttonIcon
    const isLoading = purchaseFlow.flowState.step === 'purchasing' || isProcessing
    const canPurchase = purchaseFlow.canPurchase && authResult.isAuthenticated && !isProcessing
    
    // Show connection button if not authenticated
    if (!authResult.isAuthenticated) {
      return (
        <Button 
          onClick={authResult.login}
          variant="outline"
          size={variant === 'compact' ? 'sm' : 'default'}
          className="w-full"
          aria-label="Connect wallet to enable purchases"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      )
    }
    
    // Show share button if user has access
    if (purchaseFlow.hasAccess) {
      return (
        <div className="space-y-2">
          <Badge variant="default" className="w-full justify-center py-2">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            You own this content
          </Badge>
          
          {enableSocialFeatures && farcasterContext?.user && (
            <Button 
              onClick={handleShare}
              variant="outline"
              size={variant === 'compact' ? 'sm' : 'default'}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share on Farcaster
            </Button>
          )}
        </div>
      )
    }
    
    return (
              <Button
          onClick={handlePurchase}
          variant={strategyDisplay.buttonVariant}
          size={variant === 'compact' ? 'sm' : 'default'}
          disabled={!canPurchase || isLoading}
          className={cn(
            "w-full",
            strategyDisplay.buttonVariant === 'glow' && "shadow-lg"
          )}
          aria-label={`Purchase content using ${strategyDisplay.title.toLowerCase()} strategy`}
          aria-describedby={!canPurchase ? 'purchase-disabled-reason' : undefined}
        >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ButtonIcon className="h-4 w-4 mr-2" />
            {strategyDisplay.buttonText}
          </>
        )}
      </Button>
    )
  }
  
  // ===== PERFORMANCE METRICS DISPLAY =====
  
  /**
   * Performance Metrics Component
   * 
   * This component displays performance and optimization information
   * when available, helping users understand the benefits.
   */
  const PerformanceMetrics = () => {
    if (variant === 'compact' || !purchaseFlow.performanceMetrics) return null
    
    const metrics = purchaseFlow.performanceMetrics
    
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground">
          Performance Optimization
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="font-medium">{metrics.userStepsRequired}</div>
            <div className="text-muted-foreground">Steps</div>
          </div>
          
          {metrics.gasSavingsPercentage > 0 && (
            <div>
              <div className="font-medium text-green-600">
                {metrics.gasSavingsPercentage}%
              </div>
              <div className="text-muted-foreground">Gas Saved</div>
            </div>
          )}
          
          <div>
            <div className="font-medium">{metrics.uxImprovementScore}</div>
            <div className="text-muted-foreground">UX Score</div>
          </div>
        </div>
        
        {metrics.estimatedCompletionTime > 0 && (
          <div className="text-center text-xs text-muted-foreground">
            Estimated completion: ~{Math.round(metrics.estimatedCompletionTime / 1000)}s
          </div>
        )}
      </div>
    )
  }
  
  // ===== LOADING STATES =====
  
  const LoadingStates = () => {
    if (!isProcessing && purchaseFlow.flowState.step !== 'checking_access') return null
    
    return (
      <div className="space-y-2">
        {isProcessing && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">
              Processing your purchase...
            </span>
          </div>
        )}
        
        {purchaseFlow.flowState.step === 'checking_access' && (
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading purchase options...
            </span>
          </div>
        )}
      </div>
    )
  }
  
  // ===== SUCCESS STATES =====
  
  const SuccessStates = () => {
    if (!purchaseFlow.hasAccess && !showShareOptions) return null
    
    return (
      <div className="space-y-2">
        {purchaseFlow.hasAccess && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              You already own this content
            </span>
          </div>
        )}
        
        {showShareOptions && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Purchase successful! Share your new content on Farcaster
            </span>
          </div>
        )}
      </div>
    )
  }
  
  // ===== ERROR HANDLING WITH TOASTS =====
  
  // Handle purchase flow errors with toast notifications
  React.useEffect(() => {
    if (purchaseFlow.flowState.error) {
      handleUIError(purchaseFlow.flowState.error, 'Purchase', () => {
        // Retry purchase flow
        purchaseFlow.retryPurchase?.()
      })
    }
  }, [purchaseFlow.flowState.error, purchaseFlow.retryPurchase])
  
  // Handle component-level purchase errors
  React.useEffect(() => {
    if (purchaseError) {
      enhancedToast.paymentError(purchaseError, () => {
        setPurchaseError(null)
        // Could add retry logic here
      })
    }
  }, [purchaseError])
  
  // Handle share errors
  React.useEffect(() => {
    if (shareError) {
      enhancedToast.warning(shareError, {
        action: {
          label: 'Dismiss',
          onClick: () => setShareError(null)
        }
      })
    }
  }, [shareError])
  
  // ===== MAIN RENDER =====
  
  return (
    <TooltipProvider>
      <Card 
        className={cn("w-full", className)}
        role="region"
        aria-label="Payment Interface"
        aria-describedby="payment-description"
      >
        <CardHeader className={cn(
          "space-y-3",
          variant === 'compact' && "pb-4"
        )}>
          <div id="payment-description" className="sr-only">
            Payment interface for purchasing content with optimized strategies
          </div>
          
          <ContentInformation />
          
          {showAuthDetails && <AuthenticationStatus />}
        </CardHeader>

        <CardContent className="space-y-4">
          <LoadingStates />
          
          <SuccessStates />
          
          <PurchaseStrategyDisplay />
          
          {/* Error handling now done via toast notifications - no inline UI disruption */}
          
          {variant === 'expanded' && <PerformanceMetrics />}
        </CardContent>

        <CardFooter className={cn(
          "flex-col space-y-3",
          variant === 'compact' && "pt-4"
        )}>
          <PurchaseButton />
          
          {!purchaseFlow.canPurchase && (
            <div id="purchase-disabled-reason" className="text-xs text-muted-foreground text-center">
              {!authResult.isAuthenticated 
                ? 'Connect your wallet to purchase this content'
                : 'Purchase is currently unavailable'
              }
            </div>
          )}
          
          {showShareOptions && enableSocialFeatures && (
            <div className="w-full p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Share your purchase
                  </span>
                </div>
                <Button 
                  onClick={handleShare}
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Share
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}