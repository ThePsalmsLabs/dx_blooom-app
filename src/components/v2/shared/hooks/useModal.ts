'use client'

/**
 * useModal.ts - Modal Management Hook
 * 
 * Provides an easy-to-use interface for modal operations.
 * Handles modal state, animations, and lifecycle management.
 */

import { useCallback, useRef } from 'react'
import { useModalContext, type ModalOptions } from '../modals/ModalProvider'
import { ConfirmationModal, NotificationModal } from '../modals/ModalComponents'

interface UseModalReturn {
  // Modal operations
  open: (component: React.ComponentType<unknown>, props?: unknown, options?: ModalOptions) => string
  close: (id: string) => void
  closeAll: () => void
  update: (id: string, props: unknown) => void
  
  // Modal state
  isOpen: (id?: string) => boolean
  activeCount: number
  
  // Convenience methods
  openConfirmation: (config: ConfirmationConfig) => Promise<boolean>
  openNotification: (config: NotificationConfig) => string
  openForm: (config: FormConfig) => Promise<unknown>
}

interface ConfirmationConfig {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface NotificationConfig {
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'primary' | 'secondary'
  }>
}

interface FormConfig {
  title: string
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'number'
    placeholder?: string
    required?: boolean
    options?: Array<{ label: string; value: string }>
    validation?: (value: unknown) => string | null
  }>
  submitText?: string
  cancelText?: string
  onSubmit?: (data: unknown) => void | Promise<void>
  onCancel?: () => void
}

export function useModal(): UseModalReturn {
  const modalContext = useModalContext()
  const promiseResolvers = useRef<Map<string, { resolve: (value: unknown) => void; reject: (error: unknown) => void }>>(new Map())

  // Basic modal operations
  const open = useCallback((
    component: React.ComponentType<unknown>,
    props: unknown = {},
    options: ModalOptions = {}
  ) => {
    return modalContext.openModal(component, props, options)
  }, [modalContext])

  const close = useCallback((id: string) => {
    // Resolve any pending promises
    const resolver = promiseResolvers.current.get(id)
    if (resolver) {
      resolver.resolve(false) // Default to false/cancelled
      promiseResolvers.current.delete(id)
    }
    modalContext.closeModal(id)
  }, [modalContext])

  const closeAll = useCallback(() => {
    // Resolve all pending promises
    promiseResolvers.current.forEach(resolver => {
      resolver.resolve(false)
    })
    promiseResolvers.current.clear()
    modalContext.closeAllModals()
  }, [modalContext])

  const update = useCallback((id: string, props: unknown) => {
    modalContext.updateModal(id, props)
  }, [modalContext])

  const isOpen = useCallback((id?: string) => {
    return modalContext.isModalOpen(id)
  }, [modalContext])

  const activeCount = modalContext.getActiveModalCount()

  // Convenience methods
  const openConfirmation = useCallback((config: ConfirmationConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      const modalId = modalContext.openModal(ConfirmationModal, {
        title: config.title,
        message: config.message,
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        variant: config.variant || 'info',
        onConfirm: () => {
          config.onConfirm?.()
          resolve(true)
        },
        onCancel: () => {
          config.onCancel?.()
          resolve(false)
        }
      }, {
        dismissible: true,
        size: 'compact',
        backdrop: 'blur'
      })

      promiseResolvers.current.set(modalId, { 
        resolve: resolve as (value: unknown) => void, 
        reject: () => resolve(false) 
      })
    })
  }, [modalContext])

  const openNotification = useCallback((config: NotificationConfig): string => {
    return modalContext.openModal(NotificationModal, {
      title: config.title,
      message: config.message,
      type: config.type,
      duration: config.duration,
      actions: config.actions
    }, {
      dismissible: true,
      size: 'compact',
      position: 'top',
      backdrop: 'transparent'
    })
  }, [modalContext])

  const openForm = useCallback((config: FormConfig): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      // Form modal implementation would go here
      // For now, return a simple prompt-like interface
      const result = window.prompt(`${config.title}\n\nThis is a simplified form. In production, this would be a full form modal.`)
      if (result !== null) {
        resolve({ data: result })
      } else {
        reject(new Error('Form cancelled'))
      }
    })
  }, [])

  return {
    open,
    close,
    closeAll,
    update,
    isOpen,
    activeCount,
    openConfirmation,
    openNotification,
    openForm
  }
}

// Export convenience hook for confirmation dialogs
export function useConfirmation() {
  const { openConfirmation } = useModal()
  return openConfirmation
}

// Export convenience hook for notifications
export function useNotification() {
  const { openNotification } = useModal()
  return openNotification
}