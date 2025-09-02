/**
 * Enhanced USDC Purchase Flow Hook
 *
 * This hook provides a complete USDC purchase flow that handles:
 * - USDC balance checking
 * - USDC approval management
 * - Purchase transaction execution
 * - MiniApp compatibility
 * - Error handling and recovery
 */

'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { Address } from 'viem'

import {
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  usePurchaseContent
} from '@/hooks/contracts/core'
import { getContractAddresses } from '@/lib/contracts/config'
import { formatTokenBalance } from '@/lib/utils'

export interface USDCTransactionState {
  phase: 'idle' | 'checking_balance' | 'checking_allowance' | 'approving' | 'purchasing' | 'confirming' | 'completed' | 'error'
  progress: number
  message: string
  error?: string
  txHash?: string
}

export interface USDCTransactionResult {
  canPurchase: boolean
  needsApproval: boolean
  hasEnoughBalance: boolean
  hasEnoughAllowance: boolean
  balance: bigint
  allowance: bigint
  requiredAmount: bigint
  state: USDCTransactionState
  executePurchase: () => Promise<string>
  executeApproval: () => Promise<string>
  reset: () => void
}

/**
 * Enhanced USDC Purchase Flow Hook
 *
 * @param contentId - The content ID to purchase
 * @param contentPrice - The price in USDC (6 decimals)
 * @param userAddress - The user's wallet address
 * @returns USDC purchase flow state and actions
 */
export function useUSDCPurchaseFlow(
  contentId: bigint,
  contentPrice: bigint,
  userAddress?: Address
): USDCTransactionResult {
  const chainId = useChainId()
  const [state, setState] = useState<USDCTransactionState>({
    phase: 'idle',
    progress: 0,
    message: 'Ready to purchase'
  })

  // Get contract addresses
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])

  // Token balance and allowance
  const usdcBalance = useTokenBalance(
    contractAddresses?.USDC,
    userAddress
  )

  const usdcAllowance = useTokenAllowance(
    contractAddresses?.USDC,
    userAddress,
    contractAddresses?.PAY_PER_VIEW
  )

  // Contract hooks
  const approveToken = useApproveToken()
  const purchaseContent = usePurchaseContent()

  // Calculate purchase requirements
  const balance = usdcBalance.data || BigInt(0)
  const allowance = usdcAllowance.data || BigInt(0)
  const requiredAmount = contentPrice

  const hasEnoughBalance = balance >= requiredAmount
  const hasEnoughAllowance = allowance >= requiredAmount
  const needsApproval = !hasEnoughAllowance && hasEnoughBalance
  const canPurchase = hasEnoughBalance && hasEnoughAllowance && !!userAddress && !!contractAddresses

  // Handle approval transaction
  const executeApproval = useCallback(async (): Promise<string> => {
    if (!contractAddresses?.USDC || !contractAddresses?.PAY_PER_VIEW) {
      throw new Error('Contract addresses not available')
    }

    if (!userAddress) {
      throw new Error('Wallet not connected')
    }

    setState({
      phase: 'approving',
      progress: 10,
      message: 'Approving USDC spending...'
    })

    try {
      console.log('🔄 Starting USDC approval...', {
        token: contractAddresses.USDC,
        spender: contractAddresses.PAY_PER_VIEW,
        amount: requiredAmount.toString()
      })

      await approveToken.write({
        tokenAddress: contractAddresses.USDC,
        spender: contractAddresses.PAY_PER_VIEW,
        amount: requiredAmount
      })

      // Wait for approval transaction
      setState(prev => ({
        ...prev,
        progress: 50,
        message: 'Waiting for approval confirmation...'
      }))

      return new Promise((resolve, reject) => {
        const checkApproval = setInterval(() => {
          if (approveToken.isConfirmed && approveToken.hash) {
            clearInterval(checkApproval)
            setState({
              phase: 'completed',
              progress: 100,
              message: 'USDC approval completed!',
              txHash: approveToken.hash
            })
            resolve(approveToken.hash)
          } else if (approveToken.isError) {
            clearInterval(checkApproval)
            const errorMsg = approveToken.error?.message || 'Approval failed'
            setState({
              phase: 'error',
              progress: 0,
              message: 'Approval failed',
              error: errorMsg
            })
            reject(new Error(errorMsg))
          }
        }, 1000)

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkApproval)
          reject(new Error('Approval timeout'))
        }, 120000)
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown approval error'

      // Handle transaction cancellation
      if (errorMessage.includes('User rejected') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('rejected')) {
        setState({
          phase: 'idle',
          progress: 0,
          message: 'Approval cancelled'
        })
      } else {
        setState({
          phase: 'error',
          progress: 0,
          message: 'Approval failed',
          error: errorMessage
        })
      }

      console.error('❌ USDC approval failed:', error)
      throw error
    }
  }, [contractAddresses, userAddress, requiredAmount, approveToken])

  // Handle purchase transaction
  const executePurchase = useCallback(async (): Promise<string> => {
    if (!hasEnoughAllowance) {
      throw new Error('USDC approval required before purchase')
    }

    if (!hasEnoughBalance) {
      throw new Error(`Insufficient USDC balance. Need ${formatTokenBalance(requiredAmount - balance, 6)} more USDC.`)
    }

    setState({
      phase: 'purchasing',
      progress: 10,
      message: 'Processing USDC purchase...'
    })

    try {
      console.log('🛒 Starting USDC purchase...', {
        contentId: contentId.toString(),
        price: requiredAmount.toString()
      })

      await purchaseContent.write(contentId)

      // Wait for purchase transaction
      setState(prev => ({
        ...prev,
        progress: 50,
        message: 'Waiting for purchase confirmation...'
      }))

      return new Promise((resolve, reject) => {
        const checkPurchase = setInterval(() => {
          if (purchaseContent.isConfirmed && purchaseContent.hash) {
            clearInterval(checkPurchase)
            setState({
              phase: 'completed',
              progress: 100,
              message: 'Purchase completed successfully!',
              txHash: purchaseContent.hash
            })
            resolve(purchaseContent.hash)
          } else if (purchaseContent.isError) {
            clearInterval(checkPurchase)
            const errorMsg = purchaseContent.error?.message || 'Purchase failed'
            setState({
              phase: 'error',
              progress: 0,
              message: 'Purchase failed',
              error: errorMsg
            })
            reject(new Error(errorMsg))
          }
        }, 1000)

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkPurchase)
          reject(new Error('Purchase timeout'))
        }, 120000)
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown purchase error'

      // Handle transaction cancellation
      if (errorMessage.includes('User rejected') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('rejected')) {
        setState({
          phase: 'idle',
          progress: 0,
          message: 'Purchase cancelled'
        })
      } else {
        setState({
          phase: 'error',
          progress: 0,
          message: 'Purchase failed',
          error: errorMessage
        })
      }

      console.error('❌ USDC purchase failed:', error)
      throw error
    }
  }, [contentId, hasEnoughAllowance, hasEnoughBalance, requiredAmount, balance, purchaseContent])

  // Reset function
  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      progress: 0,
      message: 'Ready to purchase'
    })
    approveToken.reset()
    purchaseContent.reset()
  }, [approveToken, purchaseContent])

  // Update state based on loading states
  useEffect(() => {
    if (usdcBalance.isLoading || usdcAllowance.isLoading) {
      setState(prev => ({
        ...prev,
        phase: 'checking_balance',
        message: 'Checking USDC balance and allowance...'
      }))
    } else if (state.phase === 'checking_balance') {
      setState(prev => ({
        ...prev,
        phase: 'idle',
        message: canPurchase ? 'Ready to purchase' : needsApproval ? 'USDC approval required' : 'Check balance'
      }))
    }
  }, [usdcBalance.isLoading, usdcAllowance.isLoading, canPurchase, needsApproval, state.phase])

  // Handle approval confirmation
  useEffect(() => {
    if (approveToken.isConfirmed && state.phase === 'approving') {
      setState(prev => ({
        ...prev,
        progress: 100,
        message: 'USDC approval completed!'
      }))
    }
  }, [approveToken.isConfirmed, state.phase])

  // Handle purchase confirmation
  useEffect(() => {
    if (purchaseContent.isConfirmed && state.phase === 'purchasing') {
      setState(prev => ({
        ...prev,
        progress: 100,
        message: 'Purchase completed successfully!'
      }))
    }
  }, [purchaseContent.isConfirmed, state.phase])

  return {
    canPurchase,
    needsApproval,
    hasEnoughBalance,
    hasEnoughAllowance,
    balance,
    allowance,
    requiredAmount,
    state,
    executePurchase,
    executeApproval,
    reset
  }
}

export default useUSDCPurchaseFlow
