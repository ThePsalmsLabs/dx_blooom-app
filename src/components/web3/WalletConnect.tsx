/**
 * Wallet Connection Button Component
 * File: src/components/web3/WalletConnectionButton.tsx
 * 
 * This component represents the fundamental entry point for users into your Web3 platform.
 * It demonstrates how our UI integration hooks transform complex wallet management into
 * a simple, intuitive interface that handles all the edge cases and provides clear feedback.
 * 
 * Key Features:
 * - Automatic network detection and switching prompts
 * - Clear connection status with formatted address display
 * - Built-in error handling with user-friendly messages
 * - Responsive design that works across device sizes
 * - Accessibility features for screen readers and keyboard navigation
 * 
 * This component showcases how our architectural layers enable rapid development
 * of sophisticated features without sacrificing reliability or user experience.
 */

'use client'

import React from 'react'
import { Wallet, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Import our UI integration hook - this provides everything we need
import { useWalletConnectionUI } from '@/hooks/ui/integration'

/**
 * Props interface for the WalletConnectionButton component
 * 
 * This interface is intentionally minimal because our UI integration hook
 * handles most of the complexity. Components can focus on presentation
 * and user experience rather than wallet management logic.
 */
interface WalletConnectionButtonProps {
  /** Optional custom styling classes */
  className?: string
  /** Whether to show the full connection card or just a button */
  variant?: 'button' | 'card'
  /** Optional callback when connection state changes */
  onConnectionChange?: (connected: boolean) => void
}

/**
 * WalletConnectionButton Component
 * 
 * This component demonstrates the power of our UI integration architecture.
 * Notice how clean and focused this component is - all the complex wallet
 * management logic is handled by our useWalletConnectionUI hook.
 * 
 * The component simply reads the formatted data and provides appropriate
 * UI responses based on the current state. This declarative approach
 * makes the component easy to understand, test, and maintain.
 */
export function WalletConnectionButton({
  className,
  variant = 'button',
  onConnectionChange
}: WalletConnectionButtonProps) {
  // Get all wallet connection data from our UI integration hook
  // This single hook call provides everything we need for a complete wallet interface
  const wallet = useWalletConnectionUI()

  // Notify parent component of connection changes
  React.useEffect(() => {
    onConnectionChange?.(wallet.isConnected)
  }, [wallet.isConnected, onConnectionChange])

  // Render the appropriate UI based on the variant prop
  if (variant === 'card') {
    return <WalletConnectionCard wallet={wallet} className={className} />
  }

  return <WalletConnectionButtonOnly wallet={wallet} className={className} />
}

/**
 * Compact Button Variant
 * 
 * This variant provides a minimal wallet connection interface suitable
 * for navigation bars, headers, or anywhere space is limited.
 */
function WalletConnectionButtonOnly({
  wallet,
  className
}: {
  wallet: ReturnType<typeof useWalletConnectionUI>
  className?: string
}) {
  // Handle connection action with built-in error handling
  const handleConnectionAction = () => {
    if (wallet.isConnected) {
      wallet.disconnect()
    } else {
      wallet.connect()
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Network warning indicator */}
      {wallet.showNetworkWarning && (
        <Button
          variant="outline"
          size="sm"
          onClick={wallet.switchNetwork}
          className="text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Switch Network
        </Button>
      )}

      {/* Main connection button */}
      <Button
        onClick={handleConnectionAction}
        disabled={wallet.isConnecting}
        variant={wallet.isConnected ? 'outline' : 'default'}
        size="sm"
        className={cn(
          'min-w-[120px]',
          wallet.isConnected && 'hover:bg-destructive hover:text-destructive-foreground'
        )}
      >
        {wallet.isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : wallet.isConnected ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            {wallet.formattedAddress}
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </>
        )}
      </Button>
    </div>
  )
}

/**
 * Full Card Variant
 * 
 * This variant provides a comprehensive wallet connection interface
 * with detailed status information, network details, and error messaging.
 * Perfect for dedicated wallet connection pages or onboarding flows.
 */
function WalletConnectionCard({
  wallet,
  className
}: {
  wallet: ReturnType<typeof useWalletConnectionUI>
  className?: string
}) {
  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header with wallet status */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">
              {wallet.isConnected ? 'Wallet Connected' : 'Connect Your Wallet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {wallet.isConnected
                ? 'Your wallet is connected and ready to use'
                : 'Connect your wallet to access all platform features'}
            </p>
          </div>

          {/* Connection status and details */}
          {wallet.isConnected && (
            <div className="space-y-3">
              {/* Wallet address display */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Wallet Address</span>
                  <code className="text-sm bg-background px-2 py-1 rounded">
                    {wallet.formattedAddress}
                  </code>
                </div>
              </div>

              {/* Network status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network</span>
                <Badge
                  variant={wallet.isCorrectNetwork ? 'default' : 'destructive'}
                  className="ml-2"
                >
                  {wallet.chainName}
                </Badge>
              </div>
            </div>
          )}

          {/* Network warning */}
          {wallet.showNetworkWarning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You&apos;re connected to {wallet.chainName}. Please switch to Base network
                to use all platform features.
              </AlertDescription>
            </Alert>
          )}

          {/* Error display */}
          {wallet.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{wallet.error}</AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {wallet.showNetworkWarning && (
              <Button
                onClick={wallet.switchNetwork}
                variant="outline"
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Switch to Base Network
              </Button>
            )}

            <Button
              onClick={wallet.isConnected ? wallet.disconnect : wallet.connect}
              disabled={wallet.isConnecting}
              variant={wallet.isConnected ? 'destructive' : 'default'}
              className="w-full"
            >
              {wallet.isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : wallet.isConnected ? (
                'Disconnect Wallet'
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
                )}
            </Button>
          </div>

          {/* Clear error button */}
          {wallet.error && (
            <Button
              onClick={wallet.clearError}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Clear Error
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Usage Examples and Integration Patterns
 * 
 * // Simple button in navigation
 * <WalletConnectionButton variant="button" />
 * 
 * // Full card for onboarding pages
 * <WalletConnectionButton 
 *   variant="card" 
 *   onConnectionChange={(connected) => {
 *     if (connected) {
 *       router.push('/dashboard')
 *     }
 *   }}
 * />
 * 
 * // Custom styling
 * <WalletConnectionButton 
 *   variant="button"
 *   className="bg-gradient-to-r from-blue-500 to-purple-600"
 * />
 */