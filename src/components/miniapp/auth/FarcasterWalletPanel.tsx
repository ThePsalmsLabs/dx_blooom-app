/**
 * Farcaster Wallet Panel Component
 * File: src/components/miniapp/auth/FarcasterWalletPanel.tsx
 * 
 * This component provides a unified authentication interface that properly handles:
 * - Farcaster Quick Auth integration
 * - Wallet connection management
 * - Combined authentication state display
 * - Seamless UX for both authentication methods
 */

'use client'

import React, { useState, useCallback } from 'react'
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Alert,
  AlertDescription
} from '@/components/ui/alert'
import {
  CheckCircle,
  Wallet,
  UserCheck,
  Shield,
  Users,
  LogOut,
  ExternalLink,
  Loader2,
  AlertCircle,
  Zap,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMiniAppAuth } from '@/hooks/business/miniapp-auth'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'

interface FarcasterWalletPanelProps {
  className?: string
  onAuthComplete?: () => void
  showWalletFallback?: boolean
}

export function FarcasterWalletPanel({ 
  className,
  onAuthComplete,
  showWalletFallback = true 
}: FarcasterWalletPanelProps) {
  const walletUI = useMiniAppWalletUI()
  const miniAppAuth = useMiniAppAuth()
  const [activeTab, setActiveTab] = useState<'farcaster' | 'wallet'>('farcaster')

  // Handle Farcaster authentication
  const handleFarcasterAuth = useCallback(async () => {
    try {
      // Use wallet connect instead (aligned with web app patterns)
      await walletUI.connect()
      onAuthComplete?.()
    } catch (error) {
      console.error('Wallet authentication failed:', error)
    }
  }, [walletUI, onAuthComplete])

  // Handle wallet connection
  const handleWalletConnect = useCallback(async () => {
    try {
      await walletUI.connect()
      onAuthComplete?.()
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }, [walletUI, onAuthComplete])

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      if (miniAppAuth.isAuthenticated) {
        await miniAppAuth.logout()
      }
      if (walletUI.isConnected) {
        await walletUI.disconnect()
      }
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }, [miniAppAuth, walletUI])

  // If already authenticated, show status
  if (miniAppAuth.isAuthenticated || walletUI.isConnected) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Connected Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Farcaster Authentication Status */}
          {miniAppAuth.isAuthenticated && miniAppAuth.farcasterAuth && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={miniAppAuth.farcasterAuth.pfpUrl} 
                  alt={miniAppAuth.farcasterAuth.username}
                />
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {miniAppAuth.farcasterAuth.username?.charAt(0).toUpperCase() || 'F'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-800">
                    @{miniAppAuth.farcasterAuth.username || 'unknown'}
                  </span>
                  <Badge className="bg-green-600 text-white text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                
                {miniAppAuth.farcasterAuth.displayName && (
                  <p className="text-sm text-green-700 mt-1">
                    {miniAppAuth.farcasterAuth.displayName}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                    FID: {miniAppAuth.farcasterAuth.fid}
                  </Badge>
                  <span className="text-xs text-green-600">
                    Farcaster Authentication
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Connection Status */}
          {walletUI.isConnected && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-blue-800 font-mono text-sm">
                    {walletUI.formattedAddress}
                  </span>
                  <Badge className="bg-blue-600 text-white text-xs">
                    <Wallet className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                
                <p className="text-sm text-blue-700 mt-1">
                  Wallet connected on {walletUI.chainName}
                </p>
                
                {!walletUI.isCorrectNetwork && (
                  <Alert className="mt-2 border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-xs">
                      Please switch to a supported network
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* Authentication Benefits */}
          {miniAppAuth.isAuthenticated && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm text-purple-800">
                  Enhanced Features Available
                </span>
              </div>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Direct payments with verified wallet</li>
                <li>• Social context for better recommendations</li>
                <li>• Batch transaction optimizations</li>
                <li>• Enhanced security and verification</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="flex-1"
            >
              <LogOut className="h-3 w-3 mr-2" />
              Disconnect
            </Button>
            
            {miniAppAuth.farcasterAuth && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`https://warpcast.com/${miniAppAuth.farcasterAuth?.username}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                View Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show authentication options
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle>Connect Your Account</CardTitle>
        <CardDescription>
          Sign in with Farcaster for the best experience or connect your wallet directly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'farcaster' | 'wallet')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="farcaster" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Farcaster
            </TabsTrigger>
            {showWalletFallback && (
              <TabsTrigger value="wallet" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="farcaster" className="space-y-4 mt-4">
            <div className="text-center space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-medium text-purple-800 mb-1">
                  Recommended: Farcaster Authentication
                </h3>
                <p className="text-sm text-purple-700">
                  Connect with your Farcaster account for verified social features and optimal payment flows
                </p>
              </div>

              <Button
                onClick={handleFarcasterAuth}
                disabled={miniAppAuth.isLoading}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {miniAppAuth.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting with Farcaster...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Sign in with Farcaster
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground">
                <p>Benefits include:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Verified wallet integration</li>
                  <li>• Social context and recommendations</li>
                  <li>• Direct payment capabilities</li>
                  <li>• Enhanced security</li>
                </ul>
              </div>
            </div>

            {miniAppAuth.isError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {miniAppAuth.error?.message || 'Farcaster authentication failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {showWalletFallback && (
            <TabsContent value="wallet" className="space-y-4 mt-4">
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Wallet className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-blue-800 mb-1">
                    Direct Wallet Connection
                  </h3>
                  <p className="text-sm text-blue-700">
                    Connect your wallet directly for basic functionality
                  </p>
                </div>

                <Button
                  onClick={handleWalletConnect}
                  disabled={walletUI.isConnecting}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  {walletUI.isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting Wallet...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground">
                  Standard wallet connection provides basic Web3 functionality without social features.
                </div>
              </div>

              {walletUI.error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {walletUI.error || 'Wallet connection failed. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}

