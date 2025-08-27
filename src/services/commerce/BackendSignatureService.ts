/**
 * PRODUCTION BACKEND SIGNATURE SERVICE
 * 
 * This handles the critical signature polling and execution flow that's missing
 * from your current commerce protocol integration. This is what makes the 
 * multi-token payment system work reliably in production.
 */

import { type Address } from 'viem'

// ===== INTERFACE DEFINITIONS =====

export interface SignatureRequest {
  intentId: string
  userAddress: Address
  paymentToken: Address
  amount: bigint
  timestamp: number
  chainId: number
}

export interface SignatureResponse {
  success: boolean
  signature?: string
  status: 'pending' | 'signed' | 'failed' | 'expired'
  error?: string
  estimatedWaitTime?: number
}

export interface BackendSignatureStatus {
  intentId: string
  status: 'queued' | 'processing' | 'signed' | 'failed' | 'expired'
  signature?: string
  error?: string
  queuePosition?: number
  estimatedWaitTime?: number
  createdAt: number
  updatedAt: number
}

export interface SignatureServiceConfig {
  baseURL: string
  apiKey?: string
  maxRetries: number
  retryDelay: number
  timeout: number
  pollingInterval: number
  maxPollingTime: number
}

// ===== PRODUCTION SIGNATURE SERVICE =====

export class BackendSignatureService {
  private config: SignatureServiceConfig
  private activePolls = new Map<string, AbortController>()

  constructor(config: Partial<SignatureServiceConfig> = {}) {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      pollingInterval: 2000,
      maxPollingTime: 300000, // 5 minutes
      ...config
    }
  }

  // ===== SIGNATURE REQUEST SUBMISSION =====

  /**
   * Submit a signature request to the backend
   */
  async submitSignatureRequest(request: SignatureRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.makeRequest('POST', '/api/commerce/signature-request', {
        intentId: request.intentId,
        userAddress: request.userAddress,
        paymentToken: request.paymentToken,
        amount: request.amount.toString(),
        timestamp: request.timestamp,
        chainId: request.chainId
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to submit signature request:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // ===== SIGNATURE POLLING =====

  /**
   * Poll for signature with automatic retry and timeout handling
   */
  async pollForSignature(
    intentId: string,
    onStatusUpdate?: (status: BackendSignatureStatus) => void
  ): Promise<SignatureResponse> {
    const controller = new AbortController()
    this.activePolls.set(intentId, controller)

    try {
      const startTime = Date.now()
      
      while (Date.now() - startTime < this.config.maxPollingTime) {
        // Check if polling was cancelled
        if (controller.signal.aborted) {
          throw new Error('Signature polling cancelled')
        }

        try {
          const status = await this.getSignatureStatus(intentId)
          
          // Call status update callback
          if (onStatusUpdate) {
            onStatusUpdate(status)
          }

          // Handle final states
          if (status.status === 'signed' && status.signature) {
            return {
              success: true,
              signature: status.signature,
              status: 'signed'
            }
          }

          if (status.status === 'failed') {
            return {
              success: false,
              status: 'failed',
              error: status.error || 'Signature generation failed'
            }
          }

          if (status.status === 'expired') {
            return {
              success: false,
              status: 'expired',
              error: 'Signature request expired'
            }
          }

          // Continue polling if still processing
          await this.delay(this.config.pollingInterval)
          
        } catch (error) {
          console.warn('Error during signature polling:', error)
          await this.delay(this.config.retryDelay)
        }
      }

      // Timeout reached
      return {
        success: false,
        status: 'failed',
        error: 'Signature polling timeout reached'
      }

    } finally {
      this.activePolls.delete(intentId)
    }
  }

  // ===== SIGNATURE STATUS CHECKING =====

  /**
   * Get current status of a signature request
   */
  async getSignatureStatus(intentId: string): Promise<BackendSignatureStatus> {
    const response = await this.makeRequest('GET', `/api/commerce/signature-status/${intentId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get signature status: HTTP ${response.status}`)
    }

    const data = await response.json()
    
    return {
      intentId,
      status: data.status,
      signature: data.signature,
      error: data.error,
      queuePosition: data.queuePosition,
      estimatedWaitTime: data.estimatedWaitTime,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    }
  }

  // ===== SIGNATURE VERIFICATION =====

  /**
   * Verify a signature is valid and hasn't been used
   */
  async verifySignature(
    intentId: string, 
    signature: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await this.makeRequest('POST', '/api/commerce/signature-verify', {
        intentId,
        signature
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return { 
          valid: false, 
          error: errorData.message || 'Signature verification failed' 
        }
      }

      const data = await response.json()
      return { valid: data.valid, error: data.error }

    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Verification request failed' 
      }
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Cancel active polling for a specific intent
   */
  cancelPolling(intentId: string): void {
    const controller = this.activePolls.get(intentId)
    if (controller) {
      controller.abort()
      this.activePolls.delete(intentId)
    }
  }

  /**
   * Cancel all active polling operations
   */
  cancelAllPolling(): void {
    for (const [intentId, controller] of this.activePolls.entries()) {
      controller.abort()
    }
    this.activePolls.clear()
  }

  /**
   * Get the number of active polling operations
   */
  getActivePollsCount(): number {
    return this.activePolls.size
  }

  // ===== PRIVATE METHODS =====

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<Response> {
    const url = `${this.config.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    }

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body)
    }

    return fetch(url, requestOptions)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ===== REACT HOOKS INTEGRATION =====

import { useState, useCallback, useEffect, useRef } from 'react'

export interface UseBackendSignatureResult {
  signatureService: BackendSignatureService
  submitRequest: (request: SignatureRequest) => Promise<{ success: boolean; error?: string }>
  pollForSignature: (intentId: string) => Promise<SignatureResponse>
  getStatus: (intentId: string) => Promise<BackendSignatureStatus>
  verifySignature: (intentId: string, signature: string) => Promise<{ valid: boolean; error?: string }>
  cancelPolling: (intentId: string) => void
  isPolling: boolean
  activePolls: number
}

/**
 * React hook for backend signature service integration
 */
export function useBackendSignature(config?: Partial<SignatureServiceConfig>): UseBackendSignatureResult {
  const serviceRef = useRef<BackendSignatureService | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [activePolls, setActivePolls] = useState(0)

  // Initialize service
  if (!serviceRef.current) {
    serviceRef.current = new BackendSignatureService(config)
  }

  const service = serviceRef.current

  // Update active polls count
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePolls(service.getActivePollsCount())
      setIsPolling(service.getActivePollsCount() > 0)
    }, 1000)

    return () => clearInterval(interval)
  }, [service])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      service.cancelAllPolling()
    }
  }, [service])

  const submitRequest = useCallback(
    (request: SignatureRequest) => service.submitSignatureRequest(request),
    [service]
  )

  const pollForSignature = useCallback(
    (intentId: string) => service.pollForSignature(intentId),
    [service]
  )

  const getStatus = useCallback(
    (intentId: string) => service.getSignatureStatus(intentId),
    [service]
  )

  const verifySignature = useCallback(
    (intentId: string, signature: string) => service.verifySignature(intentId, signature),
    [service]
  )

  const cancelPolling = useCallback(
    (intentId: string) => service.cancelPolling(intentId),
    [service]
  )

  return {
    signatureService: service,
    submitRequest,
    pollForSignature,
    getStatus,
    verifySignature,
    cancelPolling,
    isPolling,
    activePolls
  }
}
