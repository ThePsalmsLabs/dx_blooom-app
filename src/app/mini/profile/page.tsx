/**
 * MiniApp Profile Page - Simple & Effective
 * File: src/app/mini/profile/page.tsx
 *
 * A clean, simple profile page that works properly in Farcaster mobile.
 * No complex logic, no infinite loading states, just straightforward functionality.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Crown,
  Settings,
  LogOut,
  ArrowRight,
  Wallet,
  Loader2,
  Home
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback
} from '@/components/ui/index'

import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { useIsCreatorRegistered } from '@/hooks/contracts/core'
import { formatWalletAddress, isWalletFullyConnected, getSafeAddress } from '@/lib/utils/wallet-utils'
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'

export default function MiniAppProfilePage() {
  const router = useRouter()
  const walletUI = useFarcasterAutoWallet()
  const socialState = useSocialState()
  const miniAppUtils = useMiniAppUtils()
  
  const userAddress = getSafeAddress(walletUI.address)
  const isConnected = isWalletFullyConnected(walletUI.isConnected, walletUI.address)
  const formattedAddress = formatWalletAddress(walletUI.address)
  
  // Simple creator check - no complex timeouts
  const creatorRegistration = useIsCreatorRegistered(userAddress)

  // Show wallet connection if not connected  
  if (!isConnected || !userAddress) {
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
                onClick={() => walletUI.connect().catch(console.error)}
                disabled={walletUI.isConnecting}
                className="w-full"
              >
                {walletUI.isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
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

  // Determine user status - just use the data as-is, no loading screens
  const isCreator = creatorRegistration.data === true
  const userProfile = socialState?.userProfile

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
              
              {miniAppUtils.isMiniApp && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Context:</span>
                  <Badge variant="outline" className="text-xs">Farcaster Mini App</Badge>
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