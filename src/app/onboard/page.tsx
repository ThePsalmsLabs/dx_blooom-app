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

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
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
  CheckCircle,
  Zap,
  Heart,
  Target
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
  Progress,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  useToast,
  Badge
} from '@/components/ui/index'

// Import our architectural layers - this shows the power of our modular approach
import { AppLayout } from '@/components/layout/AppLayout'
import { ResponsiveNavigation } from '@/components/layout/ResponsiveNavigation'
import { RouteGuards } from '@/components/layout/RouteGuards'

// Import our business logic hooks - the core of our workflow management
import { useCreatorOnboarding } from '@/hooks/business/workflows'
import { useWalletConnectionUI } from '@/hooks/ui/integration'

// Import utilities and types that ensure type safety throughout
import { cn, formatCurrency, formatAddress } from '@/lib/utils'
import type { Creator } from '@/types/contracts'
import { debug } from '@/lib/utils/debug'

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
  const [showManualOverride, setShowManualOverride] = useState(false)
  
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
      
      debug.log('🚀 Enhanced Page: Submitting Registration')
      debug.log('Form Data:', formData)
      debug.log('Subscription Price (wei):', subscriptionPriceWei.toString())
      debug.log('Profile Data:', profileData)
      
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
    debug.log('🔍 Success handling effect triggered:', {
      currentStep: onboarding.currentStep,
      isNavigating,
      showSuccessDialog,
      hasJustRegistered: onboarding.hasJustRegistered // Add this flag check
    })
    
    if (onboarding.currentStep === 'registered' && !isNavigating) {
      debug.log('✅ Registration successful, showing dialog and setting up redirect')
      
      if (!showSuccessDialog) {
        setShowSuccessDialog(true)
        toast({
          title: "Registration Successful!",
          description: "Welcome to the creator economy! Redirecting to dashboard...",
        })
      }
      
      setIsNavigating(true)
      
      // Enhanced redirect logic with retry mechanism
      const attemptRedirect = async (attempt = 1, maxAttempts = 3) => {
        try {
          debug.log(`🔄 Redirect attempt ${attempt}/${maxAttempts}`)
          
          // Force refresh the registration status before redirecting
          if (attempt === 1) {
            debug.log('🔄 Refreshing registration data...')
            await onboarding.registrationCheck?.refetch?.()
            await onboarding.creatorProfile?.refetch?.()
            
            // Wait a moment for the data to update
            await new Promise(resolve => setTimeout(resolve, 1500))
          }
          
          // Navigate to dashboard with registration flag
          router.push('/dashboard?newRegistration=true')
          debug.log('✅ Redirect initiated successfully')
          
        } catch (error) {
          console.error(`❌ Redirect attempt ${attempt} failed:`, error)
          
          if (attempt < maxAttempts) {
            // Retry with exponential backoff
            const delay = Math.pow(2, attempt) * 1000
            setTimeout(() => attemptRedirect(attempt + 1, maxAttempts), delay)
          } else {
            console.error('❌ All redirect attempts failed')
            // Fallback: show manual navigation option
            toast({
              title: "Registration Complete!",
              description: "Please manually navigate to your dashboard.",
              duration: 10000
            })
          }
        }
      }
      
      // Start the redirect process after a brief delay
      const redirectTimeout = setTimeout(() => {
        attemptRedirect()
      }, 1000)
      
      return () => {
        debug.log('🧹 Cleaning up redirect timeout')
        clearTimeout(redirectTimeout)
      }
    }
  }, [onboarding.currentStep, onboarding.profile, onboarding.hasJustRegistered, router, toast, showSuccessDialog, isNavigating])
  
  // Handle navigation state reset if user navigates away manually
  useEffect(() => {
    return () => {
      setIsNavigating(false)
    }
  }, [])

  // Show manual override button after 5 seconds of checking
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (onboarding.currentStep === 'checking') {
      timeout = setTimeout(() => {
        setShowManualOverride(true)
      }, 5000) // Show manual override after 5 seconds
    } else {
      setShowManualOverride(false)
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [onboarding.currentStep])
  
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
    debug.log('🔍 Enhanced Page: State Debug')
    debug.log('Progress Percentage:', progressPercentage)
    debug.log('Completed Steps:', completedSteps)
    debug.log('Current Step Index:', currentStepIndex)
    debug.log('Registration Progress:', onboarding.registrationProgress)
  }, [progressPercentage, completedSteps, currentStepIndex, onboarding.registrationProgress])

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 sm:py-8 sm:px-4">
      {/* Enhanced Page Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight">Bloom as a Creator</h1>
        </div>
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-1">
          Transform your creative passion into a flourishing livelihood. Join Bloom's vibrant ecosystem where
          authentic creators thrive through transparent Web3 connections, fair blockchain-powered monetization,
          and seamless Zora NFT integration.
        </p>
      </div>
      
      {/* Enhanced Progress Indicator */}
      <Card className="mb-6 sm:mb-8">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Bloom Setup Progress</h2>
            <span className="text-xs sm:text-sm text-muted-foreground">
              Step {Math.max(1, currentStepIndex + 1)} of {onboardingSteps.length}
              {showSuccessDialog && " - Complete!"}
            </span>
          </div>
          
          <Progress value={progressPercentage} className="mb-4 sm:mb-6" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
                  "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full",
                  step.completed && "bg-green-500 text-white",
                  step.active && "bg-blue-500 text-white",
                  !step.completed && !step.active && "bg-gray-300 text-gray-600"
                )}>
                  {step.completed ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <step.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm">{step.title}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Responsive Navigation for Step Tracking */}
      <Suspense fallback={<div className="h-16 bg-muted animate-pulse rounded" />}>
        <ResponsiveNavigation 
          userRole="disconnected"
          showMobileNav={true}
          showWorkflowProgress={true}
          onContextChange={useCallback((context: 'home' | 'browse' | 'content_creation' | 'content_consumption' | 'creator_dashboard' | 'user_profile' | 'transaction_flow' | 'onboarding') => {
            debug.log(`Navigation context changed to: ${context}`)
          }, [])}
        />
      </Suspense>
      
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
      <div className="mb-4 sm:mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2">
          {(() => {
            if (!isConnected) {
              return <WalletConnectionCard walletUI={walletUI} />
            }
            
            if (onboarding.currentStep === 'checking') {
              return (
                <CheckingRegistrationCard
                  onManualOverride={onboarding.forceProceedAsNotRegistered}
                  showManualOverride={showManualOverride}
                />
              )
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
          {/* Zora NFT Integration Showcase */}
          <Card className="bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-cyan-500/5 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Unlock NFT Superpowers with Zora
                <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-600 bg-purple-500/10">
                  <Zap className="h-3 w-3 mr-1" />
                  New Creators
                </Badge>
              </CardTitle>
              <CardDescription>
                Transform your content into collectible NFTs and unlock additional revenue streams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Multiple Revenue Streams</h4>
                    <p className="text-xs text-muted-foreground">
                      Earn from subscriptions, NFT sales, and royalties simultaneously
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-cyan-500/10 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Collector Community</h4>
                    <p className="text-xs text-muted-foreground">
                      Build lasting relationships with NFT collectors who value your work
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-pink-500/10 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Instant Settlements</h4>
                    <p className="text-xs text-muted-foreground">
                      Get paid immediately when your NFTs are purchased on Base network
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Creator-First Platform</h4>
                    <p className="text-xs text-muted-foreground">
                      Zora is built by creators, for creators - with no platform fees on primary sales
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-purple-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Ready to mint your first NFT?</p>
                    <p className="text-xs text-muted-foreground">
                      Access Zora tools from your creator dashboard after registration
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/collections')}
                    className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Explore NFTs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
              Welcome to the creator economy! You&apos;re now registered as a creator and can start 
              monetizing your content. {isNavigating ? "Redirecting to your dashboard..." : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Stay Here
            </Button>
            <Button onClick={() => {
              debug.log('🚀 Dashboard button clicked!')
              debug.log('Current router state:', router)
              try {
                // Close the dialog first
                setShowSuccessDialog(false)
                // Then navigate to dashboard
                setTimeout(() => {
                  router.push('/dashboard')
                  debug.log('✅ Navigation initiated successfully')
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
          Connect your wallet to get started. We&apos;ll help you set up a Smart Account for the best experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>Connect Wallet</div>
        
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
            You&apos;re Already a Creator!
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
          Go to Dashboard
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
              Registering...
            </>
          ) : (
            <>
              Register as Creator
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
            Account Setup
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
interface CheckingRegistrationCardProps {
  onManualOverride?: () => void
  showManualOverride?: boolean
}

function CheckingRegistrationCard({ onManualOverride, showManualOverride }: CheckingRegistrationCardProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Checking Registration Status</h3>
        <p className="text-muted-foreground mb-4">
          Please wait while we verify your account...
        </p>
        {showManualOverride && onManualOverride && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Taking longer than expected?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onManualOverride}
              className="text-xs"
            >
              Skip Check & Proceed
            </Button>
          </div>
        )}
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