/**
 * ResponsiveNavigation Component - Component 8.2: Advanced Navigation System
 * File: src/components/layout/ResponsiveNavigation.tsx
 * 
 * This component builds upon AppLayout to provide sophisticated navigation patterns
 * that Web3 applications require. Unlike traditional web apps, Web3 platforms need
 * navigation systems that understand and respond to blockchain state, transaction
 * progress, and complex multi-step user workflows.
 * 
 * Key Features:
 * - Context-sensitive navigation that adapts to current user workflow
 * - Breadcrumb navigation for complex multi-step processes
 * - Mobile-optimized bottom navigation for Web3 mobile usage patterns
 * - Navigation state persistence across blockchain interactions
 * - Progress indication for multi-transaction workflows
 * - Deep linking support with blockchain state validation
 * - Navigation analytics for user flow optimization
 * 
 * This component demonstrates how sophisticated Web3 applications coordinate
 * navigation across complex user journeys while maintaining state consistency
 * and providing clear user orientation throughout blockchain interactions.
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ChevronRight,
  Home,
  ArrowLeft,
  Compass,
  Upload,
  BarChart3,
  User,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import {
  Button,
  Card,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Progress
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import our architectural layers for navigation logic
import {
  useIsCreatorRegistered
} from '@/hooks/contracts/core'
import { type UserRole, type NavigationItem } from '@/components/layout/AppLayout'

/**
 * Navigation Context Types
 * 
 * These types define different navigation contexts that require
 * different navigation patterns and user guidance.
 */
type NavigationContext = 
  | 'home'
  | 'browse'
  | 'content_creation'
  | 'content_consumption'
  | 'creator_dashboard'
  | 'user_profile'
  | 'transaction_flow'
  | 'onboarding'

/**
 * Workflow Step Interface
 * 
 * Defines individual steps in multi-step workflows that require
 * clear navigation and progress indication.
 */
interface WorkflowStep {
  readonly id: string
  readonly label: string
  readonly status: 'pending' | 'active' | 'completed' | 'error'
  readonly href?: string
  readonly description?: string
  readonly estimatedTime?: string
}

/**
 * Breadcrumb Item Interface
 * 
 * Defines breadcrumb navigation items with Web3-specific features
 * like transaction state awareness and blockchain validation.
 */
interface BreadcrumbNavItem {
  readonly label: string
  readonly href: string
  readonly isActive?: boolean
  readonly isAccessible?: boolean
  readonly requiresWallet?: boolean
  readonly requiresCreator?: boolean
  readonly icon?: React.ComponentType<{ className?: string }>
}

/**
 * Navigation Context State
 * 
 * Tracks the current navigation context and associated state for
 * providing appropriate navigation patterns and user guidance.
 */
interface NavigationContextState {
  readonly context: NavigationContext
  readonly workflow?: {
    readonly name: string
    readonly steps: readonly WorkflowStep[]
    readonly currentStep: number
    readonly canNavigateBack: boolean
    readonly canNavigateForward: boolean
  }
  readonly breadcrumbs: readonly BreadcrumbNavItem[]
  readonly showProgressIndicator: boolean
  readonly mobileNavStyle: 'tabs' | 'bottom' | 'drawer'
}

/**
 * Props interface for the ResponsiveNavigation component
 */
interface ResponsiveNavigationProps {
  /** Current user role from AppLayout */
  userRole: UserRole
  /** Whether mobile navigation should be shown */
  showMobileNav?: boolean
  /** Custom navigation items to include */
  additionalNavItems?: readonly NavigationItem[]
  /** Callback when navigation context changes */
  onContextChange?: (context: NavigationContext) => void
  /** Whether to show workflow progress indicators */
  showWorkflowProgress?: boolean
}

/**
 * ResponsiveNavigation Component
 * 
 * This component demonstrates how Web3 applications require navigation
 * systems that understand blockchain workflows and provide appropriate
 * guidance throughout complex user journeys. It builds upon the basic
 * navigation provided by AppLayout with context-aware enhancements.
 */
export function ResponsiveNavigation({
  userRole,
  showMobileNav = true,
  additionalNavItems = [],
  onContextChange,
  showWorkflowProgress = true
}: ResponsiveNavigationProps) {
  // Navigation state and routing
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Memoize search params to prevent infinite re-renders
  const memoizedSearchParams = useMemo(() => {
    return {
      flow: searchParams.get('flow'),
      toString: () => searchParams.toString()
    }
  }, [searchParams.toString()])
  
  const { address, isConnected } = useAccount()

  // Creator status for navigation personalization
  const creatorRegistration = useIsCreatorRegistered(address)

  // Navigation context state management
  const [contextState, setContextState] = useState<NavigationContextState>({
    context: 'home',
    breadcrumbs: [],
    showProgressIndicator: false,
    mobileNavStyle: 'tabs'
  })

  // Determine current navigation context based on pathname
  const currentContext: NavigationContext = useMemo(() => {
    if (pathname === '/') return 'home'
    if (pathname.startsWith('/browse')) return 'browse'
    if (pathname.startsWith('/upload') || pathname.startsWith('/create')) return 'content_creation'
    if (pathname.startsWith('/content/')) return 'content_consumption'
    if (pathname.startsWith('/dashboard')) return 'creator_dashboard'
    if (pathname.startsWith('/profile')) return 'user_profile'
    if (pathname.startsWith('/onboard')) return 'onboarding'
    if (memoizedSearchParams.flow === 'transaction') return 'transaction_flow'
    return 'home'
  }, [pathname, memoizedSearchParams])

  // Generate breadcrumb navigation based on current context
  const breadcrumbs: readonly BreadcrumbNavItem[] = useMemo(() => {
    const baseBreadcrumbs: BreadcrumbNavItem[] = [
      { label: 'Home', href: '/', icon: Home }
    ]

    switch (currentContext) {
      case 'browse':
        baseBreadcrumbs.push({ label: 'Browse Content', href: '/browse', icon: Compass })
        break

      case 'content_creation':
        baseBreadcrumbs.push(
          { label: 'Creator Dashboard', href: '/dashboard', requiresCreator: true, icon: BarChart3 },
          { label: 'Upload Content', href: '/upload', requiresCreator: true, icon: Upload }
        )
        break

      case 'content_consumption':
        const contentId = pathname.split('/').pop()
        baseBreadcrumbs.push(
          { label: 'Browse Content', href: '/browse', icon: Compass },
          { label: `Content ${contentId}`, href: pathname, requiresWallet: true }
        )
        break

      case 'creator_dashboard':
        baseBreadcrumbs.push(
          { label: 'Creator Dashboard', href: '/dashboard', requiresCreator: true, icon: BarChart3 }
        )
        break

      case 'onboarding':
        baseBreadcrumbs.push(
          { label: 'Getting Started', href: '/onboard', requiresWallet: true }
        )
        break

      default:
        break
    }

    return baseBreadcrumbs
  }, [currentContext, pathname])

  // Determine workflow state for multi-step processes
  const workflowState = useMemo(() => {
    // Content creation workflow example
    if (currentContext === 'content_creation') {
      const steps: WorkflowStep[] = [
        {
          id: 'creator_check',
          label: 'Creator Verification',
          status: creatorRegistration.data ? 'completed' : 'active',
          description: 'Verify creator registration status'
        },
        {
          id: 'content_upload',
          label: 'Upload Content',
          status: creatorRegistration.data ? 'active' : 'pending',
          description: 'Upload your content to IPFS'
        },
        {
          id: 'metadata_setup',
          label: 'Set Metadata',
          status: 'pending',
          description: 'Configure title, description, and pricing'
        },
        {
          id: 'blockchain_registration',
          label: 'Blockchain Registration',
          status: 'pending',
          description: 'Register content on blockchain',
          estimatedTime: '~2 minutes'
        }
      ]

      return {
        name: 'Content Creation',
        steps,
        currentStep: steps.findIndex(step => step.status === 'active'),
        canNavigateBack: true,
        canNavigateForward: creatorRegistration.data || false
      }
    }

    // Onboarding workflow example
    if (currentContext === 'onboarding') {
      const steps: WorkflowStep[] = [
        {
          id: 'wallet_connect',
          label: 'Connect Wallet',
          status: isConnected ? 'completed' : 'active',
          description: 'Connect your wallet to get started'
        },
        {
          id: 'role_selection',
          label: 'Choose Role',
          status: isConnected ? 'active' : 'pending',
          description: 'Are you a creator or consumer?'
        },
        {
          id: 'profile_setup',
          label: 'Setup Profile',
          status: 'pending',
          description: 'Complete your profile information'
        }
      ]

      return {
        name: 'Platform Onboarding',
        steps,
        currentStep: steps.findIndex(step => step.status === 'active'),
        canNavigateBack: false,
        canNavigateForward: isConnected
      }
    }

    return undefined
  }, [currentContext, creatorRegistration.data, isConnected])

  // Update context state when dependencies change
  useEffect(() => {
    const newContextState: NavigationContextState = {
      context: currentContext,
      workflow: workflowState,
      breadcrumbs,
      showProgressIndicator: !!workflowState && showWorkflowProgress,
      mobileNavStyle: currentContext === 'content_creation' ? 'bottom' : 'tabs'
    }

    setContextState(newContextState)
    onContextChange?.(currentContext)
  }, [currentContext, workflowState, breadcrumbs, showWorkflowProgress, onContextChange])

  // Navigation action handlers
  const handleBreadcrumbClick = useCallback((item: BreadcrumbNavItem) => {
    // Check access requirements before navigation
    if (item.requiresWallet && !isConnected) {
      // Could trigger wallet connection modal here
      return
    }
    
    if (item.requiresCreator && !creatorRegistration.data) {
      // Could redirect to creator registration
      return
    }

    router.push(item.href)
  }, [isConnected, creatorRegistration.data, router])

  const handleWorkflowNavigation = useCallback((direction: 'back' | 'forward') => {
    if (!workflowState) return

    const { steps, currentStep } = workflowState
    
    if (direction === 'back' && currentStep > 0 && workflowState.canNavigateBack) {
      const previousStep = steps[currentStep - 1]
      if (previousStep.href) {
        router.push(previousStep.href)
      }
    }
    
    if (direction === 'forward' && currentStep < steps.length - 1 && workflowState.canNavigateForward) {
      const nextStep = steps[currentStep + 1]
      if (nextStep.href) {
        router.push(nextStep.href)
      }
    }
  }, [workflowState, router])

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 1 && (
        <BreadcrumbNavigation
          items={breadcrumbs}
          onItemClick={handleBreadcrumbClick}
        />
      )}

      {/* Workflow Progress Indicator */}
      {contextState.showProgressIndicator && workflowState && (
        <WorkflowProgressIndicator
          workflow={workflowState}
          onNavigate={handleWorkflowNavigation}
        />
      )}

      {/* Mobile Navigation */}
      {showMobileNav && (
        <MobileNavigation
          userRole={userRole}
          context={currentContext}
          style={contextState.mobileNavStyle}
          additionalItems={additionalNavItems}
        />
      )}

      {/* Context-specific navigation helpers */}
      <ContextualNavigationHelpers context={currentContext} userRole={userRole} />
    </div>
  )
}

/**
 * Breadcrumb Navigation Component
 * 
 * Provides hierarchical navigation with access control awareness.
 */
interface BreadcrumbNavigationProps {
  items: readonly BreadcrumbNavItem[]
  onItemClick: (item: BreadcrumbNavItem) => void
}

function BreadcrumbNavigation({ items, onItemClick }: BreadcrumbNavigationProps) {
  return (
    <Card className="p-3">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {index === items.length - 1 ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={() => onItemClick(item)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      !item.isAccessible && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </Card>
  )
}

/**
 * Workflow Progress Indicator Component
 * 
 * Shows progress through multi-step workflows with navigation controls.
 */
interface WorkflowProgressIndicatorProps {
  workflow: NonNullable<NavigationContextState['workflow']>
  onNavigate: (direction: 'back' | 'forward') => void
}

function WorkflowProgressIndicator({ workflow, onNavigate }: WorkflowProgressIndicatorProps) {
  const completedSteps = workflow.steps.filter(step => step.status === 'completed').length
  const totalSteps = workflow.steps.length
  const progressPercentage = (completedSteps / totalSteps) * 100

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Workflow Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{workflow.name}</h3>
            <p className="text-sm text-muted-foreground">
              Step {workflow.currentStep + 1} of {totalSteps}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('back')}
              disabled={!workflow.canNavigateBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('forward')}
              disabled={!workflow.canNavigateForward}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedSteps} completed</span>
            <span>{totalSteps - completedSteps} remaining</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex gap-2 overflow-x-auto">
          {workflow.steps.map((step, index) => (
            <WorkflowStepIndicator
              key={step.id}
              step={step}
              isActive={index === workflow.currentStep}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

/**
 * Individual Workflow Step Indicator
 */
interface WorkflowStepIndicatorProps {
  step: WorkflowStep
  isActive: boolean
}

function WorkflowStepIndicator({ step, isActive }: WorkflowStepIndicatorProps) {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />
    }
  }

  return (
    <div className={cn(
      "flex-shrink-0 p-3 rounded-lg border min-w-[120px]",
      isActive && "border-primary bg-primary/5"
    )}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">{step.label}</span>
      </div>
      {step.description && (
        <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
      )}
      {step.estimatedTime && step.status === 'active' && (
        <p className="text-xs text-primary mt-1">{step.estimatedTime}</p>
      )}
    </div>
  )
}

/**
 * Mobile Navigation Component
 * 
 * Provides mobile-optimized navigation patterns based on context.
 */
interface MobileNavigationProps {
  userRole: UserRole
  context: NavigationContext
  style: 'tabs' | 'bottom' | 'drawer'
  additionalItems: readonly NavigationItem[]
}

function MobileNavigation({ userRole, context, style }: MobileNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Define mobile navigation items based on user role
  const mobileNavItems = useMemo(() => {
    const baseItems = [
      { label: 'Home', href: '/', icon: Home },
      { label: 'Browse', href: '/browse', icon: Compass }
    ]

    if (userRole === 'creator') {
      baseItems.push(
        { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { label: 'Upload', href: '/upload', icon: Upload }
      )
    }

    baseItems.push({ label: 'Profile', href: '/profile', icon: User })

    return baseItems
  }, [userRole])

  // Only show on mobile screens
  if (style === 'bottom') {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="flex">
          {mobileNavItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className="flex-1 flex-col h-16 rounded-none"
              onClick={() => router.push(item.href)}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return null
}

/**
 * Contextual Navigation Helpers Component
 * 
 * Provides context-specific navigation assistance and shortcuts.
 */
interface ContextualNavigationHelpersProps {
  context: NavigationContext
  userRole: UserRole
}

function ContextualNavigationHelpers({ context, userRole }: ContextualNavigationHelpersProps) {
  if (context === 'content_creation' && userRole === 'creator') {
    return (
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Content Creation Tips</h4>
            <p className="text-sm text-blue-700 mt-1">
              Make sure your content is uploaded to IPFS before registering on the blockchain. 
              This ensures your content remains accessible to purchasers.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (context === 'onboarding' && userRole === 'disconnected') {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <Wallet className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Getting Started</h4>
            <p className="text-sm text-green-700 mt-1">
              Connect your wallet to access the full features of the platform. 
              You can browse content without a wallet, but purchasing requires connection.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return null
}

/**
 * Export type definitions for use in other navigation components
 */
export type { 
  NavigationContext, 
  WorkflowStep, 
  BreadcrumbNavItem, 
  NavigationContextState,
  ResponsiveNavigationProps 
}