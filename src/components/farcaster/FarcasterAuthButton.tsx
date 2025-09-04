'use client'

import React from 'react'
import { Button } from '../ui/button'
import { useMiniAppAuth } from '../../hooks/business/miniapp-auth'
import { Loader2, UserCheck, AlertCircle } from 'lucide-react'

/**
 * Farcaster Authentication Button Component
 * 
 * This component provides a simple interface for users to authenticate with
 * Farcaster in miniapp environments. It demonstrates the proper usage of the
 * updated authentication hook that implements Quick Auth.
 */

interface FarcasterAuthButtonProps {
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function FarcasterAuthButton({
  variant = 'default',
  size = 'default',
  className,
  children
}: FarcasterAuthButtonProps) {
  const {
    isAuthenticated,
    isLoading,
    isError,
    error,
    environmentType,
    farcasterAuth,
    login,
    logout
  } = useMiniAppAuth()

  // Don't show the button if not in miniapp environment
  if (environmentType !== 'miniapp') {
    return null
  }

  const handleAuth = async () => {
    try {
      if (isAuthenticated) {
        await logout()
      } else {
        await login()
      }
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }

  // Show authenticated state
  if (isAuthenticated && farcasterAuth) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-green-600">
          <UserCheck className="h-4 w-4" />
          <span>Signed in as @{farcasterAuth.username}</span>
        </div>
        <Button
          variant="outline"
          size={size}
          className={className}
          onClick={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing out...
            </>
          ) : (
            'Sign Out'
          )}
        </Button>
      </div>
    )
  }

  // Show error state
  if (isError && error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>Authentication failed: {error.message}</span>
        </div>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            'Try Again'
          )}
        </Button>
      </div>
    )
  }

  // Show sign-in button
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleAuth}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting to Farcaster...
        </>
      ) : (
        children || 'Sign In with Farcaster'
      )}
    </Button>
  )
}

/**
 * Alternative simplified hook for basic Farcaster auth status
 * This can be used in other components that need to check auth status
 */
export function useFarcasterAuth() {
  const auth = useMiniAppAuth()
  
  return {
    isSignedIn: auth.isAuthenticated && !!auth.farcasterAuth,
    user: auth.farcasterAuth,
    isLoading: auth.isLoading,
    error: auth.error,
    signIn: auth.login,
    signOut: auth.logout
  }
}
