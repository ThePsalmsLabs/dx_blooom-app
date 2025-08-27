'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface BuyButtonProps {
  purchase: () => Promise<string>
  disabled?: boolean
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function BuyButton({
  purchase,
  disabled = false,
  children = 'Buy',
  className,
  variant = 'default',
  size = 'default'
}: BuyButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastTransactionHash, setLastTransactionHash] = useState<string | null>(null)

  const handlePurchase = useCallback(async () => {
    // Prevent double-clicks and concurrent transactions
    if (isProcessing) {
      console.warn('Purchase already in progress, ignoring duplicate request')
      return
    }

    setIsProcessing(true)
    try {
      const hash = await purchase()
      setLastTransactionHash(hash)
      
      // Show success toast with explorer link
      toast.success(
        `Payment confirmed • ${hash.slice(0, 6)}...${hash.slice(-4)}`,
        {
          action: {
            label: 'View on Explorer',
            onClick: () => window.open(`https://basescan.org/tx/${hash}`, '_blank')
          }
        }
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed'
      toast.error(`Purchase failed: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }, [purchase, isProcessing])

  return (
    <Button
      onClick={handlePurchase}
      disabled={disabled || isProcessing}
      className={className}
      variant={variant}
      size={size}
    >
      {children}
    </Button>
  )
}