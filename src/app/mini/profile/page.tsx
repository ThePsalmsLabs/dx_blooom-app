/**
 * MiniApp Profile Page - Auto-Router
 * 
 * This page automatically routes users based on their creator status:
 * - If registered creator: routes to /mini/dashboard
 * - If not a creator: routes to /mini/onboard
 * 
 * Uses auto-connected Farcaster wallet throughout.
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { useIsCreatorRegistered } from '@/hooks/contracts/core'
import { getSafeAddress } from '@/lib/utils/wallet-utils'

export default function MiniAppProfilePage() {
  const router = useRouter()
  const wallet = useFarcasterAutoWallet()
  
  const userAddress = getSafeAddress(wallet.address)
  const isConnected = wallet.isConnected && !!wallet.address
  
  // Check creator registration using auto-connected Farcaster wallet
  const creatorRegistration = useIsCreatorRegistered(userAddress)

  // Auto-route based on creator status once wallet is connected and registration is checked
  React.useEffect(() => {
    if (isConnected && userAddress && !creatorRegistration.isLoading) {
      const isCreator = creatorRegistration.data === true
      
      if (isCreator) {
        console.log('✅ User is registered creator - routing to dashboard')
        router.push('/mini/dashboard')
      } else {
        console.log('👤 User is not a creator - routing to onboard')
        router.push('/mini/onboard')
      }
    }
  }, [isConnected, userAddress, creatorRegistration.data, creatorRegistration.isLoading, router])

  // Show loading state while determining user status
  return (
    <MiniAppLayout>
      <div className="container mx-auto px-4 space-y-2">
        <div className="text-center space-y-4 pt-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold mb-2">Loading Profile</h1>
            <p className="text-muted-foreground">
              {!isConnected 
                ? 'Connecting to your Farcaster wallet...'
                : creatorRegistration.isLoading 
                ? 'Checking your creator status...'
                : 'Redirecting...'}
            </p>
          </div>
        </div>
      </div>
    </MiniAppLayout>
  )
}