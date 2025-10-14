/**
 * Production-Safe Logger for XMTP Messaging
 * File: src/lib/utils/logger.ts
 * 
 * Centralized logging utility that respects production environment
 * and provides structured logging for debugging and monitoring.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  error?: Error
}

class ProductionSafeLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private debugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true'
  private walletDebugEnabled = process.env.NEXT_PUBLIC_DEBUG_WALLET === 'true'

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private shouldLog(level: LogLevel, component?: string): boolean {
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') return true
    
    // In production, only log if explicitly enabled
    if (!this.isDevelopment && !this.debugEnabled) return false
    
    // Special handling for wallet debug logs
    if (component?.includes('wallet') || component?.includes('xmtp')) {
      return this.isDevelopment || this.walletDebugEnabled
    }
    
    return this.isDevelopment || this.debugEnabled
  }

  private createLogEntry(
    level: LogLevel,
    component: string,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      component,
      message,
      data,
      error
    }
  }

  private outputLog(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] ${entry.component.toUpperCase()}`
    
    switch (entry.level) {
      case 'debug':
        console.debug(`🔍 ${prefix}:`, entry.message, entry.data || '')
        break
      case 'info':
        console.info(`ℹ️ ${prefix}:`, entry.message, entry.data || '')
        break
      case 'warn':
        console.warn(`⚠️ ${prefix}:`, entry.message, entry.data || '', entry.error || '')
        break
      case 'error':
        console.error(`❌ ${prefix}:`, entry.message, entry.data || '', entry.error || '')
        break
    }
  }

  debug(component: string, message: string, data?: any): void {
    if (this.shouldLog('debug', component)) {
      const entry = this.createLogEntry('debug', component, message, data)
      this.outputLog(entry)
    }
  }

  info(component: string, message: string, data?: any): void {
    if (this.shouldLog('info', component)) {
      const entry = this.createLogEntry('info', component, message, data)
      this.outputLog(entry)
    }
  }

  warn(component: string, message: string, data?: any, error?: Error): void {
    if (this.shouldLog('warn', component)) {
      const entry = this.createLogEntry('warn', component, message, data, error)
      this.outputLog(entry)
    }
  }

  error(component: string, message: string, data?: any, error?: Error): void {
    if (this.shouldLog('error', component)) {
      const entry = this.createLogEntry('error', component, message, data, error)
      this.outputLog(entry)
    }
  }

  // Specialized methods for common components
  wallet = {
    debug: (message: string, data?: any) => this.debug('wallet', message, data),
    info: (message: string, data?: any) => this.info('wallet', message, data),
    warn: (message: string, data?: any, error?: Error) => this.warn('wallet', message, data, error),
    error: (message: string, data?: any, error?: Error) => this.error('wallet', message, data, error)
  }

  xmtp = {
    debug: (message: string, data?: any) => this.debug('xmtp', message, data),
    info: (message: string, data?: any) => this.info('xmtp', message, data),
    warn: (message: string, data?: any, error?: Error) => this.warn('xmtp', message, data, error),
    error: (message: string, data?: any, error?: Error) => this.error('xmtp', message, data, error)
  }

  messaging = {
    debug: (message: string, data?: any) => this.debug('messaging', message, data),
    info: (message: string, data?: any) => this.info('messaging', message, data),
    warn: (message: string, data?: any, error?: Error) => this.warn('messaging', message, data, error),
    error: (message: string, data?: any, error?: Error) => this.error('messaging', message, data, error)
  }
}

// Export singleton instance
export const logger = new ProductionSafeLogger()

// Legacy debug export for backward compatibility
export const debug = {
  log: (message: string, data?: any) => logger.debug('debug', message, data),
  warn: (message: string, data?: any) => logger.warn('debug', message, data),
  error: (message: string, error?: Error) => logger.error('debug', message, undefined, error),
  wallet: logger.wallet.debug,
}