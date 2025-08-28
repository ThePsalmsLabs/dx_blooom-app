/**
 * Collections Management Page
 * 
 * This page provides a dedicated interface for creators to manage their NFT collections
 * on Zora. It includes collection creation, management, and analytics.
 */

'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { ZoraCollectionManager } from '@/components/creator/ZoraCollectionManager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, BarChart3, PlusCircle } from 'lucide-react'

export default function CollectionsPage() {
  const { address: userAddress } = useAccount()

  if (!userAddress) {
    return (
      <AppLayout>
        <RouteGuards requiredLevel="public">
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                <p className="text-muted-foreground">
                  Please connect your wallet to manage your NFT collections.
                </p>
              </CardContent>
            </Card>
          </div>
        </RouteGuards>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <RouteGuards requiredLevel="public">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold">NFT Collections</h1>
              <Badge variant="secondary" className="ml-2">
                Zora Integration
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Create and manage your NFT collections on Zora. Turn your content into collectible NFTs 
              to unlock new revenue streams and build your digital presence.
            </p>
          </div>

          {/* Collections Management */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Collection Management
                    </CardTitle>
                    <CardDescription>
                      Create new collections, manage existing ones, and track performance
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <PlusCircle className="h-3 w-3" />
                    Creator Tools
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ZoraCollectionManager
                  creatorAddress={userAddress}
                  onCollectionCreated={(collectionAddress) => {
                    console.log('New collection created:', collectionAddress)
                  }}
                />
              </CardContent>
            </Card>

            {/* Additional Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Collection Analytics</CardTitle>
                  <CardDescription>
                    Track performance and engagement metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Detailed analytics for your NFT collections including sales, views, and engagement metrics.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Tracking</CardTitle>
                  <CardDescription>
                    Monitor earnings from NFT sales and royalties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track your NFT revenue, royalty earnings, and payment history across all collections.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </RouteGuards>
    </AppLayout>
  )
}
