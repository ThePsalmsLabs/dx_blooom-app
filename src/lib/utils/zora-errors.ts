/**
 * Zora Error Handling Utilities
 * 
 * This module provides comprehensive error handling for Zora integration
 * with strict TypeScript types, error categorization, and recovery strategies.
 */

import { type Address, type Hash } from 'viem'

// ===== ERROR TYPES =====

/**
 * Zora Error Categories
 */
export const ZORA_ERROR_CATEGORIES = {
  CONTRACT_ERROR: 'contract_error',
  NETWORK_ERROR: 'network_error',
  USER_ERROR: 'user_error',
  VALIDATION_ERROR: 'validation_error',
  IPFS_ERROR: 'ipfs_error',
  GAS_ERROR: 'gas_error',
  EVENT_ERROR: 'event_error',
  UNKNOWN_ERROR: 'unknown_error'
} as const

export type ZoraErrorCategory = typeof ZORA_ERROR_CATEGORIES[keyof typeof ZORA_ERROR_CATEGORIES]

/**
 * Zora Error Codes
 */
export const ZORA_ERROR_CODES = {
  // Contract Errors
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  CONTRACT_CALL_FAILED: 'CONTRACT_CALL_FAILED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  CONTRACT_REVERTED: 'CONTRACT_REVERTED',
  
  // Network Errors
  NETWORK_UNSUPPORTED: 'NETWORK_UNSUPPORTED',
  RPC_ERROR: 'RPC_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // User Errors
  USER_REJECTED: 'USER_REJECTED',
  USER_NOT_CONNECTED: 'USER_NOT_CONNECTED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation Errors
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  INVALID_METADATA: 'INVALID_METADATA',
  INVALID_EVENT: 'INVALID_EVENT',
  
  // IPFS Errors
  IPFS_UPLOAD_FAILED: 'IPFS_UPLOAD_FAILED',
  IPFS_GATEWAY_ERROR: 'IPFS_GATEWAY_ERROR',
  IPFS_VALIDATION_ERROR: 'IPFS_VALIDATION_ERROR',
  
  // Gas Errors
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  INSUFFICIENT_GAS: 'INSUFFICIENT_GAS',
  GAS_LIMIT_EXCEEDED: 'GAS_LIMIT_EXCEEDED',
  
  // Event Errors
  EVENT_PARSING_FAILED: 'EVENT_PARSING_FAILED',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  EVENT_SIGNATURE_INVALID: 'EVENT_SIGNATURE_INVALID',
  
  // Unknown Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type ZoraErrorCode = typeof ZORA_ERROR_CODES[keyof typeof ZORA_ERROR_CODES]

/**
 * Zora Error Context
 */
export interface ZoraErrorContext {
  readonly operation: string
  readonly contractAddress?: Address
  readonly tokenId?: bigint
  readonly transactionHash?: Hash
  readonly blockNumber?: bigint
  readonly userAddress?: Address
  readonly chainId?: number
  readonly metadata?: Record<string, unknown>
}

/**
 * Zora Error Class
 */
export class ZoraError extends Error {
  readonly category: ZoraErrorCategory
  readonly code: ZoraErrorCode
  readonly context: ZoraErrorContext
  readonly originalError?: Error
  readonly recoverable: boolean
  readonly retryable: boolean

  constructor(
    message: string,
    category: ZoraErrorCategory,
    code: ZoraErrorCode,
    context: ZoraErrorContext,
    options: {
      originalError?: Error
      recoverable?: boolean
      retryable?: boolean
    } = {}
  ) {
    super(message)
    this.name = 'ZoraError'
    this.category = category
    this.code = code
    this.context = context
    this.originalError = options.originalError
    this.recoverable = options.recoverable ?? false
    this.retryable = options.retryable ?? false
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case ZORA_ERROR_CODES.USER_REJECTED:
        return 'Transaction was rejected by user'
      case ZORA_ERROR_CODES.INSUFFICIENT_BALANCE:
        return 'Insufficient balance for transaction'
      case ZORA_ERROR_CODES.GAS_ESTIMATION_FAILED:
        return 'Failed to estimate gas for transaction'
      case ZORA_ERROR_CODES.IPFS_UPLOAD_FAILED:
        return 'Failed to upload metadata to IPFS'
      case ZORA_ERROR_CODES.NETWORK_UNSUPPORTED:
        return 'Network not supported for Zora operations'
      case ZORA_ERROR_CODES.CONTRACT_NOT_FOUND:
        return 'Zora contract not found on this network'
      default:
        return this.message || 'An unexpected error occurred'
    }
  }

  /**
   * Get recovery suggestion
   */
  getRecoverySuggestion(): string | null {
    switch (this.code) {
      case ZORA_ERROR_CODES.USER_REJECTED:
        return 'Please try the transaction again'
      case ZORA_ERROR_CODES.INSUFFICIENT_BALANCE:
        return 'Please add more funds to your wallet'
      case ZORA_ERROR_CODES.GAS_ESTIMATION_FAILED:
        return 'Please try with a higher gas limit'
      case ZORA_ERROR_CODES.IPFS_UPLOAD_FAILED:
        return 'Please check your internet connection and try again'
      case ZORA_ERROR_CODES.NETWORK_UNSUPPORTED:
        return 'Please switch to a supported network (Base, Base Sepolia)'
      case ZORA_ERROR_CODES.CONTRACT_NOT_FOUND:
        return 'Please check if you are on the correct network'
      default:
        return null
    }
  }
}

// ===== ERROR FACTORY FUNCTIONS =====

/**
 * Create contract error
 */
export function createContractError(
  message: string,
  code: ZoraErrorCode,
  context: ZoraErrorContext,
  originalError?: Error
): ZoraError {
  return new ZoraError(message, ZORA_ERROR_CATEGORIES.CONTRACT_ERROR, code, context, {
    originalError,
    recoverable: false,
    retryable: true
  })
}

/**
 * Create network error
 */
export function createNetworkError(
  message: string,
  code: ZoraErrorCode,
  context: ZoraErrorContext,
  originalError?: Error
): ZoraError {
  return new ZoraError(message, ZORA_ERROR_CATEGORIES.NETWORK_ERROR, code, context, {
    originalError,
    recoverable: true,
    retryable: true
  })
}

/**
 * Create user error
 */
export function createUserError(
  message: string,
  code: ZoraErrorCode,
  context: ZoraErrorContext,
  originalError?: Error
): ZoraError {
  return new ZoraError(message, ZORA_ERROR_CATEGORIES.USER_ERROR, code, context, {
    originalError,
    recoverable: true,
    retryable: false
  })
}

/**
 * Create validation error
 */
export function createValidationError(
  message: string,
  code: ZoraErrorCode,
  context: ZoraErrorContext,
  originalError?: Error
): ZoraError {
  return new ZoraError(message, ZORA_ERROR_CATEGORIES.VALIDATION_ERROR, code, context, {
    originalError,
    recoverable: true,
    retryable: false
  })
}

/**
 * Create IPFS error
 */
export function createIPFSError(
  message: string,
  code: ZoraErrorCode,
  context: ZoraErrorContext,
  originalError?: Error
): ZoraError {
  return new ZoraError(message, ZORA_ERROR_CATEGORIES.IPFS_ERROR, code, context, {
    originalError,
    recoverable: true,
    retryable: true
  })
}

/**
 * Create gas error
 */
export function createGasError(
  message: string,
  code: ZoraErrorCode,
  context: ZoraErrorContext,
  originalError?: Error
): ZoraError {
  return new ZoraError(message, ZORA_ERROR_CATEGORIES.GAS_ERROR, code, context, {
    originalError,
    recoverable: true,
    retryable: true
  })
}

/**
 * Create event error
 */
export function createEventError(
  message: string,
  code: ZoraErrorCode,
  context: ZoraErrorContext,
  originalError?: Error
): ZoraError {
  return new ZoraError(message, ZORA_ERROR_CATEGORIES.EVENT_ERROR, code, context, {
    originalError,
    recoverable: false,
    retryable: false
  })
}

// ===== ERROR HANDLING UTILITIES =====

/**
 * Check if error is a ZoraError
 */
export function isZoraError(error: unknown): error is ZoraError {
  return error instanceof ZoraError
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (isZoraError(error)) {
    return error.recoverable
  }
  return false
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isZoraError(error)) {
    return error.retryable
  }
  return false
}

/**
 * Get error category
 */
export function getErrorCategory(error: unknown): ZoraErrorCategory {
  if (isZoraError(error)) {
    return error.category
  }
  return ZORA_ERROR_CATEGORIES.UNKNOWN_ERROR
}

/**
 * Get error code
 */
export function getErrorCode(error: unknown): ZoraErrorCode {
  if (isZoraError(error)) {
    return error.code
  }
  return ZORA_ERROR_CODES.UNKNOWN_ERROR
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: unknown): string {
  if (isZoraError(error)) {
    return error.getUserMessage()
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

/**
 * Get recovery suggestion
 */
export function getRecoverySuggestion(error: unknown): string | null {
  if (isZoraError(error)) {
    return error.getRecoverySuggestion()
  }
  return null
}

// ===== ERROR MAPPING FUNCTIONS =====

/**
 * Map wagmi error to ZoraError
 */
export function mapWagmiError(
  error: unknown,
  context: ZoraErrorContext
): ZoraError {
  if (isZoraError(error)) {
    return error
  }

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorString = errorMessage.toLowerCase()

  // Map common wagmi errors
  if (errorString.includes('user rejected')) {
    return createUserError(
      'Transaction was rejected by user',
      ZORA_ERROR_CODES.USER_REJECTED,
      context,
      error instanceof Error ? error : undefined
    )
  }

  if (errorString.includes('insufficient funds') || errorString.includes('insufficient balance')) {
    return createContractError(
      'Insufficient balance for transaction',
      ZORA_ERROR_CODES.INSUFFICIENT_BALANCE,
      context,
      error instanceof Error ? error : undefined
    )
  }

  if (errorString.includes('gas') && errorString.includes('estimation')) {
    return createGasError(
      'Failed to estimate gas for transaction',
      ZORA_ERROR_CODES.GAS_ESTIMATION_FAILED,
      context,
      error instanceof Error ? error : undefined
    )
  }

  if (errorString.includes('network') || errorString.includes('chain')) {
    return createNetworkError(
      'Network error occurred',
      ZORA_ERROR_CODES.NETWORK_UNSUPPORTED,
      context,
      error instanceof Error ? error : undefined
    )
  }

  if (errorString.includes('contract') || errorString.includes('revert')) {
    return createContractError(
      'Contract call failed',
      ZORA_ERROR_CODES.CONTRACT_CALL_FAILED,
      context,
      error instanceof Error ? error : undefined
    )
  }

  // Default to unknown error
  return new ZoraError(
    errorMessage,
    ZORA_ERROR_CATEGORIES.UNKNOWN_ERROR,
    ZORA_ERROR_CODES.UNKNOWN_ERROR,
    context,
    {
      originalError: error instanceof Error ? error : undefined,
      recoverable: false,
      retryable: false
    }
  )
}

/**
 * Map IPFS error to ZoraError
 */
export function mapIPFSError(
  error: unknown,
  context: ZoraErrorContext
): ZoraError {
  if (isZoraError(error)) {
    return error
  }

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorString = errorMessage.toLowerCase()

  if (errorString.includes('gateway') || errorString.includes('timeout')) {
    return createIPFSError(
      'IPFS gateway error',
      ZORA_ERROR_CODES.IPFS_GATEWAY_ERROR,
      context,
      error instanceof Error ? error : undefined
    )
  }

  if (errorString.includes('validation') || errorString.includes('invalid')) {
    return createIPFSError(
      'IPFS validation error',
      ZORA_ERROR_CODES.IPFS_VALIDATION_ERROR,
      context,
      error instanceof Error ? error : undefined
    )
  }

  return createIPFSError(
    'IPFS upload failed',
    ZORA_ERROR_CODES.IPFS_UPLOAD_FAILED,
    context,
    error instanceof Error ? error : undefined
  )
}

// ===== ERROR RECOVERY STRATEGIES =====

/**
 * Error recovery strategies
 */
export const ERROR_RECOVERY_STRATEGIES = {
  [ZORA_ERROR_CODES.USER_REJECTED]: 'retry',
  [ZORA_ERROR_CODES.INSUFFICIENT_BALANCE]: 'fund_wallet',
  [ZORA_ERROR_CODES.GAS_ESTIMATION_FAILED]: 'increase_gas',
  [ZORA_ERROR_CODES.IPFS_UPLOAD_FAILED]: 'retry_with_fallback',
  [ZORA_ERROR_CODES.NETWORK_UNSUPPORTED]: 'switch_network',
  [ZORA_ERROR_CODES.CONTRACT_NOT_FOUND]: 'check_network',
  [ZORA_ERROR_CODES.CONTRACT_CALL_FAILED]: 'retry',
  [ZORA_ERROR_CODES.CONTRACT_REVERTED]: 'retry',
  [ZORA_ERROR_CODES.INSUFFICIENT_GAS]: 'increase_gas',
  [ZORA_ERROR_CODES.GAS_LIMIT_EXCEEDED]: 'increase_gas_limit',
  [ZORA_ERROR_CODES.USER_NOT_CONNECTED]: 'connect_wallet',
  [ZORA_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'check_permissions',
  [ZORA_ERROR_CODES.INVALID_ADDRESS]: 'fix_input',
  [ZORA_ERROR_CODES.INVALID_PARAMETERS]: 'fix_input',
  [ZORA_ERROR_CODES.INVALID_METADATA]: 'fix_input',
  [ZORA_ERROR_CODES.INVALID_EVENT]: 'ignore',
  [ZORA_ERROR_CODES.IPFS_GATEWAY_ERROR]: 'retry_with_fallback',
  [ZORA_ERROR_CODES.IPFS_VALIDATION_ERROR]: 'fix_input',
  [ZORA_ERROR_CODES.RPC_ERROR]: 'retry',
  [ZORA_ERROR_CODES.TIMEOUT_ERROR]: 'retry',
  [ZORA_ERROR_CODES.CONNECTION_ERROR]: 'retry',
  [ZORA_ERROR_CODES.EVENT_PARSING_FAILED]: 'ignore',
  [ZORA_ERROR_CODES.EVENT_NOT_FOUND]: 'ignore',
  [ZORA_ERROR_CODES.EVENT_SIGNATURE_INVALID]: 'ignore',
  [ZORA_ERROR_CODES.UNKNOWN_ERROR]: 'retry'
} as const

export type ErrorRecoveryStrategy = typeof ERROR_RECOVERY_STRATEGIES[keyof typeof ERROR_RECOVERY_STRATEGIES]

/**
 * Get recovery strategy for error
 */
export function getRecoveryStrategy(error: unknown): ErrorRecoveryStrategy {
  const code = getErrorCode(error)
  return ERROR_RECOVERY_STRATEGIES[code] || 'retry'
}

/**
 * Should retry error
 */
export function shouldRetryError(error: unknown, retryCount: number): boolean {
  if (!isRetryableError(error)) {
    return false
  }

  const maxRetries = 3
  if (retryCount >= maxRetries) {
    return false
  }

  const code = getErrorCode(error)
  
  // Don't retry user rejection
  if (code === ZORA_ERROR_CODES.USER_REJECTED) {
    return false
  }

  // Don't retry validation errors
  if (code === ZORA_ERROR_CODES.INVALID_ADDRESS || 
      code === ZORA_ERROR_CODES.INVALID_PARAMETERS ||
      code === ZORA_ERROR_CODES.INVALID_METADATA) {
    return false
  }

  return true
}

// ===== ERROR LOGGING =====

/**
 * Log Zora error with context
 */
export function logZoraError(error: ZoraError): void {
  console.error('Zora Error:', {
    name: error.name,
    message: error.message,
    category: error.category,
    code: error.code,
    context: error.context,
    recoverable: error.recoverable,
    retryable: error.retryable,
    originalError: error.originalError,
    stack: error.stack
  })
}

/**
 * Log error with user-friendly message
 */
export function logUserError(error: unknown, operation: string): void {
  const userMessage = getUserErrorMessage(error)
  const recoverySuggestion = getRecoverySuggestion(error)
  
  console.error(`Zora ${operation} Error:`, {
    userMessage,
    recoverySuggestion,
    error
  })
}
