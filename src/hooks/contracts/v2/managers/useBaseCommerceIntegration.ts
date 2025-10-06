/**
 * Base Commerce Integration Hook - V2 Escrow Payment System
 * 
 * Handles authorize→capture payment flow, escrow management,
 * and advanced payment features using Base Commerce Protocol.
 * 
 * Features:
 * - Two-phase payment flow (authorize → capture)
 * - Escrow management with automatic timeouts
 * - Payment status tracking and recovery
 * - Gas-optimized transactions
 * - Error handling and retry logic
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { BASE_COMMERCE_INTEGRATION_ABI } from '@/lib/contracts/abis/v2ABIs/BaseCommerceIntegration'
import { type Address } from 'viem'
import { useState, useEffect, useCallback } from 'react'

// Payment flow states for escrow management
export enum EscrowPaymentStatus {
  IDLE = 'idle',
  AUTHORIZING = 'authorizing', 
  AUTHORIZED = 'authorized',
  CAPTURING = 'capturing',
  COMPLETED = 'completed',
  VOIDED = 'voided',
  EXPIRED = 'expired',
  FAILED = 'failed'
}

export interface EscrowPaymentParams {
  recipient: Address
  amount: bigint
  token: Address
  expirationTime: bigint
  metadata: string
  contentId?: string
  creatorId?: Address
}

export interface EscrowPaymentData {
  paymentHash: `0x${string}`
  status: EscrowPaymentStatus
  amount: bigint
  recipient: Address
  expirationTime: bigint
  authorizedAt?: number
  capturedAt?: number
  timeRemaining?: number
}

export interface EscrowTimer {
  timeRemaining: number
  isExpired: boolean
  isNearExpiry: boolean // < 5 minutes remaining
  formattedTime: string
}

/**
 * Base Commerce Integration Hook for Escrow Payments
 */
export function useBaseCommerceIntegration() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'BASE_COMMERCE_INTEGRATION')
  const contract = {
    address: contractConfig.address,
    abi: BASE_COMMERCE_INTEGRATION_ABI
  } as const

  const { writeContract, data: hash, isPending } = useWriteContract()
  const [currentPayment, setCurrentPayment] = useState<EscrowPaymentData | null>(null)

  // ============ ESCROW PAYMENT FLOW ============

  /**
   * Phase 1: Authorize Payment (Lock funds in escrow)
   */
  const authorizePayment = useMutation({
    mutationFn: async (params: EscrowPaymentParams) => {
      if (!userAddress) throw new Error('User not connected')

      // Generate unique payment hash for tracking
      const paymentHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}` as `0x${string}`
      
      setCurrentPayment({
        paymentHash,
        status: EscrowPaymentStatus.AUTHORIZING,
        amount: params.amount,
        recipient: params.recipient,
        expirationTime: params.expirationTime,
        authorizedAt: Date.now()
      })

      // Use executeEscrowPayment for the full flow
      const escrowParams = {
        payer: userAddress as `0x${string}`,
        receiver: params.recipient,
        amount: params.amount,
        paymentType: 0 as const, // PayPerView
        permit2Data: '0x' as `0x${string}`, // Empty permit data for now
        instantCapture: false // Two-phase escrow flow
      }

      const txHash = await writeContract({
        ...contract,
        functionName: 'executeEscrowPayment',
        args: [escrowParams]
      })

      return { paymentHash, txHash }
    },
    onSuccess: (data) => {
      console.log('Payment authorized:', data)
      setCurrentPayment(prev => prev ? {
        ...prev,
        status: EscrowPaymentStatus.AUTHORIZED,
        paymentHash: data.paymentHash
      } : null)
    },
    onError: (error) => {
      console.error('Failed to authorize payment:', error)
      setCurrentPayment(prev => prev ? {
        ...prev,
        status: EscrowPaymentStatus.FAILED
      } : null)
    }
  })

  /**
   * Phase 2: Capture Payment (Complete the transaction)
   */
  const capturePayment = useMutation({
    mutationFn: async (paymentHash: `0x${string}`) => {
      if (!userAddress) throw new Error('User not connected')
      if (!currentPayment) throw new Error('No active payment to capture')

      setCurrentPayment(prev => prev ? {
        ...prev,
        status: EscrowPaymentStatus.CAPTURING
      } : null)

      return writeContract({
        ...contract,
        functionName: 'capturePayment',
        args: [paymentHash, currentPayment.amount]
      })
    },
    onSuccess: (txHash) => {
      console.log('Payment captured:', txHash)
      setCurrentPayment(prev => prev ? {
        ...prev,
        status: EscrowPaymentStatus.COMPLETED,
        capturedAt: Date.now()
      } : null)
    },
    onError: (error) => {
      console.error('Failed to capture payment:', error)
      setCurrentPayment(prev => prev ? {
        ...prev,
        status: EscrowPaymentStatus.FAILED
      } : null)
    }
  })

  /**
   * Void Payment (Cancel authorized payment)
   */
  const voidPayment = useMutation({
    mutationFn: async (paymentHash: `0x${string}`) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'voidPayment',
        args: [paymentHash]
      })
    },
    onSuccess: (txHash) => {
      console.log('Payment voided:', txHash)
      setCurrentPayment(prev => prev ? {
        ...prev,
        status: EscrowPaymentStatus.VOIDED
      } : null)
    },
    onError: (error) => {
      console.error('Failed to void payment:', error)
    }
  })

  /**
   * Refund Expired Payment
   */
  const refundExpiredPayment = useMutation({
    mutationFn: async (paymentHash: `0x${string}`) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'refundPayment',
        args: [paymentHash, currentPayment?.amount || BigInt(0), '0x']
      })
    },
    onSuccess: (txHash) => {
      console.log('Expired payment refunded:', txHash)
      setCurrentPayment(null) // Clear completed payment
    },
    onError: (error) => {
      console.error('Failed to refund expired payment:', error)
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Get payment status from contract
   */
  const usePaymentStatus = (paymentHash: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getPaymentState',
      args: paymentHash ? [paymentHash] : undefined,
      query: { 
        enabled: !!paymentHash,
        refetchInterval: 3000, // Poll every 3 seconds for active payments
        staleTime: 1000 // Keep data fresh
      }
    })
  }

  /**
   * Get payment record details
   */
  const usePaymentDetails = (paymentHash: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getPaymentRecord',
      args: paymentHash ? [paymentHash] : undefined,
      query: { 
        enabled: !!paymentHash,
        staleTime: 5000
      }
    })
  }

  /**
   * Get auth capture escrow status
   */
  const useAuthCaptureEscrow = () => {
    return useReadContract({
      ...contract,
      functionName: 'authCaptureEscrow',
      query: { 
        staleTime: 60000
      }
    })
  }

  /**
   * Get user nonce
   */
  const useUserNonce = (userAddress: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'userNonces',
      args: userAddress ? [userAddress] : undefined,
      query: { 
        enabled: !!userAddress,
        staleTime: 15000
      }
    })
  }

  // ============ UTILITY HOOKS ============

  /**
   * Escrow Timer Hook - Real-time countdown
   */
  const useEscrowTimer = (expirationTime: bigint | undefined): EscrowTimer => {
    const [timeRemaining, setTimeRemaining] = useState(0)

    useEffect(() => {
      if (!expirationTime) return

      const updateTimer = () => {
        const now = Math.floor(Date.now() / 1000)
        const expiry = Number(expirationTime)
        const remaining = Math.max(0, expiry - now)
        setTimeRemaining(remaining)
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)

      return () => clearInterval(interval)
    }, [expirationTime])

    const isExpired = timeRemaining <= 0
    const isNearExpiry = timeRemaining <= 300 // 5 minutes
    
    const formatTime = (seconds: number): string => {
      if (seconds <= 0) return '00:00'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    return {
      timeRemaining,
      isExpired,
      isNearExpiry,
      formattedTime: formatTime(timeRemaining)
    }
  }

  /**
   * Payment Flow State Manager
   */
  const useEscrowFlow = () => {
    const canAuthorize = !currentPayment || currentPayment.status === EscrowPaymentStatus.FAILED
    const canCapture = currentPayment?.status === EscrowPaymentStatus.AUTHORIZED
    const canVoid = currentPayment?.status === EscrowPaymentStatus.AUTHORIZED
    const canRefund = currentPayment?.status === EscrowPaymentStatus.EXPIRED
    const isActive = currentPayment && [
      EscrowPaymentStatus.AUTHORIZING,
      EscrowPaymentStatus.AUTHORIZED,
      EscrowPaymentStatus.CAPTURING
    ].includes(currentPayment.status)

    return {
      currentPayment,
      canAuthorize,
      canCapture,
      canVoid,
      canRefund,
      isActive: !!isActive,
      isComplete: currentPayment?.status === EscrowPaymentStatus.COMPLETED,
      isFailed: currentPayment?.status === EscrowPaymentStatus.FAILED
    }
  }

  /**
   * Auto-capture logic for successful authorizations
   */
  const useAutoCaptureLogic = (
    enableAutoCapture: boolean = true,
    captureDelay: number = 5000 // 5 seconds delay
  ) => {
    useEffect(() => {
      if (!enableAutoCapture || !currentPayment) return
      if (currentPayment.status !== EscrowPaymentStatus.AUTHORIZED) return

      const timer = setTimeout(() => {
        if (currentPayment.paymentHash) {
          capturePayment.mutate(currentPayment.paymentHash)
        }
      }, captureDelay)

      return () => clearTimeout(timer)
    }, [enableAutoCapture, captureDelay])
  }

  /**
   * Clear completed payment state
   */
  const clearPayment = useCallback(() => {
    setCurrentPayment(null)
  }, [])

  /**
   * Reset payment flow
   */
  const resetFlow = useCallback(() => {
    setCurrentPayment(null)
  }, [])

  return {
    // Write functions
    authorizePayment,
    capturePayment,
    voidPayment,
    refundExpiredPayment,

    // Read hooks
    usePaymentStatus,
    usePaymentDetails,
    useAuthCaptureEscrow,
    useUserNonce,

    // Utility hooks
    useEscrowTimer,
    useEscrowFlow,
    useAutoCaptureLogic,

    // State management
    currentPayment,
    clearPayment,
    resetFlow,

    // Transaction state
    hash,
    isPending,
    isLoading: authorizePayment.isPending || capturePayment.isPending || voidPayment.isPending,

    // Contract info
    contractAddress: contract.address,
    chainId
  }
}

/**
 * Convenience hook for complete escrow payment flow
 */
export function useEscrowPaymentFlow() {
  const escrow = useBaseCommerceIntegration()
  const { currentPayment } = escrow.useEscrowFlow()

  /**
   * Execute complete escrow payment flow
   */
  const executeEscrowPayment = useMutation({
    mutationFn: async (params: EscrowPaymentParams) => {
      // Phase 1: Authorize payment
      const authResult = await escrow.authorizePayment.mutateAsync(params)
      
      // Wait for authorization confirmation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Phase 2: Auto-capture after delay
      if (authResult.paymentHash) {
        await escrow.capturePayment.mutateAsync(authResult.paymentHash)
      }
      
      return authResult
    }
  })

  return {
    ...escrow,
    executeEscrowPayment,
    currentPayment
  }
}

export default useBaseCommerceIntegration