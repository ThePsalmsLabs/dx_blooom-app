/**
 * Professional Swap Modal Component
 * 
 * This component creates a Uniswap-quality swap interface that integrates
 * seamlessly with your existing design system and transaction infrastructure.
 * 
 * Educational Concept: Progressive Disclosure in Complex Interfaces
 * The swap modal demonstrates how to present complex information progressively:
 * - Essential information is immediately visible
 * - Detailed information is available on demand
 * - Risk warnings appear contextually
 * - Advanced settings are tucked away but accessible
 * 
 * This approach prevents cognitive overload while ensuring transparency.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CustomModal } from '@/components/ui/custom-modal'
import { useSwapCalculation } from '@/hooks/web3/useSwapCalculation'
import { useEnhancedTokenBalances, type TokenInfo } from '@/hooks/web3/useEnhancedTokenBalances'
import { parseUnits, type Address } from 'viem'
import { ERC20_ABI } from '@/lib/contracts/abis'
import { ArrowUpDown, Settings, Info, ArrowDown, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { getContractAddresses } from '@/lib/contracts/config'
import { cn } from '@/lib/utils'

/**
 * Swap Modal State Management
 * 
 * This interface manages all the state needed for a professional swap experience.
 * Notice how we separate concerns: UI state, transaction state, and calculation state
 * are handled independently but coordinate seamlessly.
 */
interface SwapModalState {
  readonly stage: 'input' | 'approval' | 'swap' | 'success' | 'error'
  readonly fromToken: TokenInfo | null
  readonly toToken: TokenInfo | null
  readonly fromAmount: string
  readonly slippageTolerance: number
  readonly deadline: number
  readonly showTokenSelector: 'from' | 'to' | null
  readonly showSettings: boolean
  readonly isApprovalNeeded: boolean
  readonly approvalHash: string | null
  readonly swapHash: string | null
  readonly error: string | null
}

interface SwapModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly initialFromToken?: TokenInfo | null
  readonly initialToToken?: TokenInfo | null
  readonly requiredOutputAmount?: number
  readonly onSwapComplete?: (fromToken: TokenInfo, toToken: TokenInfo, amount: string) => void
  readonly contextualMessage?: string // For purchase-related swaps
}

/**
 * Token Selector Component
 * 
 * This component provides a searchable list of available tokens for swapping.
 */
interface TokenSelectorProps {
  readonly tokens: TokenInfo[]
  readonly onSelect: (token: TokenInfo) => void
  readonly selectedToken?: TokenInfo | null
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ tokens, onSelect, selectedToken }) => {
  const [search, setSearch] = useState('')
  
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [tokens, search])
  
  return (
    <div className="space-y-4">
      <Input
        placeholder="Search tokens..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />
      <div className="max-h-60 overflow-y-auto space-y-2">
        {filteredTokens.map((token) => (
          <div
            key={token.address}
            onClick={() => onSelect(token)}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors",
              selectedToken?.address === token.address && "bg-muted"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {token.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="font-medium">{token.symbol}</div>
                <div className="text-sm text-muted-foreground">{token.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{parseFloat(token.balanceFormatted).toFixed(4)}</div>
              <div className="text-sm text-muted-foreground">
                ${(parseFloat(token.balanceFormatted) * token.price).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Main Swap Modal Component
 * 
 * This component demonstrates how to create a sophisticated financial interface
 * that guides users through complex operations while maintaining transparency
 * and building confidence at every step.
 */
export const SwapModal: React.FC<SwapModalProps> = ({
  isOpen,
  onClose,
  initialFromToken = null,
  initialToToken = null,
  requiredOutputAmount,
  onSwapComplete,
  contextualMessage
}) => {
  const { address } = useAccount()
  const chainId = useChainId()
  const { tokens, refreshBalances } = useEnhancedTokenBalances()
  const contractAddresses = getContractAddresses(chainId)
  
  /**
   * Comprehensive State Management
   * 
   * This state structure demonstrates how to manage complex UI flows.
   * Each piece of state has a specific purpose and clear ownership.
   */
  const [state, setState] = useState<SwapModalState>({
    stage: 'input',
    fromToken: initialFromToken,
    toToken: initialToToken,
    fromAmount: requiredOutputAmount ? '' : '',
    slippageTolerance: 0.5,
    deadline: 20,
    showTokenSelector: null,
    showSettings: false,
    isApprovalNeeded: false,
    approvalHash: null,
    swapHash: null,
    error: null
  })
  
  /**
   * Real-time Swap Calculation Integration
   * 
   * This demonstrates how to provide users with real-time feedback as they
   * adjust swap parameters. The calculations update immediately, helping
   * users understand the impact of their decisions.
   */
  const swapCalculation = useSwapCalculation(
    state.fromToken,
    state.toToken,
    state.fromAmount,
    state.slippageTolerance
  )
  
  /**
   * Intelligent Amount Suggestion
   * 
   * When users need a specific amount of tokens (e.g., for a purchase),
   * we calculate how much of the input token they need to provide.
   * This reverses the normal calculation flow to solve for the input.
   */
  useEffect(() => {
    if (requiredOutputAmount && state.toToken && !state.fromAmount && swapCalculation.exchangeRate > 0) {
      const requiredInputAmount = requiredOutputAmount / swapCalculation.exchangeRate
      const inputWithSlippage = requiredInputAmount * 1.01 // Add 1% buffer for slippage
      
      setState(prev => ({
        ...prev,
        fromAmount: inputWithSlippage.toFixed(6)
      }))
    }
  }, [requiredOutputAmount, state.toToken, state.fromAmount, swapCalculation.exchangeRate])
  
  /**
   * Approval Status Checking
   * 
   * This logic determines whether users need to approve token spending
   * before they can execute the swap. It demonstrates how to integrate
   * ERC-20 approval flows seamlessly into the user experience.
   */
  const { data: currentAllowance } = useReadContract({
    address: state.fromToken?.address as Address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && contractAddresses?.COMMERCE_INTEGRATION 
      ? [address, contractAddresses.COMMERCE_INTEGRATION] 
      : undefined,
    query: {
      enabled: !!address && !!state.fromToken && !state.fromToken.isNative && !!contractAddresses?.COMMERCE_INTEGRATION
    }
  })
  
  /**
   * Approval Requirement Logic
   * 
   * This effect demonstrates how to automatically detect when token approvals
   * are needed and update the UI accordingly. Users shouldn't need to think
   * about blockchain-specific concepts like token approvals.
   */
  useEffect(() => {
    if (state.fromToken && !state.fromToken.isNative && currentAllowance !== undefined && state.fromAmount) {
      try {
        const requiredAmount = parseUnits(state.fromAmount, state.fromToken.decimals)
        const needsApproval = currentAllowance < requiredAmount
        
        setState(prev => ({
          ...prev,
          isApprovalNeeded: needsApproval
        }))
      } catch (error) {
        // Handle invalid amount formatting
        setState(prev => ({ ...prev, isApprovalNeeded: false }))
      }
    } else {
      setState(prev => ({ ...prev, isApprovalNeeded: false }))
    }
  }, [currentAllowance, state.fromToken, state.fromAmount])
  
  /**
   * Transaction Execution Hooks
   * 
   * These hooks handle the actual blockchain transactions. Notice how we
   * separate approval and swap transactions - this follows the standard
   * ERC-20 pattern and provides clear feedback to users about each step.
   */
  const { writeContract: writeApproval, data: approvalHash, isPending: isApprovalPending } = useWriteContract()
  const { writeContract: writeSwap, data: swapHash, isPending: isSwapPending } = useWriteContract()
  
  const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ hash: approvalHash })
  const { isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({ hash: swapHash })
  
  /**
   * Transaction Success Handling
   * 
   * This demonstrates how to provide users with clear feedback when
   * transactions complete successfully. Good UX includes celebrating
   * user success and providing clear next steps.
   */
  useEffect(() => {
    if (isApprovalSuccess) {
      setState(prev => ({ 
        ...prev, 
        stage: 'input', 
        isApprovalNeeded: false,
        error: null
      }))
    }
  }, [isApprovalSuccess])
  
  useEffect(() => {
    if (isSwapSuccess && state.fromToken && state.toToken) {
      setState(prev => ({ ...prev, stage: 'success' }))
      refreshBalances() // Update user's balance display
      
      // Notify parent component about successful swap
      onSwapComplete?.(state.fromToken, state.toToken, state.fromAmount)
      
      // Auto-close after showing success for 2 seconds
      setTimeout(() => {
        onClose()
        setState(prev => ({ ...prev, stage: 'input' }))
      }, 3000)
    }
  }, [isSwapSuccess, state.fromToken, state.toToken, state.fromAmount, refreshBalances, onSwapComplete, onClose])
  
  /**
   * Token Selection Handler
   * 
   * This function manages token selection and prevents common user errors
   * like selecting the same token for both sides of the swap.
   */
  const handleTokenSelect = useCallback((token: TokenInfo, type: 'from' | 'to') => {
    setState(prev => {
      const newState = { ...prev, showTokenSelector: null }
      
      if (type === 'from') {
        // Prevent selecting the same token for both sides
        if (token.address === prev.toToken?.address) {
          newState.toToken = prev.fromToken // Swap the tokens
        }
        newState.fromToken = token
      } else {
        // Prevent selecting the same token for both sides
        if (token.address === prev.fromToken?.address) {
          newState.fromToken = prev.toToken // Swap the tokens
        }
        newState.toToken = token
      }
      
      // Clear amount when changing tokens to avoid confusion
      newState.fromAmount = ''
      newState.error = null
      
      return newState
    })
  }, [])
  
  /**
   * Amount Input Handler
   * 
   * This function validates user input and provides immediate feedback.
   * It demonstrates how to create responsive input handling that guides
   * users toward valid inputs.
   */
  const handleAmountChange = useCallback((value: string) => {
    // Allow only valid number input patterns
    if (value && !/^\d*\.?\d*$/.test(value)) return
    
    setState(prev => ({
      ...prev,
      fromAmount: value,
      error: null
    }))
  }, [])
  
  /**
   * Token Swap Handler
   * 
   * This function provides a convenient way for users to flip their swap
   * direction. It demonstrates how small UX improvements can significantly
   * enhance user satisfaction.
   */
  const handleSwapTokens = useCallback(() => {
    setState(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: swapCalculation.outputAmount || '',
      error: null
    }))
  }, [swapCalculation.outputAmount])
  
  /**
   * Maximum Amount Helper
   * 
   * This function helps users easily input their maximum available balance
   * while accounting for gas fees and other practical considerations.
   */
  const handleMaxClick = useCallback(() => {
    if (!state.fromToken) return
    
    const maxAmount = parseFloat(state.fromToken.balanceFormatted)
    // Reserve some ETH for gas if it's the native token
    const availableAmount = state.fromToken.isNative ? Math.max(0, maxAmount - 0.01) : maxAmount
    
    setState(prev => ({
      ...prev,
      fromAmount: availableAmount.toString()
    }))
  }, [state.fromToken])
  
  /**
   * Approval Transaction Handler
   * 
   * This function executes the token approval transaction. It demonstrates
   * how to handle blockchain transactions while providing clear user feedback.
   */
  const handleApproval = useCallback(async () => {
    if (!state.fromToken || !contractAddresses?.COMMERCE_INTEGRATION || !state.fromAmount) return
    
    try {
      setState(prev => ({ ...prev, stage: 'approval', error: null }))
      
      const amountToApprove = parseUnits(state.fromAmount, state.fromToken.decimals)
      
      await writeApproval({
        address: state.fromToken.address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contractAddresses.COMMERCE_INTEGRATION, amountToApprove]
      })
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        stage: 'error',
        error: `Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
    }
  }, [state.fromToken, state.fromAmount, contractAddresses?.COMMERCE_INTEGRATION, writeApproval])
  
  /**
   * Swap Transaction Handler
   * 
   * This function executes the actual swap transaction. In your implementation,
   * this would call your Commerce Protocol's swap functions.
   */
  const handleSwap = useCallback(async () => {
    if (!state.fromToken || !state.toToken || !address || !state.fromAmount) return
    
    try {
      setState(prev => ({ ...prev, stage: 'swap', error: null }))
      
      // In production, this would call your Commerce Protocol swap function
      // For demonstration, we'll simulate the swap process
      console.log('Executing swap:', {
        from: state.fromToken.symbol,
        to: state.toToken.symbol,
        amount: state.fromAmount,
        minOutput: swapCalculation.minimumReceived,
        slippage: state.slippageTolerance
      })
      
      // Simulate transaction processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In reality, you'd call something like:
      // await writeSwap({
      //   address: contractAddresses.COMMERCE_INTEGRATION,
      //   abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
      //   functionName: 'swapAndTransferUniswapV3Token',
      //   args: [/* swap parameters */]
      // })
      
      setState(prev => ({ ...prev, stage: 'success' }))
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        stage: 'error',
        error: `Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
    }
  }, [state.fromToken, state.toToken, state.fromAmount, address, swapCalculation.minimumReceived, state.slippageTolerance])
  
  /**
   * Action Button Logic
   * 
   * This function determines what the main action button should display
   * and what action it should perform. It demonstrates how to create
   * contextual UI that guides users through complex multi-step processes.
   */
  const getActionButtonConfig = () => {
    if (!address) return { text: "Connect Wallet", disabled: true, action: undefined }
    if (!state.fromToken || !state.toToken) return { text: "Select Tokens", disabled: true, action: undefined }
    if (!state.fromAmount || parseFloat(state.fromAmount) === 0) return { text: "Enter Amount", disabled: true, action: undefined }
    
    // Check if user has sufficient balance
    const hasBalance = state.fromToken && parseFloat(state.fromAmount) <= parseFloat(state.fromToken.balanceFormatted)
    if (!hasBalance) {
      return { 
        text: `Insufficient ${state.fromToken?.symbol} Balance`, 
        disabled: true, 
        action: undefined 
      }
    }
    
    // Approval needed
    if (state.isApprovalNeeded) {
      return { 
        text: `Approve ${state.fromToken.symbol}`, 
        disabled: isApprovalPending,
        action: handleApproval,
        loading: isApprovalPending
      }
    }
    
    // High risk warning
    if (swapCalculation.riskLevel === 'critical') {
      return { 
        text: "High Risk - Proceed Anyway", 
        disabled: !swapCalculation.isValid || isSwapPending,
        action: handleSwap,
        warning: true,
        loading: isSwapPending
      }
    }
    
    // Normal swap
    return { 
      text: "Swap Tokens", 
      disabled: !swapCalculation.isValid || isSwapPending,
      action: handleSwap,
      loading: isSwapPending
    }
  }
  
  const actionButton = getActionButtonConfig()
  
  /**
   * Modal Reset Handler
   * 
   * This function resets the modal state when it's closed, ensuring
   * users get a fresh experience each time they open it.
   */
  const handleClose = useCallback(() => {
    setState(prev => ({
      ...prev,
      stage: 'input',
      fromAmount: '',
      error: null,
      showTokenSelector: null,
      showSettings: false
    }))
    onClose()
  }, [onClose])
  
  return (
    <div className="swap-modal-container">
      <CustomModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Swap Tokens"
        maxWidth="sm:max-w-md"
        mobileBottomSheet={true}
        zIndex={10000}
      >
          <div className="space-y-3">
            {/* Settings button in footer on mobile */}
            <div className="flex justify-end md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, showSettings: true }))}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>

            {/* Action Button */}
            <Button
              onClick={actionButton.action}
              disabled={actionButton.disabled}
              className={cn(
                "w-full",
                actionButton.warning && "bg-yellow-600 hover:bg-yellow-700"
              )}
              size="lg"
            >
              {actionButton.loading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {actionButton.text}
            </Button>

            {/* Success State */}
            {state.stage === 'success' && (
              <div className="text-center text-sm text-muted-foreground">
                Swap completed successfully!
              </div>
            )}
          </div>

        {/* Desktop settings button */}
        <div className="hidden md:flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, showSettings: true }))}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
          
          <div className="space-y-4">
            {/* Contextual Message */}
            {contextualMessage && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{contextualMessage}</AlertDescription>
              </Alert>
            )}
            
            {/* From Token Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>From</span>
                {state.fromToken && (
                  <span>
                    Balance: {parseFloat(state.fromToken.balanceFormatted).toFixed(4)} {state.fromToken.symbol}
                  </span>
                )}
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Input
                        placeholder="0.0"
                        value={state.fromAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="border-0 p-0 text-2xl font-semibold bg-transparent focus-visible:ring-0"
                      />
                      {state.fromToken && state.fromAmount && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ~${(parseFloat(state.fromAmount) * state.fromToken.price).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMaxClick}
                        disabled={!state.fromToken}
                      >
                        MAX
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setState(prev => ({ ...prev, showTokenSelector: 'from' }))}
                        className="gap-2"
                      >
                        {state.fromToken ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {state.fromToken.symbol.slice(0, 2)}
                            </div>
                            {state.fromToken.symbol}
                          </>
                        ) : (
                          'Select Token'
                        )}
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Swap Arrow */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapTokens}
                className="rounded-full h-8 w-8 p-0"
                disabled={!state.fromToken || !state.toToken}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
            
            {/* To Token Output */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>To</span>
                {state.toToken && (
                  <span>
                    Balance: {tokens.find(t => t.address === state.toToken?.address)?.balanceFormatted || '0'} {state.toToken.symbol}
                  </span>
                )}
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-2xl font-semibold">
                        {swapCalculation.isLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          swapCalculation.outputAmount || '0.0'
                        )}
                      </div>
                      {state.toToken && swapCalculation.outputAmount && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ~${(parseFloat(swapCalculation.outputAmount) * state.toToken.price).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setState(prev => ({ ...prev, showTokenSelector: 'to' }))}
                      className="gap-2"
                    >
                      {state.toToken ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {state.toToken.symbol.slice(0, 2)}
                          </div>
                          {state.toToken.symbol}
                        </>
                      ) : (
                        'Select Token'
                      )}
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Swap Details */}
            {swapCalculation.isValid && state.fromToken && state.toToken && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Exchange Rate</span>
                    <span className="font-medium">
                      1 {state.fromToken.symbol} = {swapCalculation.exchangeRate.toFixed(6)} {state.toToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price Impact</span>
                    <span className={cn(
                      "font-medium",
                      swapCalculation.priceImpact > 2 ? "text-red-600" : 
                      swapCalculation.priceImpact > 0.5 ? "text-yellow-600" : "text-green-600"
                    )}>
                      {swapCalculation.priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Minimum Received</span>
                    <span className="font-medium">{swapCalculation.minimumReceived} {state.toToken.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Slippage Tolerance</span>
                    <span className="font-medium">{state.slippageTolerance}%</span>
                  </div>
                  {swapCalculation.gasEstimateUSD > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Network Fee</span>
                      <span className="font-medium">${swapCalculation.gasEstimateUSD.toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Risk Warnings */}
            {swapCalculation.warnings.length > 0 && (
              <div className="space-y-2">
                {swapCalculation.warnings.map((warning, index) => (
                  <Alert key={index} variant={warning.severity === 'critical' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">{warning.message}</div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            
            {/* Error Display */}
            {state.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            
            {/* Action Button */}
            <Button
              onClick={actionButton.action}
              disabled={actionButton.disabled}
              className={cn(
                "w-full",
                actionButton.warning && "bg-yellow-600 hover:bg-yellow-700"
              )}
              size="lg"
            >
              {actionButton.loading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {actionButton.text}
            </Button>
            
            {/* Success State */}
            {state.stage === 'success' && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800">Swap Successful!</p>
                  <p className="text-sm text-green-700">
                    Swapped {state.fromAmount} {state.fromToken?.symbol} for {swapCalculation.outputAmount} {state.toToken?.symbol}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
      </CustomModal>

      {/* Token Selection Modal */}
      <CustomModal
        isOpen={!!state.showTokenSelector}
        onClose={() => setState(prev => ({ ...prev, showTokenSelector: null }))}
        title="Select Token"
        maxWidth="sm:max-w-md"
        mobileBottomSheet={true}
        zIndex={10001}
      >
        <TokenSelector
          tokens={tokens}
          onSelect={(token) => handleTokenSelect(token, state.showTokenSelector!)}
          selectedToken={state.showTokenSelector === 'from' ? state.fromToken : state.toToken}
        />
      </CustomModal>
    </div>
  )
}
