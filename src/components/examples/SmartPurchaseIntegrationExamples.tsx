/**
 * Smart Purchase Integration Examples
 * 
 * This file demonstrates how to integrate the smart shopping experience
 * components throughout your platform for maximum user experience benefit.
 * 
 * Real Implementation Examples - Ready to Use
 */

import React from 'react'
import { Address } from 'viem'
import { 
  SmartContentPurchaseCard, 
  SmartPaymentSelector,
  TokenInfo,
  useTokenBalances 
} from '@/components/web3/portfolio'
import { PaymentMethod } from '@/hooks/business/workflows'

/**
 * Example 1: Content Page Integration
 * Replace your existing ContentPurchaseCard with the smart version
 */
export function ContentPageExample({ contentId }: { contentId: bigint }) {
  const handlePurchaseSuccess = () => {
    // Navigate to content or refresh page
    window.location.href = `/content/${contentId}/view`
  }

  const handleSwapRequested = (requiredToken: TokenInfo, requiredAmount: number) => {
    // Open swap modal or redirect to DEX
    console.log(`User needs ${requiredAmount} ${requiredToken.symbol}`)
    // Could integrate with your favorite DEX here
  }

  return (
    <div className="max-w-md mx-auto">
      <SmartContentPurchaseCard
        contentId={contentId}
        onPurchaseSuccess={handlePurchaseSuccess}
        onSwapRequested={handleSwapRequested}
        showBalanceDetails={true}
      />
    </div>
  )
}

/**
 * Example 2: Checkout Flow Integration
 * Use the smart payment selector in checkout flows
 */
export function CheckoutFlowExample({ totalAmount }: { totalAmount: bigint }) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<PaymentMethod>()

  const handlePaymentMethodSelect = (method: PaymentMethod, analysis: any) => {
    setSelectedPaymentMethod(method)
    console.log('User selected:', method, 'Analysis:', analysis)
  }

  const handleInsufficientBalance = (analysis: any) => {
    console.log('Insufficient balance for:', analysis.method)
    // Show swap options or funding instructions
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Choose Payment Method</h3>
      <SmartPaymentSelector
        requiredAmountUSDC={totalAmount}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        onInsufficientBalance={handleInsufficientBalance}
        selectedMethod={selectedPaymentMethod}
        showDetailedAnalysis={true}
      />
    </div>
  )
}

/**
 * Example 3: Mobile/MiniApp Optimized Version
 * Compact version for mobile interfaces
 */
export function MobileContentPurchaseExample({ contentId }: { contentId: bigint }) {
  return (
    <SmartContentPurchaseCard
      contentId={contentId}
      compact={true}
      showBalanceDetails={false}
      className="w-full max-w-sm"
    />
  )
}

/**
 * Example 4: Dashboard Widget
 * Show spending capability at a glance
 */
export function SpendingCapabilityWidget() {
  const { getPaymentCapabilities, totalPortfolioValue } = useTokenBalances()
  const capabilities = getPaymentCapabilities()

  return (
    <div className="p-4 border rounded-lg bg-card">
      <h4 className="font-medium mb-2">Spending Power</h4>
      <div className="text-2xl font-bold text-green-600 mb-2">
        ${totalPortfolioValue.toFixed(2)}
      </div>
      <div className="text-sm text-muted-foreground">
        Recommended: {capabilities.recommendedPaymentMethod}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">USDC:</span>
          <span className="font-medium ml-1">${capabilities.maxUSDCSpend.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">ETH:</span>
          <span className="font-medium ml-1">${capabilities.maxETHSpend.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Example 5: Subscription Purchase Flow
 * Smart payment selection for recurring subscriptions
 */
export function SubscriptionPurchaseExample({ 
  creatorAddress, 
  monthlyPrice 
}: { 
  creatorAddress: Address
  monthlyPrice: bigint 
}) {
  const handleMethodSelect = (method: PaymentMethod, analysis: any) => {
    console.log('Subscription payment method:', method)
    // Proceed with subscription setup using selected method
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Subscribe to Creator</h3>
        <p className="text-muted-foreground">
          ${(Number(monthlyPrice) / 1e6).toFixed(2)} USDC per month
        </p>
      </div>
      
      <SmartPaymentSelector
        requiredAmountUSDC={monthlyPrice}
        onPaymentMethodSelect={handleMethodSelect}
        onInsufficientBalance={(analysis) => {
          console.log('Need more funds for subscription')
        }}
        allowedMethods={[PaymentMethod.USDC, PaymentMethod.ETH]} // Stable options for subscriptions
      />
    </div>
  )
}

/**
 * Example 6: Bulk Content Purchase
 * For purchasing multiple pieces of content at once
 */
export function BulkPurchaseExample({ 
  contentIds, 
  totalAmount 
}: { 
  contentIds: bigint[]
  totalAmount: bigint 
}) {
  const [processingStates, setProcessingStates] = React.useState<Record<string, boolean>>({})

  const handleBulkPurchase = async (method: PaymentMethod) => {
    console.log(`Processing bulk purchase of ${contentIds.length} items with ${method}`)
    
    for (const contentId of contentIds) {
      setProcessingStates(prev => ({ ...prev, [contentId.toString()]: true }))
      
      // Process individual purchases
      // Your existing purchase logic here
      
      setProcessingStates(prev => ({ ...prev, [contentId.toString()]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Bulk Purchase</h3>
        <p className="text-muted-foreground">
          {contentIds.length} items • ${(Number(totalAmount) / 1e6).toFixed(2)} USDC total
        </p>
      </div>
      
      <SmartPaymentSelector
        requiredAmountUSDC={totalAmount}
        onPaymentMethodSelect={(method) => handleBulkPurchase(method)}
        onInsufficientBalance={() => {
          console.log('Insufficient balance for bulk purchase')
        }}
        showDetailedAnalysis={true}
      />
      
      {/* Progress indicators */}
      <div className="space-y-1">
        {contentIds.map(contentId => (
          <div key={contentId.toString()} className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              processingStates[contentId.toString()] ? 'bg-yellow-500' : 'bg-gray-300'
            }`} />
            Content {contentId.toString()}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example 7: Progressive Web App Integration
 * For PWA installations and offline considerations
 */
export function PWAOptimizedPurchase({ contentId }: { contentId: bigint }) {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOffline) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
        <p className="text-yellow-800">
          You're offline. Purchase functionality will be available when you reconnect.
        </p>
      </div>
    )
  }

  return (
    <SmartContentPurchaseCard
      contentId={contentId}
      className="w-full"
      purchaseConfig={{
        enabledMethods: [PaymentMethod.USDC, PaymentMethod.ETH], // Limit for PWA
        defaultMethod: PaymentMethod.USDC
      }}
    />
  )
}

/**
 * Integration Tips and Best Practices
 */
export const INTEGRATION_TIPS = {
  // 1. Gradual Migration
  gradualMigration: `
    // Start by adding the smart components alongside existing ones
    // Use feature flags to control rollout
    const useSmartPurchase = process.env.NEXT_PUBLIC_SMART_PURCHASE === 'enabled'
    
    return useSmartPurchase ? 
      <SmartContentPurchaseCard {...props} /> : 
      <SmartContentPurchaseCard {...props} /> // Always use smart version now
  `,

  // 2. Mobile Optimization
  mobileOptimization: `
    // Use compact mode for mobile
    const isMobile = useMediaQuery('(max-width: 768px)')
    
    return (
      <SmartContentPurchaseCard
        compact={isMobile}
        showBalanceDetails={!isMobile}
        {...props}
      />
    )
  `,

  // 3. Analytics Integration
  analyticsIntegration: `
    // Track user payment preferences
    const handlePaymentMethodSelect = (method, analysis) => {
      analytics.track('payment_method_selected', {
        method,
        efficiency: analysis.efficiency,
        recommendation: analysis.recommendation,
        balance_sufficient: analysis.canAfford
      })
    }
  `,

  // 4. Error Handling
  errorHandling: `
    // Graceful degradation
    const handleSwapRequested = (token, amount) => {
      try {
        // Attempt to open swap interface
        openSwapModal(token, amount)
      } catch (error) {
        // Fallback to external DEX
        window.open(\`https://app.uniswap.org/#/swap?outputCurrency=\${token.address}\`)
      }
    }
  `
}
