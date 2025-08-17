/**
 * Token Images Demo - Shows all token logos in use
 * This demonstrates the proper token image integration
 */

'use client'

import React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TOKEN_IMAGES = [
  { name: 'USDC', symbol: 'USDC', path: '/images/usdc-logo.webp', priority: true },
  { name: 'Ethereum', symbol: 'ETH', path: '/images/eth-logo.png', priority: false },
  { name: 'Wrapped Ethereum', symbol: 'WETH', path: '/images/weth-logo.jpeg', priority: false },
  { name: 'Coinbase Wrapped Staked ETH', symbol: 'cbETH', path: '/images/cb-eth-logo.png', priority: false },
  { name: 'DAI Stablecoin', symbol: 'DAI', path: '/images/DAI-logo.png', priority: false },
]

export function TokenImagesDemo() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Token Images Integration</CardTitle>
        <p className="text-sm text-muted-foreground">
          All token logos are now properly integrated into the responsive payment components
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOKEN_IMAGES.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center space-x-3 p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow"
            >
              {/* Token Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg">
                <Image
                  src={token.path}
                  alt={`${token.name} logo`}
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
              
              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm">{token.symbol}</span>
                  {token.priority && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                      Prioritized
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">{token.name}</p>
                <p className="text-xs text-gray-400 font-mono">{token.path}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Responsive Test Grid */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm mb-3">Responsive Token Grid Preview</h3>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {TOKEN_IMAGES.map((token) => (
              <div
                key={`preview-${token.symbol}`}
                className="flex flex-col items-center p-2 bg-white rounded-lg border"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden mb-1">
                  <Image
                    src={token.path}
                    alt={`${token.name} logo`}
                    width={24}
                    height={24}
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <span className="text-xs font-medium">{token.symbol}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}