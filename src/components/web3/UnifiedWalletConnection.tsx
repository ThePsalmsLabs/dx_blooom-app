/**
 * Unified Wallet Connection - Seamless Integration
 * File: src/components/web3/UnifiedWalletConnection.tsx
 *
 * A unified wallet connection component that provides consistent behavior
 * across web and MiniApp environments with intelligent fallbacks.
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Wallet, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'

// ================================================
// CONNECTION STATES AND TYPES
// ================================================

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

interface WalletInfo {
  readonly address: string
  readonly chainId?: number
  readonly isVerified?: boolean
  readonly balance?: string
  readonly walletType?: 'metamask' | 'walletconnect' | 'coinbase' | 'privy' | 'unknown'
}

interface ConnectionAttempt {
  readonly timestamp: Date
  readonly walletType: string
  readonly success: boolean
  readonly error?: string
}

// ================================================
// WALLET DETECTION UTILITIES
// ================================================

/**
 * Detect available wallets in the environment
 */
function detectAvailableWallets(): Array<{
  id: string
  name: string
  icon: string
  isAvailable: boolean
  isRecommended: boolean
}> {
  const wallets = []

  // Check for injected ethereum provider (covers MetaMask, Phantom, Brave, etc.)
  const hasInjected = typeof window !== 'undefined' && !!window.ethereum

  // MetaMask (explicit check)
  const hasMetaMask = hasInjected && window.ethereum?.isMetaMask === true
  if (hasMetaMask) {
    wallets.push({
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      isAvailable: true,
      isRecommended: true // MetaMask is most popular
    })
  }

  // Phantom (detected via injected provider without other flags)
  const hasPhantom = hasInjected &&
    !window.ethereum?.isMetaMask &&
    !window.ethereum?.isWalletConnect &&
    !window.ethereum?.isCoinbaseWallet &&
    window.ethereum?.isPhantom !== false // Some versions set this

  if (hasPhantom) {
    wallets.push({
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      isAvailable: true,
      isRecommended: true // Popular Solana/Ethereum wallet
    })
  }

  // Coinbase Wallet
  const hasCoinbase = hasInjected && window.ethereum?.isCoinbaseWallet === true
  if (hasCoinbase) {
    wallets.push({
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '📱',
      isAvailable: true,
      isRecommended: false
    })
  }

  // WalletConnect (can work with any wallet)
  wallets.push({
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    isAvailable: true, // Always available as fallback
    isRecommended: !hasMetaMask && !hasPhantom // Fallback option
  })

  // If no specific wallets detected but ethereum is available, show generic option
  if (hasInjected && wallets.length === 1 && wallets[0].id === 'walletconnect') {
    wallets.unshift({
      id: 'injected',
      name: 'Browser Wallet',
      icon: '🌐',
      isAvailable: true,
      isRecommended: true
    })
  }

  return wallets
}

/**
 * Get wallet connection priority based on environment
 */
function getWalletPriority(wallets: ReturnType<typeof detectAvailableWallets>, isMiniApp: boolean) {
  if (isMiniApp) {
    // In MiniApp, prefer wallets that work well in embedded contexts
    return wallets.sort((a, b) => {
      if (a.id === 'metamask' && a.isAvailable) return -1
      if (b.id === 'metamask' && b.isAvailable) return 1
      if (a.id === 'walletconnect') return -1
      if (b.id === 'walletconnect') return 1
      return 0
    })
  }

  // In web context, use natural order
  return wallets
}

// ================================================
// WALLET CONNECTION HOOK
// ================================================

export function useUnifiedWalletConnection() {
  const { state, actions, utils } = useUnifiedMiniApp()
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState<ConnectionAttempt[]>([])
  const [availableWallets, setAvailableWallets] = useState(detectAvailableWallets())

  // Update available wallets periodically
  useEffect(() => {
    const updateWallets = () => {
      setAvailableWallets(detectAvailableWallets())
    }

    updateWallets()
    const interval = setInterval(updateWallets, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Sync with unified state
  useEffect(() => {
    if (state.isConnected && state.userAddress) {
      setConnectionState('connected')
      setWalletInfo({
        address: state.userAddress,
        walletType: 'privy', // Assuming Privy for unified provider
        isVerified: state.socialContext?.userProfile?.isVerified || false
      })
    } else if (state.loadingState === 'loading') {
      setConnectionState('connecting')
    } else {
      setConnectionState('disconnected')
      setWalletInfo(null)
    }
  }, [state.isConnected, state.userAddress, state.loadingState, state.socialContext])

  const connect = useCallback(async (walletType?: string) => {
    setConnectionState('connecting')

    const attempt: ConnectionAttempt = {
      timestamp: new Date(),
      walletType: walletType || 'auto',
      success: false
    }

    try {
      await actions.connectWallet()

      const successfulAttempt: ConnectionAttempt = {
        ...attempt,
        success: true
      }
      setConnectionState('connected')
      setConnectionAttempts(prev => [...prev.slice(-4), successfulAttempt]) // Keep last 5 attempts
    } catch (error) {
      console.error('Wallet connection failed:', error)

      const failedAttempt: ConnectionAttempt = {
        ...attempt,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      setConnectionState('error')
      setConnectionAttempts(prev => [...prev.slice(-4), failedAttempt]) // Keep last 5 attempts
    }
  }, [actions])

  const disconnect = useCallback(async () => {
    try {
      await actions.disconnectWallet()
      setConnectionState('disconnected')
      setWalletInfo(null)
    } catch (error) {
      console.error('Wallet disconnect failed:', error)
    }
  }, [actions])

  const retryConnection = useCallback(async () => {
    const lastAttempt = connectionAttempts[connectionAttempts.length - 1]
    if (lastAttempt) {
      await connect(lastAttempt.walletType)
    } else {
      await connect()
    }
  }, [connectionAttempts, connect])

  return {
    connectionState,
    walletInfo,
    availableWallets: getWalletPriority(availableWallets, utils.isMiniApp),
    connectionAttempts,
    connect,
    disconnect,
    retryConnection,
    canConnect: state.capabilities?.wallet?.canConnect || false,
    isMiniApp: utils.isMiniApp
  }
}

// ================================================
// WALLET STATUS DISPLAY COMPONENT
// ================================================

interface WalletStatusProps {
  walletInfo: WalletInfo | null
  connectionState: ConnectionState
  onDisconnect: () => void
  className?: string
}

function WalletStatus({ walletInfo, connectionState, onDisconnect, className }: WalletStatusProps) {
  if (connectionState === 'disconnected') {
    return null
  }

  const getStatusIcon = () => {
    switch (connectionState) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Wallet className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return walletInfo ? `Connected: ${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}` : 'Connected'
      case 'error':
        return 'Connection failed'
      default:
        return 'Disconnected'
    }
  }

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', className,
      connectionState === 'connected' && 'border-green-200 bg-green-50',
      connectionState === 'connecting' && 'border-blue-200 bg-blue-50',
      connectionState === 'error' && 'border-red-200 bg-red-50'
    )}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      {walletInfo?.isVerified && (
        <Badge variant="secondary" className="text-xs">
          Verified
        </Badge>
      )}
      {connectionState === 'connected' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDisconnect}
          className="h-auto p-1 text-xs"
        >
          Disconnect
        </Button>
      )}
    </div>
  )
}

// ================================================
// WALLET SELECTION COMPONENT
// ================================================

interface WalletSelectionProps {
  wallets: ReturnType<typeof detectAvailableWallets>
  onWalletSelect: (walletId: string) => void
  isConnecting: boolean
  className?: string
}

function WalletSelection({ wallets, onWalletSelect, isConnecting, className }: WalletSelectionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="text-center">
        <h3 className="font-medium mb-1">Connect Your Wallet</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred wallet to continue
        </p>
      </div>

      <div className="grid gap-2">
        {wallets.map((wallet) => (
          <Button
            key={wallet.id}
            variant="outline"
            onClick={() => onWalletSelect(wallet.id)}
            disabled={isConnecting || !wallet.isAvailable}
            className="justify-start h-auto p-4"
          >
            <span className="text-lg mr-3">{wallet.icon}</span>
            <div className="text-left">
              <div className="font-medium">{wallet.name}</div>
              {!wallet.isAvailable && (
                <div className="text-xs text-muted-foreground">Not available</div>
              )}
              {wallet.isRecommended && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Recommended
                </Badge>
              )}
            </div>
          </Button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have a wallet?{' '}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Get MetaMask
          </a>
        </p>
      </div>
    </div>
  )
}

// ================================================
// CONNECTION PROGRESS COMPONENT
// ================================================

interface ConnectionProgressProps {
  walletType: string
  progress: number
  currentStep: string
  className?: string
}

function ConnectionProgress({ walletType, progress, currentStep, className }: ConnectionProgressProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <div className="text-center mb-4">
          <div className="mx-auto mb-2 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          </div>
          <h3 className="font-medium">Connecting to {walletType}</h3>
          <p className="text-sm text-muted-foreground">{currentStep}</p>
        </div>

        <Progress value={progress} className="h-2 mb-2" />
        <p className="text-xs text-center text-muted-foreground">
          {progress}% complete
        </p>
      </CardContent>
    </Card>
  )
}

// ================================================
// ERROR DISPLAY COMPONENT
// ================================================

interface ConnectionErrorProps {
  error: string
  onRetry: () => void
  onTryDifferentWallet: () => void
  className?: string
}

function ConnectionError({ error, onRetry, onTryDifferentWallet, className }: ConnectionErrorProps) {
  return (
    <Alert className={cn('border-red-200 bg-red-50', className)}>
      <AlertCircle className="h-4 w-4 text-red-500" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        <div className="flex gap-2 ml-4">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
          <Button variant="outline" size="sm" onClick={onTryDifferentWallet}>
            Try Different
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

// ================================================
// MAIN UNIFIED WALLET CONNECTION COMPONENT
// ================================================

interface UnifiedWalletConnectionProps {
  /** Show as modal or inline */
  variant?: 'modal' | 'inline' | 'compact'
  /** Custom styling */
  className?: string
  /** Callback when connection succeeds */
  onConnect?: (walletInfo: WalletInfo) => void
  /** Callback when disconnection occurs */
  onDisconnect?: () => void
  /** Auto-connect on mount */
  autoConnect?: boolean
  /** Show wallet status */
  showStatus?: boolean
  /** Custom connect button text */
  connectText?: string
}

export function UnifiedWalletConnection({
  variant = 'modal',
  className,
  onConnect,
  onDisconnect,
  autoConnect = false,
  showStatus = true,
  connectText = 'Connect Wallet'
}: UnifiedWalletConnectionProps) {
  const {
    connectionState,
    walletInfo,
    availableWallets,
    connect,
    disconnect,
    retryConnection,
    canConnect,
    isMiniApp: _isMiniApp
  } = useUnifiedWalletConnection()

  const [showWalletSelection, setShowWalletSelection] = useState(false)
  const [connectionProgress, setConnectionProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  // Declare handler functions first
  const handleConnect = useCallback(async (walletType?: string) => {
    try {
      await connect(walletType)
      if (walletInfo) {
        onConnect?.(walletInfo)
      }
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }, [connect, walletInfo, onConnect])

  const handleDisconnect = useCallback(async () => {
    await disconnect()
    onDisconnect?.()
  }, [disconnect, onDisconnect])

  const handleWalletSelect = useCallback((walletId: string) => {
    setShowWalletSelection(false)
    handleConnect(walletId)
  }, [handleConnect])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && connectionState === 'disconnected' && canConnect) {
      handleConnect()
    }
  }, [autoConnect, connectionState, canConnect, handleConnect])

  // Simulate connection progress
  useEffect(() => {
    if (connectionState === 'connecting') {
      setConnectionProgress(0)
      const steps = [
        'Initializing connection...',
        'Requesting wallet approval...',
        'Verifying network...',
        'Connection established!'
      ]

      let stepIndex = 0
      const progressInterval = setInterval(() => {
        setConnectionProgress(prev => {
          const newProgress = prev + 20
          if (newProgress >= 100) {
            clearInterval(progressInterval)
            return 100
          }

          if (newProgress % 25 === 0 && stepIndex < steps.length - 1) {
            stepIndex++
            setCurrentStep(steps[stepIndex])
          }

          return newProgress
        })
      }, 500)

      setCurrentStep(steps[0])

      return () => clearInterval(progressInterval)
    }
  }, [connectionState])

  // ================================================
  // RENDER VARIANTS
  // ================================================

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {connectionState === 'connected' && walletInfo ? (
          <WalletStatus
            walletInfo={walletInfo}
            connectionState={connectionState}
            onDisconnect={handleDisconnect}
            className="px-2 py-1"
          />
        ) : (
          <Button
            onClick={() => setShowWalletSelection(true)}
            disabled={!canConnect}
            size="sm"
            className="h-8"
          >
            <Wallet className="h-3 w-3 mr-1" />
            {connectText}
          </Button>
        )}

        {/* Compact Wallet Selection Modal */}
        {showWalletSelection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-sm mx-4">
              <CardHeader>
                <CardTitle>Connect Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <WalletSelection
                  wallets={availableWallets}
                  onWalletSelect={handleWalletSelect}
                  isConnecting={connectionState === 'connecting'}
                />
                <Button
                  variant="ghost"
                  onClick={() => setShowWalletSelection(false)}
                  className="w-full mt-4"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={cn('space-y-4', className)}>
        {connectionState === 'connected' && showStatus && walletInfo && (
          <WalletStatus
            walletInfo={walletInfo}
            connectionState={connectionState}
            onDisconnect={handleDisconnect}
          />
        )}

        {connectionState === 'connecting' && (
          <ConnectionProgress
            walletType="Wallet"
            progress={connectionProgress}
            currentStep={currentStep}
          />
        )}

        {connectionState === 'error' && (
          <ConnectionError
            error="Failed to connect wallet"
            onRetry={retryConnection}
            onTryDifferentWallet={() => setShowWalletSelection(true)}
          />
        )}

        {connectionState === 'disconnected' && (
          <div className="text-center">
            <Button
              onClick={() => setShowWalletSelection(true)}
              disabled={!canConnect}
              size="lg"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {connectText}
            </Button>

            {!canConnect && (
              <p className="text-sm text-muted-foreground mt-2">
                Wallet connection not available in this environment
              </p>
            )}
          </div>
        )}

        {/* Inline Wallet Selection */}
        {showWalletSelection && (
          <Card>
            <CardContent className="pt-6">
              <WalletSelection
                wallets={availableWallets}
                onWalletSelect={handleWalletSelect}
                isConnecting={connectionState === 'connecting'}
              />
              <Button
                variant="ghost"
                onClick={() => setShowWalletSelection(false)}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Default modal variant
  return (
    <div className={className}>
      {connectionState === 'connected' && showStatus && walletInfo ? (
        <WalletStatus
          walletInfo={walletInfo}
          connectionState={connectionState}
          onDisconnect={handleDisconnect}
        />
      ) : (
        <Button
          onClick={() => setShowWalletSelection(true)}
          disabled={!canConnect}
        >
          <Wallet className="h-4 w-4 mr-2" />
          {connectText}
        </Button>
      )}

      {/* Modal Overlay */}
      {showWalletSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionState === 'connecting' ? (
                <ConnectionProgress
                  walletType="Wallet"
                  progress={connectionProgress}
                  currentStep={currentStep}
                />
              ) : connectionState === 'error' ? (
                <ConnectionError
                  error="Failed to connect wallet"
                  onRetry={retryConnection}
                  onTryDifferentWallet={() => setShowWalletSelection(false)}
                />
              ) : (
                <WalletSelection
                  wallets={availableWallets}
                  onWalletSelect={handleWalletSelect}
                  isConnecting={false}
                />
              )}

              <Button
                variant="ghost"
                onClick={() => setShowWalletSelection(false)}
                className="w-full"
                disabled={connectionState === 'connecting'}
              >
                {connectionState === 'connecting' ? 'Connecting...' : 'Cancel'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedWalletConnection
export type { WalletInfo, ConnectionAttempt }
