/**
 * Creator Onboarding Page - Component 10.1: Complete User Flow Integration
 * File: src/app/onboard/page.tsx
 * 
 * This page demonstrates the culmination of our architectural approach by orchestrating
 * all previously built components into a seamless creator onboarding experience.
 * 
 * Integration Showcase:
 * - AppLayout provides the foundation structure and wallet awareness
 * - useCreatorOnboarding manages the complete business logic workflow
 * - ResponsiveNavigation tracks progress through multi-step process
 * - RouteGuards ensure proper access control and prerequisites
 * - WalletConnectionButton handles Smart Account creation with Biconomy
 * - Form validation leverages our type system for subscription pricing
 * 
 * This page proves that complex Web3 workflows can be presented as intuitive,
 * guided experiences that feel natural to users regardless of their crypto experience.
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  Wallet,
  User,
  DollarSign,
  Shield,
  Sparkles,
  ChevronLeft,
  ExternalLink
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Alert,
  AlertDescription,
  Badge,
  Progress,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ToastProvider,
  ToastViewport,
  useToast
} from '@/components/ui/index'

// Import our architectural layers - this shows the power of our modular approach
import { AppLayout } from '@/components/layout/AppLayout'
import { ResponsiveNavigation } from '@/components/layout/ResponsiveNavigation'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { WalletConnectionButton } from '@/components/web3/WalletConnect'

// Import our business logic hooks - the core of our workflow management
import { useCreatorOnboarding } from '@/hooks/business/workflows'
import { useWalletConnectionUI } from '@/hooks/ui/integration'

// Import utilities and types that ensure type safety throughout
import { cn, formatCurrency, formatAddress } from '@/lib/utils'
import type { Creator } from '@/types/contracts'

/**
 * Page-level interfaces that define our component's contract
 * These interfaces show how we maintain type safety even at the page level
 */
interface OnboardingFormData {
  readonly subscriptionPrice: string // String for form input, converted to bigint
  readonly bio: string
  readonly websiteUrl: string
  readonly socialHandle: string
}

interface OnboardingStep {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly completed: boolean
  readonly active: boolean
}

/**
 * CreatorOnboardingPage Component
 * 
 * This component orchestrates the complete creator onboarding experience,
 * demonstrating how all our architectural layers work together to create
 * a sophisticated yet user-friendly Web3 workflow.
 */
export default function CreatorOnboardingPage() {
  // Router for navigation after successful onboarding
  const router = useRouter()
  
  // Wallet connection state from wagmi
  const { address, isConnected } = useAccount()
  
  // Our UI integration hooks provide clean, component-friendly interfaces
  const walletUI = useWalletConnectionUI()
  
  // The core business logic hook that manages the entire onboarding workflow
  const onboarding = useCreatorOnboarding(address)
  
  // Toast for notifications
  const { toast } = useToast()
  
  // Local form state for user input collection
  const [formData, setFormData] = useState<OnboardingFormData>({
    subscriptionPrice: '5.00', // Default to $5/month
    bio: '',
    websiteUrl: '',
    socialHandle: ''
  })
  
  // UI state for enhanced user experience
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  /**
   * Form Validation Logic
   * 
   * This function demonstrates how we maintain type safety and user experience
   * by validating all inputs before submitting to the blockchain.
   */
  const validateForm = useCallback((data: OnboardingFormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    // Subscription price validation with clear business rules
    const price = parseFloat(data.subscriptionPrice)
    if (isNaN(price) || price < 0.01) {
      errors.subscriptionPrice = 'Minimum subscription price is $0.01'
    }
    if (price > 100) {
      errors.subscriptionPrice = 'Maximum subscription price is $100.00'
    }
    
    // Optional bio validation for quality content
    if (data.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters'
    }
    
    // URL validation for website field
    if (data.websiteUrl && !isValidUrl(data.websiteUrl)) {
      errors.websiteUrl = 'Please enter a valid website URL'
    }
    
    return errors
  }, [])

  /**
   * Form Submission Handler
   * 
   * This function shows how we bridge user input to blockchain transactions
   * while maintaining excellent error handling and user feedback.
   */
  const handleSubmit = useCallback(async () => {
    // Validate form data before proceeding
    const errors = validateForm(formData)
    setFormErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive"
      })
      return
    }
    
    try {
      // Convert form data to blockchain-compatible format
      const subscriptionPriceWei = BigInt(Math.floor(parseFloat(formData.subscriptionPrice) * 1000000)) // Convert to USDC decimals
      
      // Execute the registration through our business logic hook
      onboarding.register(subscriptionPriceWei)
      
      toast({
        title: "Registration Started",
        description: "Your creator registration is being processed on the blockchain.",
      })
      
    } catch (error) {
      console.error('Onboarding submission error:', error)
      toast({
        title: "Registration Failed",
        description: "There was an error processing your registration. Please try again.",
        variant: "destructive"
      })
    }
  }, [formData, validateForm, onboarding, toast])

  /**
   * Success Handling
   * 
   * When onboarding completes successfully, we provide clear feedback
   * and guide the user to their next logical destination.
   */
  useEffect(() => {
    if (onboarding.currentStep === 'registered' && onboarding.profile) {
      setShowSuccessDialog(true)
      
      toast({
        title: "Registration Successful!",
        description: "Welcome to the creator economy! Redirecting to dashboard...",
      })
      
      // Auto-redirect to dashboard after showing success
      const redirectTimeout = setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
      
      return () => clearTimeout(redirectTimeout)
    }
  }, [onboarding.currentStep, onboarding.profile, router, toast])

  /**
   * Onboarding Steps Configuration
   * 
   * This creates a visual progress indicator that reflects the actual
   * workflow state from our business logic hooks.
   */
  const onboardingSteps: readonly OnboardingStep[] = useMemo(() => [
    {
      id: 'wallet',
      title: 'Connect Wallet',
      description: 'Connect your wallet and set up Smart Account',
      icon: Wallet,
      completed: isConnected,
      active: !isConnected
    },
    {
      id: 'profile',
      title: 'Create Profile',
      description: 'Set up your creator profile and subscription pricing',
      icon: User,
      completed: onboarding.currentStep === 'registered',
      active: isConnected && onboarding.currentStep !== 'registered'
    },
    {
      id: 'verify',
      title: 'Blockchain Registration',
      description: 'Complete registration on the blockchain',
      icon: Shield,
      completed: onboarding.currentStep === 'registered',
      active: onboarding.registrationProgress.isSubmitting || onboarding.registrationProgress.isConfirming
    }
  ], [isConnected, onboarding.currentStep, onboarding.registrationProgress])

  const currentStepIndex = onboardingSteps.findIndex(step => step.active)
  const progressPercentage = ((onboardingSteps.filter(step => step.completed).length) / onboardingSteps.length) * 100

  return (
    <AppLayout className="bg-gradient-to-br from-background via-background to-primary/5">
      {/* Route Guard ensures only appropriate users can access this page */}
      <RouteGuards
        requiredLevel="public"
      >
        <ToastProvider>
          <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Page Header with Clear Value Proposition */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Become a Creator</h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join the decentralized creator economy. Set up your profile, define your subscription pricing, 
                and start monetizing your content on the blockchain.
              </p>
            </div>

            {/* Progress Indicator */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Setup Progress</h3>
                  <Badge variant="outline">
                    Step {currentStepIndex + 1} of {onboardingSteps.length}
                  </Badge>
                </div>
                
                <Progress value={progressPercentage} className="mb-6" />
                
                <div className="flex justify-between">
                  {onboardingSteps.map((step, index) => (
                    <OnboardingStepIndicator
                      key={step.id}
                      step={step}
                      isFirst={index === 0}
                      isLast={index === onboardingSteps.length - 1}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Responsive Navigation for Step Tracking */}
            <ResponsiveNavigation 
              userRole="disconnected"
              showMobileNav={true}
              showWorkflowProgress={true}
              onContextChange={(context) => {
                console.log(`Navigation context changed to: ${context}`)
              }}
            />

            {/* Wallet Address Display */}
            {isConnected && address && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Connected Wallet:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatAddress(address)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(address)
                          toast({
                            title: "Address Copied",
                            description: "Wallet address copied to clipboard!",
                          })
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Back Navigation */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>

            {/* Main Content Area with Step-by-Step Flow */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Primary Flow Panel */}
              <div className="lg:col-span-2">
                {!isConnected ? (
                  <WalletConnectionCard walletUI={walletUI} />
                ) : onboarding.isRegistered ? (
                  <AlreadyRegisteredCard profile={onboarding.profile} />
                ) : (
                  <CreatorProfileSetupCard
                    formData={formData}
                    formErrors={formErrors}
                    onFormChange={setFormData}
                    onSubmit={handleSubmit}
                    isLoading={onboarding.isLoading}
                    registrationProgress={onboarding.registrationProgress}
                  />
                )}
              </div>

              {/* Information Sidebar */}
              <div className="space-y-6">
                <BenefitsCard />
                <HelpCard />
              </div>
            </div>

            {/* Success Dialog */}
            <SuccessDialog
              open={showSuccessDialog}
              onOpenChange={setShowSuccessDialog}
              profile={onboarding.profile}
              onGoToDashboard={() => router.push('/dashboard')}
            />
          </div>
          <ToastViewport />
        </ToastProvider>
      </RouteGuards>
    </AppLayout>
  )
}

/**
 * Supporting Components
 * 
 * These components demonstrate how we break down complex interfaces
 * into manageable, reusable pieces while maintaining type safety.
 */

interface OnboardingStepIndicatorProps {
  step: OnboardingStep
  isFirst: boolean
  isLast: boolean
}

function OnboardingStepIndicator({ step, isFirst, isLast }: OnboardingStepIndicatorProps) {
  const IconComponent = step.icon
  
  return (
    <div className={cn(
      "flex flex-col items-center text-center",
      "flex-1 relative",
      !isLast && "after:absolute after:top-6 after:left-1/2 after:w-full after:h-0.5 after:bg-border after:transform after:translate-x-1/2"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 relative z-10 bg-background",
        step.completed && "border-primary bg-primary text-primary-foreground",
        step.active && !step.completed && "border-primary text-primary",
        !step.active && !step.completed && "border-muted text-muted-foreground"
      )}>
        {step.completed ? (
          <Check className="h-5 w-5" />
        ) : (
          <IconComponent className="h-5 w-5" />
        )}
      </div>
      <div className="text-sm font-medium">{step.title}</div>
      <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
    </div>
  )
}

interface WalletConnectionCardProps {
  walletUI: ReturnType<typeof useWalletConnectionUI>
}

function WalletConnectionCard({ walletUI }: WalletConnectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Your Wallet
        </CardTitle>
        <CardDescription>
          Connect your wallet to get started. We'll help you set up a Smart Account for the best experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <WalletConnectionButton variant="card" />
        
        {walletUI.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{walletUI.error}</AlertDescription>
          </Alert>
        )}
        
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Why Smart Accounts?</h4>
          <p className="text-sm text-muted-foreground">
            Smart Accounts provide a better experience with gasless transactions, 
            account recovery, and simplified wallet management.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface AlreadyRegisteredCardProps {
  profile: Creator | undefined
}

function AlreadyRegisteredCard({ profile }: AlreadyRegisteredCardProps) {
  const router = useRouter()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          You're Already a Creator!
        </CardTitle>
        <CardDescription>
          Your creator profile is set up and ready to go.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile && (
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Subscription Price: </span>
                {formatCurrency(BigInt(profile.subscriptionPrice), 6, 'USDC')}/month
              </div>
              <div>
                <span className="font-medium">Registration Date: </span>
                {new Date(Number(profile.registrationTime) * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
        
        <Button onClick={() => router.push('/dashboard')} className="w-full">
          Go to Creator Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

interface CreatorProfileSetupCardProps {
  formData: OnboardingFormData
  formErrors: Record<string, string>
  onFormChange: (data: OnboardingFormData) => void
  onSubmit: () => void
  isLoading: boolean
  registrationProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

function CreatorProfileSetupCard({
  formData,
  formErrors,
  onFormChange,
  onSubmit,
  isLoading,
  registrationProgress
}: CreatorProfileSetupCardProps) {
  const handleInputChange = useCallback((field: keyof OnboardingFormData) => 
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFormChange({
        ...formData,
        [field]: event.target.value
      })
    }, [formData, onFormChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Set Up Your Creator Profile
        </CardTitle>
        <CardDescription>
          Configure your subscription pricing and profile information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription Pricing */}
        <div className="space-y-2">
          <Label htmlFor="subscriptionPrice" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Monthly Subscription Price (USDC)
          </Label>
          <Input
            id="subscriptionPrice"
            type="number"
            step="0.01"
            min="0.01"
            max="100"
            placeholder="5.00"
            value={formData.subscriptionPrice}
            onChange={handleInputChange('subscriptionPrice')}
          />
          {formErrors.subscriptionPrice && (
            <p className="text-sm text-destructive">{formErrors.subscriptionPrice}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Set your monthly subscription price between $0.01 and $100.00
          </p>
        </div>

        <Separator />

        {/* Optional Profile Fields */}
        <div className="space-y-4">
          <h4 className="font-medium">Optional Profile Information</h4>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell your audience about yourself..."
              value={formData.bio}
              onChange={handleInputChange('bio')}
            />
            {formErrors.bio && (
              <p className="text-sm text-destructive">{formErrors.bio}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://yourwebsite.com"
              value={formData.websiteUrl}
              onChange={handleInputChange('websiteUrl')}
            />
            {formErrors.websiteUrl && (
              <p className="text-sm text-destructive">{formErrors.websiteUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialHandle">Social Media Handle</Label>
            <Input
              id="socialHandle"
              placeholder="@yourusername"
              value={formData.socialHandle}
              onChange={handleInputChange('socialHandle')}
            />
          </div>
        </div>

        {/* Transaction Status */}
        {registrationProgress.isSubmitting && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Submitting registration to blockchain...
            </AlertDescription>
          </Alert>
        )}

        {registrationProgress.isConfirming && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Waiting for transaction confirmation...
              {registrationProgress.transactionHash && (
                <Button
                  variant="link"
                  size="sm"
                  className="ml-2 h-auto p-0"
                  onClick={() => window.open(`https://basescan.org/tx/${registrationProgress.transactionHash}`, '_blank')}
                >
                  View Transaction <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={onSubmit}
          disabled={isLoading || registrationProgress.isSubmitting}
          className="w-full"
          size="lg"
        >
          {registrationProgress.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering on Blockchain...
            </>
          ) : (
            <>
              Complete Creator Registration
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function BenefitsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Creator Benefits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Decentralized Revenue</p>
            <p className="text-xs text-muted-foreground">Direct payments without intermediaries</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Content Ownership</p>
            <p className="text-xs text-muted-foreground">You retain full rights to your content</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">Transparent Analytics</p>
            <p className="text-xs text-muted-foreground">Real-time, verifiable revenue data</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Need Help?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Having trouble with the onboarding process? Check out our resources:
        </p>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            Creator Guide
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            Smart Account Setup
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            Contact Support
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Creator | undefined
  onGoToDashboard: () => void
}

function SuccessDialog({ open, onOpenChange, profile, onGoToDashboard }: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Welcome to the Creator Economy!</DialogTitle>
          <DialogDescription className="text-center">
            Your creator profile has been successfully registered on the blockchain.
          </DialogDescription>
        </DialogHeader>
        
        {profile && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Your Creator Profile</h4>
            <div className="space-y-1 text-sm">
              <div>Subscription Price: {formatCurrency(BigInt(profile.subscriptionPrice), 6, 'USDC')}/month</div>

              <div>Registration: {new Date(Number(profile.registrationTime) * 1000).toLocaleDateString()}</div>

            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Stay Here
          </Button>
          <Button onClick={onGoToDashboard} className="flex-1">
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Utility Functions
 */
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}