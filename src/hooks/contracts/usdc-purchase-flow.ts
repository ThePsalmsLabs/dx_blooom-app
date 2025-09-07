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

      // Update progress after successful write
      setState(prev => ({
        ...prev,
        progress: 50,
        message: 'Waiting for approval confirmation...'
      }))

      // Return the transaction hash immediately after write
      // The confirmation will be handled by useEffect hooks
      return approveToken.hash || 'pending'

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
  }, [contractAddresses, userAddress, requiredAmount, approveToken.write])

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

      purchaseContent.write(contentId)

      // Update progress after successful write
      setState(prev => ({
        ...prev,
        progress: 50,
        message: 'Waiting for purchase confirmation...'
      }))

      // Return the transaction hash immediately after write
      // The confirmation will be handled by useEffect hooks
      return purchaseContent.hash || 'pending'

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
  }, [contentId, hasEnoughAllowance, hasEnoughBalance, requiredAmount, balance, purchaseContent.write, purchaseContent.hash])

  // Reset function
  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      progress: 0,
      message: 'Ready to purchase'
    })
    approveToken.reset()
    purchaseContent.reset()
  }, [approveToken.reset, purchaseContent.reset])

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

  // Handle approval transaction states
  useEffect(() => {
    if (state.phase === 'approving') {
      if (approveToken.isConfirmed && approveToken.hash) {
        console.log('✅ USDC approval confirmed:', approveToken.hash)
        setState({
          phase: 'completed',
          progress: 100,
          message: 'USDC approval completed!',
          txHash: approveToken.hash
        })
      } else if (approveToken.isError && approveToken.error) {
        console.error('❌ USDC approval error:', approveToken.error)
        const errorMsg = approveToken.error.message || 'Approval failed'
        setState({
          phase: 'error',
          progress: 0,
          message: 'Approval failed',
          error: errorMsg
        })
      }
    }
  }, [approveToken.isConfirmed, approveToken.isError, approveToken.hash, approveToken.error, state.phase])

  // Handle purchase transaction states
  useEffect(() => {
    if (state.phase === 'purchasing') {
      if (purchaseContent.isConfirmed && purchaseContent.hash) {
        console.log('✅ USDC purchase confirmed:', purchaseContent.hash)
        setState({
          phase: 'completed',
          progress: 100,
          message: 'Purchase completed successfully!',
          txHash: purchaseContent.hash
        })
      } else if (purchaseContent.isError && purchaseContent.error) {
        console.error('❌ USDC purchase error:', purchaseContent.error)
        const errorMsg = purchaseContent.error.message || 'Purchase failed'
        setState({
          phase: 'error',
          progress: 0,
          message: 'Purchase failed',
          error: errorMsg
        })
      }
    }
  }, [purchaseContent.isConfirmed, purchaseContent.isError, purchaseContent.hash, purchaseContent.error, state.phase])

  // Add transaction timeout handling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    if (state.phase === 'approving' || state.phase === 'purchasing') {
      // Set timeout for 3 minutes (180 seconds)
      timeoutId = setTimeout(() => {
        const action = state.phase === 'approving' ? 'approval' : 'purchase'
        console.warn(`⏰ Transaction timeout: ${action} taking longer than expected`)
        
        setState({
          phase: 'error',
          progress: 0,
          message: `Transaction timeout - ${action} is taking longer than expected`,
          error: `The ${action} transaction may still be processing. Please check your wallet or try again.`
        })
      }, 180000) // 3 minutes
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [state.phase])

  // Refresh allowance when approval completes
  useEffect(() => {
    if (state.phase === 'completed' && approveToken.isConfirmed) {
      // Refresh allowance data after successful approval
      console.log('🔄 Refreshing USDC allowance data after approval')
      // The allowance hook should automatically refetch when transaction confirms
      // This ensures the UI shows updated allowance immediately
    }
  }, [state.phase, approveToken.isConfirmed])

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
