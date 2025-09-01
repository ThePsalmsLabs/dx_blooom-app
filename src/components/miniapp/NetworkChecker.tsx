/**
 * Network Checker Component for MiniApp
 * Helps ensure users are on the correct network for transactions
 */

'use client'

import { useEffect, useState } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from 'viem/chains'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NetworkCheckerProps {
  className?: string
  showOnlyIfWrong?: boolean
}

export function NetworkChecker({ className, showOnlyIfWrong = false }: NetworkCheckerProps) {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const [isMiniApp, setIsMiniApp] = useState(false)

  // Check if we're in a MiniApp context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const miniAppCheck = window.location.pathname.startsWith('/mini') ||
                          window.parent !== window ||
                          document.referrer.includes('farcaster') ||
                          document.referrer.includes('warpcast')
      setIsMiniApp(miniAppCheck)
    }
  }, [])

  // Only show in MiniApp context or if explicitly requested
  if (!isMiniApp && showOnlyIfWrong) {
    return null
  }

  // Determine expected network
  const expectedChainId = process.env.NETWORK === 'base-sepolia' ? baseSepolia.id : base.id
  const expectedChain = expectedChainId === base.id ? base : baseSepolia
  const isCorrectNetwork = chainId === expectedChainId

  // Don't show if network is correct and showOnlyIfWrong is true
  if (isCorrectNetwork && showOnlyIfWrong) {
    return null
  }

  const handleSwitchNetwork = async () => {
    try {
      console.log(`🔄 Switching to ${expectedChain.name} (Chain ID: ${expectedChainId})`)
      await switchChain({ chainId: expectedChainId })
    } catch (error) {
      console.error('❌ Failed to switch network:', error)
    }
  }

  return (
    <Alert className={cn(
      "border",
      isCorrectNetwork
        ? "border-green-500/20 bg-green-500/5"
        : "border-yellow-500/20 bg-yellow-500/5",
      className
    )}>
      <div className="flex items-start gap-3">
        {isCorrectNetwork ? (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
        )}

        <div className="flex-1">
          <AlertTitle className={cn(
            "text-sm font-medium",
            isCorrectNetwork ? "text-green-800" : "text-yellow-800"
          )}>
            {isCorrectNetwork ? 'Network Connected' : 'Network Mismatch'}
          </AlertTitle>

          <AlertDescription className="text-sm mt-1">
            {isCorrectNetwork ? (
              <span className="text-green-700">
                Connected to {expectedChain.name}. You're ready to create transactions.
              </span>
            ) : (
              <div className="space-y-2">
                <span className="text-yellow-700">
                  You need to be connected to {expectedChain.name} to use this MiniApp.
                  Currently connected to chain ID: {chainId}.
                </span>

                <Button
                  onClick={handleSwitchNetwork}
                  disabled={isPending}
                  size="sm"
                  variant="outline"
                  className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      Switch to {expectedChain.name}
                    </>
                  )}
                </Button>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}

// Mini version for inline use
export function NetworkStatusBadge() {
  const chainId = useChainId()
  const expectedChainId = process.env.NETWORK === 'base-sepolia' ? baseSepolia.id : base.id
  const isCorrectNetwork = chainId === expectedChainId

  const expectedChain = expectedChainId === base.id ? base : baseSepolia

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={cn(
        "w-2 h-2 rounded-full",
        isCorrectNetwork ? "bg-green-500" : "bg-yellow-500"
      )} />
      <span className={cn(
        "font-medium",
        isCorrectNetwork ? "text-green-700" : "text-yellow-700"
      )}>
        {expectedChain.name}
      </span>
      {!isCorrectNetwork && (
        <span className="text-muted-foreground">
          (Current: {chainId})
        </span>
      )}
    </div>
  )
}
