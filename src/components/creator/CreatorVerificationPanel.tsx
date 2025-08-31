/**
 * Creator Verification Panel Component
 * File: src/components/creator/CreatorVerificationPanel.tsx
 * 
 * This component provides a comprehensive verification interface for creators,
 * guiding them through the verification process from eligibility checking
 * through application submission and status tracking. It demonstrates how
 * complex workflows can be transformed into intuitive step-by-step experiences.
 * 
 * The component handles multiple verification states and provides clear guidance
 * at each step, following your platform's established UI patterns while delivering
 * a professional verification experience that builds creator trust and platform credibility.
 * 
 * Key Features:
 * - Real-time eligibility checking with progress indicators
 * - Step-by-step verification application workflow
 * - Document upload and identity verification management
 * - Application status tracking with clear feedback
 * - Benefits explanation to motivate verification
 * - Integration with existing creator dashboard patterns
 * - Responsive design optimized for creator workflows
 * - Comprehensive error handling and guidance
 * 
 * Architecture Integration:
 * - Uses the useCreatorVerification hook for all verification logic
 * - Follows established form patterns from CreatorProfileEditor
 * - Integrates with your existing UI component library
 * - Maintains consistency with other creator management interfaces
 * - Provides seamless navigation integration for creator dashboard
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Award,
  FileText,
  User,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  MessageSquare,
  Info,
  ArrowRight,
  Loader2,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Zap,
  Crown,
  BadgeCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Import our verification hook and related types
import { 
  useCreatorVerification, 
  type VerificationData,
  type VerificationEligibility,
  type VerificationApplicationStatus,
} from '@/hooks/contracts/creator/useCreatorVerification'

// Import utility functions
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

// ===== VERIFICATION PANEL INTERFACES =====

/**
 * Verification Step Interface
 * This defines each step in the verification process
 */
interface VerificationStep {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly completed: boolean
  readonly current: boolean
  readonly icon: React.ComponentType<{ className?: string }>
}

/**
 * Social Platform Configuration
 * This defines the social platforms creators can link for verification
 */
interface SocialPlatform {
  readonly id: keyof VerificationData['socialLinks']
  readonly name: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly placeholder: string
  readonly baseUrl: string
  readonly required: boolean
}

// ===== CONFIGURATION CONSTANTS =====

/**
 * Social Media Platforms Configuration
 */
const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    placeholder: '@username or full URL',
    baseUrl: 'https://twitter.com/',
    required: false
  },
  {
    id: 'instagram', 
    name: 'Instagram',
    icon: Instagram,
    placeholder: '@username or full URL',
    baseUrl: 'https://instagram.com/',
    required: false
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    placeholder: 'Channel URL or @handle',
    baseUrl: 'https://youtube.com/',
    required: false
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'Profile URL',
    baseUrl: 'https://linkedin.com/in/',
    required: false
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: MessageSquare,
    placeholder: 'Discord username#0000',
    baseUrl: '',
    required: false
  }
] as const

/**
 * Verification Benefits Configuration
 */
const VERIFICATION_BENEFITS = [
  {
    icon: BadgeCheck,
    title: 'Verification Badge',
    description: 'Display a verified badge on your profile and content'
  },
  {
    icon: TrendingUp,
    title: 'Higher Visibility',
    description: 'Verified creators appear higher in search and recommendations'
  },
  {
    icon: Crown,
    title: 'Priority Support',
    description: 'Get faster response times for customer support inquiries'
  },
  {
    icon: Eye,
    title: 'Creator Analytics',
    description: 'Access detailed analytics about your content and audience'
  },
  {
    icon: Users,
    title: 'Creator Community',
    description: 'Join exclusive verified creator Discord and networking events'
  },
  {
    icon: Zap,
    title: 'Early Access',
    description: 'Be first to try new platform features and monetization tools'
  }
] as const

// ===== MAIN COMPONENT =====

/**
 * Creator Verification Panel Props
 */
interface CreatorVerificationPanelProps {
  /** Optional creator address to check verification for */
  creatorAddress?: `0x${string}`
  /** Optional callback when verification status changes */
  onVerificationChange?: (isVerified: boolean) => void
  /** Custom styling classes */
  className?: string
}

/**
 * Creator Verification Panel Component
 * 
 * This component orchestrates the complete verification experience for creators,
 * adapting the interface based on their current verification status and eligibility.
 */
export function CreatorVerificationPanel({
  creatorAddress,
  onVerificationChange,
  className
}: CreatorVerificationPanelProps) {
  const walletUI = useWalletConnectionUI()
  const targetAddress = creatorAddress || walletUI.address

  // Get verification data and functionality from our hook
  const {
    verificationStatus,
    verificationEligibility,
    applicationStatus,
    applicationData,
    initializeApplication,
    updateApplicationData,
    submitApplication,
    isSubmittingApplication,
    applicationError,
    refreshVerificationData,
    isLoading,
    error
  } = useCreatorVerification(targetAddress as `0x${string}`)

  // Local state for UI management
  const [currentStep, setCurrentStep] = useState<string>('status')
  const [showBenefits, setShowBenefits] = useState(false)

  // Notify parent of verification changes
  useEffect(() => {
    onVerificationChange?.(verificationStatus.isVerified)
  }, [verificationStatus.isVerified, onVerificationChange])

  // ===== VERIFICATION STEPS CONFIGURATION =====

  /**
   * Generate verification steps based on current status
   */
  const verificationSteps = useMemo<readonly VerificationStep[]>(() => {
    const steps: VerificationStep[] = [
      {
        id: 'status',
        title: 'Verification Status',
        description: 'Check your current verification status and eligibility',
        completed: false,
        current: currentStep === 'status',
        icon: Shield
      }
    ]

    if (verificationStatus.isVerified) {
      steps.push({
        id: 'verified',
        title: 'Verified Creator',
        description: 'You are a verified creator with full platform benefits',
        completed: true,
        current: false,
        icon: CheckCircle
      })
    } else if (verificationStatus.canApply) {
      steps.push(
        {
          id: 'requirements',
          title: 'Requirements Check',
          description: 'Review and meet all verification requirements',
          completed: verificationEligibility.isEligible,
          current: currentStep === 'requirements',
          icon: Star
        },
        {
          id: 'application',
          title: 'Submit Application',
          description: 'Complete and submit your verification application',
          completed: applicationStatus.status === 'submitted',
          current: currentStep === 'application',
          icon: FileText
        }
      )
    } else if (verificationStatus.hasActiveApplication) {
      steps.push({
        id: 'pending',
        title: 'Under Review',
        description: 'Your application is being reviewed by our team',
        completed: false,
        current: currentStep === 'pending',
        icon: Clock
      })
    } else {
      steps.push({
        id: 'requirements',
        title: 'Meet Requirements',
        description: 'Build your profile to become eligible for verification',
        completed: false,
        current: currentStep === 'requirements',
        icon: TrendingUp
      })
    }

    return steps
  }, [verificationStatus, verificationEligibility, applicationStatus, currentStep])

  // ===== RENDER FUNCTIONS =====

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Creator Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Creator Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load verification data. Please try again.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={refreshVerificationData}
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Verification Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                verificationStatus.isVerified 
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
              )}>
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>Creator Verification</CardTitle>
                <CardDescription>{verificationStatus.statusMessage}</CardDescription>
              </div>
            </div>

            {verificationStatus.isVerified && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </CardHeader>

        {/* Verification Steps Progress */}
        <CardContent>
          <div className="space-y-4">
            {verificationSteps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    step.current 
                      ? 'border-blue-200 bg-blue-50' 
                      : step.completed 
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div className={cn(
                    'p-2 rounded-full',
                    step.completed 
                      ? 'bg-green-100 text-green-600'
                      : step.current
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </div>

                  {step.completed && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  
                  {index < verificationSteps.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Content Based on Current Step */}
      {currentStep === 'status' && (
        <VerificationStatusCard 
          verificationStatus={verificationStatus}
          onShowBenefits={() => setShowBenefits(true)}
          onNext={() => setCurrentStep('requirements')}
        />
      )}

      {currentStep === 'requirements' && (
        <RequirementsCard 
          eligibility={verificationEligibility}
          canApply={verificationStatus.canApply}
          onNext={() => {
            if (verificationStatus.canApply) {
              initializeApplication()
              setCurrentStep('application')
            }
          }}
        />
      )}

      {currentStep === 'application' && (
        <ApplicationCard
          applicationData={applicationData}
          updateApplicationData={updateApplicationData}
          submitApplication={submitApplication}
          isSubmitting={isSubmittingApplication}
          error={applicationError}
        />
      )}

      {currentStep === 'pending' && (
        <PendingApplicationCard applicationStatus={applicationStatus} />
      )}

      {currentStep === 'verified' && (
        <VerifiedCreatorCard />
      )}

      {/* Benefits Dialog */}
      <Dialog open={showBenefits} onOpenChange={setShowBenefits}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Verification Benefits
            </DialogTitle>
            <DialogDescription>
              Discover all the exclusive benefits of becoming a verified creator
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VERIFICATION_BENEFITS.map((benefit) => {
              const BenefitIcon = benefit.icon
              return (
                <div key={benefit.title} className="flex gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <BenefitIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{benefit.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {benefit.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowBenefits(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== SUB-COMPONENTS =====

/**
 * Verification Status Card Component
 */
function VerificationStatusCard({
  verificationStatus,
  onShowBenefits,
  onNext
}: {
  verificationStatus: { isVerified: boolean; canApply: boolean }
  onShowBenefits: () => void
  onNext: () => void
}) {
  if (verificationStatus.isVerified) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-full w-fit mx-auto">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">You&apos;re Verified!</h3>
              <p className="text-muted-foreground">
                Congratulations! You&apos;re a verified creator with access to all premium benefits.
              </p>
            </div>
            <Button onClick={onShowBenefits} variant="outline">
              <Crown className="h-4 w-4 mr-2" />
              View Your Benefits
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get Verified</CardTitle>
        <CardDescription>
          Build trust with your audience and unlock exclusive creator benefits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg w-fit mx-auto">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div className="font-medium">Verification Badge</div>
              <div className="text-sm text-muted-foreground">
                Show your audience you&apos;re authentic
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg w-fit mx-auto">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="font-medium">Higher Visibility</div>
              <div className="text-sm text-muted-foreground">
                Get featured in recommendations
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg w-fit mx-auto">
                <Crown className="h-6 w-6" />
              </div>
              <div className="font-medium">Exclusive Access</div>
              <div className="text-sm text-muted-foreground">
                Priority support and early features
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onNext} className="flex-1">
              {verificationStatus.canApply ? 'Start Application' : 'Check Requirements'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button onClick={onShowBenefits} variant="outline">
              <Info className="h-4 w-4 mr-2" />
              All Benefits
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Requirements Check Card Component
 */
function RequirementsCard({
  eligibility,
  canApply,
  onNext
}: {
  eligibility: VerificationEligibility
  canApply: boolean
  onNext: () => void
}) {
  const progressPercentage = useMemo(() => {
    let completed = 0
    const total = 4

    if (eligibility.meetsContentRequirement) completed++
    if (eligibility.meetsEarningsRequirement) completed++
    if (eligibility.meetsSubscriberRequirement) completed++
    if (eligibility.hasCompleteProfile) completed++

    return Math.round((completed / total) * 100)
  }, [eligibility])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Requirements</CardTitle>
        <CardDescription>
          Meet these requirements to become eligible for verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Requirements Progress</span>
              <span>{progressPercentage}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Individual Requirements */}
          <div className="space-y-4">
            <RequirementItem
              icon={FileText}
              title="Content Portfolio"
              requirement={`At least ${eligibility.requirements.minContentCount} pieces of content`}
              current={`${eligibility.requirements.currentContentCount} published`}
              completed={eligibility.meetsContentRequirement}
            />

            <RequirementItem
              icon={DollarSign}
              title="Creator Earnings"
              requirement={`At least ${formatCurrency(eligibility.requirements.minEarnings)} total earnings`}
              current={`${formatCurrency(eligibility.requirements.currentEarnings)} earned`}
              completed={eligibility.meetsEarningsRequirement}
            />

            <RequirementItem
              icon={Users}
              title="Subscriber Base"
              requirement={`At least ${eligibility.requirements.minSubscribers} subscribers`}
              current={`${eligibility.requirements.currentSubscribers} subscribers`}
              completed={eligibility.meetsSubscriberRequirement}
            />

            <RequirementItem
              icon={User}
              title="Complete Profile"
              requirement="Detailed bio and profile information"
              current={eligibility.hasCompleteProfile ? "Complete" : "Incomplete"}
              completed={eligibility.hasCompleteProfile}
            />
          </div>

          {/* Missing Requirements Alert */}
          {!eligibility.isEligible && eligibility.missingRequirements.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">To become eligible:</div>
                  {eligibility.missingRequirements.map((requirement, index) => (
                    <div key={index} className="text-sm">• {requirement}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <Button 
            onClick={onNext} 
            disabled={!canApply}
            className="w-full"
          >
            {canApply ? (
              <>
                Start Verification Application
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              'Complete Requirements to Apply'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Individual Requirement Item Component
 */
function RequirementItem({
  icon: Icon,
  title,
  requirement,
  current,
  completed
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  requirement: string
  current: string
  completed: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <div className={cn(
        'p-2 rounded-lg',
        completed 
          ? 'bg-green-100 text-green-600'
          : 'bg-gray-100 text-gray-600'
      )}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{requirement}</div>
      </div>
      
      <div className="text-right">
        <div className={cn(
          'text-sm font-medium',
          completed ? 'text-green-600' : 'text-gray-600'
        )}>
          {current}
        </div>
        {completed && (
          <CheckCircle className="h-4 w-4 text-green-600 ml-auto mt-1" />
        )}
      </div>
    </div>
  )
}

/**
 * Application Form Card Component
 */
function ApplicationCard({
  applicationData,
  updateApplicationData,
  submitApplication,
  isSubmitting,
  error
}: {
  applicationData: Partial<VerificationData> | null
  updateApplicationData: (updates: Partial<VerificationData>) => void
  submitApplication: () => Promise<string | null>
  isSubmitting: boolean
  error: string | null
}) {
  const [currentTab, setCurrentTab] = useState<'basic' | 'social' | 'verification'>('basic')

  const handleSubmit = useCallback(async () => {
    try {
      await submitApplication()
    } catch (_err) {
      // Error is handled by the hook
    }
  }, [submitApplication])

  if (!applicationData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-muted-foreground">Application not initialized</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Application</CardTitle>
        <CardDescription>
          Complete your verification application with accurate information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={(val) => setCurrentTab(val as 'basic' | 'social' | 'verification')}>
          <TabsList className="grid grid-cols-2 gap-1 sm:flex sm:gap-2 sm:overflow-x-auto sm:no-scrollbar md:grid md:w-full md:grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="social">Social Links</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={applicationData.displayName || ''}
                  onChange={(e) => updateApplicationData({ displayName: e.target.value })}
                  placeholder="Your creator name"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={applicationData.bio || ''}
                  onChange={(e) => updateApplicationData({ bio: e.target.value })}
                  placeholder="Tell us about yourself and your content..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="website">Website URL (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={applicationData.websiteUrl || ''}
                  onChange={(e) => updateApplicationData({ websiteUrl: e.target.value })}
                  placeholder="https://your-website.com"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4 mt-6">
            <div className="space-y-4">
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon
                return (
                  <div key={platform.id}>
                    <Label className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {platform.name}
                      {platform.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={applicationData.socialLinks?.[platform.id] || ''}
                      onChange={(e) => updateApplicationData({
                        socialLinks: {
                          ...applicationData.socialLinks,
                          [platform.id]: e.target.value
                        }
                      })}
                      placeholder={platform.placeholder}
                    />
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="verificationType">Verification Method</Label>
                <Select
                  value={applicationData.identityVerification?.type || 'social_media'}
                  onValueChange={(value) => updateApplicationData({
                    identityVerification: {
                      type: value as VerificationData['identityVerification']['type'],
                      proof: applicationData.identityVerification?.proof ?? '',
                      description: applicationData.identityVerification?.description ?? ''
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social_media">Social Media Profile</SelectItem>
                    <SelectItem value="website">Personal Website</SelectItem>
                    <SelectItem value="legal_document">Legal Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="verificationProof">Verification Proof URL</Label>
                <Input
                  id="verificationProof"
                  value={applicationData.identityVerification?.proof || ''}
                  onChange={(e) => updateApplicationData({
                    identityVerification: {
                      type: applicationData.identityVerification?.type ?? 'social_media',
                      description: applicationData.identityVerification?.description ?? '',
                      proof: e.target.value
                    }
                  })}
                  placeholder="https://... or IPFS hash"
                />
              </div>

              <div>
                <Label htmlFor="verificationDescription">Description</Label>
                <Textarea
                  id="verificationDescription"
                  value={applicationData.identityVerification?.description || ''}
                  onChange={(e) => updateApplicationData({
                    identityVerification: {
                      type: applicationData.identityVerification?.type ?? 'social_media',
                      proof: applicationData.identityVerification?.proof ?? '',
                      description: e.target.value
                    }
                  })}
                  placeholder="Explain how this verifies your identity..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                <Textarea
                  id="additionalNotes"
                  value={applicationData.additionalNotes || ''}
                  onChange={(e) => updateApplicationData({ additionalNotes: e.target.value })}
                  placeholder="Any additional information for the review team..."
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Pending Application Card Component
 */
function PendingApplicationCard({ applicationStatus }: { applicationStatus: VerificationApplicationStatus }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-full w-fit mx-auto">
            <Clock className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Application Under Review</h3>
            <p className="text-muted-foreground">
              We&apos;re reviewing your verification application. This typically takes 3-5 business days.
            </p>
          </div>
          
            {applicationStatus.submittedAt && (
              <div className="text-sm text-muted-foreground">
               Submitted {formatRelativeTime(
                 typeof applicationStatus.submittedAt === 'bigint'
                   ? applicationStatus.submittedAt
                   : BigInt(Math.floor(new Date(applicationStatus.submittedAt).getTime() / 1000))
               )}
              </div>
          )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You&apos;ll receive an email notification once your application has been reviewed.
              In the meantime, keep creating great content!
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Verified Creator Card Component
 */
function VerifiedCreatorCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-full w-fit mx-auto">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Congratulations!</h3>
            <p className="text-muted-foreground">
              You&apos;re now a verified creator with access to all premium benefits and features.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {VERIFICATION_BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="text-center space-y-2">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg w-fit mx-auto">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">{benefit.title}</div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}