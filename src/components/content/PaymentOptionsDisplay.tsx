import React from 'react'
import { formatEther, formatUnits } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, Zap, CheckCircle, XCircle } from 'lucide-react'
import type { PaymentOption } from '@/hooks/business/workflows'
import { PaymentMethod } from '@/hooks/business/workflows'
import { useContentPurchaseFlow } from '@/hooks/business/workflows'

interface PaymentOptionsDisplayProps {
  paymentOptions: PaymentOption[]
  recommendedPayment: PaymentOption | null
  contentPrice: bigint
}

export function PaymentOptionsDisplay({ 
  paymentOptions, 
  recommendedPayment, 
  contentPrice 
}: PaymentOptionsDisplayProps) {
  if (paymentOptions.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-gray-500 text-center">Loading payment options...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5" />
          Payment Options
        </CardTitle>
        <p className="text-sm text-gray-600">
          Content Price: ${formatUnits(contentPrice, 6)} USDC
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {paymentOptions.map((option) => (
          <PaymentOptionCard 
            key={option.method}
            option={option}
            isRecommended={recommendedPayment?.method === option.method}
          />
        ))}
        
        {/* Debug Information */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p><strong>Debug Info:</strong></p>
          <p>Can afford with any method: {paymentOptions.some(o => o.canAfford) ? '✅ YES' : '❌ NO'}</p>
          <p>Recommended: {recommendedPayment?.method || 'None'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentOptionCard({ 
  option, 
  isRecommended 
}: { 
  option: PaymentOption
  isRecommended: boolean 
}) {
  const formatBalance = (balance: bigint | null, method: PaymentMethod) => {
    if (!balance) return 'Loading...'
    
    if (method === PaymentMethod.ETH) {
      return `${Number(formatEther(balance)).toFixed(4)} ETH`
    } else {
      return `$${Number(formatUnits(balance, 6)).toFixed(2)} USDC`
    }
  }

  const formatRequired = (required: bigint | null, method: PaymentMethod) => {
    if (!required) return 'Calculating...'
    
    if (method === PaymentMethod.ETH) {
      return `${Number(formatEther(required)).toFixed(4)} ETH`
    } else {
      return `$${Number(formatUnits(required, 6)).toFixed(2)} USDC`
    }
  }

  return (
    <div className={`
      relative p-4 rounded-lg border-2 transition-all
      ${option.canAfford 
        ? 'border-green-200 bg-green-50' 
        : 'border-red-200 bg-red-50'
      }
      ${isRecommended ? 'ring-2 ring-blue-400' : ''}
    `}>
      {/* Recommended Badge */}
      {isRecommended && (
        <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white">
          <Zap className="h-3 w-3 mr-1" />
          Recommended
        </Badge>
      )}
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{option.symbol}</span>
            {option.canAfford ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            {option.needsApproval && (
              <Badge variant="outline" className="text-xs">
                Approval Required
              </Badge>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Your Balance: {formatBalance(option.balance, option.method)}</p>
            <p>Required: {formatRequired(option.requiredAmount, option.method)}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`
            text-sm font-semibold
            ${option.canAfford ? 'text-green-600' : 'text-red-600'}
          `}>
            {option.canAfford ? 'Sufficient' : 'Insufficient'}
          </div>
          
          {option.method === PaymentMethod.ETH && (
            <div className="text-xs text-gray-500 mt-1">
              Via Commerce Protocol
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Enhanced debug component for testing
export function PurchaseFlowDebugger({ 
  purchaseFlow 
}: { 
  purchaseFlow: ReturnType<typeof useContentPurchaseFlow> 
}) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Purchase Flow Debug</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div><strong>Loading:</strong> {purchaseFlow.isLoading ? 'Yes' : 'No'}</div>
        <div><strong>Current Step:</strong> {purchaseFlow.flowState.step}</div>
        <div><strong>Has Access:</strong> {purchaseFlow.hasAccess ? 'Yes' : 'No'}</div>
        <div><strong>Error:</strong> {purchaseFlow.flowState.error?.message || 'None'}</div>
        
        <div className="mt-3">
          <strong>Available Methods:</strong>
          <div className="ml-2 space-y-1">
            {purchaseFlow.availablePaymentMethods.map(method => (
              <div key={method}>{method}</div>
            ))}
          </div>
        </div>
        
        <div><strong>Selected Method:</strong> {purchaseFlow.selectedMethod}</div>
      </CardContent>
    </Card>
  )
}