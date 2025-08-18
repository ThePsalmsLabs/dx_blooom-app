/**
 * Privy-based Wallet Connection Components
 * File: src/components/web3/WalletConnectButton.tsx
 * 
 * These components replace your RainbowKit-based components with Privy's
 * integrated authentication system. The key insight is that Privy handles
 * much of the modal and UI logic internally, which actually simplifies
 * your component code significantly.
 * 
 * Notable differences from RainbowKit approach:
 * - No custom modal needed - Privy provides its own
 * - Unified login/logout actions instead of separate wallet connect/disconnect
 * - Built-in support for multiple authentication methods
 * - Automatic handling of embedded wallets
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWalletConnect } from '@/hooks/web3/useWalletConnect'
import { ChevronDown, Wallet, Shield, Zap, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Main Wallet Connect Button Component
 * 
 * This component demonstrates how Privy simplifies the connection flow.
 * Instead of managing multiple states (disconnected, connecting, connected)
 * and custom modals, Privy handles most of this complexity internally.
 * 
 * Your users can now authenticate via:
 * - External wallets (MetaMask, Coinbase Wallet, etc.)
 * - Email addresses (with embedded wallet creation)
 * - Phone numbers (with embedded wallet creation)
 * - Social logins (Google, Twitter, Discord)
 */
interface WalletConnectButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  showModal?: boolean
  children?: React.ReactNode
}

export function WalletConnectButton({
  variant = 'default',
  size = 'default',
  className,
  children,
  ...props
}: WalletConnectButtonProps) {
  const {
    isConnected,
    isConnecting,
    isAuthenticated,
    formattedAddress,
    user,
    login,
    logout,
    error,
    showNetworkWarning
  } = useWalletConnect()

  /**
   * Button Content Logic
   * 
   * Privy's authentication system provides more granular states than traditional
   * wallet connection. Users might be authenticated via email but not have a wallet,
   * or they might have an embedded wallet that was created automatically.
   * 
   * This logic adapts your UI to these different states.
   */
  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          Connecting...
        </>
      )
    }

    if (isConnected && formattedAddress) {
      return (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          {formattedAddress}
          <ChevronDown className="w-4 h-4 ml-2" />
        </>
      )
    }

    if (isAuthenticated && user.email) {
      return (
        <>
          <Users className="w-4 h-4 mr-2" />
          {user.email}
          <ChevronDown className="w-4 h-4 ml-2" />
        </>
      )
    }

    return children || (
      <>
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </>
    )
  }

  /**
   * Click Handler
   * 
   * With Privy, the action is much simpler than RainbowKit. If the user
   * is authenticated, we log them out. If not, we open Privy's authentication
   * modal which handles all the complexity of wallet selection, email entry,
   * embedded wallet creation, etc.
   */
  const handleClick = () => {
    if (isAuthenticated) {
      logout()
    } else {
      login()
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={handleClick}
        disabled={isConnecting}
        {...props}
      >
        {getButtonContent()}
      </Button>

      {/* Network Warning - preserved from your current setup */}
      {showNetworkWarning && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Please switch to a supported network to use all features.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display - enhanced for Privy's authentication errors */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Enhanced Wallet Status Display
 * 
 * This component showcases Privy's rich user context. Unlike traditional
 * wallet-only connections, Privy provides information about the user's
 * authentication method, embedded wallet status, and more.
 */
export function WalletStatusDisplay() {
  const {
    isConnected,
    isAuthenticated,
    user,
    formattedAddress,
    smartAccount,
    network,
    isCorrectNetwork
  } = useWalletConnect()

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Connected</CardTitle>
          <CardDescription>
            Connect your wallet or sign in to get started
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Connected
        </CardTitle>
        <CardDescription>
          You're authenticated and ready to use the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Information - new with Privy */}
        <div>
          <h4 className="font-medium mb-2">Account Information</h4>
          <div className="space-y-2 text-sm">
            {user.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Login Method:</span>
              <Badge variant="outline">{user.loginMethod}</Badge>
            </div>
            {user.hasEmbeddedWallet && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet Type:</span>
                <Badge variant="secondary">Embedded Wallet</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Information */}
        {isConnected && formattedAddress && (
          <div>
            <h4 className="font-medium mb-2">Wallet Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {formattedAddress}
                </code>
              </div>
              {network && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <div className="flex items-center gap-2">
                    <span>{network.name}</span>
                    {isCorrectNetwork ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Smart Account Information - preserved from your current setup */}
        {smartAccount.isEnabled && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Smart Account
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={smartAccount.isDeployed ? "default" : "secondary"}>
                  {smartAccount.isDeployed ? "Deployed" : "Not Deployed"}
                </Badge>
              </div>
              {smartAccount.canSponsorGas && (
                <div className="flex items-center gap-2 text-green-600">
                  <Zap className="w-4 h-4" />
                  <span>Gasless transactions enabled</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Smart Account Upgrade Prompt
 * 
 * This component demonstrates how to integrate your existing smart account
 * functionality with Privy's user authentication system. The upgrade flow
 * works the same way, but now you have richer context about the user.
 */
export function SmartAccountUpgradePrompt() {
  const {
    canUpgradeToSmartAccount,
    upgradeToSmartAccount,
    isUpgrading,
    smartAccount
  } = useWalletConnect()

  if (!canUpgradeToSmartAccount || smartAccount.isEnabled) {
    return null
  }

  const handleUpgrade = async () => {
    await upgradeToSmartAccount()
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Shield className="w-5 h-5" />
          Upgrade to Smart Account
        </CardTitle>
        <CardDescription className="text-blue-700">
          Enable gasless transactions and enhanced security features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {smartAccount.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-blue-800">
                <CheckCircle2 className="w-4 h-4" />
                {benefit}
              </div>
            ))}
          </div>
          <Button 
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full"
          >
            {isUpgrading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Upgrading...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Upgrade Account
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Complete Wallet Connection Example
 * 
 * This component shows how all the pieces work together with Privy.
 * Notice how much simpler this is compared to your RainbowKit setup -
 * Privy handles most of the complexity internally.
 */
export function PrivyWalletExample() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Privy Wallet Connection</h2>
        <p className="text-muted-foreground">
          Connect via wallet, email, phone, or social login
        </p>
      </div>
      
      <div className="flex justify-center">
        <WalletConnectButton size="lg" />
      </div>
      
      <WalletStatusDisplay />
      
      <SmartAccountUpgradePrompt />
    </div>
  )
}
