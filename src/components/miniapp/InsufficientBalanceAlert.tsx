/**
 * Mini App Insufficient Balance Alert Component
 * File: src/components/miniapp/InsufficientBalanceAlert.tsx
 * 
 * Provides consistent insufficient balance messaging across the mini app.
 * Shows clear information about what user needs and provides helpful actions.
 */

'use client'

import React from 'react'
import { 
  AlertCircle, 
  Wallet, 
  Plus, 
  ArrowRight, 
  RefreshCw,
  DollarSign,
  Zap
} from 'lucide-react'

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge
} from '@/components/ui/index'
import { cn } from '@/lib/utils'
import type { MiniAppBalanceState } from '@/hooks/miniapp/useMiniAppBalance'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface InsufficientBalanceAlertProps {
  /** The required price in USDC (6 decimals) */
  requiredAmountUSDC: bigint
  
  /** Balance state from useMiniAppBalance hook */
  balanceState: MiniAppBalanceState
  
  /** Content title for context */
  contentTitle?: string
  
  /** Callback for refresh action */
  onRefresh?: () => void
  
  /** Callback for add funds action */
  onAddFunds?: () => void
  
  /** Custom className */
  className?: string
  
  /** Display variant */
  variant?: 'alert' | 'card' | 'compact'
  
  /** Show detailed balance breakdown */
  showDetails?: boolean
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const BalanceBreakdown: React.FC<{
  balanceState: MiniAppBalanceState
  requiredAmountUSDC: bigint
}> = ({ balanceState, requiredAmountUSDC }) => {
  const affordabilityCheck = balanceState.canAffordContent(requiredAmountUSDC)
  
  return (
    <div className="space-y-2 mt-3">
      <div className="text-xs font-medium text-muted-foreground">Your Balance:</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1 text-xs">
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
          <span>USDC: ${affordabilityCheck.balanceDetails.usdcAvailable}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="h-2 w-2 bg-purple-500 rounded-full" />
          <span>ETH: ${affordabilityCheck.balanceDetails.ethAvailableUSD}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs pt-1 border-t">
        <span className="font-medium">Total Available:</span>
        <span className="font-bold">${affordabilityCheck.balanceDetails.totalAvailable}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-destructive">
        <span className="font-medium">Required:</span>
        <span className="font-bold">${affordabilityCheck.balanceDetails.priceRequired}</span>
      </div>
      {affordabilityCheck.shortfallUSD && (
        <div className="flex items-center justify-between text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
          <span className="font-medium">Short by:</span>
          <span className="font-bold">${affordabilityCheck.shortfallUSD}</span>
        </div>
      )}
    </div>
  )
}

const ActionButtons: React.FC<{
  onRefresh?: () => void
  onAddFunds?: () => void
  isLoading?: boolean
}> = ({ onRefresh, onAddFunds, isLoading }) => (
  <div className="flex gap-2 mt-4">
    {onRefresh && (
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex-1"
      >
        <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
        Refresh
      </Button>
    )}
    {onAddFunds && (
      <Button
        size="sm"
        onClick={onAddFunds}
        className="flex-1"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Funds
      </Button>
    )}
  </div>
)

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const InsufficientBalanceAlert: React.FC<InsufficientBalanceAlertProps> = ({
  requiredAmountUSDC,
  balanceState,
  contentTitle,
  onRefresh,
  onAddFunds,
  className,
  variant = 'alert',
  showDetails = false
}) => {
  const insufficientMessage = balanceState.getInsufficientBalanceMessage(requiredAmountUSDC)
  const affordabilityCheck = balanceState.canAffordContent(requiredAmountUSDC)
  
  // If user can actually afford it, don't show insufficient balance
  if (affordabilityCheck.canAfford) {
    return null
  }

  // Compact variant for inline use
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-destructive bg-destructive/5 px-2 py-1 rounded", className)}>
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        <span>Short ${affordabilityCheck.shortfallUSD || '0'}</span>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-5 w-5 p-0 ml-auto"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  // Card variant for dedicated sections
  if (variant === 'card') {
    return (
      <Card className={cn("border-destructive/20 bg-destructive/5", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Wallet className="h-4 w-4" />
            Insufficient Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {contentTitle ? `To purchase "${contentTitle}", you need more USDC.` : 'You need more USDC to complete this purchase.'}
          </p>
          
          {showDetails && (
            <BalanceBreakdown 
              balanceState={balanceState}
              requiredAmountUSDC={requiredAmountUSDC}
            />
          )}
          
          <div className="bg-background/50 p-3 rounded-md border">
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-medium text-green-800">Quick Fix:</div>
                <div className="text-muted-foreground">Add USDC to your wallet or swap ETH for USDC to complete your purchase.</div>
              </div>
            </div>
          </div>
          
          <ActionButtons 
            onRefresh={onRefresh}
            onAddFunds={onAddFunds}
            isLoading={balanceState.isLoading}
          />
        </CardContent>
      </Card>
    )
  }

  // Default alert variant
  return (
    <Alert variant="destructive" className={cn("", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div className="font-medium">Insufficient Balance</div>
        <p className="text-sm">{insufficientMessage}</p>
        
        {showDetails && (
          <BalanceBreakdown 
            balanceState={balanceState}
            requiredAmountUSDC={requiredAmountUSDC}
          />
        )}
        
        <ActionButtons 
          onRefresh={onRefresh}
          onAddFunds={onAddFunds}
          isLoading={balanceState.isLoading}
        />
      </AlertDescription>
    </Alert>
  )
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook to check if insufficient balance alert should be shown
 */
export function useShowInsufficientBalance(
  requiredAmountUSDC: bigint,
  balanceState: MiniAppBalanceState
): boolean {
  return balanceState.hasInsufficientBalance(requiredAmountUSDC)
}

// =============================================================================
// EXPORT
// =============================================================================

export default InsufficientBalanceAlert