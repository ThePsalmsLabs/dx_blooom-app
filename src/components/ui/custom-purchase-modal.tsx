/**
 * Custom Purchase Modal for USDC/ETH Payment Methods
 *
 * A comprehensive modal that provides an enhanced user experience for selecting
 * and executing payments with USDC or ETH in MiniApp, mobile, and web contexts.
 *
 * Features:
 * - Responsive design with mobile-first approach
 * - Real-time balance and allowance checking
 * - Network validation and switching
 * - Enhanced error handling and user feedback
 * - Social context integration for MiniApp
 * - Performance optimizations for different contexts
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from 'viem/chains'
import {
  CreditCard,
  Coins,
  Wallet,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
  DollarSign,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Globe,
  Clock
} from 'lucide-react'

import { CustomModal } from './custom-modal'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Alert, AlertDescription } from './alert'
import { Progress } from './progress'
import { cn } from '@/lib/utils'
import { formatCurrency, formatTokenBalance } from '@/lib/utils'

import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { useTokenBalance, useTokenAllowance } from '@/hooks/contracts/core'
import { getContractAddresses } from '@/lib/contracts/config'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
import { useUSDCPurchaseFlow } from '@/hooks/contracts/usdc-purchase-flow'
import { enhancedToast } from '@/lib/utils/toast'

/**
 * Payment Method Configuration
 */
export interface PaymentMethodConfig {
  id: 'usdc' | 'eth'
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  requiresApproval: boolean
  estimatedTime: string
  gasEstimate: string
}

/**
 * Purchase Modal Props
 */
export interface CustomPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: bigint
  contentTitle: string
  contentPrice: bigint // Price in USDC (6 decimals)
  creatorAddress: string
  onPurchaseSuccess?: (method: 'usdc' | 'eth', txHash: string) => void
  onPurchaseError?: (method: 'usdc' | 'eth', error: Error) => void
  className?: string
}

/**
 * Device Context Detection
 */
function useDeviceContext() {
  return useMemo(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile/i.test(userAgent)
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
    const isMiniApp = window.location.pathname.startsWith('/mini') ||
                     window.parent !== window ||
                     document.referrer.includes('farcaster') ||
                     document.referrer.includes('warpcast')

    return {
      isMobile,
      isTablet,
      isMiniApp,
      device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      context: isMiniApp ? 'miniapp' : 'web'
    }
  }, [])
}

/**
 * Network Status Component
 */
function NetworkStatusBadge() {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const expectedChainId = process.env.NETWORK === 'base-sepolia' ? baseSepolia.id : base.id
  const expectedChain = expectedChainId === base.id ? base : baseSepolia

  const isCorrectNetwork = chainId === expectedChainId

  const handleSwitchNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: expectedChainId })
    } catch (error) {
      enhancedToast.error('Failed to switch network')
    }
  }, [switchChain, expectedChainId])

  // Only show if network is wrong
  if (isCorrectNetwork) {
    return null
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSwitchNetwork}
      disabled={isPending}
      className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      {isPending ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin mr-2" />
          Switching to {expectedChain.name}...
        </>
      ) : (
        <>
          <AlertCircle className="w-3 h-3 mr-2" />
          Switch to {expectedChain.name}
        </>
      )}
    </Button>
  )
}

/**
 * Payment Method Card Component
 */
interface PaymentMethodCardProps {
  method: PaymentMethodConfig
  isSelected: boolean
  onSelect: () => void
  balance?: bigint
  allowance?: bigint
  contentPrice: bigint
  isLoading?: boolean
  deviceContext: ReturnType<typeof useDeviceContext>
}

function PaymentMethodCard({
  method,
  isSelected,
  onSelect,
  balance = BigInt(0),
  allowance = BigInt(0),
  contentPrice,
  isLoading,
  deviceContext
}: PaymentMethodCardProps) {
  const hasEnoughBalance = balance >= contentPrice
  const hasEnoughAllowance = !method.requiresApproval || allowance >= contentPrice

  const canUseMethod = method.id === 'usdc' ? (hasEnoughBalance && hasEnoughAllowance) : hasEnoughBalance

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 border-2",
        isSelected && canUseMethod
          ? `${method.borderColor} ${method.bgColor}`
          : "border-border hover:border-primary/50",
        !canUseMethod && "opacity-60 cursor-not-allowed",
        deviceContext.isMobile && "touch-manipulation"
      )}
      onClick={canUseMethod ? onSelect : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            method.bgColor,
            method.color
          )}>
            <method.icon className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{method.name}</h3>
              {canUseMethod && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </div>

            {method.id === 'usdc' && (
              <div className="text-xs text-muted-foreground mt-1">
                Balance: {isLoading ? '...' : formatTokenBalance(balance, 6)} USDC
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Purchase Progress Component
 */
interface PurchaseProgressProps {
  isProcessing: boolean
  currentStep: string
  progress: number
  error?: string
}

function PurchaseProgress({ isProcessing, currentStep, progress, error }: PurchaseProgressProps) {
  if (!isProcessing && !error) return null

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-medium">{currentStep}</span>
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Main Custom Purchase Modal Component
 */
export function CustomPurchaseModal({
  isOpen,
  onClose,
  contentId,
  contentTitle,
  contentPrice,
  creatorAddress,
  onPurchaseSuccess,
  onPurchaseError,
  className
}: CustomPurchaseModalProps) {
  const deviceContext = useDeviceContext()
  const walletUI = deviceContext.isMiniApp ? useMiniAppWalletUI() : useWalletConnectionUI()
  const chainId = useChainId()

  // Use the enhanced USDC purchase flow
  const usdcPurchaseFlow = useUSDCPurchaseFlow(
    contentId,
    contentPrice,
    walletUI.address as `0x${string}` | undefined
  )

  // State management
  const [selectedMethod, setSelectedMethod] = useState<'usdc' | 'eth'>('usdc')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>('')
  const [isApproving, setIsApproving] = useState(false)
  const [approvalCompleted, setApprovalCompleted] = useState(false)

  // Payment method configurations
  const paymentMethods: PaymentMethodConfig[] = useMemo(() => [
    {
      id: 'usdc',
      name: 'USDC',
      description: 'Direct USDC payment with instant confirmation',
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      requiresApproval: true,
      estimatedTime: '~15s',
      gasEstimate: 'Low'
    },
    {
      id: 'eth',
      name: 'ETH → USDC',
      description: 'Convert ETH to USDC and pay automatically',
      icon: Coins,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      requiresApproval: false,
      estimatedTime: '~45s',
      gasEstimate: 'High'
    }
  ], [])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('usdc')
      setIsProcessing(false)
      setCurrentStep('')
      setProgress(0)
      setError('')
      setIsApproving(false)
      setApprovalCompleted(false)
    }
  }, [isOpen])

  // Track approval completion
  useEffect(() => {
    if (selectedMethod === 'usdc' && usdcPurchaseFlow.state.phase === 'completed' && usdcPurchaseFlow.state.message.includes('approval')) {
      setApprovalCompleted(true)
    }
  }, [selectedMethod, usdcPurchaseFlow.state.phase, usdcPurchaseFlow.state.message])

  // Handle USDC approval
  const handleApproval = useCallback(async () => {
    if (!walletUI.address) {
      enhancedToast.error('Connect your wallet first')
      return
    }

    setIsApproving(true)

    try {
      console.log('🔄 Starting USDC approval...')
      const txHash = await usdcPurchaseFlow.executeApproval()
      console.log('✅ USDC approval completed:', txHash)
      setApprovalCompleted(true)
      enhancedToast.success('USDC approval completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Approval failed'

      // Handle transaction cancellation
      if (errorMessage.includes('User rejected') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('rejected')) {
        enhancedToast.error('Transaction cancelled')
      } else {
        enhancedToast.error('Approval failed')
      }

      console.error('❌ Approval failed:', errorMessage)
    } finally {
      setIsApproving(false)
    }
  }, [walletUI.address, usdcPurchaseFlow])

  // Handle purchase execution
  const handlePurchase = useCallback(async () => {
    if (!walletUI.address) {
      enhancedToast.error('Connect your wallet first')
      return
    }

    setIsProcessing(true)

    try {
      if (selectedMethod === 'usdc') {
        // Execute the purchase (approval should already be done)
        console.log('🛒 Executing USDC purchase...')
        const txHash = await usdcPurchaseFlow.executePurchase()
        console.log('✅ USDC purchase completed:', txHash)

        enhancedToast.success('Purchase completed!')
        onPurchaseSuccess?.('usdc', txHash)

      } else {
        // ETH → USDC Swap Flow (placeholder for now)
        setCurrentStep('Processing...')
        setProgress(50)

        // TODO: Implement ETH → USDC swap flow
        setTimeout(() => {
          setProgress(100)
          enhancedToast.success('Purchase completed!')
          onPurchaseSuccess?.('eth', '0x456...') // Replace with actual tx hash
        }, 2000)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed'

      // Handle transaction cancellation
      if (errorMessage.includes('User rejected') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('rejected')) {
        enhancedToast.error('Transaction cancelled')
      } else {
        enhancedToast.error('Purchase failed')
      }

      console.error('❌ Purchase failed:', errorMessage)
      onPurchaseError?.(selectedMethod, err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsProcessing(false)
    }
  }, [
    selectedMethod,
    walletUI.address,
    usdcPurchaseFlow,
    onPurchaseSuccess,
    onPurchaseError
  ])

  const selectedMethodConfig = paymentMethods.find(m => m.id === selectedMethod)
  const canPurchase = selectedMethodConfig &&
    (selectedMethod === 'eth' || (usdcPurchaseFlow.canPurchase && (approvalCompleted || !usdcPurchaseFlow.needsApproval)))
  const canApprove = selectedMethod === 'usdc' && usdcPurchaseFlow.needsApproval && !approvalCompleted

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Payment Method"
      description={`Purchase "${contentTitle}" for ${formatTokenBalance(contentPrice, 6)} USDC`}
      maxWidth={deviceContext.isMobile ? "sm:max-w-sm" : "sm:max-w-md"}
      mobileBottomSheet={deviceContext.isMobile}
      closeOnOverlayClick={!isProcessing}
      className={className}
    >
      {/* Network Status - Only show if wrong network */}
      <div className="mb-4">
        <NetworkStatusBadge />
      </div>

      {/* Payment Methods */}
      <div className="space-y-3 mb-6">
        {paymentMethods.map(method => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            isSelected={selectedMethod === method.id}
            onSelect={() => setSelectedMethod(method.id)}
            balance={method.id === 'usdc' ? usdcPurchaseFlow.balance : undefined}
            allowance={method.id === 'usdc' ? usdcPurchaseFlow.allowance : undefined}
            contentPrice={contentPrice}
            isLoading={usdcPurchaseFlow.state.phase === 'checking_balance'}
            deviceContext={deviceContext}
          />
        ))}
      </div>

      {/* USDC Approval Section */}
      {canApprove && (
        <div className="mb-4">
          <Button
            onClick={handleApproval}
            disabled={isApproving || !walletUI.isConnected}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving USDC...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve USDC
              </>
            )}
          </Button>
        </div>
      )}

      {/* Purchase Progress */}
      {((selectedMethod === 'usdc' && (usdcPurchaseFlow.state.phase !== 'idle' && usdcPurchaseFlow.state.phase !== 'completed')) || isApproving || isProcessing) && (
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {isApproving ? 'Approving...' :
               isProcessing ? 'Processing...' :
               selectedMethod === 'usdc' ? usdcPurchaseFlow.state.message : currentStep}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isProcessing || isApproving}
          className="flex-1"
        >
          Cancel
        </Button>

        <Button
          onClick={handlePurchase}
          disabled={!canPurchase || isProcessing || isApproving || !walletUI.isConnected}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              {selectedMethod === 'usdc' ? 'Buy with USDC' : 'Buy with ETH'}
            </>
          )}
        </Button>
      </div>
    </CustomModal>
  )
}

export default CustomPurchaseModal
