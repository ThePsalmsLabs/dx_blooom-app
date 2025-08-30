'use client'

import React, { useEffect, useCallback } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Modal title */
  title?: string
  /** Modal description/subtitle */
  description?: string
  /** Modal content */
  children: React.ReactNode
  /** Modal footer content (buttons, etc.) */
  footer?: React.ReactNode
  /** Maximum width for the modal */
  maxWidth?: string
  /** Custom className for the modal container */
  className?: string
  /** Custom className for the modal content */
  contentClassName?: string
  /** Whether to show mobile bottom sheet style on mobile */
  mobileBottomSheet?: boolean
  /** Whether modal can be closed by clicking overlay */
  closeOnOverlayClick?: boolean
  /** Whether modal can be closed by pressing Escape */
  closeOnEscape?: boolean
  /** Custom z-index */
  zIndex?: number
}

/**
 * Custom Modal Component
 *
 * A reusable modal component that provides consistent styling and behavior
 * across the application. Supports both desktop centered modal and mobile
 * bottom sheet styles.
 */
export function CustomModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'sm:max-w-md',
  className,
  contentClassName,
  mobileBottomSheet = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  zIndex = 50
}: CustomModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeOnEscape, isOpen, onClose])

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose()
    }
  }, [closeOnOverlayClick, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          "dark:bg-black/70"
        )}
        style={{ zIndex }}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center p-4",
          mobileBottomSheet && "md:items-center md:justify-center",
          !mobileBottomSheet && "items-center justify-center",
          mobileBottomSheet && "md:p-4",
          !mobileBottomSheet && "p-4"
        )}
        style={{ zIndex: zIndex + 1 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
      >
        {/* Modal Content */}
        <div
          className={cn(
            // Base styles
            "relative bg-background border border-border shadow-xl transition-all duration-200",
            "max-h-[90vh] overflow-hidden",

            // Desktop styles
            "md:max-w-md md:rounded-lg",

            // Mobile styles (bottom sheet)
            mobileBottomSheet && [
              "w-full max-w-none rounded-t-2xl md:rounded-lg",
              "mt-auto md:mt-0",
              "max-h-[85vh] md:max-h-[90vh]"
            ],

            // Custom width
            maxWidth,

            // Custom className
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          {mobileBottomSheet && (
            <div className="flex justify-center pt-3 pb-2 md:hidden">
              <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
            </div>
          )}

          {/* Header */}
          {(title || description) && (
            <div className={cn(
              "flex items-start justify-between p-4 md:p-6 pb-2 md:pb-4",
              !title && !description && "hidden"
            )}>
              <div className="flex-1 pr-4">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-foreground"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-muted-foreground"
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className={cn(
                  "flex-shrink-0 rounded-full p-2 text-muted-foreground",
                  "hover:bg-muted hover:text-foreground",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            "px-4 md:px-6",
            "pb-4 md:pb-6",
            contentClassName
          )}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={cn(
              "flex-shrink-0 px-4 md:px-6 py-4 md:py-6",
              "border-t border-border bg-muted/30"
            )}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/**
 * CustomModal.Header - Convenience component for modal headers
 */
CustomModal.Header = function ModalHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between p-4 md:p-6 pb-2 md:pb-4", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * CustomModal.Title - Convenience component for modal titles
 */
CustomModal.Title = function ModalTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </h2>
  )
}

/**
 * CustomModal.Description - Convenience component for modal descriptions
 */
CustomModal.Description = function ModalDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}

/**
 * CustomModal.Content - Convenience component for modal content
 */
CustomModal.Content = function ModalContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * CustomModal.Footer - Convenience component for modal footers
 */
CustomModal.Footer = function ModalFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-shrink-0 px-4 md:px-6 py-4 md:py-6 border-t border-border bg-muted/30", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * CustomModal.CloseButton - Convenience component for close buttons
 */
CustomModal.CloseButton = function ModalCloseButton({
  onClick,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 rounded-full p-2 text-muted-foreground",
        "hover:bg-muted hover:text-foreground",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      aria-label="Close modal"
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
}

export default CustomModal
