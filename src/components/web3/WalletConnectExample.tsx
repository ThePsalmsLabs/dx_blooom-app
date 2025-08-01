'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/seperator'
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import our plug-and-play components
import { 
  WalletConnectModal, 
  WalletConnectButton, 
  WalletStatus 
} from './WalletConnectModal'

// Import our hooks
import { 
  useWalletConnect, 
  useSimpleWalletConnect, 
  useSmartAccountConnect, 
  useNetworkConnect 
} from '@/hooks/web3/useWalletConnect'

/**
 * Comprehensive Example Component
 * 
 * This component demonstrates all the different ways to use our plug-and-play
 * wallet connection solution. It shows various patterns and use cases that
 * developers might encounter when building Web3 applications.
 */

export function WalletConnectExample() {
  const [showModal, setShowModal] = useState(false)
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Wallet Connection Examples</h1>
        <p className="text-muted-foreground">
          Comprehensive examples of our plug-and-play wallet connection solution
        </p>
      </div>

      {/* Basic Usage Examples */}
      <BasicUsageExamples />
      
      <Separator />
      
      {/* Advanced Usage Examples */}
      <AdvancedUsageExamples />
      
      <Separator />
      
      {/* Hook Usage Examples */}
      <HookUsageExamples />
      
      <Separator />
      
      {/* Custom Modal Example */}
      <CustomModalExample showModal={showModal} setShowModal={setShowModal} />
    </div>
  )
}

/**
 * Basic Usage Examples
 * 
 * Shows the simplest ways to integrate wallet connection into your app.
 */
function BasicUsageExamples() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Usage Examples</CardTitle>
        <CardDescription>
          Simple, one-line integration patterns for common use cases
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Simple Button */}
        <div className="space-y-2">
          <h3 className="font-medium">1. Simple Connect Button</h3>
          <p className="text-sm text-muted-foreground">
            Basic wallet connection button with modal
          </p>
          <WalletConnectButton />
        </div>

        {/* Button without Modal */}
        <div className="space-y-2">
          <h3 className="font-medium">2. Direct Connect Button</h3>
          <p className="text-sm text-muted-foreground">
            Button that connects directly without showing modal
          </p>
          <WalletConnectButton showModal={false} />
        </div>

        {/* Custom Styled Button */}
        <div className="space-y-2">
          <h3 className="font-medium">3. Custom Styled Button</h3>
          <p className="text-sm text-muted-foreground">
            Button with custom styling and text
          </p>
          <WalletConnectButton 
            variant="outline" 
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
          >
            🚀 Connect to Web3
          </WalletConnectButton>
        </div>

        {/* Wallet Status */}
        <div className="space-y-2">
          <h3 className="font-medium">4. Wallet Status Display</h3>
          <p className="text-sm text-muted-foreground">
            Display current wallet connection status
          </p>
          <WalletStatus showAddress showNetwork />
        </div>

      </CardContent>
    </Card>
  )
}

/**
 * Advanced Usage Examples
 * 
 * Shows more sophisticated integration patterns with custom logic.
 */
function AdvancedUsageExamples() {
  const wallet = useWalletConnect({
    onConnect: (address) => {
      console.log('Wallet connected:', address)
    },
    onDisconnect: () => {
      console.log('Wallet disconnected')
    },
    onError: (error) => {
      console.error('Wallet error:', error)
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Usage Examples</CardTitle>
        <CardDescription>
          Sophisticated patterns with custom logic and state management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Connection Status Card */}
        <div className="space-y-2">
          <h3 className="font-medium">1. Connection Status Card</h3>
          <p className="text-sm text-muted-foreground">
            Detailed connection status with all available information
          </p>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={wallet.isConnected ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {wallet.status}
                  </Badge>
                  {wallet.isConnecting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Address */}
                {wallet.formattedAddress && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Address:</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {wallet.formattedAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={wallet.copyAddress}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Network */}
                {wallet.network && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Network:</span>
                    <Badge 
                      variant={wallet.isCorrectNetwork ? 'default' : 'destructive'}
                    >
                      {wallet.network.name}
                    </Badge>
                  </div>
                )}

                {/* Smart Account */}
                {wallet.smartAccount.isEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Smart Account Active</span>
                    </div>
                    {wallet.smartAccount.address && (
                      <code className="text-sm bg-muted px-2 py-1 rounded block">
                        {wallet.smartAccount.address}
                      </code>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {!wallet.isConnected ? (
                    <Button onClick={wallet.openModal}>
                      Connect Wallet
                    </Button>
                  ) : (
                    <>
                      {!wallet.isCorrectNetwork && (
                        <Button 
                          variant="outline" 
                          onClick={() => wallet.switchNetwork(8453)}
                        >
                          Switch to Base
                        </Button>
                      )}
                      {wallet.canUpgradeToSmartAccount && (
                        <Button 
                          variant="outline"
                          onClick={wallet.upgradeToSmartAccount}
                          disabled={wallet.isUpgrading}
                        >
                          {wallet.isUpgrading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Upgrading...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Upgrade to Smart Account
                            </>
                          )}
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        onClick={wallet.disconnect}
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Wallets */}
        <div className="space-y-2">
          <h3 className="font-medium">2. Available Wallets</h3>
          <p className="text-sm text-muted-foreground">
            List of available wallet connectors
          </p>
          <div className="grid gap-2">
            {wallet.availableWallets.map((walletInfo, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <span className="text-2xl">{walletInfo.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{walletInfo.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {walletInfo.description}
                  </p>
                </div>
                <Badge variant={walletInfo.isReady ? 'default' : 'secondary'}>
                  {walletInfo.isReady ? 'Ready' : 'Not Available'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {wallet.error && (
          <div className="space-y-2">
            <h3 className="font-medium">3. Error Handling</h3>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{wallet.error}</AlertDescription>
            </Alert>
            <Button variant="outline" onClick={wallet.clearError}>
              Clear Error
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

/**
 * Hook Usage Examples
 * 
 * Shows how to use the different specialized hooks for specific use cases.
 */
function HookUsageExamples() {
  // Simple hook for basic needs
  const simpleWallet = useSimpleWalletConnect()
  
  // Smart Account specific hook
  const smartAccount = useSmartAccountConnect()
  
  // Network specific hook
  const network = useNetworkConnect()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hook Usage Examples</CardTitle>
        <CardDescription>
          Specialized hooks for different use cases and requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Simple Hook */}
        <div className="space-y-2">
          <h3 className="font-medium">1. Simple Hook (useSimpleWalletConnect)</h3>
          <p className="text-sm text-muted-foreground">
            Minimal interface for basic wallet connection needs
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              <Badge variant={simpleWallet.isConnected ? 'default' : 'secondary'}>
                {simpleWallet.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            {simpleWallet.formattedAddress && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Address:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {simpleWallet.formattedAddress}
                </code>
              </div>
            )}
            <div className="flex gap-2">
              {!simpleWallet.isConnected ? (
                <Button onClick={() => simpleWallet.connect()}>
                  Connect
                </Button>
              ) : (
                <Button variant="destructive" onClick={simpleWallet.disconnect}>
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Smart Account Hook */}
        <div className="space-y-2">
          <h3 className="font-medium">2. Smart Account Hook (useSmartAccountConnect)</h3>
          <p className="text-sm text-muted-foreground">
            Focused access to Smart Account functionality
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Smart Account:</span>
              <Badge variant={smartAccount.smartAccount.isEnabled ? 'default' : 'secondary'}>
                {smartAccount.smartAccount.isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {smartAccount.smartAccount.address && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Address:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {smartAccount.smartAccount.address}
                </code>
              </div>
            )}
            {smartAccount.canUpgrade && (
              <Button 
                onClick={smartAccount.upgrade}
                disabled={smartAccount.isUpgrading}
              >
                {smartAccount.isUpgrading ? 'Upgrading...' : 'Upgrade to Smart Account'}
              </Button>
            )}
          </div>
        </div>

        {/* Network Hook */}
        <div className="space-y-2">
          <h3 className="font-medium">3. Network Hook (useNetworkConnect)</h3>
          <p className="text-sm text-muted-foreground">
            Network switching and validation functionality
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Current Network:</span>
              <Badge 
                variant={network.isCorrectNetwork ? 'default' : 'destructive'}
              >
                {network.network?.name || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Supported Networks:</span>
              <div className="flex gap-1">
                {network.supportedNetworks.map((net) => (
                  <Badge 
                    key={net.id} 
                    variant="outline"
                    className="text-xs"
                  >
                    {net.name}
                  </Badge>
                ))}
              </div>
            </div>
            {!network.isCorrectNetwork && network.network && (
              <Button 
                variant="outline"
                onClick={() => network.switchNetwork(8453)}
              >
                Switch to Base Mainnet
              </Button>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}

/**
 * Custom Modal Example
 * 
 * Shows how to create custom modal implementations with the provided hooks.
 */
function CustomModalExample({ 
  showModal, 
  setShowModal 
}: { 
  showModal: boolean
  setShowModal: (show: boolean) => void 
}) {
  const wallet = useWalletConnect()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Modal Example</CardTitle>
        <CardDescription>
          Custom modal implementation using the wallet connection hooks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Custom Modal Trigger */}
        <div className="space-y-2">
          <h3 className="font-medium">1. Custom Modal Trigger</h3>
          <p className="text-sm text-muted-foreground">
            Button that opens a custom modal implementation
          </p>
          <Button onClick={() => setShowModal(true)}>
            Open Custom Modal
          </Button>
        </div>

        {/* Custom Modal Implementation */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Custom Wallet Modal</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {/* Connection Status */}
                {wallet.isConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Connected</span>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm font-mono">{wallet.formattedAddress}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={wallet.copyAddress}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Address
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={wallet.disconnect}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">
                      Choose your wallet to connect:
                    </p>
                    {wallet.availableWallets.map((walletInfo, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto p-4"
                        onClick={() => {
                          // Find the connector and connect
                          const connector = wallet.availableWallets[index]
                          if (connector) {
                            wallet.connect()
                          }
                        }}
                        disabled={!walletInfo.isReady}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <span className="text-2xl">{walletInfo.icon}</span>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{walletInfo.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {walletInfo.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Error Display */}
                {wallet.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{wallet.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Built-in Modal for Comparison */}
        <div className="space-y-2">
          <h3 className="font-medium">2. Built-in Modal for Comparison</h3>
          <p className="text-sm text-muted-foreground">
            The built-in modal with all features included
          </p>
          <WalletConnectModal
            isOpen={wallet.showModal}
            onClose={wallet.closeModal}
            title="Built-in Modal"
            description="This is the full-featured built-in modal"
          />
          <Button onClick={wallet.openModal}>
            Open Built-in Modal
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}

/**
 * Usage Instructions
 * 
 * This component shows how to use the wallet connection solution in your app.
 */
export function WalletConnectUsageInstructions() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900">Usage Instructions</CardTitle>
        <CardDescription className="text-blue-700">
          How to integrate the wallet connection solution into your app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-blue-800">
        
        <div className="space-y-2">
          <h4 className="font-medium">1. Basic Integration</h4>
          <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
{`// Simple button with modal
<WalletConnectButton />

// Button without modal
<WalletConnectButton showModal={false} />

// Custom styling
<WalletConnectButton 
  variant="outline" 
  size="lg"
  className="custom-class"
>
  Connect Wallet
</WalletConnectButton>`}
          </pre>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">2. Using Hooks</h4>
          <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
{`// Full-featured hook
const wallet = useWalletConnect({
  onConnect: (address) => console.log('Connected:', address),
  onDisconnect: () => console.log('Disconnected'),
  onError: (error) => console.error('Error:', error)
})

// Simple hook for basic needs
const simpleWallet = useSimpleWalletConnect()

// Smart Account specific
const smartAccount = useSmartAccountConnect()

// Network specific
const network = useNetworkConnect()`}
          </pre>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">3. Custom Modal</h4>
          <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
{`// Custom modal implementation
<WalletConnectModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Custom Title"
  description="Custom description"
/>`}
          </pre>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">4. Status Display</h4>
          <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
{`// Show wallet status
<WalletStatus showAddress showNetwork />

// Custom status display
const wallet = useWalletConnect()
return (
  <div>
    <Badge>{wallet.status}</Badge>
    <span>{wallet.formattedAddress}</span>
  </div>
)`}
          </pre>
        </div>

      </CardContent>
    </Card>
  )
} 