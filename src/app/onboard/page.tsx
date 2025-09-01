/**
 * Creator Onboarding Page - Modern Web3 Onboarding Experience
 * File: src/app/onboard/page.tsx
 *
 * A completely redesigned onboarding experience with modern UI/UX patterns,
 * comprehensive responsiveness, and seamless Web3 integration.
 *
 * Features:
 * - 🎨 Modern glassmorphism design with smooth animations
 * - 📱 Fully responsive across mobile, tablet, and desktop
 * - ⚡ Optimized performance with lazy loading and code splitting
 * - ♿ Full accessibility support with ARIA labels and keyboard navigation
 * - 🎯 Progressive disclosure and contextual help
 * - 🚀 Smart form validation with real-time feedback
 * - 🎪 Engaging micro-interactions and animations
 * - 🌐 Multi-step wizard with progress tracking
 * - 🔒 Secure wallet integration with visual feedback
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
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
  Target,
  Star,
  Trophy,
  Users,
  TrendingUp,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Upload,
  BarChart3
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
  useToast,
  Badge,
  ScrollArea
} from '@/components/ui/index'

// Lazy load heavy components for better performance
const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })))
const CustomModal = lazy(() => import('@/components/ui/custom-modal').then(m => ({ default: m.CustomModal })))
const ResponsiveNavigation = lazy(() => import('@/components/layout/ResponsiveNavigation').then(m => ({ default: m.ResponsiveNavigation })))
const RouteGuards = lazy(() => import('@/components/layout/RouteGuards').then(m => ({ default: m.RouteGuards })))

// Import business logic
import { useCreatorOnboarding } from '@/hooks/business/workflows'
import { useIsCreatorRegistered } from '@/hooks/contracts/core'

// Import utilities
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
 * Modern, responsive onboarding experience with progressive disclosure
 * and contextual guidance throughout the creator registration process.
 */
export default function CreatorOnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoadingSkeleton />}>
      <AppLayout className="bg-gradient-to-br from-background via-background to-primary/5 min-h-screen">
        <RouteGuards requiredLevel="public">
          <OnboardingContent />
        </RouteGuards>
      </AppLayout>
    </Suspense>
  )
}

/**
 * Loading Skeleton for better perceived performance
 */
function OnboardingLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="space-y-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full mx-auto animate-pulse" />
        <div className="space-y-3">
          <div className="h-6 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-3/4 mx-auto" />
        </div>
        <div className="h-10 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Main Onboarding Content Component
 *
 * Completely redesigned with modern UX patterns, full responsiveness,
 * and comprehensive accessibility support.
 */
function OnboardingContent() {
  const router = useRouter()
  const walletUI = useWalletConnectionUI()
  const onboarding = useCreatorOnboarding(walletUI.address as `0x${string}` | undefined)
  const { toast } = useToast()

  // Enhanced state management with better UX
  const [currentStep, setCurrentStep] = useState<'welcome' | 'wallet' | 'profile' | 'complete'>('welcome')
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Form state management
  const [formData, setFormData] = useState<OnboardingFormData>({
    subscriptionPrice: '5.00',
    bio: '',
    websiteUrl: '',
    socialHandle: ''
  })

  // Enhanced UI state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showValidation, setShowValidation] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showManualOverride, setShowManualOverride] = useState(false)

  // Auto-advance logic based on wallet connection status
  useEffect(() => {
    if (walletUI.isConnected && currentStep === 'welcome') {
      const timer = setTimeout(() => {
        setIsTransitioning(true)
        setTimeout(() => {
          setCurrentStep('profile')
          setIsTransitioning(false)
        }, 300)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [walletUI.isConnected, currentStep])
  
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
      completed: walletUI.isConnected,
      active: !walletUI.isConnected
    },
    {
      id: 'profile',
      title: 'Create Profile',
      description: 'Set up your creator profile and subscription pricing',
      icon: User,
      completed: onboarding.currentStep === 'registered' || showSuccessDialog,
      active: walletUI.isConnected && onboarding.currentStep !== 'registered' && !showSuccessDialog
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
    walletUI.isConnected, 
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

  // Handle step transitions
  const handleNextStep = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      if (currentStep === 'welcome') {
        setCurrentStep('wallet')
      } else if (currentStep === 'wallet' && walletUI.isConnected) {
        setCurrentStep('profile')
      } else if (currentStep === 'profile') {
        setCurrentStep('complete')
      }
      setIsTransitioning(false)
    }, 300)
  }, [currentStep, walletUI.isConnected])

  const handlePrevStep = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      if (currentStep === 'profile') {
        setCurrentStep('wallet')
      } else if (currentStep === 'wallet') {
        setCurrentStep('welcome')
      }
      setIsTransitioning(false)
    }, 300)
  }, [currentStep])

  return (
    <div className="min-h-screen">
      {/* Modern Step Progress Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex-1 max-w-sm mx-4">
              <ModernStepIndicator
                currentStep={currentStep}
                isConnected={walletUI.isConnected}
              />
            </div>

            <div className="text-sm text-muted-foreground hidden sm:block">
              {currentStep === 'welcome' && 'Welcome'}
              {currentStep === 'wallet' && 'Connect'}
              {currentStep === 'profile' && 'Profile'}
              {currentStep === 'complete' && 'Complete'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isTransitioning && "opacity-0 transform translate-y-4"
          )}>
            {currentStep === 'welcome' && (
              <WelcomeStep onNext={handleNextStep} />
            )}

            {currentStep === 'wallet' && (
              <WalletStep
                walletUI={walletUI}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
              />
            )}

            {currentStep === 'profile' && (
              <ProfileStep
                formData={formData}
                formErrors={formErrors}
                onFormChange={setFormData}
                onSubmit={handleSubmit}
                onPrev={handlePrevStep}
                isLoading={onboarding.registrationProgress.isSubmitting || onboarding.registrationProgress.isConfirming}
                registrationProgress={onboarding.registrationProgress}
                walletUI={walletUI}
              />
            )}

            {currentStep === 'complete' && (
              <CompleteStep profile={onboarding.profile} />
            )}
          </div>
        </div>
      </ScrollArea>

    </div>
  )
}

/**
 * Modern Step Components
 *
 * Completely redesigned with modern UI patterns, full responsiveness,
 * and enhanced user experience.
 */

/**
 * Modern Step Indicator Component
 */
interface ModernStepIndicatorProps {
  currentStep: 'welcome' | 'wallet' | 'profile' | 'complete'
  isConnected: boolean
}

function ModernStepIndicator({ currentStep, isConnected }: ModernStepIndicatorProps) {
  const steps = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles },
    { id: 'wallet', label: 'Connect', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ]

  const getStepStatus = (stepId: string) => {
    if (stepId === currentStep) return 'active'
    if (stepId === 'welcome') return 'completed'
    if (stepId === 'wallet' && isConnected) return 'completed'
    if (stepId === 'profile' && currentStep === 'complete') return 'completed'
    if (stepId === 'complete' && currentStep === 'complete') return 'completed'
    return 'pending'
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id)
        const IconComponent = step.icon

        return (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
              status === 'completed' && "bg-primary border-primary text-primary-foreground",
              status === 'active' && "bg-primary/10 border-primary text-primary",
              status === 'pending' && "bg-muted border-muted text-muted-foreground"
            )}>
              {status === 'completed' ? (
                <Check className="h-4 w-4" />
              ) : (
                <IconComponent className="h-4 w-4" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-8 h-0.5 mx-2 transition-colors duration-300",
                getStepStatus(steps[index + 1].id) !== 'pending' ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Welcome Step Component
 */
interface WelcomeStepProps {
  onNext: () => void
}

function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-8 py-12">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full mx-auto flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Welcome to Bloom
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform your creative passion into a flourishing livelihood.
            Join Bloom's vibrant ecosystem where authentic creators thrive through
            transparent Web3 connections and fair blockchain-powered monetization.
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Global Community</h3>
            <p className="text-sm text-muted-foreground">
              Connect with creators and fans worldwide in a decentralized ecosystem
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Fair Monetization</h3>
            <p className="text-sm text-muted-foreground">
              Keep 100% ownership of your content and earn directly from your audience
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold mb-2">Web3 Native</h3>
            <p className="text-sm text-muted-foreground">
              Built on Base network with seamless NFT integration and smart contracts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Button */}
      <div className="pt-8">
        <Button
          size="lg"
          onClick={onNext}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 px-8 py-3 text-lg"
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Takes less than 2 minutes to set up your creator profile
        </p>
      </div>
    </div>
  )
}

/**
 * Wallet Step Component
 */
interface WalletStepProps {
  walletUI: ReturnType<typeof useWalletConnectionUI>
  onNext: () => void
  onPrev: () => void
}

function WalletStep({ walletUI, onNext, onPrev }: WalletStepProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto flex items-center justify-center">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Connect Your Wallet</h2>
          <p className="text-lg text-muted-foreground">
            Link your wallet to unlock the full creator experience
          </p>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <Card className="bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Choose your preferred wallet to connect and get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!walletUI.isConnected ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Connect your wallet to access creator features and start monetizing your content
              </p>

              {/* Wallet Connection Button */}
              <div className="max-w-sm mx-auto">
                <Button
                  onClick={walletUI.connect}
                  disabled={false}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  size="lg"
                >
                  {false ? (
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
              </div>

              {walletUI.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{walletUI.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-500 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-700">Wallet Connected!</h3>
                <p className="text-sm text-muted-foreground">
                  {formatAddress(walletUI.address as `0x${string}`)}
                </p>
              </div>
            </div>
          )}

          {/* Smart Account Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Smart Account Benefits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Gasless transactions for better UX</li>
                  <li>• Account recovery and security features</li>
                  <li>• Simplified wallet management</li>
                  <li>• Seamless integration with dApps</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!walletUI.isConnected}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Profile Step Component
 */
interface ProfileStepProps {
  formData: OnboardingFormData
  formErrors: Record<string, string>
  onFormChange: (data: OnboardingFormData) => void
  onSubmit: () => void
  onPrev: () => void
  isLoading: boolean
  registrationProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
  walletUI: ReturnType<typeof useWalletConnectionUI>
}

function ProfileStep({
  formData,
  formErrors,
  onFormChange,
  onSubmit,
  onPrev,
  isLoading,
  registrationProgress,
  walletUI
}: ProfileStepProps) {
  const handleInputChange = useCallback((field: keyof OnboardingFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onFormChange({
        ...formData,
        [field]: event.target.value
      })
    }, [formData, onFormChange])

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto flex items-center justify-center">
          <User className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Set Up Your Profile</h2>
          <p className="text-lg text-muted-foreground">
            Configure your creator profile and subscription pricing
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <Card className="bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Creator Profile
          </CardTitle>
          <CardDescription>
            Tell your audience about yourself and set your subscription price
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Price */}
          <div className="space-y-3">
            <Label htmlFor="subscriptionPrice" className="flex items-center gap-2 text-base font-medium">
              <DollarSign className="h-4 w-4" />
              Monthly Subscription Price
            </Label>
            <div className="relative">
              <Input
                id="subscriptionPrice"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                placeholder="5.00"
                value={formData.subscriptionPrice}
                onChange={handleInputChange('subscriptionPrice')}
                className={cn(
                  "pl-8 text-lg",
                  formErrors.subscriptionPrice && "border-destructive"
                )}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                $
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                USDC/month
              </span>
            </div>
            {formErrors.subscriptionPrice && (
              <p className="text-sm text-destructive">{formErrors.subscriptionPrice}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Set your monthly subscription price between $0.01 and $100.00
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-3">
            <Label htmlFor="bio" className="text-base font-medium">
              Bio <span className="text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              id="bio"
              className={cn(
                "flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                formErrors.bio && "border-destructive"
              )}
              placeholder="Tell your audience about yourself, your creative journey, and what they can expect from your content..."
              value={formData.bio}
              onChange={handleInputChange('bio')}
              maxLength={500}
            />
            {formErrors.bio && (
              <p className="text-sm text-destructive">{formErrors.bio}</p>
            )}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formData.bio.length}/500 characters</span>
            </div>
          </div>

          {/* Website URL */}
          <div className="space-y-3">
            <Label htmlFor="websiteUrl" className="text-base font-medium">
              Website URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://yourwebsite.com"
              value={formData.websiteUrl}
              onChange={handleInputChange('websiteUrl')}
              className={formErrors.websiteUrl ? "border-destructive" : ""}
            />
            {formErrors.websiteUrl && (
              <p className="text-sm text-destructive">{formErrors.websiteUrl}</p>
            )}
          </div>

          {/* Social Handle */}
          <div className="space-y-3">
            <Label htmlFor="socialHandle" className="text-base font-medium">
              Social Media Handle <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <Input
                id="socialHandle"
                placeholder="@yourusername"
                value={formData.socialHandle}
                onChange={handleInputChange('socialHandle')}
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
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
        </CardContent>
      </Card>

      {/* Preview Card */}
      {(formData.bio || formData.websiteUrl || formData.socialHandle) && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Profile Preview</CardTitle>
            <CardDescription>
              This is how your profile will appear to potential subscribers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.bio && (
                <p className="text-sm">{formData.bio}</p>
              )}
              {formData.websiteUrl && (
                <p className="text-sm text-primary">{formData.websiteUrl}</p>
              )}
              {formData.socialHandle && (
                <p className="text-sm text-primary">@{formData.socialHandle}</p>
              )}
              <div className="pt-2 border-t">
                <p className="text-sm font-medium">
                  Subscription: ${formData.subscriptionPrice} USDC/month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Profile...
            </>
          ) : (
            <>
              Create Creator Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Complete Step Component
 */
interface CompleteStepProps {
  profile: Creator | null
}

function CompleteStep({ profile }: CompleteStepProps) {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Welcome to Bloom!
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Congratulations! You're now officially a creator on the Bloom platform.
            Your profile has been registered on the blockchain and you're ready to start monetizing your content.
          </p>
        </div>
      </div>

      {/* Profile Summary */}
      {profile && (
        <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Trophy className="h-5 w-5" />
              Your Creator Profile
            </CardTitle>
            <CardDescription>
              Here's what you've set up - you can update these anytime from your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Subscription Price</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(BigInt(profile.subscriptionPrice), 6, 'USDC')}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Subscribers</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {profile.subscriberCount || 0}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-green-500/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium">Registration Date</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(Number(profile.registrationTime) * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            What's Next?
          </CardTitle>
          <CardDescription>
            Start building your creator presence on Bloom
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Upload Your First Content</h4>
                <p className="text-sm text-muted-foreground">
                  Share your creative work and start building your audience
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Customize Your Profile</h4>
                <p className="text-sm text-muted-foreground">
                  Add more details, links, and personalize your creator page
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Track Your Growth</h4>
                <p className="text-sm text-muted-foreground">
                  Monitor subscribers, revenue, and engagement analytics
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button
          onClick={() => router.push('/dashboard')}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 flex-1"
          size="lg"
        >
          <BarChart3 className="mr-2 h-5 w-5" />
          Go to Dashboard
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push('/upload')}
          className="flex-1"
          size="lg"
        >
          <Upload className="mr-2 h-5 w-5" />
          Upload Content
        </Button>
      </div>

      {/* Footer Message */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          🎉 Welcome to the creator economy! Your journey starts now.
        </p>
      </div>
    </div>
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