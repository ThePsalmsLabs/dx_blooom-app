'use client'

import { WalletDisconnectTest } from '@/components/debug/WalletDisconnectTest'

export default function WalletTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Wallet Disconnect Test</h1>
          <p className="text-muted-foreground">
            Test the wallet disconnect flow to verify that both Privy and Wagmi
            properly synchronize when disconnecting from the navigation.
          </p>
        </div>

        <WalletDisconnectTest />

        <div className="text-center text-sm text-muted-foreground">
          <p>
            This test verifies the fix for the issue where disconnecting from the
            navigation didn't properly propagate the disconnected state throughout the app.
          </p>
        </div>
      </div>
    </div>
  )
}
