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
  phase: 'idle' | 'checking_balance' | 'checking_allowance' | 'approving' | 'approval_confirmed' | 'purchasing' | 'confirming' | 'completed' | 'error'
  progress: number
  message: string
  error?: string
  txHash?: string
  approvalTxHash?: string // Track approval transaction separately
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
  executeApprovalAndPurchase: () => Promise<string> // New combined function
  retryFromError: () => void // Recovery function for error states
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

      // Enhanced transaction rejection detection
      const isUserRejection = errorMessage.includes('User rejected') ||
                              errorMessage.includes('User denied') ||
                              errorMessage.includes('cancelled') ||
                              errorMessage.includes('rejected') ||
                              errorMessage.includes('Transaction rejected') ||
                              errorMessage.includes('MetaMask Tx Signature: User denied')

      if (isUserRejection) {
        console.log('👤 User cancelled the approval transaction')
        setState({
          phase: 'idle',
          progress: 0,
          message: 'Ready to purchase'
        })
      } else {
        setState({
          phase: 'error',
          progress: 0,
          message: 'Approval failed',
          error: 'Transaction failed. Please try again or check your wallet connection.'
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

      // Enhanced transaction rejection detection
      const isUserRejection = errorMessage.includes('User rejected') ||
                              errorMessage.includes('User denied') ||
                              errorMessage.includes('cancelled') ||
                              errorMessage.includes('rejected') ||
                              errorMessage.includes('Transaction rejected') ||
                              errorMessage.includes('MetaMask Tx Signature: User denied')

      if (isUserRejection) {
        console.log('👤 User cancelled the purchase transaction')
        setState({
          phase: 'idle',
          progress: 0,
          message: 'Ready to purchase'
        })
      } else {
        setState({
          phase: 'error',
          progress: 0,
          message: 'Purchase failed',
          error: 'Transaction failed. Please try again or check your wallet connection.'
        })
      }

      console.error('❌ USDC purchase failed:', error)
      throw error
    }
  }, [contentId, hasEnoughAllowance, hasEnoughBalance, requiredAmount, balance, purchaseContent.write, purchaseContent.hash])

  // Enhanced reset function with comprehensive cleanup
  const reset = useCallback(() => {
    console.log('🔄 Resetting USDC purchase flow')
    setState({
      phase: 'idle',
      progress: 0,
      message: 'Ready to purchase'
    })
    
    // Reset contract hooks
    approveToken.reset()
    purchaseContent.reset()
    
    // Clear any pending timers by forcing a re-render
    // The useEffect cleanup functions will handle timer cleanup
  }, [approveToken.reset, purchaseContent.reset])

  // Silent automatic recovery function
  const handleRecoveryFromError = useCallback(() => {
    console.log('🛠️ Auto-recovering from error state')
    
    // Silently check current state and recover
    Promise.all([
      usdcBalance.refetch(),
      usdcAllowance.refetch()
    ]).then(() => {
      const currentAllowance = usdcAllowance.data || BigInt(0)
      
      // If approval went through, just move to idle state
      if (currentAllowance >= requiredAmount) {
        setState({
          phase: 'idle',
          progress: 0,
          message: 'Ready to purchase'
        })
      } else {
        // Otherwise, reset to allow retry
        setState({
          phase: 'idle',
          progress: 0,
          message: needsApproval ? 'USDC approval required' : 'Ready to purchase'
        })
      }
    })
  }, [usdcBalance.refetch, usdcAllowance.refetch, requiredAmount, needsApproval])

  // Automatic recovery for stuck states
  useEffect(() => {
    // Auto-recover from stuck approval state
    if (state.phase === 'approving') {
      const stuckTimer = setTimeout(() => {
        console.warn('⚠️ Approval state stuck for too long, auto-recovering...')
        handleRecoveryFromError()
      }, 90000) // 90 seconds max for approval state
      
      return () => clearTimeout(stuckTimer)
    }
    
    // Auto-recover from error states
    if (state.phase === 'error' && state.error) {
      const errorMessage = state.error.toLowerCase()
      
      // Auto-retry quickly for all errors
      console.log('⚡ Auto-recovering from error in 3 seconds')
      const timer = setTimeout(handleRecoveryFromError, 3000)
      return () => clearTimeout(timer)
    }
    
    // Auto-recover from stuck purchasing state
    if (state.phase === 'purchasing') {
      const stuckTimer = setTimeout(() => {
        console.warn('⚠️ Purchase state stuck for too long, auto-recovering...')
        handleRecoveryFromError()
      }, 90000) // 90 seconds max for purchase state
      
      return () => clearTimeout(stuckTimer)
    }
  }, [state.phase, state.error, handleRecoveryFromError])

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

  // Handle approval transaction states with timeout protection
  useEffect(() => {
    if (state.phase === 'approving') {
      // Set a timeout for stuck approval transactions
      const approvalTimeout = setTimeout(() => {
        console.warn('⏰ Approval transaction timeout - checking current allowance')
        
        // Force refresh allowance to see if approval actually went through
        usdcAllowance.refetch().then(() => {
          const currentAllowance = usdcAllowance.data || BigInt(0)
          
          if (currentAllowance >= requiredAmount) {
            console.log('✅ Approval actually succeeded - allowance is sufficient')
            setState({
              phase: 'approval_confirmed',
              progress: 60,
              message: 'Approval confirmed! Starting purchase...',
              approvalTxHash: approveToken.hash
            })
          } else {
            console.warn('❌ Approval timeout - transaction may be stuck')
            setState({
              phase: 'error',
              progress: 0,
              message: 'Approval taking too long',
              error: 'Transaction is taking longer than expected. Please check your wallet or try again.'
            })
          }
        })
      }, 60000) // 60 second timeout for approvals

      if (approveToken.isConfirmed && approveToken.hash) {
        clearTimeout(approvalTimeout)
        console.log('✅ USDC approval confirmed:', approveToken.hash)
        setState({
          phase: 'approval_confirmed',
          progress: 60,
          message: 'Approval confirmed! Starting purchase...',
          approvalTxHash: approveToken.hash
        })
      } else if (approveToken.isError && approveToken.error) {
        clearTimeout(approvalTimeout)
        console.error('❌ USDC approval error:', approveToken.error)
        const errorMsg = approveToken.error.message || 'Approval failed'
        
        // Enhanced user rejection detection for approval errors
        const isUserRejection = errorMsg.includes('User rejected') ||
                                errorMsg.includes('User denied') ||
                                errorMsg.includes('cancelled') ||
                                errorMsg.includes('rejected') ||
                                errorMsg.includes('Transaction rejected') ||
                                errorMsg.includes('MetaMask Tx Signature: User denied')
        
        if (isUserRejection) {
          console.log('👤 User cancelled approval during transaction processing')
          setState({
            phase: 'idle',
            progress: 0,
            message: 'Ready to purchase'
          })
        } else {
          setState({
            phase: 'error',
            progress: 0,
            message: 'Approval failed',
            error: 'Transaction failed. Please try again or check your wallet connection.'
          })
        }
      }

      return () => clearTimeout(approvalTimeout)
    }
  }, [approveToken.isConfirmed, approveToken.isError, approveToken.hash, approveToken.error, state.phase, usdcAllowance, requiredAmount])

  // Automatic purchase execution after approval confirmation with allowance waiting
  useEffect(() => {
    if (state.phase === 'approval_confirmed') {
      console.log('🔄 Auto-executing purchase after approval confirmation')
      
      let retryCount = 0
      const maxRetries = 3 // Reduced retries for faster recovery
      let pollCount = 0
      const maxPolls = 30 // Increased to 60 seconds of polling
      
      const waitForAllowanceUpdate = () => {
        return new Promise<void>((resolve, reject) => {
          const checkAllowance = async () => {
            try {
              // Force refresh allowance data with error handling
              usdcAllowance.refetch()
              
              // Small delay to let refetch complete
              await new Promise(resolve => setTimeout(resolve, 100))
              
              pollCount++
              const currentAllowance = usdcAllowance.data || BigInt(0)
              console.log(`🔍 Checking allowance update (poll ${pollCount}/${maxPolls}): current=${currentAllowance.toString()}, required=${requiredAmount.toString()}`)
              
              // Check if allowance is sufficient
              if (currentAllowance >= requiredAmount) {
                console.log('✅ Allowance confirmed on-chain, proceeding with purchase')
                resolve()
                return
              }
              
              // Continue polling if we haven't exceeded max attempts
              if (pollCount < maxPolls) {
                setTimeout(checkAllowance, 2000) // Poll every 2 seconds
              } else {
                // Before giving up, check one more time with a longer delay
                console.warn('⚠️ Final allowance check before timeout...')
                setTimeout(async () => {
                  try {
                    usdcAllowance.refetch()
                    await new Promise(resolve => setTimeout(resolve, 200))
                    const finalAllowance = usdcAllowance.data || BigInt(0)
                    if (finalAllowance >= requiredAmount) {
                      console.log('✅ Final check succeeded - allowance is sufficient')
                      resolve()
                    } else {
                      reject(new Error(`Allowance update timeout after ${(maxPolls + 1) * 2} seconds. Current: ${finalAllowance.toString()}, Required: ${requiredAmount.toString()}`))
                    }
                  } catch (error) {
                    reject(new Error(`Final allowance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
                  }
                }, 5000) // Final check after 5 seconds
              }
            } catch (error) {
              console.error(`❌ Error during allowance check (poll ${pollCount}):`, error)
              // Continue polling even if a single check fails
              if (pollCount < maxPolls) {
                setTimeout(checkAllowance, 3000) // Slightly longer delay after error
              } else {
                reject(new Error(`Allowance polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
              }
            }
          }
          
          // Start checking immediately
          checkAllowance()
        })
      }
      
      const attemptPurchase = async () => {
        try {
          // Wait for allowance to be updated on-chain before attempting purchase
          await waitForAllowanceUpdate()
          
          // Now execute the purchase with confirmed allowance
          await executePurchase()
          
        } catch (error) {
          console.error(`❌ Auto-purchase attempt ${retryCount + 1} failed:`, error)
          
          const errorMessage = error instanceof Error ? error.message : 'Auto-purchase failed after approval'
          
          // Check if this is a user rejection during auto-purchase
          const isUserRejection = errorMessage.includes('User rejected') ||
                                  errorMessage.includes('User denied') ||
                                  errorMessage.includes('cancelled') ||
                                  errorMessage.includes('rejected') ||
                                  errorMessage.includes('Transaction rejected') ||
                                  errorMessage.includes('MetaMask Tx Signature: User denied')
          
          if (isUserRejection) {
            console.log('👤 User cancelled auto-purchase after approval')
            setState({
              phase: 'idle',
              progress: 0,
              message: 'Purchase cancelled - approval completed'
            })
            return // Don't retry if user rejected
          }
          
          if (retryCount < maxRetries) {
            retryCount++
            pollCount = 0 // Reset poll count for retry
            console.log(`🔄 Retrying auto-purchase (${retryCount}/${maxRetries}) in 3 seconds...`)
            
            setState(prev => ({
              ...prev,
              message: `Retrying purchase... (${retryCount}/${maxRetries})`
            }))
            
            setTimeout(attemptPurchase, 3000)
          } else {
            setState({
              phase: 'error',
              progress: 0,
              message: 'Purchase failed - approval completed',
              error: 'Auto-purchase failed after approval. You can try purchasing again manually.'
            })
          }
        }
      }
      
      // Small initial delay for better UX feedback, then start the process
      const timer = setTimeout(attemptPurchase, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.phase, executePurchase, usdcAllowance, requiredAmount])

  // Handle purchase transaction states
  useEffect(() => {
    if (state.phase === 'purchasing') {
      if (purchaseContent.isConfirmed && purchaseContent.hash) {
        console.log('✅ USDC purchase confirmed:', purchaseContent.hash)
        setState(prev => ({
          phase: 'completed',
          progress: 100,
          message: 'Purchase completed successfully!',
          txHash: purchaseContent.hash,
          approvalTxHash: prev.approvalTxHash // Preserve approval hash
        }))
      } else if (purchaseContent.isError && purchaseContent.error) {
        console.error('❌ USDC purchase error:', purchaseContent.error)
        const errorMsg = purchaseContent.error.message || 'Purchase failed'
        
        // Enhanced user rejection detection for purchase errors
        const isUserRejection = errorMsg.includes('User rejected') ||
                                errorMsg.includes('User denied') ||
                                errorMsg.includes('cancelled') ||
                                errorMsg.includes('rejected') ||
                                errorMsg.includes('Transaction rejected') ||
                                errorMsg.includes('MetaMask Tx Signature: User denied')
        
        if (isUserRejection) {
          console.log('👤 User cancelled purchase during transaction processing')
          setState({
            phase: 'idle',
            progress: 0,
            message: 'Ready to purchase'
          })
        } else {
          setState({
            phase: 'error',
            progress: 0,
            message: 'Purchase failed',
            error: 'Transaction failed. Please try again or check your wallet connection.'
          })
        }
      }
    }
  }, [purchaseContent.isConfirmed, purchaseContent.isError, purchaseContent.hash, purchaseContent.error, state.phase])

  // Combined approval and purchase function for seamless UX
  const executeApprovalAndPurchase = useCallback(async (): Promise<string> => {
    if (!contractAddresses?.USDC || !contractAddresses?.PAY_PER_VIEW) {
      throw new Error('Contract addresses not available')
    }

    if (!userAddress) {
      throw new Error('Wallet not connected')
    }

    if (!hasEnoughBalance) {
      throw new Error(`Insufficient USDC balance. Need ${formatTokenBalance(requiredAmount - balance, 6)} more USDC.`)
    }

    console.log('🚀 Starting combined approval and purchase flow')
    
    try {
      // Start the approval process
      setState({
        phase: 'approving',
        progress: 10,
        message: 'Approving USDC spending...'
      })

      approveToken.write({
        tokenAddress: contractAddresses.USDC,
        spender: contractAddresses.PAY_PER_VIEW,
        amount: requiredAmount
      })

      setState(prev => ({
        ...prev,
        progress: 30,
        message: 'Waiting for approval confirmation...'
      }))

      // The approval confirmation and auto-purchase will be handled by useEffect hooks
      return approveToken.hash || 'pending'

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Combined approval and purchase failed'
      console.error('❌ Combined approval and purchase failed:', error)
      
      // Enhanced transaction rejection detection
      const isUserRejection = errorMessage.includes('User rejected') ||
                              errorMessage.includes('User denied') ||
                              errorMessage.includes('cancelled') ||
                              errorMessage.includes('rejected') ||
                              errorMessage.includes('Transaction rejected') ||
                              errorMessage.includes('MetaMask Tx Signature: User denied')

      if (isUserRejection) {
        console.log('👤 User cancelled the combined approval and purchase transaction')
        setState({
          phase: 'idle',
          progress: 0,
          message: 'Ready to purchase'
        })
      } else {
        setState({
          phase: 'error',
          progress: 0,
          message: 'Transaction failed',
          error: 'Transaction failed. Please try again or check your wallet connection.'
        })
      }
      
      throw error
    }
  }, [contractAddresses, userAddress, hasEnoughBalance, requiredAmount, balance, approveToken.write, approveToken.hash])

  // Add transaction timeout handling with support for new phases
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
    executeApprovalAndPurchase,
    retryFromError: handleRecoveryFromError,
    reset
  }
}

export default useUSDCPurchaseFlow
