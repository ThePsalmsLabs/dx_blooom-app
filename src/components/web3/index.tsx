// src/components/web3/index.ts
/**
 * Web3-Specific UI Components - User Interface Layer
 * 
 * This collection of components provides the essential user interface patterns
 * that every Web3 application needs. Think of these as the specialized vocabulary
 * that allows users to have conversations with the blockchain through intuitive
 * visual interfaces rather than technical command lines.
 * 
 * Each component transforms complex Web3 concepts into familiar user interface
 * patterns that feel natural and approachable. They serve as the bridge between
 * the sophisticated technical infrastructure we've built and the simple,
 * confident user experiences that drive adoption.
 * 
 * Architecture Principles:
 * 1. Transform technical complexity into intuitive user experiences
 * 2. Provide consistent visual language across all Web3 interactions
 * 3. Build user confidence through clear feedback and guidance
 * 4. Enable progressive disclosure of advanced functionality
 * 5. Maintain accessibility and responsive design throughout
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wallet, 
  Shield, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Sparkles,
  DollarSign,
  Clock
} from 'lucide-react'

// Import our UI integration hooks that provide the data and actions these components need
import {
  useWalletConnectionUI,
  useTransactionStatusUI,
  useGasSponsorshipUI,
  useContentAccessUI,
  useCreatorDashboardUI,
  type TransactionStatusUI,
  type GasSponsorshipUI
} from '@/hooks/ui/integration'

/**
 * WALLET CONNECTION BUTTON
 * 
 * This component handles the complete wallet connection experience, from initial
 * connection through Smart Account upgrades. It demonstrates how complex Web3
 * connection logic can be presented through familiar button interaction patterns.
 * 
 * The component uses progressive disclosure to introduce advanced features like
 * Smart Accounts only after users are comfortable with basic wallet connection.
 * This approach reduces cognitive load while enabling sophisticated functionality.
 */
export function WalletConnectButton() {
  const walletUI = useWalletConnectionUI()
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  
  // Handle connection initiation with proper error feedback
  const handleConnect = useCallback(() => {
    try {
      walletUI.connect()
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }, [walletUI.connect])
  
  // Handle Smart Account upgrade with user education
  const handleUpgrade = useCallback(() => {
    walletUI.upgradeToSmartAccount()
    setShowUpgradeDialog(false)
  }, [walletUI.upgradeToSmartAccount])
  
  // If user is not connected, show the primary connection button
  if (!walletUI.isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <Button 
          onClick={handleConnect}
          disabled={walletUI.isConnecting}
          className="w-full sm:w-auto"
          size="lg"
        >
          {walletUI.isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
        
        {walletUI.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {walletUI.error}
              <Button 
                variant="link" 
                size="sm" 
                onClick={walletUI.clearError}
                className="ml-2 h-auto p-0 underline"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }
  
  // If user is connected, show account information and upgrade options
  return (
    <div className="flex flex-col gap-3">
      {/* Connected Account Display */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              {walletUI.isSmartAccount ? (
                <Shield className="h-5 w-5 text-green-600" />
              ) : (
                <Wallet className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-green-900">
                {walletUI.address?.slice(0, 6)}...{walletUI.address?.slice(-4)}
              </p>
              <p className="text-sm text-green-700">{walletUI.chainName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {walletUI.isSmartAccount ? (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Sparkles className="mr-1 h-3 w-3" />
                Smart Account
              </Badge>
            ) : (
              <Badge variant="outline">Standard Wallet</Badge>
            )}
            
            <Button variant="outline" size="sm" onClick={walletUI.disconnect}>
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Smart Account Upgrade Prompt */}
      {walletUI.canUpgradeToSmartAccount && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Upgrade to Smart Account for gas-free transactions</span>
            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Upgrade to Smart Account
                  </DialogTitle>
                  <DialogDescription>
                    Smart Accounts provide enhanced features for content platform users:
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Gas-Free Transactions</h4>
                      <p className="text-sm text-muted-foreground">
                        Small content purchases sponsored automatically
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Enhanced Security</h4>
                      <p className="text-sm text-muted-foreground">
                        Social recovery and advanced access controls
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Batch Transactions</h4>
                      <p className="text-sm text-muted-foreground">
                        Combine multiple actions into single confirmations
                      </p>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                    Maybe Later
                  </Button>
                  <Button onClick={handleUpgrade}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade Now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * TRANSACTION STATUS MODAL
 * 
 * This component provides real-time feedback during blockchain transactions,
 * transforming the complex multi-phase transaction lifecycle into clear,
 * understandable progress indicators. It helps users maintain confidence
 * during the waiting periods that are inherent to blockchain operations.
 */
interface TransactionStatusModalProps {
  isOpen: boolean
  onClose: () => void
  transactionStatus: TransactionStatusUI
  title: string
  description?: string
}

export function TransactionStatusModal({ 
  isOpen, 
  onClose, 
  transactionStatus, 
  title, 
  description 
}: TransactionStatusModalProps) {
  const [progress, setProgress] = useState(0)
  
  // Animate progress based on transaction status
  useEffect(() => {
    if (transactionStatus.status === 'submitting') {
      setProgress(25)
    } else if (transactionStatus.status === 'confirming') {
      setProgress(75)
    } else if (transactionStatus.status === 'confirmed') {
      setProgress(100)
    } else if (transactionStatus.status === 'failed') {
      setProgress(0)
    }
  }, [transactionStatus.status])
  
  const getStatusIcon = () => {
    switch (transactionStatus.status) {
      case 'submitting':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case 'confirming':
        return <Clock className="h-8 w-8 text-yellow-500" />
      case 'confirmed':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-500" />
      default:
        return <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    }
  }
  
  const getStatusMessage = () => {
    switch (transactionStatus.status) {
      case 'submitting':
        return 'Submitting transaction to the blockchain...'
      case 'confirming':
        return 'Waiting for blockchain confirmation...'
      case 'confirmed':
        return 'Transaction confirmed successfully!'
      case 'failed':
        return transactionStatus.errorMessage || 'Transaction failed'
      default:
        return 'Preparing transaction...'
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-6">
          {/* Status Icon */}
          <div className="flex items-center justify-center">
            {getStatusIcon()}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {getStatusMessage()}
            </p>
          </div>
          
          {/* Transaction Hash Link */}
          {transactionStatus.transactionHash && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Transaction:</span>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a 
                  href={`https://sepolia.basescan.org/tx/${transactionStatus.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  {transactionStatus.transactionHash.slice(0, 8)}...{transactionStatus.transactionHash.slice(-6)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
          
          {/* Error Message */}
          {transactionStatus.status === 'failed' && (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{transactionStatus.errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {transactionStatus.status === 'failed' && transactionStatus.canRetry && (
            <Button variant="outline" onClick={transactionStatus.retry}>
              Try Again
            </Button>
          )}
          
          <Button 
            onClick={onClose}
            variant={transactionStatus.status === 'confirmed' ? 'default' : 'outline'}
          >
            {transactionStatus.status === 'confirmed' ? 'Continue' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * GAS SPONSORSHIP INDICATOR
 * 
 * This component educates users about gas sponsorship policies and helps them
 * understand when their transactions will be free versus when they'll need to
 * pay gas fees. This transparency builds trust and helps users make informed
 * decisions about their interactions.
 */
interface GasSponsorshipIndicatorProps {
  transactionValueUSD?: number
  className?: string
}

export function GasSponsorshipIndicator({ 
  transactionValueUSD, 
  className = '' 
}: GasSponsorshipIndicatorProps) {
  const sponsorshipUI = useGasSponsorshipUI(transactionValueUSD)
  
  if (!sponsorshipUI.isEnabled) {
    return null
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Sponsorship Status */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          {sponsorshipUI.willSponsorTransaction ? (
            <>
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-green-700">Gas fees sponsored</span>
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Gas fees apply</span>
            </>
          )}
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium">
            {sponsorshipUI.willSponsorTransaction ? 'Free' : sponsorshipUI.estimatedGasCost}
          </p>
          {sponsorshipUI.willSponsorTransaction && (
            <p className="text-xs text-muted-foreground">
              Save {sponsorshipUI.estimatedSavings}
            </p>
          )}
        </div>
      </div>
      
      {/* Explanation Text */}
      <p className="text-xs text-muted-foreground">
        {sponsorshipUI.sponsorshipReason}
      </p>
      
      {/* Sponsorship Policy Information */}
      {sponsorshipUI.willSponsorTransaction && (
        <div className="rounded-md bg-yellow-50 p-2">
          <p className="text-xs text-yellow-800">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Transactions under {sponsorshipUI.maxSponsoredAmount} are sponsored through Smart Account
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * PAYMENT FLOW DIALOG
 * 
 * This component guides users through content purchase flows, combining
 * multiple Web3 concepts (access checking, pricing, gas costs, transaction
 * status) into a single, coherent user experience. It demonstrates how
 * complex workflows can be presented as simple, guided processes.
 */
interface PaymentFlowDialogProps {
  contentId: bigint
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PaymentFlowDialog({ 
  contentId, 
  isOpen, 
  onClose, 
  onSuccess 
}: PaymentFlowDialogProps) {
  const contentAccessUI = useContentAccessUI(contentId)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  
  // Handle successful purchase completion
  useEffect(() => {
    if (contentAccessUI.purchaseStatus.status === 'confirmed') {
      setShowTransactionModal(false)
      onSuccess?.()
      onClose()
    }
  }, [contentAccessUI.purchaseStatus.status, onSuccess, onClose])
  
  const handlePurchase = () => {
    contentAccessUI.purchase()
    setShowTransactionModal(true)
  }
  
  const handleSubscribe = () => {
    contentAccessUI.subscribe()
    setShowTransactionModal(true)
  }
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Access Content</DialogTitle>
            <DialogDescription>
              Choose how you'd like to access "{contentAccessUI.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Content Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{contentAccessUI.title}</CardTitle>
                <CardDescription>{contentAccessUI.description}</CardDescription>
              </CardHeader>
            </Card>
            
            {/* Access Options */}
            <div className="space-y-3">
              {/* Pay-Per-View Option */}
              {contentAccessUI.canPurchase && (
                <Card className="cursor-pointer border-2 hover:border-blue-300" onClick={handlePurchase}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium">One-time purchase</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanent access to this content
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{contentAccessUI.priceFormatted}</p>
                      <GasSponsorshipIndicator 
                        transactionValueUSD={parseFloat(contentAccessUI.priceFormatted.replace('$', ''))}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Subscription Option */}
              {!contentAccessUI.isSubscribed && (
                <Card className="cursor-pointer border-2 hover:border-green-300" onClick={handleSubscribe}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium">Subscribe to creator</h4>
                      <p className="text-sm text-muted-foreground">
                        Access all current and future content
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">$9.99/month</p>
                      <Badge variant="secondary" className="mt-1">Best Value</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Already Has Access */}
              {contentAccessUI.hasAccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    You already have access to this content.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Loading State */}
            {contentAccessUI.isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Transaction Status Modal */}
      <TransactionStatusModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactionStatus={contentAccessUI.purchaseStatus}
        title="Processing Payment"
        description="Please wait while we process your content purchase"
      />
    </>
  )
}