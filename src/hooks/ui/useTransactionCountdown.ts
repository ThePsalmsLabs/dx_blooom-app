/**
 * Transaction Countdown Hook
 * 
 * Provides real-time countdown timers for blockchain transactions
 * with expected completion times and progress tracking.
 */

import { useState, useEffect, useCallback } from 'react'

export interface CountdownState {
  /** Seconds remaining in the countdown */
  readonly secondsRemaining: number
  /** Progress as percentage (0-100) */
  readonly progress: number
  /** Whether countdown is currently active */
  readonly isActive: boolean
  /** Whether countdown has completed */
  readonly isCompleted: boolean
  /** Formatted time display for UI */
  readonly displayTime: string
}

export interface CountdownControls {
  /** Start countdown with specified duration */
  readonly start: (durationSeconds: number) => void
  /** Stop/pause the countdown */
  readonly stop: () => void
  /** Complete countdown immediately (sets to 0) */
  readonly complete: () => void
  /** Reset countdown to initial state */
  readonly reset: () => void
  /** Restart with same duration */
  readonly restart: () => void
}

export interface TransactionCountdownResult extends CountdownState, CountdownControls {}

/**
 * Hook for managing transaction countdown timers
 * 
 * @param onComplete - Callback when countdown reaches 0
 * @param onTick - Optional callback on each second tick
 * @returns Countdown state and controls
 */
export function useTransactionCountdown(
  onComplete?: () => void,
  onTick?: (secondsRemaining: number) => void
): TransactionCountdownResult {
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  // Calculate progress percentage
  const progress = totalDuration > 0 ? Math.max(0, Math.min(100, ((totalDuration - secondsRemaining) / totalDuration) * 100)) : 0
  
  // Check if completed
  const isCompleted = secondsRemaining === 0 && totalDuration > 0

  // Format display time
  const displayTime = secondsRemaining.toString()

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [intervalId])

  // Handle countdown completion
  useEffect(() => {
    if (isCompleted && isActive) {
      setIsActive(false)
      if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(null)
      }
      onComplete?.()
    }
  }, [isCompleted, isActive, intervalId, onComplete])

  // Start countdown
  const start = useCallback((durationSeconds: number) => {
    // Clear any existing interval
    if (intervalId) {
      clearInterval(intervalId)
    }

    setTotalDuration(durationSeconds)
    setSecondsRemaining(durationSeconds)
    setIsActive(true)

    const newIntervalId = setInterval(() => {
      setSecondsRemaining(prev => {
        const newValue = prev - 1
        onTick?.(newValue)
        
        if (newValue <= 0) {
          return 0
        }
        
        return newValue
      })
    }, 1000)

    setIntervalId(newIntervalId)
  }, [intervalId, onTick])

  // Stop countdown (preserves current time)
  const stop = useCallback(() => {
    setIsActive(false)
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }, [intervalId])

  // Complete countdown immediately (sets time to 0)
  const complete = useCallback(() => {
    setIsActive(false)
    setSecondsRemaining(0)
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }, [intervalId])

  // Reset countdown
  const reset = useCallback(() => {
    stop()
    setSecondsRemaining(0)
    setTotalDuration(0)
  }, [stop])

  // Restart with same duration
  const restart = useCallback(() => {
    if (totalDuration > 0) {
      start(totalDuration)
    }
  }, [totalDuration, start])

  return {
    secondsRemaining,
    progress,
    isActive,
    isCompleted,
    displayTime,
    start,
    stop,
    complete,
    reset,
    restart
  }
}

/**
 * Hook specifically for transaction waiting periods
 * Includes preset durations for common transaction types
 */
export function useTransactionTimer() {
  const baseCountdown = useTransactionCountdown()

  // Preset durations for different transaction types
  const presetDurations = {
    approval: 25,      // USDC approval typically takes 15-30 seconds
    subscription: 20,  // Subscription transactions typically take 10-20 seconds
    mint: 15,         // NFT minting typically takes 10-15 seconds
    transfer: 10      // Simple transfers typically take 5-10 seconds
  } as const

  // Start approval countdown
  const startApprovalCountdown = useCallback((onComplete?: () => void) => {
    baseCountdown.start(presetDurations.approval)
    if (onComplete) {
      // Set up completion callback
      const checkCompletion = () => {
        if (baseCountdown.isCompleted) {
          onComplete()
        }
      }
      // Note: In a real implementation, you'd want to handle this more robustly
      setTimeout(checkCompletion, presetDurations.approval * 1000)
    }
  }, [baseCountdown, presetDurations.approval])

  // Start subscription countdown
  const startSubscriptionCountdown = useCallback((onComplete?: () => void) => {
    baseCountdown.start(presetDurations.subscription)
    if (onComplete) {
      // Set up completion callback
      const checkCompletion = () => {
        if (baseCountdown.isCompleted) {
          onComplete()
        }
      }
      setTimeout(checkCompletion, presetDurations.subscription * 1000)
    }
  }, [baseCountdown, presetDurations.subscription])

  return {
    ...baseCountdown,
    presetDurations,
    startApprovalCountdown,
    startSubscriptionCountdown
  }
}