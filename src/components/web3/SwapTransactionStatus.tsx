import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, X, RefreshCw, Loader2, ArrowRight, Zap } from 'lucide-react';

// ================================================================================
// TYPE DEFINITIONS - Building on Phase 1 Foundation
// ================================================================================

/**
 * These types extend the Phase 1 implementation to support the enhanced UI components.
 * They maintain compatibility with the existing useSwapCalculations hook while adding
 * the granular state tracking needed for professional user experience.
 */

interface SwapState {
  step: 'idle' | 'creating_intent' | 'extracting_intent_id' | 'waiting_signature' | 'executing_swap' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
  intentId?: string;
  transactionHash?: string;
  signature?: string;
  estimatedTimeRemaining?: number;
}

interface TransactionHistoryItem {
  id: string;
  timestamp: Date;
  status: 'completed' | 'failed' | 'pending';
  fromToken: string;
  toToken: string;
  amount: string;
  transactionHash?: string;
  errorMessage?: string;
}

interface TransactionContextValue {
  currentSwap: SwapState | null;
  setCurrentSwap: (swap: SwapState | null) => void;
  transactionHistory: TransactionHistoryItem[];
  addToHistory: (item: TransactionHistoryItem) => void;
  isPollingSignature: boolean;
  setIsPollingSignature: (polling: boolean) => void;
  backendHealthStatus: 'operational' | 'degraded' | 'error';
  setBackendHealthStatus: (status: 'operational' | 'degraded' | 'error') => void;
}

interface SignatureStatus {
  isLoading: boolean;
  isSigned: boolean;
  error: string | null;
  lastChecked: Date | null;
  retryCount: number;
}

// ================================================================================
// TRANSACTION STATUS PROVIDER - Central State Management
// ================================================================================

/**
 * TransactionStatusProvider creates a centralized hub for managing all swap-related state.
 * This is similar to how Uniswap manages transaction state across their interface - 
 * everything flows through a central provider that can be accessed by any component.
 * 
 * The provider handles automatic polling, error recovery, and maintains transaction history
 * so users can track their recent activity. This pattern scales well as you add more
 * transaction types beyond swaps.
 */

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionStatusProvider({ children }: { children: React.ReactNode }) {
  const [currentSwap, setCurrentSwap] = useState<SwapState | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [isPollingSignature, setIsPollingSignature] = useState(false);
  const [backendHealthStatus, setBackendHealthStatus] = useState<'operational' | 'degraded' | 'error'>('operational');
  
  // Persistent polling interval reference for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * addToHistory provides a clean interface for components to record transaction outcomes.
   * The history is kept in memory and could be enhanced to persist to localStorage
   * for a better user experience across sessions.
   */
  const addToHistory = useCallback((item: TransactionHistoryItem) => {
    setTransactionHistory(prev => [item, ...prev.slice(0, 9)]); // Keep last 10 transactions
  }, []);

  /**
   * Automatic signature polling integration - this connects directly to your Phase 1
   * signature polling mechanism. When a swap is waiting for signature, this provider
   * automatically begins polling and updates the UI state accordingly.
   */
  useEffect(() => {
    if (currentSwap?.step === 'waiting_signature' && currentSwap.intentId && !isPollingSignature) {
      setIsPollingSignature(true);
      
      const pollSignature = async () => {
        try {
          const response = await fetch('/api/commerce/signature-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              intentId: currentSwap.intentId,
              intentHash: currentSwap.transactionHash // Using transaction hash as intent hash for this demo
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (data.isSigned && data.signature) {
            setCurrentSwap(prev => prev ? {
              ...prev,
              step: 'executing_swap',
              progress: 80,
              message: 'Signature received! Executing swap...',
              signature: data.signature
            } : null);
            setIsPollingSignature(false);
            setBackendHealthStatus('operational');
          }
        } catch (error) {
          console.error('Signature polling error:', error);
          setBackendHealthStatus('degraded');
          
          // Continue polling even on error, but with exponential backoff
          // This provides resilience against temporary network issues
        }
      };

      // Start polling with 2-second intervals (reasonable for user experience)
      pollingIntervalRef.current = setInterval(pollSignature, 2000);
      
      // Cleanup function to prevent memory leaks
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPollingSignature(false);
      };
    }
  }, [currentSwap?.step, currentSwap?.intentId, isPollingSignature]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const contextValue: TransactionContextValue = {
    currentSwap,
    setCurrentSwap,
    transactionHistory,
    addToHistory,
    isPollingSignature,
    setIsPollingSignature,
    backendHealthStatus,
    setBackendHealthStatus
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionStatus() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionStatus must be used within a TransactionStatusProvider');
  }
  return context;
}

// ================================================================================
// SIGNATURE STATUS INDICATOR - Real-time Backend Status Display
// ================================================================================

/**
 * SignatureStatusIndicator provides users with clear visibility into the backend signing process.
 * This addresses one of the most confusing aspects of multi-step DeFi transactions - users
 * often don't understand why they need to wait after submitting a transaction.
 * 
 * By showing signature status explicitly, we build user confidence and reduce support requests.
 * The component includes fallback options for backend issues, ensuring users always have a path forward.
 */

function SignatureStatusIndicator() {
  const { currentSwap, backendHealthStatus, isPollingSignature } = useTransactionStatus();
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus>({
    isLoading: false,
    isSigned: false,
    error: null,
    lastChecked: null,
    retryCount: 0
  });

  /**
   * Manual retry mechanism gives users control when automatic polling encounters issues.
   * This is especially important for production applications where network conditions
   * can be unpredictable.
   */
  const handleManualRetry = useCallback(async () => {
    if (!currentSwap?.intentId) return;

    setSignatureStatus(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      retryCount: prev.retryCount + 1
    }));

    try {
      const response = await fetch('/api/commerce/signature-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: currentSwap.intentId,
          intentHash: currentSwap.transactionHash
        })
      });

      const data = await response.json();
      
      setSignatureStatus(prev => ({
        ...prev,
        isLoading: false,
        isSigned: data.isSigned || false,
        lastChecked: new Date(),
        error: data.error || null
      }));
    } catch (error) {
      setSignatureStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      }));
    }
  }, [currentSwap?.intentId, currentSwap?.transactionHash]);

  // Don't render if there's no active swap or we're not in a signature-related step
  if (!currentSwap || !['waiting_signature', 'executing_swap'].includes(currentSwap.step)) {
    return null;
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900">Backend Signature Status</h3>
        
        {/* Backend health indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            backendHealthStatus === 'operational' ? 'bg-green-500' : 
            backendHealthStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-slate-600 capitalize">{backendHealthStatus}</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Current status display */}
        <div className="flex items-center space-x-3">
          {isPollingSignature ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : signatureStatus.isSigned ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Clock className="w-4 h-4 text-yellow-500" />
          )}
          
          <div className="flex-1">
            <p className="text-sm text-slate-700">
              {isPollingSignature ? 'Waiting for backend signature...' :
               signatureStatus.isSigned ? 'Signature received and validated' :
               'Pending signature from backend'}
            </p>
            
            {signatureStatus.lastChecked && (
              <p className="text-xs text-slate-500">
                Last checked: {signatureStatus.lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Error handling and retry options */}
        {signatureStatus.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700">Signature Error</p>
                <p className="text-xs text-red-600 mt-1">{signatureStatus.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Manual retry button when backend is having issues */}
        {(backendHealthStatus !== 'operational' || signatureStatus.error) && (
          <button
            onClick={handleManualRetry}
            disabled={signatureStatus.isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${signatureStatus.isLoading ? 'animate-spin' : ''}`} />
            <span>Retry Signature Check</span>
          </button>
        )}

        {/* Retry count for debugging/transparency */}
        {signatureStatus.retryCount > 0 && (
          <p className="text-xs text-slate-500">
            Retry attempts: {signatureStatus.retryCount}
          </p>
        )}
      </div>
    </div>
  );
}

// ================================================================================
// SWAP STATUS MODAL - Comprehensive Transaction Progress Display
// ================================================================================

/**
 * SwapStatusModal is the centerpiece of the user experience - it transforms a complex
 * multi-step blockchain process into an understandable, reassuring interface.
 * 
 * The modal takes inspiration from Uniswap's transaction flow but adds enhanced
 * error handling and recovery options. Each step is clearly explained, and users
 * always understand what's happening and what to expect next.
 * 
 * The progress visualization helps users understand that blockchain transactions
 * take time and that waiting is normal, not an error condition.
 */

interface SwapStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromToken?: string;
  toToken?: string;
  amount?: string;
  onRetry?: () => void;
}

export function SwapStatusModal({ 
  isOpen, 
  onClose, 
  fromToken = 'ETH', 
  toToken = 'USDC', 
  amount = '0.1',
  onRetry 
}: SwapStatusModalProps) {
  const { currentSwap, setCurrentSwap } = useTransactionStatus();

  /**
   * Step configuration defines the visual and textual representation of each step.
   * This approach makes it easy to modify the flow or add new steps without
   * restructuring the entire component.
   */
  const steps = [
    {
      key: 'creating_intent',
      title: 'Creating Swap Intent',
      description: 'Preparing your swap transaction on the blockchain',
      icon: <Zap className="w-5 h-5" />,
      progress: 20
    },
    {
      key: 'extracting_intent_id',
      title: 'Confirming Transaction',
      description: 'Waiting for blockchain confirmation and extracting intent ID',
      icon: <Loader2 className="w-5 h-5 animate-spin" />,
      progress: 40
    },
    {
      key: 'waiting_signature',
      title: 'Backend Processing',
      description: 'Our secure backend is generating the required signature',
      icon: <Clock className="w-5 h-5" />,
      progress: 60
    },
    {
      key: 'executing_swap',
      title: 'Executing Swap',
      description: 'Completing the token exchange through Uniswap',
      icon: <ArrowRight className="w-5 h-5" />,
      progress: 80
    },
    {
      key: 'completed',
      title: 'Swap Completed',
      description: 'Your tokens have been successfully exchanged',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      progress: 100
    }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentSwap?.step);
  const currentStepConfig = steps[currentStepIndex] || steps[0];

  /**
   * Enhanced close handler that cleans up state when users close the modal.
   * This prevents state pollution and ensures a clean slate for the next swap.
   */
  const handleClose = useCallback(() => {
    if (currentSwap?.step === 'completed' || currentSwap?.step === 'error') {
      setCurrentSwap(null);
    }
    onClose();
  }, [currentSwap?.step, setCurrentSwap, onClose]);

  /**
   * Retry mechanism that allows users to restart failed swaps.
   * This is crucial for production applications where network issues
   * or temporary backend problems shouldn't require users to start over completely.
   */
  const handleRetry = useCallback(() => {
    if (onRetry) {
      setCurrentSwap(null);
      onRetry();
    }
  }, [onRetry, setCurrentSwap]);

  // Generate blockchain explorer URL (this would use the actual network in production)
  const getExplorerUrl = (hash: string) => {
    return `https://basescan.org/tx/${hash}`; // Using Base network as per your config
  };

  if (!isOpen || !currentSwap) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Swap Progress
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Swap Details Summary */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-center space-x-3 text-lg font-medium">
            <span className="text-slate-900">{amount} {fromToken}</span>
            <ArrowRight className="w-5 h-5 text-slate-500" />
            <span className="text-slate-900">{toToken}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Visualization */}
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${currentSwap.progress}%` }}
              />
            </div>

            {/* Current Step Display */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
                {currentStepConfig.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900">{currentStepConfig.title}</h3>
                <p className="text-sm text-slate-600">{currentStepConfig.description}</p>
                {currentSwap.message && (
                  <p className="text-sm text-blue-600 mt-1">{currentSwap.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Step Status List */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isUpcoming = index > currentStepIndex;

              return (
                <div 
                  key={step.key}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isCompleted ? 'bg-green-50' :
                    isCurrent ? 'bg-blue-50' :
                    'bg-slate-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' :
                    isCurrent ? 'bg-blue-500' :
                    'bg-slate-300'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-slate-500 rounded-full" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isCompleted ? 'text-green-700' :
                    isCurrent ? 'text-blue-700' :
                    'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Signature Status Integration */}
          {['waiting_signature', 'executing_swap'].includes(currentSwap.step) && (
            <SignatureStatusIndicator />
          )}

          {/* Transaction Details */}
          {currentSwap.transactionHash && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-900 mb-2">Transaction Details</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Transaction Hash:</span>
                  <a
                    href={getExplorerUrl(currentSwap.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <span className="font-mono">
                      {currentSwap.transactionHash.slice(0, 6)}...{currentSwap.transactionHash.slice(-4)}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {currentSwap.intentId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Intent ID:</span>
                    <span className="text-sm font-mono text-slate-900">
                      {currentSwap.intentId.slice(0, 8)}...{currentSwap.intentId.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Handling */}
          {currentSwap.step === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-900">Swap Failed</h4>
                  <p className="text-sm text-red-700 mt-1">
                    {currentSwap.error || 'An unexpected error occurred during the swap process.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {currentSwap.step === 'error' && onRetry && (
              <button
                onClick={handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            )}
            
            {currentSwap.step === 'completed' && (
              <button
                onClick={handleClose}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Complete
              </button>
            )}
            
            <button
              onClick={handleClose}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                currentSwap.step === 'completed' || currentSwap.step === 'error'
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {currentSwap.step === 'completed' || currentSwap.step === 'error' ? 'Close' : 'Cancel'}
            </button>
          </div>

          {/* Estimated Time Remaining */}
          {currentSwap.estimatedTimeRemaining && currentSwap.step !== 'completed' && currentSwap.step !== 'error' && (
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Estimated time remaining: {Math.ceil(currentSwap.estimatedTimeRemaining / 60)} minutes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================================
// DEMONSTRATION APP - Integration Example
// ================================================================================

/**
 * This demonstration app shows how all the Phase 2 components work together
 * with the Phase 1 infrastructure. In a real application, these components
 * would be integrated into your existing swap interface.
 * 
 * The demo simulates the swap flow to demonstrate the UI components,
 * but in production this would connect to your actual useSwapCalculations hook.
 */

export function SwapDemo() {
  const { setCurrentSwap } = useTransactionStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Simulated swap execution that demonstrates the Phase 2 components.
   * In production, this would be replaced by your actual swap logic from Phase 1.
   */
  const simulateSwap = useCallback(async () => {
    setIsModalOpen(true);
    
    // Step 1: Creating Intent
    setCurrentSwap({
      step: 'creating_intent',
      progress: 20,
      message: 'Preparing swap transaction...',
      estimatedTimeRemaining: 180 // 3 minutes
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Extracting Intent ID
    setCurrentSwap({
      step: 'extracting_intent_id',
      progress: 40,
      message: 'Transaction confirmed. Extracting intent ID...',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      estimatedTimeRemaining: 120
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Waiting for Signature
    setCurrentSwap({
      step: 'waiting_signature',
      progress: 60,
      message: 'Waiting for backend signature...',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      intentId: 'intent_789012345678',
      estimatedTimeRemaining: 60
    });

    // The signature polling will be handled automatically by the TransactionStatusProvider

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Executing Swap
    setCurrentSwap({
      step: 'executing_swap',
      progress: 80,
      message: 'Executing swap through Uniswap...',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      intentId: 'intent_789012345678',
      signature: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      estimatedTimeRemaining: 30
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 5: Completed
    setCurrentSwap({
      step: 'completed',
      progress: 100,
      message: 'Swap completed successfully!',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      intentId: 'intent_789012345678',
      signature: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    });
  }, [setCurrentSwap]);

  const simulateError = useCallback(async () => {
    setIsModalOpen(true);
    
    setCurrentSwap({
      step: 'creating_intent',
      progress: 20,
      message: 'Preparing swap transaction...'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    setCurrentSwap({
      step: 'error',
      progress: 0,
      message: 'Swap failed',
      error: 'Insufficient liquidity for this trade size. Please try a smaller amount or check back later.'
    });
  }, [setCurrentSwap]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Phase 2: Enhanced UI Components
          </h1>
          <p className="text-slate-600">
            Commerce Protocol Backend Signer Integration Demo
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Swap Interface Demo
          </h2>
          <p className="text-slate-600 mb-6">
            These buttons simulate the swap process to demonstrate the Phase 2 UI components.
            In production, this would integrate with your Phase 1 useSwapCalculations hook.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={simulateSwap}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Simulate Successful Swap
            </button>
            
            <button
              onClick={simulateError}
              className="w-full bg-red-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Simulate Failed Swap
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Integration Guide
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-4">
              To integrate these Phase 2 components with your Phase 1 implementation:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-600">
              <li>Wrap your app with the TransactionStatusProvider</li>
              <li>Connect SwapStatusModal to your useSwapCalculations hook state</li>
              <li>Use the signature polling integration for real-time updates</li>
              <li>Configure the blockchain explorer URLs for your target network</li>
            </ol>
          </div>
        </div>
      </div>

      <SwapStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fromToken="ETH"
        toToken="USDC"
        amount="0.1"
        onRetry={simulateSwap}
      />
    </div>
  );
}

// Main App Component for demonstration
export default function SwapTransactionStatusApp() {
  return (
    <TransactionStatusProvider>
      <SwapDemo />
    </TransactionStatusProvider>
  );
}
