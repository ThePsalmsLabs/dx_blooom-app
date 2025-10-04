'use client'

/**
 * ModalComponents.tsx - Built-in Modal Components
 * 
 * Ready-to-use modal components for common use cases
 */

import React, { useEffect } from 'react'

// Confirmation Modal Component
export const ConfirmationModal = ({ title, message, confirmText, cancelText, variant, onConfirm, onCancel, onClose }: {
  title: string
  message: string
  confirmText: string
  cancelText: string
  variant: string
  onConfirm: () => void
  onCancel: () => void
  onClose: () => void
}) => {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleCancel = () => {
    onCancel()
    onClose()
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      default:
        return 'bg-gray-900 hover:bg-gray-800 text-white'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className={`relative max-w-md w-full mx-4 rounded-xl border p-6 shadow-2xl ${getVariantStyles()}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${getButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Notification Modal Component
export const NotificationModal = ({ title, message, type, duration = 5000, actions, onClose }: {
  title: string
  message: string
  type: string
  duration?: number
  actions?: Array<{ label: string; action: () => void; variant?: string }>
  onClose: () => void
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800'
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800'
      default:
        return 'border-gray-200 bg-white text-gray-800'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`max-w-sm w-full rounded-xl border p-4 shadow-lg ${getTypeStyles()}`}>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm opacity-90 mb-3">{message}</p>
        
        {actions && actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action()
                  onClose()
                }}
                className="px-3 py-1 text-xs rounded-md bg-white/20 hover:bg-white/30 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-xs opacity-50 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}