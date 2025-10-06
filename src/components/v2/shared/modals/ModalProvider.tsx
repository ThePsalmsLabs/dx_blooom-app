'use client'

/**
 * ModalProvider.tsx - Modal Context Management System
 * 
 * Provides centralized modal state management for the V2 system.
 * Handles modal stacking, backdrop management, and global modal state.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'

interface ModalState {
  id: string
  component: React.ComponentType<any>
  props: any
  options: ModalOptions
}

interface ModalOptions {
  backdrop?: 'blur' | 'dark' | 'transparent'
  dismissible?: boolean
  size?: 'compact' | 'standard' | 'large' | 'fullscreen'
  position?: 'center' | 'top' | 'bottom'
  animation?: 'scale' | 'slide' | 'fade'
  persistent?: boolean
  zIndex?: number
}

interface ModalContextType {
  modals: ModalState[]
  openModal: (component: React.ComponentType<any>, props?: any, options?: ModalOptions) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
  updateModal: (id: string, props: any) => void
  isModalOpen: (id?: string) => boolean
  getActiveModalCount: () => number
}

const ModalContext = createContext<ModalContextType | null>(null)

export function useModalContext() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider')
  }
  return context
}

interface ModalProviderProps {
  children: React.ReactNode
  maxModals?: number
}

export function ModalProvider({ children, maxModals = 5 }: ModalProviderProps) {
  const [modals, setModals] = useState<ModalState[]>([])
  const modalIdCounter = useRef(0)

  // Generate unique modal ID
  const generateModalId = useCallback(() => {
    modalIdCounter.current += 1
    return `modal-${modalIdCounter.current}-${Date.now()}`
  }, [])

  // Open a new modal
  const openModal = useCallback((
    component: React.ComponentType<any>,
    props: any = {},
    options: ModalOptions = {}
  ): string => {
    const id = generateModalId()
    
    // Default options
    const defaultOptions: ModalOptions = {
      backdrop: 'blur',
      dismissible: true,
      size: 'standard',
      position: 'center',
      animation: 'scale',
      persistent: false,
      zIndex: 1000
    }

    const modalState: ModalState = {
      id,
      component,
      props: { ...props, modalId: id },
      options: { ...defaultOptions, ...options }
    }

    setModals(prev => {
      // Enforce max modals limit
      if (prev.length >= maxModals) {
        console.warn(`Maximum modal limit (${maxModals}) reached. Closing oldest modal.`)
        return [...prev.slice(1), modalState]
      }
      return [...prev, modalState]
    })

    return id
  }, [generateModalId, maxModals])

  // Close specific modal
  const closeModal = useCallback((id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id))
  }, [])

  // Close all modals
  const closeAllModals = useCallback(() => {
    setModals([])
  }, [])

  // Update modal props
  const updateModal = useCallback((id: string, newProps: any) => {
    setModals(prev => prev.map(modal => 
      modal.id === id 
        ? { ...modal, props: { ...modal.props, ...newProps } }
        : modal
    ))
  }, [])

  // Check if any modal is open
  const isModalOpen = useCallback((id?: string) => {
    if (id) {
      return modals.some(modal => modal.id === id)
    }
    return modals.length > 0
  }, [modals])

  // Get active modal count
  const getActiveModalCount = useCallback(() => modals.length, [modals])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modals.length > 0) {
        const topModal = modals[modals.length - 1]
        if (topModal.options.dismissible !== false) {
          closeModal(topModal.id)
        }
      }
    }

    if (modals.length > 0) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modals are open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (modals.length === 0) {
        document.body.style.overflow = 'unset'
      }
    }
  }, [modals, closeModal])

  const value: ModalContextType = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    updateModal,
    isModalOpen,
    getActiveModalCount
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
      
      {/* Render all active modals */}
      <AnimatePresence mode="wait">
        {modals.map((modal, index) => {
          const ModalComponent = modal.component
          const zIndex = (modal.options.zIndex || 1000) + index
          
          return (
            <div
              key={modal.id}
              style={{ zIndex }}
              className="fixed inset-0"
            >
              <ModalComponent
                {...modal.props}
                modalOptions={modal.options}
                onClose={() => closeModal(modal.id)}
              />
            </div>
          )
        })}
      </AnimatePresence>
    </ModalContext.Provider>
  )
}

// Export types for external use
export type { ModalOptions, ModalState, ModalContextType }