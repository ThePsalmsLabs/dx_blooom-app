// src/hooks/business/miniapp-commerce.ts
// Phase 2 – Farcaster MiniApp SDK: Production-ready MiniApp purchase flow with EIP-5792

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, useSendCalls } from 'wagmi'
import { encodeFunctionData, type Address } from 'viem'

// MiniApp environment and social context
import {
  useMiniKitAvailable,
  useFarcasterContext,
} from '@/components/providers/MiniKitProvider'

// Existing, battle-tested purchase flow (approve → purchase)
import {
  useContentPurchaseFlow,
  type ContentPurchaseFlowResult,
  type ContentPurchaseFlowStep,
} from '@/hooks/business/workflows'

// Contract configuration and ABIs
import { getContractAddresses } from '@/lib/contracts/config'
import { PAY_PER_VIEW_ABI } from '@/lib/contracts/abis/pay-per-view'

// USDC approve ABI – minimal, strict typing
const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

// ===== Types =====

export interface MiniAppPurchaseState {
  readonly isBatchProcessing: boolean
  readonly batchTxHash: string | null
  readonly isMiniAppEnvironment: boolean
  readonly hasSocialContext: boolean
}

export interface MiniAppSocialUser {
  readonly fid: number | null
  readonly username: string | null
  readonly displayName: string | null
  readonly isVerified: boolean
}

export interface MiniAppPurchaseResult extends ContentPurchaseFlowResult {
  readonly miniAppState: MiniAppPurchaseState
  readonly socialUser: MiniAppSocialUser
  readonly canUseBatchTransaction: boolean
  readonly purchaseWithBatch: () => Promise<void>
}

// ===== Hook =====

export function useMiniAppPurchaseFlow(
  contentId: bigint | undefined,
  userAddress?: Address,
): MiniAppPurchaseResult {
  // Environment and social context
  const isMiniApp = useMiniKitAvailable()
  const farcaster = useFarcasterContext()

  const { address: connectedAddress, isConnected } = useAccount()
  const chainId = useChainId()

  // Base web purchase flow (approve → purchase)
  const baseFlow = useContentPurchaseFlow(contentId, userAddress || connectedAddress)

  // Batch transaction primitive (EIP-5792)
  const { sendCalls, data: batchHash, isPending: isBatchPending, error: batchError } = useSendCalls()

  // Contract addresses for current chain
  const contracts = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.warn('Contract address resolution failed:', error)
      return null
    }
  }, [chainId])

  // MiniApp-specific UI/flow state
  const [miniAppState, setMiniAppState] = useState<MiniAppPurchaseState>({
    isBatchProcessing: false,
    batchTxHash: null,
    isMiniAppEnvironment: isMiniApp,
    hasSocialContext: Boolean(farcaster),
  })

  // Derived social user
  const socialUser: MiniAppSocialUser = useMemo(() => ({
    fid: farcaster?.user?.fid ?? null,
    username: farcaster?.user?.username ?? null,
    displayName: (farcaster as any)?.user?.displayName ?? null,
    isVerified: Boolean((farcaster as any)?.enhancedUser?.isAddressVerified),
  }), [farcaster])

  // When should we use a batch tx?
  const canUseBatchTransaction = useMemo(() => {
    return (
      isMiniApp &&
      isConnected &&
      contracts !== null &&
      baseFlow.needsApproval &&
      baseFlow.contentDetails !== null &&
      typeof contentId === 'bigint'
    )
  }, [isMiniApp, isConnected, contracts, baseFlow.needsApproval, baseFlow.contentDetails, contentId])

  // Batch purchase (USDC approve + purchase) in one confirmation
  const purchaseWithBatch = useCallback(async (): Promise<void> => {
    if (!contentId || !contracts || !baseFlow.contentDetails) {
      throw new Error('Missing required data for batch purchase')
    }

    if (!canUseBatchTransaction) {
      // Fallback to existing approve-then-purchase
      return baseFlow.approveAndPurchase()
    }

    try {
      setMiniAppState(prev => ({ ...prev, isBatchProcessing: true, batchTxHash: null }))

      const approve = {
        to: contracts.USDC as Address,
        data: encodeFunctionData({
          abi: ERC20_APPROVE_ABI,
          functionName: 'approve',
          args: [contracts.PAY_PER_VIEW as Address, baseFlow.contentDetails.payPerViewPrice],
        }),
      }

      const purchase = {
        to: contracts.PAY_PER_VIEW as Address,
        data: encodeFunctionData({
          abi: PAY_PER_VIEW_ABI as unknown as import('viem').Abi,
          functionName: 'purchaseContentDirect',
          args: [contentId],
        }),
      }

      await sendCalls({ calls: [approve, purchase] })

      // Optional: track social conversion (safe no-op if not available)
      try {
        if (farcaster && typeof window !== 'undefined') {
          console.log('MiniApp social conversion', {
            event: 'miniapp_content_purchase',
            contentId: contentId.toString(),
            fid: farcaster.user?.fid,
            username: farcaster.user?.username,
            method: 'batch',
          })
        }
      } catch {
        // ignore analytics errors
      }
    } catch (error) {
      // Surface batch error but keep flow stable
      console.error('Batch purchase failed:', error)
      setMiniAppState(prev => ({ ...prev, isBatchProcessing: false, batchTxHash: null }))
      throw error instanceof Error ? error : new Error('Batch purchase failed')
    }
  }, [contentId, contracts, baseFlow.contentDetails, baseFlow.approveAndPurchase, sendCalls, farcaster, canUseBatchTransaction])

  // Sync batch tx status
  useEffect(() => {
    if (batchHash) {
      setMiniAppState(prev => ({ ...prev, batchTxHash: (batchHash as any).id ?? String(batchHash), isBatchProcessing: false }))
    }
  }, [batchHash])

  useEffect(() => {
    if (batchError) {
      setMiniAppState(prev => ({ ...prev, isBatchProcessing: false }))
    }
  }, [batchError])

  // Return enhanced flow – keep web behavior intact
  return {
    ...baseFlow,
    // Prefer batch purchase when available
    purchase: canUseBatchTransaction ? purchaseWithBatch : baseFlow.purchase,
    isLoading: baseFlow.isLoading || isBatchPending || miniAppState.isBatchProcessing,
    flowState: {
      ...baseFlow.flowState,
      step: miniAppState.isBatchProcessing ? ('purchasing' as ContentPurchaseFlowStep) : baseFlow.flowState.step,
    },
    miniAppState,
    socialUser,
    canUseBatchTransaction,
    purchaseWithBatch,
  }
}

// ===== Helpers (optional exports) =====

export function shouldUseBatchTransaction(
  flow: ContentPurchaseFlowResult,
  isMiniAppEnv: boolean,
): boolean {
  return isMiniAppEnv && flow.needsApproval && flow.contentDetails !== null
}

export function getBatchStatusMessage(
  state: MiniAppPurchaseState,
  step: ContentPurchaseFlowStep,
): string {
  if (state.isBatchProcessing) return 'Processing approval and purchase in one step…'
  if (state.batchTxHash) return 'Batch transaction submitted'
  switch (step) {
    case 'need_approval':
      return state.isMiniAppEnvironment ? 'Ready for one-tap purchase' : 'Token approval required'
    case 'can_purchase':
      return 'Ready to purchase'
    case 'purchasing':
      return 'Processing purchase…'
    case 'completed':
      return 'Purchase complete'
    default:
      return 'Ready'
  }
}


