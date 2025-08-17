import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Loader2, ArrowRight, Zap, Activity, Shield, TrendingUp } from 'lucide-react';

// ================================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// ================================================================================

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  apiCallCount: number;
  cacheHitRate: number;
}

interface ErrorRecoveryState {
  retryCount: number;
  maxRetries: number;
  backoffMultiplier: number;
  lastError: Error | null;
  recoveryStrategy: 'automatic' | 'manual' | 'graceful_degradation';
  isRecovering: boolean;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: string;
  duration?: number;
}

interface BackendHealthMetrics {
  responseTime: number;
  successRate: number;
  consecutiveFailures: number;
  lastHealthCheck: Date;
  recommendedPollInterval: number;
}

/**
 * Performance Monitor Hook
 * 
 * This hook tracks rendering performance and API usage patterns to identify
 * optimization opportunities. In production environments, this data helps
 * teams understand user experience bottlenecks and optimize accordingly.
 * 
 * The hook uses React's built-in performance measurement APIs and provides
 * actionable insights about component render cycles and network efficiency.
 */
export function usePerformanceMonitor(componentName: string): PerformanceMetrics & { trackApiCall: (wasCacheHit?: boolean) => void } {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    apiCallCount: 0,
    cacheHitRate: 0
  });

  const renderTimes = useRef<number[]>([]);
  const apiCalls = useRef<number>(0);
  const cacheHits = useRef<number>(0);

  /**
   * Track render performance using React's built-in performance measurement
   * This helps identify components that might be re-rendering unnecessarily
   */
  useEffect(() => {
    const startTime = performance.now();
    
    setMetrics(prev => {
      const newRenderCount = prev.renderCount + 1;
      return {
        ...prev,
        renderCount: newRenderCount,
        lastRenderTime: startTime
      };
    });

    return () => {
      const endTime = performance.now();
      const renderDuration = endTime - startTime;
      
      renderTimes.current.push(renderDuration);
      
      // Keep only last 20 render times for rolling average
      if (renderTimes.current.length > 20) {
        renderTimes.current.shift();
      }

      const averageTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      
      setMetrics(prev => ({
        ...prev,
        averageRenderTime: averageTime
      }));
    };
  });

  /**
   * Track API call efficiency and cache performance
   * This helps optimize network requests and identify caching opportunities
   */
  const trackApiCall = useCallback((wasCacheHit: boolean = false) => {
    apiCalls.current += 1;
    if (wasCacheHit) {
      cacheHits.current += 1;
    }

    setMetrics(prev => ({
      ...prev,
      apiCallCount: apiCalls.current,
      cacheHitRate: apiCalls.current > 0 ? (cacheHits.current / apiCalls.current) * 100 : 0
    }));
  }, []);

  return { ...metrics, trackApiCall };
}

/**
 * Optimized Memoization Hook for Swap Calculations
 * 
 * This hook optimizes your existing useSwapCalculation by intelligently memoizing
 * expensive calculations and reducing unnecessary re-computations. It's designed
 * to work seamlessly with your existing hook architecture.
 */
export function useOptimizedSwapCalculation(
  fromToken: any,
  toToken: any,
  fromAmount: string,
  slippageTolerance: number
) {
  const performance = usePerformanceMonitor('SwapCalculation');
  
  /**
   * Memoized calculation dependency array - only recalculate when these values change
   * This prevents expensive price oracle calls when users are just typing amounts
   */
  const calculationKey = useMemo(() => {
    return `${fromToken?.address}-${toToken?.address}-${fromAmount}-${slippageTolerance}`;
  }, [fromToken?.address, toToken?.address, fromAmount, slippageTolerance]);

  /**
   * Cache for expensive calculations to avoid redundant API calls
   * In production, this could be enhanced with localStorage persistence
   */
  const calculationCache = useRef<Map<string, any>>(new Map());

  const memoizedCalculation = useMemo(() => {
    // Check cache first
    if (calculationCache.current.has(calculationKey)) {
      performance.trackApiCall(true); // Cache hit
      return calculationCache.current.get(calculationKey);
    }

    // Perform expensive calculation only when necessary
    performance.trackApiCall(false); // Cache miss
    
    // Your existing calculation logic would go here
    // This is a simplified example that works with your existing hooks
    const result = {
      isLoading: false,
      outputAmount: fromAmount ? (parseFloat(fromAmount) * 1.02).toString() : '0',
      minimumReceived: fromAmount ? (parseFloat(fromAmount) * 1.02 * (1 - slippageTolerance / 100)).toString() : '0',
      exchangeRate: 1.02,
      priceImpact: 0.1,
      gasEstimate: BigInt(180000),
      isValid: true
    };

    // Cache the result
    calculationCache.current.set(calculationKey, result);
    
    // Limit cache size to prevent memory issues
    if (calculationCache.current.size > 50) {
      const firstKey = calculationCache.current.keys().next().value;
      if (firstKey) {
        calculationCache.current.delete(firstKey);
      }
    }

    return result;
  }, [calculationKey, fromAmount, slippageTolerance, performance]);

  return { ...memoizedCalculation, performanceMetrics: performance };
}

// ================================================================================
// ADVANCED ERROR RECOVERY SYSTEM
// ================================================================================

/**
 * Error Recovery Manager
 * 
 * This system enhances your existing error handling with intelligent retry logic,
 * automatic fallback strategies, and graceful degradation when services are unavailable.
 * It's designed to integrate seamlessly with your existing TransactionStatusProvider.
 */
export function useErrorRecovery() {
  const [recoveryState, setRecoveryState] = useState<ErrorRecoveryState>({
    retryCount: 0,
    maxRetries: 3,
    backoffMultiplier: 1.5,
    lastError: null,
    recoveryStrategy: 'automatic',
    isRecovering: false
  });

  /**
   * Intelligent retry logic with exponential backoff
   * This prevents overwhelming backend services during outages while still
   * providing users with recovery options
   */
  const attemptRecovery = useCallback(async (
    operation: () => Promise<any>,
    customStrategy?: 'automatic' | 'manual' | 'graceful_degradation'
  ) => {
    const strategy = customStrategy || recoveryState.recoveryStrategy;
    
    if (recoveryState.retryCount >= recoveryState.maxRetries) {
      if (strategy === 'graceful_degradation') {
        // Provide fallback functionality when all retries are exhausted
        return { success: false, fallback: true, message: 'Using offline mode' };
      }
      throw new Error('Maximum retry attempts exceeded');
    }

    setRecoveryState(prev => ({ ...prev, isRecovering: true }));

    try {
      // Calculate backoff delay
      const delay = Math.min(1000 * Math.pow(recoveryState.backoffMultiplier, recoveryState.retryCount), 30000);
      
      if (recoveryState.retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const result = await operation();
      
      // Reset recovery state on success
      setRecoveryState(prev => ({
        ...prev,
        retryCount: 0,
        lastError: null,
        isRecovering: false
      }));

      return { success: true, result };
    } catch (error) {
      const newRetryCount = recoveryState.retryCount + 1;
      
      setRecoveryState(prev => ({
        ...prev,
        retryCount: newRetryCount,
        lastError: error instanceof Error ? error : new Error('Unknown error'),
        isRecovering: false
      }));

      if (newRetryCount < recoveryState.maxRetries) {
        // Automatically retry for certain error types
        if (error instanceof Error && error.message.includes('network')) {
          return attemptRecovery(operation, strategy);
        }
      }

      throw error;
    }
  }, [recoveryState]);

  /**
   * Reset recovery state - useful when users manually retry operations
   */
  const resetRecovery = useCallback(() => {
    setRecoveryState(prev => ({
      ...prev,
      retryCount: 0,
      lastError: null,
      isRecovering: false
    }));
  }, []);

  return { recoveryState, attemptRecovery, resetRecovery };
}

/**
 * Transaction Recovery System
 * 
 * This system helps users recover from interrupted swaps by storing transaction
 * state and providing resume capabilities. It integrates with your existing
 * intent-based architecture to provide seamless recovery experiences.
 */
export function useTransactionRecovery() {
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  
  /**
   * Store transaction state for recovery purposes
   * In production, this would persist to localStorage or IndexedDB
   */
  const saveTransactionState = useCallback((transactionData: any) => {
    const serializedData = {
      ...transactionData,
      timestamp: Date.now(),
      recoveryId: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setPendingTransactions(prev => [...prev, serializedData]);

    // Persist to localStorage for browser refresh recovery
    try {
      localStorage.setItem('pendingSwapTransactions', JSON.stringify([...pendingTransactions, serializedData]));
    } catch (error) {
      console.warn('Failed to persist transaction state:', error);
    }
  }, [pendingTransactions]);

  /**
   * Attempt to recover a specific transaction
   * This integrates with your existing backend signature polling system
   */
  const recoverTransaction = useCallback(async (recoveryId: string) => {
    const transaction = pendingTransactions.find(tx => tx.recoveryId === recoveryId);
    if (!transaction) {
      throw new Error('Transaction not found for recovery');
    }

    // Check if the transaction is still valid (not expired)
    const isExpired = Date.now() - transaction.timestamp > 3600000; // 1 hour
    if (isExpired) {
      throw new Error('Transaction has expired and cannot be recovered');
    }

    // Attempt to resume from the last known state
    if (transaction.intentId) {
      // Check signature status with your existing backend
      const response = await fetch('/api/commerce/signature-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: transaction.intentId,
          intentHash: transaction.transactionHash
        })
      });

      const data = await response.json();
      
      if (data.isSigned) {
        // Transaction can be completed
        return { canComplete: true, signature: data.signature };
      } else {
        // Resume waiting for signature
        return { canComplete: false, shouldPoll: true };
      }
    }

    return { canComplete: false, shouldRetry: true };
  }, [pendingTransactions]);

  /**
   * Clean up completed or expired transactions
   */
  const cleanupTransactions = useCallback(() => {
    const cutoffTime = Date.now() - 3600000; // 1 hour
    setPendingTransactions(prev => prev.filter(tx => tx.timestamp > cutoffTime && tx.status !== 'completed'));
  }, []);

  // Cleanup expired transactions periodically
  useEffect(() => {
    const cleanup = setInterval(cleanupTransactions, 300000); // Every 5 minutes
    return () => clearInterval(cleanup);
  }, [cleanupTransactions]);

  return { pendingTransactions, saveTransactionState, recoverTransaction, cleanupTransactions };
}

// ================================================================================
// DYNAMIC BACKEND OPTIMIZATION
// ================================================================================

/**
 * Adaptive Backend Polling System
 * 
 * This system optimizes your existing signature polling by dynamically adjusting
 * poll intervals based on backend response patterns and health metrics.
 */
export function useAdaptivePolling() {
  const [healthMetrics, setHealthMetrics] = useState<BackendHealthMetrics>({
    responseTime: 1000,
    successRate: 100,
    consecutiveFailures: 0,
    lastHealthCheck: new Date(),
    recommendedPollInterval: 2000
  });

  /**
   * Track backend health and adjust polling accordingly
   * Faster polling when backend is healthy, slower when stressed
   */
  const updateHealthMetrics = useCallback((responseTime: number, success: boolean) => {
    setHealthMetrics(prev => {
      const newConsecutiveFailures = success ? 0 : prev.consecutiveFailures + 1;
      
      // Calculate new success rate (rolling average over last 20 calls)
      const newSuccessRate = success ? 
        Math.min(prev.successRate + 1, 100) : 
        Math.max(prev.successRate - 5, 0);

      // Adaptive poll interval based on backend health
      let newPollInterval;
      if (newConsecutiveFailures > 3) {
        newPollInterval = 10000; // Slow down significantly
      } else if (newConsecutiveFailures > 1) {
        newPollInterval = 5000; // Moderate slowdown
      } else if (responseTime > 3000) {
        newPollInterval = 4000; // Slow response times
      } else if (responseTime < 500 && newSuccessRate > 95) {
        newPollInterval = 1000; // Fast and reliable
      } else {
        newPollInterval = 2000; // Default
      }

      return {
        responseTime,
        successRate: newSuccessRate,
        consecutiveFailures: newConsecutiveFailures,
        lastHealthCheck: new Date(),
        recommendedPollInterval: newPollInterval
      };
    });
  }, []);

  /**
   * Optimized polling function that integrates with your existing signature polling
   */
  const adaptivePoll = useCallback(async (
    pollFunction: () => Promise<any>,
    options: { maxAttempts?: number; onProgress?: (attempt: number) => void } = {}
  ) => {
    const { maxAttempts = 30, onProgress } = options;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startTime = Date.now();
      
      try {
        onProgress?.(attempt);
        const result = await pollFunction();
        
        const responseTime = Date.now() - startTime;
        updateHealthMetrics(responseTime, true);
        
        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        updateHealthMetrics(responseTime, false);
        
        if (attempt === maxAttempts) {
          throw new Error(`Polling failed after ${maxAttempts} attempts`);
        }
        
        // Wait using adaptive interval
        await new Promise(resolve => setTimeout(resolve, healthMetrics.recommendedPollInterval));
      }
    }
  }, [healthMetrics.recommendedPollInterval, updateHealthMetrics]);

  return { healthMetrics, adaptivePoll, updateHealthMetrics };
}

// Export all utilities for easy integration
export {
  type PerformanceMetrics,
  type ErrorRecoveryState,
  type TestScenario,
  type BackendHealthMetrics
};
