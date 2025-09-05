/**
 * MiniApp Creator Onboarding Page - Step-by-Step Creator Registration
 * File: src/app/mini/onboard/page.tsx
 *
 * This page provides a comprehensive, mobile-optimized onboarding flow for users
 * to become creators on the platform. It guides them through wallet verification,
 * profile setup, and content creation preparation with clear progress tracking.
 *
 * Mini App Design Philosophy:
 * - Step-by-step mobile onboarding with clear progress
 * - Touch-optimized form interactions and validation
 * - Encouraging messaging and creator benefits highlighting
 * - Seamless wallet integration and verification
 * - Instant feedback and success states
 *
 * Key Features:
 * - Multi-step onboarding with progress tracking
 * - Wallet verification and creator registration
 * - Profile setup with creator information
 * - Content creation preparation and guidance
 * - Success celebration and next steps
 */

'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  Wallet,
  User,
  FileText,
  Upload,
  Sparkles,
  Crown,
  Zap,
  Heart,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Camera,
  Edit,
  Target,
  Lightbulb,
  Rocket,
  CheckCircle
} from 'lucide-react'

// Import your existing UI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Input,
  Textarea,
  Label,
  Progress,
  Avatar,
  AvatarFallback
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useMiniAppUtils } from '@/contexts/UnifiedMiniAppProvider'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
import { useCreatorProfile } from '@/hooks/contracts/core'

// Import your existing sophisticated components
import { AdaptiveNavigation } from '@/components/layout/AdaptiveNavigation'

// Import utilities
import { formatAddress } from '@/lib/utils'

/**
 * Onboarding Step Types
 */
type OnboardingStep = 'welcome' | 'wallet' | 'profile' | 'verify' | 'complete'

/**
 * Profile Data Interface
 */
interface ProfileData {
  displayName: string
  bio: string
  expertise: string[]
  socialLinks: {
    twitter?: string
    website?: string
  }
}

/**
 * Onboarding State Interface
 */
interface OnboardingState {
  readonly currentStep: OnboardingStep
  readonly profileData: ProfileData
  readonly isSubmitting: boolean
  readonly registrationComplete: boolean
}

/**
 * Profile Update Value Types
 */
type ProfileUpdateValue = string | string[] | ProfileData['socialLinks']

/**
 * MiniApp Creator Onboarding Core Component
 *
 * This component orchestrates the complete creator onboarding experience
 * with mobile-first design and comprehensive step-by-step guidance.
 */
function MiniAppCreatorOnboardingCore() {
  const router = useRouter()

  // Core state management
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 'welcome',
    profileData: {
      displayName: '',
      bio: '',
      expertise: [],
      socialLinks: {}
    },
    isSubmitting: false,
    registrationComplete: false
  })

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  // Creator verification hook
  const creatorProfile = useCreatorProfile(userAddress)

  /**
   * Step Navigation Handlers
   */
  const handleNextStep = useCallback(() => {
    const steps: OnboardingStep[] = ['welcome', 'wallet', 'profile', 'verify', 'complete']
    const currentIndex = steps.indexOf(onboardingState.currentStep)
    const nextStep = steps[currentIndex + 1]

    if (nextStep) {
      setOnboardingState(prev => ({ ...prev, currentStep: nextStep }))
    }
  }, [onboardingState.currentStep])

  const handlePrevStep = useCallback(() => {
    const steps: OnboardingStep[] = ['welcome', 'wallet', 'profile', 'verify', 'complete']
    const currentIndex = steps.indexOf(onboardingState.currentStep)
    const prevStep = steps[currentIndex - 1]

    if (prevStep) {
      setOnboardingState(prev => ({ ...prev, currentStep: prevStep }))
    }
  }, [onboardingState.currentStep])

  const handleGoToStep = useCallback((step: OnboardingStep) => {
    setOnboardingState(prev => ({ ...prev, currentStep: step }))
  }, [])

  /**
   * Profile Data Handlers
   */
  const handleProfileUpdate = useCallback((field: keyof ProfileData, value: ProfileUpdateValue) => {
    setOnboardingState(prev => ({
      ...prev,
      profileData: {
        ...prev.profileData,
        [field]: value
      }
    }))
  }, [])

  /**
   * Registration Handler
   */
  const handleCompleteRegistration = useCallback(async () => {
    if (!userAddress) return

    setOnboardingState(prev => ({ ...prev, isSubmitting: true }))

    try {
      // Mock registration process - in real implementation this would call contract
      await new Promise(resolve => setTimeout(resolve, 2000))

      setOnboardingState(prev => ({
        ...prev,
        registrationComplete: true,
        isSubmitting: false
      }))

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/mini/dashboard')
      }, 3000)
    } catch (error) {
      console.error('Registration failed:', error)
      setOnboardingState(prev => ({ ...prev, isSubmitting: false }))
    }
  }, [userAddress, router])

  /**
   * Navigation Handler
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  // Auto-redirect if already registered
  useEffect(() => {
    if (creatorProfile.data?.isRegistered) {
      router.push('/mini/dashboard')
    }
  }, [creatorProfile.data?.isRegistered, router])

  // Handle wallet connection requirement
  if (!walletUI.isConnected || !userAddress) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center space-y-6">
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to become a creator
            </p>
          </div>
          <Button onClick={() => router.push('/mini')}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 space-y-6">
        {/* Onboarding Header */}
        <OnboardingHeader
          onGoBack={handleGoBack}
          currentStep={onboardingState.currentStep}
        />

        {/* Progress Indicator */}
        <OnboardingProgress
          currentStep={onboardingState.currentStep}
          onStepClick={handleGoToStep}
          registrationComplete={onboardingState.registrationComplete}
        />

        {/* Onboarding Steps */}
        <OnboardingSteps
          onboardingState={onboardingState}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
          onProfileUpdate={handleProfileUpdate}
          onCompleteRegistration={handleCompleteRegistration}
          userAddress={userAddress}
        />

        {/* Creator Benefits Preview */}
        <CreatorBenefitsPreview />
      </main>
    </div>
  )
}

/**
 * Onboarding Header Component
 *
 * Dynamic header with step context and navigation
 */
function OnboardingHeader({
  onGoBack,
  currentStep
}: {
  onGoBack: () => void
  currentStep: OnboardingStep
}) {
  const getStepTitle = () => {
    switch (currentStep) {
      case 'welcome':
        return 'Welcome to Creator Hub'
      case 'wallet':
        return 'Wallet Verification'
      case 'profile':
        return 'Creator Profile'
      case 'verify':
        return 'Review & Verify'
      case 'complete':
        return 'Registration Complete!'
      default:
        return 'Become a Creator'
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 'welcome':
        return 'Join thousands of creators building the future of content'
      case 'wallet':
        return 'Verify your wallet to secure your creator account'
      case 'profile':
        return 'Tell us about yourself and your expertise'
      case 'verify':
        return 'Review your information before registering'
      case 'complete':
        return 'Your creator account is ready to go!'
      default:
        return 'Start your creator journey today'
    }
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="flex items-center gap-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
      </div>

      {/* Title and Description */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Crown className="h-6 w-6" />
          {getStepTitle()}
        </h1>
        <p className="text-muted-foreground text-sm">
          {getStepDescription()}
        </p>
      </div>
    </div>
  )
}

/**
 * Onboarding Progress Component
 *
 * Visual progress indicator for the onboarding steps
 */
function OnboardingProgress({
  currentStep,
  onStepClick,
  registrationComplete
}: {
  currentStep: OnboardingStep
  onStepClick: (step: OnboardingStep) => void
  registrationComplete: boolean
}) {
  const steps = [
    { id: 'welcome' as OnboardingStep, label: 'Welcome', icon: Sparkles },
    { id: 'wallet' as OnboardingStep, label: 'Wallet', icon: Wallet },
    { id: 'profile' as OnboardingStep, label: 'Profile', icon: User },
    { id: 'verify' as OnboardingStep, label: 'Verify', icon: CheckCircle },
    { id: 'complete' as OnboardingStep, label: 'Complete', icon: CheckCircle }
  ]

  const currentIndex = steps.findIndex(step => step.id === currentStep)
  const progressPercentage = registrationComplete ? 100 : (currentIndex / (steps.length - 1)) * 100

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = registrationComplete || index < currentIndex
          const isCurrent = index === currentIndex && !registrationComplete
          const isClickable = index <= currentIndex || registrationComplete

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => isClickable && onStepClick(step.id)}
                  className={cn(
                    "h-10 w-10 rounded-full p-0",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary/20 border-2 border-primary",
                    !isClickable && "cursor-not-allowed opacity-50"
                  )}
                  disabled={!isClickable}
                >
                  <step.icon className="h-4 w-4" />
                </Button>
                <span className={cn(
                  "text-xs mt-1 text-center",
                  isCurrent && "font-medium text-primary",
                  !isClickable && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 mt-[-20px]",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Onboarding Steps Component
 *
 * Multi-step form content with mobile optimization
 */
function OnboardingSteps({
  onboardingState,
  onNextStep,
  onPrevStep,
  onProfileUpdate,
  onCompleteRegistration,
  userAddress
}: {
  onboardingState: OnboardingState
  onNextStep: () => void
  onPrevStep: () => void
  onProfileUpdate: (field: keyof ProfileData, value: ProfileUpdateValue) => void
  onCompleteRegistration: () => void
  userAddress: `0x${string}`
}) {
  switch (onboardingState.currentStep) {
    case 'welcome':
      return (
        <WelcomeStep onNextStep={onNextStep} />
      )
    case 'wallet':
      return (
        <WalletStep
          userAddress={userAddress}
          onNextStep={onNextStep}
          onPrevStep={onPrevStep}
        />
      )
    case 'profile':
      return (
        <ProfileStep
          profileData={onboardingState.profileData}
          onProfileUpdate={onProfileUpdate}
          onNextStep={onNextStep}
          onPrevStep={onPrevStep}
        />
      )
    case 'verify':
      return (
        <VerifyStep
          onboardingState={onboardingState}
          userAddress={userAddress}
          onPrevStep={onPrevStep}
          onCompleteRegistration={onCompleteRegistration}
        />
      )
    case 'complete':
      return (
        <CompleteStep />
      )
    default:
      return null
  }
}

/**
 * Welcome Step Component
 *
 * Introductory step with creator benefits
 */
function WelcomeStep({ onNextStep }: { onNextStep: () => void }) {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Rocket className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">Welcome to Creator Hub!</h2>
            <p className="text-muted-foreground">
              Join thousands of creators who are building the future of content monetization
              on the blockchain. Start earning from your expertise today.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-left">
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">Direct Monetization</div>
                <div className="text-xs text-muted-foreground">Earn USDC instantly from your content</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Build Your Community</div>
                <div className="text-xs text-muted-foreground">Connect with fans who value your work</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium text-sm">Web3 Native</div>
                <div className="text-xs text-muted-foreground">Own your content and audience forever</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onNextStep} className="w-full" size="lg">
        Get Started
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}

/**
 * Wallet Step Component
 *
 * Wallet verification and connection step
 */
function WalletStep({
  userAddress,
  onNextStep,
  onPrevStep
}: {
  userAddress: `0x${string}`
  onNextStep: () => void
  onPrevStep: () => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <div className="font-medium text-sm text-green-800">Wallet Verified</div>
              <div className="text-xs text-green-700">{formatAddress(userAddress)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">What happens next?</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Your wallet will be registered as a creator</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>You'll receive a creator profile on the blockchain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>You can start uploading and monetizing content immediately</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrevStep} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button onClick={onNextStep} className="flex-1">
          Continue
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Profile Step Component
 *
 * Creator profile setup form
 */
function ProfileStep({
  profileData,
  onProfileUpdate,
  onNextStep,
  onPrevStep
}: {
  profileData: ProfileData
  onProfileUpdate: (field: keyof ProfileData, value: ProfileUpdateValue) => void
  onNextStep: () => void
  onPrevStep: () => void
}) {
  const expertiseOptions = [
    'Web3', 'Blockchain', 'DeFi', 'NFTs', 'Smart Contracts',
    'Content Creation', 'Education', 'Technology', 'Art', 'Music'
  ]

  const handleExpertiseToggle = useCallback((expertise: string) => {
    const current = profileData.expertise
    const updated = current.includes(expertise)
      ? current.filter(e => e !== expertise)
      : [...current, expertise]
    onProfileUpdate('expertise', updated)
  }, [profileData.expertise, onProfileUpdate])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Creator Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Your creator name"
              value={profileData.displayName}
              onChange={(e) => onProfileUpdate('displayName', e.target.value)}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your expertise..."
              value={profileData.bio}
              onChange={(e) => onProfileUpdate('bio', e.target.value)}
              rows={3}
            />
          </div>

          {/* Expertise */}
          <div className="space-y-2">
            <Label>Expertise (Select up to 3)</Label>
            <div className="grid grid-cols-2 gap-2">
              {expertiseOptions.map((expertise) => (
                <Button
                  key={expertise}
                  variant={profileData.expertise.includes(expertise) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleExpertiseToggle(expertise)}
                  disabled={profileData.expertise.length >= 3 && !profileData.expertise.includes(expertise)}
                  className="text-xs"
                >
                  {expertise}
                </Button>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <Label>Social Links (Optional)</Label>
            <Input
              placeholder="Twitter handle (e.g., @username)"
              value={profileData.socialLinks.twitter || ''}
              onChange={(e) => onProfileUpdate('socialLinks', {
                ...profileData.socialLinks,
                twitter: e.target.value
              })}
            />
            <Input
              placeholder="Website URL"
              value={profileData.socialLinks.website || ''}
              onChange={(e) => onProfileUpdate('socialLinks', {
                ...profileData.socialLinks,
                website: e.target.value
              })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrevStep} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNextStep}
          disabled={!profileData.displayName.trim() || !profileData.bio.trim()}
          className="flex-1"
        >
          Continue
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Verify Step Component
 *
 * Review and confirmation step
 */
function VerifyStep({
  onboardingState,
  userAddress,
  onPrevStep,
  onCompleteRegistration
}: {
  onboardingState: OnboardingState
  userAddress: `0x${string}`
  onPrevStep: () => void
  onCompleteRegistration: () => void
}) {
  const { profileData, isSubmitting } = onboardingState

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Review Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Wallet Address</Label>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-mono text-sm">{formatAddress(userAddress)}</div>
            </div>
          </div>

          {/* Profile */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Creator Profile</Label>
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="font-medium">{profileData.displayName}</div>
              <div className="text-sm text-muted-foreground">{profileData.bio}</div>
              <div className="flex flex-wrap gap-1">
                {profileData.expertise.map((expertise) => (
                  <Badge key={expertise} variant="secondary" className="text-xs">
                    {expertise}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Terms */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              By registering as a creator, you agree to our terms of service and
              community guidelines. Your creator profile will be permanently
              recorded on the blockchain.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrevStep} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onCompleteRegistration}
          disabled={isSubmitting}
          className="flex-1"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              Complete Registration
              <Crown className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Complete Step Component
 *
 * Success celebration and next steps
 */
function CompleteStep() {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-800">Welcome to Creator Hub!</h2>
            <p className="text-green-700">
              Your creator account has been successfully registered on the blockchain.
              You're now ready to start creating and monetizing content!
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
              <Upload className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-sm text-green-800">Upload Content</div>
                <div className="text-xs text-green-700">Start creating and sharing</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-sm text-green-800">Set Prices</div>
                <div className="text-xs text-green-700">Monetize your expertise</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="font-medium text-sm text-green-800">Build Community</div>
                <div className="text-xs text-green-700">Connect with your audience</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Redirecting to your creator dashboard...
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * Creator Benefits Preview Component
 *
 * Showcases the benefits of becoming a creator
 */
function CreatorBenefitsPreview() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn USDC Instantly',
      description: 'Get paid directly in stablecoins with instant settlements'
    },
    {
      icon: Users,
      title: 'Build Your Community',
      description: 'Own your audience and relationship data forever'
    },
    {
      icon: TrendingUp,
      title: 'Track Performance',
      description: 'Detailed analytics and insights for your content'
    },
    {
      icon: Heart,
      title: 'Direct Fan Support',
      description: 'Receive tips and support from your most dedicated fans'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Creator Benefits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <benefit.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-sm">{benefit.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error Fallback Component
 */
function OnboardingErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Onboarding Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error during onboarding. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={resetErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mini'}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Loading Skeleton Component
 */
function OnboardingLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        <Skeleton className="h-20 w-full" />

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp Creator Onboarding Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppCreatorOnboardingPage() {
  return (
    <ErrorBoundary
      FallbackComponent={OnboardingErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Creator Onboarding error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<OnboardingLoadingSkeleton />}>
        <MiniAppCreatorOnboardingCore />
      </Suspense>
    </ErrorBoundary>
  )
}
