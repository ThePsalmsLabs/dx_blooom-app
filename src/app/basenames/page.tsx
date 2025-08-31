'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { Basename, BasenameWithAddress, CompactBasename } from '@/components/ui/basename'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

/**
 * Basenames Demo Page
 *
 * This page demonstrates the Basename functionality for Base names integration.
 * It shows how Basenames are displayed for connected users and provides examples
 * of different display formats.
 */
export default function BasenamesPage() {
  const { address, isConnected } = useAccount()

  const sampleAddresses = [
    '0x742d35CC6Eb6B3d3C6B8A40B5A13E9A9B0B5F0F0',
    '0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9',
    '0x02feeb0AdE57b6adEEdE5A4EEea6Cf8c21BeB6B1',
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Base Names (Basenames)</h1>
            <p className="text-muted-foreground mt-1">
              Human-readable names for Ethereum addresses on Base
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Your current wallet connection and Basename display
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              {isConnected && (
                <Badge variant="outline">
                  {address ? "Address Available" : "No Address"}
                </Badge>
              )}
            </div>

            {isConnected && address && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Your Basename:</h4>
                  <BasenameWithAddress
                    address={address}
                    className="text-lg"
                    separator=" • "
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Compact Display:</h4>
                  <CompactBasename
                    address={address}
                    className="text-base"
                  />
                </div>
              </div>
            )}

            {!isConnected && (
              <p className="text-muted-foreground">
                Connect your wallet to see your Basename display in action.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Demo Examples */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Display Formats</CardTitle>
              <CardDescription>
                Different ways to display Basenames
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sampleAddresses.map((addr, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-sm font-medium">Example {index + 1}:</h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-xs text-muted-foreground">Full:</span>
                      <BasenameWithAddress
                        address={addr}
                        className="ml-2"
                        separator=" • "
                      />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Compact:</span>
                      <CompactBasename
                        address={addr}
                        className="ml-2"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Name only:</span>
                      <Basename
                        address={addr}
                        showAddressOnFallback={false}
                        className="ml-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integration Points</CardTitle>
              <CardDescription>
                Where Basenames are displayed in your app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Creator Dashboard</h4>
                    <p className="text-sm text-muted-foreground">
                      Creator addresses displayed with Basenames in profile sections
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">User Profile Dropdown</h4>
                    <p className="text-sm text-muted-foreground">
                      Connected user Basenames in header dropdown menu
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Content Display</h4>
                    <p className="text-sm text-muted-foreground">
                      Creator names in content cards and listings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Transaction History</h4>
                    <p className="text-sm text-muted-foreground">
                      User addresses in transaction displays
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              How Basenames are integrated into your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Components</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <code>Basename</code> - Main component with fallback</li>
                  <li>• <code>BasenameWithAddress</code> - Shows both name and address</li>
                  <li>• <code>CompactBasename</code> - Space-efficient display</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Automatic Basename resolution</li>
                  <li>• Graceful fallback to formatted address</li>
                  <li>• OnchainKit integration</li>
                  <li>• TypeScript support</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Usage Examples</h4>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs overflow-x-auto">
{`// Basic usage
<Basename address={userAddress} />

// With address fallback
<BasenameWithAddress
  address={userAddress}
  separator=" • "
/>

// Compact for tight spaces
<CompactBasename address={userAddress} />`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
