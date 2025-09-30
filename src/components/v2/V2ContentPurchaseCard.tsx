/**
 * V2 Content Purchase Card - Proper Implementation
 * 
 * This component uses the actual V2 hooks and follows the real V2 payment flow.
 * Built on the actual useV2PaymentOrchestrator and useAccessManager implementations.
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Address } from 'viem'
import {
  Eye,
  CheckCircle,
  Loader2,
  Wallet,
  Zap,
  AlertCircle,
  DollarSign,
  Coins,
  Sparkles,
  ShoppingCart
} from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { cn } from '@/lib/utils'

// V2 Hooks - using actual implementations
import { useV2PaymentOrchestrator } from '@/hooks/contracts/v2/unified/useV2PaymentOrchestrator'
import { useContentById } from '@/hooks/contracts/content'
import { useContentAccess } from '@/hooks/contracts/v2/managers/useAccessManager'
import { useContentPricing } from '@/hooks/contracts/v2/managers/usePriceOracle'
import { formatUnits } from 'viem'

// Types
interface PaymentOption {
  id: 'usdc' | 'eth' | 'quick'
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  estimatedTime: string
  gasLevel: 'Low' | 'Medium' | 'High'
  available: boolean
}

interface V2ContentPurchaseCardProps {
  contentId: bigint
  userAddress?: Address
  onPurchaseSuccess?: (contentId: bigint, transactionHash?: string) => void
  onViewContent?: (contentId: bigint) => void
  className?: string
  variant?: 'default' | 'compact' | 'minimal'
  showPaymentOptions?: boolean
}

export function V2ContentPurchaseCard({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  className,
  variant = 'default', // Available for future UI variations
  showPaymentOptions = true
}: V2ContentPurchaseCardProps) {
  const router = useRouter()
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'usdc' | 'eth' | 'quick'>('quick')
  
  // V2 Hooks - using actual implementations
  const orchestrator = useV2PaymentOrchestrator()
  const { hasAccess, isLoading: accessLoading, error: accessError } = useContentAccess(contentId)
  
  // Content details
  const { data: contentDetails, isLoading: contentLoading, error: contentError } = useContentById(contentId)
  
  // V2 Pricing - real-time from PriceOracle
  const basePrice = contentDetails?.payPerViewPrice || BigInt(1000000) // 1 USDC fallback
  const pricing = useContentPricing(basePrice)
  
  // Computed state
  const isLoading = accessLoading || contentLoading || pricing.isLoading
  const error = orchestrator.error || accessError || contentError || pricing.error

  // Payment options - simplified for real implementation
  const paymentOptions: PaymentOption[] = useMemo(() => [
    {
      id: 'quick',
      name: 'Quick Purchase',
      icon: Zap,
      description: 'Fast V2 payment',
      estimatedTime: '~30s',
      gasLevel: 'Low',
      available: !!userAddress && !!contentDetails?.creator
    },
    {
      id: 'usdc',
      name: 'USDC Payment',
      icon: DollarSign,
      description: 'Stable token payment',
      estimatedTime: '~45s',
      gasLevel: 'Medium',
      available: !!userAddress && !!contentDetails?.creator
    },
    {
      id: 'eth',
      name: 'ETH Payment',
      icon: Coins,
      description: 'Native token payment',
      estimatedTime: '~60s',
      gasLevel: 'High',
      available: !!userAddress && !!contentDetails?.creator
    }
  ], [userAddress, contentDetails?.creator])

  // V2 Purchase handler - using actual quickPurchase
  const handlePurchase = useCallback(async () => {
    if (!contentDetails?.creator || !userAddress || hasAccess) return

    try {
      // Use the real V2 quickPurchase mutation
      const result = await orchestrator.quickPurchase.mutateAsync({
        creator: contentDetails.creator,
        contentId: contentId
      })
      
      // Result is a transaction hash from writeContract
      console.log('V2 Purchase transaction:', result)
      onPurchaseSuccess?.(contentId, typeof result === 'string' ? result : undefined)
      
    } catch (err) {
      console.error('V2 Purchase failed:', err)
    }
  }, [contentDetails?.creator, userAddress, hasAccess, contentId, orchestrator.quickPurchase, onPurchaseSuccess])

  const handleViewContent = useCallback(() => {
    if (hasAccess) {
      onViewContent?.(contentId)
      router.push(`/content/${contentId}`)
    }
  }, [hasAccess, contentId, onViewContent, router])

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading content...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className={cn("w-full border-destructive", className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load content: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Access granted state
  if (hasAccess) {
    return (
      <Card className={cn("w-full border-green-200 bg-green-50", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Access Granted</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Owned
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You have access to this content via V2 payment system
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleViewContent} className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Content
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Purchase interface
  const selectedOption = paymentOptions.find(opt => opt.id === selectedPaymentMethod)
  const canPurchase = selectedOption?.available && !orchestrator.isPending

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {contentDetails?.title || `Content #${contentId}`}
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Sparkles className="h-3 w-3 mr-1" />
            V2 Enhanced
          </Badge>
        </div>
        {/* V2 Enhanced Pricing Display */}
        {pricing.paymentOptions.length > 0 && (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-primary">
              {formatUnits(basePrice, 6)} USDC
            </div>
            {pricing.ethPrice && typeof pricing.ethPrice === 'bigint' && pricing.ethPrice > BigInt(0) ? (
              <div className="text-sm text-muted-foreground">
                ≈ {formatUnits(pricing.ethPrice, 18)} ETH
              </div>
            ) : null}
            <Badge variant="secondary" className="text-xs">
              Live pricing via Uniswap V3
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {contentDetails?.description && (
          <p className="text-sm text-muted-foreground">
            {contentDetails.description}
          </p>
        )}

        {showPaymentOptions && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <div className="grid gap-2">
              {paymentOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedPaymentMethod(option.id)}
                  disabled={!option.available}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    selectedPaymentMethod === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50",
                    !option.available && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <option.icon className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{option.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {option.estimatedTime}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {option.gasLevel} Gas
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!userAddress && (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to purchase this content
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handlePurchase}
          disabled={!canPurchase}
          className="w-full"
          variant={canPurchase ? "default" : "secondary"}
        >
          {orchestrator.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing V2 Payment...
            </>
          ) : canPurchase ? (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase with {selectedOption?.name}
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 mr-2" />
              {!userAddress ? 'Connect Wallet' : 'Unable to Purchase'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default V2ContentPurchaseCard