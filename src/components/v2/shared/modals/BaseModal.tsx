'use client'

/**
 * BaseModal.tsx - Core Modal Component (V2PaymentModal Style)
 * 
 * Provides the foundational modal system that mimics V2PaymentModal's
 * architecture. No Dialog components - pure custom implementation.
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModalOptions } from './ModalProvider'

interface BaseModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  options?: ModalOptions
  className?: string
  headerContent?: React.ReactNode
  footerContent?: React.ReactNode
  showCloseButton?: boolean
}

// Animation variants for different modal types
const getModalAnimation = (animation: string) => {
  switch (animation) {
    case 'scale':
      return {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 }
      }
    case 'slide':
      return {
        initial: { opacity: 0, y: 50 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 50 },
        transition: { duration: 0.2 }
      }
    case 'fade':
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 }
      }
  }
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

export function BaseModal({
  children,
  isOpen,
  onClose,
  options = {},
  className,
  headerContent,
  footerContent,
  showCloseButton = true
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Default options
  const {
    backdrop = 'blur',
    dismissible = true,
    size = 'standard',
    position = 'center',
    animation = 'scale',
    persistent = false
  } = options

  // Handle mounting for client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, dismissible, onClose])

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && dismissible && !persistent) {
      onClose()
    }
  }

  // Handle swipe gestures on mobile
  const handleTouchStart = useRef<{ x: number; y: number } | null>(null)
  const handleTouchEnd = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    handleTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!handleTouchStart.current) return

    handleTouchEnd.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    }

    const deltaY = handleTouchStart.current.y - handleTouchEnd.current.y
    const deltaX = handleTouchStart.current.x - handleTouchEnd.current.x

    // Swipe down to close
    if (deltaY < -100 && Math.abs(deltaX) < 50 && dismissible) {
      onClose()
    }
  }

  // Get backdrop styles
  const getBackdropStyles = () => {
    switch (backdrop) {
      case 'blur':
        return 'bg-black/50 backdrop-blur-sm'
      case 'dark':
        return 'bg-black/70'
      case 'transparent':
        return 'bg-transparent'
      default:
        return 'bg-black/50 backdrop-blur-sm'
    }
  }

  // Get modal size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'compact':
        return 'max-w-md'
      case 'standard':
        return 'max-w-lg'
      case 'large':
        return 'max-w-2xl'
      case 'fullscreen':
        return 'w-full h-full max-w-none max-h-none rounded-none'
      default:
        return 'max-w-lg'
    }
  }

  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'items-start pt-20'
      case 'bottom':
        return 'items-end pb-20'
      case 'center':
      default:
        return 'items-center'
    }
  }

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            className={cn(
              'absolute inset-0',
              getBackdropStyles()
            )}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
          />

          {/* Modal Container */}
          <div 
            className={cn(
              'relative flex min-h-full w-full',
              getPositionStyles()
            )}
            onClick={handleBackdropClick}
          >
            {/* Modal */}
            <motion.div
              ref={modalRef}
              className={cn(
                'relative mx-auto w-full bg-white rounded-xl shadow-2xl',
                'border border-gray-200',
                'max-h-[90vh] overflow-hidden',
                getSizeStyles(),
                size !== 'fullscreen' && 'm-4',
                className
              )}
              {...getModalAnimation(animation)}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* Header */}
              {(headerContent || showCloseButton) && (
                <div className="relative flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex-1">
                    {headerContent}
                  </div>
                  
                  {showCloseButton && dismissible && (
                    <button
                      onClick={onClose}
                      className={cn(
                        'absolute top-4 right-4 p-2 rounded-lg',
                        'text-gray-400 hover:text-gray-600',
                        'hover:bg-gray-100 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {footerContent && (
                <div className="border-t border-gray-200 p-6">
                  {footerContent}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Modal variants for different use cases
export function StandardModal(props: Omit<BaseModalProps, 'options'> & { options?: Partial<ModalOptions> }) {
  return (
    <BaseModal
      {...props}
      options={{
        size: 'standard',
        backdrop: 'blur',
        animation: 'scale',
        position: 'center',
        dismissible: true,
        ...props.options
      }}
    />
  )
}

export function CompactModal(props: Omit<BaseModalProps, 'options'> & { options?: Partial<ModalOptions> }) {
  return (
    <BaseModal
      {...props}
      options={{
        size: 'compact',
        backdrop: 'blur',
        animation: 'scale',
        position: 'center',
        dismissible: true,
        ...props.options
      }}
    />
  )
}

export function LargeModal(props: Omit<BaseModalProps, 'options'> & { options?: Partial<ModalOptions> }) {
  return (
    <BaseModal
      {...props}
      options={{
        size: 'large',
        backdrop: 'blur',
        animation: 'scale',
        position: 'center',
        dismissible: true,
        ...props.options
      }}
    />
  )
}

export function FullscreenModal(props: Omit<BaseModalProps, 'options'> & { options?: Partial<ModalOptions> }) {
  return (
    <BaseModal
      {...props}
      options={{
        size: 'fullscreen',
        backdrop: 'dark',
        animation: 'fade',
        position: 'center',
        dismissible: true,
        ...props.options
      }}
    />
  )
}

export function SlideModal(props: Omit<BaseModalProps, 'options'> & { options?: Partial<ModalOptions> }) {
  return (
    <BaseModal
      {...props}
      options={{
        size: 'standard',
        backdrop: 'blur',
        animation: 'slide',
        position: 'bottom',
        dismissible: true,
        ...props.options
      }}
    />
  )
}