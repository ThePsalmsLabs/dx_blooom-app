'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/seperator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  ExternalLink, 
  Sparkles,
  Shield,
  Zap,
  X,
  Copy,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { formatAddress } from '@/lib/utils'
import { type Connector } from 'wagmi'

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function WalletConnectModal({ 
  isOpen, 
  onClose, 
  title = "Connect Wallet",
  description = "Choose your preferred wallet to connect to the platform"
}: WalletConnectModalProps) {
  const wallet = useWalletConnectionUI()
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
  console.log('WalletConnectModal render', { isOpen, isConnected: wallet.isConnected, connectors: wallet.connectors?.length })

  // Auto-close modal when connected (optional)
  useEffect(() => {
    if (wallet.isConnected && isOpen) {
      // Don't auto-close if showing smart account benefits
      if (!wallet.showSmartAccountBenefits) {
        setTimeout(() => onClose(), 1500)
      }
    }
  }, [wallet.isConnected, wallet.showSmartAccountBenefits, isOpen, onClose])

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const getWalletIcon = (connector: Connector) => {
    const name = connector.name.toLowerCase()
    if (name.includes('metamask')) return '🦊'
    if (name.includes('coinbase')) return '🪙'
    if (name.includes('walletconnect')) return '📱'
    return '🔗'
  }

  const getWalletName = (connector: Connector) => {
    const name = connector.name
    if (name.includes('MetaMask')) return 'MetaMask'
    if (name.includes('Coinbase')) return 'Coinbase Wallet'
    if (name.includes('WalletConnect')) return 'WalletConnect'
    return name
  }

  const getWalletDescription = (connector: Connector) => {
    const name = connector.name.toLowerCase()
    if (name.includes('metamask')) return 'Popular browser extension wallet'
    if (name.includes('coinbase')) return 'Integrated with Coinbase ecosystem'
    if (name.includes('walletconnect')) return 'Connect any mobile wallet'
    return 'Connect your wallet'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" style={{ zIndex: 999999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          {wallet.isConnected && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Connected</p>
                    <p className="text-sm text-green-700">
                      {wallet.formattedAddress}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyAddress(wallet.formattedAddress || '')}
                    className="text-green-600 hover:text-green-700"
                  >
                    {copiedAddress === wallet.formattedAddress ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Network Warning */}
          {wallet.showNetworkWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You\'re connected to {wallet.chainName}. Please switch to Base network.
              </AlertDescription>
            </Alert>
          )}

          {/* Smart Account Benefits */}
          {wallet.showSmartAccountBenefits && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="h-5 w-5" />
                  Upgrade to Smart Account
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Get gasless transactions and enhanced security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Zap className="h-4 w-4" />
                  <span>Gasless transactions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Shield className="h-4 w-4" />
                  <span>Enhanced security</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Sparkles className="h-4 w-4" />
                  <span>Batch transactions</span>
                </div>
                <Button
                  onClick={wallet.upgradeToSmartAccount}
                  disabled={wallet.isUpgrading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {wallet.isUpgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Smart Account Status */}
          {wallet.hasSmartAccount && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-purple-900">Smart Account Active</p>
                    <p className="text-sm text-purple-700">
                      {wallet.smartAccountAddress}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {wallet.isSmartAccountDeployed ? 'Deployed' : 'Not Deployed'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wallet Selection */}
          {!wallet.isConnected && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Choose your wallet:
              </p>
              {wallet.connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => wallet.handleConnectorSelect(connector)}
                  disabled={!connector.ready}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-2xl">{getWalletIcon(connector)}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{getWalletName(connector)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getWalletDescription(connector)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Connection Actions */}
          {wallet.isConnected && (
            <div className="space-y-2">
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
                onClick={wallet.disconnect}
                variant="destructive"
                className="w-full"
              >
                Disconnect Wallet
              </Button>
            </div>
          )}

          {/* Error Display */}
          {wallet.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{wallet.error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {wallet.isConnecting && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Connecting...
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Enhanced Wallet Connect Button with Modal
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
  showModal = false, // Changed default to false to use RainbowKit's modal
  children
}: WalletConnectButtonProps) {
  const wallet = useWalletConnectionUI()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    console.log('WalletConnectButton clicked', { showModal, isConnected: wallet.isConnected })
    
    if (showModal) {
      // Use custom modal
      console.log('Opening custom modal')
      setIsModalOpen(true)
    } else {
      // Use RainbowKit's modal via the wallet.connect() function
      console.log('Using RainbowKit modal')
      if (wallet.isConnected) {
        wallet.disconnect()
      } else {
        wallet.connect()
      }
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={wallet.isConnecting}
        className={cn(
          'min-w-[140px]',
          wallet.isConnected && 'bg-green-600 hover:bg-green-700',
          className
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
            {children || wallet.formattedAddress}
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            {children || 'Connect Wallet'}
          </>
        )}
      </Button>

      {/* Only render custom modal if showModal is explicitly true */}
      {showModal && (
        <WalletConnectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}

// Compact Wallet Status Component
interface WalletStatusProps {
  className?: string
  showAddress?: boolean
  showNetwork?: boolean
}

export function WalletStatus({
  className,
  showAddress = true,
  showNetwork = true
}: WalletStatusProps) {
  const wallet = useWalletConnectionUI()

  if (!wallet.isConnected) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showAddress && (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-3 w-3 text-green-600" />
          </div>
          <span className="text-sm font-medium">
            {wallet.formattedAddress}
          </span>
        </div>
      )}
      
      {showNetwork && (
        <Badge
          variant={wallet.isCorrectNetwork ? 'default' : 'destructive'}
          className="text-xs"
        >
          {wallet.chainName}
        </Badge>
      )}
      
      {wallet.hasSmartAccount && (
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          Smart Account
        </Badge>
      )}
    </div>
  )
} 