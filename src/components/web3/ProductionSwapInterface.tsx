import React, { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, Shield, Target, Lock, AlertCircle, Zap, Activity } from 'lucide-react';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';
import { useWalletConnectionUI } from '@/hooks/ui/integration';
import { 
  useEnterpriseSwapPrice, 
  useEnterpriseSecurityValidation, 
  useEnterpriseSwapExecution,
  type SecurityValidation 
} from './EnterpriseSwapIntegration';
import type { TokenInfo } from '@/hooks/web3/useTokenBalances';

// ================================================================================
// PRODUCTION SWAP INTERFACE - Complete Enterprise Integration
// ================================================================================

/**
 * Production Swap Interface Component
 * 
 * This is a complete, production-ready swap interface that integrates with your
 * actual contract architecture including:
 * - Real PriceOracle.getMultipleQuotes integration
 * - CommerceProtocolIntegration contract execution
 * - Backend signature service integration
 * - Enterprise-grade security validation
 * - Real-time price impact analysis
 */
export function ProductionSwapInterface() {
  const walletUI = useWalletConnectionUI();
  
  // Demo tokens - in production, these would come from your token list
  const ethToken: TokenInfo = useMemo(() => ({
    address: '0x4200000000000000000000000000000000000006', // WETH on Base
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoURI: '',
    price: 0, // Will be fetched from price oracle
    balance: BigInt(0),
    balanceFormatted: '0',
    balanceUSD: 0,
    priceChange24h: 0,
    marketCap: 0,
    volume24h: 0,
    isNative: true,
    isVerified: true,
    category: 'native'
  }), []);

  const usdcToken: TokenInfo = useMemo(() => ({
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    symbol: 'USDC', 
    name: 'USD Coin',
    decimals: 6,
    logoURI: '',
    price: 0, // Will be fetched from price oracle
    balance: BigInt(0),
    balanceFormatted: '0',
    balanceUSD: 0,
    priceChange24h: 0,
    marketCap: 0,
    volume24h: 0,
    isNative: false,
    isVerified: true,
    category: 'stablecoin'
  }), []);

  // Swap state
  const [fromToken, setFromToken] = useState<TokenInfo>(ethToken);
  const [toToken, setToToken] = useState<TokenInfo>(usdcToken);
  const [fromAmount, setFromAmount] = useState<string>('1.0');
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Get user balances
  const { data: fromTokenBalance } = useBalance({
    address: walletUI.address,
    token: fromToken.address === '0x4200000000000000000000000000000000000006' ? undefined : fromToken.address,
  });

  const { data: toTokenBalance } = useBalance({
    address: walletUI.address,
    token: toToken.address === '0x4200000000000000000000000000000000000006' ? undefined : toToken.address,
  });

  // Enterprise hooks
  const priceIntegration = useEnterpriseSwapPrice(fromToken, toToken, fromAmount);
  const securityValidation = useEnterpriseSecurityValidation();
  const swapExecution = useEnterpriseSwapExecution();

  // Security validation state
  const [securityResult, setSecurityResult] = useState<SecurityValidation | null>(null);

  // Validate swap intent when parameters change
  React.useEffect(() => {
    if (walletUI.address && fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      securityValidation.validateSwapIntent(fromToken, toToken, fromAmount, walletUI.address)
        .then(setSecurityResult)
        .catch(error => {
          console.error('Security validation failed:', error);
          setSecurityResult({
            isValid: false,
            riskScore: 100,
            warnings: ['Security validation failed']
          });
        });
    } else {
      setSecurityResult(null);
    }
  }, [walletUI.address, fromToken, toToken, fromAmount, securityValidation]);

  // Calculate estimated output amount
  const estimatedOutput = useMemo(() => {
    if (!priceIntegration.priceAnalysis || !fromAmount) return '0';
    
    const { quotes, optimalPoolFee } = priceIntegration.priceAnalysis;
    let optimalQuote: bigint;
    
    switch (optimalPoolFee) {
      case 500:
        optimalQuote = quotes[0];
        break;
      case 3000:
        optimalQuote = quotes[1];
        break;
      case 10000:
        optimalQuote = quotes[2];
        break;
      default:
        optimalQuote = quotes[1]; // Default to 0.3% pool
    }
    
    return formatUnits(optimalQuote, toToken.decimals);
  }, [priceIntegration.priceAnalysis, fromAmount, toToken.decimals]);

  // Handle token swap (flip from/to)
  const handleSwapTokens = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
  }, [fromToken, toToken]);

  // Handle swap execution
  const handleExecuteSwap = useCallback(async () => {
    if (!walletUI.address || !fromToken || !toToken || !fromAmount) {
      alert('Please connect wallet and enter valid amounts');
      return;
    }

    if (!securityResult?.isValid) {
      alert('Security validation failed. Please check warnings.');
      return;
    }

    try {
      const result = await swapExecution.executeEnterpriseSwap(
        fromToken,
        toToken,
        fromAmount,
        slippageTolerance
      );

      if (!result.success) {
        console.error('Swap execution failed:', result.error);
      }
    } catch (error) {
      console.error('Swap execution error:', error);
    }
  }, [walletUI.address, fromToken, toToken, fromAmount, slippageTolerance, securityResult, swapExecution]);

  // Render price impact indicator
  const renderPriceImpactIndicator = () => {
    if (!priceIntegration.priceAnalysis) return null;

    const { priceImpact, severity, recommendation } = priceIntegration.priceAnalysis;
    
    const severityColors = {
      minimal: 'text-green-600 bg-green-50 border-green-200',
      low: 'text-blue-600 bg-blue-50 border-blue-200',
      moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      extreme: 'text-red-600 bg-red-50 border-red-200'
    };

    return (
      <div className={`p-4 rounded-lg border ${severityColors[severity]}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Price Impact Analysis</span>
          <span className="text-sm font-semibold">{priceImpact.toFixed(3)}%</span>
        </div>
        <p className="text-sm">{recommendation}</p>
        {severity === 'extreme' && (
          <div className="mt-2 flex items-center text-red-700">
            <AlertTriangle className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">High risk - consider reducing amount</span>
          </div>
        )}
      </div>
    );
  };

  // Render security status
  const renderSecurityStatus = () => {
    if (!securityResult) return null;

    return (
      <div className={`p-3 rounded-lg border ${
        securityResult.isValid 
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            {securityResult.isValid ? (
              <Shield className="w-4 h-4 mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            <span className="font-medium text-sm">
              Security Score: {100 - securityResult.riskScore}/100
            </span>
          </div>
          {securityResult.isValid ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
        </div>
        {securityResult.warnings.length > 0 && (
          <div className="text-xs">
            {securityResult.warnings.map((warning, idx) => (
              <div key={idx}>• {warning}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render execution progress
  const renderExecutionProgress = () => {
    const { executionState } = swapExecution;
    
    if (executionState.step === 'idle') return null;

    const stepIcons = {
      creating_intent: <Loader2 className="w-4 h-4 animate-spin" />,
      extracting_intent_id: <Target className="w-4 h-4" />,
      waiting_signature: <Lock className="w-4 h-4" />,
      executing_swap: <Zap className="w-4 h-4" />,
      completed: <CheckCircle2 className="w-4 h-4" />,
      error: <AlertTriangle className="w-4 h-4" />
    };

    const stepColors = {
      creating_intent: 'bg-blue-50 border-blue-200 text-blue-700',
      extracting_intent_id: 'bg-purple-50 border-purple-200 text-purple-700',
      waiting_signature: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      executing_swap: 'bg-orange-50 border-orange-200 text-orange-700',
      completed: 'bg-green-50 border-green-200 text-green-700',
      error: 'bg-red-50 border-red-200 text-red-700'
    };

    return (
      <div className={`p-4 rounded-lg border ${stepColors[executionState.step]}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {stepIcons[executionState.step]}
            <span className="ml-2 font-medium">Swap Progress</span>
          </div>
          <span className="text-sm font-semibold">{executionState.progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-current h-2 rounded-full transition-all duration-300"
            style={{ width: `${executionState.progress}%` }}
          />
        </div>
        
        <p className="text-sm">{executionState.message}</p>
        
        {executionState.estimatedTimeRemaining && (
          <div className="mt-2 flex items-center text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>Est. {executionState.estimatedTimeRemaining}s remaining</span>
          </div>
        )}
        
        {executionState.intentId && (
          <div className="mt-2 text-xs">
            <span className="font-medium">Intent ID:</span> {executionState.intentId.slice(0, 10)}...
          </div>
        )}
        
        {executionState.error && (
          <div className="mt-2 text-xs text-red-600">
            <span className="font-medium">Error:</span> {executionState.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Enterprise Swap</h2>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-slate-600">Production Ready</span>
        </div>
      </div>

      {/* From Token Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">From</label>
        <div className="flex items-center space-x-3 p-4 border border-slate-300 rounded-lg">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 text-lg font-semibold bg-transparent outline-none"
            step="any"
            min="0"
          />
          <div className="flex items-center space-x-2">
            <div className="text-slate-900 font-medium">{fromToken.symbol}</div>
          </div>
        </div>
        {fromTokenBalance && (
          <div className="mt-1 text-xs text-slate-500">
            Balance: {Number(formatUnits(fromTokenBalance.value, fromTokenBalance.decimals)).toFixed(6)} {fromToken.symbol}
          </div>
        )}
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={handleSwapTokens}
          className="p-2 rounded-full border border-slate-300 hover:border-slate-400 transition-colors"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Token Display */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">To (estimated)</label>
        <div className="flex items-center space-x-3 p-4 border border-slate-300 rounded-lg bg-slate-50">
          <div className="flex-1 text-lg font-semibold text-slate-600">
            {priceIntegration.isLoading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              parseFloat(estimatedOutput).toFixed(6)
            )}
          </div>
          <div className="text-slate-900 font-medium">{toToken.symbol}</div>
        </div>
        {toTokenBalance && (
          <div className="mt-1 text-xs text-slate-500">
            Balance: {Number(formatUnits(toTokenBalance.value, toTokenBalance.decimals)).toFixed(6)} {toToken.symbol}
          </div>
        )}
      </div>

      {/* Price Impact Analysis */}
      {renderPriceImpactIndicator()}

      {/* Security Status */}
      <div className="mt-4">
        {renderSecurityStatus()}
      </div>

      {/* Advanced Settings */}
      <div className="mt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
        
        {showAdvanced && (
          <div className="mt-3 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Slippage Tolerance: {slippageTolerance}%
              </label>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={slippageTolerance}
                onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0.1%</span>
                <span>5.0%</span>
              </div>
            </div>

            {priceIntegration.priceAnalysis && (
              <div className="mt-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Pool Analysis</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>0.05% Pool:</span>
                    <span>{formatUnits(priceIntegration.priceAnalysis.quotes[0], toToken.decimals).slice(0, 8)} {toToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>0.30% Pool:</span>
                    <span>{formatUnits(priceIntegration.priceAnalysis.quotes[1], toToken.decimals).slice(0, 8)} {toToken.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1.00% Pool:</span>
                    <span>{formatUnits(priceIntegration.priceAnalysis.quotes[2], toToken.decimals).slice(0, 8)} {toToken.symbol}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex justify-between font-medium">
                      <span>Optimal Pool:</span>
                      <span>{priceIntegration.priceAnalysis.optimalPoolFee / 100}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Execution Progress */}
      {renderExecutionProgress()}

      {/* Swap Button */}
      <div className="mt-6">
        {swapExecution.executionState.step === 'completed' ? (
          <button
            onClick={swapExecution.resetExecution}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            New Swap
          </button>
        ) : (
          <button
            onClick={handleExecuteSwap}
            disabled={
              !walletUI.address || 
              !fromAmount || 
              parseFloat(fromAmount) <= 0 || 
              !securityResult?.isValid ||
              swapExecution.isCreatingIntent ||
              swapExecution.isExecuting ||
              priceIntegration.isLoading
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {swapExecution.isCreatingIntent || swapExecution.isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {swapExecution.isCreatingIntent ? 'Creating Intent...' : 'Executing...'}
              </>
            ) : !walletUI.address ? (
              'Connect Wallet'
            ) : (
              `Swap ${fromToken.symbol} → ${toToken.symbol}`
            )}
          </button>
        )}
      </div>

      {/* Transaction Details */}
      {priceIntegration.priceAnalysis && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span>Exchange Rate:</span>
              <span>1 {fromToken.symbol} = {priceIntegration.priceAnalysis.exchangeRate.toFixed(6)} {toToken.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span>Price Impact:</span>
              <span className={`${
                priceIntegration.priceAnalysis.priceImpact > 2 ? 'text-red-600' : 
                priceIntegration.priceAnalysis.priceImpact > 1 ? 'text-orange-600' : 'text-green-600'
              }`}>
                {priceIntegration.priceAnalysis.priceImpact.toFixed(3)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Min. Received:</span>
              <span>{(parseFloat(estimatedOutput) * (1 - slippageTolerance / 100)).toFixed(6)} {toToken.symbol}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductionSwapInterface;
