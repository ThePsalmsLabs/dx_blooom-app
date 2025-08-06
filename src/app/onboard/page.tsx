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
 * - WalletConnectButton handles Smart Account creation with Biconomy
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
  ExternalLink,
  CheckCircle
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
  useToast
} from '@/components/ui/index'

// Import our architectural layers - this shows the power of our modular approach
import { AppLayout } from '@/components/layout/AppLayout'
import { ResponsiveNavigation } from '@/components/layout/ResponsiveNavigation'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { WalletConnectButton } from '@/components/web3/WalletConnectModal'

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
  return (
    <AppLayout className="bg-gradient-to-br from-background via-background to-primary/5">
      <RouteGuards requiredLevel="public">
        <OnboardingContent />
      </RouteGuards>
    </AppLayout>
  )
}

/**
 * Main Onboarding Content Component
 * 
 * This component contains all the logic and is properly wrapped by ToastProvider
 * from AppLayout.
 */
function OnboardingContent() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const walletUI = useWalletConnectionUI()
  const onboarding = useCreatorOnboarding(address)
  const { toast } = useToast()
  
  // Form state management
  const [formData, setFormData] = useState<OnboardingFormData>({
    subscriptionPrice: '5.00', // Updated default from 3.00 to 5.00
    bio: '',
    websiteUrl: '',
    socialHandle: ''
  })
  
  // UI state for enhanced user experience
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isNavigating, setIsNavigating] = useState(false)
  
  // Enhanced form validation
  const validateForm = useCallback((data: OnboardingFormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    // Price validation
    const price = parseFloat(data.subscriptionPrice)
    if (isNaN(price) || price < 0.01) {
      errors.subscriptionPrice = 'Minimum subscription price is $0.01'
    }
    if (price > 100) {
      errors.subscriptionPrice = 'Maximum subscription price is $100.00'
    }
    
    // Profile content validation - ensure at least one field has content
    const hasProfileContent = [
      data.bio?.trim(),
      data.websiteUrl?.trim(), 
      data.socialHandle?.trim()
    ].some(field => field && field.length > 0)
    
    if (!hasProfileContent) {
      errors.bio = 'Please provide at least a bio, website, or social handle'
    }
    
    // Individual field validation
    if (data.bio && data.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters'
    }
    
    if (data.websiteUrl && !isValidUrl(data.websiteUrl)) {
      errors.websiteUrl = 'Please enter a valid website URL'
    }
    
    return errors
  }, [])
  
  // Construct profile data from form inputs
  const constructProfileData = useCallback((data: OnboardingFormData): string => {
    const profileParts = [
      data.bio?.trim() || '',
      data.websiteUrl?.trim() || '',
      data.socialHandle?.trim() || ''
    ].filter(part => part.length > 0)
    
    // Ensure we have at least some profile content
    if (profileParts.length === 0) {
      return `Creator Profile - Subscription: $${data.subscriptionPrice}/month`
    }
    
    return profileParts.join(' | ')
  }, [])
  
  // Enhanced form submission with better error handling
  const handleSubmit = useCallback(async () => {
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
      const subscriptionPriceWei = BigInt(Math.floor(parseFloat(formData.subscriptionPrice) * 1000000))
      const profileData = constructProfileData(formData)
      
      if (!profileData || profileData.trim().length === 0) {
        throw new Error('Profile data cannot be empty')
      }
      
      console.group('🚀 Enhanced Page: Submitting Registration')
      console.log('Form Data:', formData)
      console.log('Subscription Price (wei):', subscriptionPriceWei.toString())
      console.log('Profile Data:', profileData)
      console.groupEnd()
      
      onboarding.register(subscriptionPriceWei, profileData)
      
      toast({
        title: "Registration Started",
        description: "Your creator registration is being processed on the blockchain.",
      })
    } catch (error) {
      console.error('Enhanced submission error:', error)
      toast({
        title: "Registration Failed",
        description: (error as Error).message || "There was an error processing your registration. Please try again.",
        variant: "destructive"
      })
    }
  }, [formData, validateForm, constructProfileData, onboarding, toast])
  
  // Enhanced success handling with better navigation logic
  useEffect(() => {
    console.log('🔍 Success handling effect triggered:', {
      currentStep: onboarding.currentStep,
      isNavigating,
      showSuccessDialog
    })
    
    if (onboarding.currentStep === 'registered' && !isNavigating) {
      console.log('✅ Registration successful, showing dialog and setting up redirect')
      
      if (!showSuccessDialog) {
        setShowSuccessDialog(true)
        toast({
          title: "Registration Successful!",
          description: "Welcome to the creator economy! Redirecting to dashboard...",
        })
      }
      
      setIsNavigating(true)
      const redirectTimeout = setTimeout(() => {
        console.log('🔄 Auto-redirecting to dashboard...')
        try {
          // Add a small delay to allow blockchain data to update
          setTimeout(() => {
            router.push('/dashboard')
            console.log('✅ Auto-redirect initiated successfully')
          }, 1000) // Additional 1 second delay
        } catch (error) {
          console.error('❌ Auto-redirect failed:', error)
        }
      }, 2500)
      
      return () => {
        console.log('🧹 Cleaning up redirect timeout')
        clearTimeout(redirectTimeout)
      }
    }
  }, [onboarding.currentStep, onboarding.profile, router, toast, showSuccessDialog, isNavigating])
  
  // Handle navigation state reset if user navigates away manually
  useEffect(() => {
    return () => {
      setIsNavigating(false)
    }
  }, [])
  
  // Enhanced onboarding steps configuration with better state reflection
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
      completed: onboarding.currentStep === 'registered' || showSuccessDialog,
      active: isConnected && onboarding.currentStep !== 'registered' && !showSuccessDialog
    },
    {
      id: 'verify',
      title: 'Blockchain Registration',
      description: 'Complete registration on the blockchain',
      icon: Shield,
      completed: onboarding.currentStep === 'registered' || showSuccessDialog,
      active: onboarding.registrationProgress.isSubmitting || 
             onboarding.registrationProgress.isConfirming ||
             (onboarding.currentStep === 'registered' && !showSuccessDialog)
    }
  ], [
    isConnected, 
    onboarding.currentStep, 
    onboarding.registrationProgress,
    showSuccessDialog
  ])
  
  const currentStepIndex = onboardingSteps.findIndex(step => step.active)
  const completedSteps = onboardingSteps.filter(step => step.completed).length
  const progressPercentage = (completedSteps / onboardingSteps.length) * 100
  
  // Enhanced debug information
  useEffect(() => {
    console.group('🔍 Enhanced Page: State Debug')
    console.log('Progress Percentage:', progressPercentage)
    console.log('Completed Steps:', completedSteps)
    console.log('Current Step Index:', currentStepIndex)
    console.log('Registration Progress:', onboarding.registrationProgress)
    console.groupEnd()
  }, [progressPercentage, completedSteps, currentStepIndex, onboarding.registrationProgress])

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Enhanced Page Header */}
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
      
      {/* Enhanced Progress Indicator */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Setup Progress</h2>
            <span className="text-sm text-muted-foreground">
              Step {Math.max(1, currentStepIndex + 1)} of {onboardingSteps.length}
              {showSuccessDialog && " - Complete!"}
            </span>
          </div>
          
          <Progress value={progressPercentage} className="mb-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {onboardingSteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  step.completed && "bg-green-50 border border-green-200",
                  step.active && "bg-blue-50 border border-blue-200",
                  !step.completed && !step.active && "bg-gray-50"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  step.completed && "bg-green-500 text-white",
                  step.active && "bg-blue-500 text-white",
                  !step.completed && !step.active && "bg-gray-300 text-gray-600"
                )}>
                  {step.completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Responsive Navigation for Step Tracking */}
      <ResponsiveNavigation 
        userRole="disconnected"
        showMobileNav={true}
        showWorkflowProgress={true}
        onContextChange={useCallback((context: 'home' | 'browse' | 'content_creation' | 'content_consumption' | 'creator_dashboard' | 'user_profile' | 'transaction_flow' | 'onboarding') => {
          console.log(`Navigation context changed to: ${context}`)
        }, [])}
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
      
      {/* Enhanced Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {(() => {
            if (!isConnected) {
              return <WalletConnectionCard walletUI={walletUI} />
            }
            
            if (onboarding.currentStep === 'checking') {
              return <CheckingRegistrationCard />
            }
            
            if (onboarding.currentStep === 'registered' || showSuccessDialog) {
              return <RegistrationSuccessCard profile={onboarding.profile} isNavigating={isNavigating} />
            }
            
            if (onboarding.currentStep === 'error') {
              return <RegistrationErrorCard error={onboarding.error} onRetry={() => onboarding.reset()} />
            }
            
            return (
              <CreatorProfileSetupCard
                formData={formData}
                formErrors={formErrors}
                onFormChange={setFormData}
                onSubmit={handleSubmit}
                isLoading={onboarding.registrationProgress.isSubmitting || onboarding.registrationProgress.isConfirming}
                registrationProgress={onboarding.registrationProgress}
              />
            )
          })()}
        </div>
        
        <div className="space-y-6">
          <BenefitsCard />
          <HelpCard />
        </div>
      </div>
      
      {/* Enhanced Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Registration Successful!
            </DialogTitle>
            <DialogDescription>
              Welcome to the creator economy! You're now registered as a creator and can start 
              monetizing your content. {isNavigating ? "Redirecting to your dashboard..." : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Stay Here
            </Button>
            <Button onClick={() => {
              console.log('🚀 Dashboard button clicked!')
              console.log('Current router state:', router)
              try {
                // Close the dialog first
                setShowSuccessDialog(false)
                // Then navigate to dashboard
                setTimeout(() => {
                  router.push('/dashboard')
                  console.log('✅ Navigation initiated successfully')
                }, 100)
              } catch (error) {
                console.error('❌ Navigation failed:', error)
              }
            }}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
        <WalletConnectButton variant="outline" size="lg" showModal={true} />
        
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
  profile: Creator | null
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
          <h4 className="font-medium">Profile Information</h4>
          
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

// Helper components for different states
function CheckingRegistrationCard() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Checking Registration Status</h3>
        <p className="text-muted-foreground">Please wait while we verify your account...</p>
      </CardContent>
    </Card>
  )
}

interface RegistrationSuccessCardProps {
  profile: Creator | null
  isNavigating: boolean
}

function RegistrationSuccessCard({ profile, isNavigating }: RegistrationSuccessCardProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-green-800">Registration Complete!</h3>
        <p className="text-green-700 mb-4">
          {isNavigating 
            ? "Successfully registered! Redirecting to your creator dashboard..." 
            : "You're now a registered creator on the platform!"}
        </p>
        {isNavigating && (
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        )}
      </CardContent>
    </Card>
  )
}

interface RegistrationErrorCardProps {
  error: Error | null
  onRetry: () => void
}

function RegistrationErrorCard({ error, onRetry }: RegistrationErrorCardProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-red-800">Registration Failed</h3>
        <p className="text-red-700 mb-4">{error?.message || "An error occurred during registration"}</p>
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Utility Functions
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}