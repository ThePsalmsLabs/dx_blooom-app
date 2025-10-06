'use client'

/**
 * PermitSignatureFlow.tsx - Comprehensive Permit Signing Interface
 * 
 * Best-in-class UX for gasless payment permit signing.
 * Features step-by-step guidance, security explanations, and error handling.
 */

import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { 
  Shield, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  ArrowLeft,
  Zap,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'
import { usePermitPaymentManager } from '@/hooks/contracts/v2/managers/usePermitPaymentManager'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


import { motion, AnimatePresence } from 'framer-motion'
import { formatUnits } from 'viem'
import { useSignTypedData } from 'wagmi'
import { cn } from '@/lib/utils'

interface PermitSignatureFlowProps {
  intentId: `0x${string}`
  amount: bigint
  contentTitle: string
  onSuccess: (signature: `0x${string}`) => void
  onError: (error: Error) => void
  onCancel: () => void
  className?: string
}

type FlowStep = 'review' | 'security' | 'sign' | 'processing' | 'success' | 'error'

export function PermitSignatureFlow({
  intentId,
  amount,
  contentTitle,
  onSuccess,
  onError,
  onCancel,
  className
}: PermitSignatureFlowProps) {
  const { address: userAddress } = useAccount()
  const permitManager = usePermitPaymentManager()
  
  const [currentStep, setCurrentStep] = useState<FlowStep>('review')
  const [signature, setSignature] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Get current nonce for security display
  const { data: currentNonce } = permitManager.usePermitNonce(userAddress)
  
  // Wagmi hook for signing typed data
  const { signTypedDataAsync } = useSignTypedData()

  // Calculate expiration (1 hour from now)
  const expirationTime = new Date(Date.now() + 60 * 60 * 1000)
  const deadline = BigInt(Math.floor(expirationTime.getTime() / 1000))
  
  // Create the permit data structure
  const permitData = {
    permit: {
      permitted: {
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // USDC on Base
        amount: amount
      },
      nonce: currentNonce || BigInt(0),
      deadline: deadline
    },
    transferDetails: {
      to: permitManager.contractAddress,
      requestedAmount: amount
    },
    signature: '0x' as `0x${string}`
  }

  const steps = [
    { id: 'review', label: 'Review', icon: FileText },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'sign', label: 'Sign', icon: Zap },
    { id: 'processing', label: 'Processing', icon: Loader2 }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  // Create permit signature
  const handleCreateSignature = async () => {
    if (!userAddress) return

    setIsProcessing(true)
    setCurrentStep('processing')

    try {
      // Prepare the permit signature data using the permit manager
      const signatureData = permitManager.preparePermitSignature(permitData)
      
      // Sign the typed data using wagmi
      const signedSignature = await signTypedDataAsync({
        domain: signatureData.domain,
        types: signatureData.types,
        primaryType: 'PermitTransferFrom' as const,
        message: signatureData.message
      })
      
      setSignature(signedSignature)
      setCurrentStep('success')
      onSuccess(signedSignature)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create permit signature'
      setError(errorMessage)
      setCurrentStep('error')
      onError(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle step navigation
  const goToStep = (step: FlowStep) => {
    if (isProcessing) return
    setCurrentStep(step)
  }

  const nextStep = () => {
    switch (currentStep) {
      case 'review':
        setCurrentStep('security')
        break
      case 'security':
        setCurrentStep('sign')
        break
      case 'sign':
        handleCreateSignature()
        break
    }
  }

  const prevStep = () => {
    switch (currentStep) {
      case 'security':
        setCurrentStep('review')
        break
      case 'sign':
        setCurrentStep('security')
        break
    }
  }

  // Animation variants
  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  }

  const formatAmount = (amount: bigint) => {
    return `$${formatUnits(amount, 6)}`
  }

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index <= currentStepIndex
            const isCurrent = index === currentStepIndex
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                  isActive 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-gray-100 border-gray-300 text-gray-400',
                  isCurrent && 'ring-4 ring-blue-100'
                )}>
                  <Icon className={cn(
                    'h-5 w-5',
                    step.id === 'processing' && currentStep === 'processing' && 'animate-spin'
                  )} />
                </div>
                <span className={cn(
                  'ml-2 text-sm font-medium',
                  isActive ? 'text-gray-900' : 'text-gray-400'
                )}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'mx-4 h-0.5 w-16 transition-colors',
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {/* Review Step */}
          {currentStep === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Review Gasless Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Purchase Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Purchase Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Content</span>
                      <span className="font-medium">{contentTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-semibold text-lg">{formatAmount(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gas Fees</span>
                      <div className="text-right">
                        <span className="text-green-600 font-semibold">FREE</span>
                        <p className="text-xs text-gray-500">We pay the gas for you</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gasless Benefits */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Gasless Payment Benefits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">No Gas Fees</p>
                        <p className="text-xs text-green-700">Save ~$1-2 per transaction</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Faster Experience</p>
                        <p className="text-xs text-blue-700">One signature, we handle the rest</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-purple-900">Same Security</p>
                        <p className="text-xs text-purple-700">Your funds remain secure</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Use Standard Payment
                  </Button>
                  <Button onClick={nextStep} className="flex-1">
                    Continue to Security Review
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Step */}
          {currentStep === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Security Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Security Guarantees */}
                <div className="space-y-4">
                  <h4 className="font-semibold">What You're Authorizing</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Exact Amount Only</p>
                        <p className="text-sm text-gray-600">
                          Authorize spending of exactly {formatAmount(amount)} - no more, no less
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Single Use Only</p>
                        <p className="text-sm text-gray-600">
                          This authorization can only be used once for this specific purchase
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Time Limited</p>
                        <p className="text-sm text-gray-600">
                          Expires in 1 hour ({expirationTime.toLocaleTimeString()})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Revocable</p>
                        <p className="text-sm text-gray-600">
                          You can revoke this authorization at any time before use
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Details Toggle */}
                <div className="space-y-4">
                  <button
                    onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {showAdvancedDetails ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {showAdvancedDetails ? 'Hide' : 'Show'} Technical Details
                  </button>

                  <AnimatePresence>
                    {showAdvancedDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 p-4 rounded-lg space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Intent ID:</span>
                            <p className="font-mono text-xs break-all">{intentId}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Current Nonce:</span>
                            <p className="font-mono">{currentNonce?.toString() || 'Loading...'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Token:</span>
                            <p>USDC (6 decimals)</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Spender:</span>
                            <p className="font-mono text-xs">PermitPaymentManager</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={nextStep} className="flex-1">
                    Proceed to Signing
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sign Step */}
          {currentStep === 'sign' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Sign Permit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Sign</h3>
                    <p className="text-gray-600">
                      Click below to open your wallet and sign the permit authorization.
                      This is just a signature - no transaction fee required.
                    </p>
                  </div>
                </div>

                {/* Final Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Final Authorization:</span>
                    <Badge className="bg-green-100 text-green-800">Gasless Payment</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-semibold">{formatAmount(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Fee:</span>
                      <span className="text-green-600 font-semibold">FREE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span>{expirationTime.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={prevStep} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={nextStep} 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Sign Permit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  Processing Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Creating Permit Signature</h3>
                  <p className="text-gray-600">
                    Please check your wallet and sign the permit authorization.
                    This may take a moment to process.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> If your wallet doesn't open automatically, 
                    check for a notification or popup that may have been blocked.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Permit Created Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Signature Complete!</h3>
                  <p className="text-gray-600">
                    Your gasless payment authorization has been created successfully.
                    We'll now process your purchase without any gas fees.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✨ Your payment will be processed automatically in the background.
                    You'll receive a confirmation once complete.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Step */}
          {currentStep === 'error' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Signature Failed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Permit Creation Failed</h3>
                    <p className="text-gray-600">{error}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">What you can do:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Try signing the permit again</li>
                    <li>• Use standard payment instead (with gas fees)</li>
                    <li>• Check your wallet connection</li>
                    <li>• Contact support if the issue persists</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Use Standard Payment
                  </Button>
                  <Button onClick={() => goToStep('sign')} className="flex-1">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}