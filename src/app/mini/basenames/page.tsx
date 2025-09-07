'use client'

import React from 'react'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { Basename, BasenameWithAddress, CompactBasename } from '@/components/ui/basename'
import { MiniAppWalletProvider } from '@/contexts/MiniAppWalletContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Globe, User, Copy, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatAddress } from '@/lib/utils'

export default function MiniAppBasenamesPage() {
  const router = useRouter()
  const walletUI = useWalletConnectionUI()

  const sampleAddresses = [
    '0x742d35CC6Eb6B3d3C6B8A40B5A13E9A9B0B5F0F0',
    '0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9',
    '0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1',
  ]

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <MiniAppWalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-blue-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Base Names</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Globe className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Base Names</h1>
            </div>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Human-readable names for Ethereum addresses on Base
            </p>
          </div>

          {/* Connection Status */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Your Connection</CardTitle>
              <CardDescription>Your current wallet and Basename status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={walletUI.isConnected ? "default" : "secondary"}>
                  {walletUI.isConnected ? "Connected" : "Disconnected"}
                </Badge>
                {walletUI.isConnected && (
                  <Badge variant="outline">
                    {walletUI.address ? "Address Available" : "No Address"}
                  </Badge>
                )}
              </div>

              {walletUI.isConnected && walletUI.address && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Your Basename:</h4>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <BasenameWithAddress
                        address={walletUI.address}
                        className="text-base font-medium"
                        separator=" • "
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(walletUI.address!)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Compact Display:</h4>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <CompactBasename
                        address={walletUI.address}
                        className="text-base"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(walletUI.address!)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!walletUI.isConnected && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">
                    Connect your wallet to see your Basename display in action.
                  </p>
                  <Button onClick={walletUI.connect} disabled={walletUI.isConnecting}>
                    {walletUI.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demo Examples */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Examples</CardTitle>
              <CardDescription>Different ways to display Basenames</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sampleAddresses.map((addr, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-sm font-medium">Example {index + 1}:</h4>
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Full:</span>
                      <div className="flex items-center gap-2">
                        <BasenameWithAddress
                          address={addr}
                          className="text-sm"
                          separator=" • "
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(addr)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Compact:</span>
                      <div className="flex items-center gap-2">
                        <CompactBasename
                          address={addr}
                          className="text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(addr)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Name only:</span>
                      <div className="flex items-center gap-2">
                        <Basename
                          address={addr}
                          showAddressOnFallback={false}
                          className="text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(addr)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Integration Points */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Where You See Basenames</CardTitle>
              <CardDescription>Basenames appear throughout the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-sm">Creator Dashboard</h4>
                    <p className="text-xs text-muted-foreground">
                      Creator addresses displayed with Basenames in profile sections
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-sm">User Profile</h4>
                    <p className="text-xs text-muted-foreground">
                      Connected user Basenames in header and profile dropdown
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-sm">Content Display</h4>
                    <p className="text-xs text-muted-foreground">
                      Creator names in content cards and listings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-sm">Transaction History</h4>
                    <p className="text-xs text-muted-foreground">
                      User addresses in transaction displays and receipts
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learn More */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-4 text-center">
              <h3 className="text-lg font-semibold mb-2">About Base Names</h3>
              <p className="text-sm text-blue-100 mb-4">
                Base Names are human-readable names for Ethereum addresses on the Base network,
                making it easier to share and remember addresses.
              </p>
              <Button
                variant="secondary"
                className="w-full bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => window.open('https://docs.base.org/docs/tools/names', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn More About Base Names
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MiniAppWalletProvider>
  )
}
