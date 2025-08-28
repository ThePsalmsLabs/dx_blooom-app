import React from 'react'

/**
 * Centralized Debug Utility
 * 
 * This utility provides a consistent way to handle debug logging across the application.
 * All debug information is controlled by environment variables and only shows in development.
 */

// Environment checks
const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true'
const isWalletDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_WALLET === 'true'
const isPerformanceDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_PERFORMANCE === 'true'

/**
 * Debug Logger Class
 * Provides different levels of logging with environment-based controls
 */
class DebugLogger {
  private prefix: string
  private enabled: boolean

  constructor(prefix: string, enabled: boolean = true) {
    this.prefix = prefix
    this.enabled = enabled && isDevelopment
  }

  /**
   * Log debug information (only in development)
   */
  log(message: string, data?: any): void {
    if (!this.enabled) return
    
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.prefix}] ${message}`
    
    if (data) {
      console.log(logMessage, data)
    } else {
      console.log(logMessage)
    }
  }

  /**
   * Log warnings (only in development)
   */
  warn(message: string, data?: any): void {
    if (!this.enabled) return
    
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.prefix}] ⚠️ ${message}`
    
    if (data) {
      console.warn(logMessage, data)
    } else {
      console.warn(logMessage)
    }
  }

  /**
   * Log errors (always logged, but with different detail levels)
   */
  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.prefix}] ❌ ${message}`
    
    if (error) {
      if (isDevelopment) {
        console.error(logMessage, error)
      } else {
        // In production, only log the message, not the full error object
        console.error(logMessage)
      }
    } else {
      console.error(logMessage)
    }
  }

  /**
   * Log performance metrics (only when performance debugging is enabled)
   */
  performance(operation: string, duration: number, metadata?: any): void {
    if (!this.enabled || !isPerformanceDebugEnabled) return
    
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.prefix}] ⏱️ ${operation}: ${duration}ms`
    
    if (metadata) {
      console.log(logMessage, metadata)
    } else {
      console.log(logMessage)
    }
  }

  /**
   * Log wallet-specific debug information
   */
  wallet(message: string, data?: any): void {
    if (!this.enabled || !isWalletDebugEnabled) return
    
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.prefix}] 🔗 ${message}`
    
    if (data) {
      console.log(logMessage, data)
    } else {
      console.log(logMessage)
    }
  }
}

/**
 * Global debug instance
 */
export const debug = {
  /**
   * Check if any debug logging is enabled
   */
  get isAnyEnabled(): boolean {
    return isDevelopment && (isDebugEnabled || isWalletDebugEnabled || isPerformanceDebugEnabled)
  },

  /**
   * Check if general debug logging is enabled
   */
  get isEnabled(): boolean {
    return isDevelopment && isDebugEnabled
  },

  /**
   * Check if wallet debug logging is enabled
   */
  get isWalletEnabled(): boolean {
    return isDevelopment && isWalletDebugEnabled
  },

  /**
   * Check if performance debug logging is enabled
   */
  get isPerformanceEnabled(): boolean {
    return isDevelopment && isPerformanceDebugEnabled
  },

  /**
   * General debug logging
   */
  log: (message: string, data?: any) => {
    if (isDevelopment && isDebugEnabled) {
      console.log(`[DEBUG] 🔍 ${message}`, data)
    }
  },

  /**
   * Warning logging (only in development)
   */
  warn: (message: string, data?: any) => {
    if (isDevelopment && isDebugEnabled) {
      console.warn(`[DEBUG] ⚠️ ${message}`, data)
    }
  },
  
  /**
   * Error logging (always logged, but with different detail levels)
   */
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[DEBUG] ❌ ${message}`, error)
    } else {
      console.error(`[ERROR] ${message}`)
    }
  },
  
  /**
   * Performance logging
   */
  performance: (operation: string, duration: number, metadata?: any) => {
    if (isDevelopment && isPerformanceDebugEnabled) {
      console.log(`[PERF] ⏱️ ${operation}: ${duration}ms`, metadata)
    }
  },
  
  /**
   * Wallet-specific logging
   */
  wallet: (message: string, data?: any) => {
    if (isDevelopment && isWalletDebugEnabled) {
      console.log(`[WALLET] 🔗 ${message}`, data)
    }
  }
}

/**
 * Debug configuration interface
 */
export interface DebugConfig {
  enableLogging: boolean
  enablePerformanceLogging: boolean
  enableStateLogging: boolean
  enableVerboseLogging: boolean
  enableWalletLogging: boolean
}

/**
 * Get debug configuration based on environment
 */
export function getDebugConfig(): DebugConfig {
  return {
    enableLogging: isDevelopment && isDebugEnabled,
    enablePerformanceLogging: isDevelopment && isPerformanceDebugEnabled,
    enableStateLogging: isDevelopment && isDebugEnabled,
    enableVerboseLogging: isDevelopment && isDebugEnabled,
    enableWalletLogging: isDevelopment && isWalletDebugEnabled
  }
}

/**
 * Conditional debug component wrapper
 */
export function withDebugCondition<T extends object>(
  Component: React.ComponentType<T>,
  debugProps: Partial<T> = {}
): React.ComponentType<T> {
  return (props: T) => {
    if (!debug.isAnyEnabled) {
      return <Component {...props} />
    }
    
    return <Component {...props} {...debugProps} />
  }
}

/**
 * Debug hook for conditional rendering
 */
export function useDebugCondition(): boolean {
  return debug.isAnyEnabled
}

/**
 * Debug hook for specific debug types
 */
export function useDebugType(type: 'general' | 'wallet' | 'performance'): boolean {
  switch (type) {
    case 'general':
      return debug.isEnabled
    case 'wallet':
      return debug.isWalletEnabled
    case 'performance':
      return debug.isPerformanceEnabled
    default:
      return false
  }
}

/**
 * Create a debug logger instance for a specific component or module
 */
export function createDebugLogger(prefix: string, enabled: boolean = true): DebugLogger {
  return new DebugLogger(prefix, enabled)
}
