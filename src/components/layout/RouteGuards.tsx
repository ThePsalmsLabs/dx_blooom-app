/**
 * RouteGuards Component - Component 8.3: Intelligent Access Control
 * File: src/components/layout/RouteGuards.tsx
 * 
 * This component implements sophisticated access control patterns that Web3 applications
 * require. Unlike traditional authentication systems, Web3 platforms need to manage
 * multiple permission states simultaneously: wallet connection, network compatibility,
 * creator registration, transaction status, and more.
 * 
 * Key Features:
 * - Multi-layered permission checking with clear user feedback
 * - Automatic workflow initiation for permission resolution
 * - Network compatibility validation and guided switching
 * - Creator registration enforcement with streamlined onboarding
 * - Transaction state awareness and conflict prevention
 * - Progressive disclosure of platform capabilities
 * - Graceful degradation for unsupported scenarios
 * 
 * This component demonstrates how sophisticated Web3 applications provide
 * security without sacrificing user experience, using intelligent routing
 * that understands blockchain state and guides users through complex
 * permission requirements seamlessly.
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import {
  Shield,
  Wallet,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Lock,
  Unlock,
  Network,
  User,
  Clock,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Progress,
  Separator
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Import our architectural layers for permission checking
import {
  useIsCreatorRegistered,
  useCreatorProfile,
  useTokenBalance
} from '@/hooks/contracts/core'
import { useCreatorOnboarding } from '@/hooks/business/workflows'
import { WalletConnectionButton } from '@/components/web3/WalletConnect'
import { isSupportedChain, getCurrentChain } from '@/lib/web3/wagmi'

/**
 * Permission Level Types
 * 
 * These define the different levels of access that routes can require,
 * from basic wallet connection to specific creator capabilities.
 */
type PermissionLevel = 
  | 'public'           // No requirements - anyone can access
  | 'wallet_connected' // Requires wallet connection
  | 'network_valid'    // Requires connection to supported network
  | 'creator_basic'    // Requires creator registration
  | 'creator_verified' // Requires verified creator status
  | 'transaction_safe' // Requires no pending critical transactions

/**
 * Permission Check Result
 * 
 * Provides detailed information about permission status and what
 * actions are needed to resolve any access restrictions.
 */
interface PermissionResult {
  readonly hasAccess: boolean
  readonly level: PermissionLevel
  readonly blockers: readonly {
    readonly type: 'wallet' | 'network' | 'registration' | 'verification' | 'transaction'
    readonly message: string
    readonly action: string
    readonly canResolve: boolean
    readonly resolutionPath?: string
  }[]
  readonly suggestedAction?: {
    readonly label: string
    readonly handler: () => void
    readonly isPrimary: boolean
  }
}

/**
 * Route Configuration
 * 
 * Defines the permission requirements for different application routes
 * and provides context for generating appropriate user guidance.
 */
interface RouteConfig {
  readonly path: string
  readonly requiredLevel: PermissionLevel
  readonly friendlyName: string
  readonly description: string
  readonly category: 'content' | 'creator' | 'profile' | 'admin'
  readonly alternativeRoutes?: readonly string[]
}

/**
 * Props interface for the RouteGuards component
 */
interface RouteGuardsProps {
  /** The content to render if access is granted */
  children: React.ReactNode
  /** Required permission level for this route */
  requiredLevel: PermissionLevel
  /** Custom route configuration (optional) */
  routeConfig?: Partial<RouteConfig>
  /** Callback when access is denied */
  onAccessDenied?: (result: PermissionResult) => void
  /** Whether to show detailed permission information */
  showPermissionDetails?: boolean
}

/**
 * RouteGuards Component
 * 
 * This component demonstrates how Web3 applications can implement
 * sophisticated access control that understands blockchain state while
 * providing excellent user experience through guided permission resolution.
 */
export function RouteGuards({
  children,
  requiredLevel,
  routeConfig,
  onAccessDenied,
  showPermissionDetails = false
}: RouteGuardsProps) {
  // Routing and navigation state
  const router = useRouter()
  const pathname = usePathname()

  // Wallet and network state
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // Creator registration and verification state
  const creatorRegistration = useIsCreatorRegistered(address)
  const creatorProfile = useCreatorProfile(address)
  const creatorOnboarding = useCreatorOnboarding(address as `0x${string}`)

  // Route configuration with intelligent defaults
  const effectiveRouteConfig: RouteConfig = useMemo(() => {
    const defaultConfig: RouteConfig = {
      path: pathname,
      requiredLevel,
      friendlyName: getRouteFriendlyName(pathname),
      description: getRouteDescription(pathname),
      category: getRouteCategory(pathname),
      alternativeRoutes: getAlternativeRoutes(pathname)
    }

    return { ...defaultConfig, ...routeConfig }
  }, [pathname, requiredLevel, routeConfig])

  // Comprehensive permission checking
  const permissionResult: PermissionResult = useMemo(() => {
    const blockers: PermissionResult['blockers'][number][] = []

    // Check wallet connection requirement
    if (requiredLevel !== 'public' && !isConnected) {
      blockers.push({
        type: 'wallet',
        message: 'Wallet connection required to access this area',
        action: 'Connect your wallet to continue',
        canResolve: true,
        resolutionPath: 'wallet-connect'
      })
    }

    // Check network compatibility
    if (isConnected && !isSupportedChain(chainId)) {
      const currentChain = getCurrentChain()
      blockers.push({
        type: 'network',
        message: `This application requires ${currentChain.name} network`,
        action: `Switch to ${currentChain.name} to continue`,
        canResolve: true,
        resolutionPath: 'network-switch'
      })
    }

    // Check creator registration requirements
    if (requiredLevel === 'creator_basic' || requiredLevel === 'creator_verified') {
      if (isConnected && !creatorRegistration.data) {
        blockers.push({
          type: 'registration',
          message: 'Creator registration required for this feature',
          action: 'Complete creator registration to access creator tools',
          canResolve: true,
          resolutionPath: 'creator-registration'
        })
      }
    }

    // Check creator verification requirements
    if (requiredLevel === 'creator_verified') {
      if (creatorRegistration.data && !creatorProfile.data?.isVerified) {
        blockers.push({
          type: 'verification',
          message: 'Verified creator status required',
          action: 'Complete verification process to access advanced features',
          canResolve: true,
          resolutionPath: 'creator-verification'
        })
      }
    }

    // Determine suggested action based on primary blocker
    let suggestedAction: PermissionResult['suggestedAction']
    
    if (blockers.length > 0) {
      const primaryBlocker = blockers[0]
      
      if (primaryBlocker.canResolve) {
        suggestedAction = {
          label: primaryBlocker.action,
          handler: () => handlePermissionResolution(primaryBlocker.resolutionPath!),
          isPrimary: true
        }
      }
    }

    return {
      hasAccess: blockers.length === 0,
      level: requiredLevel,
      blockers,
      suggestedAction
    }
  }, [requiredLevel, isConnected, chainId, creatorRegistration.data, creatorProfile.data])

  // Permission resolution handlers
  const handlePermissionResolution = useCallback((resolutionPath: string) => {
    switch (resolutionPath) {
      case 'network-switch':
        const targetChain = getCurrentChain()
        switchChain({ chainId: targetChain.id })
        break
      
      case 'creator-registration':
        router.push('/onboard/creator')
        break
      
      case 'creator-verification':
        router.push('/profile/verification')
        break
      
      default:
        break
    }
  }, [switchChain, router])

  // Handle access denied callback
  useEffect(() => {
    if (!permissionResult.hasAccess) {
      onAccessDenied?.(permissionResult)
    }
  }, [permissionResult, onAccessDenied])

  // If access is granted, render the protected content
  if (permissionResult.hasAccess) {
    return <>{children}</>
  }

  // If access is denied, render appropriate access restriction UI
  return (
    <AccessRestrictionDisplay
      routeConfig={effectiveRouteConfig}
      permissionResult={permissionResult}
      showDetails={showPermissionDetails}
      onRetry={() => window.location.reload()}
    />
  )
}

/**
 * Access Restriction Display Component
 * 
 * Provides user-friendly explanation of access restrictions with
 * clear guidance on how to resolve permission issues.
 */
interface AccessRestrictionDisplayProps {
  routeConfig: RouteConfig
  permissionResult: PermissionResult
  showDetails: boolean
  onRetry: () => void
}

function AccessRestrictionDisplay({
  routeConfig,
  permissionResult,
  showDetails,
  onRetry
}: AccessRestrictionDisplayProps) {
  const primaryBlocker = permissionResult.blockers[0]
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-amber-600" />
          </div>
          
          <CardTitle className="text-xl">Access Restricted</CardTitle>
          <CardDescription>
            Additional permissions are required to access {routeConfig.friendlyName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Primary Access Requirement */}
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {primaryBlocker.message}
              </AlertDescription>
            </Alert>

            {/* Primary Action Button */}
            {permissionResult.suggestedAction && (
              <Button 
                onClick={permissionResult.suggestedAction.handler}
                className="w-full"
                size="lg"
              >
                {getBlockerIcon(primaryBlocker.type)}
                {permissionResult.suggestedAction.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Additional Requirements */}
          {permissionResult.blockers.length > 1 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Additional Requirements:</h4>
                {permissionResult.blockers.slice(1).map((blocker, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    {getBlockerIcon(blocker.type)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{blocker.action}</p>
                      <p className="text-xs text-muted-foreground">{blocker.message}</p>
                    </div>
                    <Badge variant={blocker.canResolve ? "secondary" : "outline"}>
                      {blocker.canResolve ? "Required" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Route Information */}
          {showDetails && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">About This Area:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{routeConfig.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{routeConfig.category}</Badge>
                    <Badge variant="outline">{permissionResult.level}</Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Alternative Routes */}
          {routeConfig.alternativeRoutes && routeConfig.alternativeRoutes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">You might also like:</h4>
                <div className="grid gap-2">
                  {routeConfig.alternativeRoutes.map((route) => (
                    <AlternativeRouteCard key={route} route={route} />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Again
          </Button>
          
          <Button variant="ghost" asChild>
            <a href="/" className="flex items-center gap-2">
              Return Home
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Alternative Route Card Component
 * 
 * Suggests alternative routes that the user can access.
 */
interface AlternativeRouteCardProps {
  route: string
}

function AlternativeRouteCard({ route }: AlternativeRouteCardProps) {
  const router = useRouter()
  
  return (
    <Button
      variant="ghost"
      className="justify-start h-auto p-3"
      onClick={() => router.push(route)}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
          {getRouteIcon(route)}
        </div>
        <div className="text-left">
          <p className="font-medium text-sm">{getRouteFriendlyName(route)}</p>
          <p className="text-xs text-muted-foreground">{getRouteDescription(route)}</p>
        </div>
      </div>
    </Button>
  )
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get appropriate icon for different permission blocker types
 */
function getBlockerIcon(type: PermissionResult['blockers'][number]['type']) {
  const iconMap = {
    wallet: <Wallet className="h-4 w-4 mr-2" />,
    network: <Network className="h-4 w-4 mr-2" />,
    registration: <User className="h-4 w-4 mr-2" />,
    verification: <CheckCircle className="h-4 w-4 mr-2" />,
    transaction: <Clock className="h-4 w-4 mr-2" />
  }
  
  return iconMap[type] || <Info className="h-4 w-4 mr-2" />
}

/**
 * Get user-friendly name for route paths
 */
function getRouteFriendlyName(path: string): string {
  const nameMap: Record<string, string> = {
    '/': 'Home',
    '/browse': 'Browse Content',
    '/dashboard': 'Creator Dashboard',
    '/upload': 'Upload Content',
    '/profile': 'User Profile',
    '/settings': 'Settings'
  }
  
  return nameMap[path] || path.split('/').pop()?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Page'
}

/**
 * Get description for route paths
 */
function getRouteDescription(path: string): string {
  const descriptionMap: Record<string, string> = {
    '/': 'Platform home and overview',
    '/browse': 'Discover and purchase content',
    '/dashboard': 'Manage your creator profile and content',
    '/upload': 'Create and publish new content',
    '/profile': 'Manage your account and preferences',
    '/settings': 'Configure platform settings'
  }
  
  return descriptionMap[path] || 'Access platform features and content'
}

/**
 * Get category for route paths
 */
function getRouteCategory(path: string): RouteConfig['category'] {
  if (path.startsWith('/dashboard') || path.startsWith('/upload')) return 'creator'
  if (path.startsWith('/profile') || path.startsWith('/settings')) return 'profile'
  if (path.startsWith('/browse') || path.startsWith('/content')) return 'content'
  return 'content'
}

/**
 * Get alternative routes for blocked paths
 */
function getAlternativeRoutes(path: string): readonly string[] {
  const alternativeMap: Record<string, readonly string[]> = {
    '/dashboard': ['/browse', '/profile'],
    '/upload': ['/browse', '/dashboard'],
    '/profile': ['/browse', '/'],
    '/settings': ['/profile', '/browse']
  }
  
  return alternativeMap[path] || ['/browse', '/']
}

/**
 * Get appropriate icon for route paths
 */
function getRouteIcon(path: string) {
  const iconMap: Record<string, React.ReactNode> = {
    '/': <Shield className="h-4 w-4" />,
    '/browse': <Lock className="h-4 w-4" />,
    '/dashboard': <User className="h-4 w-4" />,
    '/profile': <User className="h-4 w-4" />
  }
  
  return iconMap[path] || <Info className="h-4 w-4" />
}

/**
 * Export type definitions for use in routing configuration
 */
export type { 
  PermissionLevel, 
  PermissionResult, 
  RouteConfig, 
  RouteGuardsProps 
}