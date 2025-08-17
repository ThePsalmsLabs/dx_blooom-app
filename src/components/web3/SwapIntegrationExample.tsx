/**
 * Swap Integration Example Component
 * 
 * This component demonstrates how to integrate the Phase 2 UI components
 * with your existing swap interface. It shows the recommended pattern for
 * connecting the transaction status modal with your swap forms.
 * 
 * Integration Points:
 * 1. Wrap your app with TransactionStatusProvider
 * 2. Use useSwapTransactionIntegration in your swap components
 * 3. Connect SwapStatusModal to show transaction progress
 * 4. Handle success/error states appropriately
 */

import React, { useState } from 'react'
import { SwapStatusModal, TransactionStatusProvider } from './SwapTransactionStatus'
import { useSwapTransactionIntegration } from '@/hooks/web3/useSwapTransactionIntegration'
import { useTokenBalances } from '@/hooks/web3/useTokenBalances'
import type { TokenInfo } from '@/hooks/web3/useTokenBalances'

// Example swap form component
function SwapForm() {
  const { tokens } = useTokenBalances()
  const swapIntegration = useSwapTransactionIntegration()
  
  const [fromAmount, setFromAmount] = useState('')
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null)
  const [toToken, setToToken] = useState<TokenInfo | null>(null)
  const [slippage, setSlippage] = useState(0.5)
  
  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount) {
      alert('Please fill in all fields')
      return
    }
    
    try {
      await swapIntegration.executeSwap({
        fromToken,
        toToken,
        fromAmount,
        slippageTolerance: slippage
      })
    } catch (error) {
      console.error('Swap failed:', error)
    }
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Token Swap</h2>
      
      <div className="space-y-4">
        {/* From Token Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            From Token
          </label>
          <select
            value={fromToken?.symbol || ''}
            onChange={(e) => {
              const token = tokens.find(t => t.symbol === e.target.value)
              setFromToken(token || null)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select token</option>
            {tokens.map(token => (
              <option key={token.address} value={token.symbol}>
                {token.symbol} - {token.balanceFormatted}
              </option>
            ))}
          </select>
        </div>
        
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* To Token Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            To Token
          </label>
          <select
            value={toToken?.symbol || ''}
            onChange={(e) => {
              const token = tokens.find(t => t.symbol === e.target.value)
              setToToken(token || null)
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select token</option>
            {tokens.map(token => (
              <option key={token.address} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
        
        {/* Slippage Tolerance */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Slippage Tolerance: {slippage}%
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={swapIntegration.isSwapping || !fromToken || !toToken || !fromAmount}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {swapIntegration.isSwapping ? 'Swapping...' : 'Swap Tokens'}
        </button>
        
        {/* Progress Indicator */}
        {swapIntegration.isSwapping && (
          <div className="text-center">
            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${swapIntegration.progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600">
              {swapIntegration.currentStep}: {swapIntegration.progress}%
            </p>
          </div>
        )}
        
        {/* Error Display */}
        {swapIntegration.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{swapIntegration.error}</p>
            {swapIntegration.canRetry && (
              <button
                onClick={swapIntegration.retrySwap}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Transaction Status Modal */}
      <SwapStatusModal
        isOpen={swapIntegration.isModalOpen}
        onClose={swapIntegration.closeModal}
        fromToken={fromToken?.symbol}
        toToken={toToken?.symbol}
        amount={fromAmount}
        onRetry={swapIntegration.retrySwap}
      />
    </div>
  )
}

// Main integration example component
export function SwapIntegrationExample() {
  return (
    <TransactionStatusProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Swap Integration Example
            </h1>
            <p className="text-slate-600">
              Phase 1 + Phase 2 Integration Demo
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Swap Form */}
            <div>
              <SwapForm />
            </div>
            
            {/* Integration Instructions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Integration Steps
              </h2>
              
              <div className="prose prose-slate max-w-none">
                <ol className="list-decimal list-inside space-y-3 text-slate-600">
                  <li>
                    <strong>Wrap your app:</strong>
                    <code className="block mt-1 p-2 bg-slate-100 rounded text-sm">
                      {'<TransactionStatusProvider>'}
                      <br />
                      {'  <YourApp />'}
                      <br />
                      {'</TransactionStatusProvider>'}
                    </code>
                  </li>
                  
                  <li>
                    <strong>Use the integration hook:</strong>
                    <code className="block mt-1 p-2 bg-slate-100 rounded text-sm">
                      {'const swap = useSwapTransactionIntegration()'}
                    </code>
                  </li>
                  
                  <li>
                    <strong>Connect to your swap form:</strong>
                    <code className="block mt-1 p-2 bg-slate-100 rounded text-sm">
                      {'await swap.executeSwap({'}
                      <br />
                      {'  fromToken, toToken, fromAmount'}
                      <br />
                      {'})'}
                    </code>
                  </li>
                  
                  <li>
                    <strong>Add the status modal:</strong>
                    <code className="block mt-1 p-2 bg-slate-100 rounded text-sm">
                      {'<SwapStatusModal'}
                      <br />
                      {'  isOpen={swap.isModalOpen}'}
                      <br />
                      {'  onClose={swap.closeModal}'}
                      <br />
                      {'  onRetry={swap.retrySwap}'}
                      <br />
                      {'/>'}
                    </code>
                  </li>
                </ol>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Key Benefits:</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                    <li>Automatic progress tracking</li>
                    <li>Real-time signature polling</li>
                    <li>Built-in error handling and retry</li>
                    <li>Professional user experience</li>
                    <li>Easy integration with existing code</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TransactionStatusProvider>
  )
}

export default SwapIntegrationExample
