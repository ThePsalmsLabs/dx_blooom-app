# Phase 3 Swap Integration Examples

This document provides comprehensive examples of how to use the newly integrated swap functionality with your existing components.

## Complete Integration Overview

The Phase 3 swap integration adds sophisticated token swapping capabilities to your existing purchase flows. Here's how the components work together:

### Components Hierarchy
```
useSwapCalculation (Hook)
├── SwapModal (Component)
├── SmartContentPurchaseCard (Enhanced)
├── SmartPaymentSelector (Enhanced)
└── Portfolio Components (Updated)
```

## Basic Usage Examples

### 1. Enhanced Content Purchase with Built-in Swap

```tsx
// In your content page component (e.g., /content/[id]/page.tsx)
import { SmartContentPurchaseCard } from '@/components/web3/portfolio'

export default function ContentPage({ params }: { params: { id: string } }) {
  const contentId = BigInt(params.id)
  
  return (
    <div className="container mx-auto p-6">
      <SmartContentPurchaseCard
        contentId={contentId}
        enableSwapIntegration={true} // Enable built-in swap modal
        onPurchaseSuccess={() => {
          // Redirect to content view
          router.push(`/content/${params.id}/view`)
        }}
        onSwapRequested={(requiredToken, requiredAmount) => {
          // Optional: Handle external swap logic
          console.log(`User needs ${requiredAmount} ${requiredToken.symbol}`)
        }}
      />
    </div>
  )
}
```

### 2. Standalone Payment Selector with Swap

```tsx
// In a checkout flow component
import { SmartPaymentSelector } from '@/components/web3/portfolio'
import { useState } from 'react'

export default function CheckoutFlow() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>()
  const requiredAmount = BigInt('5000000') // 5 USDC in 6 decimals
  
  return (
    <div className="space-y-6">
      <SmartPaymentSelector
        requiredAmountUSDC={requiredAmount}
        enableSwapIntegration={true}
        onPaymentMethodSelect={(method, analysis) => {
          setSelectedPaymentMethod(method)
          console.log('Payment method selected:', method)
        }}
        onInsufficientBalance={(analysis) => {
          console.log('Insufficient balance for:', analysis.symbol)
          // This is automatically handled by swap integration
        }}
        showDetailedAnalysis={true}
      />
      
      {selectedPaymentMethod && (
        <div className="p-4 bg-green-50 rounded-lg">
          <p>Ready to proceed with {selectedPaymentMethod}</p>
        </div>
      )}
    </div>
  )
}
```

### 3. Custom Swap Modal Integration

```tsx
// For advanced use cases where you need direct swap control
import { SwapModal, useTokenBalances } from '@/components/web3/portfolio'
import { useState } from 'react'

export default function CustomSwapExample() {
  const { tokens } = useTokenBalances()
  const [showSwap, setShowSwap] = useState(false)
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null)
  const [toToken, setToToken] = useState<TokenInfo | null>(null)
  
  return (
    <div>
      <button 
        onClick={() => setShowSwap(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Open Swap
      </button>
      
      <SwapModal
        isOpen={showSwap}
        onClose={() => setShowSwap(false)}
        initialFromToken={fromToken}
        initialToToken={toToken}
        contextualMessage="Swap tokens for your portfolio"
        onSwapComplete={(from, to, amount) => {
          console.log(`Swapped ${amount} ${from.symbol} for ${to.symbol}`)
          setShowSwap(false)
        }}
      />
    </div>
  )
}
```

## Advanced Integration Patterns

### 1. Purchase Flow with Smart Token Selection

```tsx
// Advanced purchase component that automatically suggests best payment method
import { SmartContentPurchaseCard, useTokenBalances } from '@/components/web3/portfolio'
import { useEffect, useState } from 'react'

export default function AdvancedPurchaseFlow({ contentId }: { contentId: bigint }) {
  const { canAffordContentPrice, getPaymentCapabilities } = useTokenBalances()
  const [showAlternatives, setShowAlternatives] = useState(false)
  
  useEffect(() => {
    const capabilities = getPaymentCapabilities()
    if (!capabilities.canAffordDirectly) {
      setShowAlternatives(true)
    }
  }, [getPaymentCapabilities])
  
  return (
    <div className="space-y-6">
      <SmartContentPurchaseCard
        contentId={contentId}
        enableSwapIntegration={true}
        showBalanceDetails={true}
        onPurchaseSuccess={() => {
          console.log('Purchase completed successfully')
        }}
        purchaseConfig={{
          preferredPaymentMethod: 'auto', // Let the system choose
          enableGasOptimization: true,
          maxSlippage: 0.5
        }}
      />
      
      {showAlternatives && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Don't have the right tokens? The swap feature can help you get them instantly!
          </p>
        </div>
      )}
    </div>
  )
}
```

### 2. Multi-Step Purchase with Swap Workflow

```tsx
// Complex workflow that guides users through swap + purchase
import { SmartContentPurchaseCard, SwapModal, useTokenBalances } from '@/components/web3/portfolio'
import { useState, useCallback } from 'react'

type PurchaseStep = 'checking' | 'swap_needed' | 'swapping' | 'ready' | 'purchasing' | 'complete'

export default function GuidedPurchaseWorkflow({ contentId }: { contentId: bigint }) {
  const [step, setStep] = useState<PurchaseStep>('checking')
  const [swapDetails, setSwapDetails] = useState<{
    requiredToken: TokenInfo
    requiredAmount: number
  } | null>(null)
  
  const { refreshBalances } = useTokenBalances()
  
  const handleSwapNeeded = useCallback((requiredToken: TokenInfo, requiredAmount: number) => {
    setSwapDetails({ requiredToken, requiredAmount })
    setStep('swap_needed')
  }, [])
  
  const handleSwapStart = useCallback(() => {
    setStep('swapping')
  }, [])
  
  const handleSwapComplete = useCallback(() => {
    refreshBalances()
    setStep('ready')
    setSwapDetails(null)
  }, [refreshBalances])
  
  const handlePurchaseSuccess = useCallback(() => {
    setStep('complete')
  }, [])
  
  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex justify-between items-center mb-6">
        {['Check', 'Swap', 'Purchase', 'Complete'].map((label, index) => (
          <div key={label} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= ['checking', 'swap_needed', 'swapping', 'ready', 'purchasing', 'complete'].indexOf(step) 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            {index < 3 && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      {step === 'swap_needed' && swapDetails && (
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Swap Required</h3>
          <p className="text-gray-600">
            You need {swapDetails.requiredAmount.toFixed(4)} {swapDetails.requiredToken.symbol} to purchase this content.
          </p>
          <button
            onClick={handleSwapStart}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Swap Process
          </button>
        </div>
      )}
      
      {(step === 'checking' || step === 'ready' || step === 'purchasing') && (
        <SmartContentPurchaseCard
          contentId={contentId}
          enableSwapIntegration={step === 'checking'}
          onSwapRequested={handleSwapNeeded}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
      
      {step === 'complete' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Purchase Complete!</h3>
          <p className="text-gray-600">You now have access to this content.</p>
        </div>
      )}
      
      {/* Swap Modal */}
      <SwapModal
        isOpen={step === 'swapping'}
        onClose={() => setStep('swap_needed')}
        initialToToken={swapDetails?.requiredToken}
        requiredOutputAmount={swapDetails?.requiredAmount}
        contextualMessage="Complete this swap to proceed with your purchase"
        onSwapComplete={handleSwapComplete}
      />
    </div>
  )
}
```

### 3. Portfolio-First Swap Integration

```tsx
// Integration from the portfolio view
import { TokenBalanceList, SwapModal } from '@/components/web3/portfolio'
import { useState } from 'react'

export default function PortfolioWithSwap() {
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null)
  const [showSwap, setShowSwap] = useState(false)
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Portfolio</h2>
      
      <TokenBalanceList
        onTokenSelect={(token) => {
          setSelectedToken(token)
          setShowSwap(true)
        }}
        showHeader={true}
        hideZeroBalances={false}
        actions={(token) => (
          <button
            onClick={() => {
              setSelectedToken(token)
              setShowSwap(true)
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Swap
          </button>
        )}
      />
      
      <SwapModal
        isOpen={showSwap}
        onClose={() => {
          setShowSwap(false)
          setSelectedToken(null)
        }}
        initialFromToken={selectedToken}
        onSwapComplete={(from, to, amount) => {
          console.log(`Portfolio swap: ${amount} ${from.symbol} → ${to.symbol}`)
          setShowSwap(false)
          setSelectedToken(null)
        }}
      />
    </div>
  )
}
```

## Configuration Options

### SmartContentPurchaseCard Configuration

```tsx
interface SmartContentPurchaseCardProps {
  contentId: bigint
  compact?: boolean                    // Compact display mode
  showBalanceDetails?: boolean         // Show detailed balance info
  enableSwapIntegration?: boolean      // Enable built-in swap modal
  onPurchaseSuccess?: () => void       // Purchase success callback
  onSwapRequested?: (requiredToken: TokenInfo, requiredAmount: number) => void
  className?: string
  purchaseConfig?: {
    preferredPaymentMethod?: 'USDC' | 'ETH' | 'auto'
    enableGasOptimization?: boolean
    maxSlippage?: number
  }
}
```

### SmartPaymentSelector Configuration

```tsx
interface SmartPaymentSelectorProps {
  requiredAmountUSDC: bigint
  enableSwapIntegration?: boolean      // Enable built-in swap modal
  onPaymentMethodSelect: (method: PaymentMethod, analysis: PaymentOptionAnalysis) => void
  onInsufficientBalance: (analysis: PaymentOptionAnalysis) => void
  onSwapRequested?: (requiredToken: TokenInfo, requiredAmount: number) => void
  selectedMethod?: PaymentMethod
  showDetailedAnalysis?: boolean
  allowedMethods?: PaymentMethod[]
  className?: string
}
```

### SwapModal Configuration

```tsx
interface SwapModalProps {
  isOpen: boolean
  onClose: () => void
  initialFromToken?: TokenInfo | null     // Pre-select source token
  initialToToken?: TokenInfo | null       // Pre-select target token
  requiredOutputAmount?: number           // For purchase-driven swaps
  contextualMessage?: string              // Custom message for user
  onSwapComplete?: (fromToken: TokenInfo, toToken: TokenInfo, amount: string) => void
}
```

## Migration Guide

### Updating Existing Components

If you have existing purchase components, here's how to migrate:

1. **Replace imports:**
```tsx
// Old
import { ContentPurchaseCard } from '@/components/web3/ContentPurchaseCard'

// New
import { SmartContentPurchaseCard } from '@/components/web3/portfolio'
```

2. **Update component usage:**
```tsx
// Old
<ContentPurchaseCard
  contentId={contentId}
  onSuccess={() => {}}
/>

// New
<SmartContentPurchaseCard
  contentId={contentId}
  enableSwapIntegration={true}
  onPurchaseSuccess={() => {}}
  onSwapRequested={(token, amount) => {
    // Optional: Handle custom swap logic
  }}
/>
```

3. **Leverage new capabilities:**
```tsx
// Take advantage of intelligent payment selection
<SmartContentPurchaseCard
  contentId={contentId}
  enableSwapIntegration={true}
  showBalanceDetails={true}
  purchaseConfig={{
    preferredPaymentMethod: 'auto',
    enableGasOptimization: true
  }}
/>
```

## Best Practices

### 1. User Experience
- Always provide contextual messages explaining why swaps are needed
- Show clear progress indicators for multi-step flows
- Automatically refresh balances after successful swaps
- Provide fallback options for users who prefer external swaps

### 2. Error Handling
- Handle network failures gracefully
- Provide clear error messages
- Offer retry mechanisms
- Log swap events for debugging

### 3. Performance
- Use the built-in swap calculation caching
- Batch balance updates when possible
- Consider showing loading states for complex calculations
- Implement proper cleanup in useEffect hooks

### 4. Security
- Always validate swap parameters
- Show clear warnings for high-risk swaps
- Implement proper slippage protection
- Use secure random number generation for transaction nonces

This integration provides a seamless, professional-grade token swapping experience that enhances your existing purchase flows while maintaining backward compatibility.
