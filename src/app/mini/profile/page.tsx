/**
 * MiniApp Profile Page - Fixed with Unified Auth
 * File: src/app/mini/profile/page.tsx
 *
 * Now uses the unified authentication system to properly handle
 * Farcaster auto-wallet connection in MiniApp context.
 * 
 * FIXED: Uses useUnifiedAuth instead of direct wallet hooks
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Crown,
  Settings,
  LogOut,
  ArrowRight,
  Wallet,
  Loader2,
  Home,
  AlertCircle,
  Smartphone
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  Alert,
  AlertDescription
} from '@/components/ui/index'

import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'
import { useUnifiedAuth } from '@/hooks/unified/useUnifiedAuth'
import { useIsCreatorRegistered } from '@/hooks/contracts/core'
import { formatWalletAddress, getSafeAddress } from '@/lib/utils/wallet-utils'
import { useSocialState } from '@/contexts/UnifiedMiniAppProvider'

export default function MiniAppProfilePage() {
  const router = useRouter()
  const auth = useUnifiedAuth()
  const socialState = useSocialState()
  
  const userAddress = getSafeAddress(auth.address)
  const formattedAddress = formatWalletAddress(auth.address)
  
  // Simple creator check - no complex timeouts
  const creatorRegistration = useIsCreatorRegistered(userAddress)

  // Show loading state while authentication is initializing
  if (!auth.isInitialized || auth.isLoading) {
    return (
      <MiniAppLayout>
        <div className="container mx-auto px-4 space-y-2">
          <div className="text-center space-y-4 pt-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">Loading Profile</h1>
              <p className="text-muted-foreground">
                Connecting your Farcaster wallet...
              </p>
            </div>
          </div>
        </div>
      </MiniAppLayout>
    )
  }

  // Show error state if there's an authentication error
  if (auth.hasError && auth.error) {
    return (
      <MiniAppLayout>
        <div className="container mx-auto px-4 space-y-4">
          <Alert className="border-red-200 bg-red-50 mt-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <p>
                  Unable to connect your Farcaster wallet. Please ensure you have a connected wallet in the Farcaster app.
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={auth.retry}
                    className="w-full"
                  >
                    <Loader2 className={`h-4 w-4 mr-2 ${auth.isConnecting ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/mini')}
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </MiniAppLayout>
    )
  }

  // Show wallet connection if not authenticated
  if (!auth.isAuthenticated || !auth.address) {
    return (
      <MiniAppLayout>
        <div className="container mx-auto px-4 space-y-2">
          <div className="text-center space-y-4 pt-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
              <p className="text-muted-foreground">
                Connect your wallet to access your profile and manage your account
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => auth.connect().catch(console.error)}
                disabled={auth.isConnecting}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {auth.isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting Farcaster Wallet...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Connect Farcaster Wallet
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/mini')}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </MiniAppLayout>
    )
  }

  // Determine user status - using unified auth
  const isCreator = creatorRegistration.data === true
  const userProfile = auth.user || socialState?.userProfile

  return (
    <MiniAppLayout>
      <div className="container mx-auto px-4 space-y-4">
        {/* Profile Header */}
        <div className="text-center space-y-3 pt-2">
          <Avatar className="h-20 w-20 mx-auto">
            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
              {userProfile?.displayName?.charAt(0) || 
               userProfile?.username?.charAt(0) || 
               formattedAddress?.charAt(0) || 
               '?'}
            </AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              {userProfile?.displayName || `User ${userAddress?.slice(-4)}`}
              {isCreator && <Crown className="h-5 w-5 text-yellow-500" />}
            </h1>
            
            <p className="text-muted-foreground">
              {formattedAddress}
            </p>
            
            {userProfile?.username && (
              <p className="text-sm text-primary">@{userProfile.username}</p>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant={isCreator ? "default" : "secondary"} className="px-4 py-1">
              {isCreator ? (
                <>
                  <Crown className="h-3 w-3 mr-1" />
                  Creator
                </>
              ) : (
                <>
                  <User className="h-3 w-3 mr-1" />
                  Member
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          {/* Creator Actions */}
          {isCreator ? (
            <>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => router.push('/mini/dashboard')}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Creator Dashboard</h3>
                      <p className="text-sm text-muted-foreground">Manage your content and earnings</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                    onClick={() => router.push('/mini/onboard')}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Become a Creator</h3>
                      <p className="text-sm text-muted-foreground">Start earning from your content</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </>
          )}

          {/* Settings */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">Settings</h3>
                  <p className="text-sm text-muted-foreground">Manage your account preferences</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          {/* Wallet Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-mono">{formattedAddress}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network:</span>
                <span>Base</span>
              </div>
              
              {auth.isMiniApp && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Context:</span>
                  <Badge variant="outline" className="text-xs">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Farcaster Mini App
                  </Badge>
                </div>
              )}
              
              {auth.user?.fid && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Farcaster ID:</span>
                  <span className="font-mono">{auth.user.fid}</span>
                </div>
              )}
              
              {auth.user?.isVerified !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verified:</span>
                  <Badge variant={auth.user.isVerified ? "default" : "secondary"} className="text-xs">
                    {auth.user.isVerified ? "✓ Verified" : "Unverified"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/mini')}
            className="w-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => router.push('/mini')}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Exit Profile
          </Button>
        </div>
      </div>
    </MiniAppLayout>
  )
}