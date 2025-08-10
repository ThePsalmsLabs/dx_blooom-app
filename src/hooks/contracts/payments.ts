import { useState, useCallback, useMemo, useEffect } from 'react'
import { Address, parseUnits } from 'viem'
import {
  useAccount,
  useBalance,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'

import { getContractAddresses } from '@/lib/contracts/config'
import { PAY_PER_VIEW_ABI, ERC20_ABI, CONTENT_REGISTRY_ABI, PRICE_ORACLE_ABI } from '@/lib/contracts/abis'

/* -------------------------------------------------------------------------- */
/*                                ENUMERATIONS                                */
/* -------------------------------------------------------------------------- */

export enum PaymentMethod {
  USDC = 'USDC',
  ETH = 'ETH',
  OTHER_TOKEN = 'OTHER_TOKEN'
}

export enum PaymentTier {
  SIMPLE = 'SIMPLE', // Direct USDC purchases
  ADVANCED = 'ADVANCED' // Multi-token via Commerce Protocol
}

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

interface PurchaseState {
  step: 'idle' | 'checking' | 'approving' | 'purchasing' | 'completed' | 'error'
  message: string
  progress: number
  transactionHash?: string
  error?: Error
}

interface PaymentTokenInfo {
  address: Address
  symbol: string
  decimals: number
  balance: bigint
  formattedBalance: string
  hasEnoughBalance: boolean
  needsApproval: boolean
  allowance: bigint
  requiredAmount: bigint
  priceInUSDC?: bigint // For non-USDC tokens
  isLoading: boolean
  error?: string
}

/* -------------------------------------------------------------------------- */
/*                           MAIN UNIFIED PAYMENT HOOK                        */
/* -------------------------------------------------------------------------- */

export function useUnifiedContentPurchase(
  contentId: bigint | undefined,
  userAddress: Address | undefined
) {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])

  /* ------------------------------ LOCAL STATE ------------------------------ */

  const [purchaseState, setPurchaseState] = useState<PurchaseState>({
    step: 'idle',
    message: 'Ready to purchase',
    progress: 0
  })

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.USDC)

  /* --------------------------- WAGMI INTERACTION --------------------------- */

  const { writeContract, data: txHash, error: txError } = useWriteContract()
  const {
    data: receipt,
    isSuccess: isTxSuccess,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: txHash
  })

  /* ----------------------------- READ QUERIES ----------------------------- */

  const {
    data: hasAccess,
    isLoading: isCheckingAccess
  } = useReadContract({
    address: contractAddresses?.PAY_PER_VIEW,
    abi: PAY_PER_VIEW_ABI,
    functionName: 'hasAccess',
    args: userAddress && contentId ? [contentId, userAddress] : undefined,
    query: {
      enabled: Boolean(userAddress && contentId && contractAddresses?.PAY_PER_VIEW)
    }
  })

  const { data: contentDetails, isLoading: isLoadingContent } = useReadContract({
    address: contractAddresses?.CONTENT_REGISTRY,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getContent',
    args: contentId ? [contentId] : undefined,
    query: {
      enabled: Boolean(contentId && contractAddresses?.CONTENT_REGISTRY)
    }
  })

  // Token balances & allowances ------------------------------------------------

  const { data: usdcBalance } = useBalance({
    address: userAddress,
    token: contractAddresses?.USDC,
    query: {
      enabled: Boolean(userAddress && contractAddresses?.USDC)
    }
  })

  const { data: usdcAllowance } = useReadContract({
    address: contractAddresses?.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args:
      userAddress && contractAddresses?.PAY_PER_VIEW
        ? [userAddress, contractAddresses.PAY_PER_VIEW]
        : undefined,
    query: {
      enabled: Boolean(userAddress && contractAddresses?.USDC && contractAddresses?.PAY_PER_VIEW)
    }
  })

  const { data: ethBalance } = useBalance({
    address: userAddress,
    query: { enabled: Boolean(userAddress) }
  })

  const { data: ethPriceInUSDC } = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getETHPrice',
    args: (contentDetails as { payPerViewPrice: bigint } | undefined)?.payPerViewPrice
      ? [(contentDetails as { payPerViewPrice: bigint }).payPerViewPrice]
      : undefined,
    query: {
      enabled: Boolean(
        contractAddresses?.PRICE_ORACLE &&
        (contentDetails as { payPerViewPrice?: bigint } | undefined)?.payPerViewPrice
      )
    }
  })

  /* ------------------------- TOKEN INFO DERIVATION ------------------------- */

  const paymentTokensInfo = useMemo((): Record<PaymentMethod, PaymentTokenInfo | null> => {
    const contentPrice: bigint = (contentDetails && (contentDetails as { payPerViewPrice?: bigint }).payPerViewPrice) || BigInt(0)

    if (!userAddress || contentPrice === BigInt(0)) {
      return {
        [PaymentMethod.USDC]: null,
        [PaymentMethod.ETH]: null,
        [PaymentMethod.OTHER_TOKEN]: null
      }
    }

    /* ------------------------------- USDC INFO ------------------------------ */

    const usdcInfo: PaymentTokenInfo | null = contractAddresses?.USDC
      ? {
          address: contractAddresses.USDC,
          symbol: 'USDC',
          decimals: 6,
          balance: usdcBalance?.value ?? BigInt(0),
          formattedBalance: usdcBalance?.formatted ?? '0',
          requiredAmount: contentPrice,
          hasEnoughBalance: (usdcBalance?.value ?? BigInt(0)) >= contentPrice,
          needsApproval: (usdcAllowance ?? BigInt(0)) < contentPrice,
          allowance: usdcAllowance ?? BigInt(0),
          isLoading: false,
          error: undefined
        }
      : null

    /* -------------------------------- ETH INFO ------------------------------ */

    const ethInfo: PaymentTokenInfo | null =
      contractAddresses?.COMMERCE_INTEGRATION && ethPriceInUSDC && ethBalance
        ? {
            address: '0x0000000000000000000000000000000000000000' as Address,
            symbol: 'ETH',
            decimals: 18,
            balance: ethBalance.value,
            formattedBalance: ethBalance.formatted,
            requiredAmount: (contentPrice * parseUnits('1', 18)) / (ethPriceInUSDC as bigint),
            hasEnoughBalance:
              ethBalance.value >=
              ((contentPrice * parseUnits('1', 18)) / (ethPriceInUSDC as bigint)),
            needsApproval: false,
            allowance: BigInt(0),
            priceInUSDC: ethPriceInUSDC as bigint,
            isLoading: false,
            error: undefined
          }
        : null

    return {
      [PaymentMethod.USDC]: usdcInfo,
      [PaymentMethod.ETH]: ethInfo,
      [PaymentMethod.OTHER_TOKEN]: null
    }
  }, [
    userAddress,
    contentDetails,
    usdcBalance,
    usdcAllowance,
    ethBalance,
    ethPriceInUSDC,
    contractAddresses
  ])

  /* --------------------- AVAILABLE PAYMENT METHOD ARRAY -------------------- */

  const availablePaymentMethods = useMemo((): PaymentMethod[] => {
    const available: PaymentMethod[] = []

    if (paymentTokensInfo[PaymentMethod.USDC]) available.push(PaymentMethod.USDC)

    if (
      paymentTokensInfo[PaymentMethod.ETH] &&
      contractAddresses?.COMMERCE_INTEGRATION
    )
      available.push(PaymentMethod.ETH)

    if (paymentTokensInfo[PaymentMethod.OTHER_TOKEN])
      available.push(PaymentMethod.OTHER_TOKEN)

    return available
  }, [paymentTokensInfo, contractAddresses])

  /* --------------------------- SELECTED TOKEN INFO -------------------------- */

  const selectedPaymentInfo = useMemo(() => paymentTokensInfo[selectedMethod], [
    paymentTokensInfo,
    selectedMethod
  ])

  /* -------------------------------------------------------------------------- */
  /*                               ACTIONS                                     */
  /* -------------------------------------------------------------------------- */

  const executePurchase = useCallback(
    async (method: PaymentMethod) => {
      if (!userAddress || !contentId || !contractAddresses) {
        throw new Error('Missing required parameters for purchase')
      }

      const tokenInfo = paymentTokensInfo[method]
      if (!tokenInfo) throw new Error(`Payment method ${method} not available`)
      if (!tokenInfo.hasEnoughBalance)
        throw new Error(`Insufficient ${tokenInfo.symbol} balance`)

      setPurchaseState({ step: 'checking', message: 'Preparing purchase...', progress: 20 })

      try {
        if (method === PaymentMethod.USDC) {
          return await executeUSDCPurchase(tokenInfo)
        }
        if (method === PaymentMethod.ETH || method === PaymentMethod.OTHER_TOKEN) {
          return await executeAdvancedPurchase(method, tokenInfo)
        }
        throw new Error('Unsupported payment method')
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Purchase failed')
        setPurchaseState({ step: 'error', message: error.message, progress: 0, error })
        return { success: false, error }
      }
    },
    [userAddress, contentId, contractAddresses, paymentTokensInfo]
  )

  /* ----------------------------- USDC PURCHASE ----------------------------- */

  const executeUSDCPurchase = useCallback(
    async (tokenInfo: PaymentTokenInfo) => {
      if (!contractAddresses?.PAY_PER_VIEW || !contractAddresses?.USDC || !contentId) {
        throw new Error('Missing contract addresses')
      }

      // Approve USDC if needed -------------------------------------------------
      if (tokenInfo.needsApproval) {
        setPurchaseState({
          step: 'approving',
          message: 'Approving USDC spending...',
          progress: 40
        })

        writeContract({
          address: contractAddresses.USDC,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddresses.PAY_PER_VIEW, tokenInfo.requiredAmount]
        })
      }

      // Execute direct purchase ----------------------------------------------
      setPurchaseState({ step: 'purchasing', message: 'Processing purchase...', progress: 80 })

      writeContract({
        address: contractAddresses.PAY_PER_VIEW,
        abi: PAY_PER_VIEW_ABI,
        functionName: 'purchaseContentDirect',
        args: [contentId]
      })

      return { success: true }
    },
    [writeContract, contractAddresses, contentId]
  )

  /* ------------------------ ADVANCED TOKEN PURCHASE ------------------------ */

  const executeAdvancedPurchase = useCallback(
    async (method: PaymentMethod, tokenInfo: PaymentTokenInfo) => {
      if (!contractAddresses?.COMMERCE_INTEGRATION || !contentId) {
        throw new Error('Commerce Protocol not available')
      }

      setPurchaseState({ step: 'purchasing', message: 'Creating payment intent...', progress: 60 })

      writeContract({
        address: contractAddresses.PAY_PER_VIEW,
        abi: PAY_PER_VIEW_ABI,
        functionName: 'createPurchaseIntent',
        args: [
          contentId,
          method === PaymentMethod.ETH ? 1 : 2,
          method === PaymentMethod.ETH
            ? '0x0000000000000000000000000000000000000000'
            : tokenInfo.address,
          BigInt(500) // 5% slippage tolerance
        ]
      })

      return { success: true }
    },
    [writeContract, contractAddresses, contentId]
  )

  /* --------------------- TRANSACTION RECEIPT MONITORING -------------------- */

  useEffect(() => {
    if (isTxSuccess && receipt) {
      setPurchaseState({
        step: 'completed',
        message: 'Purchase completed successfully!',
        progress: 100,
        transactionHash: receipt.transactionHash
      })
      // Invalidate all readContract caches so access checks and content details refresh
      // Wagmi read hooks use the ['readContract', ...] query key shape.
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
    }

    if (txError || receiptError) {
      setPurchaseState({
        step: 'error',
        message: txError?.message || receiptError?.message || 'Transaction failed',
        progress: 0,
        error: txError || receiptError || new Error('Unknown transaction error')
      })
    }
  }, [isTxSuccess, receipt, txError, receiptError, queryClient])

  /* ----------------------------- MISC HELPERS ------------------------------ */

  const retry = useCallback(() => {
    setPurchaseState({ step: 'idle', message: 'Ready to purchase', progress: 0 })
  }, [])

  const changePaymentMethod = useCallback(
    (method: PaymentMethod) => {
      if (availablePaymentMethods.includes(method)) setSelectedMethod(method)
    },
    [availablePaymentMethods]
  )

  /* -------------------------------- RETURN -------------------------------- */

  return {
    // general status ---------------------------------------------------------
    hasAccess: Boolean(hasAccess),
    isLoading: isCheckingAccess || isLoadingContent,
    error: null,

    // payment method data ----------------------------------------------------
    availablePaymentMethods,
    selectedMethod,
    selectedPaymentInfo,
    paymentTokensInfo,

    // purchase state ---------------------------------------------------------
    purchaseState,

    // actions ----------------------------------------------------------------
    executePurchase,
    changePaymentMethod,
    retry
  }
}
