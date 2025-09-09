/**
 * Enhanced Authentication Status Component
 * File: src/components/miniapp/auth/EnhancedAuthStatus.tsx
 * 
 * This component provides a comprehensive authentication status display that shows:
 * - Wallet connection status
 * - Farcaster authentication status  
 * - User profile information
 * - Authentication method clarity
 * - Quick actions for connecting/disconnecting
 */

'use client'

import React, { useMemo } from 'react'
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar'
import { 
  Badge 
} from '@/components/ui/badge'
import { 
  Button 
} from '@/components/ui/button'
import {
  Card,
  CardContent
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Wallet,
  Shield,
  Users,
  LogOut,
  Settings,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMiniAppAuth } from '@/hooks/business/miniapp-auth'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'

interface EnhancedAuthStatusProps {
  variant?: 'compact' | 'full' | 'minimal'
  showActions?: boolean
  className?: string
}

type AuthenticationState = {
  type: 'disconnected' | 'wallet-only' | 'farcaster-verified' | 'farcaster-connected' | 'loading' | 'error'
  displayName: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive'
  badgeText: string
  statusColor: string
}

export function EnhancedAuthStatus({ 
  variant = 'full', 
  showActions = true,
  className 
}: EnhancedAuthStatusProps) {
  const walletUI = useMiniAppWalletUI()
  const miniAppAuth = useMiniAppAuth()

  // Determine authentication state and display configuration
  const authState: AuthenticationState = useMemo(() => {
    // Loading states
    if (walletUI.isConnecting || miniAppAuth.isLoading) {
      return {
        type: 'loading',
        displayName: 'Connecting...',
        description: 'Establishing connection',
        icon: Loader2,
        badgeVariant: 'outline',
        badgeText: 'Connecting',
        statusColor: 'bg-blue-500'
      }
    }

    // Error states
    if (miniAppAuth.isError || walletUI.error) {
      return {
        type: 'error',
        displayName: 'Connection Error',
        description: miniAppAuth.error?.message || walletUI.error || 'Connection failed',
        icon: AlertCircle,
        badgeVariant: 'destructive',
        badgeText: 'Error',
        statusColor: 'bg-red-500'
      }
    }

    // Farcaster authenticated states
    if (miniAppAuth.isAuthenticated && miniAppAuth.farcasterAuth) {
      const farcaster = miniAppAuth.farcasterAuth
      
      if (miniAppAuth.user?.authenticationMethod === 'farcaster-native') {
        return {
          type: 'farcaster-verified',
          displayName: `@${farcaster.username || 'unknown'}`,
          description: 'Verified on Farcaster with wallet connected',
          icon: Shield,
          badgeVariant: 'default',
          badgeText: 'Verified',
          statusColor: 'bg-green-500'
        }
      } else {
        return {
          type: 'farcaster-connected',
          displayName: `@${farcaster.username || 'unknown'}`,
          description: 'Connected via Farcaster',
          icon: Users,
          badgeVariant: 'secondary',
          badgeText: 'Social',
          statusColor: 'bg-blue-500'
        }
      }
    }

    // Wallet only connected
    if (walletUI.isConnected) {
      return {
        type: 'wallet-only',
        displayName: walletUI.formattedAddress || 'Connected',
        description: 'Wallet connected',
        icon: Wallet,
        badgeVariant: 'secondary',
        badgeText: 'Wallet',
        statusColor: 'bg-green-500'
      }
    }

    // Disconnected
    return {
      type: 'disconnected',
      displayName: 'Not Connected',
      description: 'Connect wallet or sign in with Farcaster',
      icon: Wallet,
      badgeVariant: 'outline',
      badgeText: 'Disconnected',
      statusColor: 'bg-gray-500'
    }
  }, [walletUI, miniAppAuth])

  // Handle authentication actions
  const handleConnect = async () => {
    try {
      if (miniAppAuth.environmentType === 'miniapp') {
        // In MiniApp context, prioritize Farcaster auto-connect to prevent conflicts
        console.log('🔄 MiniApp detected: Using Farcaster auto-connect to prevent Privy race condition')
        // Don't call walletUI.connect() in MiniApp - let Farcaster handle it
        return
      } else {
        // Only use Privy in web context
        walletUI.connect()
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      if (miniAppAuth.isAuthenticated) {
        miniAppAuth.logout()
      }
      if (walletUI.isConnected) {
        walletUI.disconnect()
      }
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  const StatusIcon = authState.icon

  // Minimal variant - just status indicator
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('h-2 w-2 rounded-full', authState.statusColor)} />
        <span className="text-xs font-medium">{authState.badgeText}</span>
      </div>
    )
  }

  // Compact variant - single line
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <StatusIcon className={cn(
          'h-4 w-4',
          authState.type === 'loading' && 'animate-spin'
        )} />
        <span className="text-sm font-medium">{authState.displayName}</span>
        <Badge variant={authState.badgeVariant} className="text-xs">
          {authState.badgeText}
        </Badge>
      </div>
    )
  }

  // Full variant - comprehensive display
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar/Icon */}
            {miniAppAuth.farcasterAuth?.pfpUrl ? (
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={miniAppAuth.farcasterAuth.pfpUrl} 
                  alt={miniAppAuth.farcasterAuth.username}
                />
                <AvatarFallback>
                  {miniAppAuth.farcasterAuth.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <StatusIcon className={cn(
                  'h-5 w-5',
                  authState.type === 'loading' && 'animate-spin'
                )} />
              </div>
            )}

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {authState.displayName}
                </span>
                <Badge variant={authState.badgeVariant} className="text-xs shrink-0">
                  {authState.badgeText}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                {authState.description}
              </p>

              {/* Additional Info for Farcaster Users */}
              {miniAppAuth.farcasterAuth && (
                <div className="flex items-center gap-2 mt-2">
                  {miniAppAuth.farcasterAuth.displayName && (
                    <span className="text-xs text-muted-foreground">
                      {miniAppAuth.farcasterAuth.displayName}
                    </span>
                  )}
                  {miniAppAuth.farcasterAuth.fid && (
                    <Badge variant="outline" className="text-xs">
                      FID: {miniAppAuth.farcasterAuth.fid}
                    </Badge>
                  )}
                </div>
              )}

              {/* Wallet Address for connected wallet */}
              {walletUI.isConnected && walletUI.formattedAddress && !miniAppAuth.farcasterAuth && (
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  {walletUI.formattedAddress}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="ml-2">
              {authState.type === 'disconnected' ? (
                <Button
                  size="sm"
                  onClick={handleConnect}
                >
                  Connect
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {miniAppAuth.farcasterAuth && (
                      <>
                        <DropdownMenuItem>
                          <ExternalLink className="h-3 w-3 mr-2" />
                          View on Farcaster
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {walletUI.isConnected && (
                      <>
                        <DropdownMenuItem>
                          <Wallet className="h-3 w-3 mr-2" />
                          Wallet Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={handleDisconnect}
                      className="text-red-600"
                    >
                      <LogOut className="h-3 w-3 mr-2" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Export additional variants for different use cases
export function CompactAuthStatus(props: Omit<EnhancedAuthStatusProps, 'variant'>) {
  return <EnhancedAuthStatus {...props} variant="compact" />
}

export function MinimalAuthStatus(props: Omit<EnhancedAuthStatusProps, 'variant'>) {
  return <EnhancedAuthStatus {...props} variant="minimal" />
}

