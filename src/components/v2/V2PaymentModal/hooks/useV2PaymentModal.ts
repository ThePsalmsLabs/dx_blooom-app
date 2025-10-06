/**
 * V2 Payment Modal Hook
 * 
 * Simplified hook for managing payment modal state using your actual V2 contracts
 */

'use client'

import { useState, useCallback } from 'react'
import { type Address } from 'viem'

export interface PaymentModalConfig {
  contentId: bigint
  creator: Address
  title?: string
  description?: string
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

export function useV2PaymentModal(config: PaymentModalConfig) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleSuccess = useCallback((txHash: string) => {
    config.onSuccess?.(txHash)
  }, [config])

  const handleError = useCallback((error: Error) => {
    config.onError?.(error)
  }, [config])

  return {
    isOpen,
    openModal,
    closeModal,
    modalProps: {
      isOpen,
      onClose: closeModal,
      contentId: config.contentId,
      creator: config.creator,
      title: config.title,
      description: config.description,
      onSuccess: handleSuccess,
      onError: handleError
    }
  }
}